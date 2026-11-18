// Dracónido, tiefling, brujo y bárbaro elegible (SRD 5.2.1).
import { ACTION_HELP } from '../data/actionHelp';
import { DRACONIC, HERO_CLASSES, ITEMS } from '../data/srd';
import { heroImg } from '../data/caras';
import { IMG } from '../assets';
import { newGame } from './game';
import { armorClass, createHero, gainXp, longRest, maxRacial, newItem, raiseTo, shortRest, slotsAt } from './rules';
import { Combat, actionsFor, current, endTurn, perform, startCombat, Unit } from './combat';
import { enterZone } from './dungeon';
import type { Game } from './game';

function setup(cls: Parameters<typeof newGame>[2], sp: Parameters<typeof newGame>[3], level = 1) {
  const g = newGame(1, 'Prueba', cls, sp);
  g.rng.seed = 11;
  if (level > 1) raiseTo(g.party[0], level);
  enterZone(g, 'z1');
  const cb = startCombat(g, 'z1_e01');
  while (current(cb).side !== 'party') endTurn(g, cb);
  return { g, cb, c: g.party[0], u: current(cb) };
}
const act = (g: Game, cb: Combat, id: string) => actionsFor(g, cb).find(a => a.id === id);
const foes = (cb: Combat) => cb.units.filter(x => x.side === 'enemy' && x.hp > 0 && !x.dead);

test('el bárbaro y el brujo se pueden elegir como héroe y todas las combinaciones tienen retrato', () => {
  expect(HERO_CLASSES).toEqual(expect.arrayContaining(['barbarian', 'warlock']));
  for (const cls of HERO_CLASSES) for (const sp of ['human', 'elf', 'dwarf', 'halfling', 'dragonborn', 'tiefling'] as const)
    for (const sex of ['man', 'woman'] as const) expect(IMG[heroImg(cls, sp, sex)]).toBeTruthy();
  expect(createHero('X', 'warlock', 'halfling').img).toBe('hero_warlock_halfling');
});

test('magia del pacto: espacios del mismo nivel que vuelven con un descanso corto', () => {
  expect([1, 2, 3, 4, 5, 6].map(l => slotsAt('warlock', l))).toEqual([[1, 0, 0], [2, 0, 0], [0, 2, 0], [0, 2, 0], [0, 0, 2], [0, 0, 2]]);
  const c = createHero('B', 'warlock', 'human');
  raiseTo(c, 2);
  c.slots = [1, 0, 0];
  // Al subir a nivel 3 el espacio gastado sigue gastado y el que queda pasa a nivel 2.
  const msgs = raiseTo(c, 3);
  expect(c.slots).toEqual([0, 1, 0]);
  expect(msgs.join(' ')).toContain('Magia del pacto: 2 espacios de nivel 2');
  c.hp = c.maxHp;
  shortRest(c, { seed: 1 });
  expect(c.slots).toEqual([0, 2, 0]);
});

test('Armadura de sombras: el brujo tiene CA 13 + Destreza', () => {
  const c = createHero('B', 'warlock', 'human');
  expect(armorClass(c)).toBe(13 + 2);
});

test('Descarga sobrenatural suma el Carisma desde nivel 2 y lanza dos rayos a nivel 5', () => {
  const { g, cb, u } = setup('warlock', 'human', 5);
  const a = act(g, cb, 'eldritch')!;
  expect(a.detail).toBe('2×1d10+3 fuerza');
  const t = foes(cb)[0];
  t.hp = t.maxHp = 999;
  perform(g, cb, a, t.key);
  expect(cb.log.filter(l => l.t.includes('Descarga sobrenatural')).length).toBe(2);
  expect(u.hp).toBeGreaterThan(0);
});

test('Maleficio gasta un espacio, se concentra y añade 1d6 necrótico a cada impacto', () => {
  const { g, cb, c, u } = setup('warlock', 'tiefling', 1);
  const t = foes(cb)[0];
  perform(g, cb, act(g, cb, 'hex')!, t.key);
  expect(c.slots).toEqual([0, 0, 0]);
  expect(u.concentration).toBe('hex');
  t.hp = 999; t.maxHp = 999; t.ac = 1;
  perform(g, cb, act(g, cb, 'eldritch')!, t.key);
  expect(cb.log.some(l => l.t.startsWith('Maleficio: +'))).toBe(true);
  // Si cae el objetivo, se traslada sin gastar otro espacio.
  t.hp = 0; t.dead = true;
  cb.bonus = false;
  endTurn(g, cb);
  while (current(cb) !== u && !cb.result) endTurn(g, cb);
  if (!cb.result) expect(act(g, cb, 'hex_move')).toBeTruthy();
});

