// La pieza del flanco (2026-11-27): objetos que hay que romper antes de que se activen e «Ir al flanco».
import { newGame, Game } from './game';
import { enterZone } from './dungeon';
import { actionsFor, applyDamage, checkEnd, Combat, endTurn, enemyTurn, perform, startCombat, targetsFor, Unit } from './combat';
import { createAlly } from './rules';
import { GOALS } from '../data/objetivos';

function party(zone: string, level = 3): Game {
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  g.rng.seed = 11;
  for (const a of ['tiko', 'brunna', 'edmund']) g.party.push(createAlly(a, level, level >= 3 ? 900 : 300));
  enterZone(g, zone);
  return g;
}
const piece = (cb: Combat) => cb.units.find(u => u.key === 'piece');
const hero = (cb: Combat) => cb.units.find(u => u.side === 'party' && u.charId === cb.units[0].charId)!;
const turnOf = (cb: Combat, u: Unit) => { cb.turn = cb.order.indexOf(u.key); cb.acted = cb.bonus = cb.moved = false; };
const act = (g: Game, cb: Combat, id: string) => actionsFor(g, cb).find(a => a.id === id || a.id.startsWith(`${id}:`));
/** Pasa turnos sin hacer nada (el grupo aguanta) hasta el asalto pedido. */
function untilRound(g: Game, cb: Combat, round: number) {
  for (let i = 0; i < 300 && cb.round < round && !cb.result; i++) {
    for (const u of cb.units) if (u.side === 'party') u.hp = 999;
    const u = cb.units.find(x => x.key === cb.order[cb.turn])!;
    if (u.side === 'enemy') enemyTurn(g, cb);
    else { cb.acted = true; endTurn(g, cb); }
  }
}

