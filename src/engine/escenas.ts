// Escenas con opciones: pruebas de atributo en el mapa, decisiones con consecuencias y grupos de paso al volver.
// El jugador elige una opción y, si pide tirada, quién del grupo la hace (se ve el bonificador de cada uno).
import type { ImgKey } from '../assets';
import { ABIL_NAME, Ability, ClassId, ITEMS, MONSTERS, SKILLS, Skill, SpeciesId } from '../data/srd';
import { GOALS } from '../data/objetivos';
import { TONE_LINES, Tone } from '../data/comentarios';
import { ADVS, advOf } from './aventuras';
import { logEvs, reached, contentById, dropKey, encounterById, rolledEnemies, Ev, giveItem, ShownRoll } from './dungeon';
import type { Game } from './game';
import { die, pick, roll } from './rng';
import { setElems } from './elementos';
import { Char, abilMod, isDown, newItem, skillBonus, skillProf } from './rules';

/** Lo que pasa al elegir una opción (o al acertar o fallar su tirada). */
export interface Effect {
  text?: string;
  gold?: number;
  item?: string;
  /** Objeto que se gasta (una poción para el herido...). */
  lose?: string;
  /** Daño a quien hizo la tirada (o al primero del grupo). */
  damage?: string;
  /** Encuentros con un enemigo más o uno menos, o que desaparecen. */
  add?: string;
  sub?: string;
  remove?: string;
  /** Secreto que queda a la vista. */
  reveal?: string;
  /** Reja o paso que se abre. */
  open?: string;
  /** Elementos dinámicos del mapa que cambian de estado (id → estado): la roca se rompe, la verja se abre... */
  set?: Record<string, string>;
  /** Combate que empieza ahora (ruido, alarma, el grupo de paso que ataca). */
  fight?: string;
  flag?: string;
  /** PG que recupera cada uno del grupo que siga en pie. */
  heal?: number;
}
export interface SceneOpt { label: string; attr?: Ability; dc?: number; needs?: string; /** Oro que se paga al elegirla. */ cost?: number;
  /** Vía propia de un aliado: solo sale si va en el grupo y en pie, y sale bien sin tirada. Nunca es la única forma de avanzar. */
  ally?: string;
  /** Habilidad del SRD de la prueba (Sigilo, Arcanos...): suma la competencia de quien la tenga. */
  skill?: Skill;
  /** Vía propia de una clase o una especie: sale si alguien así va en el grupo y en pie, y sale bien sin tirada. */
  cls?: ClassId[];
  species?: SpeciesId[];
  /** Vía que solo sale si ya pasó algo antes (un objetivo cumplido, una marca, una sala vista): consecuencia de otra decisión. */
  if?: string;
  /** Cómo la leen los compañeros (perdonar, ser duro, cobrar): uno de ellos comenta la decisión. */
  tone?: Tone;
  ok: Effect; fail?: Effect }
export interface Scene {
  id: string; title: string; img?: ImgKey; text: string; question?: string;
  /** Decisión: se elige una sola vez. Prueba: al fallar se cierra esa vía y quedan las otras. */
  decision?: boolean;
  options: SceneOpt[];
  /** Si fallan todas las vías de una prueba. */
  fallback?: Effect;
  /** Escena con margen: la primera tirada fallada no cierra la vía; se puede repetir una vez, con desventaja. */
  margin?: boolean;
}

export const sceneById = (id: string) => contentById(id)?.c as unknown as Scene | undefined;
export const sceneState = (g: Game, id: string): { closed: number[]; said?: string[]; fight?: string; tried?: number[] } => g.scenes?.[id] ?? { closed: [] as number[] };

/** Bonificador de la tirada: la habilidad (característica y competencia) o, si no la hay, solo la característica. */
export const testBonus = (c: Char, a: Ability, skill?: Skill) => (skill ? skillBonus(c, skill) : abilMod(c, a));
/** Quién lo haría mejor (el de mayor bonificador entre los que están en pie). */
export const bestFor = (g: Game, a: Ability, skill?: Skill) => [...g.party.filter(c => !isDown(c))].sort((x, y) => testBonus(y, a, skill) - testBonus(x, a, skill))[0];
/** Nombre de la prueba: «Sigilo (DES)» o «Fuerza». */
export const testName = (a: Ability, skill?: Skill) => (skill ? SKILLS[skill].name : ABIL_NAME[a]);
/**
 * Ayudar (SRD 5.2.1): otro del grupo con competencia en esa habilidad da ventaja a quien hace la prueba.
 * Devuelve quién ayuda, si hay alguien.
 */
