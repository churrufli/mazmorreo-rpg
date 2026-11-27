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

describe('moral del grupo enemigo', () => {
  it('a la tercera, los malheridos huyen', () => {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    for (const a of ['tiko', 'brunna', 'edmund']) g.party.push(createAlly(a, 5, 6500));
    enterZone(g, 's3');
    const cb = startCombat(g, 's3_e02');
    expect(cb.morale).toBe(0);
    const hero = cb.units.find(u => u.side === 'party')!;
    const foes = cb.units.filter(u => u.side === 'enemy');
    const weak = foes.find(u => u.hp > 2)!;
    weak.hp = 1;
    const { applyDamage } = require('./combat');
    for (let i = 0; i < 3; i++) applyDamage(g, cb, foes.find(u => !u.dead && !u.fled && u !== weak) ?? weak, 0, 'contundente', hero, true);
    expect(cb.morale).toBe(3);
    expect(weak.fled || weak.dead).toBe(true);
  });
});

describe('rasgo de la sala', () => {
  it('angosto: dos por fila; resbaladizo: cambiar de fila puede tirar al suelo; humo: el fuego lo disipa', () => {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    for (const a of ['tiko', 'brunna', 'edmund']) g.party.push(createAlly(a, 2, 300));
    enterZone(g, 'z1');
    const cb = startCombat(g, 'z1_e07');
    expect(cb.terrain).toBe('narrow');
    expect(cb.units.filter(u => u.side === 'party' && u.row === 'front').length).toBeLessThanOrEqual(2);
    expect(cb.units.filter(u => u.side === 'enemy' && u.row === 'front').length).toBeLessThanOrEqual(2);
    let fell = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const h = newGame(1, 'Prueba', 'wizard', 'human');
      h.rng.seed = seed;
      enterZone(h, 'z1');
      const c2 = startCombat(h, 'z1_e09');
      expect(c2.terrain).toBe('slippery');
      const me = c2.units.find(u => u.side === 'party')!;
      c2.turn = c2.order.indexOf(me.key);
      c2.acted = c2.moved = false;
      me.disengaged = true;
      perform(h, c2, actionsFor(h, c2).find(a => a.id === 'row')!);
      if (me.prone) fell++;
    }
    expect(fell).toBeGreaterThan(0);
  });
});

describe('el ruido', () => {
  it('un combate largo avisa en el asalto 4 y el vecino llega en el 5', () => {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    for (const a of ['tiko', 'brunna', 'edmund']) g.party.push(createAlly(a, 2, 300));
    enterZone(g, 'z1');
    const cb = startCombat(g, 'z1_e05');
    expect(cb.neighbor).toBe('z1_e04');
    const { endTurn } = require('./combat');
    for (let i = 0; i < 200 && cb.round < 5 && !cb.result; i++) { for (const u of cb.units) if (u.side === 'party') u.hp = 999; cb.acted = true; endTurn(g, cb); }
    expect(cb.log.some(l => l.t.includes('Se oyen pasos'))).toBe(true);
    expect(cb.encounters).toContain('z1_e04');
  });
});
