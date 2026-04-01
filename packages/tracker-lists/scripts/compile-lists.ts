/**
 * Compile tracker lists from EasyList, EasyPrivacy and Disconnect
 * into optimized JSON files for embedding in the plugin.
 *
 * Run: pnpm --filter @trackshield/tracker-lists compile
 */
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import type { TrackerCategory } from '@trackshield/shared-types'
import type { TrackerList } from '../src/types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../data')
mkdirSync(DATA_DIR, { recursive: true })

// ─── Disconnect ───────────────────────────────────────────────────────────────

const DISCONNECT_CATEGORY_MAP: Record<string, TrackerCategory> = {
  Advertising: 'advertising',
  Analytics: 'analytics',
  Social: 'social',
  FingerprintingInvasive: 'fingerprinting',
  FingerprintingGeneral: 'fingerprinting',
  Content: 'advertising',
  Disconnect: 'analytics',
}

interface DisconnectServices {
  // categories[catName] = Array<{ companyName: { url: string[] } }>
  categories: Record<string, Array<Record<string, Record<string, string[]>>>>
}

async function compileDisconnect(): Promise<TrackerList> {
  console.log('Fetching Disconnect list…')
  const res = await fetch(
    'https://raw.githubusercontent.com/disconnectme/disconnect-tracking-protection/master/services.json',
  )
  if (!res.ok) throw new Error(`Disconnect fetch failed: ${res.status}`)

  const data = await res.json() as DisconnectServices
  const domains: Record<string, TrackerCategory> = {}

  for (const [catName, companiesList] of Object.entries(data.categories)) {
    const category = DISCONNECT_CATEGORY_MAP[catName]
    if (!category) continue

    // companiesList = [ { companyName: { "https://url/": ["domain1", ...] } }, ... ]
    for (const companyEntry of Object.values(companiesList)) {
      for (const urlToDomains of Object.values(companyEntry)) {
        // urlToDomains = { "https://main.com/": ["tracker1.com", "tracker2.net"] }
        for (const trackerDomains of Object.values(urlToDomains)) {
          if (!Array.isArray(trackerDomains)) continue
          for (const domain of trackerDomains) {
            if (typeof domain === 'string' && domain.includes('.')) {
              domains[domain.toLowerCase()] = category
            }
          }
        }
      }
    }
  }

  console.log(`  → Disconnect: ${Object.keys(domains).length} domaines`)
  return { name: 'disconnect', version: new Date().toISOString().slice(0, 10), domains }
}

// ─── ABP filter list parser (EasyList / EasyPrivacy) ─────────────────────────

// Matches: ||domain.tld^ or ||domain.tld^$options
const DOMAIN_RULE = /^\|\|([a-zA-Z0-9][a-zA-Z0-9._-]*\.[a-zA-Z]{2,})\^/

function parseAbpList(text: string, category: TrackerCategory): Record<string, TrackerCategory> {
  const domains: Record<string, TrackerCategory> = {}
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('!') || trimmed.startsWith('[')) continue
    const m = DOMAIN_RULE.exec(trimmed)
    if (m) {
      const domain = m[1].toLowerCase()
      // Skip IP addresses
      if (/^\d+\.\d+\.\d+\.\d+$/.test(domain)) continue
      domains[domain] = category
    }
  }
  return domains
}

async function compileAbpList(name: string, url: string, category: TrackerCategory): Promise<TrackerList> {
  console.log(`Fetching ${name}…`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${name} fetch failed: ${res.status}`)
  const text = await res.text()
  const domains = parseAbpList(text, category)
  console.log(`  → ${name}: ${Object.keys(domains).length} domaines`)
  return { name: name.toLowerCase(), version: new Date().toISOString().slice(0, 10), domains }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('=== Compilation des listes de trackers ===\n')

  const [disconnect, easylist, easyprivacy] = await Promise.all([
    compileDisconnect(),
    compileAbpList('easylist', 'https://easylist.to/easylist/easylist.txt', 'advertising'),
    compileAbpList('easyprivacy', 'https://easylist.to/easylist/easyprivacy.txt', 'analytics'),
  ])

  writeFileSync(join(DATA_DIR, 'disconnect.json'), JSON.stringify(disconnect))
  writeFileSync(join(DATA_DIR, 'easylist.json'), JSON.stringify(easylist))
  writeFileSync(join(DATA_DIR, 'easyprivacy.json'), JSON.stringify(easyprivacy))

  const totalDisconnect = Object.keys(disconnect.domains).length
  const totalEasylist = Object.keys(easylist.domains).length
  const totalEasyprivacy = Object.keys(easyprivacy.domains).length

  console.log('\n=== Résumé ===')
  console.log(`disconnect.json   : ${totalDisconnect} domaines`)
  console.log(`easylist.json     : ${totalEasylist} domaines`)
  console.log(`easyprivacy.json  : ${totalEasyprivacy} domaines`)
  console.log(`TOTAL             : ${totalDisconnect + totalEasylist + totalEasyprivacy} domaines`)
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Compilation failed:', err)
  process.exit(1)
})
