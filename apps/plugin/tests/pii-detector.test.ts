import { describe, it, expect } from 'vitest'
import { PiiDetector } from '../src/background/pii-detector.js'

const detector = new PiiDetector()

describe('PiiDetector', () => {
  it('detects email in URL', () => {
    const results = detector.scan('https://pixel.facebook.com/track?email=john.doe@gmail.com')
    expect(results).toHaveLength(1)
    expect(results[0]!.type).toBe('EMAIL')
    expect(results[0]!.maskedValue).toContain('••')
    expect(results[0]!.destination).toBe('pixel.facebook.com')
  })

  it('detects French phone number', () => {
    const results = detector.scan('https://example.com/api?phone=0612345678')
    expect(results).toHaveLength(1)
    expect(results[0]!.type).toBe('TEL')
  })

  it('masks email correctly', () => {
    const results = detector.scan('https://example.com?email=test@example.com')
    expect(results[0]!.maskedValue).not.toContain('test')
    expect(results[0]!.maskedValue).toContain('@example.com')
  })

  it('returns empty array for clean URL', () => {
    const results = detector.scan('https://wikipedia.org/wiki/Privacy')
    expect(results).toHaveLength(0)
  })
})
