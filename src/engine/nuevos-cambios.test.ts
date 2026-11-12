// Cambios pedidos por el autor el 2026-11-10 (hilo «Recoger nuevos cambios»).
import { newGame } from './game';
import { ZONE_IDS, enterZone, keyCell, plan, secretPotions, sceneFight, step, Ev } from './dungeon';
import { chooseOption, sceneById } from './escenas';
import { actionsFor, current, endTurn, enemyTurn, perform, planAll, startCombat, targetsFor, withDice, conscious } from './combat';
import { createAlly } from './rules';

describe('áreas que se abren con una decisión', () => {
  for (const zone of ZONE_IDS) {
    const p = plan(zone);
    const secrets = p.marks.filter(m => m.kind === 'secret');
    if (!secrets.length) continue;
    it(`${zone}: no guardan nada necesario para pasar la zona`, () => {
      const hidden = new Set(secrets.flatMap(m => m.path ?? []));
      const needed = p.marks.filter(m => ['exit', 'ally', 'lever', 'gate'].includes(m.kind)).map(m => `${m.q},${m.r}`);
      for (const k of needed) expect(hidden.has(k)).toBe(false);
      const key = keyCell(zone);
      if (key) expect(hidden.has(key)).toBe(false);
    });
    it(`${zone}: cada una deja una poción de curación en el suelo al descubrirla`, () => {
      const g = newGame(1, 'Prueba', 'fighter', 'human');
      g.zone = zone;
      secretPotions(g);
      expect(Object.keys(g.drops ?? {})).toHaveLength(0);
      for (const m of secrets) g.found.push(m.id);
      secretPotions(g);
      secretPotions(g);
      for (const m of secrets) {
        const potions = Object.entries(g.drops ?? {}).filter(([k, items]) => m.path!.includes(k.split(':')[1]) && items.some(i => i.id === 'potion_healing'));
        expect(potions).toHaveLength(1);
      }
    });
  }
});

describe('huir de un combate que sale de una decisión', () => {
  it('el combate se queda en la casilla de la escena hasta vencerlo', () => {
    const g = newGame(3, 'Prueba', 'fighter', 'human');
    g.party.push(createAlly('tiko', 2, 400));
    enterZone(g, 'z2');
    const mark = plan('z2').marks.find(m => m.kind === 'scene' && m.id === 'z2_q02')!;
    const close = sceneById('z2_q02')!.options.findIndex(o => o.ok.fight === 'z2_e08' && !o.attr);
    const evs = chooseOption(g, 'z2_q02', close);
    expect(evs.some(e => e.kind === 'combat' && e.id === 'z2_e08')).toBe(true);
    // Huida: el grupo se aparta y la escena ya está hecha, pero el combate sigue allí.
    g.fled.push('z2_e08');
    expect(sceneFight(g, 'z2_q02')).toBe('z2_e08');
    const back: Ev[] = step(g, [mark.q, mark.r]);
    expect(back.some(e => e.kind === 'combat' && e.id === 'z2_e08')).toBe(true);
    g.done.push('z2_e08');
    expect(sceneFight(g, 'z2_q02')).toBeUndefined();
  });
});

describe('Fortaleza de muerto viviente', () => {
  it('el registro enseña la tirada y la CD', () => {
    const lines: string[] = [];
    for (let seed = 1; seed <= 8 && !lines.length; seed++) {
      const g = newGame(seed, 'Prueba', 'fighter', 'human');
      enterZone(g, 'z3');
      const cb = startCombat(g, 'z3_e02');
      for (let i = 0; i < 400 && !cb.result; i++) {
        for (const u of cb.units) if (u.side === 'party') u.hp = Math.max(u.hp, 500);
        if (current(cb).side === 'enemy' || current(cb).hp <= 0) { withDice(cb, () => enemyTurn(g, cb)); continue; }
        const atk = actionsFor(g, cb).find(a => a.cost === 'action' && a.target.startsWith('enemy') && !a.off && targetsFor(cb, a).some(conscious));
        if (atk) perform(g, cb, atk, targetsFor(cb, atk).find(conscious)!.key);
        if (!cb.result) endTurn(g, cb);
      }
      lines.push(...cb.log.map(l => l.t).filter(t => t.startsWith('Fortaleza de muerto viviente')));
    }
    expect(lines.length).toBeGreaterThan(0);
    for (const t of lines) expect(t).toMatch(/saca \d+ \(d20 \d+\) contra CD \d+ y (se niega a caer|cae)\.$/);
  });
});

describe('cambio de fila', () => {
  it('los enemigos vuelven a elegir objetivo según quién queda delante y detrás', () => {
    const g = newGame(5, 'Prueba', 'fighter', 'human');
    g.party.push(createAlly('liss', 3, 900));
    enterZone(g, 'z1');
    const cb = startCombat(g, 'z1_e02');
    const wiz = cb.units.find(u => u.charId === 'liss')!;
    const hero = cb.units.find(u => u.side === 'party' && u.charId !== 'liss')!;
    hero.row = 'front'; wiz.row = 'front';
    wiz.hp = wiz.maxHp = 200;
    const archer = cb.units.find(u => u.side === 'enemy' && u.row === 'back')!;
    const planOf = () => archer.plan;
    archer.plan = undefined;
    planAll(g, cb);
    expect(planOf()?.kind).toBe('ranged');
    expect(planOf()?.targets).toEqual([hero.key]);
    // Liss se retira: el arquero prefiere a la maga de la retaguardia.
    cb.turn = cb.order.indexOf(wiz.key);
    cb.moved = false;
    const row = actionsFor(g, cb).find(a => a.id === 'row')!;
    perform(g, cb, row);
    expect(wiz.row).toBe('back');
    expect(planOf()?.targets).toEqual([wiz.key]);
  });
});

describe('vanguardia vacía', () => {
  it('el último de delante puede ir atrás y los enemigos le siguen alcanzando', () => {
    const g = newGame(5, 'Prueba', 'fighter', 'human');
    enterZone(g, 'z1');
    const cb = startCombat(g, 'z1_e01');
    const hero = cb.units.find(u => u.side === 'party')!;
    hero.row = 'front';
    hero.hp = hero.maxHp = 500;
    cb.turn = cb.order.indexOf(hero.key);
    cb.moved = false;
    const row = actionsFor(g, cb).find(a => a.id === 'row')!;
    expect(row.off).toBeUndefined();
    perform(g, cb, row);
    expect(hero.row).toBe('back');
    expect(cb.units.some(u => u.side === 'party' && u.row === 'front')).toBe(false);
    // Los enemigos cuerpo a cuerpo llegan igual a la retaguardia; el combate sigue sin errores.
    for (const e of cb.units.filter(u => u.side === 'enemy')) if (e.plan) expect(e.plan.targets).toContain(hero.key);
    for (let i = 0; i < 40 && !cb.result; i++) current(cb).side === 'enemy' ? enemyTurn(g, cb) : endTurn(g, cb);
    expect(hero.hp).toBeLessThan(500);
  });
});
