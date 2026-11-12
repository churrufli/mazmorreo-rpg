import { ACTION_HELP } from './actionHelp';
import { HERO_CLASSES, ITEMS } from './srd';
import { newGame } from '../engine/game';
import { newItem } from '../engine/rules';
import { actionsFor, current, endTurn, startCombat } from '../engine/combat';
import { enterZone } from '../engine/dungeon';

test('cada acción disponible de las seis clases tiene ayuda o ficha de objeto', () => {
  for (const cls of HERO_CLASSES) {
    const g = newGame(7, 'Prueba', cls, 'human');
    const c = g.party[0];
    c.level = 5; c.slots = [4, 3, 2]; c.channel = 10; c.actionSurge = 1;
    c.items = Object.keys(ITEMS).map(newItem);
    enterZone(g, 'z1');
    const cb = startCombat(g, 'z1_e01');
    while (current(cb).side !== 'party') endTurn(g, cb);
    for (const acted of [false, true]) {
      cb.acted = acted;
      for (const a of actionsFor(g, cb)) {
        const [key, arg] = a.id.split(':');
        const item = c.items.find(i => i.uid === arg);
        expect(ACTION_HELP[key] || (item && ITEMS[item.id].desc)).toBeTruthy();
      }
    }
  }
});
