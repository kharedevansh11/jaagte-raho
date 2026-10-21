import { Prisma } from '../../generated/prisma/client.js';
import { OwnersRepository } from './owners.repository.js';

const data = { clerkUserId: 'user_1', name: 'Devansh', email: 'd@example.com' };

describe('OwnersRepository.createOrGet', () => {
  it('returns the existing owner when a parallel request created it first', async () => {
    const existing = { id: 'o1', ...data };
    const prisma = {
      $transaction: async () => {
        throw new Prisma.PrismaClientKnownRequestError(
          'Unique constraint failed',
          {
            code: 'P2002',
            clientVersion: 'test',
          },
        );
      },
      owner: { findUnique: async () => existing },
    };
    const repo = new OwnersRepository(prisma as never);
    await expect(repo.createOrGet(data)).resolves.toBe(existing);
  });

  it('still surfaces unrelated database errors', async () => {
    const prisma = {
      $transaction: async () => {
        throw new Error('disk full');
      },
      owner: { findUnique: async () => null },
    };
    const repo = new OwnersRepository(prisma as never);
    await expect(repo.createOrGet(data)).rejects.toThrow('disk full');
  });
});
