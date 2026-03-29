import { useEffect, useState } from 'react'
import PopupMain from './views/PopupMain.js'
import LiveFeed from './views/LiveFeed.js'
import FluxView from './views/FluxView.js'
import AlertsView from './views/AlertsView.js'
import ReportView from './views/ReportView.js'
import SettingsView from './views/SettingsView.js'

export type View = 'main' | 'live' | 'flux' | 'alerts' | 'report' | 'settings'

export default function App(): JSX.Element {
  const [view, setView] = useState<View>('main')

  return (
    <div className="flex h-full min-h-[480px] bg-surface">
      {view === 'main' && <PopupMain onNavigate={setView} />}
      {view === 'live' && <LiveFeed onNavigate={setView} />}
      {view === 'flux' && <FluxView onNavigate={setView} />}
      {view === 'alerts' && <AlertsView onNavigate={setView} />}
      {view === 'report' && <ReportView onNavigate={setView} />}
      {view === 'settings' && <SettingsView onNavigate={setView} />}
    </div>
  )
}
