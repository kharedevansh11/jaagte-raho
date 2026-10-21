import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type { CallCursor } from './cursor.js';

@Injectable()
export class CallsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.CallUncheckedCreateInput) {
    return this.prisma.call.create({ data });
  }

  update(id: string, data: Prisma.CallUpdateInput) {
    return this.prisma.call.update({ where: { id }, data });
  }

  /**
   * Atomically marks a call finished and saves its result in one write.
   * Returns false if another worker already finished it.
   */
  async claimCompletion(
    id: string,
    data: Prisma.CallUpdateManyMutationInput,
  ): Promise<boolean> {
    const { count } = await this.prisma.call.updateMany({
      where: { id, completedAt: null },
      data: { ...data, completedAt: new Date() },
    });
    return count === 1;
  }

  /** In-progress statuses never overwrite a call that has already finished. */
  updateStatusIfOpen(id: string, status: string) {
    return this.prisma.call.updateMany({
      where: { id, completedAt: null },
      data: { status },
    });
  }

  delete(id: string) {
    return this.prisma.call.delete({ where: { id } });
  }

  findDriver(id: string) {
    return this.prisma.driver.findUnique({ where: { id } });
  }

  findById(id: string) {
    return this.prisma.call.findUnique({ where: { id } });
  }

  findByExecutionId(executionId: string) {
    return this.prisma.call.findUnique({
      where: { executionId },
      include: { driver: true },
    });
  }

  listForDriver(driverId: string, take: number) {
    return this.prisma.call.findMany({
      where: { driverId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  /** Up to `take` calls older than `after`, newest first. */
  listPage(driverId: string, take: number, after: CallCursor | null) {
    return this.prisma.call.findMany({
      where: {
        driverId,
        ...(after && {
          OR: [
            { createdAt: { lt: after.createdAt } },
            { createdAt: after.createdAt, id: { lt: after.id } },
          ],
        }),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
    });
  }

  listRecent(take: number, ownerId: string) {
    return this.prisma.call.findMany({
      where: { driver: { ownerId, isDemo: false } },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  countDemoCallsSince(since: Date, phone?: string) {
    return this.prisma.call.count({
      where: {
        createdAt: { gte: since },
        driver: { isDemo: true, ...(phone && { phone }) },
      },
    });
  }

  /** Active, real drivers whose next check-in is due. Shift hours are checked by the caller. */
  findDueDrivers(now: Date) {
    return this.prisma.driver.findMany({
      where: {
        active: true,
        isDemo: false,
        OR: [{ nextCallAt: null }, { nextCallAt: { lte: now } }],
      },
    });
  }

  updateDriverSchedule(
    driverId: string,
    data: Pick<
      Prisma.DriverUpdateInput,
      'lastLevel' | 'lastCallAt' | 'nextCallAt' | 'lastAlertAt'
    >,
  ) {
    return this.prisma.driver.update({ where: { id: driverId }, data });
  }
}
