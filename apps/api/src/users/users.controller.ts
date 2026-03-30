import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common'
import type { Request } from 'express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js'
import { CreateUserDto } from './dto/create-user.dto.js'
import { UsersService } from './users.service.js'

interface AuthenticatedUser {
  id: string
}

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser
}

interface UserResponse {
  id: string
  email: string
  createdAt: Date
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: CreateUserDto): Promise<UserResponse> {
    const user = await this.usersService.createUser(dto.email, dto.password)
    return { id: user.id, email: user.email, createdAt: user.createdAt }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: AuthenticatedRequest): Promise<UserResponse | null> {
    const user = await this.usersService.findById(req.user.id)
    if (!user) return null
    return { id: user.id, email: user.email, createdAt: user.createdAt }
  }
}
