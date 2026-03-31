import { Injectable, NotFoundException } from '@nestjs/common'
import type { EventBatchDto, PiiDetection, TrackerMatch } from '@trackshield/shared-types'
import { IEventsRepository } from './ports/events.repository.js'

@Injectable()
export class EventsService {
  constructor(private readonly eventsRepository: IEventsRepository) {}

  async processEventBatch(batch: EventBatchDto): Promise<void> {
    const exists = await this.eventsRepository.sessionExists(batch.sessionId)
    if (!exists) {
      throw new NotFoundException(`Session ${batch.sessionId} not found`)
    }

    const trackers: TrackerMatch[] = []
    const piis: PiiDetection[] = []

    for (const event of batch.events) {
      if (event.kind === 'tracker') {
        trackers.push(event.data)
      } else {
        piis.push(event.data)
      }
    }

    if (trackers.length > 0) {
      await this.eventsRepository.saveTrackerEvents(batch.sessionId, trackers)
    }
    if (piis.length > 0) {
      await this.eventsRepository.savePiiEvents(batch.sessionId, piis)
    }
  }
}