export const helperFor = (g: Game, who: Char, skill?: Skill) =>
  skill ? g.party.find(c => c.id !== who.id && !isDown(c) && skillProf(c, skill) > 0) : undefined;
/** Vía de clase o de especie: quién del grupo la abre (en pie), si hay alguien. */
export const traitWho = (g: Game, o: SceneOpt) => (o.cls || o.species)
  ? g.party.find(c => !isDown(c) && (!o.cls || o.cls.includes(c.cls)) && (!o.species || o.species.includes(c.species))) : undefined;

/** ¿Le queda Inspiración heroica en esta aventura? */
export const canInspire = (g: Game, c: Char) => !!c.inspired && g.inspUsed?.[c.id] !== advOf(g.zone);

/** Inspiración heroica: una vez por aventura, quien la tiene repite una tirada fallida. */
export function inspire(g: Game, c: Char): boolean {
  if (!canInspire(g, c)) return false;
  const adv = advOf(g.zone);
  g.inspUsed = { ...g.inspUsed, [c.id]: adv };
  return true;
}

const has = (g: Game, item: string) => g.party.some(c => !c.dead && c.items.some(i => i.id === item));
/** ¿Va ese aliado en el grupo y puede actuar? */
export const allyHere = (g: Game, id: string) => g.party.some(c => c.id === id && !isDown(c));
/** Las vías de un aliado que no va en el grupo no se enseñan. */
export const optionShown = (g: Game, s: Scene, i: number) => (!s.options[i].ally || allyHere(g, s.options[i].ally!)) && (!s.options[i].if || reached(g, s.options[i].if!))
  && (!(s.options[i].cls || s.options[i].species) || !!traitWho(g, s.options[i]));
export const optionOpen = (g: Game, s: Scene, i: number) => optionShown(g, s, i) && !sceneState(g, s.id).closed.includes(i) && (!s.options[i].needs || has(g, s.options[i].needs!)) && g.gold >= (s.options[i].cost ?? 0);

/** Probabilidad (en %) de superar una prueba de escena con ese personaje: d20 + bonificador contra la CD (con ventaja si le ayudan). */
export const testChance = (c: Char, a: Ability, dc: number, skill?: Skill, adv = false) => {
  const one = Math.max(0, Math.min(20, 21 - (dc - testBonus(c, a, skill)))) / 20;
  return Math.round((adv ? 1 - (1 - one) ** 2 : one) * 100);
};

/** Aplica un efecto y devuelve las líneas que lo cuentan y el combate que empiece, si hay. */
/** Sala en la que está el grupo ahora. */

export function applyEffect(g: Game, e: Effect, who?: Char): { lines: string[]; items: string[]; fight?: string } {
  const lines: string[] = [];
  const items: string[] = [];
  if (e.text) lines.push(e.text);
  if (e.gold) {
    const n = e.gold > 0 ? e.gold : -Math.min(g.gold, -e.gold);
    g.gold += n;
    lines.push(n >= 0 ? `Ganáis ${n} monedas de oro.` : `Pagáis ${-n} monedas de oro.`);
  }
  if (e.lose) {
    const c = g.party.find(x => !x.dead && x.items.some(i => i.id === e.lose));
    if (c) { c.items.splice(c.items.findIndex(i => i.id === e.lose), 1); lines.push(`${c.name} entrega: ${ITEMS[e.lose].name}.`); }
  }
  if (e.item) {
    const c = giveItem(g, e.item);
    items.push(e.item);
    if (c) lines.push(`${c.name} guarda: ${ITEMS[e.item].name}.`);
    else { const k = dropKey(g); g.drops = { ...g.drops, [k]: [...(g.drops?.[k] ?? []), newItem(e.item)] }; lines.push(`${ITEMS[e.item].name}: no cabe en las mochilas y queda en el suelo.`); }
  }
  if (e.damage) {
    const t = who ?? g.party.find(c => !isDown(c))!;
    const d = Math.max(0, Math.min(t.hp - 1, roll(g.rng, e.damage)));
    t.hp -= d;
    if (d) lines.push(`${t.name} pierde ${d} PG.`);
  }
  if (e.heal) {
    for (const c of g.party.filter(x => !isDown(x) && !x.cursed)) c.hp = Math.min(c.maxHp, c.hp + e.heal);
    lines.push(`Todos recuperáis ${e.heal} PG.`);
  }
  if (e.add) g.encMod = { ...g.encMod, [e.add]: (g.encMod?.[e.add] ?? 0) + 1 };
  if (e.sub) {
    g.encMod = { ...g.encMod, [e.sub]: (g.encMod?.[e.sub] ?? 0) - 1 };
    // Sin enemigos ya: el combate desaparece.
    if (!enemiesOf(g, e.sub).length && !g.done.includes(e.sub)) { g.done.push(e.sub); g.fallen = { ...g.fallen, [e.sub]: {} }; }
  }
  if (e.remove && !g.done.includes(e.remove)) { g.done.push(e.remove); g.fallen = { ...g.fallen, [e.remove]: {} }; }
  if (e.reveal && !g.found.includes(e.reveal)) {
    g.found.push(e.reveal);
    // El descubrimiento se registra en el juego, pero el relato no presupone
    // que exista un saco, pared, puerta o pasadizo visible en la ilustración.
    lines.push('Ya lo puedes ver en el mapa.');
  } else if (e.reveal) {
    // Otra escena ya lo había descubierto: que el texto no prometa algo nuevo en el mapa (el autor 2026-11-25).
    lines.push('Ya lo habíais descubierto: no hay nada nuevo en el mapa.');
  }
  if (e.open && !g.done.includes(e.open)) g.done.push(e.open);
  setElems(g, e.set);
  if (e.flag && !g.flags?.includes(e.flag)) g.flags = [...(g.flags ?? []), e.flag];
  const fight = e.fight && !g.done.includes(e.fight) && encounterById(e.fight) ? e.fight : undefined;
  return { lines, items, fight };
}

