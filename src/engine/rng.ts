// Dados con semilla (mulberry32): la semilla vive en la partida, así un fallo se puede repetir.
export type Rng = { seed: number };

export function rand(r: Rng): number {
  let t = (r.seed = (r.seed + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export const die = (r: Rng, sides: number) => 1 + Math.floor(rand(r) * sides);

/** Dados de daño y curación tirados con roll(), para enseñarlos con su forma (d4, d6, d8…). */
export const tray: { f: number; v: number }[] = [];

/** Tira una expresión como "2d4+2", "1d6", "3" o "2d8 + 18". Con crit, se doblan los dados. */
export function roll(r: Rng, expr: string, crit = false): number {
  let total = 0;
  for (const part of expr.replace(/\s/g, '').match(/[+-]?[^+-]+/g) ?? []) {
    const sign = part.startsWith('-') ? -1 : 1;
    const p = part.replace(/^[+-]/, '');
    const m = p.match(/^(\d*)d(\d+)$/);
    if (m) {
      const n = (m[1] ? +m[1] : 1) * (crit ? 2 : 1);
      for (let i = 0; i < n; i++) { const v = die(r, +m[2]); if (tray.length < 32) tray.push({ f: +m[2], v }); total += sign * v; }
    } else total += sign * (+p || 0);
  }
  return total;
}

export function pick<T>(r: Rng, xs: T[]): T {
  return xs[Math.floor(rand(r) * xs.length)];
}
