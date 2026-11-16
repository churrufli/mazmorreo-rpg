// Variedad de enemigos: cada encuentro puede salir con su enemigo de siempre o con una criatura
// del SRD del mismo valor de desafío, elegida una vez por partida (el autor 2026-11-16).
import { newGame } from './game';
import { rolledEnemies } from './dungeon';
import { enemiesOf } from './escenas';
import { MONSTERS } from '../data/srd';
import { IMG } from '../assets';
import { PORTRAIT_FRAMES } from '../data/portraitFrames';
import hondaroca from '../data/hondaroca.json';
import corazon from '../data/corazon.json';
import montana from '../data/montana.json';

const withAlt = [hondaroca, corazon, montana].flatMap((d: any) => d.zones.flatMap((z: any) => z.rooms.flatMap((r: any) => r.contents)))
  .filter((c: any) => c.type === 'encounter' && c.enemies.some((e: any) => e.alt)).map((c: any) => ({ c }));
// Variantes más flojas a propósito: no hay criaturas de VD 0 en la montaña ni un hongo que ataque.
const EASIER = new Set(['Goat', 'Hawk', 'Shrieker']);

test('las variantes son criaturas con ficha, imagen, recorte de cara y los mismos PX que la original', () => {
  expect(withAlt.length).toBeGreaterThan(15);
  for (const { c } of withAlt) for (const e of (c as any).enemies) for (const a of e.alt ?? []) {
    const m = MONSTERS[a.srd_creature];
    expect(m).toBeDefined();
    expect(IMG[m.img]).toBeDefined();
    expect(PORTRAIT_FRAMES[m.img]).toBeDefined();
    if (!EASIER.has(a.srd_creature)) expect(`${c.id} ${a.srd_creature} ${m.xp}`).toBe(`${c.id} ${a.srd_creature} ${MONSTERS[e.srd_creature].xp}`);
  }
});

test('la variante es siempre la misma en una partida y cambia entre partidas', () => {
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  for (const { c } of withAlt) expect(rolledEnemies(g, c.id as string)).toEqual(rolledEnemies(g, c.id as string));
  const seen = new Set<string>();
  for (let v = 0; v < 200; v++) {
    g.variant = v * 7919;
    for (const { c } of withAlt) for (const e of enemiesOf(g, c.id as string)) seen.add(e.srd_creature);
  }
  for (const { c } of withAlt) for (const e of (c as any).enemies) {
    if (!e.alt) continue;
    expect(seen).toContain(e.srd_creature);
    for (const a of e.alt) expect(seen).toContain(a.srd_creature);
  }
});

test('la variante conserva el número de enemigos y no deja la lista de alternativas', () => {
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  for (let v = 0; v < 20; v++) {
    g.variant = v;
    for (const { c } of withAlt) {
      const base = (c as any).enemies;
      const got = rolledEnemies(g, c.id as string);
      expect(got.map((e: any) => e.count)).toEqual(base.map((e: any) => e.count));
      expect(got.some((e: any) => e.alt)).toBe(false);
    }
  }
});
