import { newGame } from './game';
import { ZONE_IDS, blockedCells, hkey, neighbors, passable, plan } from './dungeon';

// Los decorados bloquean casillas, pero nunca deben dejar aislado nada que haya que pisar.
test.each(ZONE_IDS)('decorados de %s sin cortar el paso', zone => {
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  g.zone = zone;
  g.found = plan(zone).marks.filter(m => m.kind === 'secret').map(m => m.id);
  g.done = plan(zone).marks.filter(m => m.kind === 'gate').map(m => m.id);
  const pass = passable(g, zone);
  const seen = new Set([hkey(plan(zone).start)]);
  const q = [plan(zone).start];
  while (q.length) for (const n of neighbors(q.shift()!)) if (pass.has(hkey(n)) && !seen.has(hkey(n))) { seen.add(hkey(n)); q.push(n); }
  for (const m of plan(zone).marks) if (m.kind !== 'prop') expect(seen.has(`${m.q},${m.r}`)).toBe(true);
  expect(blockedCells(zone).size).toBeGreaterThan(0);
});

test('atributos: 4d6 quitando el menor, repartidos según la prioridad de la clase', () => {
  const { assignRolls, rollAbilities } = require('./rules');
  const rolls = rollAbilities(() => 0.99);
  expect(rolls).toHaveLength(6);
  const r = assignRolls('wizard', [[6, 6, 6, 1], [3, 3, 3, 1], [4, 4, 4, 1], [5, 5, 5, 1], [2, 2, 2, 1], [1, 1, 1, 1]]);
  expect(r.abil.int).toBe(18);
  expect(r.abil.str).toBe(3);
});
