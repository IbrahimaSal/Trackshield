import { create } from 'zustand'

interface SyncState {
  enabled: boolean
  consentGiven: boolean
  lastSyncAt: number | null
  setEnabled: (enabled: boolean) => void
  setConsent: (given: boolean) => void
  setLastSync: (ts: number) => void
}

export const useSyncStore = create<SyncState>((set) => ({
  enabled: false,
  consentGiven: false,
  lastSyncAt: null,
  setEnabled: (enabled) => set({ enabled }),
  setConsent: (consentGiven) => set({ consentGiven }),
  setLastSync: (lastSyncAt) => set({ lastSyncAt }),
}))
