const UPDATE_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24h

export class ListsUpdater {
  schedule(): void {
    chrome.alarms.create('update-lists', { periodInMinutes: 24 * 60 })
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'update-lists') {
        void this.update()
      }
    })
  }

  private async update(): Promise<void> {
    const { apiUrl } = await chrome.storage.local.get('apiUrl') as { apiUrl?: string }
    if (!apiUrl) return
    try {
      const response = await fetch(`${apiUrl}/api/tracker-lists/latest`)
      if (!response.ok) return
      // Store updated lists in chrome.storage.local for next load
      const lists = await response.json() as unknown
      await chrome.storage.local.set({ trackerLists: lists, listsUpdatedAt: Date.now() })
    } catch {
      // Silently fail — keep using existing lists
    }
  }
}
