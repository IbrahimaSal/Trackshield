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

  it("affiche ×2 pour deux détections identiques vers la même destination", () => {
    const DUP: PiiDetection = { ...PII_EMAIL }
    useSessionStore.setState({ piis: [PII_EMAIL, DUP] })
    render(<FluxView onNavigate={mockNavigate} />)
    expect(screen.getByText('×2')).toBeInTheDocument()
  })

  it("n'affiche qu'une seule ligne pour des PIIs identiques vers la même destination", () => {
    const DUP: PiiDetection = { ...PII_EMAIL }
    useSessionStore.setState({ piis: [PII_EMAIL, DUP] })
    render(<FluxView onNavigate={mockNavigate} />)
    expect(screen.getAllByText('j••••@gmail.com')).toHaveLength(1)
  })

  it("n'affiche pas ×1 pour les entrées non dupliquées", () => {
    useSessionStore.setState({ piis: [PII_EMAIL] })
    render(<FluxView onNavigate={mockNavigate} />)
    expect(screen.queryByText('×1')).not.toBeInTheDocument()
  })

  it("trie les entrées par nombre d'occurrences décroissant dans un groupe", () => {
    const DUP_EMAIL: PiiDetection = { ...PII_EMAIL }
    useSessionStore.setState({ piis: [PII_PHONE, PII_EMAIL, DUP_EMAIL] })
    render(<FluxView onNavigate={mockNavigate} />)
    // EMAIL est dupliqué (×2), il doit apparaître avant PHONE (pas de compteur)
    const container = screen.getByText('j••••@gmail.com').closest('[class]')!
    const phoneEl = screen.getByText('+336••••5678').closest('[class]')!
    expect(container.compareDocumentPosition(phoneEl)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })
})
