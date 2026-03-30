import type { UserEntity } from '../domain/user.entity.js'

export interface CreateUserData {
  email: string
  passwordHash: string
}

// Classe abstraite (pas interface) pour être utilisable comme token DI NestJS
export abstract class IUsersRepository {
  abstract create(data: CreateUserData): Promise<UserEntity>
  abstract findById(id: string): Promise<UserEntity | null>
  abstract findByEmail(email: string): Promise<UserEntity | null>
}
