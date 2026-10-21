import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Request } from 'express';
import type { Owner } from '../../generated/prisma/client.js';
import { AuthService } from './auth.service.js';

export type AuthedRequest = Request & { owner?: Owner };

/** Lets a GraphQL request through only with a valid Clerk session, and attaches its owner. */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = GqlExecutionContext.create(context).getContext<{
      req: AuthedRequest;
    }>().req;
    if (req.owner) return true;
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return false;
    const owner = await this.auth.ownerForToken(token);
    if (!owner) return false;
    req.owner = owner;
    return true;
  }
}
