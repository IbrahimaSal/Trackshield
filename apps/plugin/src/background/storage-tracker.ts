export interface StoredPiiMatch {
  key: string
  value: string
  maskedValue: string
}

const MIN_VALUE_LENGTH = 8

export class StorageTracker {
  private stored = new Map<string, string>()

  addValues(values: Record<string, string>): void {
    for (const [key, value] of Object.entries(values)) {
      if (value.length >= MIN_VALUE_LENGTH) {
        this.stored.set(key, value)
      }
    }
  }

  findInRequest(url: string, body?: string): StoredPiiMatch[] {
    const haystack = body ? `${url} ${body}` : url
    const seen = new Set<string>()
    const matches: StoredPiiMatch[] = []

    for (const [key, value] of this.stored.entries()) {
      if (haystack.includes(value) && !seen.has(value)) {
        seen.add(value)
        matches.push({ key, value, maskedValue: StorageTracker.mask(value) })
      }
    }

    return matches
  }

  clear(): void {
    this.stored.clear()
  }

  static mask(value: string): string {
    return value.slice(0, 4) + '••••'
  }
}
