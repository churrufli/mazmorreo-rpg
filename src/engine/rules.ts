import type { ImgKey } from '../assets';
import {
  ABIL_NAME, Ability, CLASSES, ClassId, HALF_SLOTS, ITEMS, ITEM_BY_NAME, MAX_LEVEL, SLOTS, Slots, SPECIES, SpeciesId, XP_LEVELS, prof,
} from '../data/srd';
import { roll, Rng } from './rng';
import { ADVS, AdvId } from './aventuras';

/** basic: equipo inicial de la clase (de partidas antiguas; ya no tiene efecto). */
export interface Item { uid: string; id: string; charges?: number; basic?: boolean }

export interface Char {
  id: string;
  name: string;
  cls: ClassId;
  species: SpeciesId;
  img: ImgKey;
  isHero: boolean;
  level: number;
  xp: number;
  abil: Record<Ability, number>;
  maxHp: number;
  hp: number;
  hitDice: number;
  /** Espacios de conjuro de nivel 1, 2 y 3 (las partidas antiguas guardan solo dos). */
  slots: Slots;
  secondWind: number;
  actionSurge: number;
  channel: number;
  dead: boolean;
  stable: boolean;
  deathS: number;
  deathF: number;
  items: Item[];
  row: 'front' | 'back';
  /** Aventura de la que es el aliado (se queda en su pueblo cuando el héroe va a otra). */
  adv?: AdvId;
  /** Dotes elegidas al llegar al nivel 4 (Alerta, Atacante salvaje). */
  feats?: string[];
  /** Ha llegado al nivel 4 y aún no ha elegido entre +2 a su característica o una dote. */
  featPending?: boolean;
  /** Inspiración heroica (tras la tercera charla en la posada): repite una tirada fallida por aventura. */
  inspired?: boolean;
}

export const MAX_ITEMS = 12;
export const mod = (score: number) => Math.floor((score - 10) / 2);
/** Puntuación efectiva: los guanteletes de fuerza de ogro dejan la Fuerza en 19. */
export const score = (c: Char, a: Ability) =>
  a === 'str' && c.items.some(i => i.id === 'gauntlets_ogre_power') ? Math.max(19, c.abil.str) : c.abil[a];
export const abilMod = (c: Char, a: Ability) => mod(score(c, a));
const half = (cls: ClassId) => cls === 'ranger' || cls === 'paladin';
/** Espacios de conjuro: guerrero y pícaro no lanzan conjuros (el autor, opiniones v0.58). */
export const slotsAt = (cls: ClassId, level: number): Slots => { if (cls === 'fighter' || cls === 'rogue' || cls === 'barbarian') return [0, 0, 0]; const t = (half(cls) ? HALF_SLOTS : SLOTS)[level]; return [t[0], t[1], t[2]]; };
/** Espacios que le quedan en total (de cualquier nivel). */
export const slotsLeft = (c: Char) => c.slots[0] + c.slots[1] + (c.slots[2] ?? 0);
/** Usos de Canalizar divinidad, Enemigo predilecto, Furia (bárbaro) o la reserva de Imposición de manos (paladín). */
export const maxChannel = (c: { cls: ClassId; level: number }) =>
  c.cls === 'paladin' ? 5 * c.level : c.cls === 'barbarian' ? (c.level >= 6 ? 4 : 3) : c.cls === 'cleric' && c.level >= 6 ? 3 : 2;
export const isDown = (c: Char) => c.dead || c.hp <= 0;

const CONSUMABLE = ['potion', 'throw', 'scroll'];
/** Objetos que no se venden ni se tiran: el equipo básico de clase y las llaves. */
/** Lo que no se vende ni se deja: las llaves (ya no hay equipo básico, el autor 2026-11-06). */
export const keeps = (it: Item) => !!ITEMS[it.id]?.key;
let uidN = 0;
export const newItem = (id: string): Item => ({
  uid: `${id}-${Date.now().toString(36)}-${(uidN++).toString(36)}`,
  id,
  charges: ITEMS[id]?.charges,
});

