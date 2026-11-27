// Combate por turnos al estilo D&D 5e 2024, con dos filas por bando.
// Todo son funciones puras sobre el estado de la partida (se muta una copia).
import { applyEffect, canInspire, enemiesOf, inspire, maxFoesFor, sizeEncounter } from './escenas';
import type { ImgKey } from '../assets';
import { ABIL_NAME, Ability, CLASSES, DmgType, draconic, ITEMS, MONSTERS, MonsterAttack } from '../data/srd';
import B from '../data/corazon.json';
import { die, pick, rand, roll, tray } from './rng';
import {
  Char, abilMod, armorClass, elvenBoots, saveBonus, spellAttack, spellDc, weaponStat, weapons, newItem, MAX_ITEMS, gainXp, slotsLeft, slotsAt, score,
} from './rules';
import { prof } from '../data/srd';
import type { Game } from './game';
import { ADVS, advOf } from './aventuras';
import { bossEncounter, dropKey, encounterById, encounterGroup, tally } from './dungeon';
import { GOALS, Goal, Piece } from '../data/objetivos';

export type Row = 'front' | 'back';
export type Side = 'party' | 'enemy';

export interface Unit {
  key: string;
  side: Side;
  charId?: string;
  mon?: string;
  name: string;
  img: ImgKey;
  hp: number;
  maxHp: number;
  ac: number;
  row: Row;
  init: number;
  initD20?: number;
  encounter?: string;
  enemyIdx?: number;
  weapon?: string;
  drop?: string;
  dodge?: boolean;
  asleep?: boolean;
  paralyzed?: boolean;
  shield?: boolean;
  bless?: boolean;
  guided?: boolean;
  /** Escondido: el resultado de su Sigilo (lo que tiene que igualar la Percepción de quien le busque). */
  hidden?: number;
  /** Distraído con Ayudar: el próximo ataque de un aliado de quien ayuda contra él tiene ventaja (clave de quien ayuda). */
  helped?: string;
  /** Maestría Debilitar: su próximo ataque tiene desventaja (clave de quien le debilitó). */
  sapped?: string;
  /** Maestría Hostigar: ventaja en su próximo ataque contra esta unidad. */
  vex?: string;
  vexNew?: boolean;
  /** Derribado (maestría Derribar): ataca con desventaja; cuerpo a cuerpo contra él con ventaja, a distancia con desventaja. */
  prone?: boolean;
  spiritual?: boolean;
  lastHitBy?: string;
  fled?: boolean;
  dead?: boolean;
  deathS?: number;
  deathF?: number;
  stable?: boolean;
  recharge?: Record<string, boolean>;
  shieldSlots?: number;
  rays?: number;
  /** Hongo chillón que ya ha chillado, y asalto de su primer grito (su llamada llega al asalto siguiente). */
  shrieked?: boolean;
  shriekAt?: number;
  temp?: number;
  /** Apresado (red o telaraña): CD para soltarse. */
  restrained?: number;
  /** Usos gastados del ataque de área con límite por combate. */
  spent?: number;
  /** Turnos que le quedan ardiendo (fuego de alquimista). */
  burn?: number;
  resPoison?: boolean;
  /** Resistencias de pociones bebidas en este combate (fuego, necrótico, ácido). */
  res?: DmgType[];
  /** Poción de velocidad: +2 CA, ventaja en salvaciones de Destreza y un ataque más por turno. */
  haste?: boolean;
  /** Poción de heroísmo: +1d4 a ataques y salvaciones, como Bendición pero sin concentración. */
  heroism?: boolean;
  /** Poción de crecimiento: +1d4 al daño con armas. */
  grow?: boolean;
  /** Veneno básico untado: el próximo golpe cortante o perforante hace 1d4 de veneno más. */
  poisonBlade?: boolean;
  /** Empapado de aceite: el próximo daño de fuego hace 5 más. */
  oiled?: boolean;
  /** Polvo de desaparición: invisible hasta que ataque, haga daño o lance un conjuro. */
  invisible?: boolean;
  /** Bebió la poción de resistencia al frío. */
  resCold?: boolean;
  /** Bárbaro en Furia: +2 al daño cuerpo a cuerpo y resiste el daño físico. */
  rage?: boolean;
  poisoned?: boolean;
  /** Objetivo de su Marca del cazador. */
  mark?: string;
  /** Objetivo de su Maleficio (brujo). */
  hex?: string;
  /** Asalto en que termina Arma espiritual. */
  spiritualUntil?: number;
  /** Conjuro que mantiene mediante concentración. */
  concentration?: 'mark' | 'bless' | 'spiritual' | 'hex';
  /** Lo que el enemigo ha anunciado que hará en su turno. */
  plan?: Plan;
  /** No muertos: la presa que persiguen hasta que cae. */
  prey?: string;
  /** Jefe: golpe grande anunciado para su próximo turno (nombre del ataque) y fila a la que apunta. */
  warn?: string;
  aim?: Row;
  /** Jefe que ya ha bajado a la mitad de sus PG (cambia de táctica una vez). */
  half?: boolean;
  /** Vharzûl en vuelo: cuerpo a cuerpo no le alcanza. `flown`: ya ha volado en este combate. */
  flying?: boolean;
  flown?: boolean;
  /** Vharzûl: el aliento está listo al aterrizar; `weakBreath`: el primero sale a mitad de daño (preparativo). */
  breathNow?: boolean;
  weakBreath?: boolean;
  /** Daño recibido de cada personaje (Xiximanter se centra en quien más le ha herido). */
  dmgBy?: Record<string, number>;
  /** Xiximanter acaba de lanzar su bola de fuego: no anuncia otra este turno. */
  cool?: boolean;
  /** Mirada del basilisco: apresado por la piedra; si falla otra salvación al acabar su turno, queda petrificado. */
  stoning?: boolean;
  petrified?: boolean;
  /** Maldito por la momia: no recupera PG. */
  cursed?: boolean;
  /** Veces que se ha dividido (gelatina ocre y pudin negro: cada mitad es un tamaño menor; las pequeñas ya no se dividen). */
  splits?: number;
  /** Asalto en que ya ha gastado su reacción (ataque de oportunidad o Vigilar). */
  reacted?: number;
  /** Destrabarse: hasta su siguiente turno, salir de la vanguardia no provoca ataques de oportunidad. */
  disengaged?: boolean;
  /** Agarrado por esa unidad: no cambia de fila ni huye hasta que se suelte. */
  grappled?: string;
  /** Vigilar (Preparar del SRD): si un enemigo ataca a ese aliado, le dispara con su reacción. */
  watch?: string;
  /** Ralentizar: no cambia de fila en su próximo turno. */
  slowed?: boolean;
  /** Ataque temerario (bárbaro): ventaja en sus golpes este turno; los ataques contra él, con ventaja hasta su siguiente turno. */
  reckless?: boolean;
  /** Puntería firme (pícaro): ventaja en su próximo ataque de este turno. */
  steady?: boolean;
  /** Golpe astuto (pícaro de nivel 5): cambia un d6 del ataque furtivo por derribar. */
  trip?: boolean;
  /** Expulsado por el clérigo: retrocede y pierde su turno hasta que le hagan daño. */
  turned?: boolean;
  /**
   * En el flanco (2026-11-27), junto a la pieza: fuera de las filas. Un personaje en el flanco solo alcanza cuerpo a cuerpo
   * a lo que hay allí (la pieza y el enemigo que corre a usarla), y la vanguardia enemiga le sigue alcanzando.
   * La pieza y el enemigo que corre a ella solo se alcanzan cuerpo a cuerpo desde el flanco; a distancia, siempre.
   */
  flank?: boolean;
}

export type FxKind = 'hit' | 'magic' | 'crit' | 'heal';
export interface Roll { id: number; d20: number; total: number; label: string; ok: boolean; crit?: boolean; enemy?: boolean; dice?: { f: number; v: number }[];
  /** Quién tira cuando no es el grupo (salvaciones y pruebas del enemigo): el resultado dice quién falla o supera. */
  who?: string; save?: boolean;
  /** Ventaja (1) o desventaja (-1): se ven los dos d20 y el descartado sale apagado. */
  adv?: number; other?: number }
/** Línea del registro: texto, tono, ronda y quién tenía el turno (para agrupar el registro completo). */
export interface LogLine { t: string; c?: 'dmg' | 'heal' | 'info' | 'big' | 'miss'; r?: number; who?: string }

export interface Combat {
  units: Unit[];
  order: string[];
  turn: number;
  round: number;
  encounters: string[];
  pending: string[];
  /** Ya ha llegado una oleada de refuerzos (solo una por combate). */
  reinforced?: boolean;
  moved: boolean;
  acted: boolean;
  bonus: boolean;
  sneakUsed: boolean;
  /** Hendir y Mella: una vez por turno. */
  cleaveUsed?: boolean;
  nickUsed?: boolean;
  /** Último impacto cuerpo a cuerpo, válido para Castigo divino en este turno. */
  smiteHit?: { attacker: string; target: string; crit: boolean };
  /** Atacante salvaje ya usado en este turno. */
  savageUsed?: boolean;
  /** Ya ha hecho este turno el ataque de más de la poción de velocidad. */
  hasteUsed?: boolean;
  log: LogLine[];
  roll?: Roll;
  /** Último efecto visual por carta (golpe, conjuro, crítico, curación). */
  /** Efecto en cada carta; `type` es el daño mágico (fuego, frío…) para su efecto propio. */
  fx?: Record<string, { id: number; kind: FxKind; type?: DmgType }>;
  fxId?: number;
  /** Cifra de daño (o curación) sobre cada carta; los golpes del mismo paso se suman. */
  pops?: Record<string, { id: number; n: number; kind: 'dmg' | 'heal' | 'crit'; step: number }>;
  popStep?: number;
  /** Último ataque, para animarlo: embestida cuerpo a cuerpo o proyectil a distancia. */
  swing?: { id: number; from: string; to: string; kind: 'melee' | 'arrow' | 'magic'; type: DmgType };
  result?: 'win' | 'lose' | 'fled';
  bg: ImgKey;
  summary?: string[];
  /** Objetivo opcional de este combate. */
  goal?: { g: Goal; status: 'open' | 'ok' | 'fail' };
  /** Lo último que pasó antes de acabar (sale en un cartel grande). */
  endLine?: string;
  /** PX extra (arbustos que aparecen en el combate del Corazón Hueco). */
  bonusXp?: number;
  /**
   * Moral del grupo enemigo (0 a 3), solo en grupos con un líder que no sean no muertos, cienos, construcciones ni jefes.
   * Sube cuando cae el líder, cuando uno huye o con un crítico del grupo. A la tercera, los malheridos huyen.
   */
  morale?: number;
  /** Proteged a: PG que le quedan a la persona que hay que proteger. */
  ward?: number;
  /** Rasgo de la sala (afecta a los dos bandos): angosta (dos por fila), resbaladiza (cambiar de fila pide salvación de
   * Destreza) o con humo (desventaja al disparar a la otra fila; el fuego lo disipa). */
  terrain?: Terrain;
  /** El ruido: el grupo vecino que puede acudir si el combate se alarga o hace mucho ruido, y si ya hubo ruido o aviso. */
  neighbor?: string;
  noise?: boolean;
  noiseWarned?: boolean;
  /** Ataque fallado que se puede repetir con Inspiración heroica (decide el jugador). */
  reroll?: { a: string; t: string; o: AtkOpts; adv: number; total: number };
  /** La pieza del flanco: el enemigo que corre a usarla, si ya se ha activado y los enemigos encerrados (la jaula). */
  runner?: string;
  fired?: boolean;
  caged?: Unit[];
}

const MAX_ROW = 3;
export type Terrain = 'narrow' | 'slippery' | 'smoke';
export const TERRAIN: Record<Terrain, { name: string; desc: string }> = {
  narrow: { name: 'Angosto', desc: 'La sala es estrecha: solo caben dos por fila, en los dos bandos.' },
  slippery: { name: 'Resbaladizo', desc: 'El suelo resbala: para cambiar de fila hay que superar una salvación de Destreza CD 10 o se cae al suelo.' },
  smoke: { name: 'Humo', desc: 'Hay humo: disparar a la otra fila tiene desventaja. El fuego lo disipa.' },
};
/** Jefe de la montaña: Vharzûl, el dragón blanco joven. */
const DRAGON = 'Young White Dragon';
/** El aliento del dragón sale en los asaltos 2, 5, 8... (diseño de la aventura). */
const breathRound = (cb: Combat) => cb.round >= 2 && (cb.round - 2) % 3 === 0;
/** Los cuatro jefes de las aventuras: anuncian su golpe grande y cambian de táctica a mitad de PG. */
export const BOSS_MONS = ['Orvane', 'Treant', 'Young White Dragon', 'Xiximanter'];
const isBoss = (u: Unit) => !!u.mon && BOSS_MONS.includes(u.mon);
/** ¿Echa Vharzûl el aliento en este turno? En los asaltos fijos o al aterrizar. */
const breathNow = (cb: Combat, u: Unit) => breathRound(cb) || !!u.breathNow;
/** El Corazón Hueco tensa sus raíces bajo la retaguardia en los asaltos 3, 6, 9... */
const rootRound = (r: number) => r >= 3 && r % 3 === 0;
/** Frase de cada jefe al bajar a la mitad de sus PG. */
const HALF_LINE: Record<string, string> = {
  Orvane: 'Orvane retrocede hasta el cristal: «¡No acabaréis conmigo!». Ahora va a por el más débil.',
  Treant: 'El Corazón Hueco cruje de dolor. Deja de brotar arbustos, pero sus raíces ahora apresan.',
  'Young White Dragon': 'Vharzûl ruge, herido. Va a alzar el vuelo.',
  Xiximanter: 'Xiximanter escupe una maldición: se centra en quien más daño le ha hecho.',
};
/** Clases con Ataque adicional desde el nivel 5. */
const EXTRA_ATTACK = ['fighter', 'ranger', 'paladin', 'barbarian'];
/** ¿Resiste el frío? (poción, anillo de calor o botas de las tierras invernales) */
const coldProof = (g: Game, u: Unit) => !!u.resCold || charOf(g, u).items.some(i => ITEMS[i.id]?.resistCold && ITEMS[i.id].kind !== 'potion');
/** Aura de protección: un paladín de nivel 6 en pie suma su Carisma (mínimo +1) a las salvaciones del grupo. */
const aura = (g: Game, cb: Combat) => Math.max(0, ...cb.units.filter(u => u.side === 'party' && conscious(u)).map(u => charOf(g, u))
  .filter(c => c.cls === 'paladin' && c.level >= 6).map(c => Math.max(1, abilMod(c, 'cha'))));
/** Nombre corto en los botones de combate para los objetos de nombre muy largo. */
const SHORT: Record<string, string> = { potion_poison_resistance: 'Poción antiveneno', potion_greater_healing_1: 'Poción mayor' };
/** Maestría de armas (SRD 5.2.1): solo las que tienen efecto con dos filas. */
export type Mastery = 'sap' | 'vex' | 'topple' | 'push' | 'cleave' | 'graze' | 'nick' | 'slow';
export const MASTERY: Record<string, Mastery> = {
  // Las cuatro que faltaban (2026-11-27), adaptadas a las filas: Ralentizar impide cambiar de fila en su turno.
  greataxe: 'cleave', greataxe_plus1: 'cleave', halberd: 'cleave', greatsword: 'graze',
  dagger: 'nick', silver_dagger: 'nick', scimitar: 'nick', longbow: 'slow', longbow_plus1: 'slow', light_crossbow: 'slow',
  longsword: 'sap', longsword_plus1: 'sap', mace: 'sap', mace_plus1: 'sap', spear: 'sap', pick: 'sap',
  shortsword: 'vex', rapier_plus1: 'vex', shortbow: 'vex',
  quarterstaff: 'topple', battleaxe: 'topple', battleaxe_plus_one: 'topple',
  warhammer: 'push', weapon_plus1_warhammer: 'push',
};
export const MASTERY_NAME: Record<Mastery, string> = { sap: 'Debilitar', vex: 'Hostigar', topple: 'Derribar', push: 'Empujar', cleave: 'Hendir', graze: 'Rozar', nick: 'Mella', slow: 'Ralentizar' };
/** Armas ligeras: con Mella, la otra que se lleve golpea también (sin sumar la característica al daño). */
const LIGHT = ['dagger', 'silver_dagger', 'scimitar', 'shortsword'];
/** Clases con el rasgo Maestría de armas. */
const MASTERY_CLS = ['fighter', 'rogue', 'paladin', 'barbarian', 'ranger'];
export const masteryOf = (c: Char, weapon: string): Mastery | undefined => (MASTERY_CLS.includes(c.cls) ? MASTERY[weapon] : undefined);
/** Criaturas Enormes: no se las derriba ni se las empuja. */
const HUGE = ['Treant', 'Awakened Tree', 'Walking Tree'];
const solo = (cb: Combat) => cb.units.filter(u => u.side === 'party').length === 1;

const PHYSICAL: DmgType[] = ['cortante', 'perforante', 'contundente'];
const fx = (cb: Combat, u: Unit, kind: FxKind, type?: DmgType) => {
  cb.fxId = (cb.fxId ?? 0) + 1;
  cb.fx = { ...cb.fx, [u.key]: { id: cb.fxId, kind, ...(type && !PHYSICAL.includes(type) ? { type } : {}) } };
};
const pop = (cb: Combat, u: Unit, n: number, kind: 'dmg' | 'heal' | 'crit') => {
  if (n <= 0) return;
  const prev = cb.pops?.[u.key];
  const same = prev && prev.step === cb.popStep && (prev.kind === 'heal') === (kind === 'heal');
  cb.fxId = (cb.fxId ?? 0) + 1;
  cb.pops = { ...cb.pops, [u.key]: { id: cb.fxId, n: same ? prev!.n + n : n, kind: same && prev!.kind === 'crit' ? 'crit' : kind, step: cb.popStep ?? 0 } };
};
const swing = (cb: Combat, a: Unit, t: Unit, kind: 'melee' | 'arrow' | 'magic', type: DmgType) => {
  cb.swing = { id: (cb.swing?.id ?? 0) + 1, from: a.key, to: t.key, kind, type };
};
const pairOf = () => (lastPair ? { adv: lastPair.adv, other: lastPair.other } : {});
const setRoll = (cb: Combat, r: Omit<Roll, 'id'>) => { cb.roll = { id: (cb.roll?.id ?? 0) + 1, ...r }; };

const say = (cb: Combat, t: string, c?: LogLine['c']) => {
  cb.log.push({ t, c, r: cb.round, who: cb.units.find(u => u.key === cb.order[cb.turn])?.name });
  if (cb.log.length > 60) cb.log.shift();
};

export const current = (cb: Combat) => cb.units.find(u => u.key === cb.order[cb.turn])!;
export const charOf = (g: Game, u: Unit) => g.party.find(c => c.id === u.charId)!;
export const alive = (u: Unit) => !u.dead && !u.fled;
export const conscious = (u: Unit) => alive(u) && u.hp > 0;
const sideUnits = (cb: Combat, s: Side) => cb.units.filter(u => u.side === s && alive(u));

/** Fila delantera "ocupada": protege a la retaguardia mientras haya alguien en pie. */
const frontHeld = (cb: Combat, s: Side) => cb.units.some(u => u.side === s && u.row === 'front' && !u.flank && conscious(u));

export function validTargets(cb: Combat, attacker: Unit, kind: 'melee' | 'ranged' | 'ally' | 'any'): Unit[] {
  if (kind === 'ally') return cb.units.filter(u => u.side === attacker.side && alive(u));
  const foe: Side = attacker.side === 'party' ? 'enemy' : 'party';
  const foes = sideUnits(cb, foe).filter(u => attacker.side === 'party' ? u.hp > 0 : true);
  if (kind === 'melee') {
    if (attacker.row !== 'front') return [];
    // El flanco: desde allí solo se alcanza lo que hay en el flanco; desde la vanguardia, todo menos el flanco.
    if (attacker.flank) return foes.filter(u => u.flank);
    // Vharzûl en vuelo: solo se le alcanza a distancia o con conjuros.
    const near = foes.filter(u => !u.flying && !u.flank);
    return frontHeld(cb, foe) ? near.filter(u => u.row === 'front') : near;
  }
  return foes;
}

function rollD20(g: Game, adv: number, luck: boolean): number {
  const r1 = () => { let v = die(g.rng, 20); if (luck && v === 1) v = die(g.rng, 20); return v; };
  const a = r1();
  lastPair = undefined;
  if (adv === 0) return a;
  const b = r1();
  const keep = adv > 0 ? Math.max(a, b) : Math.min(a, b);
  lastPair = { adv, other: keep === a ? b : a };
  return keep;
}
/** El dado descartado de la última tirada con ventaja o desventaja (para enseñarlo). */
let lastPair: { adv: number; other: number } | undefined;

const isHalfling = (g: Game, u: Unit) => u.side === 'party' && charOf(g, u).species === 'halfling';

function endConcentration(cb: Combat, caster: Unit) {
  if (!caster.concentration) return;
  const spell = caster.concentration;
  caster.concentration = undefined;
  if (spell === 'mark') caster.mark = undefined;
  if (spell === 'hex') caster.hex = undefined;
  if (spell === 'bless') for (const ally of cb.units.filter(u => u.side === caster.side)) ally.bless = false;
  if (spell === 'spiritual') { caster.spiritual = false; caster.spiritualUntil = undefined; }
  say(cb, `${caster.name} pierde la concentración.`, 'info');
}

