import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UnauthorizedException } from '@nestjs/common'

// On teste validate() directement via Object.create pour éviter le constructeur
// PassportStrategy (qui appelle passport.use() et requiert un contexte NestJS complet).
// Le comportement métier de validate() est indépendant de l'initialisation Passport.
import { JwtStrategy } from '../auth/jwt.strategy.js'
import type { AuthService } from '../auth/auth.service.js'

const makeAuthStub = () =>
  ({
    validateUser: vi.fn(),
  }) as unknown as AuthService

describe('JwtStrategy.validate', () => {
  let authService: ReturnType<typeof makeAuthStub>
  let validateFn: JwtStrategy['validate']

  beforeEach(() => {
    authService = makeAuthStub()
    // Instanciation via Object.create pour contourner le constructeur Passport
    const instance = Object.create(JwtStrategy.prototype) as JwtStrategy
    Object.defineProperty(instance, 'authService', {
      value: authService,
      writable: false,
    })
    validateFn = instance.validate.bind(instance)
  })

  it("retourne l'utilisateur quand le payload sub correspond à un utilisateur existant", async () => {
    vi.mocked(authService.validateUser).mockResolvedValue({ id: 'user-123' })

    const result = await validateFn({ sub: 'user-123' })

    expect(result).toEqual({ id: 'user-123' })
  })

  it("lève UnauthorizedException quand l'utilisateur n'existe pas", async () => {
    vi.mocked(authService.validateUser).mockResolvedValue(null)

    await expect(validateFn({ sub: 'user-inexistant' })).rejects.toThrow(UnauthorizedException)
  })

  it('appelle validateUser avec le sub du payload', async () => {
    vi.mocked(authService.validateUser).mockResolvedValue({ id: 'user-789' })

    await validateFn({ sub: 'user-789' })

    expect(authService.validateUser).toHaveBeenCalledWith('user-789')
  })

  it("ne retourne que l'id dans l'objet résultat", async () => {
    vi.mocked(authService.validateUser).mockResolvedValue({ id: 'user-123' })

    const result = await validateFn({ sub: 'user-123' })

    expect(Object.keys(result)).toEqual(['id'])
  })
})
