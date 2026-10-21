import { Module } from '@nestjs/common';
import { CallsModule } from '../calls/calls.module.js';
import { DriversModule } from '../drivers/drivers.module.js';
import { DemoController } from './demo.controller.js';
import { DemoService } from './demo.service.js';

@Module({
  imports: [DriversModule, CallsModule],
  controllers: [DemoController],
  providers: [DemoService],
})
export class DemoModule {}
