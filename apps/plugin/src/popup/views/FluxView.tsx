import type { PiiDetection } from '@trackshield/shared-types'
import type { View } from '../App.js'
import { useSessionStore } from '../stores/session.store.js'
import { PiiTag } from '../components/domain/PiiTag.js'
import { MaskedValue } from '../components/primitives/MaskedValue.js'
import { PII_SEVERITY } from '../types/pii.js'

interface FluxViewProps {
  onNavigate: (view: View) => void
}

interface GroupedEntry {
  pii: PiiDetection
  count: number
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
    const entries = Array.from(valueMap.values()).sort((a, b) => b.count - a.count)
    result.set(dest, entries)
  }
  return result
}

export default function FluxView({ onNavigate }: FluxViewProps): JSX.Element {
  const { piis } = useSessionStore()
  const grouped = groupByDestination(piis)

  return (
    <div className="w-[340px] p-4 text-white flex flex-col">
      <button
        onClick={() => onNavigate('main')}
        className="text-xs text-white/40 mb-4 self-start"
      >
        ← Retour
      </button>
      <h2 className="text-sm font-semibold mb-3">Carte des flux</h2>

      {piis.length === 0 ? (
        <p className="text-xs text-white/40 mt-1">Aucune donnée transmise détectée.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {Array.from(grouped.entries()).map(([destination, entries]) => (
            <div key={destination}>
              <div className="text-[10px] font-semibold text-white/60 mb-1.5 truncate">
                {destination}
              </div>
              <div className="flex flex-col gap-1 pl-2 border-l border-border">
                {entries.map(({ pii, count }, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <MaskedValue value={pii.maskedValue} severity={PII_SEVERITY[pii.type]} />
                    <PiiTag type={pii.type} />
                    {count > 1 && (
                      <span className="text-[9px] text-white/40 ml-auto">×{count}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
