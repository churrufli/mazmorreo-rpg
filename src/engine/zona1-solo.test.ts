// Hondaroca con el héroe solo: más recuperación en la primera zona (el autor 2026-11-16).
import { newGame } from './game';
import { contentById } from './dungeon';

test('el héroe empieza la partida con una poción de curación', () => {
  const g = newGame(1, 'Prueba', 'wizard', 'human');
  expect(g.party[0].items.filter(i => i.id === 'potion_healing')).toHaveLength(1);
});

test('el campamento de los mineros de la primera zona es un descanso largo', () => {
  expect((contentById('z1_rest1')!.c as any).rest).toBe('long');
  expect((contentById('z1_rest2')!.c as any).rest).toBe('short');
});
