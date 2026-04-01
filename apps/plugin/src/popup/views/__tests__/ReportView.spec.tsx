import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSessionStore } from '../../stores/session.store.js'
import ReportView from '../ReportView.js'

const ANALYZER_URL = 'http://test-analyzer'

const mockReport = {
  url: 'https://example.com',
  grade: 'B',
  score: 72.5,
  trackers: [{ name: 'Google Analytics', category: 'analytics', url: 'analytics.google.com' }],
  piis: [{ type: 'EMAIL', maskedValue: 'j••••@gmail.com', destination: 'pixel.facebook.com', timestamp: 1000 }],
  summary: "Le site transfère des données publicitaires.",
  recommendations: ["Bloquer les pixels tiers.", "Utiliser un consent manager."],
}

const mockNavigate = vi.fn()

beforeEach(() => {
  mockNavigate.mockReset()
  useSessionStore.setState({
    currentDomain: 'example.com',
    trackers: [],
    piis: [],
    score: null,
  })
  global.chrome = {
    storage: { local: { get: vi.fn().mockResolvedValue({ analyzerUrl: ANALYZER_URL }) } },
  } as unknown as typeof chrome
  vi.stubGlobal('fetch', vi.fn())
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn().mockReturnValue('blob:mock'),
    revokeObjectURL: vi.fn(),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ReportView', () => {
  it("affiche le bouton Générer à l'état initial", () => {
    render(<ReportView onNavigate={mockNavigate} />)
    expect(screen.getByRole('button', { name: /générer/i })).toBeInTheDocument()
  })

  it("affiche un état de chargement pendant la requête", async () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}))
    render(<ReportView onNavigate={mockNavigate} />)
    fireEvent.click(screen.getByRole('button', { name: /générer/i }))
    await waitFor(() => {
      expect(screen.getByText(/chargement/i)).toBeInTheDocument()
    })
  })

  it("affiche le grade et le score après une réponse réussie", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockReport,
    } as Response)
    render(<ReportView onNavigate={mockNavigate} />)
    fireEvent.click(screen.getByRole('button', { name: /générer/i }))
    await waitFor(() => {
      expect(screen.getByText('B')).toBeInTheDocument()
      expect(screen.getByText(/72\.5/)).toBeInTheDocument()
    })
  })

  it("affiche les recommandations du rapport", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockReport,
    } as Response)
    render(<ReportView onNavigate={mockNavigate} />)
    fireEvent.click(screen.getByRole('button', { name: /générer/i }))
    await waitFor(() => {
      expect(screen.getByText(/Bloquer les pixels tiers/)).toBeInTheDocument()
    })
  })

  it("affiche un message d'erreur si l'analyzer est indisponible", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))
    render(<ReportView onNavigate={mockNavigate} />)
    fireEvent.click(screen.getByRole('button', { name: /générer/i }))
    await waitFor(() => {
      expect(screen.getByText(/indisponible/i)).toBeInTheDocument()
    })
  })

  it("affiche les données locales en mode dégradé si l'analyzer échoue", async () => {
    useSessionStore.setState({
      currentDomain: 'example.com',
      trackers: [{ domain: 'pixel.facebook.com', company: 'Facebook', category: 'advertising', requestCount: 1 }],
      piis: [{ type: 'TEL', maskedValue: '+336••••', destination: 'fb.com', timestamp: 1000 }],
      score: { grade: 'D', score: 35, breakdown: { trackers: 1, pii: 1, cookies: 0, destinations: 0 } },
    })
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))
    render(<ReportView onNavigate={mockNavigate} />)
    fireEvent.click(screen.getByRole('button', { name: /générer/i }))
    await waitFor(() => {
      expect(screen.getByText('D')).toBeInTheDocument()
    })
  })

  it("affiche le bouton Télécharger HTML après un rapport réussi", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockReport,
    } as Response)
    render(<ReportView onNavigate={mockNavigate} />)
    fireEvent.click(screen.getByRole('button', { name: /générer/i }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /télécharger/i })).toBeInTheDocument()
    })
  })

  it("le bouton retour appelle onNavigate avec 'main'", () => {
    render(<ReportView onNavigate={mockNavigate} />)
    fireEvent.click(screen.getByText(/retour/i))
    expect(mockNavigate).toHaveBeenCalledWith('main')
  })
})
