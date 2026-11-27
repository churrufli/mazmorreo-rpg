// Modo desafío (2026-11-27): sin las ayudas de la zona 1 y con los combates a plena fuerza.
import { afterDefeat, newGame } from './game';
import { enterZone } from './dungeon';
import { startCombat } from './combat';

describe('modo desafío', () => {
  it('sin poción inicial ni de regalo tras perder', () => {
    const g = newGame(1, 'Prueba', 'fighter', 'human', undefined, undefined, true);
    expect(g.hard).toBe(true);
    expect(g.party[0].items.some(i => i.id === 'potion_healing')).toBe(false);
    afterDefeat(g);
    expect(g.party[0].items.some(i => i.id === 'potion_healing')).toBe(false);
    expect(newGame(1, 'Prueba', 'fighter', 'human').party[0].items.some(i => i.id === 'potion_healing')).toBe(true);
  });

  it('los goblins de la zona 1 no se vuelven esbirros', () => {
    const easy = newGame(1, 'Prueba', 'fighter', 'human');
    enterZone(easy, 'z1');
    startCombat(easy, 'z1_e01');
    expect(easy.weak ?? []).toContain('z1_e01');
    const hard = newGame(1, 'Prueba', 'fighter', 'human', undefined, undefined, true);
    enterZone(hard, 'z1');
    startCombat(hard, 'z1_e01');
    expect(hard.weak ?? []).not.toContain('z1_e01');
  });
});
