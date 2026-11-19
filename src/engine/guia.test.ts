// Primera partida guiada en Hondaroca (2026-11-19).
import { newGame } from './game';
import { enterZone, Ev } from './dungeon';
import { guide } from './guia';

const titles = (evs: Ev[]) => evs.filter(e => e.kind === 'msg' && e.title === 'Consejo').length;

describe('consejos de la primera partida', () => {
  it('salen antes del primer combate y del primer descanso, y una sola vez', () => {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    enterZone(g, 'z1');
    g.place = 'dungeon';
    const first = guide(g, [{ kind: 'combat', id: 'z1_e01' }]);
    expect(first[0].kind).toBe('msg');
    expect(first.some(e => e.kind === 'combat')).toBe(true);
    expect(titles(guide(g, [{ kind: 'combat', id: 'z1_e02' }]))).toBe(0);
    const rest = guide(g, [{ kind: 'rest', id: 'z1_rest1', long: true, name: 'Campamento', text: '' }]);
    expect(rest.map(e => e.kind)).toEqual(['msg', 'rest']);
  });

  it('el consejo de las filas espera a que haya un compañero', () => {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    enterZone(g, 'z1');
    g.place = 'dungeon';
    guide(g, [{ kind: 'combat', id: 'z1_e01' }]);
    expect(g.guide).not.toContain('filas');
  });

  it('fuera de Hondaroca y en partidas ya avanzadas no salen', () => {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    enterZone(g, 'b1');
    g.place = 'dungeon';
    expect(titles(guide(g, [{ kind: 'combat', id: 'b1_e01' }]))).toBe(0);
    const old = newGame(2, 'Vieja', 'fighter', 'human');
    enterZone(old, 'z1');
    old.place = 'dungeon';
    old.visited = ['z1', 'z2'];
    expect(titles(guide(old, [{ kind: 'combat', id: 'z1_e01' }]))).toBe(0);
  });
});
