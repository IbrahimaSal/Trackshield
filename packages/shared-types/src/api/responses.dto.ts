import type { RgpdScore } from '../domain/rgpd-score.types.js'
import type { Session } from '../domain/session.types.js'

export interface EventBatchResponse {
  sessionId: string
  accepted: number
}

export interface SessionResponse {
  session: Session
  score: RgpdScore | null
}
