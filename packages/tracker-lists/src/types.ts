import type { TrackerCategory } from '@trackshield/shared-types'

export interface TrackerList {
  name: string
  version: string
  domains: Record<string, TrackerCategory>
}

export interface TrieNode {
  children: Map<string, TrieNode>
  match: { category: TrackerCategory; company: string } | null
}
