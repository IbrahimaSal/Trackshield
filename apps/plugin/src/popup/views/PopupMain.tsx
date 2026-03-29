import type { View } from '../App.js'
import { PopupShell } from '../components/layout/PopupShell.js'
import { PopupHeader } from '../components/layout/PopupHeader.js'
import { ScoreBlock } from '../components/blocks/ScoreBlock.js'
import { PiiBox } from '../components/blocks/PiiBox.js'
import { TrackerRow } from '../components/domain/TrackerRow.js'
import { useSessionStore } from '../stores/session.store.js'

interface PopupMainProps {
  onNavigate: (view: View) => void
}

export default function PopupMain({ onNavigate }: PopupMainProps): JSX.Element {
  const { trackers, piis, score, currentDomain } = useSessionStore()

  const hasAlerts = piis.length > 0
  const grade = score?.grade ?? 'A'
  const scoreValue = score?.score ?? 100

  return (
    <PopupShell>
      <PopupHeader url={currentDomain ?? '—'} />
      <div className="p-3.5 flex-1">
        <ScoreBlock
          grade={grade}
          score={scoreValue}
          trackerCount={trackers.length}
          piiCount={piis.length}
        />
        {hasAlerts && <PiiBox detections={piis} />}
        {trackers.length > 0 && (
          <>
            <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">
              Trackers actifs
            </div>
            <div>
              {trackers.slice(0, 3).map((t, i) => (
                <TrackerRow key={i} tracker={t} />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="px-3.5 pb-3.5 flex gap-2">
        <button
          onClick={() => onNavigate('flux')}
          className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-medium py-2 rounded-lg text-white"
          style={{ background: 'linear-gradient(135deg, #004D98, #A50044)' }}
        >
          Voir les flux
        </button>
        <button
          onClick={() => onNavigate('report')}
          className="flex items-center justify-center gap-1.5 text-[11px] font-medium py-2 px-3 rounded-lg text-white/60 border border-border"
        >
          Rapport
        </button>
      </div>
    </PopupShell>
  )
}
