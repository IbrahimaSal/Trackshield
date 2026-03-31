import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SyncService } from '../sync/sync.service.js'
import type { ISyncRepository } from '../sync/ports/sync.repository.js'
import type { SessionSummary, PiiSummary, TrackerSummary } from '../sync/ports/sync.repository.js'

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeRepoStub = () =>
  ({
    getSessionHistory: vi.fn(),
    deleteUserData: vi.fn(),
  }) as unknown as ISyncRepository

const makePiiSummary = (overrides?: Partial<PiiSummary>): PiiSummary => ({
  type: 'EMAIL',
  destination: 'doubleclick.net',
  timestamp: 1711900000000,
  ...overrides,
})

const makeTrackerSummary = (overrides?: Partial<TrackerSummary>): TrackerSummary => ({
  domain: 'doubleclick.net',
  category: 'advertising',
  company: 'Google',
  requestCount: 3,
  ...overrides,
})

const makeSessionSummary = (overrides?: Partial<SessionSummary>): SessionSummary => ({
  id: 'session-123',
  domain: 'example.com',
  url: 'https://example.com',
  grade: 'C',
  score: 45,
  startedAt: new Date('2024-01-15T10:00:00Z'),
  trackers: [makeTrackerSummary()],
  piis: [makePiiSummary()],
  ...overrides,
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SyncService', () => {
  let service: SyncService
  let repo: ReturnType<typeof makeRepoStub>

  beforeEach(() => {
    repo = makeRepoStub()
    service = new SyncService(repo)
    vi.clearAllMocks()
  })

  describe('getHistory', () => {
    it("retourne l'historique paginé de l'utilisateur connecté", async () => {
      const sessions = [makeSessionSummary(), makeSessionSummary({ id: 'session-456' })]
      vi.mocked(repo.getSessionHistory).mockResolvedValue({ sessions, total: 2 })

      const result = await service.getHistory('user-123', { limit: 20, offset: 0 })

      expect(result.sessions).toHaveLength(2)
      expect(result.total).toBe(2)
    })

    it("délègue au repository avec le userId et les options de pagination", async () => {
      vi.mocked(repo.getSessionHistory).mockResolvedValue({ sessions: [], total: 0 })

      await service.getHistory('user-xyz', { limit: 10, offset: 20 })

      expect(repo.getSessionHistory).toHaveBeenCalledWith('user-xyz', { limit: 10, offset: 20 })
    })

    it("retourne un tableau vide quand il n'y a aucune session", async () => {
      vi.mocked(repo.getSessionHistory).mockResolvedValue({ sessions: [], total: 0 })

      const result = await service.getHistory('user-123', { limit: 20, offset: 0 })

      expect(result.sessions).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    it("n'expose jamais maskedValue dans les PII retournées", async () => {
      const session = makeSessionSummary()
      vi.mocked(repo.getSessionHistory).mockResolvedValue({ sessions: [session], total: 1 })

      const result = await service.getHistory('user-123', { limit: 20, offset: 0 })

      const pii = result.sessions[0]?.piis[0]
      expect(pii).toBeDefined()
      expect(pii).not.toHaveProperty('maskedValue')
    })

    it('respecte la limite de pagination transmise au repository', async () => {
      vi.mocked(repo.getSessionHistory).mockResolvedValue({ sessions: [], total: 0 })

      await service.getHistory('user-123', { limit: 5, offset: 0 })

      expect(repo.getSessionHistory).toHaveBeenCalledWith('user-123', { limit: 5, offset: 0 })
    })

    it("isole les sessions par userId — ne retourne pas les sessions d'un autre utilisateur", async () => {
      vi.mocked(repo.getSessionHistory).mockResolvedValue({ sessions: [], total: 0 })

      await service.getHistory('user-alice', { limit: 20, offset: 0 })

      const callArgs = vi.mocked(repo.getSessionHistory).mock.calls[0]!
      expect(callArgs[0]).toBe('user-alice')
    })
  })

  describe('deleteUserData', () => {
    it("supprime toutes les données de l'utilisateur sans retourner de données", async () => {
      vi.mocked(repo.deleteUserData).mockResolvedValue()

      await expect(service.deleteUserData('user-123')).resolves.toBeUndefined()
    })

    it("délègue la suppression au repository avec le userId correct", async () => {
      vi.mocked(repo.deleteUserData).mockResolvedValue()

      await service.deleteUserData('user-xyz')

      expect(repo.deleteUserData).toHaveBeenCalledWith('user-xyz')
    })

    it("n'appelle pas getSessionHistory lors d'une suppression", async () => {
      vi.mocked(repo.deleteUserData).mockResolvedValue()

      await service.deleteUserData('user-123')

      expect(repo.getSessionHistory).not.toHaveBeenCalled()
    })
  })
})