/** Existencias previas a la compra, incluidas las de compañeros que esperan en la posada. */
export function itemOwnership(party: Char[], id: string): string {
  const owners = party.map(c => ({ name: c.name, count: c.items.filter(it => it.id === id).length })).filter(c => c.count > 0);
  return owners.length ? `Ya lo tienen: ${owners.map(c => `${c.name} ×${c.count}`).join(', ')}.` : 'Ningún personaje tiene este objeto.';
}

const hpPerLevel = (cls: ClassId, species: SpeciesId, con: number) =>
  CLASSES[cls].hitDie / 2 + 1 + mod(con) + (species === 'dwarf' ? 1 : 0);

function hpAt(cls: ClassId, species: SpeciesId, con: number, level: number) {
  const first = CLASSES[cls].hitDie + mod(con) + (species === 'dwarf' ? 1 : 0);
  return first + (level - 1) * hpPerLevel(cls, species, con);
}

export const levelForXp = (xp: number) => XP_LEVELS.filter(t => xp >= t).length;

export function makeChar(o: {
  id: string; name: string; cls: ClassId; species: SpeciesId; img: ImgKey; isHero: boolean; level: number; xp: number; items: string[];
  abil?: Record<Ability, number>;
}): Char {
  const abil = { ...(o.abil ?? CLASSES[o.cls].abil) };
  const maxHp = hpAt(o.cls, o.species, abil.con, o.level);
  return {
    ...o,
    abil,
    maxHp,
    hp: maxHp,
    hitDice: o.level,
    slots: slotsAt(o.cls, o.level),
    secondWind: 2,
    actionSurge: 1,
    channel: maxChannel(o),
    dead: false,
    stable: false,
    deathS: 0,
    deathF: 0,
    items: o.items.map(id => ({ ...newItem(id), basic: !CONSUMABLE.includes(ITEMS[id]?.kind) || undefined })),
    row: o.cls === 'wizard' || o.cls === 'ranger' ? 'back' : 'front',
  };
}

const CLASS_EN: Record<ClassId, string> = { fighter: 'Fighter', cleric: 'Cleric', rogue: 'Rogue', wizard: 'Wizard', ranger: 'Ranger', paladin: 'Paladin', barbarian: 'Barbarian' };
const ALLY_CLASS: Record<string, ClassId> = { Fighter: 'fighter', Cleric: 'cleric', Rogue: 'rogue', Wizard: 'wizard', Ranger: 'ranger', Paladin: 'paladin', Barbarian: 'barbarian' };
// Vurka es orca: no hay especie orca en el juego y cuenta como humana (Percepción, sin rasgos de otras especies).
const ALLY_SPECIES: Record<string, SpeciesId> = { Enana: 'dwarf', Enano: 'dwarf', Mediano: 'halfling', Humano: 'human', Humana: 'human', Elfa: 'elf', Orca: 'human' };

export function createHero(name: string, cls: ClassId, species: SpeciesId, abil?: Record<Ability, number>, img?: ImgKey): Char {
  return makeChar({
    id: 'hero', name, cls, species, img: img ?? (`hero_${cls}_${species}` as ImgKey), isHero: true, level: 1, xp: 0,
    items: CLASSES[cls].items, abil,
  });
}

/** Qué aliado se une en una zona según la clase del héroe (el suplente sustituye al de su misma clase). */
export function allyFor(heroCls: ClassId, defaultAlly: string, adv: AdvId = 'hondaroca'): string {
  const a = ADVS[adv].data.allies.find(x => x.id === defaultAlly)!;
  return ALLY_CLASS[a.class] === heroCls ? ADVS[adv].sub : defaultAlly;
}

export function createAlly(allyId: string, level: number, xp: number, adv: AdvId = 'hondaroca'): Char {
  const a = ADVS[adv].data.allies.find(x => x.id === allyId)!;
  const c = makeChar({
    id: allyId, name: a.name, cls: ALLY_CLASS[a.class], species: ALLY_SPECIES[a.species] ?? 'human',
    img: ADVS[adv].allyImg[allyId], isHero: false, level, xp,
    items: a.starting_items.map(n => ITEM_BY_NAME[n]).filter(Boolean),
  });
  c.adv = adv;
  return c;
}
export { CLASS_EN };

