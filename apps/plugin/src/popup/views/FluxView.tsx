import type { PiiDetection } from '@trackshield/shared-types'
import type { View } from '../App.js'
import { PopupShell } from '../components/layout/PopupShell.js'
import { PopupHeader } from '../components/layout/PopupHeader.js'
import { CompanyAvatar } from '../components/primitives/CompanyAvatar.js'
import { Badge } from '../components/primitives/Badge.js'
import { PiiTag } from '../components/domain/PiiTag.js'
import { MaskedValue } from '../components/primitives/MaskedValue.js'
import { useSessionStore } from '../stores/session.store.js'
import { PII_SEVERITY } from '../types/pii.js'

interface FluxViewProps {
  onNavigate: (view: View) => void
}

interface GroupedEntry {
  pii: PiiDetection
  count: number
}

const CATEGORY_COLOR: Record<string, string> = {
  advertising: '#FFB020',
  analytics: '#3B9EFF',
  social: '#FF5FA8',
  fingerprinting: '#FF3B5C',
}

const CATEGORY_SEVERITY = {
  advertising: 'warn',
  analytics: 'info',
  social: 'info',
  fingerprinting: 'fingerprint',
} as const

const CATEGORY_LABEL: Record<string, string> = {
  advertising: 'Pub',
  analytics: 'Analytique',
  social: 'Social',
  fingerprinting: 'Device',
}

function groupByDestination(piis: PiiDetection[]): Map<string, GroupedEntry[]> {
  const byDest = new Map<string, Map<string, GroupedEntry>>()
  for (const pii of piis) {
    if (!byDest.has(pii.destination)) byDest.set(pii.destination, new Map())
    const destMap = byDest.get(pii.destination)!
    const existing = destMap.get(pii.maskedValue)
    if (existing) {
      existing.count++
    } else {
      destMap.set(pii.maskedValue, { pii, count: 1 })
    }
  }
  const result = new Map<string, GroupedEntry[]>()
  for (const [dest, valueMap] of byDest.entries()) {
    result.set(dest, Array.from(valueMap.values()).sort((a, b) => b.count - a.count))
  }
  return result
}

const INTELLIGIBLE_TYPES = new Set<string>(['EMAIL', 'TEL', 'LOC'])

export default function FluxView({ onNavigate }: FluxViewProps): JSX.Element {
  const { trackers, piis, currentDomain } = useSessionStore()
  const visiblePiis = piis.filter(p => INTELLIGIBLE_TYPES.has(p.type))
  const grouped = groupByDestination(visiblePiis)
  const isEmpty = trackers.length === 0 && visiblePiis.length === 0

  return (
    <PopupShell>
      <PopupHeader url={currentDomain ?? '—'} />
      <div className="flex-1 overflow-y-auto" style={{ padding: '14px 15px' }}>

        {isEmpty ? (
          <p style={{ fontSize: 12, color: '#4E5368', marginTop: 8 }}>Aucun flux détecté.</p>
        ) : (
          <>
            {trackers.length > 0 && (
              <>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#4E5368', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
                  Navigation transmise à
                </div>
                <div style={{ marginBottom: piis.length > 0 ? 14 : 0 }}>
                  {trackers.map((tracker, i) => (
                    <div
                      key={i}
                      className="flex items-center last:border-0"
                      style={{ gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}
                    >
                      <CompanyAvatar
                        initials={tracker.company.slice(0, 1).toUpperCase()}
                        color={CATEGORY_COLOR[tracker.category] ?? '#8B90A8'}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="truncate" style={{ fontSize: 12, fontWeight: 500, color: '#EEF0F8' }}>
                          {tracker.company}
                        </div>
                        <div className="truncate" style={{ fontSize: 10, color: '#4E5368', fontFamily: "'DM Mono', monospace" }}>
                          {tracker.domain}
                        </div>
                      </div>
                      <Badge severity={CATEGORY_SEVERITY[tracker.category] ?? 'info'}>
                        {CATEGORY_LABEL[tracker.category] ?? tracker.category}
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            )}

            {visiblePiis.length > 0 && (
              <>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#4E5368', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
                  Données personnelles transmises
                </div>
                <div className="flex flex-col" style={{ gap: 12 }}>
                  {Array.from(grouped.entries()).map(([destination, entries]) => (
                    <div key={destination}>
                      <div className="truncate" style={{ fontSize: 10, fontWeight: 600, color: '#8B90A8', marginBottom: 6 }}>
                        {destination}
                      </div>
                      <div className="flex flex-col pl-2" style={{ gap: 4, borderLeft: '1px solid rgba(255,255,255,.06)' }}>
                        {entries.map(({ pii, count }, i) => (
                          <div key={i} className="flex items-center" style={{ gap: 8 }}>
                            <MaskedValue value={pii.maskedValue} severity={PII_SEVERITY[pii.type]} />
                            <PiiTag type={pii.type} />
                            {count > 1 && (
                              <span style={{ fontSize: 9, color: '#4E5368', marginLeft: 'auto' }}>×{count}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div style={{ padding: '8px 15px 14px' }}>
        <button
          onClick={() => onNavigate('main')}
          style={{ fontSize: 11, color: '#8B90A8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          ← Retour
        </button>
      </div>
    </PopupShell>
  )
}
