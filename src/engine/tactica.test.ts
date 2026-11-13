// Combate más táctico (hilo «Ideas para nueva versión», 2026-11-13): reglas del SRD 5.2.1.
import { newGame } from './game';
import { enterZone } from './dungeon';
import { actionsFor, Combat, enemyTurn, perform, startCombat, Unit, useInspiration } from './combat';
import { createAlly } from './rules';
import { Game } from './game';

/** Combate de la zona 1 con el héroe (guerrero) y Tiko (pícaro), todos muy resistentes. */
function setup(seed = 7, cls: 'fighter' | 'wizard' = 'fighter'): { g: Game; cb: Combat; hero: Unit; tiko: Unit; foe: Unit } {
  const g = newGame(1, 'Prueba', cls, 'human');
  g.rng.seed = seed;
  g.party.push(createAlly('tiko', 3, 900));
  enterZone(g, 'z1');
  const cb = startCombat(g, 'z1_e02');
  for (const u of cb.units) u.hp = u.maxHp = 500;
  const hero = cb.units.find(u => u.side === 'party' && u.charId !== 'tiko')!;
  const tiko = cb.units.find(u => u.charId === 'tiko')!;
  const foe = cb.units.find(u => u.side === 'enemy')!;
  hero.row = 'front';
  foe.row = 'front';
  return { g, cb, hero, tiko, foe };
}
const turnOf = (cb: Combat, u: Unit) => { cb.turn = cb.order.indexOf(u.key); cb.acted = cb.bonus = cb.moved = false; };
const weaponAtk = (g: Game, cb: Combat) => actionsFor(g, cb).find(a => a.id.startsWith('atk:') && a.target === 'enemy-melee')!;

describe('ventaja y desventaja', () => {
  it('con una ventaja y dos desventajas se anulan y se tira un solo dado', () => {
    const { g, cb, hero, foe } = setup();
    turnOf(cb, hero);
    foe.dodge = true; // desventaja
    hero.poisoned = true; // desventaja
    foe.guided = true; // ventaja
    perform(g, cb, weaponAtk(g, cb), foe.key);
    expect(cb.roll?.adv).toBeUndefined();
  });
});

describe('esconderse', () => {
  it('solo desde la retaguardia', () => {
    const { g, cb, tiko } = setup();
    turnOf(cb, tiko);
    tiko.row = 'front';
    expect(actionsFor(g, cb).find(a => a.id === 'hide')?.off).toMatch(/retaguardia/);
    tiko.row = 'back';
    expect(actionsFor(g, cb).find(a => a.id === 'hide')?.off).toBeUndefined();
  });

  it('el enemigo que le elige tira Percepción contra su Sigilo; si no llega, ataca a otro', () => {
    const { g, cb, hero, tiko, foe } = setup();
    for (const u of cb.units) if (u.side === 'enemy' && u !== foe) u.hp = 0;
    tiko.row = 'back';
    tiko.hidden = 99;
    foe.row = 'back';
    turnOf(cb, foe);
    foe.plan = { kind: 'ranged', targets: [tiko.key] };
    foe.mon = 'Goblin Warrior';
    enemyTurn(g, cb);
    expect(cb.log.some(l => l.t.includes('pero no le encuentra'))).toBe(true);
    expect(tiko.hidden).toBe(99);
    expect(tiko.hp).toBe(500);
    expect(hero.hp).toBeLessThanOrEqual(500);
  });

  it('si la Percepción iguala o supera el Sigilo, deja de estar escondido', () => {
    const { g, cb, tiko, foe } = setup();
    tiko.row = 'back';
    tiko.hidden = -20;
    foe.row = 'back';
    turnOf(cb, foe);
    foe.plan = { kind: 'ranged', targets: [tiko.key] };
    enemyTurn(g, cb);
    expect(cb.log.some(l => l.t.includes('encuentra a') && l.t.includes('deja de estar escondido'))).toBe(true);
    expect(tiko.hidden).toBeUndefined();
  });
});

describe('Ayudar', () => {
  it('desde la vanguardia: el siguiente ataque de un aliado contra ese enemigo tiene ventaja', () => {
    const { g, cb, hero, tiko, foe } = setup();
    turnOf(cb, hero);
    const help = actionsFor(g, cb).find(a => a.id === 'help')!;
    expect(help.off).toBeUndefined();
    perform(g, cb, help, foe.key);
    expect(foe.helped).toBe(hero.key);
    tiko.row = 'back';
    turnOf(cb, tiko);
    const bow = actionsFor(g, cb).find(a => a.id.startsWith('atk:') && a.target === 'enemy')!;
    perform(g, cb, bow, foe.key);
    expect(cb.roll?.adv).toBe(1);
    expect(foe.helped).toBeUndefined();
  });

  it('no sirve si no hay ningún aliado en pie', () => {
    const { g, cb, hero, tiko } = setup();
    tiko.hp = 0;
    turnOf(cb, hero);
    expect(actionsFor(g, cb).find(a => a.id === 'help')?.off).toMatch(/aliado/);
  });
});

describe('Inspiración heroica', () => {
  it('no se gasta sola: el jugador decide si repite el dado tras fallar', () => {
    const { g, cb, hero, foe } = setup();
    g.party[0].inspired = true;
    turnOf(cb, hero);
    foe.ac = 99;
    perform(g, cb, weaponAtk(g, cb), foe.key);
    expect(cb.reroll?.a).toBe(hero.key);
    expect(g.inspUsed?.[g.party[0].id]).toBeUndefined();
    useInspiration(g, cb);
    expect(g.inspUsed?.[g.party[0].id]).toBe('hondaroca');
    expect(cb.log.some(l => l.t.includes('Inspiración heroica y repite el dado'))).toBe(true);
    // Ya gastada: el nuevo fallo no se puede repetir.
    expect(cb.reroll).toBeUndefined();
  });
});

describe('Maestría de armas', () => {
  it('Debilitar (espada larga): el enemigo golpeado ataca con desventaja', () => {
    const { g, cb, hero, foe } = setup();
    const c = g.party[0];
    c.items = c.items.filter(i => !['longsword', 'shortsword', 'mace', 'battleaxe', 'warhammer', 'spear'].includes(i.id));
    c.items.push({ uid: 'ls', id: 'longsword' });
    foe.ac = -50;
    for (let i = 0; i < 20 && !foe.sapped; i++) { turnOf(cb, hero); perform(g, cb, actionsFor(g, cb).find(a => a.id === 'atk:longsword')!, foe.key); foe.hp = 500; }
    expect(foe.sapped).toBe(hero.key);
  });

  it('el mago no tiene maestría', () => {
    const { g, cb, hero } = setup(7, 'wizard');
    turnOf(cb, hero);
    expect(actionsFor(g, cb).filter(a => a.id.startsWith('atk:')).every(a => !/Debilitar|Hostigar|Derribar|Empujar/.test(a.detail ?? ''))).toBe(true);
  });
});
