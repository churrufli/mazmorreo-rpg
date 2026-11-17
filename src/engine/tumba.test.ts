// La Tumba de los Reyes Serpiente: Xiximanter es el mago del SRD 5.2.1.
import { newGame } from './game';
import { enterZone } from './dungeon';
import { enemyTurn, startCombat } from './combat';
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
