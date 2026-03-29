export type TrackerCategory =
  | 'advertising'
  | 'analytics'
  | 'social'
  | 'fingerprinting'

export interface TrackerMatch {
  domain: string
  category: TrackerCategory
  company: string
  requestCount: number
}
