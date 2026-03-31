import type { TrackerCategory, PiiType } from '@trackshield/shared-types'

// Résumé PII sans maskedValue — ne transite pas inutilement côté API
export interface PiiSummary {
  type: PiiType
  destination: string
  timestamp: number
}

export interface TrackerSummary {
  domain: string
  category: TrackerCategory
  company: string
  requestCount: number
}

export interface SessionSummary {
  id: string
  domain: string
  url: string
  grade: string | null
  score: number | null
  startedAt: Date
  trackers: TrackerSummary[]
  piis: PiiSummary[]
}

export interface PaginationOptions {
  limit: number
  offset: number
}

export interface HistoryResult {
  sessions: SessionSummary[]
  total: number
}

// Classe abstraite — token DI NestJS
export abstract class ISyncRepository {
  abstract getSessionHistory(userId: string, options: PaginationOptions): Promise<HistoryResult>
  abstract deleteUserData(userId: string): Promise<void>
}
