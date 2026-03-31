import { Injectable } from '@nestjs/common'
import type { PiiDetection, TrackerMatch } from '@trackshield/shared-types'
import { PrismaService } from '../../prisma.service.js'
import { IEventsRepository } from '../ports/events.repository.js'

@Injectable()
export class PrismaEventsRepository extends IEventsRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async sessionExists(sessionId: string): Promise<boolean> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true },
    })
    return session !== null
  }

  async saveTrackerEvents(sessionId: string, trackers: TrackerMatch[]): Promise<void> {
    await this.prisma.tracker.createMany({
      data: trackers.map((t) => ({
        sessionId,
        domain: t.domain,
        category: t.category,
        company: t.company,
        requestCount: t.requestCount,
      })),
    })
  }

  async savePiiEvents(sessionId: string, piis: PiiDetection[]): Promise<void> {
    await this.prisma.piiDetection.createMany({
      data: piis.map((p) => ({
        sessionId,
        type: p.type,
        maskedValue: p.maskedValue,
        destination: p.destination,
        detectedAt: new Date(p.timestamp),
      })),
    })
  }
}
