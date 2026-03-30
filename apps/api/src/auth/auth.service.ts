import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma.service.js'

interface LoginResult {
  access_token: string
}

interface ValidatedUser {
  id: string
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(userId: string): Promise<ValidatedUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) return null
    return { id: user.id }
  }

  login(userId: string): LoginResult {
    return {
      access_token: this.jwtService.sign({ sub: userId }),
    }
  }
}
