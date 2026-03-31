import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module.js'
import { PrismaService } from '../prisma.service.js'
import { PrismaEventsRepository } from './infrastructure/prisma-events.repository.js'
import { EventsController } from './events.controller.js'
import { EventsService } from './events.service.js'
import { IEventsRepository } from './ports/events.repository.js'

@Module({
  imports: [AuthModule],
  controllers: [EventsController],
  providers: [
    EventsService,
    PrismaService,
    {
      provide: IEventsRepository,
      useClass: PrismaEventsRepository,
    },
  ],
  exports: [EventsService],
})
export class EventsModule {}
