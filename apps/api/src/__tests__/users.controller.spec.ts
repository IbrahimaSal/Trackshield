import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { UsersController } from '../users/users.controller.js'
import { UsersService } from '../users/users.service.js'
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js'
import { CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'

const FAKE_USER = {
  id: 'user-123',
  email: 'alice@example.com',
  createdAt: new Date('2024-01-01'),
}

class FakeJwtGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<{ user: { id: string } }>()
    req.user = { id: FAKE_USER.id }
    return true
  }
}

class BlockJwtGuard implements CanActivate {
  canActivate(): boolean {
    throw new UnauthorizedException()
  }
}

describe('UsersController (Supertest)', () => {
  let appWithAuth: INestApplication
  let appWithoutAuth: INestApplication
  let mockUsersService: {
    createUser: ReturnType<typeof vi.fn>
    findById: ReturnType<typeof vi.fn>
  }

  beforeEach(async () => {
    mockUsersService = {
      createUser: vi.fn(),
      findById: vi.fn(),
    }

    const moduleWithAuth: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(FakeJwtGuard)
      .compile()

    appWithAuth = moduleWithAuth.createNestApplication()
    appWithAuth.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
    appWithAuth.setGlobalPrefix('api')
    await appWithAuth.init()

    const moduleWithoutAuth: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
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

  describe('POST /api/users', () => {
    it("retourne 201 et le profil utilisateur quand l'inscription réussit", async () => {
      mockUsersService.createUser.mockResolvedValue(FAKE_USER)

      const res = await request(appWithAuth.getHttpServer())
        .post('/api/users')
        .send({ email: 'alice@example.com', password: 'password123' })

      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({ id: 'user-123', email: 'alice@example.com' })
    })

    it("retourne 409 quand l'email est déjà utilisé", async () => {
      const { ConflictException } = await import('@nestjs/common')
      mockUsersService.createUser.mockRejectedValue(new ConflictException('Email déjà utilisé'))

      const res = await request(appWithAuth.getHttpServer())
        .post('/api/users')
        .send({ email: 'alice@example.com', password: 'password123' })

      expect(res.status).toBe(409)
    })

    it("retourne 400 quand l'email est invalide", async () => {
      const res = await request(appWithAuth.getHttpServer())
        .post('/api/users')
        .send({ email: 'not-an-email', password: 'password123' })

      expect(res.status).toBe(400)
    })

    it('retourne 400 quand le mot de passe est trop court', async () => {
      const res = await request(appWithAuth.getHttpServer())
        .post('/api/users')
        .send({ email: 'alice@example.com', password: 'short' })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/users/me', () => {
    it("retourne 200 et le profil quand le token JWT est valide", async () => {
      mockUsersService.findById.mockResolvedValue(FAKE_USER)

      const res = await request(appWithAuth.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', 'Bearer fake-token')

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({ id: 'user-123', email: 'alice@example.com' })
    })

    it("retourne 401 quand aucun token JWT n'est fourni", async () => {
      const res = await request(appWithoutAuth.getHttpServer())
        .get('/api/users/me')

      expect(res.status).toBe(401)
    })
  })
})
