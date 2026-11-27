// Rasgos de clase que obligan a decidir (2026-11-27): Ataque temerario, Puntería firme, Golpe astuto y Expulsar muertos vivientes.
import { newGame, Game } from './game';
import { enterZone } from './dungeon';
import { actionsFor, Combat, perform, startCombat, Unit } from './combat';
import type { ClassId } from '../data/srd';

function setup(cls: ClassId, level: number, zone: string, enc: string): { g: Game; cb: Combat; hero: Unit } {
  const g = newGame(1, 'Prueba', cls, 'human');
  g.rng.seed = 4;
  g.party[0].level = level;
  g.party[0].channel = 2;
  enterZone(g, zone);
  const cb = startCombat(g, enc);
  const hero = cb.units.find(u => u.side === 'party')!;
  hero.row = 'front';
  cb.turn = cb.order.indexOf(hero.key);
  cb.acted = cb.bonus = cb.moved = false;
  return { g, cb, hero };
}
const act = (g: Game, cb: Combat, id: string) => actionsFor(g, cb).find(a => a.id === id);

describe('rasgos de clase', () => {
  it('Ataque temerario: ventaja propia y en contra', () => {
    const { g, cb, hero } = setup('barbarian', 2, 'z1', 'z1_e01');
    expect(act(g, cb, 'reckless')).toBeDefined();
    perform(g, cb, act(g, cb, 'reckless')!);
    expect(hero.reckless).toBe(true);
    expect(act(g, cb, 'reckless')).toBeUndefined();
    expect(cb.acted).toBe(false);
  });

  it('Puntería firme gasta el movimiento y da ventaja', () => {
    const { g, cb, hero } = setup('rogue', 3, 'z1', 'z1_e01');
    perform(g, cb, act(g, cb, 'steady')!);
    expect(hero.steady).toBe(true);
    expect(cb.moved).toBe(true);
    expect(act(g, cb, 'row')).toBeUndefined();
  });

  it('Expulsar muertos vivientes solo sale con no muertos y los hace huir', () => {
    expect(act(...(() => { const s = setup('cleric', 2, 'z1', 'z1_e01'); return [s.g, s.cb] as const; })(), 'turn_undead')).toBeUndefined();
    let turned = 0;
    for (let seed = 1; seed <= 10; seed++) {
      const { g, cb } = setup('cleric', 2, 's1', 's1_e01');
      g.rng.seed = seed;
      perform(g, cb, act(g, cb, 'turn_undead')!);
      turned += cb.units.filter(u => u.turned).length;
    }
    expect(turned).toBeGreaterThan(0);
  });
});
