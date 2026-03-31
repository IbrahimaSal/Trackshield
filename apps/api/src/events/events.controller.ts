import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common'
import type { EventBatchDto } from '@trackshield/shared-types'
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js'
import { EventsService } from './events.service.js'

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @HttpCode(201)
  async ingestBatch(@Body() batch: EventBatchDto): Promise<void> {
    await this.eventsService.processEventBatch(batch)
  }
}
