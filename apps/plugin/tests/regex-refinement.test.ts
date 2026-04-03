import { describe, it, expect } from 'vitest'
import { PiiDetector } from '../src/background/pii-detector.js'

const detector = new PiiDetector()

// ─── TEL — Regex resserrée ─────────────────────────────────────────────────

describe('PiiDetector — TEL SHOULD_DETECT', () => {
  it("detecte un numero mobile francais 06", () => {
    const results = detector.scan('https://example.com?phone=0612345678')
    expect(results.some((r) => r.type === 'TEL')).toBe(true)
  })

  it("detecte un numero mobile francais 07", () => {
    const results = detector.scan('https://example.com?tel=0712345678')
    expect(results.some((r) => r.type === 'TEL')).toBe(true)
  })

  it("detecte un numero +33 encode", () => {
    const results = detector.scan('https://example.com?phone=%2B33612345678')
    expect(results.some((r) => r.type === 'TEL')).toBe(true)
  })
})

describe('PiiDetector — TEL SHOULD_NOT_DETECT (faux positifs)', () => {
  it("ne detecte pas un ID media Twitter commencant par 03", () => {
    const results = detector.scan('https://video.twimg.com/amplify_video/0397123446870/vid/video.mp4')
    expect(results.filter((r) => r.type === 'TEL')).toHaveLength(0)
  })

  it("ne detecte pas un ID RTB commencant par 02", () => {
    const results = detector.scan('https://api.btloader.com/bid?id=0260123460100')
    expect(results.filter((r) => r.type === 'TEL')).toHaveLength(0)
  })

  it("ne detecte pas un timestamp Unix 10 chiffres", () => {
    const results = detector.scan('https://example.com?ts=1617000000')
    expect(results.filter((r) => r.type === 'TEL')).toHaveLength(0)
  })

  it("ne detecte pas un ID publicitaire commencant par 09", () => {
    const results = detector.scan('https://api.btloader.com?pub=0977689012')
    expect(results.filter((r) => r.type === 'TEL')).toHaveLength(0)
  })

  it("ne detecte pas une sequence de 10 chiffres dans un path", () => {
    const results = detector.scan('https://video.twimg.com/0977689012/video.mp4')
    expect(results.filter((r) => r.type === 'TEL')).toHaveLength(0)
  })

  it("ne detecte pas un ID commencant par 08 (surtaxe, hors mobile)", () => {
    const results = detector.scan('https://example.com?ref=0881287600')
    expect(results.filter((r) => r.type === 'TEL')).toHaveLength(0)
  })
})

// ─── LOC — Coordonnées GPS réalistes ──────────────────────────────────────

describe('PiiDetector — LOC SHOULD_DETECT', () => {
  it("detecte des coordonnees GPS Paris valides", () => {
    const results = detector.scan('https://maps.example.com?lat=48.8566&lng=2.3522')
    expect(results.some((r) => r.type === 'LOC')).toBe(true)
  })

  it("detecte des coordonnees GPS negatives valides", () => {
    const results = detector.scan('https://api.example.com?lat=-33.8688&lng=151.2093')
    expect(results.some((r) => r.type === 'LOC')).toBe(true)
  })
})

describe('PiiDetector — LOC SHOULD_NOT_DETECT', () => {
  it("ne detecte pas une latitude hors range (> 90)", () => {
    const results = detector.scan('https://example.com?lat=999.999&lng=2.0')
    expect(results.filter((r) => r.type === 'LOC')).toHaveLength(0)
  })

  it("ne detecte pas une longitude hors range (> 180)", () => {
    const results = detector.scan('https://example.com?lat=48.0&longitude=999.0')
    expect(results.filter((r) => r.type === 'LOC')).toHaveLength(0)
  })

  it("ne detecte pas lat=0 et lon=0 (valeur par defaut, non significative)", () => {
    const results = detector.scan('https://example.com?lat=0&lng=0')
    expect(results.filter((r) => r.type === 'LOC')).toHaveLength(0)
  })
})

// ─── ID_PUB regex — doit matcher UUID-like uniquement ────────────────────

describe('PiiDetector — ID_PUB SHOULD_NOT_DETECT (sequences arbitraires)', () => {
  it("ne detecte pas une sequence numerique 10 chiffres comme ID_PUB", () => {
    const results = detector.scan('https://example.com?pub_id=0977689012')
    expect(results.filter((r) => r.type === 'ID_PUB')).toHaveLength(0)
  })

  it("ne detecte pas un ID de bid request comme ID_PUB", () => {
    const results = detector.scan('https://api.btloader.com/bid?auction=0260123460100')
    expect(results.filter((r) => r.type === 'ID_PUB')).toHaveLength(0)
  })
})
