import { Injectable } from '@nestjs/common'
import { ISyncRepository, type HistoryResult, type PaginationOptions } from './ports/sync.repository.js'

@Injectable()
export class SyncService {
  constructor(private readonly syncRepository: ISyncRepository) {}

  async getHistory(userId: string, options: PaginationOptions): Promise<HistoryResult> {
    return this.syncRepository.getSessionHistory(userId, options)
  }

  async deleteUserData(userId: string): Promise<void> {
    await this.syncRepository.deleteUserData(userId)
  }
}
