import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { TrackerMatcher } from '../matcher.js'
import type { TrackerList } from '../types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../../data')

function loadList(name: string): TrackerList {
  return JSON.parse(readFileSync(join(DATA_DIR, `${name}.json`), 'utf-8')) as TrackerList
}

// ─── Tests unitaires — algorithme de matching (stub data) ────────────────────

const STUB_LIST: TrackerList = {
  name: 'test',
  version: '1.0',
  domains: {
    'google-analytics.com': 'analytics',
    'doubleclick.net': 'advertising',
    'pixel.facebook.com': 'social',
  },
}

describe('TrackerMatcher — algorithme (stub data)', () => {
  const matcher = new TrackerMatcher([STUB_LIST])

  it("retourne null si l'URL ne correspond à aucun tracker", () => {
    expect(matcher.match('https://example.com/page')).toBeNull()
  })

  it("retourne un match pour un domaine tracker connu", () => {
    const result = matcher.match('https://www.google-analytics.com/collect')
    expect(result).not.toBeNull()
    expect(result?.category).toBe('analytics')
    expect(result?.domain).toBe('www.google-analytics.com')
  })

  it("retourne un match pour un sous-domaine d'un tracker connu", () => {
    const result = matcher.match('https://stats.doubleclick.net/r/collect')
    expect(result).not.toBeNull()
    expect(result?.category).toBe('advertising')
  })

  it("retourne null pour une URL malformée", () => {
    expect(matcher.match('pas-une-url')).toBeNull()
  })

  it("retourne le domaine complet de la requête (pas juste la liste)", () => {
    const result = matcher.match('https://pixel.facebook.com/tr?id=123')
    expect(result?.domain).toBe('pixel.facebook.com')
    expect(result?.category).toBe('social')
  })

  it("retourne requestCount = 1 pour chaque match", () => {
    const result = matcher.match('https://google-analytics.com/collect')
    expect(result?.requestCount).toBe(1)
  })
})

// ─── Tests d'intégration — données compilées ─────────────────────────────────
// Ces tests valident que le script compile-lists.ts a bien généré des données réelles.
// En phase RED : les JSON sont des placeholders → match retourne null.

describe('TrackerMatcher — données compilées (intégration)', () => {
  const lists = [loadList('easylist'), loadList('disconnect'), loadList('easyprivacy')]
  const matcher = new TrackerMatcher(lists)

  it("détecte google-analytics.com dans les listes compilées", () => {
    expect(matcher.match('https://www.google-analytics.com/collect')).not.toBeNull()
  })

  it("ne détecte pas example.com dans les listes compilées", () => {
    expect(matcher.match('https://example.com/page')).toBeNull()
  })

  it("les listes compilées contiennent des domaines (non vides)", () => {
    const totalDomains = lists.reduce((acc, l) => acc + Object.keys(l.domains).length, 0)
    expect(totalDomains).toBeGreaterThan(1000)
  })
})
