import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module.js'
import { PrismaService } from '../prisma.service.js'
import { PrismaUsersRepository } from './infrastructure/prisma-users.repository.js'
import { IUsersRepository } from './ports/users.repository.js'
import { UsersController } from './users.controller.js'
import { UsersService } from './users.service.js'

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    PrismaService,
    {
      provide: IUsersRepository,
      useClass: PrismaUsersRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
