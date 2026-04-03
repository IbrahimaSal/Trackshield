import { describe, it, expect } from 'vitest'
import { PiiDetector } from '../src/background/pii-detector.js'

const detector = new PiiDetector()

// ─── Regex de base ─────────────────────────────────────────────────────────

describe('PiiDetector — regex de base', () => {
  it("détecte un email dans une URL", () => {
    const results = detector.scan('https://pixel.facebook.com/track?email=john.doe@gmail.com')
    expect(results.some((r) => r.type === 'EMAIL')).toBe(true)
    const email = results.find((r) => r.type === 'EMAIL')!
    expect(email.maskedValue).toContain('••')
    expect(email.destination).toBe('pixel.facebook.com')
  })

  it("détecte un numéro de téléphone mobile français 06", () => {
    const results = detector.scan('https://example.com/api?phone=0612345678')
    expect(results.some((r) => r.type === 'TEL')).toBe(true)
  })

  it("masque correctement un email", () => {
    const results = detector.scan('https://example.com?email=test@example.com')
    const email = results.find((r) => r.type === 'EMAIL')!
    expect(email.maskedValue).not.toContain('test')
    expect(email.maskedValue).toContain('@example.com')
  })

  it("retourne un tableau vide pour une URL propre", () => {
    const results = detector.scan('https://wikipedia.org/wiki/Privacy')
    expect(results).toHaveLength(0)
  })

  it("détecte des coordonnées GPS valides", () => {
    const results = detector.scan('https://maps.example.com?lat=48.8566&lng=2.3522')
    expect(results.some((r) => r.type === 'LOC')).toBe(true)
  })
})

// ─── KNOWN_PARAMS — certitude high ─────────────────────────────────────────

describe('PiiDetector — paramètres URL connus (certainty: high)', () => {
  it("détecte fbclid avec certainty high et source url", () => {
    const results = detector.scan('https://example.com?fbclid=abc123def456')
    const pii = results.find((r) => r.label === 'Identifiant de clic Facebook')
    expect(pii).toBeDefined()
    expect(pii!.certainty).toBe('high')
    expect(pii!.source).toBe('url')
    expect(pii!.type).toBe('ID_PUB')
  })

  it("détecte gclid avec certainty high", () => {
    const results = detector.scan('https://example.com?gclid=CjwKCAiAtest')
    const pii = results.find((r) => r.label === 'Identifiant de clic Google Ads')
    expect(pii).toBeDefined()
    expect(pii!.certainty).toBe('high')
  })

  it("détecte _ga avec type COMPORTEMENT", () => {
    const results = detector.scan('https://example.com?_ga=2.123456789.0.0')
    const pii = results.find((r) => r.label === 'Identifiant visiteur Google Analytics')
    expect(pii).toBeDefined()
    expect(pii!.type).toBe('COMPORTEMENT')
  })

  it("détecte _gid avec type COMPORTEMENT", () => {
    const results = detector.scan('https://example.com?_gid=GA1.2.test')
    const pii = results.find((r) => r.label === 'Identifiant de session Google Analytics')
    expect(pii).toBeDefined()
    expect(pii!.type).toBe('COMPORTEMENT')
  })

  it("détecte utm_source avec type COMPORTEMENT", () => {
    const results = detector.scan('https://example.com?utm_source=newsletter')
    const pii = results.find((r) => r.label?.includes('UTM'))
    expect(pii).toBeDefined()
    expect(pii!.type).toBe('COMPORTEMENT')
  })

  it("détecte ttclid (TikTok) avec type ID_PUB", () => {
    const results = detector.scan('https://example.com?ttclid=abc123')
    const pii = results.find((r) => r.label === 'Identifiant de clic TikTok')
    expect(pii).toBeDefined()
    expect(pii!.type).toBe('ID_PUB')
  })

  it("détecte msclkid (Microsoft Ads) avec type ID_PUB", () => {
    const results = detector.scan('https://example.com?msclkid=abc123')
    const pii = results.find((r) => r.label === 'Identifiant de clic Microsoft Ads')
    expect(pii).toBeDefined()
    expect(pii!.type).toBe('ID_PUB')
  })

  it("masque la valeur avec 4 chars + ••••", () => {
    const results = detector.scan('https://example.com?fbclid=abc123def456')
    const pii = results.find((r) => r.label === 'Identifiant de clic Facebook')!
    expect(pii.maskedValue).toMatch(/^.{4}••••$/)
  })

  it("retourne un label et une description humains lisibles", () => {
    const results = detector.scan('https://example.com?fbclid=abc123')
    const pii = results.find((r) => r.label === 'Identifiant de clic Facebook')!
    expect(pii.label).toBeTruthy()
    expect(pii.description).toBeTruthy()
  })

  it("ne duplique pas la détection fbclid via regex ID_PUB", () => {
    const results = detector.scan('https://example.com?fbclid=abc123')
    const viaRegex = results.filter((r) => r.type === 'ID_PUB' && !r.label)
    expect(viaRegex).toHaveLength(0)
  })
})

