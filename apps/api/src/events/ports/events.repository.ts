import type { PiiDetection, TrackerMatch } from '@trackshield/shared-types'

// Classe abstraite (pas interface) — token DI NestJS
export abstract class IEventsRepository {
  abstract sessionExists(sessionId: string): Promise<boolean>
  abstract saveTrackerEvents(sessionId: string, trackers: TrackerMatch[]): Promise<void>
  abstract savePiiEvents(sessionId: string, piis: PiiDetection[]): Promise<void>
}
