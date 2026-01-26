import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

// Core modules
import { DatabaseModule } from './database/database.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { TripModule } from './modules/trip/trip.module';
import { ExpenseModule } from './modules/expense/expense.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { ExchangeRateModule } from './modules/exchange-rate/exchange-rate.module';
import { AIModule } from './modules/ai/ai.module';
import { SyncModule } from './modules/sync/sync.module';

// Config
import configuration from './config/configuration';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Database
    DatabaseModule,

    // Feature modules
    AuthModule,
    UserModule,
    TripModule,
    ExpenseModule,
    WalletModule,
    ExchangeRateModule,
    AIModule,
    SyncModule,
  ],
})
export class AppModule {}
