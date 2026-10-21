import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'node:path';
import { validateEnv, type Env } from './config/env.validation.js';
import { redisConnection } from './modules/calls/calls.queue.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CallsModule } from './modules/calls/calls.module.js';
import { DemoModule } from './modules/demo/demo.module.js';
import { DriversModule } from './modules/drivers/drivers.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        connection: redisConnection(config.get('REDIS_URL', { infer: true })),
        // Own key prefix, so a shared Redis can't mix our jobs with anyone else's.
        prefix: 'jaagte-raho',
      }),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // Written to disk so the React dashboard can generate typed queries from it.
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      context: ({ req }: { req: unknown }) => ({ req }),
    }),
    PrismaModule,
    AuthModule,
    CallsModule,
    DriversModule,
    DemoModule,
  ],
})
export class AppModule {}
