import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { AuthService } from './auth.service.js'

interface JwtPayload {
  sub: string
}

interface ValidatedUser {
  id: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env['JWT_SECRET'] ?? 'changeme',
    })
  }

  async validate(payload: JwtPayload): Promise<ValidatedUser> {
    const user = await this.authService.validateUser(payload.sub)
    if (!user) {
      throw new UnauthorizedException()
    }
    return user
  }
}
