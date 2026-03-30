import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { PrismaService } from '../prisma.service.js'
import { AuthService } from './auth.service.js'
import { JwtStrategy } from './jwt.strategy.js'
import { JwtAuthGuard } from './jwt-auth.guard.js'

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env['JWT_SECRET'] ?? 'changeme',
      signOptions: {
        expiresIn: process.env['JWT_EXPIRES_IN'] ?? '7d',
      },
    }),
  ],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, PrismaService],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
