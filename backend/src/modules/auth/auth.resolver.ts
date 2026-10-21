import { UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import type { Owner } from '../../generated/prisma/client.js';
import { AuthGuard } from './auth.guard.js';
import { CurrentOwner } from './current-owner.decorator.js';
import { OwnerModel } from './owner.model.js';

@Resolver(() => OwnerModel)
@UseGuards(AuthGuard)
export class AuthResolver {
  @Query(() => OwnerModel, { name: 'me' })
  me(@CurrentOwner() owner: Owner) {
    return owner;
  }
}
