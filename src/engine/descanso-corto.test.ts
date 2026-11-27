// Descanso corto con decisión (2026-11-27): se eligen los dados de golpe y el mago usa Recuperación arcana.
import { newGame } from './game';
import { diceToHeal, needsRest, shortRest, shortRestGain } from './rules';
import { shortRestAll } from './dungeon';

describe('descanso corto', () => {
  it('gasta solo los dados de golpe elegidos', () => {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    const c = g.party[0];
    c.level = 5; c.hitDice = 5; c.maxHp = 60; c.hp = 5;
    shortRest(c, g.rng, 2);
    expect(c.hitDice).toBe(3);
    shortRestAll(g, { [c.id]: 0 });
    expect(c.hitDice).toBe(3);
    const lines = shortRestAll(g, { [c.id]: 1 });
    expect(c.hitDice).toBe(2);
    expect(lines[0]).toContain('gasta 1 dado de golpe');
    expect(lines[0]).toContain('Tomar aliento');
  });

  it('propone los dados que hacen falta para curarse, sin pasar de los que quedan', () => {
    const c = newGame(1, 'Prueba', 'fighter', 'human').party[0];
    c.hp = c.maxHp;
    expect(diceToHeal(c)).toBe(0);
    c.hp = 1; c.hitDice = 1;
    expect(diceToHeal(c)).toBe(1);
  });

  it('Recuperación arcana: el mago recupera espacios una vez hasta el descanso largo', () => {
    const g = newGame(1, 'Prueba', 'wizard', 'human');
    const c = g.party[0];
    c.level = 4; c.slots = [0, 0, 0];
    expect(needsRest(g.party, false)).toBe(true);
    expect(shortRestGain(c)).toContain('Recuperación arcana');
    shortRest(c, g.rng);
    // Nivel 4: espacios que sumen 2 niveles (uno de nivel 2).
    expect(c.slots).toEqual([0, 1, 0]);
    expect(c.arcaneRec).toBe(true);
    c.slots = [0, 0, 0];
    shortRest(c, g.rng);
    expect(c.slots).toEqual([0, 0, 0]);
  });
});
