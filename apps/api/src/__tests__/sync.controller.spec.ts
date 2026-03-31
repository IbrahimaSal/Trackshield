import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import request from 'supertest'
import { SyncController } from '../sync/sync.controller.js'
import { SyncService } from '../sync/sync.service.js'
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js'
import type { HistoryResult } from '../sync/ports/sync.repository.js'

const FAKE_USER_ID = 'user-xyz'

const FAKE_HISTORY: HistoryResult = {
  sessions: [
    {
      id: 'session-1',
      domain: 'example.com',
      url: 'https://example.com',
      grade: 'B',
      score: 75,
      startedAt: new Date('2024-01-01'),
      trackers: [],
      piis: [],
    },
  ],
  total: 1,
}

class FakeJwtGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<{ user: { id: string } }>()
    req.user = { id: FAKE_USER_ID }
    return true
  }
}

class BlockJwtGuard implements CanActivate {
  canActivate(): boolean {
    throw new UnauthorizedException()
  }
}

describe('SyncController (Supertest)', () => {
  let appWithAuth: INestApplication
  let appWithoutAuth: INestApplication
  let mockSyncService: {
    getHistory: ReturnType<typeof vi.fn>
    deleteUserData: ReturnType<typeof vi.fn>
  }

  beforeEach(async () => {
    mockSyncService = {
      getHistory: vi.fn(),
      deleteUserData: vi.fn(),
    }

    const moduleWithAuth: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [{ provide: SyncService, useValue: mockSyncService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(FakeJwtGuard)
      .compile()

    appWithAuth = moduleWithAuth.createNestApplication()
    appWithAuth.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
    appWithAuth.setGlobalPrefix('api')
    await appWithAuth.init()

    const moduleWithoutAuth: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [{ provide: SyncService, useValue: mockSyncService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(BlockJwtGuard)
      .compile()

    appWithoutAuth = moduleWithoutAuth.createNestApplication()
    appWithoutAuth.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
    appWithoutAuth.setGlobalPrefix('api')
    await appWithoutAuth.init()
  })

  afterEach(async () => {
    await appWithAuth.close()
    await appWithoutAuth.close()
  })

  describe('GET /api/sync/history', () => {
    it("retourne 200 et l'historique des sessions quand le token JWT est valide", async () => {
      mockSyncService.getHistory.mockResolvedValue(FAKE_HISTORY)

      const res = await request(appWithAuth.getHttpServer())
        .get('/api/sync/history')
        .set('Authorization', 'Bearer fake-token')

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({ total: 1, sessions: [{ id: 'session-1' }] })
    })

    it("délègue au service avec la pagination correcte depuis les query params", async () => {
      mockSyncService.getHistory.mockResolvedValue({ sessions: [], total: 0 })

      await request(appWithAuth.getHttpServer())
        .get('/api/sync/history?limit=5&offset=10')
        .set('Authorization', 'Bearer fake-token')

      expect(mockSyncService.getHistory).toHaveBeenCalledWith(FAKE_USER_ID, { limit: 5, offset: 10 })
    })

    it("retourne 401 quand aucun token JWT n'est fourni", async () => {
      const res = await request(appWithoutAuth.getHttpServer())
        .get('/api/sync/history')

      expect(res.status).toBe(401)
    })
  })

  describe('DELETE /api/sync/data', () => {
    it("retourne 204 et supprime les données quand le token JWT est valide", async () => {
      mockSyncService.deleteUserData.mockResolvedValue(undefined)

      const res = await request(appWithAuth.getHttpServer())
        .delete('/api/sync/data')
        .set('Authorization', 'Bearer fake-token')

      expect(res.status).toBe(204)
      expect(mockSyncService.deleteUserData).toHaveBeenCalledWith(FAKE_USER_ID)
    })

    it("retourne 401 quand aucun token JWT n'est fourni", async () => {
      const res = await request(appWithoutAuth.getHttpServer())
        .delete('/api/sync/data')

      expect(res.status).toBe(401)
    })
  })
})
