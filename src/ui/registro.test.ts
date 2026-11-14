import { newGame } from '../engine/game';
import { endTurn, startCombat } from '../engine/combat';
import { enterZone } from '../engine/dungeon';
import { groupLog } from './registro';

test('el registro de combate se agrupa por rondas y turnos', () => {
  const rounds = groupLog([
    { t: '¡Combate!', r: 1, who: 'Ana' },
    { t: 'Ana ataca.', r: 1, who: 'Ana' },
    { t: 'Goblin falla.', r: 1, who: 'Goblin', c: 'miss' },
    { t: 'Ana cura.', r: 2, who: 'Ana', c: 'heal' },
  ]);
  expect(rounds.map(x => x.r)).toEqual([1, 2]);
  expect(rounds[0].turns.map(x => [x.who, x.lines.length])).toEqual([['Ana', 2], ['Goblin', 1]]);
});

test('las líneas del combate guardan la ronda y quién tenía el turno', () => {
  const g = newGame(7, 'Prueba', 'fighter', 'human');
  enterZone(g, 'z1');
  const cb = startCombat(g, 'z1_e01');
  for (let i = 0; i < 6 && !cb.result; i++) endTurn(g, cb);
  expect(cb.log.every(l => typeof l.r === 'number')).toBe(true);
  expect(cb.log.some(l => !!l.who)).toBe(true);
  expect(groupLog(cb.log).length).toBeGreaterThan(0);
});