/**
 * Aplica cambios por decisiones y ajuste de grupo sin duplicar jefes ni saturar las filas.
 * Primero se ajusta al tamaño del grupo y después se suman o restan las decisiones (escenas y objetivos):
 * así un refuerzo o una baja se notan siempre, también con grupos pequeños. Sin «withMods», solo el ajuste.
 */
export function enemiesOf(g: Game, id: string, withMods = true): any[] {
  const base: any[] = rolledEnemies(g, id);
  const mod = withMods ? g.encMod?.[id] ?? 0 : 0, size = g.encSize?.[id] ?? 0;
  const weak = !!g.weak?.includes(id);
  if (!mod && !size && !weak) return base;

  // Un jefe es único aunque su PX en la tabla sea 0 (Vharzûl y el Corazón).
  // Los ajustes de escenas o del tamaño del grupo nunca lo duplican ni lo eliminan.
  const ref = contentById(id);
  const bossType = ref ? ADVS[advOf(ref.zone)].boss : undefined;
  const isBoss = (e: any) => e.srd_creature === bossType;
  const list = base.map(e => (weak && e.srd_creature === 'Goblin Warrior'
    ? { ...e, srd_creature: 'Goblin Minion' } : { ...e }));
  const goalWho = GOALS.find(x => x.enc === id)?.who;
  const xpOf = (e: any) => MONSTERS[e.srd_creature]?.xp ?? 0;
  const count = () => list.reduce((n, e) => n + e.count, 0);

  // Cuando hay que recortar el encuentro, salen primero los acompañantes
  // peligrosos, nunca el jefe ni el enemigo necesario para un objetivo.
  const take = (keep: number) => {
    if (count() <= keep) return;
    const removable = list.filter(e => e.count > 0 && !isBoss(e) && e.name !== goalWho)
      .sort((x, y) => xpOf(y) - xpOf(x))[0];
    if (removable) removable.count--;
  };
  // Se añaden esbirros del tipo más débil, no una copia del primer enemigo
  // (que en varios encuentros es precisamente el jefe).
  const add = (n: number) => {
    // También vale un tipo que el ajuste al grupo dejó a cero (la escolta del jefe con el héroe solo).
    const minion = list.filter(e => !isBoss(e) && xpOf(e) > 0)
      .sort((x, y) => xpOf(x) - xpOf(y))[0];
    if (!minion || n <= 0) return;
    // Un refuerzo elegido por una escena conserva su efecto aunque la primera
    // fila esté llena: puede aparecer en la otra, con un máximo de 3 por fila.
    const rowCount = (row: string) => list.filter(e => (e.row === 'back' ? 'back' : 'front') === row)
      .reduce((sum, e) => sum + e.count, 0);
    const row = minion.row === 'back' ? 'back' : 'front';
    const sameRow = Math.min(n, Math.max(0, 3 - rowCount(row)));
    minion.count += sameRow;
    const rest = n - sameRow;
    if (rest > 0) {
      const opposite = row === 'front' ? 'back' : 'front';
      const otherRow = Math.min(rest, Math.max(0, 3 - rowCount(opposite)));
      if (otherRow > 0) {
        const sameType = list.find(e => e.srd_creature === minion.srd_creature && e.row === opposite);
        if (sameType) sameType.count += otherRow;
        else list.push({ ...minion, row: opposite, count: otherRow });
      }
    }
  };
  if (size > 0) add(size);
  for (let k = 0; k < -size; k++) take(1);
  // Héroe solo en la zona 1: un único enemigo por combate, también si una decisión trae refuerzos.
  if (mod > 0 && !weak) add(mod);
  // Una baja deja al menos un enemigo si el combate ya está ajustado (si no, el combate desaparece al aplicarla).
  const sized = g.encSize?.[id] !== undefined;
  for (let k = 0; k < -mod; k++) take(sized ? 1 : 0);
  return list.filter(e => e.count > 0);
}

