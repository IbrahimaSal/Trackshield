import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import type { EventBatchDto } from '@trackshield/shared-types'
import { EventsService } from '../events/events.service.js'
import type { IEventsRepository } from '../events/ports/events.repository.js'

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeRepoStub = () =>
  ({
    sessionExists: vi.fn(),
    saveTrackerEvents: vi.fn(),
    savePiiEvents: vi.fn(),
  }) as unknown as IEventsRepository

const makeTrackerBatch = (sessionId = 'session-123'): EventBatchDto => ({
  sessionId,
  domain: 'example.com',
  timestamp: Date.now(),
  events: [
    {
      kind: 'tracker',
      data: {
        domain: 'doubleclick.net',
        category: 'advertising',
        company: 'Google',
        requestCount: 3,
      },
    },
  ],
})

const makePiiBatch = (sessionId = 'session-123'): EventBatchDto => ({
  sessionId,
  domain: 'example.com',
  timestamp: Date.now(),
  events: [
    {
      kind: 'pii',
      data: {
        type: 'EMAIL',
        maskedValue: 'j***@gmail.com',
        destination: 'doubleclick.net',
        timestamp: Date.now(),
      },
    },
  ],
})

const makeMixedBatch = (sessionId = 'session-123'): EventBatchDto => ({
  sessionId,
  domain: 'example.com',
  timestamp: Date.now(),
  events: [
    {
      kind: 'tracker',
      data: {
        domain: 'google-analytics.com',
        category: 'analytics',
        company: 'Google',
        requestCount: 1,
      },
    },
    {
      kind: 'pii',
      data: {
        type: 'TEL',
        maskedValue: '+33 6 •• •• •• ••',
        destination: 'facebook.com',
        timestamp: Date.now(),
      },
    },
  ],
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('EventsService', () => {
  let service: EventsService
  let repo: ReturnType<typeof makeRepoStub>

  beforeEach(() => {
    repo = makeRepoStub()
    service = new EventsService(repo)
    vi.clearAllMocks()
  })

  describe('processEventBatch — validation session', () => {
    it('lève NotFoundException quand la session est inconnue', async () => {
      vi.mocked(repo.sessionExists).mockResolvedValue(false)

      await expect(service.processEventBatch(makeTrackerBatch('session-inconnue'))).rejects.toThrow(
        NotFoundException,
      )
    })

    it("vérifie l'existence de la session avant de persister quoi que ce soit", async () => {
      vi.mocked(repo.sessionExists).mockResolvedValue(false)

      await service.processEventBatch(makeTrackerBatch('session-inconnue')).catch(() => {})

      expect(repo.saveTrackerEvents).not.toHaveBeenCalled()
      expect(repo.savePiiEvents).not.toHaveBeenCalled()
    })

    it("appelle sessionExists avec l'id de session du batch", async () => {
      vi.mocked(repo.sessionExists).mockResolvedValue(true)
      vi.mocked(repo.saveTrackerEvents).mockResolvedValue()
      vi.mocked(repo.savePiiEvents).mockResolvedValue()

      await service.processEventBatch(makeTrackerBatch('session-abc'))

      expect(repo.sessionExists).toHaveBeenCalledWith('session-abc')
    })
  })

  describe('processEventBatch — persistence trackers', () => {
    it('persiste les events de type tracker quand la session existe', async () => {
      vi.mocked(repo.sessionExists).mockResolvedValue(true)
      vi.mocked(repo.saveTrackerEvents).mockResolvedValue()
      vi.mocked(repo.savePiiEvents).mockResolvedValue()

      await service.processEventBatch(makeTrackerBatch())

      expect(repo.saveTrackerEvents).toHaveBeenCalledOnce()
    })

    it("n'appelle pas savePiiEvents si le batch ne contient que des trackers", async () => {
      vi.mocked(repo.sessionExists).mockResolvedValue(true)
      vi.mocked(repo.saveTrackerEvents).mockResolvedValue()

      await service.processEventBatch(makeTrackerBatch())

      expect(repo.savePiiEvents).not.toHaveBeenCalled()
    })

    it('transmet le sessionId et les données tracker au repository', async () => {
      vi.mocked(repo.sessionExists).mockResolvedValue(true)
      vi.mocked(repo.saveTrackerEvents).mockResolvedValue()

      const batch = makeTrackerBatch('session-xyz')
      await service.processEventBatch(batch)

      const [sessionId, trackers] = vi.mocked(repo.saveTrackerEvents).mock.calls[0]!
      expect(sessionId).toBe('session-xyz')
      expect(trackers).toHaveLength(1)
      expect(trackers[0]?.domain).toBe('doubleclick.net')
    })
  })

  describe('processEventBatch — persistence PII', () => {
    it('persiste les events de type pii quand la session existe', async () => {
      vi.mocked(repo.sessionExists).mockResolvedValue(true)
      vi.mocked(repo.savePiiEvents).mockResolvedValue()
      vi.mocked(repo.saveTrackerEvents).mockResolvedValue()

      await service.processEventBatch(makePiiBatch())

      expect(repo.savePiiEvents).toHaveBeenCalledOnce()
    })

    it("n'appelle pas saveTrackerEvents si le batch ne contient que des PII", async () => {
      vi.mocked(repo.sessionExists).mockResolvedValue(true)
      vi.mocked(repo.savePiiEvents).mockResolvedValue()

      await service.processEventBatch(makePiiBatch())

      expect(repo.saveTrackerEvents).not.toHaveBeenCalled()
    })

    it('transmet le sessionId et les données PII au repository avec la valeur masquée', async () => {
      vi.mocked(repo.sessionExists).mockResolvedValue(true)
      vi.mocked(repo.savePiiEvents).mockResolvedValue()

      const batch = makePiiBatch('session-xyz')
      await service.processEventBatch(batch)

      const [sessionId, piis] = vi.mocked(repo.savePiiEvents).mock.calls[0]!
      expect(sessionId).toBe('session-xyz')
      expect(piis).toHaveLength(1)
      expect(piis[0]?.maskedValue).toBe('j***@gmail.com')
    })
  })

  describe('processEventBatch — batch mixte', () => {
    it('persiste trackers et PII quand le batch contient les deux kinds', async () => {
      vi.mocked(repo.sessionExists).mockResolvedValue(true)
      vi.mocked(repo.saveTrackerEvents).mockResolvedValue()
      vi.mocked(repo.savePiiEvents).mockResolvedValue()

      await service.processEventBatch(makeMixedBatch())

      expect(repo.saveTrackerEvents).toHaveBeenCalledOnce()
      expect(repo.savePiiEvents).toHaveBeenCalledOnce()
    })
  })

  describe('processEventBatch — batch vide', () => {
    it("n'appelle aucun repository si le batch ne contient aucun event", async () => {
      vi.mocked(repo.sessionExists).mockResolvedValue(true)

      await service.processEventBatch({
        sessionId: 'session-123',
        domain: 'example.com',
        timestamp: Date.now(),
        events: [],
      })

      expect(repo.saveTrackerEvents).not.toHaveBeenCalled()
      expect(repo.savePiiEvents).not.toHaveBeenCalled()
    })
  })
})