export function armorClass(c: Char): number {
  const def = CLASSES[c.cls];
  const dex = abilMod(c, 'dex');
  let best = 10 + dex;
  for (const it of c.items) {
    const a = ITEMS[it.id]?.armor;
    if (a && def.armor.includes(a.type)) best = Math.max(best, a.base + Math.min(dex, a.dexMax ?? 99));
  }
  const wearsArmor = best !== 10 + dex;
  const shield = def.armor.includes('shield') && c.items.some(i => ITEMS[i.id]?.kind === 'shield') ? 2 : 0;
  const defense = (c.cls === 'fighter' || c.cls === 'paladin') && wearsArmor ? 1 : 0; // estilo de combate Defensa
  // Defensa sin armadura del bárbaro: 10 + Destreza + Constitución si es mejor que su armadura.
  if (c.cls === 'barbarian') best = Math.max(best, 10 + dex + abilMod(c, 'con'));
  return best + shield + defense + (c.items.some(i => i.id === 'cloak_protection') ? 1 : 0);
}

/**
 * ¿Lo lleva puesto o en la mano? La mejor armadura que sabe usar, el escudo si su clase lo usa
 * y cada arma distinta (todas salen en combate). Devuelve el motivo si no.
 */
export function equipState(c: Char, it: Item): { on: boolean; why?: string } | undefined {
  const d = ITEMS[it.id];
  if (!d) return undefined;
  const def = CLASSES[c.cls];
  if (d.armor) {
    if (!def.armor.includes(d.armor.type)) return { on: false, why: `${CLASSES[c.cls].name}: no sabe llevar esta armadura. Dásela a quien pueda.` };
    const dex = abilMod(c, 'dex');
    const ac = (x: Item) => { const a = ITEMS[x.id]?.armor; return a && def.armor.includes(a.type) ? a.base + Math.min(dex, a.dexMax ?? 99) : -1; };
    const best = c.items.reduce<Item | undefined>((b, x) => (ac(x) > (b ? ac(b) : -1) ? x : b), undefined);
    return best?.uid === it.uid ? { on: true } : { on: false, why: 'Lleva puesta otra armadura mejor.' };
  }
  if (d.kind === 'shield') {
    if (!def.armor.includes('shield')) return { on: false, why: `${CLASSES[c.cls].name}: no sabe usar escudo.` };
    return c.items.find(x => ITEMS[x.id]?.kind === 'shield')?.uid === it.uid ? { on: true } : { on: false, why: 'Ya lleva otro escudo.' };
  }
  if (d.weapon) {
    if (!weapons(c).some(x => x.uid === it.uid)) return { on: false, why: d.weapon.ranged ? 'Lleva otra arma a distancia mejor.' : 'Lleva otra arma cuerpo a cuerpo mejor.' };
    return proficientWith(c, it.id) ? { on: true } : { on: true, why: 'La usa sin competencia: no suma su bonificador de competencia.' };
  }
  return undefined;
}

export function proficientWith(c: Char, itemId: string): boolean {
  const w = ITEMS[itemId]?.weapon;
  if (!w) return false;
  const m = CLASSES[c.cls].martial;
  if (!w.martial || m === true) return true;
  return m === 'finesse' && !!w.finesse;
}

export function weaponStat(c: Char, itemId: string) {
  const w = ITEMS[itemId].weapon!;
  const abil: Ability = w.ranged ? 'dex' : w.finesse && abilMod(c, 'dex') > abilMod(c, 'str') ? 'dex' : 'str';
  const m = abilMod(c, abil);
  const archery = c.cls === 'ranger' && c.level >= 2 && w.ranged ? 2 : 0; // estilo de combate Tiro con arco
  return {
    toHit: m + (proficientWith(c, itemId) ? prof(c.level) : 0) + (w.bonus ?? 0) + archery,
    dmgBonus: m + (w.bonus ?? 0),
    abil,
  };
}

