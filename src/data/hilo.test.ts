import { rumorsAfter } from './hilo';
import { newGame } from '../engine/game';
import { endAdventure } from '../engine/posada';

test('al terminar una aventura llega un rumor que la une con la siguiente, y otro según lo decidido', () => {
  expect(rumorsAfter('hondaroca')).toHaveLength(1);
  expect(rumorsAfter('hondaroca', ['z4_compuertas'])).toHaveLength(2);
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  g.flags = ['b4_driade'];
  endAdventure(g, 'corazon_hueco');
  expect(g.news?.some(n => n.includes('dríade'))).toBe(true);
});
