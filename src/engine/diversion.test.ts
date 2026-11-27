// Más decisiones con sentido (2026-11-16): objetivos que no van contra el reloj, previsión de la tirada,
// motivos de ventaja visibles, cambios de objetivo al moverse y vías propias de los aliados en las escenas.
import { newGame, Game } from './game';
import { enterZone } from './dungeon';
import { actionsFor, Combat, perform, preview, startCombat, Unit } from './combat';
import { createAlly } from './rules';
import { chooseOption, optionOpen, optionShown, sceneById, testChance } from './escenas';
import { GOALS } from '../data/objetivos';
import { ITEMS } from '../data/srd';

function party(zone: string, allies: string[] = ['tiko', 'brunna']): Game {
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  g.rng.seed = 11;
  for (const a of allies) g.party.push(createAlly(a, 3, 900));
  enterZone(g, zone);
  return g;
}
const turnOf = (cb: Combat, u: Unit) => { cb.turn = cb.order.indexOf(u.key); cb.acted = cb.bonus = cb.moved = false; };
const hero = (cb: Combat) => cb.units.find(u => u.side === 'party' && !['tiko', 'brunna'].includes(u.charId!))!;

describe('objetivos nuevos', () => {
  it('todos tienen su combate, un premio que existe y, si piden a alguien, ese enemigo está en el encuentro', () => {
    const json = [require('../data/hondaroca.json'), require('../data/corazon.json'), require('../data/montana.json'), require('../data/tumba.json')];
    const encs = json.flatMap((d: any) => d.zones.flatMap((z: any) => z.rooms.flatMap((r: any) => r.contents))).filter((c: any) => c.type === 'encounter');
    for (const goal of GOALS) {
      const enc = encs.find((c: any) => c.id === goal.enc);
      expect(enc).toBeDefined();
      for (const it of goal.items) expect(ITEMS[it]).toBeDefined();
      if (goal.who) expect(enc.enemies.some((e: any) => e.name === goal.who) || goal.piece?.name === goal.who).toBe(true);
    }
    expect(new Set(GOALS.map(x => x.enc)).size).toBe(GOALS.length);
  });

  it('«primero»: se cumple si el primero en caer es el pedido y se falla si cae otro antes', () => {
    for (const right of [true, false]) {
      const g = party('z2');
      const cb = startCombat(g, 'z2_e03');
      expect(cb.goal?.g.kind).toBe('first');
      const hunter = cb.units.find(u => u.name.startsWith('Cazador goblin'))!;
      const other = cb.units.find(u => u.side === 'enemy' && !u.name.startsWith('Cazador goblin'))!;
      const h = hero(cb);
      turnOf(cb, h);
      const victim = right ? hunter : other;
      victim.hp = 1;
      victim.ac = 0;
      const ranged = actionsFor(g, cb).find(a => a.id.startsWith('atk:') && a.target === 'enemy');
      if (!right) { h.row = 'front'; }
      // Un golpe seguro: se fuerza el daño dejando al objetivo con 1 PG y CA 0 (puede fallar con un 1 natural).
      for (let i = 0; i < 20 && !victim.dead; i++) {
        turnOf(cb, h);
        const atk = right ? ranged ?? actionsFor(g, cb).find(a => a.id.startsWith('atk:'))! : actionsFor(g, cb).find(a => a.id.startsWith('atk:') && a.target === 'enemy-melee')!;
        if (right && atk.target === 'enemy-melee') { other.dead = true; }
        perform(g, cb, atk, victim.key);
      }
      expect(victim.dead).toBe(true);
      expect(cb.goal?.status).toBe(right ? 'ok' : 'fail');
    }
  });

  it('«que no caiga nadie»: falla en cuanto alguien del grupo cae', () => {
    const g = party('z2');
    const cb = startCombat(g, 'z2_e05');
    expect(cb.goal?.g.kind).toBe('nodown');
    const t = cb.units.find(u => u.charId === 'tiko')!;
    t.hp = 1;
    const foe = cb.units.find(u => u.side === 'enemy')!;
    turnOf(cb, foe);
    // Golpe directo a Tiko con el motor de daño (por medio de un ataque que no puede fallar).
    foe.plan = { kind: 'melee', targets: [t.key] };
    t.row = 'front';
    t.ac = -50;
    require('./combat').enemyTurn(g, cb);
    expect(t.hp).toBe(0);
    expect(cb.goal?.status).toBe('fail');
  });

  it('con el héroe solo no se ofrece «que no caiga nadie»', () => {
    const g = party('z2', []);
    const cb = startCombat(g, 'z2_e05');
    expect(cb.goal).toBeUndefined();
  });
});

