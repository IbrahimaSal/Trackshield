import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSyncStore } from '../../stores/sync.store.js'
import SettingsView from '../SettingsView.js'

const mockNavigate = vi.fn()

beforeEach(() => {
  mockNavigate.mockReset()
  useSyncStore.setState({ enabled: false, consentGiven: false, lastSyncAt: null })
  global.chrome = {
    storage: {
      local: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
      },
    },
  } as unknown as typeof chrome
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('SettingsView', () => {
  it("affiche le toggle sync désactivé par défaut", () => {
    render(<SettingsView onNavigate={mockNavigate} />)
    const toggle = screen.getByRole('checkbox', { name: /synchronisation/i })
    expect(toggle).not.toBeChecked()
  })

  it("ouvre la modale de consentement quand on active le toggle", () => {
    render(<SettingsView onNavigate={mockNavigate} />)
    fireEvent.click(screen.getByRole('checkbox', { name: /synchronisation/i }))
    expect(screen.getByText(/données synchronisées/i)).toBeInTheDocument()
  })

  it("n'active pas la sync avant confirmation dans la modale", () => {
    render(<SettingsView onNavigate={mockNavigate} />)
    fireEvent.click(screen.getByRole('checkbox', { name: /synchronisation/i }))
    expect(useSyncStore.getState().enabled).toBe(false)
  })

  it("active la sync et ferme la modale après confirmation", async () => {
    render(<SettingsView onNavigate={mockNavigate} />)
    fireEvent.click(screen.getByRole('checkbox', { name: /synchronisation/i }))
    fireEvent.click(screen.getByRole('button', { name: /j'accepte/i }))
    await waitFor(() => {
      expect(useSyncStore.getState().enabled).toBe(true)
      expect(useSyncStore.getState().consentGiven).toBe(true)
      expect(screen.queryByText(/données synchronisées/i)).not.toBeInTheDocument()
    })
  })

  it("ferme la modale sans activer la sync si on annule", () => {
    render(<SettingsView onNavigate={mockNavigate} />)
    fireEvent.click(screen.getByRole('checkbox', { name: /synchronisation/i }))
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }))
    expect(useSyncStore.getState().enabled).toBe(false)
    expect(screen.queryByText(/données synchronisées/i)).not.toBeInTheDocument()
  })

  it("désactive la sync directement sans modale si elle était activée", () => {
    useSyncStore.setState({ enabled: true, consentGiven: true, lastSyncAt: null })
    render(<SettingsView onNavigate={mockNavigate} />)
    fireEvent.click(screen.getByRole('checkbox', { name: /synchronisation/i }))
    expect(useSyncStore.getState().enabled).toBe(false)
    expect(screen.queryByText(/données synchronisées/i)).not.toBeInTheDocument()
  })

  it("affiche toujours le lien de suppression des données", () => {
    render(<SettingsView onNavigate={mockNavigate} />)
    expect(screen.getByText(/supprimer toutes mes données/i)).toBeInTheDocument()
  })

  it("appelle DELETE /api/sync/data quand on supprime les données", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response)
    render(<SettingsView onNavigate={mockNavigate} />)
    fireEvent.click(screen.getByText(/supprimer toutes mes données/i))
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/sync/data'),
        expect.objectContaining({ method: 'DELETE' }),
      )
    })
  })

  it("persiste l'état sync dans chrome.storage.local après confirmation", async () => {
    render(<SettingsView onNavigate={mockNavigate} />)
    fireEvent.click(screen.getByRole('checkbox', { name: /synchronisation/i }))
    fireEvent.click(screen.getByRole('button', { name: /j'accepte/i }))
    await waitFor(() => {
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({ syncEnabled: true }),
      )
    })
  })

  it("le bouton retour appelle onNavigate avec 'main'", () => {
    render(<SettingsView onNavigate={mockNavigate} />)
    fireEvent.click(screen.getByText(/retour/i))
    expect(mockNavigate).toHaveBeenCalledWith('main')
  })
})
