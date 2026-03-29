import { create } from 'zustand'
import type { PiiDetection } from '@trackshield/shared-types'

interface Alert {
  id: string
  pii: PiiDetection
  read: boolean
  timestamp: number
}

interface AlertsState {
  alerts: Alert[]
  unreadCount: number
  addAlert: (pii: PiiDetection) => void
  markRead: (id: string) => void
  markAllRead: () => void
}

export const useAlertsStore = create<AlertsState>((set) => ({
  alerts: [],
  unreadCount: 0,
  addAlert: (pii) => set((s) => {
    const alert: Alert = { id: crypto.randomUUID(), pii, read: false, timestamp: Date.now() }
    return { alerts: [alert, ...s.alerts], unreadCount: s.unreadCount + 1 }
  }),
  markRead: (id) => set((s) => ({
    alerts: s.alerts.map(a => a.id === id ? { ...a, read: true } : a),
    unreadCount: Math.max(0, s.unreadCount - 1),
  })),
  markAllRead: () => set((s) => ({
    alerts: s.alerts.map(a => ({ ...a, read: true })),
    unreadCount: 0,
  })),
}))
