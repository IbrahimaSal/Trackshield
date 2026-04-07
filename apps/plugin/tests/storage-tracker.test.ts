import { describe, it, expect, beforeEach } from 'vitest'
import { StorageTracker } from '../src/background/storage-tracker.js'

describe('StorageTracker — stockage des valeurs', () => {
  let tracker: StorageTracker

  beforeEach(() => {
    tracker = new StorageTracker()
  })

  it('ignore les valeurs de moins de 8 caractères', () => {
    tracker.addValues({ short: 'abc123' })
    const matches = tracker.findInRequest('https://example.com?x=abc123')
    expect(matches).toHaveLength(0)
  })

  it('stocke les valeurs de 8 caractères ou plus', () => {
    tracker.addValues({ token: 'abcdefgh' })
    const matches = tracker.findInRequest('https://example.com?t=abcdefgh')
    expect(matches).toHaveLength(1)
  })

  it('stocke les valeurs de plus de 8 caractères', () => {
    tracker.addValues({ email: 'test@example.com' })
    const matches = tracker.findInRequest('https://pixel.com?em=test@example.com')
    expect(matches).toHaveLength(1)
  })

  it('ignore les clés dont la valeur est vide', () => {
    tracker.addValues({ key: '' })
    const matches = tracker.findInRequest('https://example.com')
    expect(matches).toHaveLength(0)
  })
})

describe('StorageTracker — détection dans les requêtes', () => {
  let tracker: StorageTracker

  beforeEach(() => {
    tracker = new StorageTracker()
  })

  it('détecte une valeur stockée dans une URL', () => {
    tracker.addValues({ userId: 'user-12345678' })
    const matches = tracker.findInRequest('https://tracker.com?uid=user-12345678')
    expect(matches).toHaveLength(1)
    const match = matches[0]!
    expect(match.key).toBe('userId')
    expect(match.value).toBe('user-12345678')
  })

  it('détecte une valeur stockée dans un body POST (JSON)', () => {
    tracker.addValues({ fbclid: 'AZXabcdefgh1234' })
    const body = JSON.stringify({ click_id: 'AZXabcdefgh1234' })
    const matches = tracker.findInRequest('https://tracker.com/event', body)
    expect(matches).toHaveLength(1)
  })

  it("retourne un tableau vide quand aucune valeur n'est présente dans la requête", () => {
    tracker.addValues({ token: 'abcdefgh' })
    const matches = tracker.findInRequest('https://example.com?q=nothing')
    expect(matches).toHaveLength(0)
  })

  it('détecte plusieurs valeurs stockées dans la même requête', () => {
    tracker.addValues({ email: 'user@example.com', phone: '+33612345678' })
    const matches = tracker.findInRequest('https://t.com?em=user@example.com&ph=+33612345678')
    expect(matches).toHaveLength(2)
  })

  it('ne double-détecte pas une même valeur si elle apparaît deux fois', () => {
    tracker.addValues({ id: 'abcdefgh12' })
    const matches = tracker.findInRequest('https://t.com?a=abcdefgh12&b=abcdefgh12')
    expect(matches).toHaveLength(1)
  })
})

describe('StorageTracker — masquage', () => {
  it('masque en gardant les 4 premiers caractères puis ••••', () => {
    expect(StorageTracker.mask('abcdefghij')).toBe('abcd••••')
  })

  it('masque correctement une adresse email', () => {
    expect(StorageTracker.mask('user@example.com')).toBe('user••••')
  })

  it('masque correctement un token long', () => {
    expect(StorageTracker.mask('tok_live_XXXXXXXXXXX')).toBe('tok_••••')
  })
})

describe('StorageTracker — clear', () => {
  it('vide toutes les valeurs stockées', () => {
    const tracker = new StorageTracker()
    tracker.addValues({ token: 'abcdefgh1234' })
    tracker.clear()
    const matches = tracker.findInRequest('https://example.com?t=abcdefgh1234')
    expect(matches).toHaveLength(0)
  })
})
