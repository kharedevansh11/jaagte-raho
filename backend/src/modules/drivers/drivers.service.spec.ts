import { NotFoundException } from '@nestjs/common';
import { DriversService } from './drivers.service.js';

const drivers = {
  findById: async (id: string) =>
    id === 'd1' ? { id: 'd1', ownerId: 'owner-a' } : null,
};

const service = new DriversService(drivers as never, {} as never, {} as never);

describe('DriversService ownership', () => {
  it("returns an owner's own driver", async () => {
    await expect(service.get('d1', 'owner-a')).resolves.toMatchObject({
      id: 'd1',
    });
  });

  it("treats another owner's driver as not found", async () => {
    await expect(service.get('d1', 'owner-b')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('blocks changes to drivers the owner does not own', async () => {
    await expect(service.remove('d1', 'owner-b')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.callNow('d1', 'owner-b')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
