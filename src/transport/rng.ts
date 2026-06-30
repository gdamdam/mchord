/**
 * rng — tiny deterministic PRNG (mulberry32) for reproducible 'random'
 * progression order. Pure: a seed fully determines the sequence.
 */
export interface Rng {
  /** Next float in [0,1). */
  next(): number
  /** Next integer in [0, n). */
  int(n: number): number
}

export function makeRng(seed: number): Rng {
  // mulberry32
  let a = seed >>> 0
  const next = (): number => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (n: number) => Math.floor(next() * n),
  }
}
