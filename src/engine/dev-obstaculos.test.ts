import { newGame } from './game';
import { closedDoors, contentById, devPass, plan, step, ZONE_IDS } from './dungeon';

// Modo desarrollador: un obstáculo que no cede ofrece «Superar», que abre su cofre.
test('superar un obstáculo cerrado en modo desarrollador', () => {
  const zone = ZONE_IDS.find(z => plan(z).marks.some(m => m.kind === 'chest' && contentById(m.id)?.c.obstacle))!;
  const m = plan(zone).marks.find(x => x.kind === 'chest' && contentById(x.id)?.c.obstacle)!;
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  g.zone = zone;
  g.party.forEach(c => (c.items = []));
  g.done.push(`${m.id}_tried`);
  const ev = step(g, [m.q, m.r], true).find(e => e.kind === 'msg' && e.pass === m.id);
  expect(ev).toBeDefined();
  const oro = g.gold;
  const evs = devPass(g, m.id);
  expect(g.done).toContain(m.id);
  expect(g.gold).toBeGreaterThanOrEqual(oro);
  expect(evs[0].kind).toBe('msg');
  expect(closedDoors(g).has(`${m.q},${m.r}`)).toBe(false);
});

test('abrir la salida cerrada sin la llave en modo desarrollador', () => {
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  const exit = plan(g.zone).marks.find(x => x.kind === 'exit')!;
  const evs = step(g, [exit.q, exit.r], true);
  const ev = evs.find(e => e.kind === 'msg' && e.pass);
  expect(ev).toBeDefined();
  const out = devPass(g, (ev as any).pass);
  expect(out.some(e => e.kind === 'zone')).toBe(true);
  expect(g.done).toContain(`${g.zone}_open`);
});
