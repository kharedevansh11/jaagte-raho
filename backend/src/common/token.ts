import { timingSafeEqual } from 'node:crypto';

/** Constant-time string compare, so tokens can't be guessed byte by byte from response timing. */
export function safeEqual(a: string | undefined, b: string): boolean {
  if (!a) return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
