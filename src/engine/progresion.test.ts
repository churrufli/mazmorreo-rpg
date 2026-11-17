import { createHero, gainXp, raiseTo } from './rules';

test.each([
  ['fighter', 2, 'Oleada de acción'],
  ['fighter', 3, 'Crítico mejorado'],
  ['rogue', 2, 'Esconderse'],
  ['rogue', 3, '1d6 a 2d6'],
  ['cleric', 2, 'Chispa divina'],
  ['cleric', 3, 'Arma espiritual'],
  ['wizard', 3, 'Rayo abrasador'],
  ['ranger', 2, 'Tiro con arco'],
] as const)('%s anuncia su novedad de nivel %s', (cls, level, expected) => {
  const hero = createHero('Prueba', cls, 'human');
  raiseTo(hero, level - 1);
  const messages = raiseTo(hero, level);
  expect(messages.join(' ')).toContain(expected);
  expect(raiseTo(hero, level)).toEqual([]);
});

test('subida por PX: anuncia el nuevo conjuro y los espacios ganados', () => {
  const hero = createHero('Prueba', 'wizard', 'human');
  raiseTo(hero, 2);
  const messages = gainXp([hero], 600);
  expect(messages.join(' ')).toContain('Rayo abrasador');
  expect(messages.join(' ')).toContain('+2 de nivel 2');
  expect(hero.slots).toEqual([4, 2, 0]);
});

test('un hito que salta varios niveles anuncia cada desbloqueo en orden', () => {
  const hero = createHero('Prueba', 'fighter', 'human');
  const messages = raiseTo(hero, 6).join(' ');
  expect(messages).toContain('Oleada de acción');
  expect(messages).toContain('Crítico mejorado');
  expect(messages).toContain('Ataque adicional');
  expect(messages).toContain('Competencia: +2 → +3');
  expect(messages).toContain('mejora de característica o una dote');
  expect(messages.indexOf('Oleada de acción') < messages.indexOf('Crítico mejorado')).toBe(true);
});

test('nivel 6: informa de Furia y de la reserva de Imposición de manos', () => {
  const barbarian = createHero('Prueba', 'barbarian', 'human');
  const paladin = createHero('Prueba', 'paladin', 'human');
  raiseTo(barbarian, 5);
  raiseTo(paladin, 5);
  expect(raiseTo(barbarian, 6).join(' ')).toContain('Furia: +1 uso');
  const messages = raiseTo(paladin, 6).join(' ');
  expect(messages).toContain('Aura de protección');
  expect(messages).toContain('Imposición de manos: +5 PG');
});

// Nivel objetivo por aventura (el autor 2026-11-17): 2 en Hondaroca, 3 en el bosque y 4 en la montaña.
test('dentro de una aventura nadie pasa de su nivel objetivo y los PX de más se pierden', () => {
  const hero = createHero('Prueba', 'fighter', 'human');
  const messages = gainXp([hero], 5000, 2);
  expect(hero.level).toBe(2);
  expect(hero.xp).toBe(300);
  expect(messages.join(' ')).toContain('Nivel 2 es el máximo');
  gainXp([hero], 5000, 3);
  expect(hero.level).toBe(3);
  expect(hero.xp).toBe(900);
});

test('quien ya pasaba del objetivo (partidas antiguas) no baja ni pierde PX', () => {
  const hero = createHero('Prueba', 'fighter', 'human');
  raiseTo(hero, 5);
  const messages = gainXp([hero], 300, 3);
  expect(hero.level).toBe(5);
  expect(hero.xp).toBe(6500);
  expect(messages.join(' ')).not.toContain('máximo');
});

test('al entrar en la sala del jefe el grupo sube al nivel objetivo de la aventura', () => {
  const { newGame } = require('./game');
  const { cellMap, enterZone, step } = require('./dungeon');
  const { ADVS } = require('./aventuras');
  for (const [zone, level] of [['z4', 2], ['b4', 3], ['m4', 4]] as const) {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    enterZone(g, zone);
    expect(g.party[0].level).toBe(1);
    const adv = Object.values(ADVS).find((a: any) => a.data.zones.some((z: any) => z.id === zone)) as any;
    const zd = adv.data.zones.find((z: any) => z.id === zone);
    const idx = zd.rooms.findIndex((r: any) => r.contents.some((c: any) => c.type === 'encounter' && c.enemies.some((e: any) => e.srd_creature === adv.boss)));
    const cell = [...(cellMap(zone) as Map<string, number>)].find(([, v]) => v === idx)![0];
    const evs = step(g, cell.split(',').map(Number) as [number, number], true);
    expect(g.party[0].level).toBe(level);
    expect(evs.some((e: any) => e.kind === 'msg' && e.title === `Nivel ${level}`)).toBe(true);
  }
});
