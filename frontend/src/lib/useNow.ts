import { useEffect, useState } from 'react'

/** Re-renders every `ms` so relative times ("12 min ago") stay current without refetching. */
export function useNow(ms = 30_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}
