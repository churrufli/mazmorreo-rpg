import { newGame } from './game';
import { devWin, startCombat } from './combat';
import { applyEffect, sceneById } from './escenas';
import { blockedCells, bridgedWater, encounterCell, enterZone, hkey, passable, plan, wonCell, ZONE_IDS } from './dungeon';

const game = () => { const g = newGame(1, 'Prueba', 'fighter', 'human'); enterZone(g, 'z1'); return g; };

test('vencer desde una casilla contigua conserva la posición del enemigo y corrige partidas antiguas', () => {
  const g = game();
  const cb = startCombat(g, 'z1_e01');
  expect(hkey(g.pos)).not.toBe(encounterCell('z1_e01'));
  for (const u of cb.units.filter(x => x.side === 'enemy')) { u.hp = 0; u.dead = true; }
  devWin(g, cb);
  expect(g.wonAt?.z1_e01).toBe(encounterCell('z1_e01'));
  g.wonAt = { z1_e01: hkey(g.pos) };
  expect(wonCell(g, 'z1_e01')).toBe(encounterCell('z1_e01'));
});

test('los grupos de refuerzo mantienen sus posiciones y marcadores separados', () => {
  const g = game();
  g.done.push('z1_e02', 'z1_e03');
  g.wonAt = { z1_e02: hkey(g.pos), z1_e03: hkey(g.pos) };
  expect(wonCell(g, 'z1_e02')).toBe(encounterCell('z1_e02'));
  expect(wonCell(g, 'z1_e03')).toBe(encounterCell('z1_e03'));
  expect(wonCell(g, 'z1_e02')).not.toBe(wonCell(g, 'z1_e03'));
});

test('todos los enemigos tienen casillas exclusivas, transitables y sin objetos interactivos', () => {
  for (const zone of ZONE_IDS) {
    const p = plan(zone);
    for (const m of p.marks.filter(x => x.kind === 'encounter')) {
      const k = `${m.q},${m.r}`;
      expect(p.cells.some(([q, r]) => q === m.q && r === m.r)).toBe(true);
      expect(blockedCells(zone).has(k)).toBe(false);
      expect(p.marks.filter(x => x.q === m.q && x.r === m.r)).toEqual([m]);
    }
  }
});

test('la pasarela cruza el agua sin bloquear el paso a la escena', () => {
  const g = game(); enterZone(g, 'z4');
  const water = plan('z4').marks.find(m => m.id === 'water' && m.q === 4 && m.r === -2)!;
  expect(bridgedWater('z4', water)).toBe(true);
  expect(passable(g, 'z4').has('4,-2')).toBe(true);
  expect(passable(g, 'z4').has('7,-4')).toBe(true);
});

test('el lazo concede su beneficio desactivando la trampa sin crear botín', () => {
  const g = game(); enterZone(g, 'b1');
  const gold = g.gold;
  const out = applyEffect(g, sceneById('b1_p01')!.options[0].ok);
  expect(g.done).toContain('b1_t01');
  expect(g.gold).toBe(gold);
  expect(out.lines.join(' ')).toContain('desactivada');
});

test('los grupos retirados por una decisión no dejan un falso marcador de victoria', () => {
  const g = game();
  applyEffect(g, { remove: 'z1_e05' });
  expect(wonCell(g, 'z1_e05')).toBeUndefined();
});