export function applyDamage(g: Game, cb: Combat, target: Unit, amount: number, type: DmgType, from: Unit, crit = false) {
  const m = target.mon ? MONSTERS[target.mon] : undefined;
  if (m?.immune?.includes(type)) {
    say(cb, `${target.name} es inmune al daño de ${type}.`, 'info');
    if (m.split && (type === 'cortante' || type === 'relámpago')) split(g, cb, target);
    return;
  }
  if (type === 'trueno' && cb.neighbor && !cb.noise) { cb.noise = true; say(cb, 'El estruendo resuena por los pasillos. Alguien lo ha oído.', 'big'); }
  if (type === 'fuego' && cb.terrain === 'smoke') { cb.terrain = undefined; say(cb, 'El fuego aviva el aire y disipa el humo.', 'info'); }
  if (type === 'fuego' && target.oiled) { target.oiled = false; amount += 5; say(cb, `El aceite prende: ${target.name} recibe 5 de fuego más.`, 'info'); }
  if (m?.resist?.includes(type)) amount = Math.floor(amount / 2);
  if (target.res?.includes(type)) amount = Math.floor(amount / 2);
  if (m?.vuln?.includes(type)) amount *= 2;
  if (target.side === 'party' && type === 'veneno' && (charOf(g, target).species === 'dwarf' || target.resPoison)) amount = Math.floor(amount / 2);
  if (target.mon === 'Treant' && type !== 'psíquico' && knotsUp(cb)) amount = Math.floor(amount / 2);
  if (target.side === 'party' && ((target.rage && PHYSICAL.includes(type)) || (type === 'frío' && coldProof(g, target)) || speciesResist(charOf(g, target)) === type)) amount = Math.floor(amount / 2);
  target.lastHitBy = from.key;
  fx(cb, target, crit ? 'crit' : PHYSICAL.includes(type) ? 'hit' : 'magic', type);
  if (target.asleep) { target.asleep = false; say(cb, `${target.name} despierta.`, 'info'); }
  if (target.turned && amount > 0) { target.turned = undefined; say(cb, `${target.name} deja de huir de la luz.`, 'info'); }
  if (target.side === 'party' && target.hp <= 0) {
    target.deathF = (target.deathF ?? 0) + (crit ? 2 : 1);
    say(cb, `${target.name} recibe un golpe estando en el suelo.`, 'dmg');
    if ((target.deathF ?? 0) >= 3) kill(cb, target);
    return;
  }
  pop(cb, target, amount, crit ? 'crit' : 'dmg');
  if (target.temp) {
    const absorbed = Math.min(target.temp, amount);
    target.temp -= absorbed;
    amount -= absorbed;
    if (absorbed) say(cb, `${target.name} aguanta ${absorbed} de daño con sus PG temporales.`, 'info');
    if (!amount) return;
  }
  const before = target.hp;
  if (crit && target.side === 'enemy' && from.side === 'party') moraleHit(cb, 'un golpe crítico');
  target.hp = Math.max(0, target.hp - amount);
  say(cb, `${target.name} recibe ${amount} de daño (${type}).`, 'dmg');
  if (isBoss(target) && from.side === 'party') target.dmgBy = { ...target.dmgBy, [from.key]: (target.dmgBy?.[from.key] ?? 0) + amount };
  // Jefe a la mitad de sus PG: una frase y un cambio de táctica (sin curarse ni ganar PG).
  if (isBoss(target) && !target.half && target.hp > 0 && target.hp <= target.maxHp / 2) {
    target.half = true;
    say(cb, HALF_LINE[target.mon!], 'big');
    if (target.mon === 'Orvane' && target.row === 'front' && rowSpace(cb, 'enemy', 'back')) target.row = 'back';
  }
  if (target.concentration && amount > 0) {
    if (target.hp <= 0 || !saveRoll(g, cb, target, 'con', Math.max(10, Math.floor(amount / 2)), 'Concentración')) endConcentration(cb, target);
  }
  // Veneno: el personaje queda envenenado (ataca con desventaja) hasta que se cure con un antídoto o acabe el combate.
  if (type === 'veneno' && target.side === 'party' && target.hp > 0 && !target.poisoned && !target.resPoison && charOf(g, target).species !== 'dwarf') {
    target.poisoned = true;
    say(cb, `${target.name} queda envenenado: ataca con desventaja.`, 'big');
  }
  if (target.side === 'party' && from.side === 'enemy' && target.hp > 0 && amount > 0) rebuke(g, cb, target, from);
  const spare = goalOpen(cb, 'spare');
  if (spare && target.side === 'enemy' && goalUnits(cb, spare.who!).includes(target)) {
    if (target.hp > 0 && target.hp <= target.maxHp / 2) { target.fled = true; target.plan = undefined; say(cb, `${target.name} se rinde.`, 'big'); goalDone(cb, true); return; }
    if (target.hp <= 0) goalDone(cb, false);
  }
  if (target.hp > 0) return;
  if (target.side === 'enemy') {
    if (m?.undeadFortitude && type !== 'radiante' && !crit) {
      // Se enseña la tirada para que se entienda por qué no cae (el autor 2026-11-10).
      const d = die(g.rng, 20), s = d + (m.saves.con ?? 0), dc = 5 + amount;
      const tirada = `Fortaleza de muerto viviente: ${target.name} saca ${s} (d20 ${d}) contra CD ${dc}`;
      if (s >= dc) { target.hp = 1; say(cb, `${tirada} y se niega a caer.`, 'info'); return; }
      say(cb, `${tirada} y cae.`, 'info');
    }
    kill(cb, target);
    darkBlessing(g, cb, target, from);
  } else if (amount - before >= target.maxHp) kill(cb, target);
  else if (charOf(g, target).species === 'orc' && !charOf(g, target).relentless) {
    // Aguante incansable (orco): una vez por descanso largo se queda con 1 PG en vez de caer.
    charOf(g, target).relentless = true;
    target.hp = 1;
    say(cb, `Aguante incansable: ${target.name} se niega a caer y se queda con 1 PG.`, 'big');
  } else {
    Object.assign(target, { deathS: 0, deathF: 0, stable: false });
    say(cb, `${target.name} cae inconsciente.`, 'big');
    if (goalOpen(cb, 'nodown')) goalDone(cb, false);
    if (canHeal(g, target)) say(cb, `¡${target.name} ha caído! Cúralo antes de que falle tres tiradas de salvación.`, 'big');
  }
}

/** Resistencia de especie: el linaje del dracónido o el fuego del tiefling (legado infernal). */
const speciesResist = (c: Char): DmgType | undefined => (c.species === 'dragonborn' ? draconic(c).type : c.species === 'tiefling' ? 'fuego' : undefined);
/** CD de los rasgos de especie: 8 + competencia + Constitución (aliento) o Carisma (legado infernal). */
const speciesDc = (c: Char) => 8 + prof(c.level) + abilMod(c, c.species === 'dragonborn' ? 'con' : 'cha');
/** Ataque de conjuro del legado infernal (Carisma) o el del propio lanzador si es mejor. */
const infernalAttack = (c: Char) => Math.max(prof(c.level) + abilMod(c, 'cha'), CLASSES[c.cls].spell ? spellAttack(c) : -99);

/** Reprensión infernal (tiefling de nivel 3): una vez por descanso largo, quien le daña arde (2d10 de fuego, salvación de Destreza). */
function rebuke(g: Game, cb: Combat, t: Unit, from: Unit) {
  const c = charOf(g, t);
  if (c.species !== 'tiefling' || (c.racial ?? 0) <= 0 || !conscious(from)) return;
  c.racial!--;
  say(cb, `${t.name} responde con Reprensión infernal: llamas verdes envuelven a ${from.name}.`, 'big');
  const dmg = roll(g.rng, '2d10');
  applyDamage(g, cb, from, saveRoll(g, cb, from, 'dex', speciesDc(c), 'Destreza') ? Math.floor(dmg / 2) : dmg, 'fuego', t);
}

/** Bendición del oscuro (brujo infernal de nivel 3): PG temporales al caer un enemigo por su mano o delante de él. */
function darkBlessing(g: Game, cb: Combat, foe: Unit, from: Unit) {
  for (const u of cb.units.filter(x => x.side === 'party' && conscious(x))) {
    const c = charOf(g, u);
    if (c.cls !== 'warlock' || c.level < 3 || (u !== from && !(u.row === 'front' && foe.row === 'front'))) continue;
    const temp = Math.max(1, abilMod(c, 'cha') + c.level);
    if ((u.temp ?? 0) >= temp) continue;
    u.temp = temp;
    say(cb, `Bendición del oscuro: ${u.name} gana ${temp} PG temporales.`, 'info');
  }
}

/** ¿Hay alguien del grupo que pueda curar a este caído? (clérigo con espacio o poción de curación) */
function canHeal(g: Game, who: Unit): boolean {
  return g.party.some(c => c.id !== who.charId && !c.dead && c.hp > 0 && (
    (['cleric', 'ranger', 'paladin'].includes(c.cls) && slotsLeft(c) > 0) || (c.cls === 'paladin' && c.channel > 0) ||
    c.items.some(it => ITEMS[it.id]?.kind === 'potion' && ITEMS[it.id]?.heal)));
}

function kill(cb: Combat, u: Unit) {
  endConcentration(cb, u);
  u.dead = true;
  u.hp = 0;
  if (isPiece(u)) {
    say(cb, `${u.name} queda destrozado.`, 'big');
    if (goalOpen(cb, 'piece')) goalDone(cb, true);
    pieceGone(cb);
    return;
  }
  if (u.key === cb.runner) runnerDown(cb);
  if (u.side === 'enemy' && isLeader(u)) moraleHit(cb, `ha caído ${u.name}`);
  say(cb, u.side === 'enemy' ? `${u.name} cae derrotado.` : `${u.name} ha muerto.`, 'big');
  // Objetivo «primero»: se decide con el primer enemigo que cae.
  const first = goalOpen(cb, 'first');
  if (first && u.side === 'enemy') goalDone(cb, goalUnits(cb, first.who!).includes(u));
  if (u.side === 'party' && goalOpen(cb, 'nodown')) goalDone(cb, false);
  // Al caer el Corazón Hueco se secan sus raíces: nudos y arbustos caen con él.
  if (u.mon === 'Treant') for (const e of cb.units) if (e.side === 'enemy' && alive(e) && e !== u) { e.dead = true; e.hp = 0; }
  // Al caer Vharzûl, los kobolds que quedan huyen.
  if (u.mon === DRAGON) for (const e of cb.units) if (e.side === 'enemy' && alive(e) && e.mon === 'Kobold') { e.fled = true; e.plan = undefined; say(cb, `${e.name} huye despavorido.`, 'info'); }
}

const goalOpen = (cb: Combat, kind: Goal['kind']) => cb.goal?.status === 'open' && cb.goal.g.kind === kind ? cb.goal.g : undefined;
function goalDone(cb: Combat, ok: boolean) {
  if (!cb.goal || cb.goal.status !== 'open') return;
  cb.goal.status = ok ? 'ok' : 'fail';
  say(cb, ok ? '¡Objetivo cumplido!' : 'Objetivo fallado.', ok ? 'big' : 'info');
}
export const isPiece = (u: Unit) => !!u.mon && !!MONSTERS[u.mon].piece;
const goalUnits = (cb: Combat, who: string) => cb.units.filter(u => u.side === 'enemy' && (u.name === who || u.name.startsWith(`${who} `)));
/** Revisa el objetivo tras cada golpe y al empezar cada asalto. */
function goalCheck(cb: Combat, newRound = false, g?: Game) {
  const k = goalOpen(cb, 'kill');
  if (k && goalUnits(cb, k.who!).every(u => u.dead)) goalDone(cb, true);
  const open = cb.goal?.status === 'open' ? cb.goal.g : undefined;
  if (newRound && open?.by && cb.round >= open.by && open.kind !== 'win' && open.kind !== 'piece') {
    if (open.leave) for (const u of goalUnits(cb, open.who!).filter(conscious)) { u.fled = true; u.plan = undefined; say(cb, `${u.name} ${open.leave}.`, 'big'); }
    goalDone(cb, false);
  }
  // Proteged a (2026-11-27): al empezar cada asalto, quien amenaza a la persona indefensa le hace daño si nadie le retiene.
  const w = goalOpen(cb, 'guard');
  if (w && newRound && g && cb.ward !== undefined) {
    const foe = goalUnits(cb, w.who!).find(u => conscious(u) && !u.grappled && !u.prone && !u.asleep && !u.restrained);
    if (foe) {
      cb.ward = Math.max(0, cb.ward - roll(g.rng, '1d4'));
      say(cb, cb.ward ? `${foe.name} ${w.ward!.hurt}: a ${w.ward!.name} le quedan ${cb.ward} PG.` : `${foe.name} ${w.ward!.hurt}. ${w.ward!.name} no aguanta más.`, cb.ward ? 'info' : 'big');
      if (!cb.ward) goalDone(cb, false);
    }
  }
}

// ---------- La pieza del flanco (2026-11-27) ----------

/** La pieza entera (sin romper ni gastada). */
const livePiece = (cb: Combat) => cb.units.find(u => isPiece(u) && conscious(u));

/** Coloca la pieza en el flanco, elige al enemigo que correrá a usarla y encierra a los de la jaula. */
function startPiece(cb: Combat, pc: Piece) {
  cb.units.push({ key: 'piece', side: 'enemy', mon: 'Object', name: pc.name, img: pc.img, hp: pc.hp, maxHp: pc.hp, ac: pc.ac, row: 'back', flank: true, init: 0, encounter: cb.goal!.g.enc, recharge: {} });
  if (pc.runner) {
    const can = goalUnits(cb, pc.runner).filter(conscious);
    cb.runner = (can.find(x => x.row === 'back') ?? can[can.length - 1])?.key;
  }
  if (pc.fx.cage) {
    const inside = goalUnits(cb, pc.fx.cage);
    if (inside.length) {
      cb.caged = inside;
      cb.units = cb.units.filter(x => !inside.includes(x));
      cb.order = cb.order.filter(k => !inside.some(x => x.key === k));
      say(cb, `${inside.map(x => x.name).join(', ')} espera encerrado en su jaula.`, 'info');
    }
  }
}

/** Ya no hay pieza (rota, gastada o sin nadie que la use): quien estaba en el flanco vuelve a su fila. */
function pieceGone(cb: Combat) {
  for (const u of cb.units.filter(x => x.flank && !isPiece(x))) {
    u.flank = false;
    if (u.side === 'party' && conscious(u)) say(cb, `${u.name} vuelve a la vanguardia.`, 'info');
  }
}

/** Quita la pieza del campo sin romperla (ya se ha activado o ya nadie puede usarla). */
function dropPiece(cb: Combat) {
  cb.units = cb.units.filter(x => !isPiece(x));
  pieceGone(cb);
}

/** El enemigo que corría a la pieza ha caído o ha huido: ya nadie la usará. */
function runnerDown(cb: Combat) {
  const pc = cb.goal?.g.piece;
  if (!pc || !cb.runner || cb.fired || !livePiece(cb)) return;
  const r = cb.units.find(x => x.key === cb.runner);
  if (r && conscious(r)) return;
  say(cb, `Ya nadie ${pc.use ?? 'usará la pieza'}.`, 'big');
  if (goalOpen(cb, 'piece')) goalDone(cb, true);
  dropPiece(cb);
}

/** ¿Está el enemigo corriendo a la pieza en este asalto? (no planea otra cosa) */
const runsNow = (cb: Combat, u: Unit) => u.key === cb.runner && !cb.fired && !!livePiece(cb) && cb.round >= (cb.goal?.g.by ?? 3) - 1;

/** Al empezar cada asalto: la pieza sin enemigo que la use se activa en su asalto (la catapulta, en todos desde ahí). */
function pieceRound(g: Game, cb: Combat) {
  const pc = cb.goal?.g.piece;
  if (!pc || !livePiece(cb)) return;
  if (cb.runner) { runnerDown(cb); return; }
  const by = cb.goal!.g.by ?? 3;
  if (cb.round === by - 1) say(cb, `${pc.name} se activará al empezar el próximo asalto.`, 'big');
  if (cb.round >= by && (!cb.fired || pc.fx.repeat)) firePiece(g, cb);
}

/** Turno del enemigo que corre a la pieza: va al flanco el asalto anterior y la usa en su turno del asalto «by». */
function runnerTurn(g: Game, cb: Combat, u: Unit): boolean {
  const pc = cb.goal?.g.piece;
  const p = livePiece(cb);
  if (!pc || !p || cb.fired || u.key !== cb.runner) return false;
  const by = cb.goal!.g.by ?? 3;
  if (cb.round < by - 1) return false;
  const what = p.name.toLowerCase();
  if (!u.flank) {
    if (u.grappled) {
      const by2 = cb.units.find(x => x.key === u.grappled);
      const dc = by2?.side === 'party' ? grappleDc(charOf(g, by2)) : 10;
      const m = MONSTERS[u.mon!];
      const abil: Ability = (m.saves.str ?? 0) >= (m.saves.dex ?? 0) ? 'str' : 'dex';
      say(cb, `${u.name} intenta llegar a ${what}, pero está agarrado.`, 'info');
      if (saveRoll(g, cb, u, abil, dc, ABIL_NAME[abil])) { u.grappled = undefined; say(cb, `${u.name} se suelta.`, 'info'); }
      return true;
    }
    if (u.slowed) { say(cb, `${u.name} quiere correr hacia ${what}, pero va ralentizado.`, 'info'); return true; }
    if (u.row === 'front') {
      const opp = oppFoe(cb, u);
      if (opp) { opportunity(g, cb, opp, u); if (!conscious(u)) { runnerDown(cb); return true; } }
    }
    if (slip(g, cb, u)) return true;
    u.flank = true;
    u.plan = undefined;
    say(cb, `${u.name} corre hacia ${what}: lo usará en su próximo turno si nadie lo impide.`, 'big');
    return true;
  }
  if (cb.round < by) { say(cb, `${u.name} espera junto a ${what}.`, 'info'); return true; }
  say(cb, `${u.name} ${pc.use ?? 'usa la pieza'}.`, 'big');
  firePiece(g, cb);
  return true;
}

/** La pieza se activa: salvación contra la trampa, refuerzos o la jaula que se abre. */
function firePiece(g: Game, cb: Combat) {
  const pc = cb.goal!.g.piece!;
  const p = livePiece(cb)!;
  const eff = pc.fx;
  if (goalOpen(cb, 'piece')) goalDone(cb, false);
  if (eff.spawn) {
    const m = MONSTERS[eff.spawn.mon];
    const cap = maxFoesFor(g.party.filter(c => !c.dead).length);
    const added: Unit[] = [];
    for (let i = 0; i < eff.spawn.count; i++) {
      if (cb.units.filter(x => x.side === 'enemy' && conscious(x) && !isPiece(x)).length >= cap) break;
      const row: Row | undefined = rowSpace(cb, 'enemy', 'front') ? 'front' : rowSpace(cb, 'enemy', 'back') ? 'back' : undefined;
      if (!row) break;
      const u: Unit = {
        key: `e_pieza_${cb.round}_${i}`, side: 'enemy', mon: eff.spawn.mon, name: eff.spawn.count > 1 ? `${eff.spawn.name} ${i + 1}` : eff.spawn.name,
        img: m.img, hp: m.hp, maxHp: m.hp, ac: m.ac, row, init: die(g.rng, 20) + m.dexMod, recharge: {},
      };
      cb.units.push(u);
      cb.order.push(u.key);
      cb.bonusXp = (cb.bonusXp ?? 0) + m.xp;
      added.push(u);
    }
    say(cb, added.length ? eff.text : `${eff.text.split(/[.!] /)[0].replace(/[¡!.]/g, '')}, pero no acude nadie más.`, 'big');
  } else if (eff.cage) {
    const out = cb.caged ?? [];
    cb.caged = undefined;
    for (const u of out) {
      u.init = die(g.rng, 20) + MONSTERS[u.mon!].dexMod;
      cb.units.push(u);
      cb.order.push(u.key);
    }
    if (out.length) say(cb, eff.text, 'big');
  } else say(cb, eff.text, 'big');
  if (eff.save) {
    const sv = eff.save;
    const up = cb.units.filter(x => x.side === 'party' && conscious(x));
    const targets = sv.one ? (up.length ? [pick(g.rng, up)] : []) : up.filter(x => x.row === 'front');
    for (const t of targets) {
      const dmg = roll(g.rng, sv.dice);
      const ok = saveRoll(g, cb, t, sv.abil, sv.dc, ABIL_NAME[sv.abil]);
      const n = ok ? (sv.half ? Math.floor(dmg / 2) : 0) : dmg;
      if (n > 0) applyDamage(g, cb, t, n, sv.type, p);
      else say(cb, `${t.name} se libra.`, 'miss');
    }
  }
  cb.fired = true;
  if (!eff.repeat) dropPiece(cb);
}

/** Lo que se ve al mantener pulsada la carta de la pieza. */
function pieceBehavior(cb: Combat): string[] {
  const pc = cb.goal?.g.piece;
  if (!pc) return ['Un objeto: no ataca ni tiene turno.'];
  const by = cb.goal!.g.by ?? 3;
  const eff = pc.fx;
  const what = eff.save
    ? `salvación de ${ABIL_NAME[eff.save.abil]} CD ${eff.save.dc} o ${eff.save.dice} de daño de ${eff.save.type} ${eff.save.one ? 'a un personaje al azar' : 'a toda la vanguardia'}${eff.save.half ? ' (la mitad si se supera)' : ''}`
    : eff.spawn ? 'llegan refuerzos' : eff.cage ? `sale ${eff.cage.toLowerCase()}` : 'algo pasa';
  const runner = cb.units.find(x => x.key === cb.runner && conscious(x));
  const when = cb.fired && eff.repeat ? `Ya ha empezado: cada asalto, ${what}.`
    : runner ? `Si ${runner.name} llega y ${pc.use} en el asalto ${by}: ${what}.`
      : `Se activa al empezar el asalto ${by}${eff.repeat ? ' y en cada asalto siguiente' : ''}: ${what}.`;
  return [when, 'Cuerpo a cuerpo solo desde el flanco (Ir al flanco); a distancia y con conjuros, desde cualquier fila.', 'No ataca ni tiene turno, y no hace falta romperlo para ganar.'];
}

