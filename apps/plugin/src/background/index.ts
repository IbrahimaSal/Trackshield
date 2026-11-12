import { PiiDetector } from './pii-detector.js'
import { TrackerMatcherService } from './tracker-matcher.js'
import { BadgeManager } from './badge-manager.js'
import { SyncClient } from './sync-client.js'
import { StorageTracker } from './storage-tracker.js'

const piiDetector = new PiiDetector()
const trackerMatcher = new TrackerMatcherService()
const badgeManager = new BadgeManager()
const syncClient = new SyncClient()

/** Une instance StorageTracker par onglet — connaît les valeurs localStorage + cookies de cette page */
const storageTrackers = new Map<number, StorageTracker>()

void trackerMatcher.init()

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    if (!details.tabId || details.tabId < 0) return
    const destination = new URL(details.url).hostname
    const cookiePiis = piiDetector.scanHeaders(details.requestHeaders ?? [], destination)
    if (cookiePiis.length > 0) {
      badgeManager.update(details.tabId, { piis: cookiePiis, tracker: null })
      syncClient.enqueue({ piis: cookiePiis, tracker: null, url: details.url, tabId: details.tabId })
    }
  },
  { urls: ['<all_urls>'] },
  ['requestHeaders'],
)

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!details.tabId || details.tabId < 0) return

    const body = details.requestBody?.raw?.map(r => r.bytes ? new TextDecoder().decode(r.bytes) : '').join('')
    const piis = piiDetector.scan(details.url, body)
    const tracker = trackerMatcher.match(details.url)

    // Détection via valeurs stockées (localStorage + cookies first-party)
    const storageTracker = storageTrackers.get(details.tabId)
    if (storageTracker) {
      const storageMatches = storageTracker.findInRequest(details.url, body)
      for (const match of storageMatches) {
        piis.push({
          type: 'ID_PUB',
          maskedValue: match.maskedValue,
          destination: new URL(details.url).hostname,
          timestamp: Date.now(),
          certainty: 'low',
          source: 'storage',
          label: match.key,
        })
      }
    }

    if (piis.length > 0 || tracker !== null) {
      badgeManager.update(details.tabId, { piis, tracker })
      syncClient.enqueue({ piis, tracker, url: details.url, tabId: details.tabId })
    }
  },
  { urls: ['<all_urls>'] },
  ['requestBody'],
)

chrome.runtime.onMessage.addListener((message: unknown, sender) => {
  const msg = message as Record<string, unknown>
  if (msg.kind !== 'storage-values') return
  const tabId = sender.tab?.id
  if (!tabId || tabId < 0) return

  const values = msg.values as Record<string, string>
  if (!storageTrackers.has(tabId)) {
    storageTrackers.set(tabId, new StorageTracker())
  }
  storageTrackers.get(tabId)!.addValues(values)
})

chrome.tabs.onActivated.addListener(({ tabId }) => {
  badgeManager.refresh(tabId)
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    badgeManager.reset(tabId)
    storageTrackers.get(tabId)?.clear()
  }
})
