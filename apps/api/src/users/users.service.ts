import { ConflictException, Injectable } from '@nestjs/common'
import * as bcryptjs from 'bcryptjs'
import type { UserEntity } from './domain/user.entity.js'
import { IUsersRepository } from './ports/users.repository.js'

const BCRYPT_ROUNDS = 10

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: IUsersRepository) {}

  async createUser(email: string, password: string): Promise<UserEntity> {
    const existing = await this.usersRepository.findByEmail(email)
    if (existing) {
      throw new ConflictException(`Email already in use`)
    }
    const passwordHash = await bcryptjs.hash(password, BCRYPT_ROUNDS)
    return this.usersRepository.create({ email, passwordHash })
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.usersRepository.findById(id)
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findByEmail(email)
  }
}