/** Daño medio de un arma en manos de c (para elegir cuál lleva equipada). */
const weaponScore = (c: Char, id: string) => {
  const [n, f] = ITEMS[id].weapon!.dice.split('d').map(Number);
  const s = weaponStat(c, id);
  return n * (f + 1) / 2 + s.dmgBonus + s.toHit * 0.5;
};

/** Armas equipadas: la mejor cuerpo a cuerpo y la mejor a distancia (el autor 2026-11-06: solo se equipa una de cada). */
export const weapons = (c: Char) => {
  const best = (ranged: boolean) => c.items.filter(i => ITEMS[i.id]?.weapon && !!ITEMS[i.id].weapon!.ranged === ranged)
    .reduce<Item | undefined>((b, x) => (!b || weaponScore(c, x.id) > weaponScore(c, b.id) ? x : b), undefined);
  return [best(false), best(true)].filter((x): x is Item => !!x);
};

export function saveBonus(c: Char, a: Ability): number {
  return abilMod(c, a) + (CLASSES[c.cls].saves.includes(a) ? prof(c.level) : 0) + (c.items.some(i => i.id === 'cloak_protection') ? 1 : 0);
}

export const spellDc = (c: Char) => 8 + prof(c.level) + abilMod(c, CLASSES[c.cls].spell ?? 'int');
export const spellAttack = (c: Char) => prof(c.level) + abilMod(c, CLASSES[c.cls].spell ?? 'int') + Math.max(0, ...c.items.map(i => ITEMS[i.id].spellBonus ?? 0));

export function passivePerception(c: Char): number {
  const p = CLASSES[c.cls].perception || c.species === 'elf' || c.species === 'human';
  return 10 + abilMod(c, 'wis') + (p ? prof(c.level) : 0);
}

/** La niebla se ve a 2 casillas si alguien lleva antorcha o sabe el truco Luz (clérigo o mago). */
export const sightRadius = (party: Char[]) =>
  party.some(c => !c.dead && (c.cls === 'cleric' || c.cls === 'wizard' || c.items.some(i => i.id === 'torch'))) ? 2 : 1;

/** Reparte PX entre los vivos y sube de nivel. Devuelve los mensajes. */
export function gainXp(party: Char[], total: number): string[] {
  const alive = party.filter(c => !c.dead);
  if (!alive.length || !total) return [];
  const each = Math.floor(total / alive.length);
  const msgs = [alive.length === 1 ? `${alive[0].name} gana ${each} PX.` : `Cada miembro del grupo gana ${each} PX.`];
  for (const c of alive) msgs.push(...addXp(c, each));
  return msgs;
}

/** Mejora de característica o dote: nivel 4 para todos y también nivel 6 para el guerrero (SRD). */
const featAt = (c: Char) => c.level === 4 || (c.level === 6 && c.cls === 'fighter');

/** Suma PX a un personaje y le sube los niveles que toquen. */
function addXp(c: Char, n: number): string[] {
  const msgs: string[] = [];
  c.xp += n;
  while (c.level < MAX_LEVEL && levelForXp(c.xp) > c.level) {
    c.level++;
    // El jugador elige entre +2 a la característica principal o una dote (ver chooseFeat).
    if (featAt(c)) c.featPending = true;
    const gain = hpPerLevel(c.cls, c.species, c.abil.con);
    c.maxHp += gain;
    if (c.hp > 0) c.hp += gain;
    c.hitDice++;
    const s = slotsAt(c.cls, c.level), p = slotsAt(c.cls, c.level - 1);
    c.slots = [c.slots[0] + s[0] - p[0], c.slots[1] + s[1] - p[1], (c.slots[2] ?? 0) + s[2] - p[2]];
    c.channel += maxChannel(c) - maxChannel({ cls: c.cls, level: c.level - 1 });
    msgs.push(`¡${c.name} sube a nivel ${c.level}! (+${gain} PG)${featAt(c) ? ' Puede elegir una mejora de característica o una dote.' : ''}`);
    msgs.push(...(LEVEL_FEATURES[c.level]?.[c.cls] ?? []));
    const extraSlots = s.map((slots, i) => slots - p[i] > 0 ? `+${slots - p[i]} de nivel ${i + 1}` : '').filter(Boolean);
    if (extraSlots.length) msgs.push(`Espacios de conjuro: ${extraSlots.join(', ')}.`);
    const extraChannel = maxChannel(c) - maxChannel({ cls: c.cls, level: c.level - 1 });
    if (extraChannel > 0 && c.cls === 'paladin') msgs.push(`Imposición de manos: +${extraChannel} PG en la reserva de curación.`);
    if (extraChannel > 0 && c.cls === 'cleric') msgs.push(`Chispa divina: +${extraChannel} uso.`);
    if (extraChannel > 0 && c.cls === 'barbarian') msgs.push(`Furia: +${extraChannel} uso.`);
    if (prof(c.level) > prof(c.level - 1)) msgs.push(`Competencia: +${prof(c.level - 1)} → +${prof(c.level)} en las tiradas que la usan.`);
  }
  return msgs;
}

