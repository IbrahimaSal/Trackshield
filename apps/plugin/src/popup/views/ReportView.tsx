import { useState } from 'react'
import type { View } from '../App.js'
import { useSessionStore } from '../stores/session.store.js'
import { PiiTag } from '../components/domain/PiiTag.js'
import { PII_SEVERITY } from '../types/pii.js'
import { SEVERITY_COLORS } from '../types/severity.js'

interface ReportViewProps {
  onNavigate: (view: View) => void
}

interface ReportData {
  url: string
  grade: string
  score: number
  trackers: { name: string; category: string; url: string }[]
  piis: { type: string; maskedValue: string; destination: string; timestamp: number }[]
  summary: string
  recommendations: string[]
}

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; report: ReportData }
  | { status: 'error'; degraded: boolean }

function buildHtml(report: ReportData): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Rapport Trackshield — ${report.url}</title></head>
<body>
<h1>Rapport d'audit RGPD</h1>
<p><strong>URL :</strong> ${report.url}</p>
<p><strong>Note :</strong> ${report.grade} (${report.score.toFixed(1)}/100)</p>
<h2>Résumé</h2><p>${report.summary}</p>
<h2>Recommandations</h2><ul>${report.recommendations.map((r) => `<li>${r}</li>`).join('')}</ul>
<h2>Trackers (${report.trackers.length})</h2>
<ul>${report.trackers.map((t) => `<li>${t.name} — ${t.category} — ${t.url}</li>`).join('')}</ul>
<h2>Données personnelles détectées (${report.piis.length})</h2>
<ul>${report.piis.map((p) => `<li>${p.type} : ${p.maskedValue} → ${p.destination}</li>`).join('')}</ul>
</body></html>`
}

function downloadHtml(report: ReportData): void {
  const blob = new Blob([buildHtml(report)], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `trackshield-rapport.html`
  a.click()
  URL.revokeObjectURL(url)
}

export default function ReportView({ onNavigate }: ReportViewProps): JSX.Element {
  const [state, setState] = useState<State>({ status: 'idle' })
  const { currentDomain, trackers, piis, score } = useSessionStore()

  async function generate(): Promise<void> {
    setState({ status: 'loading' })
    try {
      const { analyzerUrl } = await chrome.storage.local.get('analyzerUrl') as { analyzerUrl?: string }
      const url = analyzerUrl ?? 'http://localhost:8000'

      const response = await fetch(`${url}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: currentDomain ?? 'unknown',
          trackers: trackers.map((t) => ({ name: t.company, category: t.category, url: t.domain })),
          piis: piis.map((p) => ({ type: p.type, masked_value: p.maskedValue, destination: p.destination })),
          cookie_count: 0,
          non_eu_destination_ratio: 0,
        }),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const report = await response.json() as ReportData
      setState({ status: 'success', report })
    } catch {
      setState({ status: 'error', degraded: score !== null })
    }
  }

  return (
    <div className="w-[340px] p-4 text-white flex flex-col">
      <button
        onClick={() => onNavigate('main')}
        className="text-xs text-white/40 mb-4 self-start"
      >
        ← Retour
      </button>
      <h2 className="text-sm font-semibold mb-3">Rapport d'audit</h2>

      {state.status === 'idle' && (
        <button
          onClick={generate}
          className="mt-2 px-3 py-2 rounded bg-white/10 text-xs hover:bg-white/20"
        >
          Générer le rapport
        </button>
      )}

      {state.status === 'loading' && (
        <p className="text-xs text-white/40 mt-2">Chargement en cours…</p>
      )}

      {state.status === 'error' && (
        <div className="mt-2">
          <p className="text-xs text-red-400 mb-2">Analyzer indisponible — données locales affichées.</p>
          {state.degraded && score && (
            <div className="flex items-center gap-2">
              <span
                className="text-2xl font-bold"
                style={{ color: SEVERITY_COLORS[score.grade === 'A' ? 'ok' : score.grade === 'F' ? 'danger' : 'warn'] }}
              >
                {score.grade}
              </span>
              <span className="text-xs text-white/60">{score.score.toFixed(1)} / 100</span>
            </div>
          )}
          <button
            onClick={generate}
            className="mt-3 px-3 py-1 rounded bg-white/10 text-xs hover:bg-white/20"
          >
            Réessayer
          </button>
        </div>
      )}

      {state.status === 'success' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-white">{state.report.grade}</span>
            <span className="text-xs text-white/60">{state.report.score.toFixed(1)} / 100</span>
          </div>

          <p className="text-xs text-white/70">{state.report.summary}</p>

          {state.report.recommendations.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-white/50 mb-1">RECOMMANDATIONS</p>
              <ul className="flex flex-col gap-1">
                {state.report.recommendations.map((r, i) => (
                  <li key={i} className="text-xs text-white/70 flex gap-1">
                    <span className="text-white/30">→</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {state.report.piis.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-white/50 mb-1">DONNÉES TRANSMISES</p>
              <div className="flex flex-col gap-1">
                {state.report.piis.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-white/70">{p.maskedValue}</span>
                    <PiiTag type={p.type as Parameters<typeof PiiTag>[0]['type']} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => downloadHtml(state.report)}
            className="mt-1 px-3 py-2 rounded bg-white/10 text-xs hover:bg-white/20"
          >
            Télécharger HTML
          </button>
        </div>
      )}
    </div>
  )
}
