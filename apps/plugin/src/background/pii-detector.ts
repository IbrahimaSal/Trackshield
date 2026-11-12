import type { PiiDetection, PiiType } from '@trackshield/shared-types'
import { KNOWN_PARAMS } from './known-params.js'
import { KNOWN_COOKIES } from './known-cookies.js'

const PII_CONTEXT: Partial<Record<PiiType, { label: string; description: string }>> = {
  EMAIL: {
    label: 'Votre adresse e-mail',
    description: "Permet de vous identifier sur d'autres sites et applis, même sans compte. Vous pourrez recevoir des publicités ciblées liées à cette visite.",
  },
  TEL: {
    label: 'Votre numéro de téléphone',
    description: 'Peut être utilisé pour vous contacter par SMS promotionnel ou vous cibler sur WhatsApp et Instagram.',
  },
  LOC: {
    label: 'Votre localisation',
    description: 'Votre position géographique est transmise. Elle peut servir à personnaliser les publicités selon votre ville ou quartier.',
  },
}

// Regex heuristiques — utilisées uniquement si aucun paramètre connu ne match
const PII_PATTERNS: Record<PiiType, RegExp> = {
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,

  // TEL : uniquement mobiles français (06/07) ou +33 6/7 — exclut 01-05/08/09
  // Doit être précédé d'un séparateur (=, &, espace, début) pour éviter les paths
  TEL: /(?<=[=&\s?]|^)(?:(?:\+33|0033)\s?[67](?:\s?\d{2}){4}|0[67]\d{8})(?=[&\s#]|$)/g,

  COMPORTEMENT: /(?:pageview|session_id)=[^&\s]+/g,

  // ID_PUB regex : uniquement les paramètres non couverts par KNOWN_PARAMS (ex: pinterest)
  ID_PUB: /(?:_pinterest_ct_ua)=[^&\s]+/g,

  DEVICE: /(?:canvas|webgl|timezone|resolution)=[^&\s]+/g,

  // LOC : coordonnées GPS réalistes — lat ∈ [-90,90], lon ∈ [-180,180], exclut 0,0
  // Format attendu : lat=XX.XXXX&... — nécessite un point décimal pour filtrer les entiers bruts
  LOC: /(?:lat|latitude)=(-?(?:[0-8]?\d(?:\.\d+)|90(?:\.0+)?))(?=[&\s]|$).*?(?:lng|lon|longitude)=(-?(?:1[0-7]\d(?:\.\d+)?|\d{1,2}(?:\.\d+)?|180(?:\.0+)?))(?=[&\s#]|$)/g,
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

function mask(value: string, type: PiiType): string {
  if (type === 'EMAIL') {
    const atIdx = value.indexOf('@')
    if (atIdx <= 2) return `${value[0]}••${value.slice(atIdx)}`
    return `${value.slice(0, 2)}••••${value.slice(atIdx)}`
  }
  if (type === 'TEL') {
    return `${value.slice(0, 4)}••••${value.slice(-4)}`
  }
  return `${value.slice(0, 4)}••••`
}

function maskParamValue(value: string): string {
  if (value.length <= 4) return '••••'
  return `${value.slice(0, 4)}••••`
}

export class PiiDetector {
  scan(url: string, body?: string, knownValues?: Set<string>): PiiDetection[] {
    const destination = extractDomain(url)
    const detections: PiiDetection[] = []

    // ─── 1. Paramètres URL connus (certainty: high) — prioritaires ───────────
    try {
      const parsed = new URL(url)
      for (const [paramName, entry] of Object.entries(KNOWN_PARAMS)) {
        const value = parsed.searchParams.get(paramName)
        if (value !== null) {
          detections.push({
            type: entry.type,
            maskedValue: maskParamValue(value),
            destination,
            timestamp: Date.now(),
            certainty: 'high',
            source: 'url',
            label: entry.label,
            description: entry.description,
          })
        }
      }
    } catch {
      // URL malformée → skip la phase paramètres connus
    }

    // ─── 2. Regex heuristiques — avec élévation si valeur connue ─────────────
    let decodedUrl = url
    try { decodedUrl = decodeURIComponent(url) } catch { /* keep raw */ }
    const target = decodedUrl + (body ?? '')
    for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
      const regex = new RegExp(pattern.source, pattern.flags)
      let match: RegExpExecArray | null
      while ((match = regex.exec(target)) !== null) {
        const rawValue = match[0]
        const isKnown = knownValues !== undefined && knownValues.size > 0 &&
          [...knownValues].some((v) => rawValue.includes(v) || v.includes(rawValue))
        const ctx = PII_CONTEXT[type as PiiType]
        detections.push({
          type: type as PiiType,
          maskedValue: mask(rawValue, type as PiiType),
          destination,
          timestamp: Date.now(),
          ...(isKnown ? { certainty: 'high' as const, source: 'form' as const } : {}),
          ...(ctx ? { label: ctx.label, description: ctx.description } : {}),
        })
      }
    }

    return detections
  }

  scanHeaders(
    headers: chrome.webRequest.HttpHeader[],
    destination: string,
  ): PiiDetection[] {
    const detections: PiiDetection[] = []

    const cookieHeader = headers.find(h => h.name.toLowerCase() === 'cookie')
    if (!cookieHeader?.value) return detections

    for (const pair of cookieHeader.value.split(';')) {
      const eqIdx = pair.indexOf('=')
      if (eqIdx === -1) continue
      const name = pair.slice(0, eqIdx).trim()
      const value = pair.slice(eqIdx + 1).trim()
      const entry = KNOWN_COOKIES[name]
      if (!entry) continue

      detections.push({
        type: entry.type,
        maskedValue: maskParamValue(value),
        destination,
        timestamp: Date.now(),
        certainty: 'high',
        source: 'cookie',
        label: entry.label,
        description: entry.description,
      })
    }

    return detections
  }
}
