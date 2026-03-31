import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { EventsModule } from './events/events.module.js'
import { UsersModule } from './users/users.module.js'

@Module({
  imports: [
    // Charge .env.local (dev) ou .env depuis la racine du monorepo (process.cwd() = apps/api/)
    ConfigModule.forRoot({
      envFilePath: ['../../.env.local', '../../.env'],
      isGlobal: true,
    }),
    UsersModule,
    EventsModule,
  ],
})
export class AppModule {}
