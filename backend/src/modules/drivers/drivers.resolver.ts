import { UseGuards } from '@nestjs/common';
import {
  Args,
  ID,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import type { Owner } from '../../generated/prisma/client.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentOwner } from '../auth/current-owner.decorator.js';
import { Call } from '../calls/call.model.js';
import { CallsService } from '../calls/calls.service.js';
import { Driver } from './driver.model.js';
import { CreateDriverInput, UpdateDriverInput } from './dto/driver.inputs.js';
import { DriversService } from './drivers.service.js';

@Resolver(() => Driver)
@UseGuards(AuthGuard)
export class DriversResolver {
  constructor(
    private readonly driversService: DriversService,
    private readonly callsService: CallsService,
  ) {}

  @Query(() => [Driver])
  drivers(@CurrentOwner() owner: Owner) {
    return this.driversService.list(owner.id);
  }

  @Query(() => Driver)
  driver(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOwner() owner: Owner,
  ) {
    return this.driversService.get(id, owner.id);
  }

  @Mutation(() => Driver)
  createDriver(
    @Args('input') input: CreateDriverInput,
    @CurrentOwner() owner: Owner,
  ) {
    return this.driversService.create(input, owner.id);
  }

  @Mutation(() => Driver)
  updateDriver(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateDriverInput,
    @CurrentOwner() owner: Owner,
  ) {
    return this.driversService.update(id, input, owner.id);
  }

  @Mutation(() => Driver)
  deleteDriver(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOwner() owner: Owner,
  ) {
    return this.driversService.remove(id, owner.id);
  }

  /** Rings the driver right now, outside the schedule. Handy for demos. */
  @Mutation(() => Call)
  callDriverNow(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOwner() owner: Owner,
  ) {
    return this.driversService.callNow(id, owner.id);
  }

  @ResolveField(() => [Call])
  calls(
    @Parent() driver: Driver,
    @Args('take', { type: () => Int, defaultValue: 20 }) take: number,
  ) {
    return this.callsService.listForDriver(driver.id, Math.min(take, 100));
  }
}
