// La Tumba de los Reyes Serpiente: Xiximanter es el mago del SRD 5.2.1.
import { newGame } from './game';
import { ZONE_IDS, enterZone, plan, zoneById } from './dungeon';
import { endTurn, enemyTurn, startCombat } from './combat';
import { createAlly } from './rules';

function boss() {
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  g.rng.seed = 11;
  g.party.push(createAlly('tiko', 5, 6500));
  enterZone(g, 's4');
  const cb = startCombat(g, 's4_e06');
  for (const u of cb.units) u.hp = u.maxHp = 500;
  for (const u of cb.units) if (u.side === 'party') u.row = 'front';
  for (const u of cb.units) if (u.side === 'enemy' && u.mon !== 'Xiximanter') u.hp = 0;
  const xi = cb.units.find(u => u.mon === 'Xiximanter')!;
  const turn = () => { cb.turn = cb.order.indexOf(xi.key); cb.acted = cb.bonus = cb.moved = false; xi.plan = undefined; enemyTurn(g, cb); };
  return { cb, turn };
}

describe('Xiximanter', () => {
  it('lanza la bola de fuego dos veces por combate y no más', () => {
    const { cb, turn } = boss();
    for (let i = 0; i < 6; i++) turn();
    expect(cb.log.filter(l => l.t.includes('usa Bola de fuego')).length).toBe(2);
  });

  it('sin bola de fuego hace tres estallidos arcanos', () => {
    const { cb, turn } = boss();
    turn();
    turn();
    const from = cb.log.length;
    turn();
    expect(cb.log.slice(from).filter(l => l.t.includes('Estallido arcano')).length).toBe(3);
  });
});

describe('Hongo chillón', () => {
  it('su primer chillido atrae a una criatura pequeña al asalto siguiente, también con el héroe solo; luego solo chilla', () => {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    g.rng.seed = 5;
    enterZone(g, 's4');
    const cb = startCombat(g, 's4_e01');
    const sh = cb.units.find(u => u.mon === 'Shrieker')!;
    const turn = () => { cb.turn = cb.order.indexOf(sh.key); cb.acted = cb.bonus = cb.moved = false; enemyTurn(g, cb); };
    const grito = () => cb.units.filter(u => u.key.startsWith('e_grito_'));
    const r0 = cb.round;
    turn();
    expect(cb.log.some(l => l.t.includes('Algo se acerca'))).toBe(true);
    // Durante el asalto del grito no llega nadie; al empezar el siguiente, sí.
    if (cb.round === r0) {
      expect(grito()).toHaveLength(0);
      cb.turn = cb.order.length - 1;
      endTurn(g, cb);
    }
    expect(cb.round).toBe(r0 + 1);
    const added = grito();
    expect(added).toHaveLength(1);
    expect(['Rat', 'Lizard']).toContain(added[0].mon);
    turn();
    expect(grito()).toHaveLength(1);
    expect(cb.log.some(l => l.t.includes('sigue chillando'))).toBe(true);
  });
});

// Las escenas de la tumba no estaban en el plano: sus combates (Sparamuntar, la gelatina...) nunca empezaban.
test('cada escena tiene su casilla en el mapa y los combates de escena no tienen ficha propia', () => {
  for (const z of ZONE_IDS) {
    const marks = new Set(plan(z).marks.map(m => m.id));
    const zone = zoneById(z) as any;
    const byElement = new Set((zone.elements ?? []).map((e: any) => e.scene));
    for (const r of zone.rooms) for (const c of r.contents) {
      if (c.type === 'scene' && !c.noMark && !byElement.has(c.id)) expect(`${c.id}:${marks.has(c.id)}`).toBe(`${c.id}:true`);
      if (c.type === 'encounter' && c.trigger === 'scene') expect(`${c.id}:${marks.has(c.id)}`).toBe(`${c.id}:false`);
    }
  }
});
