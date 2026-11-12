import { newGame } from '../engine/game';
import { startCombat, current, endTurn, actionsFor } from '../engine/combat';
import { enterZone } from '../engine/dungeon';
import { newItem } from '../engine/rules';
import { groupOf, menuActionsFor } from './combatMenu';

const setup = () => {
  const g = newGame(7, 'Prueba', 'fighter', 'human');
  g.party[0].items = [newItem('mace'), newItem('potion_healing')];
  enterZone(g, 'z1');
  const cb = startCombat(g, 'z1_e01');
  while (current(cb).side !== 'party') endTurn(g, cb);
  return {g, cb};
};

test('la presentación no altera el combate ni habilita acciones gastadas', () => {
  const {g, cb} = setup();
  cb.acted = true; cb.bonus = true; cb.moved = true;
  const snapshot = JSON.stringify({g, cb});
  const menu = menuActionsFor(g, cb);
  expect(menu.find(a => a.id === 'flee')?.off).toMatch(/acción de este turno/);
  expect(menu.find(a => a.id === 'atk:mace')?.off).toMatch(/acción de este turno/);
  expect(menu.find(a => a.id.startsWith('potion:'))?.off).toMatch(/acción adicional/);
  expect(menu.find(a => a.id === 'row')?.off).toMatch(/cambiado de fila/);
  const actual = actionsFor(g, cb);
  expect(menu.filter(a => !a.off).every(a => actual.some(x => x.id === a.id && !x.off))).toBe(true);
  expect(JSON.stringify({g, cb})).toBe(snapshot);
});

test('conserva el motivo de una acción inútil y deja el movimiento fuera de las categorías', () => {
  const {g, cb} = setup();
  expect(menuActionsFor(g, cb).find(a => a.id.startsWith('potion:'))?.off).toMatch(/PG al máximo/);
  expect(groupOf(menuActionsFor(g, cb).find(a => a.id === 'row')!)).toBe('other');
  expect(groupOf(menuActionsFor(g, cb).find(a => a.id === 'atk:mace')!)).toBe('attack');
});

test('Oleada de acción sigue disponible y no se pierde al calcular opciones gastadas', () => {
  const {g, cb} = setup();
  g.party[0].level = 2; g.party[0].actionSurge = 1; cb.acted = true;
  const surge = menuActionsFor(g, cb).find(a => a.id === 'surge');
  expect(surge?.cost).toBe('free');
  expect(surge?.off).toBeUndefined();
});

test('las clases de héroes y aliados conservan exactamente las acciones legales con recursos, filas y costes distintos', () => {
  const { HERO_CLASSES, ITEMS } = require('../data/srd');
  for (const cls of [...new Set([...HERO_CLASSES,'barbarian'])]) for (const resources of [false,true]) for (const row of ['front','back'] as const) {
    const g = newGame(7,'Prueba',cls,'human');
    const c = g.party[0]; c.row=row; c.level=5;
    c.slots=resources ? [4,3,2] : [0,0,0]; c.channel=resources ? 10 : 0;
    c.secondWind=resources ? 2 : 0; c.actionSurge=resources ? 1 : 0;
    c.items=['mace','shortbow',...(resources ? ['potion_healing','net','wand_magic_missiles_1','spell_scroll_shield'] : [])].filter(id=>ITEMS[id]).map(newItem);
    enterZone(g,'z1'); const cb=startCombat(g,'z1_e01');
    while(current(cb).side!=='party') endTurn(g,cb);
    for(let flags=0;flags<8;flags++) {
      cb.acted=!!(flags&1); cb.bonus=!!(flags&2); cb.moved=!!(flags&4);
      const expected=actionsFor(g,cb).filter(a=>!a.off).map(a=>a.id).sort();
      const actual=menuActionsFor(g,cb).filter(a=>!a.off).map(a=>a.id).sort();
      expect(actual).toEqual(expected);
      expect(menuActionsFor(g,cb).some(a=>a.id==='flee')).toBe(true);
    }
  }
});


test('no ofrece acciones para un personaje inconsciente ni tras terminar el combate', () => {
  const {g,cb}=setup(); current(cb).hp=0;
  expect(menuActionsFor(g,cb)).toEqual([]);
  current(cb).hp=1; cb.result='win';
  expect(menuActionsFor(g,cb)).toEqual([]);
});

test('tres categorías: los trucos de daño van con los ataques y esquivar, fila y huir quedan fuera', () => {
  const { g, cb } = setup();
  const menu = menuActionsFor(g, cb);
  expect(groupOf(menu.find(a => a.id === 'dodge')!)).toBe('other');
  expect(groupOf(menu.find(a => a.id === 'flee')!)).toBe('other');
  expect(groupOf({ id: 'fire_bolt', label: '', cost: 'action', target: 'enemy' })).toBe('attack');
  expect(groupOf({ id: 'bless', label: '', cost: 'action', target: 'none' })).toBe('skills');
});

test('tocar un enemigo usa un arma que le alcanza y nunca una acción gastada', () => {
  const { g, cb } = setup();
  const foe = cb.units.find(u => u.side === 'enemy')!;
  const { quickAttack } = require('./combatMenu');
  expect(quickAttack(g, cb, foe.key)?.id).toBe('atk:mace');
  cb.acted = true;
  expect(quickAttack(g, cb, foe.key)).toBeUndefined();
});


test('los turnos automáticos no ofrecen decisiones ni ataques rápidos', () => {
  const {g,cb}=setup(); const {quickAttack}=require('./combatMenu');
  const foe=cb.units.find(u=>u.side==='enemy')!;
  current(cb).paralyzed=true;
  expect(menuActionsFor(g,cb)).toEqual([]);expect(quickAttack(g,cb,foe.key)).toBeUndefined();
  current(cb).paralyzed=false;
  while(current(cb).side!=='enemy')endTurn(g,cb);
  expect(menuActionsFor(g,cb)).toEqual([]);expect(quickAttack(g,cb,foe.key)).toBeUndefined();
});
