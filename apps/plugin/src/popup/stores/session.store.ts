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
  _syncFromStorage: (data: { trackers: TrackerMatch[]; piis: PiiDetection[]; domain: string | null }) => void
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
  _syncFromStorage: (data) => set({ trackers: data.trackers, piis: data.piis, currentDomain: data.domain }),
}))

// ─── Pont background → popup ────────────────────────────────────────────────
// Le service worker background écrit l'état de l'onglet actif dans
// chrome.storage.local sous la clé "tabState". Le popup lit ce snapshot
// au montage et s'abonne aux changements pour rester synchronisé.

const TAB_STATE_KEY = 'tabState'

interface StoredTabState {
  tabId: number
  trackers: TrackerMatch[]
  piis: PiiDetection[]
  domain: string | null
}

function applyStoredState(stored: StoredTabState | undefined): void {
  if (!stored) return
  useSessionStore.getState()._syncFromStorage({
    trackers: stored.trackers ?? [],
    piis: stored.piis ?? [],
    domain: stored.domain ?? null,
  })
}

if (typeof chrome !== 'undefined' && chrome.storage) {
  // Lecture initiale
  chrome.storage.local.get(TAB_STATE_KEY, (result) => {
    applyStoredState((result as Record<string, StoredTabState>)[TAB_STATE_KEY])
  })

  // Abonnement aux mises à jour en temps réel
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes[TAB_STATE_KEY]) return
    applyStoredState(changes[TAB_STATE_KEY].newValue as StoredTabState | undefined)
  })
}
