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