const knotsUp = (cb: Combat) => cb.units.some(u => u.mon && MONSTERS[u.mon].knot && alive(u));

/** Principio de ronda en el combate del Corazón Hueco: se regenera y brotan arbustos. */
function bossRound(g: Game, cb: Combat) {
  const cap = maxFoesFor(g.party.filter(c => !c.dead).length);
  // Vharzûl: llega un kobold de refuerzo al principio de los asaltos 3 y 6 si hay sitio delante.
  if (cb.units.some(u => u.mon === DRAGON && alive(u)) && (cb.round === 3 || cb.round === 6)) {
    const foes = cb.units.filter(u => u.side === 'enemy' && alive(u));
    if (foes.filter(u => u.row === 'front').length < MAX_ROW && foes.length < cap) {
      const m = MONSTERS.Kobold;
      const u: Unit = {
        key: `e_kobold_${cb.round}`, side: 'enemy', mon: 'Kobold', name: `Kobold de refresco ${cb.round === 3 ? 1 : 2}`, img: m.img, hp: m.hp, maxHp: m.hp,
        ac: m.ac, row: 'front', init: die(g.rng, 20) + m.dexMod, recharge: {},
      };
      cb.units.push(u);
      cb.order.push(u.key);
      cb.bonusXp = (cb.bonusXp ?? 0) + m.xp;
      say(cb, '¡Un kobold sale de entre el hielo para defender a su amo!', 'big');
    }
  }
  const boss = cb.units.find(u => u.mon === 'Treant' && alive(u));
  if (!boss) return;
  if (knotsUp(cb) && boss.hp < boss.maxHp) {
    const h = Math.min(5, boss.maxHp - boss.hp);
    boss.hp += h;
    say(cb, `Los nudos de raíz alimentan al Corazón: recupera ${h} PG.`, 'info');
  }
  const enemies = cb.units.filter(u => u.side === 'enemy' && alive(u));
  if (!boss.half && (cb.round === 2 || cb.round === 4) && enemies.filter(u => u.row === 'front').length < MAX_ROW && enemies.length < cap) {
    const m = MONSTERS['Awakened Shrub'];
    const u: Unit = {
      key: `e_brote_${cb.round}`, side: 'enemy', mon: 'Awakened Shrub', name: 'Arbusto despertado', img: m.img, hp: m.hp, maxHp: m.hp,
      ac: m.ac, row: 'front', init: die(g.rng, 20) + m.dexMod, recharge: {},
    };
    cb.units.push(u);
    cb.order.push(u.key);
    cb.bonusXp = (cb.bonusXp ?? 0) + 10;
    say(cb, '¡Del suelo brota un arbusto despertado!', 'big');
  }
}

/**
 * Hongo chillón: no ataca. Su reacción del SRD 5.2.1 (Chillar) es un grito que se oye a 90 m.
 * En el juego, su primer grito atrae a una criatura pequeña (rata o lagarto) al empezar el asalto siguiente
 * (el autor 2026-11-25). Llega aunque el grupo sea pequeño: el hongo no ataca, así que el combate no se endurece.
 */
function shriek(g: Game, cb: Combat, u: Unit) {
  if (goalOpen(cb, 'noshriek')) goalDone(cb, false);
  if (u.shrieked) { say(cb, `${u.name} sigue chillando.`, 'info'); return; }
  u.shrieked = true;
  u.shriekAt = cb.round;
  say(cb, `${u.name} lanza un chillido que retumba por los pasillos. Algo se acerca.`, 'big');
}

/** Principio de asalto: acude la criatura que llamó el hongo chillón en el asalto anterior. */
function shriekCall(g: Game, cb: Combat) {
  for (const u of cb.units.filter(x => x.mon === 'Shrieker' && x.shriekAt === cb.round - 1)) {
    const mon = pick(g.rng, ['Rat', 'Lizard']);
    const m = MONSTERS[mon];
    const front = cb.units.filter(x => x.side === 'enemy' && alive(x) && x.row === 'front').length < MAX_ROW;
    const v: Unit = {
      key: `e_grito_${u.key}`, side: 'enemy', mon, name: m.name, img: m.img, hp: m.hp, maxHp: m.hp,
      ac: m.ac, row: front ? 'front' : 'back', init: die(g.rng, 20) + m.dexMod, recharge: {},
    };
    cb.units.push(v);
    cb.order.push(v.key);
    cb.bonusXp = (cb.bonusXp ?? 0) + m.xp;
    say(cb, `Atraído por el chillido, acude otro enemigo: ${v.name}.`, 'big');
  }
}

/** Dividirse (gelatina ocre y pudin negro): con 10 PG o más se parte en dos, cada mitad con la mitad de los PG. */
function split(g: Game, cb: Combat, u: Unit) {
  if (u.hp < 10 || (u.splits ?? 0) >= 2) return;
  const foes = cb.units.filter(x => x.side === 'enemy' && alive(x));
  const row: Row | undefined = rowSpace(cb, 'enemy', u.row) ? u.row : rowSpace(cb, 'enemy', u.row === 'front' ? 'back' : 'front') ? (u.row === 'front' ? 'back' : 'front') : undefined;
  if (!row || foes.length >= MAX_ROW * 2) return;
  const half = Math.floor(u.hp / 2);
  u.hp = u.maxHp = half;
  u.splits = (u.splits ?? 0) + 1;
  // Cada mitad, con su carta de mitad.
  u.img = u.mon === 'Black Pudding' ? 'pudin_negro_mitad' : 'gelatina_ocre_mitad';
  const v: Unit = { ...u, key: `${u.key}_d${cb.units.length}`, row, plan: undefined, init: u.init - 0.01, recharge: {}, dmgBy: undefined };
  cb.units.push(v);
  cb.order.splice(cb.order.indexOf(u.key) + 1, 0, v.key);
  if (goalOpen(cb, 'nosplit')) goalDone(cb, false);
  say(cb, `¡${u.name} se divide en dos! Cada mitad tiene ${half} PG.`, 'big');
}

/** Al acabar su turno, quien se está volviendo de piedra repite la salvación: si falla, queda petrificado. */
function stoneSave(g: Game, cb: Combat, u: Unit) {
  if (saveRoll(g, cb, u, 'con', 12, 'Constitución')) { u.stoning = false; say(cb, `${u.name} se sacude la piedra y vuelve a moverse.`, 'info'); return; }
  u.stoning = false;
  u.petrified = u.dead = true;
  u.img = 'estatua_petrificada';
  u.hp = 0;
  u.plan = undefined;
  say(cb, `${u.name} queda petrificado. Solo el templo podrá devolverle a la carne.`, 'big');
  if (goalOpen(cb, 'nostone')) goalDone(cb, false);
  if (u.side === 'party' && goalOpen(cb, 'nodown')) goalDone(cb, false);
}

/** CD de Agarrar (SRD 5.2.1): 8 + Fuerza + competencia. */
const grappleDc = (c: Char) => 8 + abilMod(c, 'str') + prof(c.level);
/** Ataque cuerpo a cuerpo de un monstruo (el primero que no sea a distancia ni de área). */
const meleeOf = (u: Unit) => (u.mon ? MONSTERS[u.mon].attacks.find(a => !a.ranged && !a.save) : undefined);
const canReact = (cb: Combat, x: Unit) => conscious(x) && !x.asleep && !x.paralyzed && !x.restrained && x.reacted !== cb.round;
/** Quién del otro bando, en su vanguardia, puede dar un ataque de oportunidad a quien sale de la vanguardia. */
function oppFoe(cb: Combat, u: Unit): Unit | undefined {
  return cb.units.find(x => x.side !== u.side && x.row === 'front' && !x.flank && !x.fled && canReact(cb, x) && (x.side === 'enemy' ? !!meleeOf(x) && !MONSTERS[x.mon!].reach : true));
}
/** Arma cuerpo a cuerpo de un personaje, para sus reacciones. */
const meleeWeapon = (c: Char) => weapons(c).find(w => !ITEMS[w.id].weapon?.ranged);

/** Ataque de oportunidad (reacción): un solo ataque cuerpo a cuerpo contra quien se retira. */
function opportunity(g: Game, cb: Combat, by: Unit, t: Unit) {
  if (by.side === 'enemy') {
    const a = meleeOf(by);
    if (!a) return;
    by.reacted = cb.round;
    say(cb, `${by.name} aprovecha que ${t.name} se retira: ataque de oportunidad.`, 'big');
    attack(g, cb, by, t, toOpts(a));
    return;
  }
  const c = charOf(g, by);
  const w = meleeWeapon(c);
  if (!w) return;
  by.reacted = cb.round;
  const s = weaponStat(c, w.id), wd = ITEMS[w.id].weapon!;
  say(cb, `${by.name} aprovecha que ${t.name} se retira: ataque de oportunidad.`, 'big');
  attack(g, cb, by, t, { name: ITEMS[w.id].name, toHit: s.toHit, dice: wd.dice, bonus: s.dmgBonus, type: wd.type, ranged: false });
}

/** Vigilar: quien vigila a un aliado le dispara a quien le ataque (una vez, con su reacción). */
function watchShot(g: Game, cb: Combat, foe: Unit, t: Unit) {
  const w = cb.units.find(x => x.side === 'party' && x.watch === t.key && canReact(cb, x));
  if (!w) return;
  const c = charOf(g, w);
  const bow = weapons(c).find(x => ITEMS[x.id].weapon?.ranged);
  w.watch = undefined;
  if (!bow) return;
  w.reacted = cb.round;
  const s = weaponStat(c, bow.id), wd = ITEMS[bow.id].weapon!;
  say(cb, `${w.name} vigilaba a ${t.name} y dispara a ${foe.name}.`, 'big');
  attack(g, cb, w, foe, { name: ITEMS[bow.id].name, toHit: s.toHit, dice: wd.dice, bonus: s.dmgBonus, type: wd.type, ranged: true });
}

/** Quién tiene moral: goblins, sectarios y bestias de carne y hueso (no cienos ni construcciones). */
const moraleFoe = (x: Unit) => !!x.mon && !MONSTERS[x.mon].piece && ['goblin', 'cultist', 'beast'].includes(MONSTERS[x.mon].ai) && !MONSTERS[x.mon].noSleep && !MONSTERS[x.mon].knot;
/** La moral del grupo enemigo baja un paso; a la tercera, los que están por debajo de la mitad de sus PG huyen. */
function moraleHit(cb: Combat, why: string) {
  if (cb.morale === undefined || cb.morale >= 3) return;
  cb.morale++;
  say(cb, `La moral enemiga flaquea (${cb.morale}/3): ${why}.`, 'info');
  if (cb.morale < 3) return;
  const scared = cb.units.filter(x => x.side === 'enemy' && conscious(x) && !x.grappled && moraleFoe(x) && x.hp < x.maxHp / 2);
  for (const x of scared) { x.fled = true; x.plan = undefined; say(cb, `${x.name} pierde el valor y huye.`, 'big'); }
  if (scared.length && goalOpen(cb, 'noflee')) goalDone(cb, false);
  if (!scared.length) say(cb, 'Los enemigos dudan, pero ninguno está tan herido como para huir.', 'info');
}

function heal(cb: Combat, u: Unit, amount: number) {
  if (u.dead) return;
  // Maldición de la momia: toda curación se queda en la mitad hasta quitarla en el templo (ajuste de equilibrio del SRD, 2026-11-27).
  if (u.cursed) { amount = Math.max(1, Math.floor(amount / 2)); say(cb, `La maldición de la momia reduce a la mitad la curación de ${u.name}.`, 'info'); }
  const wasDown = u.hp <= 0;
  const before = Math.max(0, u.hp);
  u.hp = Math.min(u.maxHp, before + amount);
  fx(cb, u, 'heal');
  pop(cb, u, u.hp - before, 'heal');
  if (wasDown) Object.assign(u, { deathS: 0, deathF: 0, stable: false });
  say(cb, `${u.name} recupera ${amount} PG${wasDown ? ' y se levanta' : ''}.`, 'heal');
}

interface AtkOpts { name: string; toHit: number; dice: string; bonus: number; type: DmgType; ranged: boolean; extra?: { dice: string; type: DmgType }; sneak?: boolean; spell?: boolean;
  mastery?: Mastery; masteryDc?: number;
  /** Modificador de característica del daño (Rozar lo hace al fallar; Hendir y Mella no lo suman). Con Mella, la otra arma ligera. */
  abilDmg?: number; offhand?: string;
  /** Repetición con Inspiración heroica: la misma ventaja o desventaja, sin volver a gastar estados. */
  rerollAdv?: number }

/** Un enemigo grande en la vanguardia cubre a su tirador de detrás: media cobertura, +2 a la CA (SRD). */
const coverOf = (cb: Combat, a: Unit, t: Unit) =>
  a.side === 'party' && t.side === 'enemy' && t.row === 'back' && !t.flank && cb.units.some(x => x.side === 'enemy' && conscious(x) && x.plan?.guard) ? 2 : 0;

/** Motivos de ventaja y de desventaja de un ataque, sin gastar nada: los usan la tirada y la previsión. */
function advFor(cb: Combat, a: Unit, t: Unit, ranged: boolean): { up: string[]; down: string[] } {
  const up: string[] = [], down: string[] = [];
  if (t.dodge) down.push('esquiva');
  if (ranged && a.row === 'front' && frontHeld(cb, t.side) && t.side !== a.side) down.push('cuerpo a cuerpo');
  if (t.guided) up.push('Saeta guía');
  if (t.restrained) up.push('objetivo apresado');
  if (a.restrained) down.push('apresado');
  if (a.poisoned) down.push('envenenado');
  if (a.hidden) up.push('escondido');
  if (a.invisible) up.push('invisible');
  if (t.invisible) down.push('objetivo invisible');
  if (t.asleep || t.paralyzed || t.hp <= 0) up.push('objetivo indefenso');
  if (a.mon && MONSTERS[a.mon].packTactics && cb.units.some(u => u !== a && u.side === a.side && conscious(u) && u.row === 'front')) up.push('en manada');
  if (a.side === 'party' && t.helped && t.helped !== a.key) up.push('Ayudar');
  if (a.sapped) down.push('debilitado');
  if (a.reckless && !ranged) up.push('Ataque temerario');
  if (t.reckless && t.side !== a.side) up.push('objetivo temerario');
  if (a.steady) up.push('Puntería firme');
  if (a.vex && a.vex === t.key) up.push('Hostigar');
  if (t.prone) { if (ranged) down.push('derribado'); else up.push('objetivo derribado'); }
  if (a.prone) down.push('en el suelo');
  if (cb.terrain === 'smoke' && ranged && a.row !== t.row) down.push('humo');
  return { up, down };
}

/** Tirada de ataque completa. Devuelve si impactó. */
function attack(g: Game, cb: Combat, a: Unit, t: Unit, o: AtkOpts): boolean {
  swing(cb, a, t, !o.ranged ? 'melee' : o.spell ? 'magic' : 'arrow', o.type);
  // Como en el SRD: si hay al menos una fuente de ventaja y una de desventaja, se anulan (no se suman).
  const why = o.rerollAdv === undefined ? advFor(cb, a, t, o.ranged) : { up: [], down: [] };
  if (o.rerollAdv === undefined) {
    // Lo que se gasta con este ataque.
    t.guided = false;
    a.hidden = undefined;
    a.invisible = undefined;
    if (a.side === 'party' && t.helped && t.helped !== a.key) t.helped = undefined;
    a.sapped = undefined;
    a.steady = undefined;
    if (a.vex === t.key) a.vex = undefined;
  }
  const { up, down } = why;
  const adv = o.rerollAdv ?? (up.length && down.length ? 0 : up.length ? 1 : down.length ? -1 : 0);
  const cover = coverOf(cb, a, t);
  let d20 = rollD20(g, adv, isHalfling(g, a));
  const bless = a.bless || a.heroism ? die(g.rng, 4) : 0;
  let total = d20 + o.toHit + bless;
  const champ = a.side === 'party' && charOf(g, a).cls === 'fighter' && charOf(g, a).level >= 3 && !o.spell;
  const critOf = (d: number) => d === 20 || (champ && d === 19) || (!o.ranged && (t.paralyzed || t.asleep || t.hp <= 0) && d !== 1);
  let crit = critOf(d20);
  const ac = t.ac + (t.shield ? 5 : 0) + cover;
  let hit = d20 !== 1 && (crit || total >= ac);
  // Reacción Escudo (mago del grupo u Orvane).
  if (hit && !crit && !t.shield && total < ac + 5) {
    const c = t.side === 'party' ? charOf(g, t) : undefined;
    if (c && c.cls === 'wizard' && c.slots[0] > 0 && t.hp > 0) { c.slots[0]--; t.shield = true; hit = false; say(cb, `${t.name} lanza Escudo (+5 CA).`, 'info'); }
    else if ((t.shieldSlots ?? 0) > 0) { t.shieldSlots!--; t.shield = true; hit = false; say(cb, `${t.name} lanza Escudo (+5 CA).`, 'info'); }
  }
  setRoll(cb, { d20, total, label: a.side === 'party' ? `${o.name} contra CA ${ac}` : `${a.name}: ${o.name} contra CA ${ac}`, ok: hit, crit, enemy: a.side === 'enemy', ...pairOf() });
  // Se dice siempre por qué: así se aprende qué táctica ha funcionado.
  const advTxt = (adv > 0 ? ` con ventaja${up.length ? ` (${up.join(', ')})` : ''}` : adv < 0 ? ` con desventaja${down.length ? ` (${down.join(', ')})` : ''}`
    : up.length && down.length ? ` sin ventaja ni desventaja (${up[0]} contra ${down[0]})` : '') + (cover ? ' (media cobertura: +2 CA)' : '');
  if (!hit) {
    say(cb, `${a.name} usa ${o.name}${advTxt}: ${d20}+${o.toHit + bless} = ${total}. Falla.`, 'miss');
    if (o.mastery === 'graze' && (o.abilDmg ?? 0) > 0) { say(cb, `Rozar: el filo le alcanza igualmente.`, 'info'); applyDamage(g, cb, t, o.abilDmg!, o.type, a); }
    nick(g, cb, a, t, o);
    // Inspiración heroica: el jugador decide si repite el dado (SRD 5.2.1); se ofrece al acabar la acción.
    if (a.side === 'party' && o.rerollAdv === undefined && canInspire(g, charOf(g, a))) cb.reroll = { a: a.key, t: t.key, o, adv, total };
    return false;
  }
  say(cb, `${a.name} usa ${o.name}${advTxt}: ${d20}+${o.toHit + bless} = ${total}. ${crit ? '¡CRÍTICO!' : 'Impacta.'}`, crit ? 'big' : undefined);
  if (a.side === 'party' && !o.spell && !o.ranged && charOf(g, a).cls === 'paladin') cb.smiteHit = { attacker: a.key, target: t.key, crit };
  let dice = roll(g.rng, o.dice, crit);
  // Dote Atacante salvaje: una vez por turno, con un arma se tiran los dados de daño dos veces y se elige el mejor.
  if (a.side === 'party' && !o.spell && !cb.savageUsed && charOf(g, a).feats?.includes('savage')) {
    const again = roll(g.rng, o.dice, crit);
    cb.savageUsed = true;
    if (again > dice) { say(cb, `Atacante salvaje: repite el daño (${dice} → ${again}).`, 'info'); dice = again; }
  }
  let dmg = Math.max(1, dice + o.bonus);
  if (a.rage && !o.ranged && !o.spell) dmg += 2;
  if (a.grow && !o.spell) dmg += roll(g.rng, '1d4', crit);
  if (o.sneak && !cb.sneakUsed && a.side === 'party') {
    const c = charOf(g, a);
    const ally = cb.units.some(u => u !== a && u.side === 'party' && conscious(u) && u.row === 'front') && t.row === 'front';
    if (c.cls === 'rogue' && (adv > 0 || ally)) {
      // Golpe astuto (nivel 5): un d6 menos a cambio de una salvación de Destreza o al suelo.
      const trip = a.trip && c.level >= 5 && !HUGE.includes(t.mon ?? '') && !t.prone;
      a.trip = undefined;
      const sa = roll(g.rng, trip ? '2d6' : c.level >= 5 ? '3d6' : c.level >= 3 ? '2d6' : '1d6', crit);
      if (trip) {
        const dc = 8 + abilMod(c, 'dex') + prof(c.level);
        if (!saveRoll(g, cb, t, 'dex', dc, 'Destreza')) { t.prone = true; say(cb, `Golpe astuto: ${t.name} cae al suelo.`, 'big'); }
      }
      dmg += sa;
      cb.sneakUsed = true;
      say(cb, `Ataque furtivo: +${sa}.`, 'info');
    }
  }
  applyDamage(g, cb, t, dmg, o.type, a, crit);
  if (o.extra && alive(t)) applyDamage(g, cb, t, Math.max(0, roll(g.rng, o.extra.dice, crit)), o.extra.type, a, crit);
  if (a.poisonBlade && !o.spell && (o.type === 'cortante' || o.type === 'perforante')) {
    a.poisonBlade = false;
    if (alive(t)) { say(cb, `Veneno básico: +1d4 de veneno.`, 'info'); applyDamage(g, cb, t, roll(g.rng, '1d4', crit), 'veneno', a, crit); }
  }
  if (a.concentration === 'mark' && a.mark === t.key && !o.spell) { const bonus = roll(g.rng, '1d6', crit); say(cb, `Marca del cazador: +${bonus} de fuerza.`, 'info'); if (alive(t)) applyDamage(g, cb, t, bonus, 'fuerza', a, crit); }
  if (a.concentration === 'hex' && a.hex === t.key && alive(t)) { const bonus = roll(g.rng, '1d6', crit); say(cb, `Maleficio: +${bonus} necrótico.`, 'info'); applyDamage(g, cb, t, bonus, 'necrótico', a, crit); }
  if (o.mastery && conscious(t)) masteryHit(g, cb, a, t, o.mastery, o.masteryDc ?? 10);
  if (o.mastery === 'cleave' && !cb.cleaveUsed) {
    // Hendir: una vez por turno, el golpe sigue hasta otro enemigo de la misma fila (sin sumar la característica).
    const t2 = cb.units.find(x => x.side === t.side && x !== t && conscious(x) && x.row === t.row && !x.flying);
    if (t2) { cb.cleaveUsed = true; say(cb, `Hendir: el golpe sigue hasta ${t2.name}.`, 'info'); attack(g, cb, a, t2, { ...o, mastery: undefined, bonus: o.bonus - Math.max(0, o.abilDmg ?? 0) }); }
  }
  nick(g, cb, a, t, o);
  if (a.mon === 'Treant') say(cb, pick(g.rng, B.boss.visions), 'info');
  return true;
}