// ─── Élévation via knownValues (formulaire) ─────────────────────────────────

describe('PiiDetector — élévation certainty via knownValues', () => {
  it("élève certainty à high si l'email matche une valeur connue", () => {
    const known = new Set(['john@gmail.com'])
    const results = detector.scan('https://example.com?email=john@gmail.com', undefined, known)
    const email = results.find((r) => r.type === 'EMAIL')!
    expect(email.certainty).toBe('high')
    expect(email.source).toBe('form')
  })

  it("ne définit pas certainty si la valeur n'est pas connue", () => {
    const results = detector.scan('https://example.com?email=john@gmail.com')
    const email = results.find((r) => r.type === 'EMAIL')!
    expect(email.certainty).toBeUndefined()
  })

  it("détecte dans le body d'une requête POST", () => {
    const results = detector.scan('https://example.com/submit', 'email=user@test.com&name=John')
    expect(results.some((r) => r.type === 'EMAIL')).toBe(true)
  })
})

// ─── DEVICE — Empreinte navigateur ────────────────────────────────────────

describe('PiiDetector — DEVICE', () => {
  it("détecte un paramètre canvas (fingerprinting)", () => {
    const results = detector.scan('https://tracker.example.com?canvas=abc123def456')
    expect(results.some((r) => r.type === 'DEVICE')).toBe(true)
  })

  it("détecte un paramètre timezone (fingerprinting)", () => {
    const results = detector.scan('https://analytics.example.com?timezone=Europe%2FParis')
    expect(results.some((r) => r.type === 'DEVICE')).toBe(true)
  })

  it("masque la valeur DEVICE sans exposer la donnée brute", () => {
    const results = detector.scan('https://example.com?resolution=1920x1080')
    const device = results.find((r) => r.type === 'DEVICE')!
    expect(device.maskedValue).not.toContain('1920x1080')
    expect(device.maskedValue).toContain('••••')
  })
})

// ─── SHOULD_NOT_DETECT — Faux positifs à éviter ───────────────────────────

describe('PiiDetector — SHOULD_NOT_DETECT (faux positifs)', () => {
  it("ne détecte pas une version semver dans une URL", () => {
    const results = detector.scan('https://cdn.example.com/lib/3.2.1/bundle.js')
    expect(results).toHaveLength(0)
  })

  it("ne détecte pas un code postal dans un paramètre", () => {
    const results = detector.scan('https://example.com?cp=75008&city=Paris')
    expect(results).toHaveLength(0)
  })

  it("ne détecte pas un prix dans une URL e-commerce", () => {
    const results = detector.scan('https://shop.example.com/product?price=29.99&currency=EUR')
    expect(results).toHaveLength(0)
  })

  it("ne détecte pas un ID numérique court comme un téléphone", () => {
    const results = detector.scan('https://api.example.com/users/12345')
    expect(results.filter((r) => r.type === 'TEL')).toHaveLength(0)
  })
})
