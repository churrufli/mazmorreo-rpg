// Tutorial del campo de batalla (2026-11-19).
import { newGame } from '../engine/game';
import { enterZone } from '../engine/dungeon';
import { current, endTurn, startCombat } from '../engine/combat';
import { createAlly, newItem } from '../engine/rules';
import { BASIC, tutoKey, tutoStep } from './tutorial';

function setup(allies: string[] = []) {
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  for (const a of allies) g.party.push(createAlly(a, 3, 900));
  enterZone(g, 'z1');
  const cb = startCombat(g, 'z1_e02');
  for (let i = 0; i < 20 && current(cb).side !== 'party'; i++) endTurn(g, cb);
  return { g, cb, me: current(cb) };
}

describe('tutorial del campo de batalla', () => {
  it('recorre los pasos básicos en orden y luego calla', () => {
    const { g, cb, me } = setup();
    const seen = new Set<string>();
    const ids: string[] = [];
    for (let s = tutoStep(g, cb, me, k => seen.has(k)); s; s = tutoStep(g, cb, me, k => seen.has(k))) { ids.push(s.id); seen.add(tutoKey(s.id)); }
    expect(ids).toEqual(BASIC.map(s => s.id));
  });

  it('con vida baja avisa una vez: poción si la lleva y, si no, huir', () => {
    const { g, cb, me } = setup();
    const seen = new Set(BASIC.map(s => tutoKey(s.id)));
    me.hp = 1;
    const hero = g.party.find(c => c.id === me.charId)!;
    hero.items = [newItem('potion_healing')];
    expect(tutoStep(g, cb, me, k => seen.has(k))?.target).toBe('items');
    hero.items = [];
    expect(tutoStep(g, cb, me, k => seen.has(k))?.target).toBe('flee');
    seen.add(tutoKey('vida'));
    expect(tutoStep(g, cb, me, k => seen.has(k))).toBeUndefined();
  });

  it('con compañeros explica las filas', () => {
    const { g, cb, me } = setup(['tiko']);
    const seen = new Set(BASIC.map(s => tutoKey(s.id)));
    expect(tutoStep(g, cb, me, k => seen.has(k))?.id).toBe('filas');
  });
});