/** Mella: una vez por turno, la otra arma ligera golpea también (sin sumar la característica al daño). */
function nick(g: Game, cb: Combat, a: Unit, t: Unit, o: AtkOpts) {
  if (o.mastery !== 'nick' || !o.offhand || cb.nickUsed || cb.result) return;
  const t2 = conscious(t) ? t : validTargets(cb, a, 'melee')[0];
  if (!t2) return;
  cb.nickUsed = true;
  const c = charOf(g, a), w = ITEMS[o.offhand].weapon!, s = weaponStat(c, o.offhand);
  attack(g, cb, a, t2, { name: `${ITEMS[o.offhand].name} (Mella)`, toHit: s.toHit, dice: w.dice, bonus: s.dmgBonus - Math.max(0, abilMod(c, s.abil)), type: w.type, ranged: false, sneak: true });
}

/** Efecto de la maestría del arma tras un impacto. */
function masteryHit(g: Game, cb: Combat, a: Unit, t: Unit, m: Mastery, dc: number) {
  const huge = HUGE.includes(t.mon ?? '');
  if (m === 'sap') { t.sapped = a.key; say(cb, `Debilitar: ${t.name} atacará con desventaja en su próximo ataque.`, 'info'); }
  if (m === 'vex') { a.vex = t.key; a.vexNew = true; say(cb, `Hostigar: ${a.name} tendrá ventaja en su próximo ataque contra ${t.name}.`, 'info'); }
  if (m === 'topple' && !huge && !t.prone) {
    // Salvación de Constitución sin dado grande en pantalla: el d20 que se ve es el del ataque.
    const d20 = die(g.rng, 20), total = d20 + (MONSTERS[t.mon!]?.saves.con ?? 0);
    if (total >= dc) say(cb, `Derribar: ${t.name} resiste (Constitución ${d20}${total - d20 >= 0 ? '+' : ''}${total - d20} = ${total} contra CD ${dc}).`, 'miss');
    else { t.prone = true; say(cb, `Derribar: ${t.name} cae al suelo (Constitución ${d20}${total - d20 >= 0 ? '+' : ''}${total - d20} = ${total} contra CD ${dc}).`, 'big'); }
  }
  if (m === 'slow' && t.side === 'enemy' && !isBoss(t)) { t.slowed = true; say(cb, `Ralentizar: ${t.name} no podrá cambiar de fila en su próximo turno.`, 'info'); }
  if (m === 'push' && !huge && t.side === 'enemy' && t.row === 'front' && rowSpace(cb, 'enemy', 'back')) {
    t.row = 'back';
    t.plan = undefined;
    say(cb, `Empujar: ${t.name} sale despedido a la retaguardia.`, 'info');
  }
}

/** El jugador gasta la Inspiración heroica: repite el d20 del último ataque fallado y se queda con el nuevo. */
export function useInspiration(g: Game, cb: Combat) {
  const r = cb.reroll;
  cb.reroll = undefined;
  const a = cb.units.find(x => x.key === r?.a), t = cb.units.find(x => x.key === r?.t);
  if (!r || !a || !t || cb.result || !conscious(a) || !alive(t) || !inspire(g, charOf(g, a))) return;
  say(cb, `${a.name} gasta su Inspiración heroica y repite el dado.`, 'big');
  attack(g, cb, a, t, { ...r.o, rerollAdv: r.adv });
  if (!checkEnd(g, cb)) planAll(g, cb);
}

/** El enemigo busca a quien se ha escondido: Percepción contra su Sigilo. Si iguala o supera, le encuentra. */
function spot(g: Game, cb: Combat, e: Unit, t: Unit): boolean {
  const d20 = die(g.rng, 20), total = d20 + (MONSTERS[e.mon!].saves.wis ?? 0), ok = total >= t.hidden!;
  setRoll(cb, { d20, total, label: `${e.name}: Percepción contra el Sigilo de ${t.name} (${t.hidden})`, ok, enemy: true, who: e.name });
  if (ok) { say(cb, `${e.name} encuentra a ${t.name} (${total} contra ${t.hidden}): deja de estar escondido.`, 'info'); t.hidden = undefined; }
  else say(cb, `${e.name} busca a ${t.name}, pero no le encuentra (${total} contra ${t.hidden}).`, 'info');
  return ok;
}

function saveRoll(g: Game, cb: Combat, t: Unit, abil: Ability, dc: number, label: string): boolean {
  let bonus: number;
  let adv = 0;
  if (t.side === 'party') { bonus = saveBonus(charOf(g, t), abil); if (abil === 'dex' && (t.dodge || t.haste)) adv = 1; }
  else bonus = MONSTERS[t.mon!].saves[abil] ?? 0;
  if (t.bless || t.heroism) bonus += die(g.rng, 4);
  if (t.side === 'party') bonus += aura(g, cb);
  const d20 = rollD20(g, adv, isHalfling(g, t));
  const ok = d20 + bonus >= dc;
  setRoll(cb, { d20, total: d20 + bonus, label: `Salvación de ${label} de ${t.name} · CD ${dc}`, ok, enemy: t.side === 'enemy', who: t.name, save: true, ...pairOf() });
  say(cb, `Salvación de ${label} de ${t.name}: ${d20}${bonus >= 0 ? '+' : ''}${bonus} = ${d20 + bonus} contra CD ${dc}. ${ok ? `${t.name} la supera` : `${t.name} falla`}.`, ok ? 'miss' : undefined);
  return ok;
}

// ---------- Inicio y fin ----------

export function startCombat(g: Game, encounterId: string): Combat {
  const group = encounterGroup(g, encounterId);
  const units: Unit[] = [];
  g.party.forEach(c => {
    if (c.dead) return;
    units.push({
      key: `p_${c.id}`, side: 'party', charId: c.id, name: c.name, img: c.img, hp: c.hp, maxHp: c.maxHp,
      ac: armorClass(c), row: c.row, init: 0, deathS: c.deathS, deathF: c.deathF, stable: c.stable, cursed: c.cursed,
    });
  });
  const cb: Combat = {
    units, order: [], turn: 0, round: 1, encounters: [], pending: [], moved: false, acted: false, bonus: false,
    sneakUsed: false, log: [], bg: g.zoneBg ?? 'combate_mina',
    terrain: (encounterById(encounterId) as { terrain?: Terrain } | undefined)?.terrain,
  };
  // Sala angosta: si delante no caben todos, los que sobran empiezan detrás.
  if (cb.terrain === 'narrow') for (const u of units.filter(x => x.row === 'front').slice(2)) u.row = 'back';
  sizeEncounter(g, group.now, group.now.includes(bossEncounter(g.zone)));
  group.now.forEach(id => addEncounter(g, cb, id, true));
  // Sin refuerzos automáticos de grupos vecinos (el autor 2026-11-06): cada grupo lucha solo.
  // Solo «el ruido» (2026-11-27): si el combate se alarga o hay un estruendo, el vecino puede acudir (una vez y avisado).
  cb.pending = [];
  cb.neighbor = group.later.find(x => !g.done.includes(x) && x !== bossEncounter(g.zone) && !group.now.includes(bossEncounter(g.zone)));
  bossPrepFx(g, cb);
  const goal = GOALS.find(x => cb.encounters.includes(x.enc) && !g.goals?.[x.enc]);
  // «Primero» pide que haya alguien más a quien dejar para después; «que no caiga nadie», compañeros a los que cuidar.
  const foes = cb.units.filter(x => x.side === 'enemy');
  const fits = goal && !(goal.kind === 'first' && foes.every(x => goalUnits(cb, goal.who!).includes(x))) && !(goal.kind === 'nodown' && solo(cb));
  if (goal && fits) { cb.goal = { g: goal, status: 'open' }; say(cb, `Objetivo: ${goal.text}`, 'big'); }
  for (const u of cb.units) {
    // Dote Alerta: suma el bonificador de competencia a la iniciativa.
    const dex = u.side === 'party' ? abilMod(charOf(g, u), 'dex') + (charOf(g, u).feats?.includes('alert') ? prof(charOf(g, u).level) : 0) : MONSTERS[u.mon!].dexMod;
    u.initD20 = die(g.rng, 20);
    u.init = u.initD20 + dex + rand(g.rng) * 0.1;
  }
  // Sorpresa (SRD 5.2.1): los enemigos a los que os acercasteis sin ser vistos tiran la iniciativa con desventaja.
  if (g.surprise && group.now.includes(g.surprise)) {
    for (const u of cb.units.filter(x => x.side === 'enemy')) {
      const d = Math.min(u.initD20!, die(g.rng, 20));
      u.init += d - u.initD20!;
      u.initD20 = d;
    }
    say(cb, '¡Los habéis sorprendido! Tiran la iniciativa con desventaja.', 'big');
  }
  g.surprise = undefined;
  if (cb.units.some(x => x.side === 'enemy' && isLeader(x)) && cb.units.filter(x => x.side === 'enemy' && moraleFoe(x)).length >= 2
    && !cb.units.some(x => x.side === 'enemy' && (isBoss(x) || !moraleFoe(x)))) cb.morale = 0;
  cb.order = [...cb.units].sort((a, b) => b.init - a.init).map(u => u.key);
  // La pieza (2026-11-27): un objeto en el flanco, sin ataques ni turno. Hay que romperlo antes de que se active.
  const pc = cb.goal?.g.piece;
  if (pc) startPiece(cb, pc);
  if (cb.goal?.g.kind === 'guard') cb.ward = cb.goal.g.ward!.hp;
  if (cb.terrain) say(cb, `${TERRAIN[cb.terrain].name}: ${TERRAIN[cb.terrain].desc}`, 'big');
  say(cb, `¡Combate! Iniciativa: ${cb.order.map(k => cb.units.find(u => u.key === k)!.name).join(', ')}.`, 'info');
  startTurn(g, cb);
  return cb;
}

/** Preparativos ganados en la aventura (ver bossPrep en dungeon.ts): el jefe llega con algo menos. */
function bossPrepFx(g: Game, cb: Combat) {
  const has = (f: string) => !!g.flags?.includes(f);
  for (const u of cb.units.filter(x => x.side === 'enemy')) {
    if (u.mon === DRAGON && has('m3_valvulas')) u.weakBreath = true;
    if (u.mon === 'Xiximanter' && has('s4_libres')) u.spent = 1;
  }
  const knot = cb.units.find(x => x.mon && MONSTERS[x.mon].knot);
  if (knot && has('b4_promesa') && cb.units.some(x => x.mon === 'Treant')) {
    cb.units = cb.units.filter(x => x !== knot);
    say(cb, 'Una de las raíces que prometieron proteger no obedece: falta un nudo junto al Corazón.', 'info');
  }
}

function addEncounter(g: Game, cb: Combat, id: string, force: boolean): boolean {
  const enc = encounterById(id);
  if (!enc) return false;
  const saved = g.enemyHp[id];
  const list: Unit[] = [];
  let n = 0;
  for (const e of enemiesOf(g, id)) for (let i = 0; i < e.count; i++, n++) {
    const m = MONSTERS[e.srd_creature];
    if (!m) continue;
    const hp = saved?.[n] ?? m.hp;
    if (hp <= 0) continue;
    list.push({
      key: `e_${id}_${n}`, side: 'enemy', mon: e.srd_creature, name: e.count > 1 ? `${e.name} ${i + 1}` : e.name,
      img: e.srd_creature === 'Goblin Warrior' && /arco|ballesta/i.test(e.weapon ?? '') ? 'goblin_arquero' : m.img, hp, maxHp: m.hp, ac: m.ac, row: e.row === 'back' ? 'back' : 'front', init: 0, encounter: id,
      enemyIdx: n, weapon: e.weapon, // Los enemigos ya no sueltan armas normales, solo oro (el autor 2026-11-03, punto 41).
      // Orvane: cortar el ritual (objetivo de z4_e03) le quita un rayo; cerrar las compuertas (z4_p01), un Escudo.
      shieldSlots: e.srd_creature === 'Orvane' && g.flags?.includes('z4_compuertas') ? m.shieldSlots! - 1 : m.shieldSlots,
      rays: e.srd_creature === 'Orvane' ? (g.goals?.z4_e03 === 'ok' ? 1 : 2) : 0, recharge: {},
    });
  }
  const count = (r: Row) => cb.units.filter(u => u.side === 'enemy' && alive(u) && u.row === r).length;
  const rowCap = cb.terrain === 'narrow' ? 2 : MAX_ROW;
  // Refuerzos proporcionados al grupo: como mucho 2 enemigos más que personajes (y 6 en total).
  const cap = Math.min(MAX_ROW * 2, cb.units.filter(u => u.side === 'party').length + 2);
  if (!force && list.length && (count('front') + count('back') + list.length > cap)) return false;
  for (const u of list) {
    if (count(u.row) >= rowCap) u.row = u.row === 'front' ? 'back' : 'front';
    if (count(u.row) >= rowCap) continue;
    cb.units.push(u);
  }
  cb.encounters.push(id);
  return true;
}

function startTurn(g: Game, cb: Combat) {
  const u = current(cb);
  planAll(g, cb);
  cb.moved = cb.acted = cb.bonus = cb.sneakUsed = cb.hasteUsed = cb.cleaveUsed = cb.nickUsed = false;
  cb.smiteHit = undefined;
  cb.reroll = undefined;
  // Ayudar y Debilitar duran hasta el principio del siguiente turno de quien los hizo; Hostigar, hasta el final.
  for (const x of cb.units) { if (x.helped === u.key) x.helped = undefined; if (x.sapped === u.key) x.sapped = undefined; }
  if (u.vexNew) u.vexNew = false; else u.vex = undefined;
  if (u.concentration === 'spiritual' && cb.round >= (u.spiritualUntil ?? Infinity)) endConcentration(cb, u);
  if (u.concentration === 'mark' && !cb.units.some(x => x.key === u.mark && conscious(x))) u.mark = undefined;
  if (u.concentration === 'hex' && !cb.units.some(x => x.key === u.hex && conscious(x))) u.hex = undefined;
  cb.savageUsed = false;
  u.dodge = false;
  u.reckless = u.steady = u.trip = undefined;
  u.disengaged = false;
  u.watch = undefined;
  if (u.shield) u.shield = false;
  if (u.side === 'party' && u.hp <= 0 && !u.dead && !u.stable && charOf(g, u).items.some(i => i.id === 'periapt_wound_closure')) {
    u.stable = true;
    say(cb, `El periapto cierra las heridas de ${u.name}: se estabiliza.`, 'info');
  }
  if (u.side === 'party' && u.hp <= 0 && !u.dead && !u.stable) {
    const d = die(g.rng, 20);
    if (d === 20) { u.hp = 1; say(cb, `${u.name} saca un 20 y se levanta con 1 PG.`, 'heal'); }
    else if (d === 1) u.deathF = (u.deathF ?? 0) + 2;
    else if (d >= 10) u.deathS = (u.deathS ?? 0) + 1;
    else u.deathF = (u.deathF ?? 0) + 1;
    setRoll(cb, { d20: d, total: d, label: `Salvación contra muerte (${u.name})`, ok: d >= 10 });
    if (u.hp <= 0) say(cb, `${u.name}: salvación contra muerte ${d} (éxitos ${u.deathS ?? 0}, fallos ${u.deathF ?? 0}).`, 'info');
    if ((u.deathF ?? 0) >= 3) kill(cb, u);
    else if ((u.deathS ?? 0) >= 3) { u.stable = true; say(cb, `${u.name} se estabiliza.`, 'info'); }
  }
}

/** ¿Le toca a alguien que no decide el jugador? (enemigos, caídos, dormidos) */
export const autoTurn = (cb: Combat) => {
  const u = current(cb);
  return u.side === 'enemy' || !conscious(u) || !!u.paralyzed;
};

export function endTurn(g: Game, cb: Combat) {
  const u = current(cb);
  if (u.side === 'enemy' && isBoss(u) && conscious(u)) bossWarn(g, cb, u);
  if (u.stoning && conscious(u)) stoneSave(g, cb, u);
  if (u.paralyzed && conscious(u)) {
    if (saveRoll(g, cb, u, 'con', 10, 'Constitución')) { u.paralyzed = false; say(cb, `${u.name} ya puede moverse.`, 'info'); }
  }
  if (checkEnd(g, cb)) return;
  for (let i = 0; i < cb.order.length + 1; i++) {
    cb.turn++;
    if (cb.turn >= cb.order.length) {
      cb.turn = 0;
      cb.round++;
      goalCheck(cb, true, g);
      // Si con el objetivo fallado huye el último enemigo, el combate acaba aquí.
      if (checkEnd(g, cb)) return;
      reinforce(g, cb);
      pieceRound(g, cb);
      if (checkEnd(g, cb)) return;
    }
    const n = current(cb);
    if (alive(n)) break;
  }
  startTurn(g, cb);
}

function reinforce(g: Game, cb: Combat) {
  bossRound(g, cb);
  shriekCall(g, cb);
  // El ruido: al asalto 4 se oyen pasos; al 5 (o tras un estruendo) llega el grupo vecino.
  if (cb.neighbor && !cb.reinforced) {
    if (cb.round === 4 && !cb.noise) { cb.noiseWarned = true; say(cb, 'Se oyen pasos cerca: si el combate sigue, llegarán más.', 'big'); }
    if (cb.round >= 5 || cb.noise) { cb.pending = [cb.neighbor]; cb.neighbor = undefined; }
  }
  for (const id of [...cb.pending]) {
    if (cb.reinforced) break;
    if (g.done.includes(id)) { cb.pending = cb.pending.filter(x => x !== id); continue; }
    const before = cb.units.length;
    if (addEncounter(g, cb, id, false)) {
      cb.pending = cb.pending.filter(x => x !== id);
      cb.reinforced = true;
      const added = cb.units.slice(before);
      for (const u of added) {
        u.init = die(g.rng, 20) + MONSTERS[u.mon!].dexMod;
        cb.order.push(u.key);
      }
      if (added.length) say(cb, `¡Llegan refuerzos: ${added.map(u => u.name).join(', ')}!`, 'big');
    }
  }
}

export function checkEnd(g: Game, cb: Combat): boolean {
  if (cb.result) return true;
  goalCheck(cb);
  if (!cb.units.some(u => u.side === 'enemy' && conscious(u) && !isPiece(u))) { finish(g, cb, 'win'); return true; }
  if (!cb.units.some(u => u.side === 'party' && conscious(u))) { finish(g, cb, 'lose'); return true; }
  return false;
}

function syncParty(g: Game, cb: Combat) {
  for (const u of cb.units) if (u.side === 'party') {
    const c = charOf(g, u);
    Object.assign(c, { hp: Math.max(0, u.hp), dead: !!u.dead, deathS: u.deathS ?? 0, deathF: u.deathF ?? 0, stable: !!u.stable, row: u.row });
    if (u.petrified) c.petrified = true;
    if (u.cursed) c.cursed = true;
  }
}

/** Modo desarrollador: da el combate por ganado. */
export function devWin(g: Game, cb: Combat) {
  if (!cb.result) finish(g, cb, 'win');
}

