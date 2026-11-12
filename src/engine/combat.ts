// Combate por turnos al estilo D&D 5e 2024, con dos filas por bando.
// Todo son funciones puras sobre el estado de la partida (se muta una copia).
import { enemiesOf, inspire, maxFoesFor, sizeEncounter } from './escenas';
import type { ImgKey } from '../assets';
import { Ability, CLASSES, DmgType, ITEMS, MONSTERS, MonsterAttack } from '../data/srd';
import B from '../data/corazon.json';
import { die, pick, rand, roll, tray } from './rng';
import {
  Char, abilMod, armorClass, saveBonus, spellAttack, spellDc, weaponStat, weapons, newItem, MAX_ITEMS, gainXp, slotsLeft,
} from './rules';
import { prof } from '../data/srd';
import type { Game } from './game';
import { bossEncounter, dropKey, encounterById, encounterCell, encounterGroup, tally } from './dungeon';
import { GOALS, Goal } from '../data/objetivos';

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
  hidden?: boolean;
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
  temp?: number;
  /** Apresado (red o telaraña): CD para soltarse. */
  restrained?: number;
  /** Turnos que le quedan ardiendo (fuego de alquimista). */
  burn?: number;
  resPoison?: boolean;
  /** Bebió la poción de resistencia al frío. */
  resCold?: boolean;
  /** Bárbaro en Furia: +2 al daño cuerpo a cuerpo y resiste el daño físico. */
  rage?: boolean;
  poisoned?: boolean;
  /** Objetivo de su Marca del cazador. */
  mark?: string;
  /** Asalto en que termina Arma espiritual. */
  spiritualUntil?: number;
  /** Conjuro que mantiene mediante concentración. */
  concentration?: 'mark' | 'bless' | 'spiritual';
  /** Lo que el enemigo ha anunciado que hará en su turno. */
  plan?: Plan;
}

export type FxKind = 'hit' | 'magic' | 'crit' | 'heal';
export interface Roll { id: number; d20: number; total: number; label: string; ok: boolean; crit?: boolean; enemy?: boolean; dice?: { f: number; v: number }[];
  /** Ventaja (1) o desventaja (-1): se ven los dos d20 y el descartado sale apagado. */
  adv?: number; other?: number }
export interface LogLine { t: string; c?: 'dmg' | 'heal' | 'info' | 'big' | 'miss' }

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
  /** Último impacto cuerpo a cuerpo, válido para Castigo divino en este turno. */
  smiteHit?: { attacker: string; target: string; crit: boolean };
  /** Atacante salvaje ya usado en este turno. */
  savageUsed?: boolean;
  log: LogLine[];
  roll?: Roll;
  /** Último efecto visual por carta (golpe, conjuro, crítico, curación). */
  fx?: Record<string, { id: number; kind: FxKind }>;
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
}

const MAX_ROW = 3;
/** Jefe de la montaña: Vharzûl, el dragón blanco joven. */
const DRAGON = 'Young White Dragon';
/** El aliento del dragón sale en los asaltos 2, 5, 8... (diseño de la aventura). */
const breathRound = (cb: Combat) => cb.round >= 2 && (cb.round - 2) % 3 === 0;
/** Clases con Ataque adicional desde el nivel 5. */
const EXTRA_ATTACK = ['fighter', 'ranger', 'paladin', 'barbarian'];
/** ¿Resiste el frío? (poción, anillo de calor o botas de las tierras invernales) */
const coldProof = (g: Game, u: Unit) => !!u.resCold || charOf(g, u).items.some(i => ITEMS[i.id]?.resistCold && ITEMS[i.id].kind !== 'potion');
/** Aura de protección: un paladín de nivel 6 en pie suma su Carisma (mínimo +1) a las salvaciones del grupo. */
const aura = (g: Game, cb: Combat) => Math.max(0, ...cb.units.filter(u => u.side === 'party' && conscious(u)).map(u => charOf(g, u))
  .filter(c => c.cls === 'paladin' && c.level >= 6).map(c => Math.max(1, abilMod(c, 'cha'))));
/** Nombre corto en los botones de combate para los objetos de nombre muy largo. */
const SHORT: Record<string, string> = { potion_poison_resistance: 'Poción antiveneno', potion_greater_healing_1: 'Poción mayor' };
const solo = (cb: Combat) => cb.units.filter(u => u.side === 'party').length === 1;

const PHYSICAL: DmgType[] = ['cortante', 'perforante', 'contundente'];
const fx = (cb: Combat, u: Unit, kind: FxKind) => {
  cb.fxId = (cb.fxId ?? 0) + 1;
  cb.fx = { ...cb.fx, [u.key]: { id: cb.fxId, kind } };
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
  cb.log.push({ t, c });
  if (cb.log.length > 60) cb.log.shift();
};

export const current = (cb: Combat) => cb.units.find(u => u.key === cb.order[cb.turn])!;
export const charOf = (g: Game, u: Unit) => g.party.find(c => c.id === u.charId)!;
export const alive = (u: Unit) => !u.dead && !u.fled;
export const conscious = (u: Unit) => alive(u) && u.hp > 0;
const sideUnits = (cb: Combat, s: Side) => cb.units.filter(u => u.side === s && alive(u));

/** Fila delantera "ocupada": protege a la retaguardia mientras haya alguien en pie. */
const frontHeld = (cb: Combat, s: Side) => cb.units.some(u => u.side === s && u.row === 'front' && conscious(u));

