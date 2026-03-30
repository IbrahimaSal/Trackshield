import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ConflictException } from '@nestjs/common'
import * as bcryptjs from 'bcryptjs'

// bcryptjs mocké pour éviter le vrai hachage (lent) en tests unitaires
vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('$2b$10$hashedpassword'),
}))

import { UsersService } from '../users/users.service.js'
import type { IUsersRepository } from '../users/ports/users.repository.js'
import { UserEntity } from '../users/domain/user.entity.js'

const makeUserEntity = (overrides?: Partial<UserEntity>) =>
  new UserEntity(
    overrides?.id ?? 'user-123',
    overrides?.email ?? 'test@example.com',
    overrides?.createdAt ?? new Date('2024-01-01'),
  )

const makeRepoStub = () =>
  ({
    create: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
  }) as unknown as IUsersRepository

describe('UsersService', () => {
  let service: UsersService
  let repo: ReturnType<typeof makeRepoStub>

  beforeEach(() => {
    repo = makeRepoStub()
    service = new UsersService(repo)
    vi.clearAllMocks()
  })

  describe('createUser', () => {
    it("crée l'utilisateur quand l'email n'existe pas encore", async () => {
      vi.mocked(repo.findByEmail).mockResolvedValue(null)
      vi.mocked(repo.create).mockResolvedValue(makeUserEntity())

      const result = await service.createUser('test@example.com', 'password123')

      expect(repo.create).toHaveBeenCalledOnce()
      expect(result).toBeInstanceOf(UserEntity)
    })

    it('lève ConflictException quand l\'email est déjà utilisé', async () => {
      vi.mocked(repo.findByEmail).mockResolvedValue(makeUserEntity())

      await expect(service.createUser('test@example.com', 'password123')).rejects.toThrow(
        ConflictException,
      )
    })

    it("ne crée pas l'utilisateur si l'email est déjà pris", async () => {
      vi.mocked(repo.findByEmail).mockResolvedValue(makeUserEntity())

      await service.createUser('test@example.com', 'password123').catch(() => {})

      expect(repo.create).not.toHaveBeenCalled()
    })

    it('hache le mot de passe avec bcryptjs avant de le stocker', async () => {
      vi.mocked(repo.findByEmail).mockResolvedValue(null)
      vi.mocked(repo.create).mockResolvedValue(makeUserEntity())

      await service.createUser('test@example.com', 'password123')

      expect(bcryptjs.hash).toHaveBeenCalledWith('password123', expect.any(Number))
    })

    it('stocke le hash et jamais le mot de passe en clair', async () => {
      vi.mocked(repo.findByEmail).mockResolvedValue(null)
      vi.mocked(bcryptjs.hash as ReturnType<typeof vi.fn>).mockResolvedValue('$2b$10$hashed')
      vi.mocked(repo.create).mockResolvedValue(makeUserEntity())

      await service.createUser('test@example.com', 'password123')

      const createCall = vi.mocked(repo.create).mock.calls[0]?.[0]
      expect(createCall?.passwordHash).toBe('$2b$10$hashed')
      expect(createCall).not.toHaveProperty('password')
    })

    it('retourne une UserEntity sans passwordHash exposé', async () => {
      vi.mocked(repo.findByEmail).mockResolvedValue(null)
      vi.mocked(repo.create).mockResolvedValue(makeUserEntity())

      const result = await service.createUser('test@example.com', 'password123')

      expect(result).not.toHaveProperty('passwordHash')
      expect(result).not.toHaveProperty('password')
    })

    it("vérifie l'email avant de hacher le mot de passe (ordre des opérations)", async () => {
      const callOrder: string[] = []
      vi.mocked(repo.findByEmail).mockImplementation(async () => {
        callOrder.push('findByEmail')
        return null
      })
      vi.mocked(bcryptjs.hash as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        callOrder.push('hash')
        return '$2b$10$hashed'
      })
      vi.mocked(repo.create).mockResolvedValue(makeUserEntity())

      await service.createUser('test@example.com', 'password123')

      expect(callOrder).toEqual(['findByEmail', 'hash'])
    })
  })

  describe('findById', () => {
    it("retourne l'entité utilisateur quand l'id existe", async () => {
      const entity = makeUserEntity({ id: 'user-456' })
      vi.mocked(repo.findById).mockResolvedValue(entity)

      const result = await service.findById('user-456')

      expect(result).toBe(entity)
    })

    it("retourne null quand l'id n'existe pas", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null)

      const result = await service.findById('user-inexistant')

      expect(result).toBeNull()
    })

    it("délègue la recherche au repository avec l'id fourni", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null)

      await service.findById('user-xyz')

      expect(repo.findById).toHaveBeenCalledWith('user-xyz')
    })
  })

  describe('findByEmail', () => {
    it("retourne l'entité utilisateur quand l'email existe", async () => {
      const entity = makeUserEntity({ email: 'marie@example.com' })
      vi.mocked(repo.findByEmail).mockResolvedValue(entity)

      const result = await service.findByEmail('marie@example.com')

      expect(result).toBe(entity)
    })

    it("retourne null quand l'email n'existe pas", async () => {
      vi.mocked(repo.findByEmail).mockResolvedValue(null)

      const result = await service.findByEmail('inconnu@example.com')

      expect(result).toBeNull()
    })
  })
})
