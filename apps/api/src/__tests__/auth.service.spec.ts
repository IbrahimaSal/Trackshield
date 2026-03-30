import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { JwtService } from '@nestjs/jwt'
import { AuthService } from '../auth/auth.service.js'
import type { PrismaService } from '../prisma.service.js'

// Instanciation directe sans NestJS DI (Vitest/esbuild ne supporte pas emitDecoratorMetadata)
const makePrismaStub = () =>
  ({
    user: {
      findUnique: vi.fn(),
    },
  }) as unknown as PrismaService

const makeJwtStub = () =>
  ({
    sign: vi.fn().mockReturnValue('signed.jwt.token'),
  }) as unknown as JwtService

describe('AuthService', () => {
  let service: AuthService
  let prisma: ReturnType<typeof makePrismaStub>
  let jwtService: ReturnType<typeof makeJwtStub>

  beforeEach(() => {
    prisma = makePrismaStub()
    jwtService = makeJwtStub()
    service = new AuthService(prisma, jwtService)
  })

  describe('validateUser', () => {
    it("retourne l'id de l'utilisateur quand il existe en base", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const result = await service.validateUser('user-123')

      expect(result).toEqual({ id: 'user-123' })
    })

    it("retourne null quand l'utilisateur n'existe pas en base", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const result = await service.validateUser('user-inexistant')

      expect(result).toBeNull()
    })

    it("recherche l'utilisateur par son id exact", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      await service.validateUser('user-xyz')

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-xyz' },
      })
    })
  })

  describe('login', () => {
    it("retourne un objet avec une clé access_token", () => {
      const result = service.login('user-123')

      expect(result).toHaveProperty('access_token')
    })

    it("signe le JWT avec le sub correspondant à l'userId", () => {
      service.login('user-456')

      expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'user-456' })
    })

    it('retourne le token signé par JwtService', () => {
      vi.mocked(jwtService.sign).mockReturnValue('mon.token.jwt')

      const result = service.login('user-123')

      expect(result.access_token).toBe('mon.token.jwt')
    })

    it('ne retourne pas de données personnelles dans le résultat', () => {
      const result = service.login('user-123')

      expect(result).not.toHaveProperty('email')
      expect(result).not.toHaveProperty('password')
      expect(Object.keys(result)).toEqual(['access_token'])
    })
  })
})
