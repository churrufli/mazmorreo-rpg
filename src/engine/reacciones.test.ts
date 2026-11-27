// Mecánicas nuevas de combate (2026-11-27): ataque de oportunidad, Destrabarse, poner a salvo, agarrar y vigilar.
import { newGame, Game } from './game';
import { enterZone } from './dungeon';
import { actionsFor, Combat, enemyTurn, perform, startCombat, Unit } from './combat';
import { createAlly } from './rules';

function setup(): { g: Game; cb: Combat; hero: Unit; ally: Unit; foe: Unit } {
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  g.rng.seed = 9;
  g.party.push(createAlly('tiko', 2, 300));
  enterZone(g, 'z1');
  const cb = startCombat(g, 'z1_e01');
  const hero = cb.units.find(u => u.charId === g.party[0].id)!;
  const ally = cb.units.find(u => u.charId === 'tiko')!;
  const foe = cb.units.find(u => u.side === 'enemy')!;
  for (const u of cb.units) if (u.side === 'enemy' && u !== foe) u.dead = true;
  hero.row = 'front';
  foe.row = 'front';
  cb.turn = cb.order.indexOf(hero.key);
  cb.acted = cb.bonus = cb.moved = false;
  return { g, cb, hero, ally, foe };
}
const act = (g: Game, cb: Combat, id: string) => actionsFor(g, cb).find(a => a.id === id || a.id.startsWith(`${id}:`))!;

describe('reacciones y acciones nuevas', () => {
  it('salir de la vanguardia provoca un ataque de oportunidad; Destrabarse lo evita', () => {
    const a = setup();
    perform(a.g, a.cb, act(a.g, a.cb, 'row'));
    expect(a.cb.log.some(l => l.t.includes('ataque de oportunidad'))).toBe(true);
    const b = setup();
    perform(b.g, b.cb, act(b.g, b.cb, 'disengage'));
    perform(b.g, b.cb, act(b.g, b.cb, 'row'));
    expect(b.cb.log.some(l => l.t.includes('ataque de oportunidad'))).toBe(false);
    expect(b.hero.row).toBe('back');
  });

  it('poner a salvo lleva al caído a la retaguardia', () => {
    const { g, cb, ally } = setup();
    ally.row = 'front';
    ally.hp = 0;
    perform(g, cb, act(g, cb, 'rescue'), ally.key);
    expect(ally.row).toBe('back');
    expect(cb.moved).toBe(true);
  });

  it('el enemigo agarrado no cambia de fila: gasta su turno en soltarse', () => {
    let held = 0;
    for (let seed = 1; seed <= 10; seed++) {
      const { g, cb, foe } = setup();
      g.rng.seed = seed;
      perform(g, cb, act(g, cb, 'grapple'), foe.key);
      if (!foe.grappled) continue;
      held++;
      cb.turn = cb.order.indexOf(foe.key);
      foe.plan = { kind: 'ranged', targets: [cb.units.find(u => u.side === 'party')!.key], move: 'back' };
      enemyTurn(g, cb);
      expect(foe.row).toBe('front');
    }
    expect(held).toBeGreaterThan(0);
  });

  it('vigilar: quien vigila dispara al que ataca a su aliado', () => {
    const { g, cb, hero, ally, foe } = setup();
    ally.row = 'back';
    cb.turn = cb.order.indexOf(ally.key);
    cb.acted = false;
    const watch = act(g, cb, 'watch');
    expect(watch).toBeDefined();
    perform(g, cb, watch, hero.key);
    expect(ally.watch).toBe(hero.key);
    cb.turn = cb.order.indexOf(foe.key);
    foe.plan = { kind: 'melee', targets: [hero.key] };
    enemyTurn(g, cb);
    expect(cb.log.some(l => l.t.includes('vigilaba'))).toBe(true);
  });
});
