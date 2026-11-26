import { cellMap, plan, zoneById } from './dungeon';

/** Claro maldito: abuela Brezna, bruja Brezna, Corazón Hueco y Raíz silenciosa, siempre en ese orden (el autor 2026-11-26). */
describe('orden del Claro maldito', () => {
  const p = plan('b4');
  const cells = cellMap('b4');
  const rooms = zoneById('b4').rooms.map(r => r.id);
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
  /** Salas a las que se llega desde la entrada sin pisar las casillas prohibidas. */
  const reach = (blocked: (k: string) => boolean) => {
    const start = `${p.start[0]},${p.start[1]}`;
    const seen = new Set([start]);
    const queue = [start];
    while (queue.length) {
      const [q, r] = queue.shift()!.split(',').map(Number);
      for (const [dq, dr] of DIRS) {
        const k = `${q + dq},${r + dr}`;
        if (!cells.has(k) || seen.has(k) || blocked(k)) continue;
        seen.add(k);
        queue.push(k);
      }
    }
    return new Set([...seen].map(k => cells.get(k)!).filter(i => i >= 0).map(i => rooms[i]));
  };
  const room = (id: string) => (k: string) => rooms[cells.get(k)!] === id;

  it('la bruja (y antes la abuela) cierra el paso al Corazón y a la Raíz silenciosa', () => {
    const got = reach(room('b4_r05'));
    expect(got.has('b4_r06')).toBe(false);
    expect(got.has('b4_r07')).toBe(false);
    expect(got.has('b4_r08')).toBe(false);
  });

  it('no se llega a la Raíz silenciosa sin pasar por el Corazón', () => {
    expect(reach(room('b4_r07')).has('b4_r08')).toBe(false);
  });

  it('en la misma sala, primero habla la abuela y después se lucha con la bruja', () => {
    const r05 = zoneById('b4').rooms.find(r => r.id === 'b4_r05')!;
    expect(r05.contents.map(c => (c as { id?: string }).id)).toEqual(['b4_d02', 'b4_e03']);
    const bruja = p.marks.find(m => m.id === 'b4_e03')!;
    expect(rooms[cells.get(`${bruja.q},${bruja.r}`)!]).toBe('b4_r05');
  });
});
