import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation.js';
import { safeEqual } from '../../common/token.js';
import type { BolnaExecution } from '../bolna/bolna.types.js';
import { CallsService } from './calls.service.js';

@Controller('webhooks/bolna')
export class BolnaWebhookController {
  constructor(
    private readonly calls: CallsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Post()
  @HttpCode(200)
  async receive(@Query('token') token: string, @Body() body: BolnaExecution) {
    if (!safeEqual(token, this.config.get('WEBHOOK_TOKEN', { infer: true }))) {
      throw new UnauthorizedException();
    }
    if (typeof body?.id !== 'string' || typeof body?.status !== 'string') {
      throw new BadRequestException('Expected a Bolna execution payload');
    }
    await this.calls.enqueueExecution(body);
    return { ok: true };
  }
}
