import { NotFoundException, UseGuards } from '@nestjs/common';
import { Args, ID, Int, Query, Resolver } from '@nestjs/graphql';
import type { Owner } from '../../generated/prisma/client.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentOwner } from '../auth/current-owner.decorator.js';
import { Call } from './call.model.js';
import { CallPage } from './call-page.model.js';
import { CallsService } from './calls.service.js';

@Resolver(() => Call)
@UseGuards(AuthGuard)
export class CallsResolver {
  constructor(private readonly calls: CallsService) {}

  /** A driver's call history, newest first, 20 at a time (max 50). */
  @Query(() => CallPage)
  async driverCalls(
    @Args('driverId', { type: () => ID }) driverId: string,
    @CurrentOwner() owner: Owner,
    @Args('take', { type: () => Int, defaultValue: 20 }) take: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
  ) {
    if (!(await this.calls.ownedDriver(driverId, owner.id))) {
      throw new NotFoundException(`Driver ${driverId} not found`);
    }
    return this.calls.page(
      driverId,
      Math.min(Math.max(take, 1), 50),
      after ?? null,
    );
  }

  /** Fleet-wide activity feed, newest first. */
  @Query(() => [Call])
  recentCalls(
    @Args('take', { type: () => Int, defaultValue: 50 }) take: number,
    @CurrentOwner() owner: Owner,
  ) {
    return this.calls.listRecent(Math.min(take, 200), owner.id);
  }
}
