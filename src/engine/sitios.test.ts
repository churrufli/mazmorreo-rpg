// Sitios especiales del campo (2026-11-28): la cornisa de tiradores y la espalda.
import { newGame, Game } from './game';
import { enterZone, zoneById, bossEncounter } from './dungeon';
import { actionsFor, checkEnd, Combat, endTurn, enemyTurn, perform, planAll, preview, startCombat, targetsFor, Unit } from './combat';
import { createAlly } from './rules';
import { GOALS } from '../data/objetivos';

const ZONES = ['z2', 'z3', 'z4', 'b1', 'b2', 'b3', 'm1', 'm2', 'm3', 's1', 's2', 's3'];

function party(zone: string, variant: number, allies = 3): Game {
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  g.rng.seed = 11;
  g.variant = variant;
  for (const a of ['tiko', 'brunna', 'edmund'].slice(0, allies)) g.party.push(createAlly(a, 3, 900));
  enterZone(g, zone);
  return g;
}
/** Encuentros normales de la zona (sin el jefe ni los que tienen objetivo). */
const normal = (zone: string) => zoneById(zone).rooms.flatMap(r => r.contents as any[]).filter((c: any) => c.type === 'encounter').map((c: any) => c.id as string)
  .filter(id => id !== bossEncounter(zone) && !GOALS.some(x => x.enc === id));
/** Busca una partida y un combate con ese sitio. */
function find(site: 'ledge' | 'rear'): { g: Game; cb: Combat } {
  for (let v = 1; v < 400; v++) for (const z of ZONES) for (const id of normal(z)) {
    const g = party(z, v);
    const cb = startCombat(g, id);
    if (cb.site === site) return { g, cb };
  }
  throw new Error(`sin ${site}`);
}
const hero = (cb: Combat) => cb.units.find(u => u.side === 'party')!;
const turnOf = (cb: Combat, u: Unit) => { cb.turn = cb.order.indexOf(u.key); cb.acted = cb.bonus = cb.moved = false; };
const act = (g: Game, cb: Combat, id: string) => actionsFor(g, cb).find(a => a.id === id || a.id.startsWith(`${id}:`));
function untilRound(g: Game, cb: Combat, round: number) {
  for (let i = 0; i < 300 && cb.round < round && !cb.result; i++) {
    for (const u of cb.units) if (u.side === 'party') u.hp = 999;
    const u = cb.units.find(x => x.key === cb.order[cb.turn])!;
    if (u.side === 'enemy') enemyTurn(g, cb);
    else { cb.acted = true; endTurn(g, cb); }
  }
}

