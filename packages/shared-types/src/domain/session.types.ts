import type { RgpdGrade } from './rgpd-score.types.js'
import type { TrackerMatch } from './tracker.types.js'
import type { PiiDetection } from './pii.types.js'

export type SessionStatus = 'active' | 'completed'

export interface Session {
  id: string
  url: string
  domain: string
  startedAt: number
  status: SessionStatus
  grade: RgpdGrade | null
  score: number | null
  trackers: TrackerMatch[]
  piis: PiiDetection[]
}
