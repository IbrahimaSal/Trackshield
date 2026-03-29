import type { View } from '../App.js'

interface LiveFeedProps {
  onNavigate: (view: View) => void
}

export default function LiveFeed({ onNavigate }: LiveFeedProps): JSX.Element {
  return (
    <div className="w-[340px] p-4 text-white">
      <button onClick={() => onNavigate('main')} className="text-xs text-white/40 mb-4">← Retour</button>
      <h2 className="text-sm font-semibold">Trackers — temps réel</h2>
      <p className="text-xs text-white/40 mt-1">Feed en construction</p>
    </div>
  )
}
