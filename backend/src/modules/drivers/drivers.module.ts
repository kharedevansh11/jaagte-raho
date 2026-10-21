import { Module } from '@nestjs/common';
import { CallsModule } from '../calls/calls.module.js';
import { DriversRepository } from './drivers.repository.js';
import { DriversResolver } from './drivers.resolver.js';
import { DriversService } from './drivers.service.js';

@Module({
  imports: [CallsModule],
  providers: [DriversRepository, DriversService, DriversResolver],
  exports: [DriversService],
})
export class DriversModule {}
