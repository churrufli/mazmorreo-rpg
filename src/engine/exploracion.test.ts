import { newGame, Game } from './game';
import { cellMap, contentById, findPath, hkey, neighbors, passable, plan, spottedTraps, step, trap, zoneById, Hex } from './dungeon';
import { newItem } from './rules';

// Mejoras de exploración: trampas vistas antes de pisarlas, poca luz y presagios.

/** Partida en una zona con todo visto y las salas ya visitadas (sin avisos de sala por medio). */
function game(zone: string, torch: boolean): Game {
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  g.zone = zone;
  g.visited = plan(zone).cells.map(([q, r]) => hkey([q, r]));
  g.done = zoneById(zone).rooms.map(r => r.id);
  g.party[0].abil.wis = 14; // Percepción pasiva 14 (humano: competente)
  if (torch) g.party[0].items.push(newItem('torch'));
  return g;
}

const trapMark = (zone: string, id: string) => plan(zone).marks.find(m => m.kind === 'trap' && m.id === id)!;
/** Casilla transitable junto a la trampa. */
function nextTo(g: Game, id: string): Hex {
  const m = trapMark(g.zone, id);
  const pass = passable(g, g.zone);
  return neighbors([m.q, m.r]).find(n => pass.has(hkey(n)))!;
}

test('con luz, una trampa se ve desde la casilla de al lado y luego se elige qué hacer', () => {
  const g = game('z1', true);
  const id = 'z1_t01'; // CD 12 para detectarla
  const n = nextTo(g, id);
  g.pos = g.prev = n;
  const evs = step(g, n);
  expect(evs.some(e => e.kind === 'msg' && e.title === '¡Trampa a la vista!')).toBe(true);
  expect(g.spotted).toContain(id);
  const m = trapMark('z1', id);
  expect(spottedTraps(g).has(`${m.q},${m.r}`)).toBe(true);
  // Pisarla ya no la dispara sola: pregunta.
  const on = step(g, [m.q, m.r]);
  expect(on.some(e => e.kind === 'trap' && e.id === id)).toBe(true);
  expect(g.done).not.toContain(id);
  const out = trap(g, id, g.party[0].id);
  expect(g.done).toContain(id);
  expect(out.kind === 'msg' && out.rolls?.[0].text).toMatch(/intenta desactivarla/);
});

test('con poca luz, la misma trampa pasa desapercibida (−5 a la percepción pasiva)', () => {
  const g = game('z1', false);
  const n = nextTo(g, 'z1_t01');
  g.pos = g.prev = n;
  step(g, n);
  expect(g.spotted ?? []).not.toContain('z1_t01');
});

test('con una trampa vista se sigue llegando a todas partes, y se puede ir a pisarla', () => {
  const g = game('z1', true);
  const m = trapMark('z1', 'z1_t01');
  g.spotted = ['z1_t01'];
  const pass = passable(g, 'z1');
  const n = neighbors([m.q, m.r]).filter(h => pass.has(hkey(h)));
  g.pos = n[0];
  for (const to of n.slice(1)) {
    const p = findPath(g, to);
    expect(p).not.toBeNull();
  }
  // Como destino, se puede ir a pisarla.
  expect(findPath(g, [m.q, m.r])?.slice(-1)[0]).toEqual([m.q, m.r]);
});

test('presagio: avisa una vez al llegar junto a la sala de la araña, antes de entrar', () => {
  const g = game('z2', true);
  const e = plan('z2').marks.find(x => x.kind === 'encounter' && x.id === 'z2_e02')!;
  expect((contentById('z2_e02')!.c as { omen?: string }).omen).toBeTruthy();
  const cells = cellMap('z2');
  const ri = cells.get(`${e.q},${e.r}`)!;
  g.done = g.done.filter(d => d !== zoneById('z2').rooms[ri].id);
  const pass = passable(g, 'z2');
  const door = [...cells.entries()].map(([k]) => k.split(',').map(Number) as Hex)
    .find(h => cells.get(hkey(h)) !== ri && pass.has(hkey(h)) && neighbors(h).some(x => cells.get(hkey(x)) === ri))!;
  g.pos = g.prev = door;
  const evs = step(g, door);
  expect(evs.some(x => x.kind === 'msg' && x.title === 'Presagio')).toBe(true);
  expect(step(g, door).some(x => x.kind === 'msg' && x.title === 'Presagio')).toBe(false);
});