describe('previsión de la tirada', () => {
  it('la probabilidad sale de las reglas: CA, bonificador, ventaja y desventaja', () => {
    const g = party('z2');
    const cb = startCombat(g, 'z2_e05');
    const h = hero(cb);
    turnOf(cb, h);
    h.row = 'front';
    const atk = actionsFor(g, cb).find(a => a.id.startsWith('atk:') && a.target === 'enemy-melee')!;
    const t = cb.units.find(u => u.side === 'enemy' && u.row === 'front')!;
    const base = preview(g, cb, atk, t)!;
    expect(base.pct).toBeGreaterThan(0);
    expect(base.pct).toBeLessThanOrEqual(95);
    t.prone = true;
    const up = preview(g, cb, atk, t)!;
    expect(up.adv).toBe(1);
    expect(up.pct).toBeGreaterThan(base.pct);
    expect(up.why.join()).toMatch(/derribado/);
    t.prone = false;
    t.dodge = true;
    const down = preview(g, cb, atk, t)!;
    expect(down.adv).toBe(-1);
    expect(down.pct).toBeLessThan(base.pct);
    // Prever no gasta nada ni tira dados.
    const seed = g.rng.seed;
    preview(g, cb, atk, t);
    expect(g.rng.seed).toBe(seed);
  });

  it('el registro dice por qué hay ventaja', () => {
    const g = party('z2');
    const cb = startCombat(g, 'z2_e05');
    const h = hero(cb);
    turnOf(cb, h);
    h.row = 'front';
    const t = cb.units.find(u => u.side === 'enemy' && u.row === 'front')!;
    t.prone = true;
    perform(g, cb, actionsFor(g, cb).find(a => a.id.startsWith('atk:') && a.target === 'enemy-melee')!, t.key);
    expect(cb.log.some(l => /con ventaja \(objetivo derribado\)/.test(l.t))).toBe(true);
  });
});

describe('vías de los aliados en las escenas', () => {
  it('solo salen si el aliado va en el grupo, y salen bien sin tirada', () => {
    const s = sceneById('z1_p02')!;
    const i = s.options.findIndex(o => o.ally === 'brunna');
    expect(i).toBeGreaterThan(0);
    const without = party('z1', ['tiko']);
    expect(optionShown(without, s, i)).toBe(false);
    expect(optionOpen(without, s, i)).toBe(false);
    const g = party('z1');
    expect(optionOpen(g, s, i)).toBe(true);
    const potions = g.party.flatMap(c => c.items).filter(x => x.id === 'potion_healing').length;
    chooseOption(g, 'z1_p02', i);
    expect(g.party.flatMap(c => c.items).filter(x => x.id === 'potion_healing').length).toBe(potions + 1);
    expect(g.done).toContain('z1_p02');
  });

  it('nunca son la única forma de resolver la escena', () => {
    const json = [require('../data/hondaroca.json'), require('../data/corazon.json'), require('../data/montana.json'), require('../data/tumba.json')];
    const scenes = json.flatMap((d: any) => d.zones.flatMap((z: any) => z.rooms.flatMap((r: any) => r.contents))).filter((c: any) => c.type === 'scene');
    const withAlly = scenes.filter((c: any) => c.options.some((o: any) => o.ally));
    expect(withAlly.length).toBeGreaterThanOrEqual(10);
    for (const c of withAlly) expect(c.options.filter((o: any) => !o.ally).length).toBeGreaterThan(0);
  });

  it('la probabilidad de una prueba es la del d20 contra la CD', () => {
    const c = createAlly('brunna', 1, 0);
    // Brunna: Fuerza +3. CD 12 → hace falta 9 o más en el d20: 12 de 20.
    expect(testChance(c, 'str', 12)).toBe(60);
    expect(testChance(c, 'str', 30)).toBe(0);
    expect(testChance(c, 'str', 2)).toBe(100);
  });
});
