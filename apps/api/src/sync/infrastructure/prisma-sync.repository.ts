import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma.service.js'
import {
  ISyncRepository,
  type HistoryResult,
  type PaginationOptions,
  type SessionSummary,
} from '../ports/sync.repository.js'

const DEFAULT_LIMIT = 20

@Injectable()
export class PrismaSyncRepository extends ISyncRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async getSessionHistory(userId: string, options: PaginationOptions): Promise<HistoryResult> {
    const limit = Math.min(options.limit, DEFAULT_LIMIT)
    const offset = options.offset

    const [sessions, total] = await Promise.all([
      this.prisma.session.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          domain: true,
          url: true,
          grade: true,
          score: true,
          startedAt: true,
          trackers: {
            select: {
              domain: true,
              category: true,
              company: true,
              requestCount: true,
            },
          },
          piis: {
            select: {
              // maskedValue intentionnellement exclu — ne transite pas inutilement
              type: true,
              destination: true,
              detectedAt: true,
            },
          },
        },
      }),
      this.prisma.session.count({ where: { userId } }),
    ])

    const summaries: SessionSummary[] = sessions.map((s) => ({
      id: s.id,
      domain: s.domain,
      url: s.url,
      grade: s.grade,
      score: s.score,
      startedAt: s.startedAt,
      trackers: s.trackers.map((t) => ({
        domain: t.domain,
        category: t.category as SessionSummary['trackers'][number]['category'],
        company: t.company,
        requestCount: t.requestCount,
      })),
      piis: s.piis.map((p) => ({
        type: p.type as SessionSummary['piis'][number]['type'],
        destination: p.destination,
        timestamp: p.detectedAt.getTime(),
      })),
    }))

    return { sessions: summaries, total }
  }

  async deleteUserData(userId: string): Promise<void> {
    // Suppression en cascade : Session → Tracker + PiiDetection (onDelete: Cascade dans schema)
    await this.prisma.session.deleteMany({ where: { userId } })
  }
}
