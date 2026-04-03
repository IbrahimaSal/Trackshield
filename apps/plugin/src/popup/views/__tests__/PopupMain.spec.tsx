import { render, screen } from '@testing-library/react'
import { useSessionStore } from '../../stores/session.store.js'
import PopupMain from '../PopupMain.js'
import type { TrackerMatch, PiiDetection } from '@trackshield/shared-types'

const mockNavigate = vi.fn()

const TRACKER: TrackerMatch = {
  domain: 'google-analytics.com',
  category: 'analytics',
  company: 'Google',
  requestCount: 1,
}

const PII: PiiDetection = {
  type: 'EMAIL',
  maskedValue: 'j••••@gmail.com',
  destination: 'pixel.facebook.com',
  timestamp: 1000,
}

beforeEach(() => {
  useSessionStore.setState({ trackers: [], piis: [], score: null, currentDomain: null })
  mockNavigate.mockReset()
})

describe('PopupMain — état site propre (OkBox)', () => {
  it("affiche l'encart vert quand aucun tracker ni PII", () => {
    render(<PopupMain onNavigate={mockNavigate} />)
    expect(screen.getByText(/ce site respecte votre vie privée/i)).toBeInTheDocument()
  })

  it("affiche l'encart vert même quand des trackers sont détectés (si 0 PII)", () => {
    useSessionStore.setState({ trackers: [TRACKER] })
    render(<PopupMain onNavigate={mockNavigate} />)
    expect(screen.getByText(/ce site respecte votre vie privée/i)).toBeInTheDocument()
  })

  it("n'affiche pas l'encart vert quand des PIIs sont détectées", () => {
    useSessionStore.setState({ piis: [PII] })
    render(<PopupMain onNavigate={mockNavigate} />)
    expect(screen.queryByText(/ce site respecte votre vie privée/i)).not.toBeInTheDocument()
  })

  it("n'affiche pas la section trackers quand aucun tracker", () => {
    render(<PopupMain onNavigate={mockNavigate} />)
    expect(screen.queryByText(/trackers actifs/i)).not.toBeInTheDocument()
  })

  it("affiche la section trackers quand des trackers sont détectés", () => {
    useSessionStore.setState({ trackers: [TRACKER] })
    render(<PopupMain onNavigate={mockNavigate} />)
    expect(screen.getByText(/trackers actifs/i)).toBeInTheDocument()
  })
})