describe('sitios especiales del campo', () => {
  it('salen más o menos en 1 de cada 3 combates normales, nunca en jefes ni con pieza', () => {
    let n = 0, site = 0;
    for (let v = 1; v <= 12; v++) for (const z of ZONES) {
      for (const id of normal(z)) { n++; if (startCombat(party(z, v), id).site) site++; }
      expect(startCombat(party(z, v), bossEncounter(z)).site).toBeUndefined();
    }
    for (const x of GOALS) expect(startCombat(party(x.enc.slice(0, 2), 3), x.enc).site).toBeUndefined();
    expect(site / n).toBeGreaterThan(0.15);
    expect(site / n).toBeLessThan(0.4);
  });

  it('con menos de 3 personajes no sale ninguno, y para el mismo encuentro siempre es el mismo', () => {
    const { g, cb } = find('ledge');
    const id = cb.encounters[0];
    expect(startCombat(party(g.zone, g.variant!), id).site).toBe('ledge');
    expect(startCombat(party(g.zone, g.variant!, 1), id).site).toBeUndefined();
  });

  it('la cornisa: tiradores del propio encuentro arriba, con media cobertura y solo a distancia desde abajo', () => {
    const { g, cb } = find('ledge');
    const up = cb.units.filter(u => u.side === 'enemy' && u.flank);
    expect(up.length).toBeGreaterThanOrEqual(1);
    expect(cb.units.some(u => u.side === 'enemy' && !u.flank)).toBe(true);
    expect(cb.log.some(l => l.t.includes('Atletismo CD 12'))).toBe(true);
    const h = hero(cb);
    h.row = 'front';
    turnOf(cb, h);
    const melee = actionsFor(g, cb).find(a => a.id.startsWith('atk:') && a.target === 'enemy-melee')!;
    expect(targetsFor(cb, melee).some(u => u.flank)).toBe(false);
    expect(act(g, cb, 'flank')!.label).toBe('Trepar a la cornisa');
    // A distancia sí, con +2 a la CA por el parapeto.
    const t = up[0];
    const archer = cb.units.find(u => u.side === 'party' && (turnOf(cb, u), actionsFor(g, cb).some(a => a.id.startsWith('atk:') && a.target === 'enemy')))!;
    turnOf(cb, archer);
    const shot = actionsFor(g, cb).find(a => a.id.startsWith('atk:') && a.target === 'enemy')!;
    expect(targetsFor(cb, shot)).toContain(t);
    const high = preview(g, cb, shot, t)!.pct;
    t.flank = false;
    const low = preview(g, cb, shot, t)!.pct;
    t.flank = true;
    expect(high).toBeLessThan(low);
  });

  it('trepar pide Atletismo: si sale, se pega a los tiradores y ellos se vuelven contra él; vacía la cornisa, se baja', () => {
    const { g, cb } = find('ledge');
    const h = hero(cb);
    h.row = 'front';
    g.party[0].abil.str = 30; // siempre supera la CD 12
    turnOf(cb, h);
    perform(g, cb, act(g, cb, 'disengage')!);
    perform(g, cb, act(g, cb, 'flank')!);
    expect(h.flank).toBe(true);
    expect(cb.log.some(l => l.t.includes('trepa a la cornisa'))).toBe(true);
    const melee = actionsFor(g, cb).find(a => a.id.startsWith('atk:') && a.target === 'enemy-melee');
    cb.acted = false;
    const targets = targetsFor(cb, melee ?? { id: 'help', label: '', cost: 'action', target: 'enemy-melee' });
    expect(targets.length).toBeGreaterThan(0);
    expect(targets.every(u => u.flank && u.side === 'enemy')).toBe(true);
    planAll(g, cb);
    for (const u of cb.units.filter(x => x.side === 'enemy' && x.flank && x.plan?.kind === 'melee')) expect(u.plan!.targets).toEqual([h.key]);
    for (const u of cb.units.filter(x => x.side === 'enemy' && x.flank)) { u.hp = 0; u.dead = true; }
    checkEnd(g, cb);
    expect(h.flank).toBe(false);
  });

  it('trepar fallando la prueba deja al personaje abajo', () => {
    let failed = 0;
    for (let seed = 1; seed < 40 && !failed; seed++) {
      const { g, cb } = find('ledge');
      g.rng.seed = seed;
      const h = hero(cb);
      h.row = 'front';
      g.party[0].abil.str = 1;
      turnOf(cb, h);
      perform(g, cb, act(g, cb, 'disengage')!);
      perform(g, cb, act(g, cb, 'flank')!);
      if (cb.log.some(l => l.t.includes('resbala'))) { failed++; expect(h.flank).toBeFalsy(); }
    }
    expect(failed).toBe(1);
  });

  it('la espalda: se avisa en el asalto 1 y llegan en el 2, cuerpo a cuerpo contra la retaguardia', () => {
    const { g, cb } = find('rear');
    const later = cb.behind!;
    expect(later.length).toBeGreaterThanOrEqual(1);
    expect(cb.units.some(u => later.includes(u))).toBe(false);
    expect(cb.order.some(k => later.some(u => u.key === k))).toBe(false);
    expect(cb.log.some(l => l.t.includes('vuestra espalda'))).toBe(true);
    // Alguien detrás para recibirles.
    const back = cb.units.filter(u => u.side === 'party')[1];
    back.row = 'back';
    untilRound(g, cb, 2);
    const rear = cb.units.filter(u => u.rear);
    expect(rear.length).toBe(later.length);
    expect(cb.log.some(l => l.t.startsWith('¡Os atacan por la espalda'))).toBe(true);
    for (const u of rear.filter(x => x.plan)) expect(u.plan!.targets.every(k => cb.units.find(x => x.key === k)!.row === 'back')).toBe(true);
    // Desde la retaguardia se les pega cuerpo a cuerpo; desde la vanguardia, no (la retaguardia les tapa).
    turnOf(cb, back);
    const melee = actionsFor(g, cb).find(a => a.target === 'enemy-melee')!;
    expect(targetsFor(cb, melee).every(u => u.rear)).toBe(true);
    expect(targetsFor(cb, melee).length).toBe(rear.filter(u => u.hp > 0).length);
    const h = hero(cb);
    h.row = 'front';
    turnOf(cb, h);
    const m2 = actionsFor(g, cb).find(a => a.target === 'enemy-melee')!;
    expect(targetsFor(cb, m2).some(u => u.rear)).toBe(false);
  });

  it('si caen todos antes del asalto 2, los de la espalda llegan ya y el combate sigue', () => {
    const { g, cb } = find('rear');
    for (const u of cb.units.filter(x => x.side === 'enemy')) { u.hp = 0; u.dead = true; }
    expect(checkEnd(g, cb)).toBe(false);
    expect(cb.units.some(u => u.rear && u.hp > 0)).toBe(true);
  });
});
