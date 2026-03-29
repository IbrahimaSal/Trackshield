import type { View } from '../App.js'

interface ReportViewProps {
  onNavigate: (view: View) => void
}

export default function ReportView({ onNavigate }: ReportViewProps): JSX.Element {
  return (
    <div className="w-[340px] p-4 text-white">
      <button onClick={() => onNavigate('main')} className="text-xs text-white/40 mb-4">← Retour</button>
      <h2 className="text-sm font-semibold">Rapport d'audit</h2>
      <p className="text-xs text-white/40 mt-1">Vue en construction</p>
    </div>
  )
}
