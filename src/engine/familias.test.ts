// Enemigos que se comportan según su familia (hilo «Recoger mejoras para la nueva versión», 2026-11-19).
import { newGame } from './game';
import { enterZone } from './dungeon';
import { Combat, enemyTurn, planAll, startCombat, Unit } from './combat';
import { createAlly } from './rules';
import { Game } from './game';
import { MONSTERS } from '../data/srd';

/** Combate de la zona 1 con el héroe y Tiko, muy resistentes; el enemigo original pasa a ser `mon`. */
function setup(mon: string, seed = 7): { g: Game; cb: Combat; hero: Unit; tiko: Unit; foe: Unit } {
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  g.rng.seed = seed;
  g.party.push(createAlly('tiko', 3, 900));
  enterZone(g, 'z1');
  const cb = startCombat(g, 'z1_e02');
  const foe = cb.units.find(u => u.side === 'enemy')!;
  for (const u of cb.units) if (u.side === 'enemy' && u !== foe) u.hp = 0, u.dead = true;
  become(foe, mon);
  for (const u of cb.units) if (u.side === 'party') { u.hp = u.maxHp = 500; u.row = 'front'; }
  return { g, cb, hero: cb.units.find(u => u.side === 'party' && u.charId !== 'tiko')!, tiko: cb.units.find(u => u.charId === 'tiko')!, foe };
}
function become(u: Unit, mon: string, row: Unit['row'] = 'front') {
  const m = MONSTERS[mon];
  Object.assign(u, { mon, name: m.name, hp: m.hp, maxHp: m.hp, row, recharge: {}, plan: undefined, dead: false, fled: false });
}
function add(cb: Combat, base: Unit, mon: string, row: Unit['row'], n = 1): Unit[] {
  const out: Unit[] = [];
  for (let i = 0; i < n; i++) {
    const u = { ...base, key: `extra_${mon}_${cb.units.length}` };
    become(u, mon, row);
    cb.units.push(u);
    cb.order.push(u.key);
    out.push(u);
  }
  return out;
}
const turnOf = (cb: Combat, u: Unit) => { cb.turn = cb.order.indexOf(u.key); };

describe('enemigos que no actúan por error', () => {
  it('un cuerpo a cuerpo detrás ocupa el sitio de un tirador de delante, que retrocede', () => {
    const { g, cb, foe } = setup('Zombie');
    foe.row = 'back';
    const archers = add(cb, foe, 'Goblin Warrior', 'front', 3);
    planAll(g, cb);
    expect(foe.plan?.move).toBe('front');
    turnOf(cb, foe);
    enemyTurn(g, cb);
    expect(foe.row).toBe('front');
    expect(archers.filter(a => a.row === 'back')).toHaveLength(1);
    expect(cb.units.filter(u => u.side === 'enemy' && !u.dead && u.row === 'front')).toHaveLength(3);
  });

  it('si delante no hay tiradores, espera su hueco y el registro lo dice', () => {
    const { g, cb, foe } = setup('Zombie');
    foe.row = 'back';
    add(cb, foe, 'Zombie', 'front', 3);
    planAll(g, cb);
    expect(foe.plan).toBeUndefined();
    turnOf(cb, foe);
    enemyTurn(g, cb);
    expect(cb.log.some(l => l.t.includes('espera detrás a que se abra un hueco'))).toBe(true);
  });

  it('ningún enemigo avanza a una fila que ya tiene tres', () => {
    const { g, cb, foe } = setup('Wolf');
    foe.row = 'back';
    add(cb, foe, 'Wolf', 'front', 3);
    planAll(g, cb);
    expect(foe.plan?.move).toBeUndefined();
  });
});

describe('familias de enemigos', () => {
  it('goblins: sin su jefe huyen a la mitad de sus PG; con él, no', () => {
    let fledWith = 0;
    let fledWithout = 0;
    for (let seed = 1; seed <= 30; seed++) for (const bossAlive of [true, false]) {
      const { g, cb, foe } = setup('Goblin Warrior', seed);
      const [boss] = add(cb, foe, 'Goblin Boss', 'back');
      if (!bossAlive) { boss.dead = true; boss.hp = 0; }
      foe.hp = Math.floor(foe.maxHp * 0.4);
      // Sin nadie delante: así no hay ataque de oportunidad al huir (se prueba aparte).
      for (const u of cb.units) if (u.side === 'party') u.row = 'back';
      turnOf(cb, foe);
      enemyTurn(g, cb);
      if (foe.fled) bossAlive ? fledWith++ : fledWithout++;
    }
    expect(fledWith).toBe(0);
    expect(fledWithout).toBeGreaterThan(5);
  });

  it('no muertos: siguen a la misma presa hasta que cae', () => {
    const { g, cb, hero, tiko, foe } = setup('Zombie');
    planAll(g, cb);
    const first = foe.plan!.targets[0];
    for (let i = 0; i < 5; i++) { foe.plan = undefined; planAll(g, cb); expect(foe.plan!.targets[0]).toBe(first); }
    (first === hero.key ? hero : tiko).hp = 0;
    foe.plan = undefined;
    planAll(g, cb);
    expect(foe.plan!.targets[0]).not.toBe(first);
  });

  it('lanzadores: si alguien les cubre, se retiran a la retaguardia', () => {
    const { g, cb, tiko, foe } = setup('Cultist');
    tiko.row = 'back'; // con uno solo delante no usa la onda atronadora
    const [mage] = add(cb, foe, 'Orvane', 'front');
    planAll(g, cb);
    expect(mage.plan?.kind).toBe('magic');
    expect(mage.plan?.move).toBe('back');
  });

  it('sectarios: van a por quien ha herido a su líder', () => {
    const { g, cb, tiko, foe } = setup('Cultist');
    const [mage] = add(cb, foe, 'Orvane', 'back');
    mage.lastHitBy = tiko.key;
    for (let seed = 1; seed <= 10; seed++) {
      g.rng.seed = seed;
      foe.plan = undefined;
      planAll(g, cb);
      expect(foe.plan!.targets[0]).toBe(tiko.key);
    }
  });
});
