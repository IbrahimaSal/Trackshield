import type { PiiDetection, TrackerMatch } from '@trackshield/shared-types'
import type { EventBatchDto } from '@trackshield/shared-types'

interface QueueItem {
  piis: PiiDetection[]
  tracker: TrackerMatch | null
  url: string
  tabId: number
}

export class SyncClient {
  private queue: QueueItem[] = []
  private timer: ReturnType<typeof setTimeout> | null = null

  enqueue(item: QueueItem): void {
    this.queue.push(item)
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), 5000)
    }
  }

  private async flush(): Promise<void> {
    this.timer = null
    if (this.queue.length === 0) return

    const { syncEnabled, apiUrl, sessionId } = await chrome.storage.local.get(['syncEnabled', 'apiUrl', 'sessionId']) as {
      syncEnabled?: boolean
      apiUrl?: string
      sessionId?: string
    }

    if (!syncEnabled || !apiUrl || !sessionId) {
      this.queue = []
      return
    }

    const items = this.queue.splice(0)
    const batch: EventBatchDto = {
      sessionId,
      domain: new URL(items[0]!.url).hostname,
      timestamp: Date.now(),
      events: items.flatMap(item => [
        ...item.piis.map(pii => ({ kind: 'pii' as const, data: pii })),
        ...(item.tracker ? [{ kind: 'tracker' as const, data: item.tracker }] : []),
      ]),
    }

    try {
      await fetch(`${apiUrl}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      })
    } catch {
      // Sync failed silently — privacy first, local data is source of truth
    }
  }
}
