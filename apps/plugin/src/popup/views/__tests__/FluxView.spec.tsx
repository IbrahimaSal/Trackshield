import { render, screen, fireEvent } from '@testing-library/react'
import { useSessionStore } from '../../stores/session.store.js'
import FluxView from '../FluxView.js'
import type { PiiDetection, TrackerMatch } from '@trackshield/shared-types'

const TRACKER: TrackerMatch = {
  domain: 'google-analytics.com',
  category: 'analytics',
  company: 'Google Analytics',
  requestCount: 1,
}

const TRACKER_FB: TrackerMatch = {
  domain: 'pixel.facebook.com',
  category: 'advertising',
  company: 'Meta',
  requestCount: 3,
}

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

describe('FluxView — état vide', () => {
  it("affiche le message vide quand aucun tracker ni PII n'est détecté", () => {
    render(<FluxView onNavigate={mockNavigate} />)
    expect(screen.getByText(/aucun flux détecté/i)).toBeInTheDocument()
  })

  it("n'affiche pas le message vide quand des trackers sont présents", () => {
    useSessionStore.setState({ trackers: [TRACKER] })
    render(<FluxView onNavigate={mockNavigate} />)
    expect(screen.queryByText(/aucun flux détecté/i)).not.toBeInTheDocument()
  })
})

describe('FluxView — section trackers', () => {
  it("affiche le nom de l'entreprise du tracker", () => {
    useSessionStore.setState({ trackers: [TRACKER] })
    render(<FluxView onNavigate={mockNavigate} />)
    expect(screen.getByText('Google Analytics')).toBeInTheDocument()
  })

  it("affiche le domaine du tracker", () => {
    useSessionStore.setState({ trackers: [TRACKER] })
    render(<FluxView onNavigate={mockNavigate} />)
    expect(screen.getByText('google-analytics.com')).toBeInTheDocument()
  })

  it("affiche plusieurs trackers", () => {
    useSessionStore.setState({ trackers: [TRACKER, TRACKER_FB] })
    render(<FluxView onNavigate={mockNavigate} />)
    expect(screen.getByText('Google Analytics')).toBeInTheDocument()
    expect(screen.getByText('Meta')).toBeInTheDocument()
  })
})

describe('FluxView — section PIIs', () => {
  it("affiche la valeur masquée de chaque PII", () => {
    useSessionStore.setState({ piis: [PII_EMAIL, PII_PHONE] })
    render(<FluxView onNavigate={mockNavigate} />)
    expect(screen.getByText('j••••@gmail.com')).toBeInTheDocument()
    expect(screen.getByText('+336••••5678')).toBeInTheDocument()
  })

  it("groupe les PII par domaine destinataire", () => {
    useSessionStore.setState({ piis: [PII_EMAIL, PII_PHONE, PII_ID] })
    render(<FluxView onNavigate={mockNavigate} />)
    const facebookHeaders = screen.getAllByText(/pixel\.facebook\.com/)
    expect(facebookHeaders.length).toBe(1)
    const googleHeaders = screen.getAllByText(/google-analytics\.com/)
    expect(googleHeaders.length).toBe(1)
  })

  it("n'affiche pas le message vide quand des PIIs sont présentes", () => {
    useSessionStore.setState({ piis: [PII_EMAIL] })
    render(<FluxView onNavigate={mockNavigate} />)
    expect(screen.queryByText(/aucun flux détecté/i)).not.toBeInTheDocument()
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
    const container = screen.getByText('j••••@gmail.com').closest('[class]')!
    const phoneEl = screen.getByText('+336••••5678').closest('[class]')!
    expect(container.compareDocumentPosition(phoneEl)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })
})

describe('FluxView — navigation', () => {
  it("le bouton retour appelle onNavigate avec 'main'", () => {
    render(<FluxView onNavigate={mockNavigate} />)
    fireEvent.click(screen.getByText(/retour/i))
    expect(mockNavigate).toHaveBeenCalledWith('main')
  })
})
