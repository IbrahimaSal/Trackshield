import { render, screen, fireEvent } from '@testing-library/react'
import { useSessionStore } from '../../stores/session.store.js'
import FluxView from '../FluxView.js'
import type { PiiDetection } from '@trackshield/shared-types'

const PII_EMAIL: PiiDetection = {
  type: 'EMAIL',
  maskedValue: 'j••••@gmail.com',
  destination: 'pixel.facebook.com',
  timestamp: 1000,
}

const PII_PHONE: PiiDetection = {
  type: 'TEL',
  maskedValue: '+336••••5678',
  destination: 'pixel.facebook.com',
  timestamp: 2000,
}

const PII_ID: PiiDetection = {
  type: 'ID_PUB',
  maskedValue: 'ga-••••••••',
  destination: 'google-analytics.com',
  timestamp: 3000,
}

const mockNavigate = vi.fn()

beforeEach(() => {
  useSessionStore.setState({ trackers: [], piis: [], score: null, currentDomain: null })
  mockNavigate.mockReset()
})

describe('FluxView', () => {
  it("affiche le message vide quand aucune PII n'est détectée", () => {
    render(<FluxView onNavigate={mockNavigate} />)
    expect(screen.getByText(/aucune donnée transmise détectée/i)).toBeInTheDocument()
  })

  it("affiche la valeur masquée de chaque PII", () => {
    useSessionStore.setState({ piis: [PII_EMAIL, PII_PHONE] })
    render(<FluxView onNavigate={mockNavigate} />)
    expect(screen.getByText('j••••@gmail.com')).toBeInTheDocument()
    expect(screen.getByText('+336••••5678')).toBeInTheDocument()
  })

  it("groupe les PII par domaine destinataire", () => {
    useSessionStore.setState({ piis: [PII_EMAIL, PII_PHONE, PII_ID] })
    render(<FluxView onNavigate={mockNavigate} />)
    // pixel.facebook.com doit apparaître une seule fois comme groupe
    const facebookHeaders = screen.getAllByText(/pixel\.facebook\.com/)
    expect(facebookHeaders.length).toBe(1)
    // google-analytics.com doit aussi apparaître une fois
    const googleHeaders = screen.getAllByText(/google-analytics\.com/)
    expect(googleHeaders.length).toBe(1)
  })

  it("affiche le domaine destinataire pour chaque groupe", () => {
    useSessionStore.setState({ piis: [PII_ID] })
    render(<FluxView onNavigate={mockNavigate} />)
    expect(screen.getByText(/google-analytics\.com/)).toBeInTheDocument()
  })

  it("n'affiche pas le message vide quand des PII sont présentes", () => {
    useSessionStore.setState({ piis: [PII_EMAIL] })
    render(<FluxView onNavigate={mockNavigate} />)
    expect(screen.queryByText(/aucune donnée transmise détectée/i)).not.toBeInTheDocument()
  })

  it("le bouton retour appelle onNavigate avec 'main'", () => {
    render(<FluxView onNavigate={mockNavigate} />)
    fireEvent.click(screen.getByText(/retour/i))
    expect(mockNavigate).toHaveBeenCalledWith('main')
  })
})