function finish(g: Game, cb: Combat, result: 'win' | 'lose' | 'fled') {
  const lastEvent = [...cb.log].reverse().find(l => l.c === 'big' || /huye|se rinde|se desvanece|cae /.test(l.t))?.t;
  cb.result = result;
  syncParty(g, cb);
  // La poción de fuerza de gigante dura el combate.
  for (const c of g.party) c.giantStr = undefined;
  const msgs: string[] = [];
  const fledFoes = cb.units.filter(u => u.side === 'enemy' && u.fled).length;
  if (result === 'win') {
    const why = fledFoes === 1 && cb.units.filter(u => u.side === 'enemy' && u.dead).length === 0 ? 'El enemigo huyó.'
      : fledFoes === 1 ? 'El último enemigo huyó.' : fledFoes > 1 ? 'Los enemigos que quedaban huyeron.' : 'Todos los enemigos han caído.';
    msgs.push(why);
    cb.endLine = lastEvent?.replace(/[.!¡]+$/g, '') ?? why;
    const open = cb.goal?.status === 'open' ? cb.goal.g : undefined;
    if (open) goalDone(cb, ['noflee', 'nodown', 'nosplit', 'noshriek', 'nostone', 'guard', 'piece'].includes(open.kind) || (open.kind === 'win' && cb.round < (open.by ?? 99)));
    let xp = cb.bonusXp ?? 0, gold = 0;
    for (const id of cb.encounters) {
      const e = encounterById(id)!;
      // Los jefes siempre conceden su recompensa completa: Vharzûl y
      // el Corazón tienen PX=0 en MONSTERS y antes podían dar 0 PX
      // si sus acompañantes se reducían por el tamaño del grupo.
      const xpOf = (list: any[]) => list.reduce((n, x) => n + (MONSTERS[x.srd_creature]?.xp ?? 0) * x.count, 0);
      xp += id === bossEncounter(g.zone)
        ? e.xp_total
        : Math.round(e.xp_total * (xpOf(enemiesOf(g, id)) / Math.max(1, xpOf(e.enemies))));
      gold += e.gold_drop;
      g.done.push(id);
      // Quién cayó aquí (para el mapa): solo los que cayeron en este combate o en uno anterior; los que huyeron o no salieron no cuentan.
      const fell: Record<string, number> = {};
      let n = 0;
      for (const en of enemiesOf(g, id)) for (let i = 0; i < en.count; i++, n++) {
        const u = cb.units.find(x => x.key === `e_${id}_${n}`);
        if (u ? u.dead : (g.enemyHp[id]?.[n] ?? 1) <= 0) fell[en.name] = (fell[en.name] ?? 0) + 1;
      }
      g.fallen = { ...g.fallen, [id]: fell };
      // Las espadas van donde se luchó, no en la casilla de la que salió el grupo (el autor 2026-11-25).
      g.wonAt = { ...g.wonAt, [id]: `${g.pos[0]},${g.pos[1]}` };
      delete g.enemyHp[id];
    }
    const drops = cb.units.filter(u => u.side === 'enemy' && u.dead && u.drop).map(u => u.drop!);
    // Como en el SRD, los caídos no se levantan solos ni se estabilizan al acabar el combate: en el mapa siguen
    // tirando salvaciones hasta que alguien los estabilice o los cure (el autor 2026-11-25; ver muerte.ts).
    // Héroe solo: tras cada victoria recupera el aliento (ajuste de equilibrio de la zona 1).
    g.gold += gold;
    const alive0 = g.party.filter(c => !c.dead).length;
    const adv = ADVS[advOf(g.zone)];
    xp = Math.round(xp * (adv.xpScale ?? 1));
    tally(g, { kills: cb.units.filter(u => u.side === 'enemy' && u.dead).length, gold, xp: alive0 ? Math.floor(xp / alive0) : 0 });
    const spare = { xp: 0 };
    msgs.push(...gainXp(g.party, xp, adv.level, spare));
    // Con el nivel ya al tope, la experiencia de más se convierte en botín (1 mo por cada 10 PX) para que explorar compense.
    const extra = Math.floor(spare.xp / 10);
    if (extra) { g.gold += extra; msgs.push(`Lo que ya no os hace subir de nivel se queda en botín: ${extra} monedas de oro.`); }
    // Astucia mágica (brujo de nivel 2): tras el combate, un rito de un minuto devuelve la mitad de los espacios de pacto.
    for (const c of g.party.filter(x => !x.dead && x.hp > 0 && x.cls === 'warlock' && x.level >= 2 && !x.cunning)) {
      const full = slotsAt(c.cls, c.level), max = full[0] + full[1] + full[2];
      const back = Math.min(Math.ceil(max / 2), max - slotsLeft(c));
      if (back <= 0) continue;
      c.cunning = true;
      c.slots = full.map(n => (n ? slotsLeft(c) + back : 0)) as Char['slots'];
      msgs.push(`${c.name} usa Astucia mágica: recupera ${back} espacio${back > 1 ? 's' : ''} de pacto.`);
    }
    if (gold) msgs.push(`Botín: ${gold} monedas de oro.`);
    const got = new Map<string, number>();
    const floor: string[] = [];
    for (const d of drops) {
      const holder = g.party.find(c => !c.dead && c.items.length < MAX_ITEMS);
      if (holder) { holder.items.push(newItem(d)); const k = `${holder.name}|${d}`; got.set(k, (got.get(k) ?? 0) + 1); }
      else { const k = dropKey(g); g.drops = { ...g.drops, [k]: [...(g.drops?.[k] ?? []), newItem(d)] }; floor.push(ITEMS[d].name); }
    }
    for (const [k, n] of got) { const [who, d] = k.split('|'); msgs.push(`${who} recoge: ${ITEMS[d].name}${n > 1 ? ` x${n}` : ''}.`); }
    // Objetivo opcional: se apunta y, si se cumplió, su premio.
    if (cb.goal) {
      const G = cb.goal.g;
      g.goals = { ...g.goals, [G.enc]: cb.goal.status === 'ok' ? 'ok' : 'fail' };
      if (cb.goal.status === 'ok') {
        msgs.push(`Objetivo cumplido. ${G.ok}`);
        g.gold += G.gold;
        for (const d of G.items) {
          const holder = g.party.find(c => !c.dead && c.items.length < MAX_ITEMS);
          if (holder) { holder.items.push(newItem(d)); msgs.push(`${holder.name} recoge: ${ITEMS[d].name}.`); }
        }
        if (G.gold) msgs.push(`Premio: ${G.gold} monedas de oro.`);
      } else msgs.push(`Objetivo fallado: ${G.text.replace(/\.$/, '')}.`);
      // Lo que cambia más adelante en la aventura por haberlo cumplido o fallado.
      const fx = cb.goal.status === 'ok' ? G.okFx : G.failFx;
      if (fx) msgs.push(...applyEffect(g, fx).lines);
    }
    if (floor.length) msgs.push(`No cabe en las mochilas y queda en el suelo: ${floor.join(', ')}.`);
  } else if (result === 'fled') {
    for (const id of cb.encounters) {
      g.enemyHp[id] = [];
      let n = 0;
      for (const en of enemiesOf(g, id)) for (let i = 0; i < en.count; i++, n++) {
        const u = cb.units.find(x => x.key === `e_${id}_${n}`);
        g.enemyHp[id][n] = u ? (u.dead || u.fled ? 0 : u.hp) : MONSTERS[en.srd_creature]?.hp ?? 0;
      }
      if (!g.fled.includes(id)) g.fled.push(id);
    }
    msgs.push('El grupo huye y retrocede una casilla.');
    cb.endLine = 'El grupo huye';
  } else { msgs.push('Todo el grupo ha caído.'); cb.endLine = 'Todo el grupo ha caído'; }
  cb.summary = msgs;
  g.log.push(...msgs);
  msgs.forEach(m => say(cb, m, 'big'));
}

// ---------- Acciones del jugador ----------

export type Target = 'enemy-melee' | 'enemy' | 'ally' | 'ally-down' | 'none';
export interface Action {
  id: string; label: string; cost: 'action' | 'bonus' | 'move' | 'free'; target: Target; detail?: string;
  /** Cura: solo se ofrece a quien le falta vida. */
  heal?: boolean;
  /** Si no sirve de nada ahora: el motivo (el botón sale apagado y lo explica). */
  off?: string;
}

const HEALS = ['cure', 'healing_word', 'spark', 'lay', 'mass_heal'];
const isHeal = (c: Char, a: Action) => HEALS.includes(a.id) || !!a.heal;
/** Aliados a los que les falta vida (también los caídos que aún no han muerto). */
const hurt = (cb: Combat) => cb.units.filter(u => u.side === 'party' && alive(u) && u.hp < u.maxHp);

/** Motivo por el que una acción no tendría ningún efecto ahora mismo. */
function uselessWhy(g: Game, cb: Combat, a: Action): string | undefined {
  const u = current(cb);
  const c = charOf(g, u);
  if (isHeal(c, a) && !hurt(cb).length) return 'No es necesario: todos tenéis los PG al máximo.';
  if (a.id === 'second_wind' && u.hp >= u.maxHp) return 'No es necesario: tienes los PG al máximo.';
  if (a.id === 'bless' && cb.units.filter(x => x.side === 'party' && alive(x)).every(x => x.bless)) return 'No es necesario: el grupo ya está bendecido.';
  if (a.id === 'hide' && u.hidden) return 'No es necesario: ya estás escondido.';
  if (a.id === 'hide' && u.row !== 'back') return 'Solo puedes esconderte desde la retaguardia.';
  if (a.id === 'help' && !cb.units.some(x => x.side === 'party' && x !== u && conscious(x))) return 'No hay ningún aliado que pueda aprovechar la ayuda.';
  // Ir atrás se permite aunque la vanguardia quede vacía (el autor 2026-11-10): sin nadie delante, te alcanzan igual.
  if (a.detail === 'resiste veneno' && cb.units.filter(x => x.side === 'party' && alive(x)).every(x => x.resPoison)) return 'No es necesario: todos resistís ya el veneno.';
  if (a.detail === COLD && cb.units.filter(x => x.side === 'party' && alive(x)).every(x => coldProof(g, x))) return 'No es necesario: todos resistís ya el frío.';
  if (a.detail === CURE && !targetsFor(cb, a).length) return 'No es necesario: nadie está envenenado.';
  if (a.detail === ELIXIR && !targetsFor(cb, a).length) return 'No es necesario: nadie está envenenado ni paralizado.';
  if (a.id.startsWith('dust:') && cb.units.filter(x => x.side === 'party' && conscious(x)).every(x => x.invisible)) return 'No es necesario: ya sois invisibles.';
  if (a.target !== 'none' && !targetsFor(cb, a).length) {
    return a.target === 'enemy-melee' && u.row !== 'front' ? 'Desde la retaguardia no alcanzas cuerpo a cuerpo: pasa delante primero.' : 'No hay ningún objetivo a tu alcance.';
  }
  return undefined;
}

/** ¿Le queda al personaje algo útil que hacer (cambiar de fila también cuenta)? Si no, su turno acaba solo. */
// Ir atrás no cuenta: si es lo único que queda, el turno acaba solo.
export const hasUseful = (g: Game, cb: Combat) => actionsFor(g, cb).some(a => !a.off && a.id !== 'flank' && !(a.id === 'row' && current(cb).row === 'front'));

export function actionsFor(g: Game, cb: Combat): Action[] {
  const u = current(cb);
  if (u.side !== 'party' || !conscious(u)) return [];
  const c = charOf(g, u);
  const A: Action[] = [];
  const slots = slotsLeft(c);
  for (const w of weapons(c)) {
    const def = ITEMS[w.id];
    const s = weaponStat(c, w.id);
    const m = masteryOf(c, w.id);
    A.push({ id: `atk:${w.id}`, label: def.name, cost: 'action', target: def.weapon!.ranged ? 'enemy' : 'enemy-melee', detail: `+${s.toHit} · ${def.weapon!.dice}${s.dmgBonus >= 0 ? '+' : ''}${s.dmgBonus}${m ? ` · ${MASTERY_NAME[m]}` : ''}` });
    // Poción de velocidad: la acción de más solo sirve para un ataque (SRD 5.2.1, Acelerar).
    if (u.haste && cb.acted && !cb.hasteUsed) A.push({ id: `haste:${w.id}`, label: `${def.name} (velocidad)`, cost: 'free', target: def.weapon!.ranged ? 'enemy' : 'enemy-melee', detail: 'un ataque más' });
  }
  if (c.cls === 'cleric') {
    A.push({ id: 'sacred_flame', label: 'Llama sagrada', cost: 'action', target: 'enemy', detail: `DES CD ${spellDc(c)} · ${c.level >= 5 ? '2d8' : '1d8'}` });
    if (slotsLeft(c) > 0) {
      A.push({ id: 'cure', label: 'Curar heridas', cost: 'action', target: 'ally', detail: '2d8+SAB' });
      A.push({ id: 'healing_word', label: 'Palabra de curación', cost: 'bonus', target: 'ally', detail: '2d4+SAB' });
      A.push({ id: 'guiding_bolt', label: 'Saeta guía', cost: 'action', target: 'enemy', detail: '4d6' });
      A.push({ id: 'bless', label: 'Bendecir', cost: 'action', target: 'none', detail: '+1d4 al grupo' });
    }
    if (c.level >= 2 && c.channel > 0 && cb.units.some(x => x.side === 'enemy' && conscious(x) && x.mon && MONSTERS[x.mon].ai === 'undead' && !isBoss(x) && !x.turned))
      A.push({ id: 'turn_undead', label: 'Expulsar muertos vivientes', cost: 'action', target: 'none', detail: `SAB CD ${spellDc(c)} (${c.channel})` });
    if (c.level >= 2 && c.channel > 0) A.push({ id: 'spark', label: 'Chispa divina', cost: 'action', target: 'ally', detail: `cura 1d8+SAB (${c.channel})` });
    if (c.level >= 3 && (u.spiritual || c.slots[1] > 0)) A.push({ id: 'spiritual', label: 'Arma espiritual', cost: 'bonus', target: 'enemy', detail: '1d8+SAB' });
    if (c.level >= 5 && (c.slots[2] ?? 0) > 0) A.push({ id: 'mass_heal', label: 'Curación en masa', cost: 'bonus', target: 'none', detail: 'todo el grupo 2d4+SAB' });
  }
  if (c.cls === 'wizard') {
    A.push({ id: 'fire_bolt', label: 'Descarga de fuego', cost: 'action', target: 'enemy', detail: c.level >= 5 ? '2d10' : '1d10' });
    A.push({ id: 'ray_frost', label: 'Rayo de escarcha', cost: 'action', target: 'enemy', detail: c.level >= 5 ? '2d8' : '1d8' });
    if (slotsLeft(c) > 0) {
      A.push({ id: 'magic_missile', label: 'Proyectil mágico', cost: 'action', target: 'enemy', detail: '3×(1d4+1)' });
      A.push({ id: 'burning_hands', label: 'Manos ardientes', cost: 'action', target: 'none', detail: 'fila delantera 3d6' });
      A.push({ id: 'sleep', label: 'Dormir', cost: 'action', target: 'enemy', detail: 'una fila, SAB' });
    }
    if (c.level >= 3 && c.slots[1] > 0) A.push({ id: 'scorching', label: 'Rayo abrasador', cost: 'action', target: 'enemy', detail: '3×2d6' });
    if (c.level >= 5 && (c.slots[2] ?? 0) > 0) A.push({ id: 'fireball', label: 'Bola de fuego', cost: 'action', target: 'enemy', detail: 'una fila 8d6' });
  }
  if (c.cls === 'warlock') {
    const lvl = pactLevel(c);
    A.push({ id: 'eldritch', label: 'Descarga sobrenatural', cost: 'action', target: 'enemy', detail: `${c.level >= 5 ? '2×' : ''}1d10${c.level >= 2 ? `+${abilMod(c, 'cha')}` : ''} fuerza` });
    if (u.concentration === 'hex' && !u.hex) A.push({ id: 'hex_move', label: 'Mover Maleficio', cost: 'bonus', target: 'enemy', detail: 'Sin gastar conjuro' });
    else if (slots > 0) A.push({ id: 'hex', label: 'Maleficio', cost: 'bonus', target: 'enemy', detail: '+1d6 necrótico al impactar' });
    if (c.level >= 3 && slots > 0) {
      A.push({ id: 'burning_hands', label: 'Manos ardientes', cost: 'action', target: 'none', detail: `fila delantera ${lvl + 2}d6` });
      A.push({ id: 'scorching', label: 'Rayo abrasador', cost: 'action', target: 'enemy', detail: `${lvl + 1}×2d6` });
    }
    if (c.level >= 5 && slots > 0) A.push({ id: 'fireball', label: 'Bola de fuego', cost: 'action', target: 'enemy', detail: 'una fila 8d6' });
  }
  // Rasgos de especie: Ataque de aliento del dracónido y Descarga de fuego del tiefling (el mago ya la tiene).
  if (c.species === 'dragonborn' && (c.racial ?? 0) > 0) A.push({ id: 'breath', label: 'Ataque de aliento', cost: 'action', target: 'enemy', detail: `una fila ${c.level >= 5 ? '2d10' : '1d10'} ${draconic(c).type} (${c.racial})` });
  if (c.species === 'tiefling' && c.cls !== 'wizard') A.push({ id: 'infernal_bolt', label: 'Descarga de fuego', cost: 'action', target: 'enemy', detail: c.level >= 5 ? '2d10' : '1d10' });
  if (c.species === 'orc' && (c.racial ?? 0) > 0) A.push({ id: 'adrenaline', label: 'Descarga de adrenalina', cost: 'bonus', target: 'none', detail: `+${prof(c.level)} PG temporales (${c.racial})` });
  if (c.cls === 'barbarian' && c.level >= 2 && !cb.acted && !u.reckless) A.push({ id: 'reckless', label: 'Ataque temerario', cost: 'free', target: 'none', detail: 'ventaja, y contra ti' });
  if (c.cls === 'barbarian' && c.channel > 0 && !u.rage) A.push({ id: 'rage', label: 'Furia', cost: 'bonus', target: 'none', detail: `+2 daño, resiste golpes (${c.channel})` });
  if (c.cls === 'fighter') {
    if (c.secondWind > 0) A.push({ id: 'second_wind', label: 'Tomar aliento', cost: 'bonus', target: 'none', detail: `1d10+${c.level} (${c.secondWind})` });
    if (c.level >= 2 && c.actionSurge > 0 && cb.acted) A.push({ id: 'surge', label: 'Oleada de acción', cost: 'free', target: 'none', detail: 'otra acción' });
  }
  if (c.cls === 'rogue' && c.level >= 3 && !cb.moved && !u.steady) A.push({ id: 'steady', label: 'Puntería firme', cost: 'bonus', target: 'none', detail: 'ventaja, sin moverte' });
  if (c.cls === 'rogue' && c.level >= 5 && !cb.acted && !u.trip) A.push({ id: 'trip', label: 'Golpe astuto', cost: 'free', target: 'none', detail: 'furtivo −1d6: derribar' });
  if (c.cls === 'rogue' && c.level >= 2) A.push({ id: 'hide', label: 'Esconderse', cost: 'bonus', target: 'none', detail: 'Sigilo' });
  if (c.cls === 'ranger') {
    if (u.concentration === 'mark' && !u.mark) A.push({ id: 'mark_move', label: 'Mover Marca del cazador', cost: 'bonus', target: 'enemy', detail: 'Sin gastar conjuro' });
    else if (c.channel > 0 || slots > 0) A.push({ id: 'mark', label: 'Marca del cazador', cost: 'bonus', target: 'enemy', detail: `+1d6 al impactar${c.channel > 0 ? ` (${c.channel} gratis)` : ''}` });
    if (slots > 0) A.push({ id: 'cure', label: 'Curar heridas', cost: 'action', target: 'ally', detail: '2d8+SAB' });
  }
  if (c.cls === 'paladin') {
    if (c.channel > 0) A.push({ id: 'lay', label: 'Imposición de manos', cost: 'bonus', target: 'ally', detail: `reserva ${c.channel} PG` });
    if (slots > 0) {
      if (cb.smiteHit?.attacker === u.key && cb.units.some(x => x.key === cb.smiteHit!.target && alive(x)))
        A.push({ id: 'smite', label: 'Castigo divino', cost: 'bonus', target: 'none', detail: '+2d8 radiante al último impacto' });
      A.push({ id: 'bless', label: 'Bendecir', cost: 'action', target: 'none', detail: '+1d4 al grupo' });
      A.push({ id: 'cure', label: 'Curar heridas', cost: 'action', target: 'ally', detail: '2d8+CAR' });
    }
  }
  // Un solo botón por objeto repetido: «Poción de curación ×2».
  const seen = new Set<string>();
  for (const it of c.items) {
    const d = ITEMS[it.id];
    if ((d.kind === 'potion' || d.kind === 'throw') && seen.has(it.id)) continue;
    seen.add(it.id);
    const n = c.items.filter(x => x.id === it.id).length;
    const short = SHORT[it.id] ?? d.name;
    const name = n > 1 ? `${short} ×${n}` : short;
    if (d.kind === 'potion' && (d.heal || d.resistPoison || d.curePoison || d.resistCold)) A.push({ id: `potion:${it.uid}`, label: name, cost: 'bonus', target: 'ally', detail: d.heal ?? (d.curePoison ? CURE : d.resistCold ? COLD : 'resiste veneno'), heal: !!d.heal || undefined });
    if (d.kind === 'potion' && (d.resist || (d.effect && d.effect !== 'vanish'))) A.push({ id: `potion:${it.uid}`, label: name, cost: 'bonus', target: 'ally', detail: d.resist ? `resiste ${d.resist}` : EFFECT[d.effect!] });
    if (d.effect === 'vanish') A.push({ id: `dust:${it.uid}`, label: name, cost: 'action', target: 'none', detail: 'el grupo, invisible' });
    // El agua bendita solo sale si hay algún no muerto en pie.
    if (d.kind === 'throw' && d.thrown?.undeadOnly && !cb.units.some(x => x.side === 'enemy' && alive(x) && MONSTERS[x.mon!]?.ai === 'undead')) continue;
    if (d.kind === 'throw') A.push({ id: `throw:${it.uid}`, label: name, cost: 'action', target: 'enemy', detail: d.thrown!.dice ?? (d.thrown!.oil ? 'empapa: +5 de fuego' : 'apresa') });
    if (d.web && (it.charges ?? 0) > 0 && CLASSES[c.cls].spell) A.push({ id: `web:${it.uid}`, label: 'Varita de telarañas', cost: 'action', target: 'enemy', detail: `una fila · ${it.charges} cargas` });
    if (d.kind === 'wand' && !d.web && (it.charges ?? 0) > 0) A.push({ id: `wand:${it.uid}`, label: 'Varita', cost: 'action', target: 'enemy', detail: `${it.charges} cargas` });
    if (d.kind === 'scroll' && d.spell && d.scrollFor?.includes(c.cls)) A.push({ id: `scroll:${it.uid}`, label: name, cost: 'action', ...SCROLL[d.spell], heal: d.spell === 'cure' || undefined });
    if (d.kind === 'scroll' && !d.spell && c.cls === 'wizard') A.push({ id: `scroll:${it.uid}`, label: 'Pergamino de escudo', cost: 'action', target: 'none', detail: '+5 CA' });
  }
  A.push({ id: 'help', label: 'Ayudar', cost: 'action', target: 'enemy-melee', detail: 'ventaja a un aliado' });
  // Agarrar (SRD 5.2.1, golpe sin armas): el agarrado no cambia de fila ni huye hasta que se suelte.
  A.push({ id: 'grapple', label: 'Agarrar', cost: 'action', target: 'enemy-melee', detail: `FUE o DES CD ${grappleDc(c)}` });
  // Destrabarse: salir de la vanguardia este turno sin ataques de oportunidad.
  if (u.row === 'front' && oppFoe(cb, u)) A.push({ id: 'disengage', label: 'Destrabarse', cost: 'action', target: 'none', detail: 'cambiar de fila sin ataque de oportunidad' });
  // Poner a salvo a un caído de la vanguardia: acción y movimiento.
  if (u.row === 'front' && !cb.moved && cb.units.some(x => x.side === 'party' && x !== u && alive(x) && x.hp <= 0 && x.row === 'front'))
    A.push({ id: 'rescue', label: 'Poner a salvo', cost: 'action', target: 'ally-down', detail: 'llevar a un caído a la retaguardia' });
  // Vigilar a un aliado: si le atacan, disparas con tu reacción (Preparar del SRD con un solo disparador).
  const bow = weapons(c).find(w => ITEMS[w.id].weapon?.ranged);
  if (bow) A.push({ id: `watch:${bow.id}`, label: 'Vigilar', cost: 'action', target: 'ally', detail: 'dispara a quien le ataque' });
  A.push({ id: 'dodge', label: 'Esquivar', cost: 'action', target: 'none' });
  // El flanco (2026-11-27): desde la vanguardia se va junto a la pieza; desde allí se vuelve.
  if (u.flank) A.push({ id: 'flank', label: 'Volver a la vanguardia', cost: 'move', target: 'none', detail: 'deja el flanco' });
  else {
    if (u.row === 'front' && livePiece(cb)) A.push({ id: 'flank', label: 'Ir al flanco', cost: 'move', target: 'none', detail: `junto a ${livePiece(cb)!.name}` });
    A.push({ id: 'row', label: u.row === 'front' ? 'Ir atrás' : 'Ir delante', cost: 'move', target: 'none' });
  }
  A.push({ id: 'flee', label: 'Huir', cost: 'action', target: 'none' });
  // Quita lo que ya no se puede pagar este turno.
  return A.filter(a => (a.cost === 'action' ? !cb.acted : a.cost === 'bonus' ? !cb.bonus : a.cost === 'move' ? !cb.moved : true))
    .filter(a => a.id !== 'row' || rowSpace(cb, 'party', u.row === 'front' ? 'back' : 'front'))
    .map(a => { const off = uselessWhy(g, cb, a); return off ? { ...a, off } : a; });
}

