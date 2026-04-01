import type { PiiDetection, TrackerMatch } from '@trackshield/shared-types'

interface TabState {
  trackers: TrackerMatch[]
  piis: PiiDetection[]
}

const tabStates = new Map<number, TabState>()

const TAB_STATE_KEY = 'tabState'

function getSeverityColor(state: TabState): string {
  if (state.piis.length > 0) return '#FF3B5C'
  if (state.trackers.length >= 10) return '#FF3B5C'
  if (state.trackers.length >= 3) return '#FFB020'
  return '#1FCC7A'
}

async function persistActiveTabState(tabId: number, state: TabState): Promise<void> {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (activeTab?.id === tabId) {
    await chrome.storage.local.set({
      [TAB_STATE_KEY]: {
        tabId,
        trackers: state.trackers,
        piis: state.piis,
        domain: activeTab.url ? new URL(activeTab.url).hostname : null,
      },
    })
  }
}

export class BadgeManager {
  update(tabId: number, data: { piis: PiiDetection[]; tracker: TrackerMatch | null }): void {
    const current = tabStates.get(tabId) ?? { trackers: [], piis: [] }
    if (data.tracker) current.trackers.push(data.tracker)
    current.piis.push(...data.piis)
    tabStates.set(tabId, current)
    this.render(tabId, current)
    void persistActiveTabState(tabId, current)
  }

  reset(tabId: number): void {
    const empty = { trackers: [], piis: [] }
    tabStates.set(tabId, empty)
    this.render(tabId, empty)
    void persistActiveTabState(tabId, empty)
  }

  refresh(tabId: number): void {
    const state = tabStates.get(tabId) ?? { trackers: [], piis: [] }
    this.render(tabId, state)
    void persistActiveTabState(tabId, state)
  }

  private render(tabId: number, state: TabState): void {
    const count = state.trackers.length
    chrome.action.setBadgeText({ tabId, text: count > 0 ? String(count) : '' })
    chrome.action.setBadgeBackgroundColor({ tabId, color: getSeverityColor(state) })
  }
}
