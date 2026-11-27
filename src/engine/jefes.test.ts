// Jefes tácticos (diseño del 23-nov, aprobado el 27-nov): anuncio, mitad de PG y preparativos de los cuatro jefes.
import { newGame, Game } from './game';
import { enterZone, bossEncounter, bossPrep } from './dungeon';
import { applyDamage, behaviorOf, Combat, endTurn, startCombat, Unit, validTargets } from './combat';
import { createAlly } from './rules';

function boss(zone: string, flags: string[] = []): { g: Game; cb: Combat; b: Unit } {
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  g.rng.seed = 3;
  enterZone(g, zone);
  g.flags = [...(g.flags ?? []), ...flags];
  const cb = startCombat(g, bossEncounter(zone));
  const b = cb.units.filter(u => u.side === 'enemy').sort((x, y) => y.maxHp - x.maxHp)[0];
  return { g, cb, b };
}
const turnOf = (cb: Combat, u: Unit) => { cb.turn = cb.order.indexOf(u.key); };
const hero = (cb: Combat) => cb.units.find(u => u.side === 'party')!;

describe('jefes', () => {
  it('a mitad de PG dicen su frase una sola vez', () => {
    for (const z of ['z4', 'b4', 'm4', 's4']) {
      const { g, cb, b } = boss(z);
      applyDamage(g, cb, b, b.hp - Math.floor(b.maxHp / 2), 'psíquico', hero(cb));
      expect(b.half).toBe(true);
      const n = cb.log.filter(l => l.c === 'big').length;
      applyDamage(g, cb, b, 1, 'psíquico', hero(cb));
      expect(cb.log.filter(l => l.c === 'big').length).toBe(n);
    }
  });

  it('Xiximanter anuncia la bola de fuego antes de lanzarla', () => {
    const { g, cb, b } = boss('s4');
    turnOf(cb, b);
    endTurn(g, cb);
    expect(b.warn).toBe('Bola de fuego');
    expect(behaviorOf(g, cb, b)[0]).toContain('Bola de fuego');
  });

  it('Vharzûl en vuelo no se puede atacar cuerpo a cuerpo', () => {
    const { cb, b } = boss('m4');
    const h = hero(cb);
    h.row = 'front';
    b.row = 'front';
    for (const u of cb.units) if (u.side === 'enemy' && u !== b) u.dead = true;
    expect(validTargets(cb, h, 'melee')).toContain(b);
    b.flying = true;
    expect(validTargets(cb, h, 'melee')).not.toContain(b);
  });

  it('los preparativos se ven antes del jefe y cambian el combate', () => {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    g.flags = ['b4_promesa', 'm3_valvulas', 's4_libres'];
    expect(bossPrep(g, 'Treant')).toHaveLength(1);
    expect(bossPrep(g, 'Young White Dragon')).toHaveLength(1);
    expect(bossPrep(g, 'Xiximanter')).toHaveLength(1);
    const knots = (cb: Combat) => cb.units.filter(u => u.mon === 'Awakened Tree').length;
    const a = boss('b4'), b = boss('b4', ['b4_promesa']);
    expect(knots(b.cb)).toBe(knots(a.cb) - 1);
    expect(boss('m4', ['m3_valvulas']).b.weakBreath).toBe(true);
    expect(boss('s4', ['s4_libres']).b.spent).toBe(1);
  });

  it('los nudos dicen que alimentan al Corazón', () => {
    const { g, cb } = boss('b4');
    const knot = cb.units.find(u => u.mon === 'Awakened Tree')!;
    expect(behaviorOf(g, cb, knot)[0]).toContain('Alimenta al Corazón');
  });

  it('con un compañero, el enemigo común explica cómo se comporta', () => {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    g.party.push(createAlly('tiko', 2, 300));
    enterZone(g, 'z1');
    const cb = startCombat(g, 'z1_e01');
    const foe = cb.units.find(u => u.side === 'enemy')!;
    expect(behaviorOf(g, cb, foe).length).toBeGreaterThan(0);
  });
});
