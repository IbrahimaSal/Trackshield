import { create } from 'zustand'
import type { TrackerMatch, PiiDetection, RgpdScore } from '@trackshield/shared-types'

interface SessionState {
  currentDomain: string | null
  trackers: TrackerMatch[]
  piis: PiiDetection[]
  score: RgpdScore | null
  setDomain: (domain: string) => void
  addTracker: (tracker: TrackerMatch) => void
  addPii: (pii: PiiDetection) => void
  setScore: (score: RgpdScore) => void
  reset: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  currentDomain: null,
  trackers: [],
  piis: [],
  score: null,
  setDomain: (domain) => set({ currentDomain: domain }),
  addTracker: (tracker) => set((s) => ({ trackers: [...s.trackers, tracker] })),
  addPii: (pii) => set((s) => ({ piis: [...s.piis, pii] })),
  setScore: (score) => set({ score }),
  reset: () => set({ trackers: [], piis: [], score: null, currentDomain: null }),
}))