test('Astucia mágica: tras un combate recupera la mitad de los espacios, una vez por descanso largo', () => {
  const g = newGame(1, 'Prueba', 'warlock', 'human');
  const c = g.party[0];
  raiseTo(c, 2);
  c.slots = [0, 0, 0];
  enterZone(g, 'z1');
  const cb = startCombat(g, 'z1_e01');
  for (const e of foes(cb)) { e.hp = 0; e.dead = true; }
  endTurn(g, cb);
  expect(cb.result).toBe('win');
  expect(c.slots).toEqual([1, 0, 0]);
  expect(c.cunning).toBe(true);
  longRest(c);
  expect(c.cunning).toBe(false);
});

test('Bendición del oscuro: PG temporales al tumbar a un enemigo', () => {
  const { g, cb, u } = setup('warlock', 'human', 3);
  const t = foes(cb)[0];
  t.hp = 1; t.ac = 1;
  perform(g, cb, act(g, cb, 'eldritch')!, t.key);
  if (t.dead) expect(u.temp).toBe(Math.max(1, 3 + 3));
});

test('dracónido: aliento según el linaje del retrato, usos por competencia y resistencia', () => {
  const { g, cb, c } = setup('fighter', 'dragonborn', 1);
  expect(DRACONIC.fighter.type).toBe('fuego');
  expect(c.racial).toBe(2);
  const a = act(g, cb, 'breath')!;
  expect(a.detail).toContain('fuego');
  const row = foes(cb)[0].row;
  perform(g, cb, a, foes(cb)[0].key);
  expect(c.racial).toBe(1);
  expect(cb.log.some(l => l.t.includes('aliento de dragón rojo') && l.t.includes(row === 'front' ? 'delantera' : 'trasera'))).toBe(true);
  // Nivel 5: 3 usos.
  expect(maxRacial({ species: 'dragonborn', level: 5 })).toBe(3);
});

test('tiefling: Descarga de fuego con Carisma, resistencia al fuego y Reprensión infernal desde nivel 3', () => {
  const g = newGame(1, 'Prueba', 'fighter', 'tiefling');
  const c = g.party[0];
  expect(c.racial).toBe(0);
  const msgs = gainXp(g.party, 900);
  expect(c.level).toBe(3);
  expect(c.racial).toBe(1);
  expect(msgs.join(' ')).toContain('Reprensión infernal');
  enterZone(g, 'z1');
  const cb = startCombat(g, 'z1_e01');
  while (current(cb).side !== 'party') endTurn(g, cb);
  expect(act(g, cb, 'infernal_bolt')).toBeTruthy();
  // Un enemigo le golpea: responde con Reprensión infernal una sola vez.
  const me = cb.units.find(x => x.side === 'party')!;
  const foe = foes(cb)[0] as Unit;
  for (let i = 0; i < 40 && c.racial && !cb.result; i++) { endTurn(g, cb); while (!cb.result && current(cb).side === 'enemy') { const { enemyTurn } = require('./combat'); enemyTurn(g, cb); } }
  expect(me.hp).toBeLessThan(me.maxHp);
  expect(cb.log.some(l => l.t.includes('Reprensión infernal'))).toBe(true);
  expect(c.racial).toBe(0);
  expect(foe).toBeTruthy();
});

test('cada acción nueva tiene ayuda', () => {
  for (const [cls, sp] of [['warlock', 'dragonborn'], ['barbarian', 'tiefling']] as const) {
    const g = newGame(7, 'Prueba', cls, sp);
    const c = g.party[0];
    raiseTo(c, 5);
    c.items = Object.keys(ITEMS).map(newItem);
    enterZone(g, 'z1');
    const cb = startCombat(g, 'z1_e01');
    while (current(cb).side !== 'party') endTurn(g, cb);
    for (const a of actionsFor(g, cb)) {
      const [key, arg] = a.id.split(':');
      const item = c.items.find(i => i.uid === arg);
      expect(ACTION_HELP[key] || (item && ITEMS[item.id].desc)).toBeTruthy();
    }
  }
});
