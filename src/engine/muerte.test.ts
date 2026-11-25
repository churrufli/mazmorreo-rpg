// Caídos fuera del combate: siguen tirando salvaciones contra la muerte (el autor 2026-11-25).
import { newGame } from './game';
import { bossEncounter, enterZone, findPath, hkey, step } from './dungeon';
import { devWin, enemyTurn, startCombat } from './combat';
import { createAlly } from './rules';
import { bleed, deathSave, dying, stabilize } from './muerte';

const party = () => {
  const g = newGame(3, 'Prueba', 'fighter', 'human');
  g.party.push(createAlly('tiko', 2, 300), createAlly('liss', 2, 300));
  enterZone(g, 'z1');
  return g;
};

test('al ganar un combate, el caído no se estabiliza solo y conserva sus salvaciones', () => {
  const g = party();
  const cb = startCombat(g, 'z1_e06');
  const tiko = cb.units.find(u => u.charId === 'tiko')!;
  Object.assign(tiko, { hp: 0, deathS: 1, deathF: 1 });
  devWin(g, cb);
  const c = g.party.find(x => x.id === 'tiko')!;
  expect(dying(c)).toBe(true);
  expect([c.deathS, c.deathF]).toEqual([1, 1]);
});

test('una salvación por paso: acaba estable, en pie o muerto, nunca sigue igual', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const g = party();
    g.rng.seed = seed;
    const c = g.party[1];
    Object.assign(c, { hp: 0, stable: false, deathS: 0, deathF: 0 });
    let n = 0;
    while (dying(c) && n < 10) { bleed(g); n++; }
    expect(dying(c)).toBe(false);
    expect(n).toBeLessThanOrEqual(5);
    expect(c.dead || c.stable || c.hp === 1).toBe(true);
  }
});

test('tres fallos: muerto, y se avisa', () => {
  const g = party();
  const c = g.party[1];
  Object.assign(c, { hp: 0, stable: false, deathS: 0, deathF: 2 });
  for (let seed = 1; seed < 200; seed++) {
    g.rng.seed = seed;
    const copy = { ...c };
    const r = deathSave(g, copy);
    if (r.d < 10) { expect(copy.dead).toBe(true); expect(r.died).toBe(true); return; }
  }
  throw new Error('Ninguna tirada baja');
});

test('moverse por el mapa hace tirar al caído', () => {
  const g = party();
  const c = g.party[1];
  Object.assign(c, { hp: 0, stable: false, deathS: 0, deathF: 0 });
  const to = findPath(g, [g.pos[0] + 1, g.pos[1]], true)?.[0] ?? g.pos;
  if (hkey(to) === hkey(g.pos)) return;
  step(g, to);
  expect(c.deathS + c.deathF > 0 || !dying(c)).toBe(true);
});

test('estabilizar: con éxito deja de tirar; si falla, pasa el tiempo y tira otra salvación', () => {
  let ok = 0, ko = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const g = party();
    g.rng.seed = seed;
    const c = g.party[1];
    Object.assign(c, { hp: 0, stable: false, deathS: 0, deathF: 0 });
    const ev = stabilize(g, c.id)!;
    expect(ev.kind).toBe('msg');
    if (c.stable) ok++;
    else { ko++; expect(c.deathS + c.deathF > 0 || c.dead || c.hp === 1).toBe(true); }
  }
  expect(ok).toBeGreaterThan(0);
  expect(ko).toBeGreaterThan(0);
});

test('el jefe a veces remata a un caído que tiene delante', () => {
  let finished = 0;
  for (let seed = 1; seed <= 40 && !finished; seed++) {
    const g = party();
    g.rng.seed = seed;
    enterZone(g, 'z2');
    const cb = startCombat(g, bossEncounter('z2')!);
    const boss = cb.units.filter(u => u.side === 'enemy').sort((a, b) => b.maxHp - a.maxHp)[0];
    boss.row = 'front';
    const down = cb.units.find(u => u.side === 'party')!;
    Object.assign(down, { hp: 0, row: 'front' });
    const before = down.deathF ?? 0;
    cb.turn = cb.order.indexOf(boss.key);
    boss.plan = { kind: 'melee', targets: [cb.units.find(u => u.side === 'party' && u.hp > 0)!.key] } as any;
    enemyTurn(g, cb);
    if (cb.log.some(l => l.t.includes('que está en el suelo'))) { finished++; expect((down.deathF ?? 0) >= before || down.dead).toBe(true); }
  }
  expect(finished).toBeGreaterThan(0);
});
