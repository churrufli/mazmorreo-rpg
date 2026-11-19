// Primera partida guiada en Hondaroca (2026-11-19). Los consejos del combate están en ui/tutorial.ts.
import { newGame } from './game';
import { enterZone, Ev } from './dungeon';
import { guide } from './guia';

const tips = (evs: Ev[]) => evs.filter(e => e.kind === 'msg' && e.title === 'Consejo').length;

describe('consejos de la primera partida', () => {
  it('salen antes del primer descanso y de la primera trampa, una sola vez', () => {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    enterZone(g, 'z1');
    g.place = 'dungeon';
    const rest = guide(g, [{ kind: 'rest', id: 'z1_rest1', long: true, name: 'Campamento', text: '' }]);
    expect(rest.map(e => e.kind)).toEqual(['msg', 'rest', 'msg']); // descanso y, al final, cómo moverse
    expect(tips(guide(g, [{ kind: 'rest', id: 'z1_rest2', long: false, name: 'Otro', text: '' }]))).toBe(0);
    expect(guide(g, [{ kind: 'trap', id: 't', name: 'Trampa' }])[0].kind).toBe('msg');
  });

  it('antes de un combate ya no sale ningún cartel: el tutorial va dentro de la batalla', () => {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    enterZone(g, 'z1');
    g.place = 'dungeon';
    g.guide = ['mover'];
    expect(tips(guide(g, [{ kind: 'combat', id: 'z1_e01' }]))).toBe(0);
  });

  it('fuera de Hondaroca y en partidas ya avanzadas no salen', () => {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    enterZone(g, 'b1');
    g.place = 'dungeon';
    expect(tips(guide(g, [{ kind: 'rest', id: 'b1_rest1', long: false, name: 'x', text: '' }]))).toBe(0);
    const old = newGame(2, 'Vieja', 'fighter', 'human');
    enterZone(old, 'z1');
    old.place = 'dungeon';
    old.visited = ['z1', 'z2'];
    expect(tips(guide(old, [{ kind: 'rest', id: 'z1_rest1', long: true, name: 'x', text: '' }]))).toBe(0);
  });
});