// El grupo cabe entero en una fila (hasta 4); los enemigos, 3 por fila como mucho. En una sala angosta, dos.
const rowSpace = (cb: Combat, s: Side, r: Row) => cb.units.filter(u => u.side === s && alive(u) && u.row === r && !u.flank).length < (cb.terrain === 'narrow' ? 2 : s === 'enemy' ? MAX_ROW : MAX_ROW + 1);
/** Suelo resbaladizo: cambiar de fila pide una salvación de Destreza CD 10; quien la falla cae al suelo y no se mueve. */
function slip(g: Game, cb: Combat, u: Unit): boolean {
  if (cb.terrain !== 'slippery' || saveRoll(g, cb, u, 'dex', 10, 'Destreza')) return false;
  u.prone = true;
  say(cb, `${u.name} resbala y cae al suelo.`, 'big');
  return true;
}

const KEEP_INVISIBLE = ['dodge', 'help', 'row', 'flank', 'potion', 'dust', 'surge', 'second_wind', 'rage', 'hide', 'adrenaline'];
const CURE = 'cura el veneno';
const COLD = 'resiste el frío';
const ELIXIR = 'quita veneno y parálisis';
const EFFECT: Record<string, string> = {
  haste: '+2 CA y un ataque más', heroism: '10 PG temporales y +1d4', growth: '+1d4 al daño con armas', giant: 'Fuerza 21', elixir: ELIXIR, poison: '+1d4 de veneno al golpear',
};
/** Objetivo y resumen de cada conjuro que se lanza con pergamino. */
const SCROLL: Record<string, { target: Target; detail: string }> = {
  cure: { target: 'ally', detail: '2d8 + mod.' }, bless: { target: 'none', detail: '+1d4 al grupo' }, guiding_bolt: { target: 'enemy', detail: '4d6' },
  magic_missile: { target: 'enemy', detail: '3×(1d4+1)' }, sleep: { target: 'enemy', detail: 'una fila, SAB' }, burning_hands: { target: 'none', detail: 'fila delantera 3d6' },
};

export function targetsFor(cb: Combat, a: Action): Unit[] {
  const u = current(cb);
  if (a.target === 'enemy-melee') return validTargets(cb, u, 'melee');
  if (a.target === 'enemy') {
    if (a.id === 'sleep') return validTargets(cb, u, 'ranged');
    return validTargets(cb, u, 'ranged');
  }
  if (a.detail === CURE) return cb.units.filter(x => x.side === 'party' && alive(x) && x.poisoned);
  // Las curaciones solo se ofrecen a quien le falta vida.
  if (a.detail === ELIXIR) return cb.units.filter(x => x.side === 'party' && alive(x) && (x.poisoned || x.paralyzed));
  if (a.target === 'ally' && (HEALS.includes(a.id) || a.heal)) return hurt(cb);
  if (a.id === 'rescue') return cb.units.filter(x => x.side === 'party' && x !== u && alive(x) && x.hp <= 0 && x.row === 'front');
  if (a.id.startsWith('watch:')) return cb.units.filter(x => x.side === 'party' && x !== u && conscious(x));
  if (a.target === 'ally' || a.target === 'ally-down') return validTargets(cb, u, 'ally');
  return [];
}

/** Previsión de una acción contra un objetivo: probabilidad aproximada de que salga bien y por qué. */
export interface Preview { pct: number; adv: number; why: string[]; /** Depende de la salvación del objetivo, no de una tirada de ataque. */ save?: boolean }

/**
 * Calcula, sin tirar ni gastar nada, lo fácil que es acertar con una acción a un objetivo. Usa las mismas reglas
 * que la tirada real (ventaja, cobertura, CA); no cuenta las reacciones del enemigo ni Bendecir.
 */
export function preview(g: Game, cb: Combat, a: Action, t: Unit): Preview | undefined {
  const u = current(cb);
  if (u.side !== 'party' || t.side !== 'enemy') return undefined;
  const c = charOf(g, u);
  const [kind, arg] = a.id.split(':');
  const m = MONSTERS[t.mon!];
  // Conjuros y objetos que piden salvación: la probabilidad de que el objetivo la falle.
  const saveOf: Record<string, [Ability, number]> = {
    sacred_flame: ['dex', spellDc(c)], fireball: ['dex', spellDc(c)], sleep: ['wis', spellDc(c)], breath: ['dex', speciesDc(c)],
    throw: ['dex', 8 + abilMod(c, 'dex') + 2], web: ['dex', 13],
  };
  if (saveOf[kind]) {
    const [abil, dc] = saveOf[kind];
    const item = kind === 'throw' ? ITEMS[c.items.find(i => i.uid === arg)?.id ?? ''] : undefined;
    if (kind === 'sleep' && m.noSleep) return { pct: 0, adv: 0, why: ['no puede dormir'], save: true };
    if (item?.thrown?.undeadOnly && m.ai !== 'undead') return { pct: 0, adv: 0, why: ['no es un no muerto'], save: true };
    const need = dc - (m.saves[abil] ?? 0);
    return { pct: Math.round(Math.max(0, Math.min(20, need - 1)) * 5), adv: 0, why: [`salvación de ${ABIL_NAME[abil]} CD ${dc}`], save: true };
  }
  if (kind === 'magic_missile' || kind === 'wand') return { pct: t.shield ? 0 : 100, adv: 0, why: ['impacta siempre'] };
  const spell = ['guiding_bolt', 'spiritual', 'fire_bolt', 'ray_frost', 'scorching', 'eldritch', 'infernal_bolt'].includes(kind);
  if (kind !== 'atk' && !spell) return undefined;
  const w = kind === 'atk' ? ITEMS[arg]?.weapon : undefined;
  if (kind === 'atk' && !w) return undefined;
  const ranged = spell || !!w!.ranged;
  const toHit = kind === 'infernal_bolt' ? infernalAttack(c) : spell ? spellAttack(c) : weaponStat(c, arg).toHit;
  const { up, down } = advFor(cb, u, t, ranged);
  const adv = up.length && down.length ? 0 : up.length ? 1 : down.length ? -1 : 0;
  const cover = coverOf(cb, u, t);
  const ac = t.ac + (t.shield ? 5 : 0) + cover;
  const champ = c.cls === 'fighter' && c.level >= 3 && !spell;
  const helpless = !ranged && (t.paralyzed || t.asleep);
  let hits = 0;
  for (let d = 2; d <= 20; d++) if (d === 20 || (champ && d === 19) || helpless || d + toHit >= ac) hits++;
  const one = hits / 20;
  const p = adv > 0 ? 1 - (1 - one) ** 2 : adv < 0 ? one ** 2 : one;
  const why = [
    ...(adv > 0 ? [`ventaja: ${up.join(', ')}`] : adv < 0 ? [`desventaja: ${down.join(', ')}`] : up.length ? ['ventaja y desventaja se anulan'] : []),
    ...(cover ? ['media cobertura: +2 CA'] : []),
  ];
  return { pct: Math.round(p * 100), adv, why };
}

/** Nivel de los espacios de pacto del brujo (todos iguales). */
const pactLevel = (c: Char) => slotsAt(c.cls, c.level).findIndex(n => n > 0) + 1;

function spendSlot(c: Char): boolean {
  if (c.slots[0] > 0) { c.slots[0]--; return true; }
  if (c.slots[1] > 0) { c.slots[1]--; return true; }
  if ((c.slots[2] ?? 0) > 0) { c.slots[2]--; return true; }
  return false;
}

/** Ataque adicional (nivel 5): un segundo golpe con la misma arma, al mismo objetivo o, si ha caído, a otro a su alcance. */
function extraAttack(g: Game, cb: Combat, u: Unit, c: Char, t: Unit, weapon: string) {
  if (c.level < 5 || !EXTRA_ATTACK.includes(c.cls) || cb.result) return;
  const w = ITEMS[weapon].weapon!;
  const t2 = conscious(t) ? t : validTargets(cb, u, w.ranged ? 'ranged' : 'melee')[0];
  if (!t2) return;
  const s = weaponStat(c, weapon);
  attack(g, cb, u, t2, { name: ITEMS[weapon].name, toHit: s.toHit, dice: w.dice, bonus: s.dmgBonus, type: w.type, ranged: !!w.ranged, sneak: !!(w.finesse || w.ranged), ...masteryOpts(c, weapon) });
}

const masteryOpts = (c: Char, weapon: string) => ({
  mastery: masteryOf(c, weapon), masteryDc: 8 + abilMod(c, weaponStat(c, weapon).abil) + prof(c.level), abilDmg: abilMod(c, weaponStat(c, weapon).abil),
  offhand: LIGHT.includes(weapon) || MASTERY[weapon] === 'nick' ? c.items.find(i => i.id !== weapon && LIGHT.includes(i.id) && !ITEMS[i.id].weapon?.ranged)?.id : undefined,
});

/** Ejecuta un paso de combate y pega a la última tirada los dados de daño o curación que se hayan tirado. */
export function withDice(cb: Combat, run: () => void) {
  tray.length = 0;
  cb.popStep = (cb.popStep ?? 0) + 1;
  const id = cb.roll?.id, enemy = current(cb).side === 'enemy';
  run();
  if (!tray.length) return;
  const dice = tray.slice(0, 8);
  if (cb.roll && cb.roll.id !== id) cb.roll.dice = dice;
  else setRoll(cb, { d20: 0, total: dice.reduce((s, d) => s + d.v, 0), label: '', ok: true, enemy, dice });
}

