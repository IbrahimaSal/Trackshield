import type { PiiDetection } from '@trackshield/shared-types'
import type { View } from '../App.js'
import { useSessionStore } from '../stores/session.store.js'
import { PiiTag } from '../components/domain/PiiTag.js'
import { MaskedValue } from '../components/primitives/MaskedValue.js'
import { PII_SEVERITY } from '../types/pii.js'

interface FluxViewProps {
  onNavigate: (view: View) => void
}

function groupByDestination(piis: PiiDetection[]): Map<string, PiiDetection[]> {
  return piis.reduce((acc, pii) => {
    const group = acc.get(pii.destination) ?? []
    acc.set(pii.destination, [...group, pii])
    return acc
  }, new Map<string, PiiDetection[]>())
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
          {Array.from(grouped.entries()).map(([destination, detections]) => (
            <div key={destination}>
              <div className="text-[10px] font-semibold text-white/60 mb-1.5 truncate">
                {destination}
              </div>
              <div className="flex flex-col gap-1 pl-2 border-l border-border">
                {detections.map((detection, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <MaskedValue value={detection.maskedValue} severity={PII_SEVERITY[detection.type]} />
                    <PiiTag type={detection.type} />
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
