// Habilidades del SRD en las escenas (2026-11-27): competencia, pericia del pícaro, Ayudar, Mente táctica y vías de clase o especie.
import { newGame, Game } from './game';
import { enterZone } from './dungeon';
import { createAlly, skillBonus, skillProf, abilMod } from './rules';
import { prof } from '../data/srd';
import { chooseOption, helperFor, optionShown, sceneById, testChance, traitWho } from './escenas';

function game(cls: Parameters<typeof newGame>[2], species: Parameters<typeof newGame>[3], zone = 'z3'): Game {
  const g = newGame(1, 'Prueba', cls, species);
  g.rng.seed = 7;
  enterZone(g, zone);
  return g;
}

describe('habilidades', () => {
  it('la competencia suma y la pericia del pícaro cuenta doble', () => {
    const r = game('rogue', 'human').party[0];
    expect(skillProf(r, 'stealth')).toBe(2);
    expect(skillBonus(r, 'stealth')).toBe(abilMod(r, 'dex') + 2 * prof(r.level));
    expect(skillProf(r, 'arcana')).toBe(0);
    const w = game('wizard', 'human').party[0];
    expect(skillBonus(w, 'arcana')).toBe(abilMod(w, 'int') + prof(w.level));
  });

  it('con alguien competente al lado se tira con ventaja', () => {
    const g = game('fighter', 'human');
    g.party.push(createAlly('tiko', 3, 900));
    const hero = g.party[0];
    const tiko = g.party[1];
    // El guerrero es competente en Atletismo: puede ayudar a Tiko, que no lo es.
    expect(helperFor(g, tiko, 'athletics')?.id).toBe(hero.id);
    expect(testChance(tiko, 'str', 15, 'athletics', true)).toBeGreaterThan(testChance(tiko, 'str', 15, 'athletics'));
  });

  it('todas las pruebas con habilidad usan la característica de esa habilidad', () => {
    const { SKILLS } = require('../data/srd');
    for (const f of ['hondaroca', 'corazon', 'montana', 'tumba']) {
      const walk = (o: any): void => {
        if (Array.isArray(o)) o.forEach(walk);
        else if (o && typeof o === 'object') {
          if (o.label && o.skill) expect([o.label, SKILLS[o.skill].abil]).toEqual([o.label, o.attr]);
          Object.values(o).forEach(walk);
        }
      };
      walk(require(`../data/${f}.json`));
    }
  });

  it('las vías de clase y de especie solo salen si alguien así va en el grupo, y salen bien sin tirada', () => {
    const s = sceneById('z3_p02')!;
    const i = s.options.findIndex(o => o.species?.includes('dwarf'));
    expect(i).toBeGreaterThanOrEqual(0);
    expect(optionShown(game('fighter', 'human'), s, i)).toBe(false);
    const g = game('fighter', 'dwarf');
    expect(optionShown(g, s, i)).toBe(true);
    expect(traitWho(g, s.options[i])?.id).toBe(g.party[0].id);
    const gold = g.gold;
    chooseOption(g, 'z3_p02', i);
    expect(g.gold).toBeGreaterThan(gold);
  });

  it('Mente táctica: el guerrero de nivel 2 gasta Tomar aliento solo si así supera la prueba', () => {
    let spent = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const g = game('fighter', 'human');
      const c = g.party[0];
      c.level = 2;
      c.secondWind = 2;
      g.rng.seed = seed;
      const s = sceneById('z3_p02')!;
      const i = s.options.findIndex(o => o.skill === 'athletics');
      chooseOption(g, 'z3_p02', i);
      if (c.secondWind < 2) {
        spent++;
        expect(g.scenes?.z3_p02?.closed ?? []).not.toContain(i);
      }
    }
    expect(spent).toBeGreaterThan(0);
  });
});
