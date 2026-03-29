import type { PiiDetection, PiiType } from '@trackshield/shared-types'

const PII_PATTERNS: Record<PiiType, RegExp> = {
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  TEL: /(?:\+33|0033|0)[1-9](?:[0-9]{8}|\s[0-9]{2}(?:\s[0-9]{2}){3})/g,
  COMPORTEMENT: /(?:pageview|session_id|_ga|_gid)=[^&\s]+/g,
  ID_PUB: /(?:_fbp|gclid|fbclid|_pinterest_ct_ua)=[^&\s]+/g,
  DEVICE: /(?:canvas|webgl|timezone|resolution)=[^&\s]+/g,
  LOC: /(?:lat|lng|latitude|longitude)=[-\d.]+/g,
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

export class PiiDetector {
  scan(url: string, body?: string): PiiDetection[] {
    const target = url + (body ?? '')
    const destination = extractDomain(url)
    const detections: PiiDetection[] = []

    for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
      const regex = new RegExp(pattern.source, pattern.flags)
      let match: RegExpExecArray | null
      while ((match = regex.exec(target)) !== null) {
        detections.push({
          type: type as PiiType,
          maskedValue: mask(match[0], type as PiiType),
          destination,
          timestamp: Date.now(),
        })
      }
    }

    return detections
  }
}
