import { newGame } from './game';
import { ZONE_IDS, blockedCells, hkey, neighbors, plan, visibleCells } from './dungeon';

test.each(ZONE_IDS)('paredes detrás de los decorados del perímetro de %s', zone => {
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  g.zone = zone;
  const p = plan(zone);
  const cells = new Set(p.cells.map(([q, r]) => hkey([q, r])));
  const hidden = new Set(p.marks.filter(m => m.kind === 'secret').flatMap(m => m.path ?? []));
  let checked = 0;
  for (const [q, r] of p.cells) {
    const k = hkey([q, r]);
    if (blockedCells(zone).has(k) || hidden.has(k)) continue;
    g.pos = [q, r];
    g.visited = [k];
    const vis = visibleCells(g);
    for (const obstacle of blockedCells(zone)) {
      if (!vis.has(obstacle)) continue;
      for (const n of neighbors(obstacle.split(',').map(Number) as [number, number])) {
        const wall = hkey(n);
        if (cells.has(wall)) continue;
        expect(vis.has(wall)).toBe(true);
        checked++;
      }
    }
  }
  expect(checked).toBeGreaterThan(0);
});