/** PX por personaje del SRD 2024 (dificultad moderada y alta) según el nivel. Desde la v0.76 los jefes usan la moderada. */
/** PX por personaje del SRD 2024, dificultad baja (combates normales desde la v0.76). */
const LOW: Record<number, number> = { 1: 50, 2: 100, 3: 150, 4: 250, 5: 500, 6: 600, 7: 750, 8: 1000 };
/** Tope de enemigos para partidas con grupo pequeño. */
const MAX_FOES = [1, 1, 2, 3, 4];
export const maxFoesFor = (partySize: number) => MAX_FOES[Math.min(4, Math.max(1, partySize))];
const BUDGET: Record<number, [number, number]> = { 1: [75, 100], 2: [150, 200], 3: [225, 400], 4: [375, 500], 5: [750, 1100], 6: [1000, 1400], 7: [1300, 1700], 8: [1700, 2100] };

/**
 * Tamaño del combate según el grupo: presupuesto bajo en encuentros normales y moderado en jefes.
 * Los jefes son únicos, no se rellenan sus combates y nunca se multiplica una amenaza épica.
 */
export function sizeEncounter(g: Game, ids: string[], boss: boolean) {
  // El ajuste se hace sobre el primer grupo con acompañantes: si el combate
  // empieza al pisar la casilla del jefe, el primero es el jefe solo y no
  // se podría recortar a su escolta.
  const ref0 = contentById(ids[0]);
  const boss0 = ref0 ? ADVS[advOf(ref0.zone)].boss : undefined;
  const id = ids.find(x => (encounterById(x)?.enemies ?? []).some((e: any) => e.srd_creature !== boss0)) ?? ids[0];
  if (g.encSize?.[id] !== undefined || g.enemyHp[id]) return;
  const team = g.party.filter(c => !c.dead);
  // Hondaroca empieza con el héroe solo: un único enemigo por combate,
  // y los goblins guerreros se sustituyen por esbirros.
  if (team.length === 1 && contentById(id)?.zone === 'z1' && !g.hard) {
    g.encSize = { ...g.encSize, [id]: 0 };
    g.weak = [...(g.weak ?? []), id];
    const n = enemiesOf(g, id, false).reduce((m, e) => m + e.count, 0);
    g.encSize[id] = -(n - 1);
    return;
  }
  const lvl = Math.max(1, Math.min(8, Math.round(team.reduce((n, c) => n + c.level, 0) / Math.max(1, team.length))));
  // Modo desafío: todos los combates con el presupuesto moderado de los jefes.
  const target = (boss || g.hard ? BUDGET[lvl][0] : LOW[lvl]) * team.length;
  // Las decisiones que añaden o quitan un enemigo no cuentan aquí: se aplican encima (ver enemiesOf).
  const cap = maxFoesFor(team.length);
  const xpOf = (e: any) => MONSTERS[e.srd_creature]?.xp ?? 0;
  const all = () => ids.flatMap(x => enemiesOf(g, x, false));
  const total = () => all().reduce((n, e) => n + xpOf(e) * e.count, 0);
  const count = () => all().reduce((n, e) => n + e.count, 0);
  const ref = contentById(id);
  const bossType = ref ? ADVS[advOf(ref.zone)].boss : undefined;
  g.encSize = { ...g.encSize, [id]: 0 };

  // No se añaden criaturas a los jefes. En combates normales solo se permite
  // un esbirro adicional y siempre que quepa en su fila (máximo tres).
  if (!boss) {
    const candidate = enemiesOf(g, id, false).filter(e => e.srd_creature !== bossType && xpOf(e) > 0)
      .sort((x, y) => xpOf(x) - xpOf(y))[0];
    if (candidate && count() < cap && total() + xpOf(candidate) <= target &&
        all().filter(e => e.row === candidate.row).reduce((n, e) => n + e.count, 0) < 3) {
      g.encSize[id]++;
    }
  }
  // Los grupos pequeños combaten contra menos adversarios. Si hay un jefe,
  // nunca se le elimina para cumplir el presupuesto o el límite de unidades.
  while ((total() > target || count() > cap) && count() > 1) {
    const before = count();
    g.encSize[id]--;
    if (count() === before) { g.encSize[id]++; break; }
  }
}

