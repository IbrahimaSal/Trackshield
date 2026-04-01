import type { View } from '../App.js'
import { useSessionStore } from '../stores/session.store.js'
import { TrackerRow } from '../components/domain/TrackerRow.js'

interface LiveFeedProps {
  onNavigate: (view: View) => void
}

export default function LiveFeed({ onNavigate }: LiveFeedProps): JSX.Element {
  const { trackers } = useSessionStore()

  return (
    <div className="w-[340px] p-4 text-white flex flex-col">
      <button
        onClick={() => onNavigate('main')}
        className="text-xs text-white/40 mb-4 self-start"
      >
        ← Retour
      </button>
      <h2 className="text-sm font-semibold mb-3">Trackers — temps réel</h2>

      {trackers.length === 0 ? (
        <p className="text-xs text-white/40 mt-1">Aucun tracker détecté sur cette page.</p>
      ) : (
        <div>
          {trackers.slice(0, 50).map((tracker, i) => (
            <TrackerRow key={i} tracker={tracker} />
          ))}
        </div>
      )}
    </div>
  )
}
