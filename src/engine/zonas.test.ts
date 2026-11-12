import { newGame } from './game';
import { backToPrevious, enterZone, hkey, plan, step } from './dungeon';

describe('volver a zonas anteriores', () => {
  it('la zona anterior se encuentra tal como se dejó', () => {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    enterZone(g, 'z1');
    const exit = plan('z1').marks.find(m => m.kind === 'exit')!;
    const visitedAntes = [...g.visited, `${exit.q},${exit.r}`];
    g.visited = visitedAntes;
    g.pos = [exit.q, exit.r];
    enterZone(g, 'z2');
    expect(g.zone).toBe('z2');
    backToPrevious(g);
    expect(g.zone).toBe('z1');
    expect(hkey(g.pos)).toBe(`${exit.q},${exit.r}`);
    expect(g.visited).toEqual(visitedAntes);
  });

  it('al entrar otra vez en una zona visitada no repite la entrada', () => {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    enterZone(g, 'z1');
    const exit = plan('z1').marks.find(m => m.kind === 'exit')!;
    g.pos = [exit.q, exit.r];
    enterZone(g, 'z2');
    const evs = enterZone(g, 'z1');
    expect(evs).toEqual([]);
    expect(hkey(g.pos)).toBe(`${exit.q},${exit.r}`);
  });

  it('en la primera zona no hay a dónde volver', () => {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    enterZone(g, 'z1');
    expect(backToPrevious(g)).toEqual([]);
    expect(g.zone).toBe('z1');
  });

  it('sigue funcionando el paso normal', () => {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    enterZone(g, 'z1');
    const to = plan('z1').start;
    expect(Array.isArray(step(g, to))).toBe(true);
  });
});
