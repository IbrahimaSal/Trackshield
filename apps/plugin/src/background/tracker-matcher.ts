import type { TrackerMatch } from '@trackshield/shared-types'
import { TrackerMatcher } from '@trackshield/tracker-lists'
import type { TrackerList } from '@trackshield/tracker-lists'

// Lists are loaded from compiled JSON at runtime
let matcher: TrackerMatcher | null = null

async function getMatcher(): Promise<TrackerMatcher> {
  if (matcher) return matcher
  // In production, these are bundled JSON files
  const [easylist, disconnect, easyprivacy] = await Promise.all([
    fetch(chrome.runtime.getURL('data/easylist.json')).then(r => r.json()) as Promise<TrackerList>,
    fetch(chrome.runtime.getURL('data/disconnect.json')).then(r => r.json()) as Promise<TrackerList>,
    fetch(chrome.runtime.getURL('data/easyprivacy.json')).then(r => r.json()) as Promise<TrackerList>,
  ])
  matcher = new TrackerMatcher([easylist, disconnect, easyprivacy])
  return matcher
}

export class TrackerMatcherService {
  match(url: string): TrackerMatch | null {
    if (!matcher) return null
    return matcher.match(url)
  }

  async init(): Promise<void> {
    await getMatcher()
  }
}
