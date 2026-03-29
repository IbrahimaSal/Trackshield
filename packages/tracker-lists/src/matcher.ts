import type { TrackerMatch } from '@trackshield/shared-types'
import type { TrackerList, TrieNode } from './types.js'

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

function buildTrie(entries: Array<[string, { category: import('@trackshield/shared-types').TrackerCategory; company: string }]>): TrieNode {
  const root: TrieNode = { children: new Map(), match: null }
  for (const [domain, meta] of entries) {
    const parts = domain.split('.').reverse()
    let node = root
    for (const part of parts) {
      if (!node.children.has(part)) {
        node.children.set(part, { children: new Map(), match: null })
      }
      node = node.children.get(part)!
    }
    node.match = meta
  }
  return root
}

export class TrackerMatcher {
  private trie: TrieNode

  constructor(lists: TrackerList[]) {
    const entries = lists.flatMap(l =>
      Object.entries(l.domains).map(([domain, category]) => [
        domain,
        { category, company: domain.split('.').slice(-2, -1)[0] ?? domain },
      ] as [string, { category: import('@trackshield/shared-types').TrackerCategory; company: string }])
    )
    this.trie = buildTrie(entries)
  }

  match(url: string): TrackerMatch | null {
    const domain = extractDomain(url)
    const parts = domain.split('.').reverse()
    let node = this.trie
    let lastMatch: TrieNode['match'] = null
    let matchedParts = 0
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (part === undefined) break
      const child = node.children.get(part)
      if (!child) break
      node = child
      if (node.match) {
        lastMatch = node.match
        matchedParts = i + 1
      }
    }
    if (!lastMatch) return null
    return {
      domain,
      category: lastMatch.category,
      company: lastMatch.company,
      requestCount: 1,
    }
  }
}
