// Las cuatro maestrías que faltaban (2026-11-27): Hendir, Rozar, Mella y Ralentizar.
import { newGame } from './game';
import { enterZone } from './dungeon';
import { actionsFor, Combat, enemyTurn, perform, startCombat, Unit, MASTERY } from './combat';
import { createAlly, newItem } from './rules';
import { ITEMS } from '../data/srd';
import type { Game } from './game';

function setup(weapon: string, seed = 3): { g: Game; cb: Combat; hero: Unit; foes: Unit[] } {
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  g.rng.seed = seed;
  const c = g.party[0];
  c.items = c.items.filter(i => !ITEMS[i.id]?.weapon);
  c.items.unshift(newItem(weapon));
  g.party.push(createAlly('tiko', 2, 300));
  enterZone(g, 'z1');
  const cb = startCombat(g, 'z1_e01');
  const hero = cb.units.find(u => u.charId === c.id)!;
  hero.row = 'front';
  cb.turn = cb.order.indexOf(hero.key);
  cb.acted = cb.bonus = cb.moved = false;
  const foes = cb.units.filter(u => u.side === 'enemy');
  for (const f of foes) { f.row = 'front'; f.hp = f.maxHp = 200; }
  return { g, cb, hero, foes };
}
const hit = (g: Game, cb: Combat, w: string, t: Unit) => perform(g, cb, actionsFor(g, cb).find(a => a.id === `atk:${w}`)!, t.key);

describe('maestrías nuevas', () => {
  it('las armas nuevas existen y tienen su maestría', () => {
    for (const w of ['greataxe', 'greatsword', 'halberd', 'dagger', 'scimitar', 'longbow', 'light_crossbow']) expect(ITEMS[w]?.weapon && MASTERY[w]).toBeTruthy();
  });

  it('Hendir: el golpe sigue hasta otro de la misma fila', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { g, cb, foes } = setup('greataxe', seed);
      expect(foes.length).toBeGreaterThan(1);
      hit(g, cb, 'greataxe', foes[0]);
      if (cb.log.some(l => l.t.includes('Hendir'))) return;
    }
    throw new Error('Hendir no salta nunca');
  });

  it('Rozar: al fallar hace el modificador de característica', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const { g, cb, foes } = setup('greatsword', seed);
      foes[0].ac = 40;
      hit(g, cb, 'greatsword', foes[0]);
      expect(foes[0].hp).toBeLessThan(200);
      expect(cb.log.some(l => l.t.includes('Rozar'))).toBe(true);
      return;
    }
  });

  it('Mella: con dos armas ligeras golpea también con la otra', () => {
    const { g, cb, foes } = setup('scimitar');
    g.party[0].items.push(newItem('dagger'));
    hit(g, cb, 'scimitar', foes[0]);
    expect(cb.log.some(l => l.t.includes('(Mella)'))).toBe(true);
  });

  it('Ralentizar: el enemigo no cambia de fila en su turno', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const { g, cb, foes } = setup('longbow', seed);
      const f = foes[0];
      f.row = 'back';
      hit(g, cb, 'longbow', f);
      if (!f.slowed) continue;
      cb.turn = cb.order.indexOf(f.key);
      f.plan = { kind: 'melee', targets: [cb.units.find(u => u.side === 'party')!.key], move: 'front' };
      enemyTurn(g, cb);
      expect(f.row).toBe('back');
      return;
    }
    throw new Error('Ralentizar no salta nunca');
  });
});