/**
 * Primer enemigo que tendrá el combate, ya ajustado al grupo y a las escenas: es el que se ve en el mapa
 * (antes salía el primero del encuentro original, aunque el ajuste lo quitara; el autor 2026-11-25).
 * Se calcula sobre una copia: mirar el mapa no fija el tamaño del combate.
 */
export function firstFoe(g: Game, id: string, boss: boolean): any {
  const t = { ...g };
  sizeEncounter(t, [id], boss);
  return enemiesOf(t, id)[0] ?? rolledEnemies(g, id)[0];
}

/** Elige una opción. Devuelve lo que se enseña después (resultado, la escena otra vez o un combate). */
export function chooseOption(g: Game, id: string, i: number, charId?: string, force20 = false): Ev[] {
  const s = sceneById(id)!;
  const o = s.options[i];
  const prev = sceneState(g, id);
  const st: { closed: number[]; said?: string[]; fight?: string; tried?: number[] } = { closed: [...prev.closed], tried: prev.tried };
  // Segundo intento en una escena con margen: con desventaja (si alguien ayuda, se anulan y se tira normal).
  const second = !!s.margin && !!prev.tried?.includes(i);
  const who = g.party.find(c => c.id === (charId ?? o.ally)) ?? traitWho(g, o) ?? (o.attr ? bestFor(g, o.attr, o.skill) : undefined);
  const rolls: ShownRoll[] = [];
  const found0 = g.found.length;
  let ok = true;
  if (o.attr && o.dc && who) {
    const bonus = testBonus(who, o.attr, o.skill);
    // Ayudar: con alguien competente al lado se tira con ventaja (dos d20, el mejor).
    const helper = helperFor(g, who, o.skill);
    const two = () => (helper && second ? die(g.rng, 20) : helper ? Math.max(die(g.rng, 20), die(g.rng, 20)) : second ? Math.min(die(g.rng, 20), die(g.rng, 20)) : die(g.rng, 20));
    let d = force20 ? 20 : two();
    ok = force20 || d + bonus >= o.dc;
    rolls.push({ d20: d, bonus, dc: o.dc, ok, text: `${testName(o.attr, o.skill)} de ${who.name}${helper ? ` (con ventaja: le ayuda ${helper.name.split(' ')[0]})` : ''}` });
    // Mente táctica (guerrero de nivel 2): al fallar suma 1d10 gastando un uso de Tomar aliento, solo si así lo consigue.
    if (!ok && who.cls === 'fighter' && who.level >= 2 && who.secondWind > 0) {
      const extra = die(g.rng, 10);
      if (d + bonus + extra >= o.dc) {
        who.secondWind--;
        ok = true;
        rolls.push({ d20: d, bonus: bonus + extra, dc: o.dc, ok, text: `Mente táctica: ${who.name} suma ${extra} (gasta un uso de Tomar aliento)` });
      }
    }
    if (!ok && inspire(g, who)) {
      d = two();
      ok = d + bonus >= o.dc;
      rolls.push({ d20: d, bonus, dc: o.dc, ok, text: `Inspiración heroica: ${who.name} repite` });
    }
  }
  if (o.cost) g.gold -= o.cost;
  // Escena con margen: el primer fallo no cierra la vía ni aplica su efecto; sube la tensión y queda un intento.
  if (!ok && rolls.length && s.margin && !second) {
    st.tried = [...(st.tried ?? []), i];
    g.scenes = { ...g.scenes, [id]: st };
    const evs: Ev[] = [{ kind: 'msg', title: s.title, img: s.img, rolls, lines: [`${o.label} (${who!.name}).`, 'No lo consigue, pero aún hay margen: se pone nervioso. Podéis intentarlo una vez más, con desventaja.'], save: true }];
    logEvs(g, evs);
    evs.push({ kind: 'scene', id });
    return evs;
  }
  const eff = ok ? o.ok : o.fail ?? {};
  const r = applyEffect(g, eff, who);
  const evs: Ev[] = [];
  let finished = s.decision || ok || !!r.fight;
  // Todas las vías falladas: sale el texto de repuesto, pero la prueba sigue en el mapa y sus vías se reabren
  // tras un descanso largo en la posada (el autor 2026-11-05).
  let spent = false;
  if (!finished) {
    st.closed.push(i);
    if (s.options.every((_, k) => st.closed.includes(k) || !optionOpen(g, s, k))) {
      spent = true;
      if (s.fallback) { const f = applyEffect(g, s.fallback, who); r.lines.push(...f.lines); r.items.push(...f.items); r.fight ??= f.fight; }
      if (r.fight) finished = true;
      else r.lines.push(RETRY);
    }
  }
  const lines = [`${o.label}${who && (o.attr || o.ally || o.cls || o.species) ? ` (${who.name})` : ''}.`, ...(o.cost ? [`Pagáis ${o.cost} monedas de oro.`] : []), ...(rolls.length ? [ok ? '¡Lo consigue!' : 'No lo consigue: esa vía queda cerrada.'] : []), ...r.lines];
  // Lo que pasó se guarda para poder releerlo al volver a pisar la casilla.
  if (finished) st.said = lines;
  if (r.fight) st.fight = r.fight;
  g.scenes = { ...g.scenes, [id]: st };
  if (finished && !g.done.includes(id)) g.done.push(id);
  evs.push({ kind: 'msg', title: s.title, img: s.img, rolls: rolls.length ? rolls : undefined, items: r.items.length ? r.items : undefined, lines, save: true });
  // El resultado de cada escena queda en el registro (el autor 2026-11-06).
  logEvs(g, evs);
  // Lo que se acaba de descubrir se enseña en el mapa antes de seguir (y antes del combate, si lo hay).
  for (const f of g.found.slice(found0)) evs.push({ kind: 'look', id: f });
  // Un compañero comenta la decisión, si tiene algo que decir (antes del combate, si lo hay).
  const said = o.tone && finished ? toneLine(g, o.tone) : undefined;
  if (said) evs.push(said);
  if (r.fight) evs.push({ kind: 'combat', id: r.fight });
  else if (!finished && !spent) evs.push({ kind: 'scene', id });
  return evs;
}

