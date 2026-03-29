import type { Session } from '@trackshield/shared-types'

const SESSIONS_KEY = 'sessions'
const DAYS_30 = 30 * 24 * 60 * 60 * 1000

export class LocalStore {
  async saveSession(session: Session): Promise<void> {
    const sessions = await this.getSessions()
    await chrome.storage.local.set({ [SESSIONS_KEY]: [...sessions, session] })
  }

  async getSessions(days = 30): Promise<Session[]> {
    const cutoff = Date.now() - days * 86400000
    const result = await chrome.storage.local.get(SESSIONS_KEY) as { sessions?: Session[] }
    return (result[SESSIONS_KEY] ?? []).filter((s) => s.startedAt > cutoff)
  }

  async clearAll(): Promise<void> {
    await chrome.storage.local.clear()
  }
}
