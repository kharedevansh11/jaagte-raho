import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClerkClient, verifyToken } from '@clerk/backend';
import type { Env } from '../../config/env.validation.js';
import type { Owner } from '../../generated/prisma/client.js';
import { OwnersRepository } from './owners.repository.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly clerk;

  constructor(
    private readonly owners: OwnersRepository,
    private readonly config: ConfigService<Env, true>,
  ) {
    this.clerk = createClerkClient({
      secretKey: this.config.get('CLERK_SECRET_KEY', { infer: true }),
    });
  }

  /** Returns the owner behind a Clerk session token, creating the account on first sign-in. */
  async ownerForToken(token: string): Promise<Owner | null> {
    let clerkUserId: string;
    try {
      const parties = this.config.get('CLERK_AUTHORIZED_PARTIES', {
        infer: true,
      });
      const payload = await verifyToken(token, {
        secretKey: this.config.get('CLERK_SECRET_KEY', { infer: true }),
        ...(parties && {
          authorizedParties: parties.split(',').map((p) => p.trim()),
        }),
      });
      clerkUserId = payload.sub;
    } catch {
      return null;
    }

    const existing = await this.owners.findByClerkId(clerkUserId);
    if (existing) return existing;

    const user = await this.clerk.users.getUser(clerkUserId);
    const owner = await this.owners.createOrGet({
      clerkUserId,
      name: user.fullName ?? user.firstName ?? null,
      email: user.primaryEmailAddress?.emailAddress ?? null,
    });
    this.logger.log(`New owner ${owner.id} (${owner.email ?? 'no email'})`);
    return owner;
  }
}
