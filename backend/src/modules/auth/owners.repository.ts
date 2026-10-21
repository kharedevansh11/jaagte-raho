import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

type NewOwner = {
  clerkUserId: string;
  name: string | null;
  email: string | null;
};

@Injectable()
export class OwnersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByClerkId(clerkUserId: string) {
    return this.prisma.owner.findUnique({ where: { clerkUserId } });
  }

  /**
   * Creates an owner, or returns the existing one if a parallel request just created it
   * (a first sign-in fires several requests at once). The very first owner also adopts
   * drivers added before accounts existed, so nothing from the single-user phase is lost.
   */
  async createOrGet(data: NewOwner) {
    try {
      return await this.create(data);
    } catch (err) {
      const duplicate =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002';
      if (!duplicate) throw err;
      return (await this.findByClerkId(data.clerkUserId))!;
    }
  }

  private create(data: NewOwner) {
    return this.prisma.$transaction(async (tx) => {
      const isFirst = (await tx.owner.count()) === 0;
      const owner = await tx.owner.create({ data });
      if (isFirst) {
        await tx.driver.updateMany({
          where: { ownerId: null, isDemo: false },
          data: { ownerId: owner.id },
        });
      }
      return owner;
    });
  }
}