export function perform(g: Game, cb: Combat, a: Action, targetKey?: string) {
  const u = current(cb);
  const c = charOf(g, u);
  const t = cb.units.find(x => x.key === targetKey);
  const wis = abilMod(c, 'wis');
  const dst = t ?? u;
  const potion = a.id.startsWith('potion:') ? ITEMS[c.items.find(i => i.uid === a.id.slice(7))!.id] : undefined;
  if ((potion?.heal || a.id === 'lay') && dst.hp >= dst.maxHp) { say(cb, `${dst.name} tiene la vida llena: no hace falta curarle.`, 'info'); return; }
  cb.reroll = undefined;
  if (a.cost === 'action') cb.acted = true;
  if (a.cost === 'bonus') cb.bonus = true;
  if (a.cost === 'move') cb.moved = true;
  let [kind, arg] = a.id.split(':');
  // Pergamino de conjuro: se gasta y el conjuro sale sin gastar espacio (se presta uno para el cálculo de siempre).
  const scroll = kind === 'scroll' ? ITEMS[c.items.find(i => i.uid === arg)?.id ?? ''] : undefined;
  if (scroll?.spell) {
    c.items = c.items.filter(i => i.uid !== arg);
    c.slots[0]++;
    say(cb, `${u.name} lee ${scroll.name}.`, 'info');
    kind = scroll.spell;
  }
  switch (kind) {
    case 'atk': {
      const w = ITEMS[arg].weapon!;
      const s = weaponStat(c, arg);
      attack(g, cb, u, t!, { name: ITEMS[arg].name, toHit: s.toHit, dice: w.dice, bonus: s.dmgBonus, type: w.type, ranged: !!w.ranged, sneak: !!(w.finesse || w.ranged), ...masteryOpts(c, arg) });
      extraAttack(g, cb, u, c, t!, arg);
      break;
    }
    case 'haste': {
      const w = ITEMS[arg].weapon!;
      const s = weaponStat(c, arg);
      cb.hasteUsed = true;
      attack(g, cb, u, t!, { name: ITEMS[arg].name, toHit: s.toHit, dice: w.dice, bonus: s.dmgBonus, type: w.type, ranged: !!w.ranged, sneak: !!(w.finesse || w.ranged), ...masteryOpts(c, arg) });
      break;
    }
    case 'dust': {
      c.items = c.items.filter(i => i.uid !== arg);
      for (const x of cb.units.filter(x => x.side === 'party' && alive(x))) x.invisible = true;
      say(cb, `${u.name} esparce el polvo de desaparición: el grupo se vuelve invisible.`, 'big');
      break;
    }
    case 'sacred_flame':
      if (!saveRoll(g, cb, t!, 'dex', spellDc(c), 'Destreza')) applyDamage(g, cb, t!, roll(g.rng, c.level >= 5 ? '2d8' : '1d8'), 'radiante', u);
      break;
    case 'cure': spendSlot(c); heal(cb, t!, roll(g.rng, '2d8') + abilMod(c, CLASSES[c.cls].spell ?? 'wis')); break;
    case 'mark_move':
      if (u.concentration === 'mark' && !u.mark) { u.mark = t!.key; say(cb, `${u.name} traslada Marca del cazador a ${t!.name}.`, 'info'); }
      break;
    case 'mark':
      if (c.channel > 0) c.channel--; else spendSlot(c);
      endConcentration(cb, u);
      u.mark = t!.key;
      u.concentration = 'mark';
      say(cb, `${u.name} marca a ${t!.name} como su presa.`, 'info');
      break;
    case 'lay': {
      const h = Math.min(c.channel, dst.maxHp - Math.max(0, dst.hp));
      c.channel -= h;
      heal(cb, dst, h);
      break;
    }
    case 'smite': {
      const hit = cb.smiteHit;
      const victim = cb.units.find(x => x.key === hit?.target);
      if (!hit || hit.attacker !== u.key || !victim || !alive(victim)) break;
      spendSlot(c);
      const undead = MONSTERS[victim.mon!]?.ai === 'undead' || /fiend|devil|demon/i.test(victim.mon ?? '');
      const bonus = roll(g.rng, undead ? '3d8' : '2d8', hit.crit);
      say(cb, `Castigo divino: ${bonus} de daño radiante.`, 'big');
      applyDamage(g, cb, victim, bonus, 'radiante', u, hit.crit);
      cb.smiteHit = undefined;
      break;
    }
    case 'throw': {
      const it = c.items.find(i => i.uid === arg)!;
      const d = ITEMS[it.id].thrown!;
      c.items = c.items.filter(i => i.uid !== arg);
      swing(cb, u, t!, 'arrow', d.type ?? 'contundente');
      say(cb, `${u.name} lanza ${ITEMS[it.id].name} a ${t!.name}.`, 'info');
      if (d.undeadOnly && MONSTERS[t!.mon!]?.ai !== 'undead') { say(cb, `No le hace nada: ${t!.name} no es un no muerto.`, 'miss'); break; }
      if (saveRoll(g, cb, t!, 'dex', 8 + abilMod(c, 'dex') + 2, 'Destreza')) break;
      if (d.restrain) { t!.restrained = 10; say(cb, `${t!.name} queda apresado en la red.`, 'big'); }
      if (d.oil) { t!.oiled = true; say(cb, `${t!.name} queda empapado de aceite: el fuego le hará 5 más.`, 'info'); }
      if (d.dice) applyDamage(g, cb, t!, roll(g.rng, d.dice), d.type!, u);
      if (d.burn && alive(t!)) { t!.burn = 2; say(cb, `${t!.name} arde.`, 'info'); }
      break;
    }
    case 'web': {
      const it = c.items.find(i => i.uid === arg)!;
      it.charges = (it.charges ?? 1) - 1;
      say(cb, `${u.name} lanza Telaraña sobre la fila ${t!.row === 'front' ? 'delantera' : 'trasera'}.`, 'info');
      for (const e of cb.units.filter(x => x.side === 'enemy' && conscious(x) && x.row === t!.row))
        if (!saveRoll(g, cb, e, 'dex', 13, 'Destreza')) { e.restrained = 13; say(cb, `${e.name} queda apresado en la telaraña.`, 'info'); }
      break;
    }
    case 'healing_word': spendSlot(c); heal(cb, t!, roll(g.rng, '2d4') + wis); break;
    case 'spark': c.channel--; heal(cb, t!, roll(g.rng, '1d8') + wis); break;
    case 'bless':
      spendSlot(c);
      endConcentration(cb, u);
      u.concentration = 'bless';
      cb.units.filter(x => x.side === 'party' && alive(x)).slice(0, 3).forEach(x => (x.bless = true));
      say(cb, `${u.name} bendice al grupo (+1d4 a ataques y salvaciones).`, 'info');
      break;
    case 'guiding_bolt':
      spendSlot(c);
      if (attack(g, cb, u, t!, { name: 'Saeta guía', toHit: spellAttack(c), dice: '4d6', bonus: 0, type: 'radiante', ranged: true, spell: true }) && alive(t!)) t!.guided = true;
      break;
    case 'spiritual':
      if (!u.spiritual) { c.slots[1]--; endConcentration(cb, u); u.spiritual = true; u.concentration = 'spiritual'; u.spiritualUntil = cb.round + 10; }
      attack(g, cb, u, t!, { name: 'Arma espiritual', toHit: spellAttack(c), dice: '1d8', bonus: wis, type: 'fuerza', ranged: true, spell: true });
      break;
    case 'fire_bolt': attack(g, cb, u, t!, { name: 'Descarga de fuego', toHit: spellAttack(c), dice: c.level >= 5 ? '2d10' : '1d10', bonus: 0, type: 'fuego', ranged: true, spell: true }); break;
    case 'ray_frost': attack(g, cb, u, t!, { name: 'Rayo de escarcha', toHit: spellAttack(c), dice: c.level >= 5 ? '2d8' : '1d8', bonus: 0, type: 'frío', ranged: true, spell: true }); break;
    case 'eldritch': {
      // Descarga sobrenatural: un rayo (dos desde nivel 5); Descarga agónica suma el Carisma desde nivel 2.
      const bonus = c.level >= 2 ? abilMod(c, 'cha') : 0;
      let tt: Unit | undefined = t;
      for (let i = 0; i < (c.level >= 5 ? 2 : 1) && tt; i++) {
        attack(g, cb, u, tt, { name: 'Descarga sobrenatural', toHit: spellAttack(c), dice: '1d10', bonus, type: 'fuerza', ranged: true, spell: true });
        if (!conscious(tt)) tt = validTargets(cb, u, 'ranged')[0];
      }
      break;
    }
    case 'hex_move':
      if (u.concentration === 'hex' && !u.hex) { u.hex = t!.key; say(cb, `${u.name} traslada Maleficio a ${t!.name}.`, 'info'); }
      break;
    case 'hex':
      spendSlot(c);
      endConcentration(cb, u);
      u.hex = t!.key;
      u.concentration = 'hex';
      say(cb, `${u.name} lanza Maleficio sobre ${t!.name}.`, 'info');
      break;
    case 'breath': {
      c.racial = (c.racial ?? 1) - 1;
      const type = draconic(c).type;
      say(cb, `${u.name} exhala su aliento de dragón ${draconic(c).dragon} sobre la fila ${t!.row === 'front' ? 'delantera' : 'trasera'}.`, 'big');
      const dmg = roll(g.rng, c.level >= 5 ? '2d10' : '1d10');
      for (const e of cb.units.filter(x => x.side === 'enemy' && conscious(x) && x.row === t!.row))
        applyDamage(g, cb, e, saveRoll(g, cb, e, 'dex', speciesDc(c), 'Destreza') ? Math.floor(dmg / 2) : dmg, type, u);
      break;
    }
    case 'infernal_bolt': attack(g, cb, u, t!, { name: 'Descarga de fuego', toHit: infernalAttack(c), dice: c.level >= 5 ? '2d10' : '1d10', bonus: 0, type: 'fuego', ranged: true, spell: true }); break;
    case 'fireball': {
      if (c.cls === 'warlock') spendSlot(c); else c.slots[2]--;
      const dc = spellDc(c);
      say(cb, `${u.name} lanza Bola de fuego sobre la fila ${t!.row === 'front' ? 'delantera' : 'trasera'}.`, 'big');
      const dmg = roll(g.rng, '8d6');
      for (const e of cb.units.filter(x => x.side === 'enemy' && conscious(x) && x.row === t!.row))
        applyDamage(g, cb, e, saveRoll(g, cb, e, 'dex', dc, 'Destreza') ? Math.floor(dmg / 2) : dmg, 'fuego', u);
      break;
    }
    case 'mass_heal':
      c.slots[2]--;
      say(cb, `${u.name} lanza Palabra de curación en masa.`, 'info');
      for (const x of hurt(cb)) heal(cb, x, roll(g.rng, '2d4') + wis);
      break;
    case 'adrenaline':
      c.racial = (c.racial ?? 1) - 1;
      u.temp = Math.max(u.temp ?? 0, prof(c.level));
      say(cb, `${u.name} usa Descarga de adrenalina: ${prof(c.level)} PG temporales.`, 'big');
      break;
    case 'rage':
      c.channel--;
      u.rage = true;
      say(cb, `${u.name} entra en Furia: +2 al daño cuerpo a cuerpo y resiste el daño físico.`, 'big');
      break;
    case 'magic_missile': spendSlot(c); missiles(g, cb, u, t!); break;
    case 'wand': {
      const it = c.items.find(i => i.uid === arg)!;
      it.charges = (it.charges ?? 1) - 1;
      missiles(g, cb, u, t!);
      break;
    }
    case 'scroll':
      c.items = c.items.filter(i => i.uid !== arg);
      u.ac += 5;
      say(cb, `${u.name} lee el pergamino: +5 CA durante el combate.`, 'info');
      break;
    case 'burning_hands': {
      spendSlot(c);
      const dc = spellDc(c);
      say(cb, `${u.name} lanza Manos ardientes.`, 'info');
      // El brujo la lanza con su espacio de pacto: +1d6 por cada nivel por encima de 1.
      const dmg = roll(g.rng, c.cls === 'warlock' ? `${pactLevel(c) + 2}d6` : '3d6');
      for (const e of cb.units.filter(x => x.side === 'enemy' && conscious(x) && x.row === 'front'))
        applyDamage(g, cb, e, saveRoll(g, cb, e, 'dex', dc, 'Destreza') ? Math.floor(dmg / 2) : dmg, 'fuego', u);
      break;
    }
    case 'sleep': {
      spendSlot(c);
      const dc = spellDc(c);
      say(cb, `${u.name} lanza Dormir sobre la fila ${t!.row === 'front' ? 'delantera' : 'trasera'}.`, 'info');
      for (const e of cb.units.filter(x => x.side === 'enemy' && conscious(x) && x.row === t!.row)) {
        if (MONSTERS[e.mon!].noSleep) { say(cb, `${e.name} no puede dormir.`, 'miss'); continue; }
        if (!saveRoll(g, cb, e, 'wis', dc, 'Sabiduría')) { e.asleep = true; say(cb, `${e.name} se duerme.`, 'info'); }
      }
      break;
    }
    case 'scorching':
      // El brujo con espacio de nivel 3 lanza un rayo más.
      if (c.cls === 'warlock') spendSlot(c); else c.slots[1]--;
      for (let i = 0; i < (c.cls === 'warlock' ? pactLevel(c) + 1 : 3) && alive(t!) && t!.hp > 0; i++) attack(g, cb, u, t!, { name: 'Rayo abrasador', toHit: spellAttack(c), dice: '2d6', bonus: 0, type: 'fuego', ranged: true, spell: true });
      break;
    case 'second_wind': c.secondWind--; heal(cb, u, roll(g.rng, '1d10') + c.level); break;
    case 'reckless': u.reckless = true; say(cb, `${u.name} ataca temerariamente: ventaja en sus golpes, pero se expone.`, 'info'); break;
    case 'steady': u.steady = true; cb.moved = true; say(cb, `${u.name} apunta con calma: su próximo ataque tendrá ventaja.`, 'info'); break;
    case 'trip': u.trip = true; say(cb, `${u.name} prepara un golpe astuto para derribar.`, 'info'); break;
    case 'turn_undead': {
      c.channel--;
      say(cb, `${u.name} alza el símbolo sagrado: ¡Expulsar muertos vivientes!`, 'big');
      for (const x of cb.units.filter(y => y.side === 'enemy' && conscious(y) && y.mon && MONSTERS[y.mon].ai === 'undead' && !isBoss(y))) {
        if (!saveRoll(g, cb, x, 'wis', spellDc(c), 'Sabiduría')) { x.turned = true; x.plan = undefined; say(cb, `${x.name} queda expulsado: huirá hasta que le hagan daño.`, 'info'); }
      }
      break;
    }
    case 'surge': c.actionSurge--; cb.acted = false; say(cb, `${u.name} usa Oleada de acción.`, 'info'); break;
    case 'hide': {
      // SRD 5.2.1: Sigilo (DES + pericia del pícaro) CD 15; el resultado es lo que tendrá que igualar la Percepción de quien le busque.
      const d20 = elvenBoots(c) ? Math.max(die(g.rng, 20), die(g.rng, 20)) : die(g.rng, 20), total = d20 + abilMod(c, 'dex') + prof(c.level) * 2, ok = total >= 15;
      setRoll(cb, { d20, total, label: `Sigilo de ${u.name} · CD 15`, ok });
      if (ok) { u.hidden = total; say(cb, `${u.name} se esconde (Sigilo ${total}): ventaja en su próximo ataque.`, 'info'); }
      else say(cb, `${u.name} intenta esconderse, pero no lo consigue (Sigilo ${total} contra CD 15).`, 'info');
      break;
    }
    case 'potion': {
      const it = c.items.find(i => i.uid === arg)!;
      const d = ITEMS[it.id];
      // El ungüento tiene varias dosis; las pociones se gastan enteras.
      it.charges = (it.charges ?? 1) - 1;
      if (it.charges <= 0) c.items = c.items.filter(i => i.uid !== arg);
      if (dst !== u) say(cb, `${u.name} le da ${d.name} a ${dst.name}.`, 'info');
      if (d.heal) heal(cb, dst, roll(g.rng, d.heal));
      if (d.resistPoison) { dst.resPoison = true; say(cb, `${dst.name} resiste el veneno durante el combate.`, 'info'); }
      if (d.resistCold) { dst.resCold = true; say(cb, `${dst.name} resiste el frío durante el combate.`, 'info'); }
      if (d.curePoison) { dst.poisoned = false; say(cb, `${dst.name} ya no está envenenado.`, 'heal'); }
      if (d.resist) { dst.res = [...(dst.res ?? []), d.resist]; say(cb, `${dst.name} resiste el daño de ${d.resist} durante el combate.`, 'info'); }
      if (d.effect === 'growth') { dst.grow = true; say(cb, `${dst.name} se agranda: sus armas hacen 1d4 de daño más.`, 'info'); }
      if (d.effect === 'giant') {
        const dc = charOf(g, dst);
        if (score(dc, 'str') >= 21) say(cb, `La poción no hace nada: ${dst.name} ya es igual de fuerte.`, 'info');
        else { dc.giantStr = 21; say(cb, `${dst.name} tiene la fuerza de un gigante de las colinas: Fuerza 21 durante el combate.`, 'info'); }
      }
      if (d.effect === 'heroism') { dst.temp = Math.max(dst.temp ?? 0, 10); dst.heroism = true; say(cb, `${dst.name} se siente heroico: 10 PG temporales y +1d4 a ataques y salvaciones.`, 'info'); }
      if (d.effect === 'haste' && !dst.haste) { dst.haste = true; dst.ac += 2; say(cb, `${dst.name} se acelera: +2 CA y un ataque más en cada turno.`, 'big'); }
      if (d.effect === 'elixir') { dst.poisoned = false; dst.paralyzed = false; say(cb, `${dst.name} ya no está envenenado ni paralizado.`, 'heal'); }
      if (d.effect === 'poison') { dst.poisonBlade = true; say(cb, `${dst.name} unta su arma con veneno.`, 'info'); }
      break;
    }
    case 'dodge': u.dodge = true; say(cb, `${u.name} se pone a la defensiva.`, 'info'); break;
    case 'disengage': u.disengaged = true; say(cb, `${u.name} se destraba: puede retirarse sin que le golpeen.`, 'info'); break;
    case 'rescue':
      cb.moved = true;
      t!.row = 'back';
      say(cb, `${u.name} arrastra a ${t!.name} hasta la retaguardia.`, 'big');
      break;
    case 'watch': u.watch = t!.key; say(cb, `${u.name} vigila a ${t!.name}: disparará a quien le ataque.`, 'info'); break;
    case 'grapple': {
      const m = MONSTERS[t!.mon!];
      const abil: Ability = (m.saves.str ?? 0) >= (m.saves.dex ?? 0) ? 'str' : 'dex';
      if (saveRoll(g, cb, t!, abil, grappleDc(c), abil === 'str' ? 'Fuerza' : 'Destreza')) say(cb, `${t!.name} se zafa de ${u.name}.`, 'miss');
      else { t!.grappled = u.key; t!.plan = undefined; say(cb, `${u.name} agarra a ${t!.name}: no podrá cambiar de fila ni huir.`, 'big'); }
      break;
    }
    case 'help': t!.helped = u.key; say(cb, `${u.name} distrae a ${t!.name}: el próximo ataque de un aliado contra él tendrá ventaja.`, 'info'); break;
    case 'flank':
      if (u.flank) { u.flank = false; say(cb, `${u.name} vuelve a la vanguardia.`, 'info'); break; }
      // Ir al flanco es salir del alcance de los enemigos de delante: ataque de oportunidad, salvo Destrabarse.
      if (!u.disengaged) {
        const foe = oppFoe(cb, u);
        if (foe) opportunity(g, cb, foe, u);
        if (!conscious(u) || checkEnd(g, cb)) break;
      }
      for (const x of cb.units) if (x.grappled === u.key) { x.grappled = undefined; say(cb, `${u.name} suelta a ${x.name}.`, 'info'); }
      if (slip(g, cb, u)) break;
      u.flank = true;
      say(cb, `${u.name} corre al flanco, junto a ${livePiece(cb)?.name ?? 'la pieza'}.`, 'info');
      break;
    case 'row':
      // Salir de la vanguardia con un enemigo cuerpo a cuerpo delante provoca un ataque de oportunidad (salvo Destrabarse).
      if (u.row === 'front' && !u.disengaged) {
        const foe = oppFoe(cb, u);
        if (foe) opportunity(g, cb, foe, u);
        if (!conscious(u) || checkEnd(g, cb)) break;
      }
      for (const x of cb.units) if (x.grappled === u.key) { x.grappled = undefined; say(cb, `${u.name} suelta a ${x.name}.`, 'info'); }
      if (slip(g, cb, u)) break;
      u.row = u.row === 'front' ? 'back' : 'front';
      say(cb, `${u.name} pasa a la fila ${u.row === 'front' ? 'delantera' : 'trasera'}.`, 'info');
      if (u.hidden && u.row === 'front') { u.hidden = undefined; say(cb, `${u.name} sale de su escondite.`, 'info'); }
      // Con las filas cambiadas, los enemigos vuelven a mirar quién queda delante y quién detrás (el autor 2026-11-10).
      {
        const before = new Map(cb.units.filter(e => e.side === 'enemy' && e.plan).map(e => [e.key, e.plan!.targets.join()]));
        for (const e of cb.units) if (e.side === 'enemy') e.plan = undefined;
        planAll(g, cb);
        // Se cuenta quién cambia de objetivo: así se ve que moverse ha servido.
        for (const e of cb.units.filter(x => x.side === 'enemy' && x.plan && before.has(x.key) && before.get(x.key) !== x.plan.targets.join())) {
          const names = [...new Set(e.plan!.targets)].map(k => cb.units.find(x => x.key === k)?.name).filter(Boolean);
          if (names.length) say(cb, `${e.name} cambia de objetivo: ahora va a por ${names.join(' y ')}.`, 'big');
        }
      }
      break;
    case 'flee':
      finish(g, cb, 'fled');
      return;
  }
  // Polvo de desaparición: lanzar un conjuro o hacer daño también acaba con la invisibilidad.
  if (u.invisible && !KEEP_INVISIBLE.includes(kind)) u.invisible = undefined;
  if (!checkEnd(g, cb)) planAll(g, cb);
}

function missiles(g: Game, cb: Combat, u: Unit, t: Unit) {
  swing(cb, u, t, 'magic', 'fuerza');
  if (t.shield || (t.shieldSlots ?? 0) > 0) {
    if (!t.shield) { t.shieldSlots!--; t.shield = true; say(cb, `${t.name} lanza Escudo y anula los proyectiles.`, 'info'); }
    else say(cb, 'El escudo de fuerza anula los proyectiles.', 'miss');
    return;
  }
  let dmg = 0;
  for (let i = 0; i < 3; i++) dmg += roll(g.rng, '1d4+1');
  say(cb, `${u.name} dispara tres proyectiles mágicos.`, 'info');
  applyDamage(g, cb, t, dmg, 'fuerza', u);
}

// ---------- Turno enemigo ----------

export function enemyTurn(g: Game, cb: Combat) {
  const u = current(cb);
  if (u.side === 'party') {
    // Personaje caído o paralizado: su turno pasa solo.
    if (u.paralyzed && conscious(u)) say(cb, `${u.name} está paralizado.`, 'info');
    endTurn(g, cb);
    return;
  }
  if (!conscious(u)) { endTurn(g, cb); return; }
  if (u.asleep) { say(cb, `${u.name} duerme.`, 'info'); endTurn(g, cb); return; }
  if (u.turned) {
    if (u.row === 'front' && rowSpace(cb, 'enemy', 'back')) { u.row = 'back'; say(cb, `${u.name} huye de la luz sagrada a la retaguardia.`, 'info'); }
    else say(cb, `${u.name} se encoge ante el símbolo sagrado.`, 'info');
    endTurn(g, cb);
    return;
  }
  if (u.burn) {
    u.burn--;
    say(cb, `${u.name} sigue ardiendo.`, 'info');
    applyDamage(g, cb, u, roll(g.rng, '1d4'), 'fuego', u);
    if (checkEnd(g, cb)) return;
    if (!conscious(u)) { endTurn(g, cb); return; }
  }
  if (u.restrained) {
    if (saveRoll(g, cb, u, 'str', u.restrained, 'Fuerza')) { u.restrained = undefined; say(cb, `${u.name} se libera.`, 'info'); }
    else say(cb, `${u.name} forcejea, pero sigue apresado.`, 'info');
    endTurn(g, cb);
    return;
  }
  if (runnerTurn(g, cb, u)) {
    if (checkEnd(g, cb)) return;
    endTurn(g, cb);
    return;
  }
  if (u.prone) { u.prone = false; say(cb, `${u.name} se levanta del suelo.`, 'info'); }
  // Agarre: se acaba si quien agarra cae o ya no está delante.
  if (u.grappled && !cb.units.some(x => x.key === u.grappled && conscious(x) && x.row === 'front')) u.grappled = undefined;
  const m = MONSTERS[u.mon!];
  if (u.mon === 'Shrieker') { shriek(g, cb, u); if (!checkEnd(g, cb)) endTurn(g, cb); return; }
  // Goblins malheridos huyen; sin su jefe, antes (a la mitad de sus PG).
  const leaderless = leaderDown(cb, u);
  if (m.ai === 'goblin' && !u.grappled && u.hp < u.maxHp * (leaderless ? 0.5 : 0.25) && rand(g.rng) < 0.5) {
    // Huir desde la vanguardia también provoca un ataque de oportunidad.
    const opp = u.row === 'front' ? oppFoe(cb, u) : undefined;
    if (opp) { opportunity(g, cb, opp, u); if (checkEnd(g, cb)) return; if (!conscious(u)) { endTurn(g, cb); return; } }
    u.fled = true;
    u.plan = undefined;
    moraleHit(cb, `${u.name} huye`);
    say(cb, leaderless ? `${u.name} huye: sin su jefe, no piensa morir aquí.` : `${u.name} huye despavorido.`, 'info');
    if (goalOpen(cb, 'noflee')) goalDone(cb, false);
    if (checkEnd(g, cb)) return;
    endTurn(g, cb);
    return;
  }
  // Los jefes recargan al acabar su turno, para anunciar el golpe antes (ver bossWarn).
  if (!isBoss(u)) for (const a of m.attacks) if (a.save?.recharge && u.recharge![a.name] === false && die(g.rng, 6) >= a.save.recharge) u.recharge![a.name] = true;
  // Vharzûl a mitad de PG: alza el vuelo un asalto; al bajar, el aliento está listo.
  if (u.mon === DRAGON && u.flying) {
    u.flying = false;
    u.img = MONSTERS[DRAGON].img;
    u.breathNow = true;
    say(cb, `${u.name} desciende en picado.`, 'big');
  } else if (u.mon === DRAGON && u.half && !u.flown) {
    u.flying = u.flown = true;
    u.img = 'dragon_blanco_vuelo';
    u.plan = undefined;
    say(cb, `${u.name} alza el vuelo: cuerpo a cuerpo no le alcanzáis.`, 'big');
    endTurn(g, cb);
    return;
  }
  // Lo que había anunciado (si sigue valiendo) o una decisión nueva.
  let p = u.plan && planOk(cb, u, u.plan) ? u.plan : decide(g, cb, u);
  u.plan = undefined;
  if (!p && u.mon === DRAGON) say(cb, `${u.name} observa desde atrás, tras sus siervos.`, 'info');
  // Cuerpo a cuerpo detrás con la fila delantera llena: espera su hueco (y se dice, para que no parezca que no hace nada).
  else if (!p && u.row === 'back' && m.attacks.some(a => !a.ranged && !a.save)) say(cb, `${u.name} espera detrás a que se abra un hueco.`, 'info');
  if (!p) { endTurn(g, cb); return; }
  if (u.slowed) {
    u.slowed = undefined;
    if (p.move && p.move !== u.row) {
      say(cb, `${u.name} va ralentizado: no cambia de fila.`, 'info');
      if (p.kind === 'melee' && u.row === 'back') { endTurn(g, cb); return; }
      p = { ...p, move: undefined, swap: undefined };
    }
  }
  // Agarrado: para cambiar de fila primero tiene que soltarse, y eso le cuesta el turno.
  if (p.move && p.move !== u.row && u.grappled) {
    const by = cb.units.find(x => x.key === u.grappled);
    const dc = by?.side === 'party' ? grappleDc(charOf(g, by)) : 10;
    const abil: Ability = (m.saves.str ?? 0) >= (m.saves.dex ?? 0) ? 'str' : 'dex';
    if (saveRoll(g, cb, u, abil, dc, abil === 'str' ? 'Fuerza' : 'Destreza')) { u.grappled = undefined; say(cb, `${u.name} se suelta.`, 'info'); }
    else say(cb, `${u.name} forcejea, pero sigue agarrado.`, 'info');
    endTurn(g, cb);
    return;
  }
  // Retirarse de la vanguardia con un personaje cuerpo a cuerpo delante provoca un ataque de oportunidad.
  if (p.move === 'back' && u.row === 'front') {
    const opp = oppFoe(cb, u);
    if (opp) { opportunity(g, cb, opp, u); if (checkEnd(g, cb)) return; if (!conscious(u)) { endTurn(g, cb); return; } }
  }
  if (p.move && p.move !== u.row && slip(g, cb, u)) { endTurn(g, cb); return; }
  if (p.move && p.move !== u.row) {
    const mate = p.swap ? cb.units.find(x => x.key === p.swap && conscious(x) && x.row === p.move && !x.grappled) : undefined;
    if (mate && !rowSpace(cb, 'enemy', p.move)) {
      mate.row = u.row;
      mate.plan = undefined;
      say(cb, `${mate.name} retrocede y deja su sitio a ${u.name}.`, 'info');
    }
    u.row = p.move;
    say(cb, p.move === 'back' ? `${u.name} retrocede a la retaguardia.` : `${u.name} avanza a la fila delantera.`, 'info');
  }
  if (p.kind === 'area') {
    const area = m.attacks.find(a => a.save)!;
    // Conjuros de X/día: se agota al gastar los usos; si no, espera la recarga.
    u.spent = (u.spent ?? 0) + 1;
    if (!area.save!.uses || u.spent >= area.save!.uses) u.recharge![area.name] = false;
    say(cb, `${u.name} usa ${area.name}.`, 'big');
    u.warn = u.aim = undefined;
    if (u.mon === DRAGON) u.breathNow = false;
    if (u.mon === 'Xiximanter') u.cool = true;
    let dmg = roll(g.rng, area.dice);
    if (u.mon === DRAGON && u.weakBreath) { u.weakBreath = false; dmg = Math.floor(dmg / 2); say(cb, 'El aire templado de las válvulas debilita el aliento: hace la mitad de daño.', 'info'); }
    const hit = u.mon === DRAGON ? cb.units.filter(x => p.targets.includes(x.key) && conscious(x)) : cb.units.filter(x => x.side === 'party' && conscious(x) && x.row === 'front');
    if (!hit.length) say(cb, 'El golpe no alcanza a nadie: os habíais apartado a tiempo.', 'info');
    if (area.petrify) {
      for (const t of hit.filter(x => !x.stoning)) {
        let ok = saveRoll(g, cb, t, 'con', area.save!.dc, 'Constitución');
        // Espejo de acero: se le mira por el reflejo y la salvación se repite.
        if (!ok && t.side === 'party' && charOf(g, t).items.some(i => i.id === 'steel_mirror')) {
          say(cb, `${t.name} aparta la vista y mira al basilisco en el espejo de acero.`, 'info');
          ok = saveRoll(g, cb, t, 'con', area.save!.dc, 'Constitución');
        }
        if (!ok) { t.stoning = true; say(cb, `${t.name} empieza a volverse de piedra: queda apresado.`, 'big'); }
      }
      endTurn(g, cb);
      return;
    }
    for (const t of hit) {
      const ok = saveRoll(g, cb, t, area.save!.abil, area.save!.dc, area.save!.abil === 'con' ? 'Constitución' : 'Destreza');
      applyDamage(g, cb, t, ok ? Math.floor(dmg / 2) : dmg, area.type, u);
    }
    endTurn(g, cb);
    return;
  }
  if (p.kind === 'magic') {
    // Orvane: rayos abrasadores mientras le queden, luego descarga arcana.
    let t = cb.units.find(x => x.key === p.targets[0]);
    if (t?.hidden && !spot(g, cb, u, t)) t = chooseTarget(g, cb, u, cb.units.filter(x => x.side === 'party' && conscious(x) && !x.hidden), true);
    if (t) {
      if ((u.rays ?? 0) > 0) {
        u.rays!--;
        for (let i = 0; i < 3 && t.hp > 0 && !t.dead; i++) attack(g, cb, u, t, toOpts(m.attacks[0]));
      } else for (let i = 0; i < (m.multi ?? 1) && t.hp > 0 && !t.dead; i++) attack(g, cb, u, t, toOpts(m.attacks[2]));
    }
    endTurn(g, cb);
    return;
  }
  const ranged = p.kind === 'ranged';
  const atks = m.reach ? [m.attacks[0]] : m.attacks.filter(a => (ranged ? a.ranged : !a.ranged && !a.save));
  if (!atks.length) { endTurn(g, cb); return; }
  let told = false;
  const lost: string[] = [];
  // El Corazón Hueco había tensado las raíces bajo la retaguardia: esta vez llegan allí.
  const roots = u.mon === 'Treant' && u.warn ? cb.units.filter(x => x.side === 'party' && conscious(x) && x.row === 'back') : [];
  if (u.mon === 'Treant') u.warn = u.aim = undefined;
  for (let i = 0; i < p.targets.length; i++) {
    const pool = roots.length ? roots : reach(cb, u, ranged);
    let t = cb.units.find(x => x.key === p.targets[i] && pool.includes(x) && conscious(x));
    if (!t) t = chooseTarget(g, cb, u, pool.filter(x => !lost.includes(x.key)), ranged);
    // Jefe: a veces remata a un caído a su alcance (cuerpo a cuerpo contra un caído es crítico: dos fallos; el autor 2026-11-25).
    const down = !ranged && i === 0 && pool.length && bossUnit(g, cb, u)
      ? cb.units.find(x => x.side === 'party' && alive(x) && x.hp <= 0 && (x.row === 'front' || !frontHeld(cb, 'party'))) : undefined;
    if (down && rand(g.rng) < 1 / 3) { t = down; say(cb, `${u.name} se vuelve hacia ${down.name}, que está en el suelo.`, 'big'); }
    if (!t) break;
    // Quien está escondido solo recibe el golpe si el enemigo le encuentra; si no, busca otro objetivo.
    if (t.hidden && !spot(g, cb, u, t)) {
      lost.push(t.key);
      t = chooseTarget(g, cb, u, pool.filter(x => !lost.includes(x.key) && !x.hidden), ranged);
      if (!t) continue;
    }
    // Cuerpo a cuerpo contra la retaguardia: se explica por qué llega.
    if (!ranged && !told && t.row === 'back' && !frontHeld(cb, 'party')) {
      told = true;
      say(cb, `No queda nadie delante: ${u.name} llega hasta ${t.name}.`, 'info');
    }
    const a = atks[i % atks.length];
    watchShot(g, cb, u, t);
    if (checkEnd(g, cb)) return;
    if (!conscious(u)) break;
    // Maltrecho (la mitad de sus PG o menos): algunos monstruos hacen menos daño (SRD 5.2.1).
    const hit = attack(g, cb, u, t, toOpts(a.bloodied && u.hp <= u.maxHp / 2 ? { ...a, dice: a.bloodied } : a));
    if (hit && a.curse && t.side === 'party' && !t.dead && !t.cursed) {
      t.cursed = true;
      say(cb, `${t.name} queda maldito por la momia: no podrá recuperar PG hasta que el templo le quite la maldición.`, 'big');
    }
    if (hit && u.mon === 'Treant' && u.half && conscious(t) && !t.restrained) {
      t.restrained = 13;
      say(cb, `Las raíces apresan a ${t.name} (Fuerza CD 13 para soltarse).`, 'big');
    }
    if (hit && a.paralyze && conscious(t) && !t.paralyzed && !saveRoll(g, cb, t, 'con', a.paralyze.dc, 'Constitución')) {
      // Basilisco: con el espejo de acero se le mira por el reflejo y la salvación se repite.
      const mirror = u.mon === 'Basilisk' && t.side === 'party' && charOf(g, t).items.some(i => i.id === 'steel_mirror');
      if (mirror) say(cb, `${t.name} aparta la vista y mira al basilisco en el espejo de acero.`, 'info');
      if (!mirror || !saveRoll(g, cb, t, 'con', a.paralyze.dc, 'Constitución')) {
        t.paralyzed = true;
        say(cb, u.mon === 'Basilisk' ? `${t.name} empieza a volverse de piedra y queda paralizado.` : `${t.name} queda paralizado.`, 'big');
      }
    }
    if (checkEnd(g, cb)) return;
  }
  endTurn(g, cb);
}