/** Frase de un compañero en pie (no el héroe) sobre una decisión de ese tono. */
function toneLine(g: Game, tone: Tone): Ev | undefined {
  const who = g.party.filter(c => !c.isHero && !isDown(c) && TONE_LINES[c.id]);
  if (!who.length) return undefined;
  const c = pick(g.rng, who);
  return { kind: 'dialogue', lines: [{ speaker: c.id, text: TONE_LINES[c.id][tone] }] };
}

const RETRY = 'Tras un descanso largo en la posada podréis volver a intentarlo.';

/** Prueba con todas sus vías falladas: se queda en el mapa hasta el próximo descanso largo en la posada. */
export function sceneSpent(g: Game, id: string): boolean {
  const s = sceneById(id);
  const closed = g.scenes?.[id]?.closed ?? [];
  return !!s && !s.decision && !g.done.includes(id) && closed.length > 0 && s.options.every((_, k) => closed.includes(k) || !optionOpen(g, s, k));
}

/** Descanso largo en la posada: se reabren las vías falladas de las pruebas sin resolver. Devuelve cuántas había agotadas. */
export function reopenScenes(g: Game): number {
  let n = 0;
  for (const [id, st] of Object.entries(g.scenes ?? {})) {
    if (g.done.includes(id) || !st.closed.length) continue;
    if (sceneSpent(g, id)) n++;
    g.scenes = { ...g.scenes, [id]: { ...st, closed: [] } };
  }
  return n;
}

/** Mensaje al pisar una prueba agotada. */
export const spentMsg = (id: string): Ev => ({ kind: 'msg', title: sceneById(id)!.title, img: sceneById(id)!.img, lines: ['Ya habéis probado todas las formas.', RETRY] });

/** Dejar la escena para luego: una prueba se puede retomar volviendo a su casilla. */
export function leaveScene(g: Game, id: string): string {
  const s = sceneById(id)!;
  return s.decision ? 'Seguís adelante.' : 'Lo dejáis por ahora. Podéis volver a intentarlo más tarde.';
}
