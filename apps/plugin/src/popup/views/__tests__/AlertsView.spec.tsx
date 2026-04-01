import { render, screen, fireEvent } from '@testing-library/react'
import { useAlertsStore } from '../../stores/alerts.store.js'
import AlertsView from '../AlertsView.js'
import type { PiiDetection } from '@trackshield/shared-types'

const PII_EMAIL: PiiDetection = {
  type: 'EMAIL',
  maskedValue: 'j••••@gmail.com',
  destination: 'pixel.facebook.com',
  timestamp: 1000,
}

const PII_TEL: PiiDetection = {
  type: 'TEL',
  maskedValue: '+336••••5678',
  destination: 'analytics.google.com',
  timestamp: 2000,
}

const mockNavigate = vi.fn()

beforeEach(() => {
  useAlertsStore.setState({ alerts: [], unreadCount: 0 })
  mockNavigate.mockReset()
})

describe('AlertsView', () => {
  it("affiche le message vide quand aucune alerte n'est présente", () => {
    render(<AlertsView onNavigate={mockNavigate} />)
    expect(screen.getByText(/aucune alerte pour cette session/i)).toBeInTheDocument()
  })

  it("affiche la valeur masquée de chaque alerte", () => {
    useAlertsStore.setState({
      alerts: [
        { id: '1', pii: PII_EMAIL, read: false, timestamp: 1000 },
        { id: '2', pii: PII_TEL, read: false, timestamp: 2000 },
      ],
      unreadCount: 2,
    })
    render(<AlertsView onNavigate={mockNavigate} />)
    expect(screen.getByText('j••••@gmail.com')).toBeInTheDocument()
    expect(screen.getByText('+336••••5678')).toBeInTheDocument()
  })

  it("affiche le domaine destinataire de chaque alerte", () => {
    useAlertsStore.setState({
      alerts: [{ id: '1', pii: PII_EMAIL, read: false, timestamp: 1000 }],
      unreadCount: 1,
    })
    render(<AlertsView onNavigate={mockNavigate} />)
    expect(screen.getByText(/pixel\.facebook\.com/)).toBeInTheDocument()
  })

  it("trie les alertes par timestamp décroissant (la plus récente en premier)", () => {
    useAlertsStore.setState({
      alerts: [
        { id: '1', pii: PII_EMAIL, read: false, timestamp: 1000 },
        { id: '2', pii: PII_TEL, read: false, timestamp: 2000 },
      ],
      unreadCount: 2,
    })
    render(<AlertsView onNavigate={mockNavigate} />)
    const values = screen.getAllByTestId('masked-value')
    expect(values[0]).toHaveTextContent('+336••••5678')
    expect(values[1]).toHaveTextContent('j••••@gmail.com')
  })

  it("le bouton effacer vide le store d'alertes", () => {
    useAlertsStore.setState({
      alerts: [{ id: '1', pii: PII_EMAIL, read: false, timestamp: 1000 }],
      unreadCount: 1,
    })
    render(<AlertsView onNavigate={mockNavigate} />)
    fireEvent.click(screen.getByText(/effacer les alertes/i))
    expect(useAlertsStore.getState().alerts).toHaveLength(0)
  })

  it("n'affiche pas le bouton effacer quand le store est vide", () => {
    render(<AlertsView onNavigate={mockNavigate} />)
    expect(screen.queryByText(/effacer les alertes/i)).not.toBeInTheDocument()
  })

  it("le bouton retour appelle onNavigate avec 'main'", () => {
    render(<AlertsView onNavigate={mockNavigate} />)
    fireEvent.click(screen.getByText(/retour/i))
    expect(mockNavigate).toHaveBeenCalledWith('main')
  })
})
