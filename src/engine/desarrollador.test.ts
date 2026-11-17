import { newGame } from './game';
import { devSetup } from './desarrollador';
import { wonAdv } from './aventuras';

// Modo desarrollador: al viajar, nivel, compañeros, equipo y trofeos se ajustan a la aventura, también hacia atrás.
test('viajar a la tumba y volver a Hondaroca', () => {
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  devSetup(g, 'tumba');
  expect(g.party.every(c => c.level === 4)).toBe(true);
  expect(g.party.length).toBeGreaterThan(9);
  expect(new Set(g.party.map(c => c.id)).size).toBe(g.party.length);
  expect(g.party.some(c => c.items.some(i => i.id === 'cloak_protection'))).toBe(true);
  expect(g.trophies).toEqual(['heart_fragment', 'relic_dwarf']);
  expect(wonAdv(g, 'montana')).toBe(true);
  expect(wonAdv(g, 'tumba')).toBe(false);

  devSetup(g, 'corazon_hueco');
  expect(g.party.every(c => c.level === 2)).toBe(true);
  expect(g.party.every(c => c.isHero || c.adv === 'hondaroca')).toBe(true);
  expect(g.party.some(c => c.items.some(i => i.id === 'cloak_protection'))).toBe(false);
  expect(g.trophies).toEqual([]);
  expect(wonAdv(g, 'hondaroca')).toBe(true);

  devSetup(g, 'hondaroca');
  expect(g.party).toHaveLength(1);
  expect(g.party[0].level).toBe(1);
  expect(g.wins).toEqual([]);
  expect(g.won).toBe(false);
});

test('al bajar de nivel se deshace la mejora de característica del nivel 4', () => {
  const g = newGame(1, 'Prueba', 'wizard', 'human');
  const int = g.party[0].abil.int;
  devSetup(g, 'tumba');
  const h = g.party[0];
  expect(h.featPending).toBe(true);
  h.featPending = false;
  h.abil.int += 2;
  devSetup(g, 'hondaroca');
  expect(g.party[0].abil.int).toBe(int);
  expect(g.party[0].maxHp).toBe(newGame(1, 'Prueba', 'wizard', 'human').party[0].maxHp);
});
