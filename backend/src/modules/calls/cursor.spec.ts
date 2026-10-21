import { decodeCursor, encodeCursor } from './cursor.js';

describe('call cursor', () => {
  it('round-trips', () => {
    const c = { createdAt: new Date('2026-10-18T20:14:00.123Z'), id: 'cmabc' };
    expect(decodeCursor(encodeCursor(c))).toEqual(c);
  });

  it('rejects garbage instead of throwing', () => {
    expect(decodeCursor('not-a-cursor')).toBeNull();
  });
});
