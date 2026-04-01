import type { View } from '../App.js'
import { useAlertsStore } from '../stores/alerts.store.js'
import { PiiTag } from '../components/domain/PiiTag.js'
import { MaskedValue } from '../components/primitives/MaskedValue.js'
import { PII_SEVERITY } from '../types/pii.js'
import { SEVERITY_COLORS } from '../types/severity.js'

interface AlertsViewProps {
  onNavigate: (view: View) => void
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function AlertsView({ onNavigate }: AlertsViewProps): JSX.Element {
  const { alerts, clearAlerts } = useAlertsStore()
  const sorted = [...alerts].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <div className="w-[340px] p-4 text-white flex flex-col">
      <button
        onClick={() => onNavigate('main')}
        className="text-xs text-white/40 mb-4 self-start"
      >
        ← Retour
      </button>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold">Alertes</h2>
        {alerts.length > 0 && (
          <button
            onClick={clearAlerts}
            className="text-[10px] text-white/40 hover:text-white/60"
          >
            Effacer les alertes
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <p className="text-xs text-white/40 mt-1">Aucune alerte pour cette session.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((alert) => {
            const severity = PII_SEVERITY[alert.pii.type]
            return (
              <div
                key={alert.id}
                className="flex flex-col gap-1 p-2 rounded border border-border"
                style={{ borderLeftColor: SEVERITY_COLORS[severity], borderLeftWidth: 2 }}
              >
                <div className="flex items-center gap-2">
                  <MaskedValue
                    value={alert.pii.maskedValue}
                    severity={severity}
                    data-testid="masked-value"
                  />
                  <PiiTag type={alert.pii.type} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/50 truncate">{alert.pii.destination}</span>
                  <span className="text-[10px] text-white/30 ml-2 shrink-0">{formatTime(alert.timestamp)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
