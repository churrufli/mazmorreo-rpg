// Hondaroca con el héroe solo: más recuperación en la primera zona (el autor 2026-11-16).
import { afterDefeat, newGame } from './game';
import { contentById, encounterById, rolledEnemies } from './dungeon';
import { firstFoe } from './escenas';
import { MONSTERS } from '../data/srd';

test('el héroe empieza la partida con una poción de curación', () => {
  const g = newGame(1, 'Prueba', 'wizard', 'human');
  expect(g.party[0].items.filter(i => i.id === 'potion_healing')).toHaveLength(1);
});

test('el campamento de los mineros de la primera zona es un descanso largo', () => {
  expect((contentById('z1_rest1')!.c as any).rest).toBe('long');
  expect((contentById('z1_rest2')!.c as any).rest).toBe('short');
});

test('tras una derrota el grupo vuelve con todos los PG y el héroe con una poción más', () => {
  const g = newGame(1, 'Prueba', 'wizard', 'human');
  g.gold = 100;
  g.party[0].hp = 2;
  afterDefeat(g);
  expect(g.gold).toBe(90);
  expect(g.party[0].hp).toBe(g.party[0].maxHp);
  expect(g.party[0].items.filter(i => i.id === 'potion_healing')).toHaveLength(2);
});

test('la primera zona usa criaturas de valor de desafío 0 del SRD con sus fichas', () => {
  expect(MONSTERS.Rat).toMatchObject({ ac: 10, hp: 1, xp: 10 });
  expect(MONSTERS['Giant Fire Beetle']).toMatchObject({ ac: 13, hp: 4, xp: 10, resist: ['fuego'] });
  expect(MONSTERS.Shrieker.attacks).toHaveLength(0);
  const used = ['z1_e01', 'z1_e03', 'z1_e07', 'z1_e08', 'z1_e09'].flatMap(id => encounterById(id)!.enemies.map((e: any) => e.srd_creature));
  expect(used).toEqual(expect.arrayContaining(['Rat', 'Spider', 'Giant Fire Beetle', 'Bat', 'Scorpion']));
});

// El icono del mapa enseñaba la rata aunque, con el héroe solo, el combate solo tuviera al hongo chillón.
test('el icono del mapa es el primer enemigo del combate ya ajustado, sin fijar el ajuste', () => {
  for (let v = 0; v < 40; v++) {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    g.variant = v;
    if (!rolledEnemies(g, 'z1_e09').some((e: any) => e.srd_creature === 'Shrieker')) continue;
    expect(firstFoe(g, 'z1_e09', false).srd_creature).toBe('Shrieker');
    expect(g.encSize?.z1_e09).toBeUndefined();
    return;
  }
  throw new Error('Ninguna variante saca el hongo chillón');
});