/** Lo que va a hacer un enemigo en su turno: se anuncia sobre su carta. */
export interface Plan { kind: 'melee' | 'ranged' | 'area' | 'magic'; targets: string[]; move?: Row; guard?: boolean;
  /** Compañero de delante con arma a distancia que le cede el sitio. */
  swap?: string }

/** A quién alcanza un enemigo (cuerpo a cuerpo o a distancia), en la fila en que está. */
function reach(cb: Combat, u: Unit, ranged: boolean, row: Row = u.row): Unit[] {
  const m = MONSTERS[u.mon!];
  const up = cb.units.filter(x => x.side === 'party' && conscious(x));
  if (m.reach) { const front = up.filter(x => x.row === 'front'); return front.length ? front : up; }
  if (ranged) return up;
  if (row !== 'front') return [];
  return frontHeld(cb, 'party') ? up.filter(x => x.row === 'front') : up;
}

/** Enemigo grande delante con un tirador suyo detrás: le cubre. */
const isGuard = (cb: Combat, u: Unit, row: Row) => row === 'front' && u.maxHp >= 30 && !MONSTERS[u.mon!].reach &&
  cb.units.some(x => x.side === 'enemy' && x !== u && conscious(x) && x.row === 'back' && MONSTERS[x.mon!].attacks.some(a => a.ranged));

const planOk = (cb: Combat, u: Unit, p: Plan) => {
  if (u.mon === DRAGON && (p.kind === 'area') !== breathNow(cb, u)) return false;
  // El golpe anunciado de un jefe sale aunque ya no alcance a nadie (apartarse era la respuesta).
  if (p.kind === 'area' && isBoss(u) && u.warn) return true;
  if (p.kind === 'area') return cb.units.some(x => x.side === 'party' && conscious(x) && (x.row === 'front' || u.mon === DRAGON));
  if (p.move && p.move !== u.row && !rowSpace(cb, 'enemy', p.move) && !(p.swap && cb.units.some(x => x.key === p.swap && conscious(x) && x.row === p.move))) return false;
  const pool = p.kind === 'magic' ? cb.units.filter(x => x.side === 'party' && conscious(x)) : reach(cb, u, p.kind === 'ranged', p.move ?? u.row);
  return p.targets.length > 0 && p.targets.every(k => pool.some(x => x.key === k));
};

/** Decide la siguiente acción de un enemigo según su tipo y las filas. */
function decide(g: Game, cb: Combat, u: Unit): Plan | undefined {
  const m = MONSTERS[u.mon!];
  const up = cb.units.filter(x => x.side === 'party' && conscious(x));
  if (!up.length) return undefined;
  const times = m.multi ?? 1;
  const picks = (pool: Unit[], ranged: boolean) => {
    const out: string[] = [];
    for (let i = 0; i < times; i++) { const t = chooseTarget(g, cb, u, pool, ranged); if (t) out.push(t.key); }
    return out;
  };
  if (m.reach) {
    // Raíces bajo la retaguardia (anunciadas): con todos los nudos rotos, solo un golpe.
    const back = u.warn ? up.filter(x => x.row === 'back') : [];
    if (back.length) {
      const n = knotsUp(cb) ? times : 1;
      return { kind: 'melee', targets: Array.from({ length: n }, () => chooseTarget(g, cb, u, back)!.key) };
    }
    return { kind: 'melee', targets: picks(reach(cb, u, false), false) };
  }
  if (u.mon === DRAGON) {
    if (u.flying) return undefined;
    // Aliento en asaltos fijos (o al aterrizar) contra la fila anunciada; quien está escondido no es objetivo.
    if (breathNow(cb, u)) {
      const row = u.aim ?? breathAim(cb);
      return { kind: 'area', targets: up.filter(x => x.row === row && !x.hidden).slice(0, 3).map(x => x.key) };
    }
    // Mientras su vanguardia aguante, espera detrás; cuando cae, avanza.
    if (u.row === 'back' && cb.units.some(x => x.side === 'enemy' && x !== u && conscious(x) && x.row === 'front')) return undefined;
    const targets = picks(reach(cb, u, false, 'front'), false);
    return targets.length ? { kind: 'melee', targets, move: u.row === 'back' ? 'front' : undefined } : undefined;
  }
  const area = m.attacks.find(a => a.save);
  const partyFront = up.filter(x => x.row === 'front');
  // Los jefes solo usan su golpe grande después de anunciarlo (ver bossWarn).
  if (area && isBoss(u)) { if (u.warn === area.name) return { kind: 'area', targets: partyFront.map(x => x.key) }; }
  else if (area && u.recharge![area.name] !== false && (partyFront.length >= 2 || m.ai !== 'caster') && partyFront.length)
    return { kind: 'area', targets: partyFront.map(x => x.key) };
  // Lanzador delante con alguien que le cubra: se retira a la retaguardia y lanza desde allí.
  const cover = cb.units.some(x => x.side === 'enemy' && x !== u && conscious(x) && x.row === 'front');
  if (m.ai === 'caster') {
    const t = chooseTarget(g, cb, u, up, true);
    if (!t) return undefined;
    return { kind: 'magic', targets: [t.key], move: u.row === 'front' && cover && rowSpace(cb, 'enemy', 'back') ? 'back' : undefined };
  }
  const melee = m.attacks.filter(a => !a.ranged && !a.save);
  const ranged = m.attacks.filter(a => a.ranged);
  let row = u.row;
  // Tirador malherido: se retira detrás si otro aguanta delante.
  const holds = cb.units.some(x => x.side === 'enemy' && x !== u && conscious(x) && x.row === 'front');
  if (row === 'front' && ranged.length && u.hp < u.maxHp / 2 && holds && rowSpace(cb, 'enemy', 'back')) row = 'back';
  const bow = !!u.weapon && /arco|ballesta|bow/i.test(u.weapon);
  const prefersRanged = !!ranged.length && (row === 'back' || bow);
  // Los de cuerpo a cuerpo que están detrás avanzan a buscar el hueco; si no lo hay, un tirador de delante se lo cede.
  let swap: string | undefined;
  if (!prefersRanged && row === 'back' && melee.length) {
    if (rowSpace(cb, 'enemy', 'front')) row = 'front';
    else {
      swap = cb.units.find(x => x.side === 'enemy' && x !== u && conscious(x) && x.row === 'front' && x.mon !== DRAGON && !MONSTERS[x.mon!].reach && MONSTERS[x.mon!].attacks.some(a => a.ranged))?.key;
      if (swap) row = 'front';
    }
  }
  const useRanged = prefersRanged || row === 'back';
  if (useRanged ? !ranged.length : !melee.length) return undefined;
  const targets = picks(reach(cb, u, useRanged, row), useRanged);
  if (!targets.length) return undefined;
  return { kind: useRanged ? 'ranged' : 'melee', targets, move: row !== u.row ? row : undefined, guard: isGuard(cb, u, row), swap: row !== u.row ? swap : undefined };
}

/**
 * Cómo se comporta un enemigo, en una o dos frases para su carta (sale de la misma IA que decide su turno).
 * Así se juega contra un plan y no contra un dado oculto.
 */
export function behaviorOf(g: Game, cb: Combat, u: Unit): string[] {
  if (u.side !== 'enemy' || !u.mon) return [];
  const m = MONSTERS[u.mon];
  const out: string[] = [];
  const first = (k?: string) => cb.units.find(x => x.key === k)?.name.split(' ')[0];
  if (m.piece) return pieceBehavior(cb);
  if (u.key === cb.runner && !cb.fired && livePiece(cb)) out.push(`Corre a ${cb.goal!.g.piece!.use ?? 'usar la pieza'}: tumbadlo o romped ${livePiece(cb)!.name.toLowerCase()} antes.`);
  if (m.knot) return ['Alimenta al Corazón: mientras quede algún nudo, el Corazón se cura y resiste el daño.'];
  if (u.mon === 'Shrieker') return ['No ataca: si chilla, atrae a otra criatura.'];
  if (cb.morale !== undefined && moraleFoe(u)) out.push(`Moral del grupo: ${cb.morale}/3. A la tercera, los malheridos huyen.`);
  if (u.warn) out.push(u.mon === 'Treant' ? 'Prepara un golpe de raíz contra la retaguardia.'
    : `Prepara ${m.attacks.find(a => a.name === u.warn)?.name ?? u.warn} contra la ${u.mon === DRAGON && u.aim === 'back' ? 'retaguardia' : 'vanguardia'}.`);
  if (u.flying) out.push('En vuelo: solo se le alcanza a distancia o con conjuros.');
  if (isBoss(u)) {
    if (u.mon === 'Treant') out.push(u.half ? 'Sus raíces apresan a quien golpean.' : 'Cada pocos asaltos brota un arbusto despertado.');
    else if (u.mon === 'Orvane') out.push(u.half ? 'Va a por el más débil.' : 'Se protege con Escudo y ataca al de menor CA.');
    else if (u.mon === 'Xiximanter') out.push(u.half ? 'Se centra en quien más daño le ha hecho.' : 'Ataca al de menor CA desde detrás de sus siervos.');
    else if (u.mon === DRAGON) out.push('Espera detrás mientras le cubren; su aliento sale cada pocos asaltos.');
    out.push('Puede rematar a un caído que tenga a su alcance.');
    return out;
  }
  if (m.ai === 'goblin') {
    const lead = cb.units.some(x => x.side === 'enemy' && conscious(x) && isLeader(x) && MONSTERS[x.mon!].ai === 'goblin' && x !== u);
    out.push(isLeader(u) ? 'Jefe de su grupo: si cae, los demás huyen antes.' : lead ? 'Huye si cae su jefe o si queda malherido.' : 'Va a por el más débil y huye si queda malherido.');
  } else if (m.ai === 'undead') out.push(first(u.prey) ? `No suelta a ${first(u.prey)} hasta que caiga.` : 'Elige a alguien de delante y no lo suelta hasta que cae.');
  else if (m.ai === 'caster') out.push('Se retira detrás si alguien le cubre y ataca al de menor CA.');
  else if (m.ai === 'cultist') out.push(isLeader(u) ? 'Sus seguidores le defienden.' : 'Defiende a su líder: va a por quien le hiera.');
  else if (m.packTactics) out.push('Caza en manada: va a por el más débil.');
  else out.push(first(u.lastHitBy) ? `Se revuelve contra ${first(u.lastHitBy)}, que le ha herido.` : 'Se revuelve contra quien le hiera.');
  if (m.attacks.some(a => a.ranged) && !m.attacks.every(a => a.ranged)) out.push('Si queda malherido y alguien le cubre, se retira a disparar desde atrás.');
  return out;
}

/** Fila a la que apunta el aliento de Vharzûl: la que tenga más personajes a la vista (si empatan, la delantera). */
function breathAim(cb: Combat): Row {
  const n = (r: Row) => cb.units.filter(x => x.side === 'party' && conscious(x) && x.row === r && !x.hidden).length;
  return n('back') > n('front') ? 'back' : 'front';
}

/**
 * Al acabar su turno, cada jefe anuncia el golpe grande del turno siguiente (diseño de jefes del 23-nov):
 * Orvane recarga la Onda, el Corazón tensa raíces bajo la retaguardia, Vharzûl toma aire y Xiximanter traza runas.
 */
function bossWarn(g: Game, cb: Combat, u: Unit) {
  const m = MONSTERS[u.mon!];
  const area = m.attacks.find(a => a.save);
  if (u.warn) return;
  if (u.mon === 'Orvane' && area) {
    if (u.recharge![area.name] === false && die(g.rng, 6) >= area.save!.recharge!) u.recharge![area.name] = true;
    if (u.recharge![area.name] !== false) { u.warn = area.name; say(cb, 'Orvane reúne energía: el próximo turno estallará contra la vanguardia.', 'big'); }
  } else if (u.mon === 'Xiximanter' && area) {
    // Una bola de fuego anunciada cada dos turnos, mientras le queden.
    if (u.cool) u.cool = false;
    else if ((u.spent ?? 0) < (area.save!.uses ?? 1) && u.recharge![area.name] !== false) {
      u.warn = area.name;
      say(cb, 'Xiximanter traza runas de fuego: el próximo turno, bola de fuego contra la vanguardia.', 'big');
    }
  } else if (u.mon === DRAGON && !u.flying) {
    if (breathRound({ ...cb, round: cb.round + 1 })) { u.warn = area!.name; u.aim = breathAim(cb); say(cb, `Vharzûl toma aire: su aliento irá contra la ${u.aim === 'front' ? 'vanguardia' : 'retaguardia'}.`, 'big'); }
  } else if (u.mon === DRAGON && u.flying) {
    u.warn = area!.name; u.aim = breathAim(cb);
    say(cb, `Vharzûl vuela en círculos y toma aire: al bajar, su aliento irá contra la ${u.aim === 'front' ? 'vanguardia' : 'retaguardia'}.`, 'big');
  } else if (u.mon === 'Treant' && rootRound(cb.round + 1)) {
    u.warn = 'Raíz'; u.aim = 'back';
    say(cb, 'Las raíces se tensan bajo la retaguardia: el próximo turno el Corazón golpeará allí.', 'big');
  }
}

/** Anuncia (o corrige) lo que harán los enemigos: se llama al empezar cada turno y tras cada acción. */
export function planAll(g: Game, cb: Combat) {
  for (const u of cb.units) {
    if (u.side !== 'enemy' || !conscious(u) || u.asleep || u.paralyzed || u.restrained || u.flank || runsNow(cb, u)) { u.plan = undefined; continue; }
    if (!u.plan || !planOk(cb, u, u.plan)) u.plan = decide(g, cb, u);
    else if (u.plan.kind === 'melee' || u.plan.kind === 'ranged') u.plan.guard = isGuard(cb, u, u.plan.move ?? u.row);
  }
}

/** Jefe de su grupo (jefe goblin, Orvane, la bruja…): varios ataques o conjuros. */
/** El jefe de la zona: el enemigo de más PX en el combate del jefe. */
const bossUnit = (g: Game, cb: Combat, u: Unit) => cb.encounters.includes(bossEncounter(g.zone)) &&
  u === cb.units.filter(x => x.side === 'enemy' && x.mon).sort((a, b) => MONSTERS[b.mon!].xp - MONSTERS[a.mon!].xp)[0];
const isLeader = (x: Unit) => !!x.mon && (MONSTERS[x.mon].ai === 'caster' || (MONSTERS[x.mon].multi ?? 1) >= 2);
/** Ha caído el jefe de su misma familia (y él no es jefe). */
const leaderDown = (cb: Combat, u: Unit) => !isLeader(u) && cb.units.some(x => x.side === 'enemy' && x.dead && isLeader(x) && MONSTERS[x.mon!].ai === MONSTERS[u.mon!].ai);

const toOpts = (a: MonsterAttack): AtkOpts => {
  const m = a.dice.match(/^(.*?)([+-]\d+)?$/)!;
  return { name: a.name, toHit: a.bonus, dice: m[1], bonus: m[2] ? +m[2] : 0, type: a.type, ranged: !!a.ranged, extra: a.extra };
};

function chooseTarget(g: Game, cb: Combat, u: Unit, opts: Unit[], ranged = false): Unit | undefined {
  const up = opts.filter(conscious);
  let pool = up.length ? up : opts;
  if (!pool.length) return undefined;
  const ai = MONSTERS[u.mon!].ai;
  const weakest = (l: Unit[]) => [...l].sort((a, b) => a.hp - b.hp)[0];
  // Los tiradores apuntan a la retaguardia (magos y clérigos primero) si hay alguien allí.
  if (ranged && ai !== 'caster') {
    const back = pool.filter(x => x.row === 'back');
    if (back.length) {
      const soft = back.filter(x => x.side === 'party' && ['wizard', 'cleric'].includes(charOf(g, x).cls));
      pool = soft.length ? soft : back;
    }
  }
  if (ai === 'goblin') return weakest(pool);
  // Manadas (ratas, lobos) y cualquiera que ya no tenga a nadie delante: a por el más débil.
  if (MONSTERS[u.mon!].packTactics || (!ranged && !frontHeld(cb, 'party'))) return weakest(pool);
  if (ai === 'beast') return pool.find(x => x.key === u.lastHitBy) ?? pick(g.rng, pool);
  if (u.half && u.mon === 'Orvane') return weakest(pool);
  if (u.half && u.mon === 'Xiximanter') return [...pool].sort((a, b) => (u.dmgBy?.[b.key] ?? 0) - (u.dmgBy?.[a.key] ?? 0) || a.hp - b.hp)[0];
  if (ai === 'caster') return [...pool].sort((a, b) => a.ac - b.ac || a.hp - b.hp)[0];
  // Sectarios: defienden a su líder y van a por quien le ha herido.
  if (ai === 'cultist') {
    const lead = cb.units.find(x => x.side === 'enemy' && x !== u && alive(x) && isLeader(x) && x.lastHitBy);
    const foe = lead && pool.find(x => x.key === lead.lastHitBy);
    if (foe) return foe;
  }
  // No muertos: eligen al más cercano y no lo sueltan hasta que cae.
  if (ai === 'undead') {
    const prey = pool.find(x => x.key === u.prey);
    if (prey) return prey;
    const front = pool.filter(x => x.row === 'front');
    const t = pick(g.rng, front.length ? front : pool);
    u.prey = t.key;
    return t;
  }
  return pick(g.rng, pool);
}
