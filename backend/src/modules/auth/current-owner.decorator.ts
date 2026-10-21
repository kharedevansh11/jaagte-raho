import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { AuthedRequest } from './auth.guard.js';

/** The signed-in owner. Only valid on resolvers behind AuthGuard. */
export const CurrentOwner = createParamDecorator(
  (_: unknown, context: ExecutionContext) =>
    GqlExecutionContext.create(context).getContext<{ req: AuthedRequest }>().req
      .owner!,
);