describe('la pieza del flanco', () => {
  it('hay ocho piezas, una cada dos zonas, con su lado y su imagen', () => {
    const ps = GOALS.filter(x => x.kind === 'piece');
    expect(ps).toHaveLength(8);
    for (const p of ps) {
      expect(['left', 'right']).toContain(p.piece!.side);
      expect(p.by).toBeGreaterThanOrEqual(2);
    }
    const zones = ps.map(p => p.enc.slice(0, 2));
    for (const adv of ['z', 'b', 'm', 's']) {
      const mine = zones.filter(z => z[0] === adv).map(z => +z[1]);
      expect(mine).toHaveLength(2);
      expect(mine.some(n => n <= 2) && mine.some(n => n >= 3)).toBe(true);
    }
  });

  it('el torno va en el flanco, con la CA de la madera del SRD', () => {
    const g = party('m2');
    const cb = startCombat(g, 'm2_e06');
    const p = piece(cb)!;
    expect(p.flank).toBe(true);
    expect(p.ac).toBe(15);
    expect(cb.order).not.toContain('piece');
  });

  it('desde la vanguardia no se le pega cuerpo a cuerpo; «Ir al flanco» provoca ataque de oportunidad y deja pegarle', () => {
    const g = party('m2');
    const cb = startCombat(g, 'm2_e06');
    const h = hero(cb);
    h.row = 'front';
    turnOf(cb, h);
    const atk = actionsFor(g, cb).find(a => a.id.startsWith('atk:') && a.target === 'enemy-melee')!;
    expect(targetsFor(cb, atk).some(u => u.key === 'piece')).toBe(false);
    perform(g, cb, act(g, cb, 'flank')!);
    expect(h.flank).toBe(true);
    expect(cb.log.some(l => l.t.includes('ataque de oportunidad'))).toBe(true);
    expect(targetsFor(cb, atk).map(u => u.key)).toEqual(['piece']);
    // Desde el flanco solo se vuelve: no se puede ir atrás de golpe.
    cb.moved = false;
    expect(act(g, cb, 'row')).toBeUndefined();
    expect(act(g, cb, 'flank')!.label).toBe('Volver a la vanguardia');
  });

  it('Destrabarse antes de ir al flanco evita el ataque de oportunidad', () => {
    const g = party('m2');
    const cb = startCombat(g, 'm2_e06');
    const h = hero(cb);
    h.row = 'front';
    turnOf(cb, h);
    perform(g, cb, act(g, cb, 'disengage')!);
    perform(g, cb, act(g, cb, 'flank')!);
    expect(cb.log.some(l => l.t.includes('ataque de oportunidad'))).toBe(false);
  });

  it('romper la pieza cumple el objetivo y devuelve a la vanguardia a quien estaba en el flanco', () => {
    const g = party('m2');
    const cb = startCombat(g, 'm2_e06');
    const h = hero(cb);
    h.row = 'front';
    h.flank = true;
    applyDamage(g, cb, piece(cb)!, 99, 'contundente', h);
    expect(cb.goal?.status).toBe('ok');
    expect(h.flank).toBe(false);
    expect(checkEnd(g, cb)).toBe(false);
  });

  it('si nadie rompe el torno, al empezar el asalto 3 caen las rocas sobre la vanguardia', () => {
    const g = party('m2');
    const cb = startCombat(g, 'm2_e06');
    untilRound(g, cb, 3);
    expect(cb.log.some(l => l.t.includes('se activará al empezar el próximo asalto'))).toBe(true);
    expect(cb.log.some(l => l.t.includes('las rocas caen'))).toBe(true);
    expect(cb.log.some(l => l.t.includes('Salvación de Destreza'))).toBe(true);
    expect(cb.goal?.status).toBe('fail');
    expect(piece(cb)).toBeUndefined();
  });

  it('la catapulta dispara cada asalto hasta que se corte su cuerda', () => {
    const g = party('b1', 2);
    const cb = startCombat(g, 'b1_e06');
    untilRound(g, cb, 4);
    expect(cb.log.filter(l => l.t.includes('dispara una piedra')).length).toBe(3);
    expect(piece(cb)).toBeDefined();
    applyDamage(g, cb, piece(cb)!, 99, 'cortante', cb.units[0]);
    untilRound(g, cb, 5);
    expect(cb.log.filter(l => l.t.includes('dispara una piedra')).length).toBe(3);
  });

  it('el cuerno: un goblin corre al flanco en el asalto 2 y lo toca en el 3; si cae antes, ya nadie lo toca', () => {
    for (const stop of [false, true]) {
      const g = party('z2', 2);
      const cb = startCombat(g, 'z2_e04');
      const runner = cb.units.find(u => u.key === cb.runner)!;
      expect(runner.name).toMatch(/^Guardia del jefe goblin/);
      untilRound(g, cb, 2);
      for (let i = 0; i < 50 && !runner.flank && !cb.result; i++) enemyStep(g, cb);
      expect(runner.flank).toBe(true);
      expect(cb.log.some(l => l.t.includes('corre hacia cuerno de alarma'))).toBe(true);
      if (stop) {
        applyDamage(g, cb, runner, 99, 'contundente', cb.units[0]);
        expect(cb.log.some(l => l.t.includes('Ya nadie toca el cuerno'))).toBe(true);
        expect(cb.goal?.status).toBe('ok');
        expect(piece(cb)).toBeUndefined();
      } else {
        untilRound(g, cb, 4);
        expect(cb.log.some(l => l.t.includes('toca el cuerno'))).toBe(true);
        expect(cb.goal?.status).toBe('fail');
        expect(cb.units.some(u => u.name.startsWith('Goblin del cuerno'))).toBe(true);
      }
    }
  });

  it('la jaula: el cieno empieza encerrado y sale si tiran de la palanca', () => {
    const g = party('s4', 5);
    const cb = startCombat(g, 's4_e04');
    expect(cb.caged?.map(u => u.name)).toEqual(['Cieno guardián']);
    expect(cb.units.some(u => u.name === 'Cieno guardián')).toBe(false);
    untilRound(g, cb, 4);
    expect(cb.goal?.status).toBe('fail');
    expect(cb.units.some(u => u.name === 'Cieno guardián')).toBe(true);
  });
});

/** Un paso: el turno que toque (enemigo o personaje que pasa). */
function enemyStep(g: Game, cb: Combat) {
  for (const u of cb.units) if (u.side === 'party') u.hp = 999;
  const u = cb.units.find(x => x.key === cb.order[cb.turn])!;
  if (u.side === 'enemy') enemyTurn(g, cb);
  else { cb.acted = true; endTurn(g, cb); }
}