export function validTargets(cb: Combat, attacker: Unit, kind: 'melee' | 'ranged' | 'ally' | 'any'): Unit[] {
  if (kind === 'ally') return cb.units.filter(u => u.side === attacker.side && alive(u));
  const foe: Side = attacker.side === 'party' ? 'enemy' : 'party';
  const foes = sideUnits(cb, foe).filter(u => attacker.side === 'party' ? u.hp > 0 : true);
  if (kind === 'melee') {
    if (attacker.row !== 'front') return [];
    return frontHeld(cb, foe) ? foes.filter(u => u.row === 'front') : foes;
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
  if (spell === 'bless') for (const ally of cb.units.filter(u => u.side === caster.side)) ally.bless = false;
  if (spell === 'spiritual') { caster.spiritual = false; caster.spiritualUntil = undefined; }
  say(cb, `${caster.name} pierde la concentración.`, 'info');
}

function applyDamage(g: Game, cb: Combat, target: Unit, amount: number, type: DmgType, from: Unit, crit = false) {
  const m = target.mon ? MONSTERS[target.mon] : undefined;
  if (m?.immune?.includes(type)) { say(cb, `${target.name} es inmune al daño de ${type}.`, 'info'); return; }
  if (m?.resist?.includes(type)) amount = Math.floor(amount / 2);
  if (m?.vuln?.includes(type)) amount *= 2;
  if (target.side === 'party' && type === 'veneno' && (charOf(g, target).species === 'dwarf' || target.resPoison)) amount = Math.floor(amount / 2);
  if (target.mon === 'Treant' && type !== 'psíquico' && knotsUp(cb)) amount = Math.floor(amount / 2);
  if (target.side === 'party' && ((target.rage && PHYSICAL.includes(type)) || (type === 'frío' && coldProof(g, target)))) amount = Math.floor(amount / 2);
  target.lastHitBy = from.key;
  fx(cb, target, crit ? 'crit' : PHYSICAL.includes(type) ? 'hit' : 'magic');
  if (target.asleep) { target.asleep = false; say(cb, `${target.name} despierta.`, 'info'); }
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
  target.hp = Math.max(0, target.hp - amount);
  say(cb, `${target.name} recibe ${amount} de daño (${type}).`, 'dmg');
  if (target.concentration && amount > 0) {
    if (target.hp <= 0 || !saveRoll(g, cb, target, 'con', Math.max(10, Math.floor(amount / 2)), 'Concentración')) endConcentration(cb, target);
  }
  // Veneno: el personaje queda envenenado (ataca con desventaja) hasta que se cure con un antídoto o acabe el combate.
  if (type === 'veneno' && target.side === 'party' && target.hp > 0 && !target.poisoned && !target.resPoison && charOf(g, target).species !== 'dwarf') {
    target.poisoned = true;
    say(cb, `${target.name} queda envenenado: ataca con desventaja.`, 'big');
  }
  const spare = goalOpen(cb, 'spare');
  if (spare && target.side === 'enemy' && goalUnits(cb, spare.who!).includes(target)) {
    if (target.hp > 0 && target.hp < target.maxHp / 2) { target.fled = true; target.plan = undefined; say(cb, `${target.name} se rinde.`, 'big'); goalDone(cb, true); return; }
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
  } else if (amount - before >= target.maxHp) kill(cb, target);
  else {
    Object.assign(target, { deathS: 0, deathF: 0, stable: false });
    say(cb, `${target.name} cae inconsciente.`, 'big');
    if (canHeal(g, target)) say(cb, `¡${target.name} ha caído! Cúralo antes de que falle tres tiradas de salvación.`, 'big');
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
  say(cb, u.side === 'enemy' ? `${u.name} cae derrotado.` : `${u.name} ha muerto.`, 'big');
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
const goalUnits = (cb: Combat, who: string) => cb.units.filter(u => u.side === 'enemy' && (u.name === who || u.name.startsWith(`${who} `)));
/** Revisa el objetivo tras cada golpe y al empezar cada asalto. */
function goalCheck(cb: Combat, newRound = false) {
  const k = goalOpen(cb, 'kill');
  if (k && goalUnits(cb, k.who!).every(u => u.dead)) goalDone(cb, true);
  const open = cb.goal?.status === 'open' ? cb.goal.g : undefined;
  if (newRound && open?.by && cb.round >= open.by && open.kind !== 'win') {
    if (open.leave) for (const u of goalUnits(cb, open.who!).filter(conscious)) { u.fled = true; u.plan = undefined; say(cb, `${u.name} ${open.leave}.`, 'big'); }
    goalDone(cb, false);
  }
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
  if ((cb.round === 2 || cb.round === 4) && enemies.filter(u => u.row === 'front').length < MAX_ROW && enemies.length < cap) {
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

function heal(cb: Combat, u: Unit, amount: number) {
  if (u.dead) return;
  const wasDown = u.hp <= 0;
  const before = Math.max(0, u.hp);
  u.hp = Math.min(u.maxHp, before + amount);
  fx(cb, u, 'heal');
  pop(cb, u, u.hp - before, 'heal');
  if (wasDown) Object.assign(u, { deathS: 0, deathF: 0, stable: false });
  say(cb, `${u.name} recupera ${amount} PG${wasDown ? ' y se levanta' : ''}.`, 'heal');
}

interface AtkOpts { name: string; toHit: number; dice: string; bonus: number; type: DmgType; ranged: boolean; extra?: { dice: string; type: DmgType }; sneak?: boolean; spell?: boolean }

/** Tirada de ataque completa. Devuelve si impactó. */
function attack(g: Game, cb: Combat, a: Unit, t: Unit, o: AtkOpts): boolean {
  swing(cb, a, t, !o.ranged ? 'melee' : o.spell ? 'magic' : 'arrow', o.type);
  let adv = 0;
  const notes: string[] = [];
  if (t.dodge) adv--;
  if (o.ranged && a.row === 'front' && frontHeld(cb, t.side) && t.side !== a.side) { adv--; notes.push('cuerpo a cuerpo'); }
  // Un enemigo grande en la vanguardia cubre a su tirador de detrás: atacarle cuesta más.
  if (a.side === 'party' && t.side === 'enemy' && t.row === 'back' && cb.units.some(x => x.side === 'enemy' && conscious(x) && x.plan?.guard)) { adv--; notes.push('cubierto'); }
  if (t.guided) { adv++; t.guided = false; }
  if (t.restrained) adv++;
  if (a.restrained) adv--;
  if (a.poisoned) adv--;
  if (a.hidden) { adv++; a.hidden = false; }
  if (t.asleep || t.paralyzed || t.hp <= 0) adv++;
  if (a.mon && MONSTERS[a.mon].packTactics && cb.units.some(u => u !== a && u.side === a.side && conscious(u) && u.row === 'front')) adv++;
  adv = Math.sign(adv);
  let d20 = rollD20(g, adv, isHalfling(g, a));
  const bless = a.bless ? die(g.rng, 4) : 0;
  let total = d20 + o.toHit + bless;
  const champ = a.side === 'party' && charOf(g, a).cls === 'fighter' && charOf(g, a).level >= 3 && !o.spell;
  const critOf = (d: number) => d === 20 || (champ && d === 19) || (!o.ranged && (t.paralyzed || t.asleep || t.hp <= 0) && d !== 1);
  let crit = critOf(d20);
  let ac = t.ac + (t.shield ? 5 : 0);
  let hit = d20 !== 1 && (crit || total >= ac);
  // Inspiración heroica: una vez por aventura se repite un ataque fallado.
  if (!hit && a.side === 'party' && inspire(g, charOf(g, a))) {
    say(cb, `${a.name} falla (${total}), pero su Inspiración heroica le da otra oportunidad.`, 'info');
    d20 = rollD20(g, adv, isHalfling(g, a));
    total = d20 + o.toHit + bless;
    crit = critOf(d20);
    hit = d20 !== 1 && (crit || total >= ac);
  }
  // Reacción Escudo (mago del grupo u Orvane).
  if (hit && !crit && !t.shield && total < ac + 5) {
    const c = t.side === 'party' ? charOf(g, t) : undefined;
    if (c && c.cls === 'wizard' && c.slots[0] > 0 && t.hp > 0) { c.slots[0]--; t.shield = true; hit = false; say(cb, `${t.name} lanza Escudo (+5 CA).`, 'info'); }
    else if ((t.shieldSlots ?? 0) > 0) { t.shieldSlots!--; t.shield = true; hit = false; say(cb, `${t.name} lanza Escudo (+5 CA).`, 'info'); }
  }
  setRoll(cb, { d20, total, label: a.side === 'party' ? `${o.name} contra CA ${ac}` : `${a.name}: ${o.name} contra CA ${ac}`, ok: hit, crit, enemy: a.side === 'enemy', ...pairOf() });
  const advTxt = adv > 0 ? ' con ventaja' : adv < 0 ? ` con desventaja${notes.length ? ` (${notes.join(', ')})` : ''}` : '';
  if (!hit) {
    say(cb, `${a.name} usa ${o.name}${advTxt}: ${d20}+${o.toHit + bless} = ${total}. Falla.`, 'miss');
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
  if (o.sneak && !cb.sneakUsed && a.side === 'party') {
    const c = charOf(g, a);
    const ally = cb.units.some(u => u !== a && u.side === 'party' && conscious(u) && u.row === 'front') && t.row === 'front';
    if (c.cls === 'rogue' && (adv > 0 || ally)) {
      const sa = roll(g.rng, c.level >= 5 ? '3d6' : c.level >= 3 ? '2d6' : '1d6', crit);
      dmg += sa;
      cb.sneakUsed = true;
      say(cb, `Ataque furtivo: +${sa}.`, 'info');
    }
  }
  applyDamage(g, cb, t, dmg, o.type, a, crit);
  if (o.extra && alive(t)) applyDamage(g, cb, t, Math.max(0, roll(g.rng, o.extra.dice, crit)), o.extra.type, a, crit);
  if (a.concentration === 'mark' && a.mark === t.key && !o.spell) { const bonus = roll(g.rng, '1d6', crit); say(cb, `Marca del cazador: +${bonus} de fuerza.`, 'info'); if (alive(t)) applyDamage(g, cb, t, bonus, 'fuerza', a, crit); }
  if (a.mon === 'Treant') say(cb, pick(g.rng, B.boss.visions), 'info');
  return true;
}

function saveRoll(g: Game, cb: Combat, t: Unit, abil: Ability, dc: number, label: string): boolean {
  let bonus: number;
  let adv = 0;
  if (t.side === 'party') { bonus = saveBonus(charOf(g, t), abil); if (abil === 'dex' && t.dodge) adv = 1; }
  else bonus = MONSTERS[t.mon!].saves[abil] ?? 0;
  if (t.bless) bonus += die(g.rng, 4);
  if (t.side === 'party') bonus += aura(g, cb);
  const d20 = rollD20(g, adv, isHalfling(g, t));
  const ok = d20 + bonus >= dc;
  setRoll(cb, { d20, total: d20 + bonus, label: `${t.name}: salvación (${label}) CD ${dc}`, ok, enemy: t.side === 'enemy', ...pairOf() });
  say(cb, `${t.name}: salvación de ${label} ${d20 + bonus} contra CD ${dc}. ${ok ? 'Supera' : 'Falla'}.`, ok ? 'miss' : undefined);
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
      ac: armorClass(c), row: c.row, init: 0, deathS: c.deathS, deathF: c.deathF, stable: c.stable,
    });
  });
  const cb: Combat = {
    units, order: [], turn: 0, round: 1, encounters: [], pending: [], moved: false, acted: false, bonus: false,
    sneakUsed: false, log: [], bg: g.zoneBg ?? 'combate_mina',
  };
  sizeEncounter(g, group.now, group.now.includes(bossEncounter(g.zone)));
  group.now.forEach(id => addEncounter(g, cb, id, true));
  // Sin refuerzos de grupos vecinos (el autor 2026-11-06): cada grupo lucha solo.
  cb.pending = [];
  const goal = GOALS.find(x => cb.encounters.includes(x.enc) && !g.goals?.[x.enc]);
  if (goal) { cb.goal = { g: goal, status: 'open' }; say(cb, `Objetivo: ${goal.text}`, 'big'); }
  for (const u of cb.units) {
    // Dote Alerta: suma el bonificador de competencia a la iniciativa.
    const dex = u.side === 'party' ? abilMod(charOf(g, u), 'dex') + (charOf(g, u).feats?.includes('alert') ? prof(charOf(g, u).level) : 0) : MONSTERS[u.mon!].dexMod;
    u.initD20 = die(g.rng, 20);
    u.init = u.initD20 + dex + rand(g.rng) * 0.1;
  }
  cb.order = [...cb.units].sort((a, b) => b.init - a.init).map(u => u.key);
  say(cb, `¡Combate! Iniciativa: ${cb.order.map(k => cb.units.find(u => u.key === k)!.name).join(', ')}.`, 'info');
  startTurn(g, cb);
  return cb;
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
    const hp = saved ? saved[n] : m.hp;
    if (hp <= 0) continue;
    list.push({
      key: `e_${id}_${n}`, side: 'enemy', mon: e.srd_creature, name: e.count > 1 ? `${e.name} ${i + 1}` : e.name,
      img: e.srd_creature === 'Goblin Warrior' && /arco|ballesta/i.test(e.weapon ?? '') ? 'goblin_arquero' : m.img, hp, maxHp: m.hp, ac: m.ac, row: e.row === 'back' ? 'back' : 'front', init: 0, encounter: id,
      enemyIdx: n, weapon: e.weapon, // Los enemigos ya no sueltan armas normales, solo oro (el autor 2026-11-03, punto 41).
      shieldSlots: m.shieldSlots, rays: e.srd_creature === 'Orvane' ? (g.goals?.z4_e03 === 'ok' ? 1 : 2) : 0, recharge: {},
    });
  }
  const count = (r: Row) => cb.units.filter(u => u.side === 'enemy' && alive(u) && u.row === r).length;
  // Refuerzos proporcionados al grupo: como mucho 2 enemigos más que personajes (y 6 en total).
  const cap = Math.min(MAX_ROW * 2, cb.units.filter(u => u.side === 'party').length + 2);
  if (!force && list.length && (count('front') + count('back') + list.length > cap)) return false;
  for (const u of list) {
    if (count(u.row) >= MAX_ROW) u.row = u.row === 'front' ? 'back' : 'front';
    if (count(u.row) >= MAX_ROW) continue;
    cb.units.push(u);
  }
  cb.encounters.push(id);
  return true;
}

function startTurn(g: Game, cb: Combat) {
  const u = current(cb);
  planAll(g, cb);
  cb.moved = cb.acted = cb.bonus = cb.sneakUsed = false;
  cb.smiteHit = undefined;
  if (u.concentration === 'spiritual' && cb.round >= (u.spiritualUntil ?? Infinity)) endConcentration(cb, u);
  if (u.concentration === 'mark' && !cb.units.some(x => x.key === u.mark && conscious(x))) u.mark = undefined;
  cb.savageUsed = false;
  u.dodge = false;
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
  if (u.paralyzed && conscious(u)) {
    if (saveRoll(g, cb, u, 'con', 10, 'Constitución')) { u.paralyzed = false; say(cb, `${u.name} ya puede moverse.`, 'info'); }
  }
  if (checkEnd(g, cb)) return;
  for (let i = 0; i < cb.order.length + 1; i++) {
    cb.turn++;
    if (cb.turn >= cb.order.length) {
      cb.turn = 0;
      cb.round++;
      goalCheck(cb, true);
      // Si con el objetivo fallado huye el último enemigo, el combate acaba aquí.
      if (checkEnd(g, cb)) return;
      reinforce(g, cb);
    }
    const n = current(cb);
    if (alive(n)) break;
  }
  startTurn(g, cb);
}

function reinforce(g: Game, cb: Combat) {
  bossRound(g, cb);
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
  if (!cb.units.some(u => u.side === 'enemy' && conscious(u))) { finish(g, cb, 'win'); return true; }
  if (!cb.units.some(u => u.side === 'party' && conscious(u))) { finish(g, cb, 'lose'); return true; }
  return false;
}

function syncParty(g: Game, cb: Combat) {
  for (const u of cb.units) if (u.side === 'party') {
    const c = charOf(g, u);
    Object.assign(c, { hp: Math.max(0, u.hp), dead: !!u.dead, deathS: u.deathS ?? 0, deathF: u.deathF ?? 0, stable: !!u.stable, row: u.row });
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
  const msgs: string[] = [];
  const fledFoes = cb.units.filter(u => u.side === 'enemy' && u.fled).length;
  if (result === 'win') {
    const why = fledFoes === 1 && cb.units.filter(u => u.side === 'enemy' && u.dead).length === 0 ? 'El enemigo huyó.'
      : fledFoes === 1 ? 'El último enemigo huyó.' : fledFoes > 1 ? 'Los enemigos que quedaban huyeron.' : 'Todos los enemigos han caído.';
    msgs.push(why);
    cb.endLine = lastEvent?.replace(/[.!¡]+$/g, '') ?? why;
    const open = cb.goal?.status === 'open' ? cb.goal.g : undefined;
    if (open) goalDone(cb, open.kind === 'noflee' || (open.kind === 'win' && cb.round < (open.by ?? 99)));
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
      const cell = encounterCell(id);
      if (cell) g.wonAt = { ...g.wonAt, [id]: cell };
      delete g.enemyHp[id];
    }
    const drops = cb.units.filter(u => u.side === 'enemy' && u.dead && u.drop).map(u => u.drop!);
    // Como en el SRD, los caídos no se levantan solos: quedan estables a 0 PG hasta que alguien los cure o descansen.
    for (const c of g.party) if (!c.dead && c.hp <= 0) { c.stable = true; c.deathS = c.deathF = 0; }
    // Héroe solo: tras cada victoria recupera el aliento (ajuste de equilibrio de la zona 1).
    g.gold += gold;
    const alive0 = g.party.filter(c => !c.dead).length;
    tally(g, { kills: cb.units.filter(u => u.side === 'enemy' && u.dead).length, gold, xp: alive0 ? Math.floor(xp / alive0) : 0 });
    msgs.push(...gainXp(g.party, xp));
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
    }
    if (floor.length) msgs.push(`No cabe en las mochilas y queda en el suelo: ${floor.join(', ')}.`);
  } else if (result === 'fled') {
    for (const id of cb.encounters) {
      g.enemyHp[id] = [];
      const e = encounterById(id)!;
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
  /** Si no sirve de nada ahora: el motivo (el botón sale apagado y lo explica). */
  off?: string;
}

const HEALS = ['cure', 'healing_word', 'spark', 'lay', 'mass_heal'];
const isHeal = (c: Char, a: Action) => HEALS.includes(a.id) || (a.id.startsWith('potion:') && !!ITEMS[c.items.find(i => i.uid === a.id.slice(7))?.id ?? '']?.heal);
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
  // Ir atrás se permite aunque la vanguardia quede vacía (el autor 2026-11-10): sin nadie delante, te alcanzan igual.
  if (a.id.startsWith('potion:') && a.detail !== CURE && a.detail !== COLD && !isHeal(c, a) && cb.units.filter(x => x.side === 'party' && alive(x)).every(x => x.resPoison)) return 'No es necesario: todos resistís ya el veneno.';
  if (a.detail === COLD && cb.units.filter(x => x.side === 'party' && alive(x)).every(x => coldProof(g, x))) return 'No es necesario: todos resistís ya el frío.';
  if (a.detail === CURE && !targetsFor(cb, a).length) return 'No es necesario: nadie está envenenado.';
  if (a.target !== 'none' && !targetsFor(cb, a).length) {
    return a.target === 'enemy-melee' && u.row !== 'front' ? 'Desde la retaguardia no alcanzas cuerpo a cuerpo: pasa delante primero.' : 'No hay ningún objetivo a tu alcance.';
  }
  return undefined;
}

/** ¿Le queda al personaje algo útil que hacer (cambiar de fila también cuenta)? Si no, su turno acaba solo. */
// Ir atrás no cuenta: si es lo único que queda, el turno acaba solo.
export const hasUseful = (g: Game, cb: Combat) => actionsFor(g, cb).some(a => !a.off && !(a.id === 'row' && current(cb).row === 'front'));

export function actionsFor(g: Game, cb: Combat): Action[] {
  const u = current(cb);
  if (u.side !== 'party' || !conscious(u)) return [];
  const c = charOf(g, u);
  const A: Action[] = [];
  for (const w of weapons(c)) {
    const def = ITEMS[w.id];
    const s = weaponStat(c, w.id);
    A.push({ id: `atk:${w.id}`, label: def.name, cost: 'action', target: def.weapon!.ranged ? 'enemy' : 'enemy-melee', detail: `+${s.toHit} · ${def.weapon!.dice}${s.dmgBonus >= 0 ? '+' : ''}${s.dmgBonus}` });
  }
  if (c.cls === 'cleric') {
    A.push({ id: 'sacred_flame', label: 'Llama sagrada', cost: 'action', target: 'enemy', detail: `DES CD ${spellDc(c)} · ${c.level >= 5 ? '2d8' : '1d8'}` });
    if (slotsLeft(c) > 0) {
      A.push({ id: 'cure', label: 'Curar heridas', cost: 'action', target: 'ally', detail: '2d8+SAB' });
      A.push({ id: 'healing_word', label: 'Palabra de curación', cost: 'bonus', target: 'ally', detail: '2d4+SAB' });
      A.push({ id: 'guiding_bolt', label: 'Saeta guía', cost: 'action', target: 'enemy', detail: '4d6' });
      A.push({ id: 'bless', label: 'Bendecir', cost: 'action', target: 'none', detail: '+1d4 al grupo' });
    }
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
  if (c.cls === 'barbarian' && c.channel > 0 && !u.rage) A.push({ id: 'rage', label: 'Furia', cost: 'bonus', target: 'none', detail: `+2 daño, resiste golpes (${c.channel})` });
  if (c.cls === 'fighter') {
    if (c.secondWind > 0) A.push({ id: 'second_wind', label: 'Tomar aliento', cost: 'bonus', target: 'none', detail: `1d10+${c.level} (${c.secondWind})` });
    if (c.level >= 2 && c.actionSurge > 0 && cb.acted) A.push({ id: 'surge', label: 'Oleada de acción', cost: 'free', target: 'none', detail: 'otra acción' });
  }
  if (c.cls === 'rogue' && c.level >= 2) A.push({ id: 'hide', label: 'Esconderse', cost: 'bonus', target: 'none', detail: 'Sigilo' });
  const slots = slotsLeft(c);
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
    if (d.kind === 'potion' && (d.heal || d.resistPoison || d.curePoison || d.resistCold)) A.push({ id: `potion:${it.uid}`, label: name, cost: 'bonus', target: 'ally', detail: d.heal ?? (d.curePoison ? CURE : d.resistCold ? COLD : 'resiste veneno') });
    if (d.kind === 'throw') A.push({ id: `throw:${it.uid}`, label: name, cost: 'action', target: 'enemy', detail: d.thrown!.dice ?? 'apresa' });
    if (d.web && (it.charges ?? 0) > 0 && CLASSES[c.cls].spell) A.push({ id: `web:${it.uid}`, label: 'Varita de telarañas', cost: 'action', target: 'enemy', detail: `una fila · ${it.charges} cargas` });
    if (d.kind === 'wand' && !d.web && (it.charges ?? 0) > 0) A.push({ id: `wand:${it.uid}`, label: 'Varita', cost: 'action', target: 'enemy', detail: `${it.charges} cargas` });
    if (d.kind === 'scroll' && c.cls === 'wizard') A.push({ id: `scroll:${it.uid}`, label: 'Pergamino de escudo', cost: 'action', target: 'none', detail: '+5 CA' });
  }
  A.push({ id: 'dodge', label: 'Esquivar', cost: 'action', target: 'none' });
  A.push({ id: 'row', label: u.row === 'front' ? 'Ir atrás' : 'Ir delante', cost: 'move', target: 'none' });
  A.push({ id: 'flee', label: 'Huir', cost: 'action', target: 'none' });
  // Quita lo que ya no se puede pagar este turno.
  return A.filter(a => (a.cost === 'action' ? !cb.acted : a.cost === 'bonus' ? !cb.bonus : a.cost === 'move' ? !cb.moved : true))
    .filter(a => a.id !== 'row' || rowSpace(cb, 'party', u.row === 'front' ? 'back' : 'front'))
    .map(a => { const off = uselessWhy(g, cb, a); return off ? { ...a, off } : a; });
}

const rowSpace = (cb: Combat, s: Side, r: Row) => cb.units.filter(u => u.side === s && alive(u) && u.row === r).length < MAX_ROW + 1;

const CURE = 'cura el veneno';
const COLD = 'resiste el frío';

export function targetsFor(cb: Combat, a: Action): Unit[] {
  const u = current(cb);
  if (a.target === 'enemy-melee') return validTargets(cb, u, 'melee');
  if (a.target === 'enemy') {
    if (a.id === 'sleep') return validTargets(cb, u, 'ranged');
    return validTargets(cb, u, 'ranged');
  }
  if (a.detail === CURE) return cb.units.filter(x => x.side === 'party' && alive(x) && x.poisoned);
  // Las curaciones solo se ofrecen a quien le falta vida.
  if (a.target === 'ally' && (HEALS.includes(a.id) || a.detail !== 'resiste veneno' && a.detail !== COLD && a.id.startsWith('potion:'))) return hurt(cb);
  if (a.target === 'ally' || a.target === 'ally-down') return validTargets(cb, u, 'ally');
  return [];
}

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
  attack(g, cb, u, t2, { name: ITEMS[weapon].name, toHit: s.toHit, dice: w.dice, bonus: s.dmgBonus, type: w.type, ranged: !!w.ranged, sneak: !!(w.finesse || w.ranged) });
}

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
  if (a.cost === 'action') cb.acted = true;
  if (a.cost === 'bonus') cb.bonus = true;
  if (a.cost === 'move') cb.moved = true;
  const [kind, arg] = a.id.split(':');
  switch (kind) {
    case 'atk': {
      const w = ITEMS[arg].weapon!;
      const s = weaponStat(c, arg);
      attack(g, cb, u, t!, { name: ITEMS[arg].name, toHit: s.toHit, dice: w.dice, bonus: s.dmgBonus, type: w.type, ranged: !!w.ranged, sneak: !!(w.finesse || w.ranged) });
      extraAttack(g, cb, u, c, t!, arg);
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
    case 'fireball': {
      c.slots[2]--;
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
      const dmg = roll(g.rng, '3d6');
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
      c.slots[1]--;
      for (let i = 0; i < 3 && alive(t!) && t!.hp > 0; i++) attack(g, cb, u, t!, { name: 'Rayo abrasador', toHit: spellAttack(c), dice: '2d6', bonus: 0, type: 'fuego', ranged: true, spell: true });
      break;
    case 'second_wind': c.secondWind--; heal(cb, u, roll(g.rng, '1d10') + c.level); break;
    case 'surge': c.actionSurge--; cb.acted = false; say(cb, `${u.name} usa Oleada de acción.`, 'info'); break;
    case 'hide': {
      // Como en el SRD: Sigilo (DES + pericia del pícaro) contra la Percepción pasiva del enemigo que mejor ve.
      const pp = Math.max(...cb.units.filter(e => e.side === 'enemy' && conscious(e)).map(e => 10 + (MONSTERS[e.mon!].saves.wis ?? 0)));
      const d20 = die(g.rng, 20), bonus = abilMod(c, 'dex') + prof(c.level) * 2, ok = d20 + bonus >= pp;
      setRoll(cb, { d20, total: d20 + bonus, label: `Sigilo de ${u.name} contra Percepción ${pp}`, ok });
      if (ok) { u.hidden = true; say(cb, `${u.name} se esconde: ventaja en su próximo ataque.`, 'info'); }
      else say(cb, `${u.name} intenta esconderse, pero le ven.`, 'info');
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
      break;
    }
    case 'dodge': u.dodge = true; say(cb, `${u.name} se pone a la defensiva.`, 'info'); break;
    case 'row':
      u.row = u.row === 'front' ? 'back' : 'front';
      say(cb, `${u.name} pasa a la fila ${u.row === 'front' ? 'delantera' : 'trasera'}.`, 'info');
      // Con las filas cambiadas, los enemigos vuelven a mirar quién queda delante y quién detrás (el autor 2026-11-10).
      for (const e of cb.units) if (e.side === 'enemy') e.plan = undefined;
      break;
    case 'flee':
      finish(g, cb, 'fled');
      return;
  }
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
  const m = MONSTERS[u.mon!];
  // Goblins malheridos huyen.
  if (m.ai === 'goblin' && u.hp < u.maxHp * 0.25 && rand(g.rng) < 0.5) {
    u.fled = true;
    u.plan = undefined;
    say(cb, `${u.name} huye despavorido.`, 'info');
    if (goalOpen(cb, 'noflee')) goalDone(cb, false);
    if (checkEnd(g, cb)) return;
    endTurn(g, cb);
    return;
  }
  for (const a of m.attacks) if (a.save?.recharge && u.recharge![a.name] === false && die(g.rng, 6) >= a.save.recharge) u.recharge![a.name] = true;
  // Lo que había anunciado (si sigue valiendo) o una decisión nueva.
  const p = u.plan && planOk(cb, u, u.plan) ? u.plan : decide(g, cb, u);
  u.plan = undefined;
  if (!p && u.mon === DRAGON) say(cb, `${u.name} observa desde atrás, tras sus siervos.`, 'info');
  if (!p) { endTurn(g, cb); return; }
  if (p.move && p.move !== u.row) {
    u.row = p.move;
    say(cb, p.move === 'back' ? `${u.name} retrocede a la retaguardia.` : `${u.name} avanza a la fila delantera.`, 'info');
  }
  if (p.kind === 'area') {
    const area = m.attacks.find(a => a.save)!;
    u.recharge![area.name] = false;
    say(cb, `${u.name} usa ${area.name}.`, 'big');
    const dmg = roll(g.rng, area.dice);
    const hit = u.mon === DRAGON ? cb.units.filter(x => p.targets.includes(x.key) && conscious(x)) : cb.units.filter(x => x.side === 'party' && conscious(x) && x.row === 'front');
    for (const t of hit) {
      const ok = saveRoll(g, cb, t, area.save!.abil, area.save!.dc, area.save!.abil === 'con' ? 'Constitución' : 'Destreza');
      applyDamage(g, cb, t, ok ? Math.floor(dmg / 2) : dmg, area.type, u);
    }
    endTurn(g, cb);
    return;
  }
  if (p.kind === 'magic') {
    // Orvane: rayos abrasadores mientras le queden, luego descarga arcana.
    const t = cb.units.find(x => x.key === p.targets[0]);
    if (t) {
      if ((u.rays ?? 0) > 0) {
        u.rays!--;
        for (let i = 0; i < 3 && t.hp > 0 && !t.dead; i++) attack(g, cb, u, t, toOpts(m.attacks[0]));
      } else attack(g, cb, u, t, toOpts(m.attacks[2]));
    }
    endTurn(g, cb);
    return;
  }
  const ranged = p.kind === 'ranged';
  const atks = m.reach ? [m.attacks[0]] : m.attacks.filter(a => (ranged ? a.ranged : !a.ranged && !a.save));
  if (!atks.length) { endTurn(g, cb); return; }
  let told = false;
  for (let i = 0; i < p.targets.length; i++) {
    const pool = reach(cb, u, ranged);
    let t = cb.units.find(x => x.key === p.targets[i] && pool.includes(x) && conscious(x));
    if (!t) t = chooseTarget(g, cb, u, pool, ranged);
    if (!t) break;
    // Cuerpo a cuerpo contra la retaguardia: se explica por qué llega.
    if (!ranged && !told && t.row === 'back' && !frontHeld(cb, 'party')) {
      told = true;
      say(cb, `No queda nadie delante: ${u.name} llega hasta ${t.name}.`, 'info');
    }
    const a = atks[i % atks.length];
    const hit = attack(g, cb, u, t, toOpts(a));
    if (hit && a.paralyze && conscious(t) && !t.paralyzed && !saveRoll(g, cb, t, 'con', a.paralyze.dc, 'Constitución')) {
      t.paralyzed = true;
      say(cb, `${t.name} queda paralizado.`, 'big');
    }
    if (checkEnd(g, cb)) return;
  }
  endTurn(g, cb);
}

/** Lo que va a hacer un enemigo en su turno: se anuncia sobre su carta. */
export interface Plan { kind: 'melee' | 'ranged' | 'area' | 'magic'; targets: string[]; move?: Row; guard?: boolean }

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
  if (u.mon === DRAGON && (p.kind === 'area') !== breathRound(cb)) return false;
  if (p.kind === 'area') return cb.units.some(x => x.side === 'party' && conscious(x) && (x.row === 'front' || u.mon === DRAGON));
  if (p.move && p.move !== u.row && !rowSpace(cb, 'enemy', p.move)) return false;
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
  if (m.reach) return { kind: 'melee', targets: picks(reach(cb, u, false), false) };
  if (u.mon === DRAGON) {
    // Aliento en asaltos fijos contra hasta tres personajes (primero los de delante).
    if (breathRound(cb)) return { kind: 'area', targets: [...up.filter(x => x.row === 'front'), ...up.filter(x => x.row === 'back')].slice(0, 3).map(x => x.key) };
    // Mientras su vanguardia aguante, espera detrás; cuando cae, avanza.
    if (u.row === 'back' && cb.units.some(x => x.side === 'enemy' && x !== u && conscious(x) && x.row === 'front')) return undefined;
    const targets = picks(reach(cb, u, false, 'front'), false);
    return targets.length ? { kind: 'melee', targets, move: u.row === 'back' ? 'front' : undefined } : undefined;
  }
  const area = m.attacks.find(a => a.save);
  const partyFront = up.filter(x => x.row === 'front');
  if (area && u.recharge![area.name] !== false && (partyFront.length >= 2 || m.ai !== 'caster') && partyFront.length)
    return { kind: 'area', targets: partyFront.map(x => x.key) };
  if (m.ai === 'caster') { const t = chooseTarget(g, cb, u, up, true); return t ? { kind: 'magic', targets: [t.key] } : undefined; }
  const melee = m.attacks.filter(a => !a.ranged && !a.save);
  const ranged = m.attacks.filter(a => a.ranged);
  let row = u.row;
  // Tirador malherido: se retira detrás si otro aguanta delante.
  const holds = cb.units.some(x => x.side === 'enemy' && x !== u && conscious(x) && x.row === 'front');
  if (row === 'front' && ranged.length && u.hp < u.maxHp / 2 && holds && rowSpace(cb, 'enemy', 'back')) row = 'back';
  const bow = !!u.weapon && /arco|ballesta|bow/i.test(u.weapon);
  const prefersRanged = !!ranged.length && (row === 'back' || bow);
  // Los de cuerpo a cuerpo que están detrás avanzan a buscar el hueco.
  if (!prefersRanged && row === 'back' && melee.length && rowSpace(cb, 'enemy', 'front')) row = 'front';
  const useRanged = prefersRanged || row === 'back';
  if (useRanged ? !ranged.length : !melee.length) return undefined;
  const targets = picks(reach(cb, u, useRanged, row), useRanged);
  if (!targets.length) return undefined;
  return { kind: useRanged ? 'ranged' : 'melee', targets, move: row !== u.row ? row : undefined, guard: isGuard(cb, u, row) };
}

/** Anuncia (o corrige) lo que harán los enemigos: se llama al empezar cada turno y tras cada acción. */
export function planAll(g: Game, cb: Combat) {
  for (const u of cb.units) {
    if (u.side !== 'enemy' || !conscious(u) || u.asleep || u.paralyzed || u.restrained) { u.plan = undefined; continue; }
    if (!u.plan || !planOk(cb, u, u.plan)) u.plan = decide(g, cb, u);
    else if (u.plan.kind === 'melee' || u.plan.kind === 'ranged') u.plan.guard = isGuard(cb, u, u.plan.move ?? u.row);
  }
}

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
  if (ai === 'caster') return [...pool].sort((a, b) => a.ac - b.ac || a.hp - b.hp)[0];
  if (ai === 'undead') {
    const front = pool.filter(x => x.row === 'front');
    return pick(g.rng, front.length ? front : pool);
  }
  return pick(g.rng, pool);
}