/** Solo habilidades y mejoras que ya están implementadas en las reglas y el combate. */
export const LEVEL_FEATURES: Partial<Record<number, Partial<Record<ClassId, string[]>>>> = {
  2: {
    fighter: ['Nueva habilidad: Oleada de acción. Permite realizar otra acción en el turno.'],
    rogue: ['Nueva habilidad: Esconderse como acción adicional.'],
    cleric: ['Nueva habilidad: Chispa divina. Cura 1d8 + Sabiduría a un aliado.'],
    ranger: ['Nuevo estilo: Tiro con arco. +2 a las tiradas de ataque con armas a distancia.'],
  },
  3: {
    fighter: ['Nueva habilidad: Crítico mejorado. Los ataques con armas son críticos con 19 o 20.'],
    rogue: ['Mejora de habilidad: Ataque furtivo aumenta de 1d6 a 2d6.'],
    cleric: ['Nuevo conjuro: Arma espiritual. Ataque como acción adicional por 1d8 + Sabiduría.'],
    wizard: ['Nuevo conjuro: Rayo abrasador. Lanza tres rayos de 2d6.'],
  },
  5: {
    fighter: ['Nueva habilidad: Ataque adicional. Ataca dos veces con tu arma.'],
    ranger: ['Nueva habilidad: Ataque adicional. Ataca dos veces con tu arma.'],
    paladin: ['Nueva habilidad: Ataque adicional. Ataca dos veces con tu arma.'],
    barbarian: ['Nueva habilidad: Ataque adicional. Ataca dos veces con tu arma.'],
    rogue: ['Mejora de habilidad: Ataque furtivo aumenta de 2d6 a 3d6.'],
    wizard: ['Nuevo conjuro: Bola de fuego. Inflige 8d6 de daño a una fila.', 'Mejora de trucos: Descarga de fuego inflige 2d10 y Rayo de escarcha, 2d8.'],
    cleric: ['Nuevo conjuro: Curación en masa. Cura 2d4 + Sabiduría a todo el grupo.', 'Mejora de truco: Llama sagrada inflige 2d8.'],
  },
  6: {
    paladin: ['Nueva habilidad: Aura de protección. El grupo suma tu modificador de Carisma (mínimo +1) a las salvaciones mientras sigues en pie.'],
  },
};

/** Hito al terminar una aventura: todo el grupo sube como mínimo a ese nivel (el autor 2026-11-04, subida mixta). */
export function raiseTo(c: Char, level: number): string[] {
  if (c.dead || c.level >= level) return [];
  return addXp(c, XP_LEVELS[level - 1] - c.xp);
}

/** Característica principal de la clase (la que sube con la mejora del nivel 4). */
export const mainAbil = (c: Char): Ability =>
  (Object.keys(CLASSES[c.cls].abil) as Ability[]).sort((a, b) => CLASSES[c.cls].abil[b] - CLASSES[c.cls].abil[a])[0];

