import type { View } from '../App.js'
import { PopupShell } from '../components/layout/PopupShell.js'
import { PopupHeader } from '../components/layout/PopupHeader.js'
import { ScoreBlock } from '../components/blocks/ScoreBlock.js'
import { PiiBox } from '../components/blocks/PiiBox.js'
import { TrackerRow } from '../components/domain/TrackerRow.js'
import { useSessionStore, selectUniquePiis } from '../stores/session.store.js'
import { OkBox } from '../components/blocks/OkBox.js'

interface PopupMainProps {
  onNavigate: (view: View) => void
}

export default function PopupMain({ onNavigate }: PopupMainProps): JSX.Element {
  const { trackers, piis, score, currentDomain } = useSessionStore()
  const uniquePiis = selectUniquePiis(piis)

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
          piiCount={uniquePiis.length}
        />
        {hasAlerts && <PiiBox detections={piis} />}
        {piis.length === 0 && <OkBox />}
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
          style={{ background: '#004D98' }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M1 6.5C1 6.5 3 3 6.5 3S12 6.5 12 6.5 10 10 6.5 10 1 6.5 1 6.5z" stroke="white" strokeWidth="1.2"/>
            <circle cx="6.5" cy="6.5" r="2" stroke="white" strokeWidth="1.2"/>
          </svg>
          Voir les flux
        </button>
        <button
          onClick={() => onNavigate('report')}
          className="flex items-center justify-center gap-1.5 text-[11px] font-medium py-2 px-3 rounded-lg"
          style={{ background: '#1A1E2A', color: '#8B90A8', border: '1px solid rgba(255,255,255,0.11)' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1.5" y="1" width="9" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M3.5 4h5M3.5 6.5h5M3.5 9h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Rapport
        </button>
      </div>
    </PopupShell>
  )
}
