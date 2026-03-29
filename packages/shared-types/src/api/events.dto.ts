import type { PiiDetection } from '../domain/pii.types.js'
import type { TrackerMatch } from '../domain/tracker.types.js'

export interface EventBatchDto {
  sessionId: string
  domain: string
  timestamp: number
  events: Array<
    | { kind: 'tracker'; data: TrackerMatch }
    | { kind: 'pii'; data: PiiDetection }
  >
}
