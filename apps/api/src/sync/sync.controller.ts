import { Controller, Delete, Get, HttpCode, Query, Req, UseGuards } from '@nestjs/common'
import type { Request } from 'express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js'
import type { HistoryResult } from './ports/sync.repository.js'
import { SyncService } from './sync.service.js'

interface AuthenticatedRequest extends Request {
  user: { id: string }
}

const MAX_LIMIT = 20

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('history')
  async getHistory(
    @Req() req: AuthenticatedRequest,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ): Promise<HistoryResult> {
    const limit = Math.min(Number(limitStr) || MAX_LIMIT, MAX_LIMIT)
    const offset = Math.max(Number(offsetStr) || 0, 0)
    return this.syncService.getHistory(req.user.id, { limit, offset })
  }

  @Delete('data')
  @HttpCode(204)
  async deleteData(@Req() req: AuthenticatedRequest): Promise<void> {
    await this.syncService.deleteUserData(req.user.id)
  }
}
