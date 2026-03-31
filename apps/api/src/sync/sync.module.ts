import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module.js'
import { PrismaService } from '../prisma.service.js'
import { PrismaSyncRepository } from './infrastructure/prisma-sync.repository.js'
import { ISyncRepository } from './ports/sync.repository.js'
import { SyncController } from './sync.controller.js'
import { SyncService } from './sync.service.js'

@Module({
  imports: [AuthModule],
  controllers: [SyncController],
  providers: [
    SyncService,
    PrismaService,
    {
      provide: ISyncRepository,
      useClass: PrismaSyncRepository,
    },
  ],
})
export class SyncModule {}