/** Mejoras del nivel 4 (y 6 del guerrero, SRD 5.2): mejora de característica o una dote sin requisitos. */
export const FEATS = {
  asi: { name: 'Mejora de característica', desc: (c: Char) => `+2 a ${ABIL_NAME[mainAbil(c)]} (${c.abil[mainAbil(c)]} → ${Math.min(20, c.abil[mainAbil(c)] + 2)}).` },
  alert: { name: 'Alerta', desc: () => 'Sumas tu bonificador de competencia (+2) a la iniciativa: sueles actuar antes.' },
  savage: { name: 'Atacante salvaje', desc: () => 'Una vez por turno, al dañar con un arma tiras los dados de daño dos veces y te quedas con el mejor.' },
} as const;
export type FeatId = keyof typeof FEATS;

export function chooseFeat(c: Char, f: FeatId) {
  if (!c.featPending) return;
  c.featPending = false;
  if (f === 'asi') { const m = mainAbil(c); c.abil[m] = Math.min(20, c.abil[m] + 2); }
  else c.feats = [...(c.feats ?? []), f];
}

/** ¿Sirve de algo descansar? Corto: alguien herido. Largo: además, conjuros o usos gastados. */
export function needsRest(party: Char[], long: boolean): boolean {
  return party.some(c => !c.dead && (c.hp < c.maxHp || c.secondWind < 2 || (long && (
    slotsLeft(c) < slotsAt(c.cls, c.level).reduce((a, b) => a + b, 0) || c.hitDice < c.level || c.channel < maxChannel(c) || c.actionSurge < 1))));
}

export function shortRest(c: Char, rng: Rng): number {
  if (c.dead) return 0;
  let healed = 0;
  // Gasta dados de golpe hasta curarse del todo o quedarse sin ellos.
  while (c.hitDice > 0 && c.hp < c.maxHp) {
    c.hitDice--;
    const periapt = c.items.some(i => i.id === 'periapt_wound_closure') ? 2 : 1;
    const h = Math.max(1, roll(rng, `1d${CLASSES[c.cls].hitDie}`) + abilMod(c, 'con')) * periapt;
    healed += Math.min(h, c.maxHp - c.hp);
    c.hp = Math.min(c.maxHp, c.hp + h);
  }
  if (c.hp > 0) Object.assign(c, { stable: false, deathS: 0, deathF: 0 });
  c.secondWind = Math.min(2, c.secondWind + 1);
  c.actionSurge = 1;
  if (c.cls !== 'paladin') c.channel = Math.min(maxChannel(c), c.channel + 1);
  return healed;
}

export function longRest(c: Char) {
  if (c.dead) return;
  Object.assign(c, {
    hp: c.maxHp, hitDice: c.level, slots: slotsAt(c.cls, c.level), secondWind: 2, actionSurge: 1, channel: maxChannel(c),
    stable: false, deathS: 0, deathF: 0,
  });
}

export const speciesName = (s: SpeciesId) => SPECIES[s].name;

/** 4d6 quitando el menor, seis veces. Devuelve los dados de cada tirada (el menor, el último). */
export function rollAbilities(rand = Math.random): number[][] {
  return Array.from({ length: 6 }, () => Array.from({ length: 4 }, () => 1 + Math.floor(rand() * 6)).sort((a, b) => b - a));
}

/** Reparte las tiradas (de mayor a menor) en el orden de prioridad del reparto recomendado de la clase. */
export function assignRolls(cls: ClassId, rolls: number[][]) {
  const rec = CLASSES[cls].abil;
  const order = (Object.keys(rec) as Ability[]).sort((x, y) => rec[y] - rec[x]);
  const sorted = [...rolls].sort((x, y) => sum3(y) - sum3(x));
  const abil = {} as Record<Ability, number>, dice = {} as Record<Ability, number[]>;
  order.forEach((k, i) => { dice[k] = sorted[i]; abil[k] = sum3(sorted[i]); });
  return { abil, dice };
}
const sum3 = (d: number[]) => d[0] + d[1] + d[2]; // los dados vienen ordenados: el último es el que se quita
