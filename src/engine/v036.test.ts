import { newGame } from './game';
import { enterZone, plan, step } from './dungeon';
import { newItem } from './rules';
import { startCombat, enemyTurn, current, endTurn, withDice, Combat } from './combat';

const chestAt = (zone: string, id: string) => { const m = plan(zone).marks.find(x => x.id === id)!; return [m.q, m.r] as [number, number]; };

describe('obstáculos con objetos', () => {
  it('sin cuerda avisa y no abre; con cuerda abre el cofre', () => {
    const g = newGame(1, 'Prueba', 'wizard', 'human');
    enterZone(g, 'z1');
    const evs = step(g, chestAt('z1', 'z1_o01'));
    expect(evs.some(e => e.kind === 'msg' && e.lines.some(l => /cuerda/.test(l)))).toBe(true);
    expect(g.done).not.toContain('z1_o01');
    g.party[0].items.push(newItem('rope'));
    const again = step(g, chestAt('z1', 'z1_o01'));
    expect(again.some(e => e.kind === 'msg' && e.title === 'Cofre')).toBe(true);
    expect(g.done).toContain('z1_o01');
    expect(g.party[0].items.some(i => i.id === 'rope')).toBe(false); // un solo uso
  });

  it('el fuego de alquimista se gasta al quemar la telaraña', () => {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    enterZone(g, 'z2');
    g.party[0].items = g.party[0].items.filter(i => i.id !== 'torch');
    g.party[0].items.push(newItem('alchemists_fire'));
    step(g, chestAt('z2', 'z2_o01'));
    expect(g.done).toContain('z2_o01');
    expect(g.party[0].items.some(i => i.id === 'alchemists_fire')).toBe(false);
  });

  it('sin palanqueta se prueba fuerza una sola vez', () => {
    const g = newGame(3, 'Prueba', 'fighter', 'human');
    enterZone(g, 'z1');
    step(g, chestAt('z1', 'z1_o02'));
    const opened = g.done.includes('z1_o02');
    const tried = g.done.includes('z1_o02_tried');
    expect(opened !== tried).toBe(true);
  });
});

function fight(g: ReturnType<typeof newGame>, enc: string, hit: (cb: Combat) => void): Combat {
  const cb = startCombat(g, enc);
  for (let i = 0; i < 200 && !cb.result; i++) {
    if (current(cb).side === 'enemy' || current(cb).hp <= 0) withDice(cb, () => enemyTurn(g, cb));
    else { hit(cb); if (!cb.result) endTurn(g, cb); }
  }
  return cb;
}

describe('objetivos opcionales', () => {
  it('derribar al vigía antes del asalto 3 da premio', () => {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    enterZone(g, 'z1');
    const gold = g.gold;
    const cb = fight(g, 'z1_e06', c => { const e = c.units.find(u => u.side === 'enemy' && u.hp > 0); if (e) { e.hp = 0; e.dead = true; } });
    expect(cb.result).toBe('win');
    expect(g.goals?.z1_e06).toBe('ok');
    expect(g.gold).toBeGreaterThan(gold);
  });

  it('si el vigía sigue en pie en el asalto 3, huye y se falla', () => {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    enterZone(g, 'z1');
    g.party[0].hp = g.party[0].maxHp = 999;
    // La rata cae al llegar el asalto 3; el vigía sigue en pie y huye.
    const cb = fight(g, 'z1_e06', c => { if (c.round >= 3) for (const u of c.units) if (u.side === 'enemy' && u.name !== 'Vigía goblin') { u.hp = 0; u.dead = true; } });
    expect(cb.result).toBe('win');
    expect(g.goals?.z1_e06).toBe('fail');
    expect(cb.endLine).toMatch(/alarma/);
    expect(cb.summary?.[0]).toMatch(/huyó/);
  });
});

describe('intenciones', () => {
  it('cada enemigo en pie anuncia a quién ataca', () => {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    enterZone(g, 'z1');
    const cb = startCombat(g, 'z1_e01');
    for (const u of cb.units.filter(x => x.side === 'enemy')) expect(u.plan?.targets.length).toBeGreaterThan(0);
  });
});

describe('obstáculos cerrados no se cruzan', () => {
  const { closedDoors, findPath, hkey } = require('./dungeon');
  it('la puerta atascada no deja pasar sin abrirla; el modo desarrollador sí', () => {
    const g = newGame(1, 'Prueba', 'wizard', 'human');
    enterZone(g, 'z1');
    const door = chestAt('z1', 'z1_o02');
    g.done.push('z1_o02_tried');
    expect(closedDoors(g).get(hkey(door))).toBe('z1_o02');
    const before = hkey(g.pos);
    const evs = step(g, door);
    expect(evs.some(e => e.kind === 'msg' && e.title === 'Puerta atascada')).toBe(true);
    expect(hkey(g.pos)).toBe(before);
    expect(g.visited).not.toContain(hkey(door));
    step(g, door, true);
    expect(hkey(g.pos)).toBe(hkey(door));
  });

  it('los caminos no cruzan una puerta cerrada; abierta, sí', () => {
    const g = newGame(1, 'Prueba', 'wizard', 'human');
    enterZone(g, 'z1');
    const door = hkey(chestAt('z1', 'z1_o02'));
    const behind = plan('z1').marks.find(m => m.id === 'z1_c04')!;
    g.visited = plan('z1').cells.map(([q, r]) => `${q},${r}`);
    expect(findPath(g, [behind.q, behind.r])).toBeNull();
    g.done.push('z1_o02');
    expect(findPath(g, [behind.q, behind.r])?.map(hkey)).toContain(door);
  });

  it('nunca dejan sin camino a la salida, la llave o el jefe', () => {
    const g = newGame(1, 'Prueba', 'wizard', 'human');
    g.zone = 'b4';
    expect([...closedDoors(g).values()]).not.toContain('b4_o01');
    g.zone = 'b1';
    expect([...closedDoors(g).values()]).not.toContain('b1_o02');
  });
});
