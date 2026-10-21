// Opaque cursor for "calls older than this one". createdAt alone isn't unique,
// so the id breaks ties and no call is skipped or repeated between pages.
export interface CallCursor {
  createdAt: Date;
  id: string;
}

export const encodeCursor = (c: CallCursor) =>
  Buffer.from(`${c.createdAt.toISOString()}|${c.id}`).toString('base64url');

export function decodeCursor(raw: string): CallCursor | null {
  const [iso, id] = Buffer.from(raw, 'base64url').toString().split('|');
  const createdAt = new Date(iso);
  return id && !Number.isNaN(createdAt.getTime()) ? { createdAt, id } : null;
}
