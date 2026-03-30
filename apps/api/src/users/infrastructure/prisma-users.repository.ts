import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma.service.js'
import { IUsersRepository, type CreateUserData } from '../ports/users.repository.js'
import { UserEntity } from '../domain/user.entity.js'

@Injectable()
export class PrismaUsersRepository extends IUsersRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: { email: data.email, passwordHash: data.passwordHash },
    })
    return new UserEntity(user.id, user.email, user.createdAt)
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) return null
    return new UserEntity(user.id, user.email, user.createdAt)
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) return null
    return new UserEntity(user.id, user.email, user.createdAt)
  }
}
