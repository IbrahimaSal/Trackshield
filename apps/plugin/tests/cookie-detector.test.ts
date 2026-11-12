import { describe, it, expect } from 'vitest'
import { PiiDetector } from '../src/background/pii-detector.js'

const detector = new PiiDetector()
const DEST = 'pixel.facebook.com'

function headers(cookieStr: string): chrome.webRequest.HttpHeader[] {
  return [{ name: 'Cookie', value: cookieStr }]
}

describe('PiiDetector.scanHeaders — cookies connus', () => {
  it("détecte _fbp (Facebook Pixel ID)", () => {
    const results = detector.scanHeaders(headers('_fbp=fb.1.123456789.987654321'), DEST)
    expect(results).toHaveLength(1)
    expect(results[0]!.certainty).toBe('high')
    expect(results[0]!.source).toBe('cookie')
    expect(results[0]!.label).toMatch(/facebook/i)
  })

  it("détecte _fbc (Facebook Click ID)", () => {
    const results = detector.scanHeaders(headers('_fbc=fb.1.123.AbCdEfGh'), DEST)
    expect(results).toHaveLength(1)
    expect(results[0]!.source).toBe('cookie')
  })

  it("détecte _ga (Google Analytics Client ID)", () => {
    const results = detector.scanHeaders(headers('_ga=GA1.2.123456789.987654321'), 'google-analytics.com')
    expect(results).toHaveLength(1)
    expect(results[0]!.label).toMatch(/google/i)
  })

  it("détecte _gid (Google Analytics Session ID)", () => {
    const results = detector.scanHeaders(headers('_gid=GA1.2.123456789.987654321'), 'google-analytics.com')
    expect(results).toHaveLength(1)
    expect(results[0]!.source).toBe('cookie')
  })

  it("détecte IDE (DoubleClick)", () => {
    const results = detector.scanHeaders(headers('IDE=AHWqTUmXHFx0abcdef123456'), 'doubleclick.net')
    expect(results).toHaveLength(1)
    expect(results[0]!.label).toMatch(/google|doubleclick/i)
  })

  it("détecte uuid2 (AppNexus/Xandr)", () => {
    const results = detector.scanHeaders(headers('uuid2=12345678901234567890'), 'ib.adnxs.com')
    expect(results).toHaveLength(1)
    expect(results[0]!.source).toBe('cookie')
  })

  it("détecte tt_webid (TikTok Pixel)", () => {
    const results = detector.scanHeaders(headers('tt_webid=1234567890123456789'), 'analytics.tiktok.com')
    expect(results).toHaveLength(1)
    expect(results[0]!.label).toMatch(/tiktok/i)
  })

  it("détecte _ttp (TikTok Click ID)", () => {
    const results = detector.scanHeaders(headers('_ttp=AbCdEfGhIjKlMnOpQrSt'), 'analytics.tiktok.com')
    expect(results).toHaveLength(1)
    expect(results[0]!.source).toBe('cookie')
  })

  it("détecte NID (Google preferences)", () => {
    const results = detector.scanHeaders(headers('NID=511=AbCdEfGhIjKlMnOpQrSt'), 'google.com')
    expect(results).toHaveLength(1)
    expect(results[0]!.label).toMatch(/google/i)
  })

  it("détecte DSID (DoubleClick Signed ID)", () => {
    const results = detector.scanHeaders(headers('DSID=AHWqTUmXHFx0abcdef123456'), 'doubleclick.net')
    expect(results).toHaveLength(1)
    expect(results[0]!.source).toBe('cookie')
  })

  it("détecte plusieurs cookies connus dans le même header", () => {
    const results = detector.scanHeaders(headers('_fbp=fb.1.123.456; _ga=GA1.2.123.456'), DEST)
    expect(results).toHaveLength(2)
  })
})

describe('PiiDetector.scanHeaders — cookies inconnus', () => {
  it("ne génère pas de détection pour un cookie inconnu", () => {
    const results = detector.scanHeaders(headers('session_id=abc123; csrf_token=xyz'), DEST)
    expect(results).toHaveLength(0)
  })

  it("ne génère pas de détection si aucun header Cookie", () => {
    const results = detector.scanHeaders([{ name: 'Content-Type', value: 'application/json' }], DEST)
    expect(results).toHaveLength(0)
  })

  it("ne génère pas de détection si headers vide", () => {
    const results = detector.scanHeaders([], DEST)
    expect(results).toHaveLength(0)
  })

  it("masque la valeur du cookie détecté", () => {
    const results = detector.scanHeaders(headers('_fbp=fb.1.123456789.987654321'), DEST)
    expect(results[0]!.maskedValue).toMatch(/••••/)
    expect(results[0]!.maskedValue).not.toContain('987654321')
  })
})
