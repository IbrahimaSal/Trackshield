import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import request from 'supertest'
import { EventsController } from '../events/events.controller.js'
import { EventsService } from '../events/events.service.js'
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js'

const FAKE_USER_ID = 'user-abc'

const VALID_BATCH = {
  sessionId: 'session-123',
  events: [
    {
      kind: 'tracker',
      data: {
        domain: 'doubleclick.net',
        url: 'https://doubleclick.net/track',
        category: 'advertising',
        name: 'DoubleClick',
      },
    },
  ],
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

describe('EventsController (Supertest)', () => {
  let appWithAuth: INestApplication
  let appWithoutAuth: INestApplication
  let mockEventsService: {
    processEventBatch: ReturnType<typeof vi.fn>
  }

  beforeEach(async () => {
    mockEventsService = {
      processEventBatch: vi.fn(),
    }

    const moduleWithAuth: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [{ provide: EventsService, useValue: mockEventsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(FakeJwtGuard)
      .compile()

    appWithAuth = moduleWithAuth.createNestApplication()
    appWithAuth.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
    appWithAuth.setGlobalPrefix('api')
    await appWithAuth.init()

    const moduleWithoutAuth: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [{ provide: EventsService, useValue: mockEventsService }],
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

  describe('POST /api/events', () => {
    it("retourne 201 quand le batch d'events est ingéré avec succès", async () => {
      mockEventsService.processEventBatch.mockResolvedValue(undefined)

      const res = await request(appWithAuth.getHttpServer())
        .post('/api/events')
        .set('Authorization', 'Bearer fake-token')
        .send(VALID_BATCH)

      expect(res.status).toBe(201)
    })

    it("retourne 401 quand aucun token JWT n'est fourni", async () => {
      const res = await request(appWithoutAuth.getHttpServer())
        .post('/api/events')
        .send(VALID_BATCH)

      expect(res.status).toBe(401)
    })

    it("retourne 404 quand la session n'existe pas", async () => {
      const { NotFoundException } = await import('@nestjs/common')
      mockEventsService.processEventBatch.mockRejectedValue(
        new NotFoundException('Session session-999 not found'),
      )

      const res = await request(appWithAuth.getHttpServer())
        .post('/api/events')
        .set('Authorization', 'Bearer fake-token')
        .send({ ...VALID_BATCH, sessionId: 'session-999' })

      expect(res.status).toBe(404)
    })
  })
})
