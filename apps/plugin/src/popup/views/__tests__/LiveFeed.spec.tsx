import { render, screen, fireEvent } from '@testing-library/react'
import { useSessionStore } from '../../stores/session.store.js'
import LiveFeed from '../LiveFeed.js'
import type { TrackerMatch } from '@trackshield/shared-types'

const TRACKER_GOOGLE: TrackerMatch = {
  domain: 'google-analytics.com',
  category: 'analytics',
  company: 'Google',
  requestCount: 3,
}

const TRACKER_FB: TrackerMatch = {
  domain: 'facebook.com',
  category: 'advertising',
  company: 'Meta',
  requestCount: 1,
}

const mockNavigate = vi.fn()

beforeEach(() => {
  useSessionStore.setState({ trackers: [], piis: [], score: null, currentDomain: null })
  mockNavigate.mockReset()
})

describe('LiveFeed', () => {
  it("affiche le message vide quand aucun tracker n'est détecté", () => {
    render(<LiveFeed onNavigate={mockNavigate} />)
    expect(screen.getByText(/aucun tracker détecté/i)).toBeInTheDocument()
  })

  it("affiche la liste des trackers quand le store en contient", () => {
    useSessionStore.setState({ trackers: [TRACKER_GOOGLE, TRACKER_FB] })
    render(<LiveFeed onNavigate={mockNavigate} />)
    expect(screen.getByText('Google')).toBeInTheDocument()
    expect(screen.getByText('Meta')).toBeInTheDocument()
  })

  it("affiche le domaine de chaque tracker", () => {
    useSessionStore.setState({ trackers: [TRACKER_GOOGLE] })
    render(<LiveFeed onNavigate={mockNavigate} />)
    expect(screen.getByText('google-analytics.com')).toBeInTheDocument()
  })

  it("affiche le badge de catégorie pour chaque tracker", () => {
    useSessionStore.setState({ trackers: [TRACKER_GOOGLE] })
    render(<LiveFeed onNavigate={mockNavigate} />)
    expect(screen.getByText('Analytique')).toBeInTheDocument()
  })

  it("le bouton retour appelle onNavigate avec 'main'", () => {
    render(<LiveFeed onNavigate={mockNavigate} />)
    fireEvent.click(screen.getByText(/retour/i))
    expect(mockNavigate).toHaveBeenCalledWith('main')
  })

  it("n'affiche pas le message vide quand des trackers sont présents", () => {
    useSessionStore.setState({ trackers: [TRACKER_GOOGLE] })
    render(<LiveFeed onNavigate={mockNavigate} />)
    expect(screen.queryByText(/aucun tracker détecté/i)).not.toBeInTheDocument()
  })
})
