import { Module } from '@nestjs/common';
import { BolnaClient } from './bolna.client.js';

@Module({
  providers: [BolnaClient],
  exports: [BolnaClient],
})
export class BolnaModule {}
