import { exportGame, importGame } from './copia';
import { newGame } from './game';

describe('copia de seguridad de partidas', () => {
  const g = newGame(1, 'Aldren', 'fighter', 'human');

  it('exporta y restaura la misma partida en otro archivo', () => {
    const r = importGame(exportGame(g, 150), 3, 150);
    expect('game' in r && r.game.slot).toBe(3);
    expect('game' in r && r.game.party[0].name).toBe('Aldren');
  });

  it('rechaza textos que no son copias', () => {
    expect(importGame('hola', 1, 150)).toHaveProperty('error');
    expect(importGame('{"mazmorreo":1}', 1, 150)).toHaveProperty('error');
    expect(importGame(JSON.stringify({ game: g }), 1, 150)).toHaveProperty('error');
  });

  it('no restaura copias de una versión más nueva', () => {
    const r = importGame(exportGame(g, 160), 1, 150);
    expect('error' in r && r.error).toMatch('v0.160');
  });

  it('en desarrollo (versión 0) acepta cualquier copia', () => {
    expect(importGame(exportGame(g, 160), 1, 0)).toHaveProperty('game');
  });
});
