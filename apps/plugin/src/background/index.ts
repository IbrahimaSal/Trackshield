import { PiiDetector } from './pii-detector.js'
import { TrackerMatcherService } from './tracker-matcher.js'
import { BadgeManager } from './badge-manager.js'
import { SyncClient } from './sync-client.js'

const piiDetector = new PiiDetector()
const trackerMatcher = new TrackerMatcherService()
const badgeManager = new BadgeManager()
const syncClient = new SyncClient()

void trackerMatcher.init()

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!details.tabId || details.tabId < 0) return

    const piis = piiDetector.scan(details.url, details.requestBody?.raw?.map(r => r.bytes ? new TextDecoder().decode(r.bytes) : '').join(''))
    const tracker = trackerMatcher.match(details.url)

    if (piis.length > 0 || tracker !== null) {
      badgeManager.update(details.tabId, { piis, tracker })
      syncClient.enqueue({ piis, tracker, url: details.url, tabId: details.tabId })
    }
  },
  { urls: ['<all_urls>'] },
  ['requestBody'],
)

chrome.tabs.onActivated.addListener(({ tabId }) => {
  badgeManager.refresh(tabId)
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    badgeManager.reset(tabId)
  }
})
