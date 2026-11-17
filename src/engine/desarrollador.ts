import { CLASSES, DESIGN_ITEM, ITEMS } from '../data/srd';
import { ADVS, ADV_LIST, AdvId } from './aventuras';
import { giveItem, isTrophy } from './dungeon';
import type { Game } from './game';
import { Char, allyFor, createAlly, mainAbil, makeChar, raiseTo } from './rules';

/** Equipo permanente (armas, varitas, objetos maravillosos...) que se encuentra en los cofres de una aventura. */
const GEAR = ['weapon', 'wand', 'wondrous', 'armor', 'shield'];
const gearOf = (a: AdvId) =>
  ADVS[a].data.zones.flatMap(z => z.rooms.flatMap(r => r.contents as any[]))
    .filter(c => c.type === 'chest' && c.item)
    .map(c => DESIGN_ITEM[c.item.id] ?? c.item.id)
    .filter(id => ITEMS[id] && GEAR.includes(ITEMS[id].kind) && !isTrophy(id));

/** Aliados que se unen en una aventura (con el suplente si comparte clase con el héroe). */
const alliesOf = (g: Game, a: AdvId, hero: Char) => [...new Set(
  ADVS[a].data.zones.flatMap(z => z.rooms.flatMap(r => r.contents as any[]))
    .filter(c => c.type === 'ally')
    .map(c => allyFor(hero.cls, c.default_ally, a)),
)];

/** Nivel con el que se entra en una aventura: el tope de la anterior (1 en Hondaroca). */
export const entryLevel = (a: AdvId) => { const p = ADVS[a].prev; return p ? ADVS[p].level : 1; };

/** El héroe desde cero: sin las mejoras de característica del nivel 4 (y 6 del guerrero), con su equipo de clase. */
function freshHero(h: Char): Char {
  const abil = { ...h.abil };
  const asi = [4, 6].filter(l => h.level >= l && (l === 4 || h.cls === 'fighter')).length - (h.feats?.length ?? 0) - (h.featPending ? 1 : 0);
  if (asi > 0) abil[mainAbil(h)] -= 2 * asi;
  return makeChar({ id: h.id, name: h.name, cls: h.cls, species: h.species, img: h.img, isHero: true, level: 1, xp: 0, items: CLASSES[h.cls].items, abil });
}

/**
 * Modo desarrollador, al viajar al pueblo de una aventura: el grupo queda como llegaría jugando.
 * Nivel de entrada, aventuras anteriores ganadas, sus compañeros, su equipo permanente y sus trofeos.
 * Si se viaja a una aventura anterior, sobra lo de las siguientes y se quita.
 */
export function devSetup(g: Game, a: AdvId): string[] {
  const before = ADV_LIST.slice(0, ADV_LIST.findIndex(x => x.id === a)).map(x => x.id);
  const lv = entryLevel(a);
  const hero = freshHero([...g.party, ...(g.bench ?? [])].find(c => c.isHero)!);
  const allies = before.flatMap(b => alliesOf(g, b, hero).map(id => createAlly(id, 1, 0, b)));
  g.party = [hero, ...allies];
  g.bench = [];
  g.chosen = undefined;
  g.escort = undefined;
  for (const c of g.party) raiseTo(c, lv);
  g.wins = before;
  g.won = before.includes('hondaroca');
  g.trophies = before.map(b => ADVS[b].reward.item).filter(Boolean) as string[];
  for (const id of before.flatMap(gearOf)) giveItem(g, id);
  return [`Modo desarrollador: el grupo empieza ${ADVS[a].name} con nivel ${lv}${allies.length ? ` y ${allies.length} compañeros` : ''}.`];
}
