import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Prisma } from '../../generated/prisma/client.js';

@Injectable()
export class DriversRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllForOwner(ownerId: string) {
    return this.prisma.driver.findMany({
      where: { ownerId, isDemo: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.driver.findUnique({ where: { id } });
  }

  findByPhone(phone: string) {
    return this.prisma.driver.findUnique({ where: { phone } });
  }

  create(data: Prisma.DriverUncheckedCreateInput) {
    return this.prisma.driver.create({ data });
  }

  update(id: string, data: Prisma.DriverUpdateInput) {
    return this.prisma.driver.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.driver.delete({ where: { id } });
  }
}
