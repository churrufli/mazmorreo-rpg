import { CLASSES, DESIGN_ITEM, ITEMS } from '../data/srd';
import { ADVS, ADV_LIST, AdvId, firstZone } from './aventuras';
import { giveItem, isTrophy } from './dungeon';
import type { Game } from './game';
import { Char, MAX_ITEMS, allyFor, createAlly, mainAbil, makeChar, newItem, raiseTo } from './rules';

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

/**
 * Cada arma mágica va a quien ya lleva un arma igual (el arco largo +1 al que usa arco largo) y cada varita
 * a un lanzador de conjuros arcanos; si nadie encaja, al primero con sitio en la mochila.
 */
function giveGear(g: Game, id: string) {
  const it = ITEMS[id];
  const w = it.weapon;
  const base = it.name.replace(/ \+\d$/, '');
  const free = g.party.filter(c => !c.dead && c.items.length < MAX_ITEMS);
  const same = (c: Char) => c.items.some(i => ITEMS[i.id].name === base);
  const like = (c: Char) => c.items.some(i => { const x = ITEMS[i.id].weapon; return !!x && !!w && !x.bonus && x.dice === w.dice && x.type === w.type && !!x.ranged === !!w.ranged; });
  const caster = (c: Char) => it.kind === 'wand' && ['wizard', 'sorcerer', 'warlock'].includes(c.cls);
  const who = w ? free.find(same) ?? free.find(like) : free.find(caster);
  if (who) who.items.push(newItem(id));
  else giveItem(g, id);
}

/**
 * Deja una aventura (y las siguientes) como si nunca se hubiera jugado: salas, enemigos, cofres, escenas,
 * secretos, objetos tirados, elementos del mapa, diario y punto de vuelta.
 */
export function resetAdventures(g: Game, from: AdvId) {
  const advs = ADV_LIST.slice(ADV_LIST.findIndex(x => x.id === from)).map(x => x.id);
  const zones = advs.flatMap(a => ADVS[a].data.zones.map(z => z.id));
  const own = (id: string) => zones.some(z => id === z || id.startsWith(`${z}_`) || id.startsWith(`${z}:`) || id.endsWith(`:${z}`));
  const keep = (list?: string[]) => list?.filter(x => !own(x));
  const keepKeys = <T,>(rec?: Record<string, T>) => (rec ? Object.fromEntries(Object.entries(rec).filter(([k]) => !own(k))) : rec);
  g.done = keep(g.done)!;
  g.found = keep(g.found)!;
  g.fled = keep(g.fled)!;
  g.spotted = keep(g.spotted);
  g.flags = keep(g.flags);
  g.weak = keep(g.weak);
  g.elemNews = keep(g.elemNews);
  g.enemyHp = keepKeys(g.enemyHp)!;
  g.fallen = keepKeys(g.fallen);
  g.goals = keepKeys(g.goals);
  g.saved = keepKeys(g.saved);
  g.lit = keepKeys(g.lit);
  g.lurked = keep(g.lurked);
  g.drops = keepKeys(g.drops);
  g.chestLeft = keepKeys(g.chestLeft);
  g.stats = keepKeys(g.stats);
  g.scenes = keepKeys(g.scenes);
  g.encMod = keepKeys(g.encMod);
  g.encSize = keepKeys(g.encSize);
  g.wonAt = keepKeys(g.wonAt);
  g.elems = keepKeys(g.elems);
  g.diary = g.diary?.filter(d => !advs.includes(d.a));
  g.darkTip = g.darkTip?.filter(a => !advs.includes(a));
  g.inspUsed = g.inspUsed && Object.fromEntries(Object.entries(g.inspUsed).filter(([, a]) => !advs.includes(a)));
  for (const a of advs) delete g.backs?.[a];
  if (g.back && own(g.back.zone)) delete g.back;
  g.captive = undefined;
  // Si la partida estaba dentro de una de ellas, se vuelve a su primera casilla sin pisar.
  if (own(g.zone)) { g.zone = firstZone(from); g.visited = []; }
}

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
 * Modo desarrollador, al viajar al pueblo de una aventura (cada parte se puede apagar en Ajustes).
 * `nivel`: el grupo queda como llegaría jugando: nivel de entrada, aventuras anteriores ganadas, sus compañeros,
 * su equipo permanente y sus trofeos.
 * `cero`: la aventura de destino (y las siguientes) empieza de cero; si se viaja a una aventura anterior,
 * sobra lo de las siguientes y se quita.
 */
export function devSetup(g: Game, a: AdvId, nivel = true, cero = true): string[] {
  if (cero) resetAdventures(g, a);
  if (!nivel) return [`Modo desarrollador: ${ADVS[a].name} empieza de cero.`];
  const before = ADV_LIST.slice(0, ADV_LIST.findIndex(x => x.id === a)).map(x => x.id);
  const lv = entryLevel(a);
  const hero = freshHero([...g.party, ...(g.bench ?? [])].find(c => c.isHero)!);
  const allies = before.flatMap(b => alliesOf(g, b, hero).map(id => createAlly(id, 1, 0, b)));
  g.party = [hero, ...allies];
  g.bench = [];
  g.chosen = undefined;
  g.escort = undefined;
  for (const c of g.party) raiseTo(c, lv);
  // Sin empezar de cero, se conservan las aventuras ya ganadas y sus trofeos.
  const trophies = before.map(b => ADVS[b].reward.item).filter(Boolean) as string[];
  g.wins = cero ? before : [...new Set([...(g.wins ?? []), ...before])];
  g.won = g.wins.includes('hondaroca');
  g.trophies = cero ? trophies : [...new Set([...(g.trophies ?? []), ...trophies])];
  for (const id of before.flatMap(gearOf)) giveGear(g, id);
  return [`Modo desarrollador: el grupo empieza ${ADVS[a].name} con nivel ${lv}${allies.length ? ` y ${allies.length} compañeros` : ''}.`];
}
