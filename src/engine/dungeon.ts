// Exploración del plano hexagonal: niebla, movimiento y lo que pasa al pisar cada casilla.
import P from '../data/plano.json';
import { ADVS, ADV_LIST, Design, advOf, speaker } from './aventuras';
import type { ImgKey } from '../assets';
import { DESIGN_ITEM, ITEMS } from '../data/srd';
import { die, pick, roll } from './rng';
import {
  Char, MAX_ITEMS, abilMod, allyFor, createAlly, isDown, newItem, passivePerception, sightRadius, shortRest, longRest, needsRest,
} from './rules';
import type { Game } from './game';

export type Hex = [number, number];
export const hkey = (h: Hex) => `${h[0]},${h[1]}`;
export const DIRS: Hex[] = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
export const hdist = (a: Hex, b: Hex) => (Math.abs(a[0] - b[0]) + Math.abs(a[0] + a[1] - b[0] - b[1]) + Math.abs(a[1] - b[1])) / 2;
export const neighbors = (h: Hex): Hex[] => DIRS.map(d => [h[0] + d[0], h[1] + d[1]]);

export interface Mark { q: number; r: number; kind: string; id: string; path?: string[] }
interface ZonePlan { rooms: string[]; start: Hex; cells: [number, number, number][]; marks: Mark[] }
const PLAN = P.zones as unknown as Record<string, ZonePlan>;

export type Zone = Design['zones'][number];
export type Room = Zone['rooms'][number];
type Content = Room['contents'][number] & Record<string, any>;

const ZONES = ADV_LIST.flatMap(a => a.data.zones);
export const ZONE_IDS = ZONES.map(z => z.id);
export const zoneById = (id: string) => ZONES.find(z => z.id === id)!;
export const plan = (zone: string) => PLAN[zone];
export const zoneArt = (z: string) => ADVS[advOf(z)].art[z];

const allContents = (): { zone: string; room: Room; c: Content }[] =>
  ZONES.flatMap(z => z.rooms.flatMap(room => room.contents.map(c => ({ zone: z.id, room, c: c as Content }))));
const CONTENTS = allContents();
/** Secretos que tienen pista (una prueba en el mapa): esos no los encuentra la percepción pasiva. */
const CLUED = new Set(CONTENTS.filter(x => x.c.type === 'scene' && x.c.reveals).map(x => x.c.reveals as string));

export const contentById = (id: string) => CONTENTS.find(x => x.c.id === id);
export const encounterById = (id: string) => {
  const c = contentById(id)?.c;
  return c?.type === 'encounter' ? (c as Content & { enemies: any[]; xp_total: number; gold_drop: number; can_reinforce: string[]; trigger: string }) : undefined;
};

/** Encuentro del jefe final de la aventura de esa zona. */
export const bossEncounter = (zone: string) =>
  CONTENTS.find(x => advOf(x.zone) === advOf(zone) && x.c.type === 'encounter' && x.c.enemies.some((e: any) => e.srd_creature === ADVS[advOf(zone)].boss))!.c.id as string;

/** Encuentros que entran al empezar el combate y los que pueden llegar como refuerzo. */
export function encounterGroup(g: Game, id: string): { now: string[]; later: string[] } {
  const room = contentById(id)!.room;
  const open = (x: string) => !g.done.includes(x);
  const encs = CONTENTS.filter(x => x.c.type === 'encounter' && open(x.c.id));
  // En la misma sala, los que se refuerzan entre sí luchan juntos desde el principio (sala del jefe).
  const now = [id, ...encs.filter(x => x.room === room && x.c.id !== id && (x.c.can_reinforce.includes(id) || encounterById(id)!.can_reinforce.includes(x.c.id))).map(x => x.c.id)];
  const later = encs.filter(x => !now.includes(x.c.id) && now.some(n => x.c.can_reinforce.includes(n))).map(x => x.c.id);
  return { now, later };
}

export function cellMap(zone: string): Map<string, number> {
  return new Map(plan(zone).cells.map(([q, r, room]) => [`${q},${r}`, room]));
}

/** Decorados que se pisan: los del suelo (raíles, puente) y los que se cruzan por debajo (árboles, que se ven por encima del grupo). */
export const FLOOR_PROPS = new Set(['stairs', 'rails', 'bridge', 'walkway']);
export const OVER_PROPS = new Set(['big_tree', 'pine']);
const isObstacle = (m: Mark) => m.kind === 'prop' && !FLOOR_PROPS.has(m.id) && !OVER_PROPS.has(m.id);
/** El agua bajo un puente es suelo de fondo: el puente permite cruzarla. */
export const bridgedWater = (zone: string, m: Mark) => m.kind === 'prop' && m.id === 'water'
  && plan(zone).marks.some(o => o.kind === 'prop' && (o.id === 'bridge' || o.id === 'walkway') && o.q === m.q && o.r === m.r);
const BLOCKED = new Map<string, Set<string>>();

/**
 * Casillas de decorado que no se pisan (columnas, vagonetas, agua...). Solo se bloquea
 * un decorado si no deja aislada ninguna casilla, con o sin los pasadizos secretos abiertos.
 */
export function blockedCells(zone: string): Set<string> {
  const cached = BLOCKED.get(zone);
  if (cached) return cached;
  const p = plan(zone);
  const cells = p.cells.map(([q, r]) => `${q},${r}`);
  // Sin secretos ni rejas abiertas (lo más cerrado) y con todo abierto: ningún decorado puede aislar casillas en ninguno de los dos casos.
  const secret = new Set([...p.marks.filter(m => m.kind === 'secret').flatMap(m => m.path ?? []), ...p.marks.filter(m => m.kind === 'gate').map(m => `${m.q},${m.r}`)]);
  const reach = (blocked: Set<string>, secrets: boolean) => {
    const ok = new Set(cells.filter(k => !blocked.has(k) && (secrets || !secret.has(k))));
    const seen = new Set([hkey(p.start)]);
    const q = [p.start];
    while (q.length) for (const n of neighbors(q.shift()!)) {
      const k = hkey(n);
      if (ok.has(k) && !seen.has(k)) { seen.add(k); q.push(n); }
    }
    return seen;
  };
  const base = [reach(new Set(), false), reach(new Set(), true)];
  const blocked = new Set<string>();
  for (const m of p.marks.filter(m => isObstacle(m) && !bridgedWater(zone, m))) {
    const k = `${m.q},${m.r}`;
    if (k === hkey(p.start) || p.marks.some(o => !isObstacle(o) && o.kind !== 'prop' && `${o.q},${o.r}` === k)) continue;
    const trial = new Set([...blocked, k]);
    const keeps = [false, true].every((s, i) => { const r = reach(trial, s); return [...base[i]].every(c => trial.has(c) || r.has(c)); });
    if (keeps) blocked.add(k);
  }
  BLOCKED.set(zone, blocked);
  return blocked;
}

/** Casillas por las que se puede andar (los pasadizos secretos solo cuando se han descubierto). */
export function passable(g: Game, zone: string): Set<string> {
  const p = plan(zone);
  const hidden = new Set<string>(blockedCells(zone));
  for (const m of p.marks) if (m.kind === 'secret' && !g.found.includes(m.id)) m.path?.forEach(k => hidden.add(k));
  // Reja cerrada (se abre con una palanca del otro lado).
  for (const m of p.marks) if (m.kind === 'gate' && !g.done.includes(m.id)) hidden.add(`${m.q},${m.r}`);
  return new Set(p.cells.map(([q, r]) => `${q},${r}`).filter(k => !hidden.has(k)));
}

/**
 * Obstáculos que no se cruzan mientras sigan cerrados (puerta atascada, telaraña, puente roto...): casilla → cofre.
 * Se dejan fuera los que cortarían el paso a la salida, la llave o el jefe, para no dejar la zona sin salida.
 */
const DOORS = new Map<string, Map<string, string>>();
function doorCells(zone: string): Map<string, string> {
  const cached = DOORS.get(zone);
  if (cached) return cached;
  const p = plan(zone);
  const secret = new Set(p.marks.filter(m => m.kind === 'secret').flatMap(m => m.path ?? []));
  const ok = new Set(p.cells.map(([q, r]) => `${q},${r}`).filter(k => !blockedCells(zone).has(k) && !secret.has(k)));
  const boss = bossEncounter(zone);
  const need = [...p.marks.filter(m => m.kind === 'exit' || m.id === boss).map(m => `${m.q},${m.r}`), keyCell(zone)].filter(Boolean) as string[];
  const doors = new Map<string, string>();
  for (const m of p.marks.filter(m => m.kind === 'chest' && contentById(m.id)?.c.obstacle)) {
    const k = `${m.q},${m.r}`;
    const seen = new Set([hkey(p.start)]);
    const q = [p.start];
    while (q.length) for (const n of neighbors(q.shift()!)) {
      const nk = hkey(n);
      if (nk !== k && ok.has(nk) && !seen.has(nk)) { seen.add(nk); q.push(n); }
    }
    if (need.every(c => seen.has(c))) doors.set(k, m.id);
  }
  DOORS.set(zone, doors);
  return doors;
}

/** Obstáculos aún cerrados de la zona actual: solo se puede intentar abrirlos, no pasar por ellos. */
export function closedDoors(g: Game): Map<string, string> {
  return new Map([...doorCells(g.zone)].filter(([, id]) => !g.done.includes(id) && chestVisible(g, id)));
}

export function visibleCells(g: Game, reveal = false): Set<string> {
  const pass = passable(g, g.zone);
  // Sin niebla (modo desarrollador): todo el plano, con sus decorados y los muros de alrededor.
  if (reveal) return new Set(plan(g.zone).cells.flatMap(([q, r]) => [hkey([q, r]), ...neighbors([q, r]).map(hkey)]));
  const rad = sightRadius(g.party);
  const vis = new Set<string>(g.visited);
  let frontier = [...g.visited];
  for (let i = 0; i < rad; i++) {
    const next: string[] = [];
    for (const k of frontier) {
      const h = k.split(',').map(Number) as Hex;
      for (const n of neighbors(h)) {
        const nk = hkey(n);
        if (!vis.has(nk)) { vis.add(nk); if (pass.has(nk)) next.push(nk); }
      }
    }
    frontier = next;
  }
  // Enseña la pared exterior detrás del suelo visible, aunque un decorado bloquee
  // la visión. Solo se añade el contorno fuera del plano: no revela otras casillas,
  // salas ni pasadizos secretos, y no cambia por dónde se puede andar.
  const cells = cellMap(g.zone);
  for (const k of [...vis]) {
    if (!cells.has(k)) continue;
    for (const n of neighbors(k.split(',').map(Number) as Hex)) {
      const nk = hkey(n);
      if (!cells.has(nk)) vis.add(nk);
    }
  }
  return vis;
}

/** Camino más corto por casillas conocidas y transitables (BFS). */
export function findPath(g: Game, to: Hex, reveal = false): Hex[] | null {
  const pass = passable(g, g.zone);
  const vis = visibleCells(g, reveal);
  const goal = hkey(to);
  if (!pass.has(goal) || !vis.has(goal)) return null;
  const doors = closedDoors(g);
  const prev = new Map<string, string>();
  const q = [hkey(g.pos)];
  prev.set(q[0], '');
  while (q.length) {
    const k = q.shift()!;
    if (k === goal) break;
    for (const n of neighbors(k.split(',').map(Number) as Hex)) {
      const nk = hkey(n);
      if (!prev.has(nk) && pass.has(nk) && vis.has(nk) && (!doors.has(nk) || nk === goal)) { prev.set(nk, k); q.push(nk); }
    }
  }
  if (!prev.has(goal)) return null;
  const path: Hex[] = [];
  for (let k = goal; k && k !== hkey(g.pos); k = prev.get(k)!) path.unshift(k.split(',').map(Number) as Hex);
  return path;
}

/** Tirada que se enseña en una ventana: d20 + bonificador contra una CD. */
export interface ShownRoll { d20: number; bonus: number; dc: number; ok: boolean; text: string }
/**
 * Camino hacia una casilla aún desconocida: va a la casilla conocida que más se le acerca.
 * Devuelve null si no hay forma de acercarse más.
 */
export function pathToward(g: Game, goal: Hex, reveal = false): Hex[] | null {
  const pass = passable(g, g.zone);
  const vis = visibleCells(g, reveal);
  const doors = closedDoors(g);
  const prev = new Map<string, string>([[hkey(g.pos), '']]);
  const q = [hkey(g.pos)];
  let best = hkey(g.pos);
  let bestD = hdist(g.pos, goal);
  while (q.length) {
    const k = q.shift()!;
    const d = hdist(k.split(',').map(Number) as Hex, goal);
    if (d < bestD) { best = k; bestD = d; }
    for (const n of neighbors(k.split(',').map(Number) as Hex)) {
      const nk = hkey(n);
      if (!prev.has(nk) && pass.has(nk) && vis.has(nk) && !doors.has(nk)) { prev.set(nk, k); q.push(nk); }
    }
  }
  if (best === hkey(g.pos)) return null;
  const path: Hex[] = [];
  for (let k = best; k && k !== hkey(g.pos); k = prev.get(k)!) path.unshift(k.split(',').map(Number) as Hex);
  return path;
}

export type DialogueLine = { speaker: string; text: string };
export type Ev =
  | { kind: 'combat'; id: string }
  | { kind: 'dialogue'; lines: DialogueLine[] }
  | { kind: 'msg'; title: string; lines: string[]; table?: [string, string][]; intro?: string; bg?: ImgKey; img?: ImgKey; img2?: ImgKey; items?: ImgKey[]; portrait?: ImgKey; rolls?: ShownRoll[]; save?: boolean }
  | { kind: 'rest'; id: string; long: boolean; name: string; text: string }
  | { kind: 'scene'; id: string }
  /** Grupo lleno al unirse un aliado: hay que elegir quién vuelve a la posada. */
  | { kind: 'swap'; ally: string }
  | { kind: 'zone'; to: string }
  | { kind: 'back' };

const marksAt = (zone: string, k: string) => plan(zone).marks.filter(m => `${m.q},${m.r}` === k);
const roomOf = (zone: string, idx: number) => zoneById(zone).rooms[idx];

const bestPerception = (party: Char[]) => Math.max(...party.filter(c => !isDown(c)).map(passivePerception));

/** Se mueve una casilla y devuelve lo que ocurre, en orden. */
/** Pisa una casilla. `free` (modo desarrollador) entra aunque haya un obstáculo cerrado. */
export function step(g: Game, to: Hex, free = false): Ev[] {
  const k = hkey(to);
  // Obstáculo cerrado: se intenta abrir desde fuera y, si no cede, el grupo se queda donde estaba.
  const door = free ? undefined : closedDoors(g).get(k);
  const tried = door ? obstacle(g, door, contentById(door)!.c.obstacle as Obstacle) : undefined;
  if (tried && !tried.open) {
    g.note = undefined;
    logEvs(g, [tried.ev]);
    return [tried.ev];
  }
  g.prev = g.pos;
  g.pos = to;
  const first = !g.visited.includes(k);
  if (first) g.visited.push(k);
  g.note = note(g, k, first);
  const evs: Ev[] = [];
  // Botín único del corredor secreto de Hondaroca. Se deposita en una casilla
  // transitable del propio pasadizo y se recoge mediante el sistema normal de suelo.
  secretPotions(g);
  const corridorReward = 'z2_s01_reward';
  if (g.zone === 'z2' && g.found.includes('z2_s01') && !g.done.includes(corridorReward)) {
    const rewardCell = 'z2:3,9';
    g.drops = { ...g.drops, [rewardCell]: [...(g.drops?.[rewardCell] ?? []), newItem('potion_greater_healing_1')] };
    g.done.push(corridorReward);
  }
  const roomIdx = cellMap(g.zone).get(k) ?? -1;
  const room = roomIdx >= 0 ? roomOf(g.zone, roomIdx) : undefined;
  if (room && !g.done.includes(room.id)) {
    g.done.push(room.id);
    evs.push(...enterRoom(g, room));
  }
  if (hkey(g.prev) !== k && atEntrance(g)) return [{ kind: 'back' }];
  for (const m of marksAt(g.zone, k)) {
    if (m.kind === 'chest' && g.chestLeft?.[m.id]?.length) evs.push(chestLeftovers(g, m.id));
    const fled = m.kind === 'scene' ? sceneFight(g, m.id) : undefined;
    if (fled && !evs.some(x => x.kind === 'combat')) evs.push({ kind: 'combat', id: fled });
    if (g.done.includes(m.id)) continue;
    if (m.kind === 'scene' && sceneOn(g, m.id)) evs.push({ kind: 'scene', id: m.id });
    if (m.kind === 'lever') evs.push(...lever(g, m.id));
    if (m.kind === 'trap') evs.push(trap(g, m.id));
    if (m.kind === 'chest' && chestVisible(g, m.id)) {
      // Cofre tras un obstáculo (puente roto, telaraña, losa...): hace falta un objeto o, a veces, una tirada.
      const o = contentById(m.id)!.c.obstacle as Obstacle | undefined;
      const pass = o ? (m.id === door ? tried : obstacle(g, m.id, o)) : undefined;
      if (pass) evs.push(pass.ev);
      if (!o || pass?.open) evs.push(chest(g, m.id));
    }
    if (m.kind === 'rest') {
      const c = contentById(m.id)!.c;
      // Si nadie vivo lo necesita, solo un aviso y el descanso no se gasta (descansar no resucita).
      if (!needsRest(g.party, c.rest === 'long')) g.note = 'Nadie necesita descansar ahora. Este descanso seguirá aquí para cuando haga falta.';
      else evs.push({ kind: 'rest', id: m.id, long: c.rest === 'long', name: c.name, text: restText(g.zone, m.id, c.description) });
    }
    if (m.kind === 'exit') {
      // Queda un aliado sin encontrar: la primera vez se avisa y no se sale (pisar otra vez la salida para seguir).
      const warn = `${g.zone}_allywarn`;
      const left = pendingAllies(g);
      if (left.length && !g.done.includes(warn)) {
        g.done.push(warn);
        evs.push({ kind: 'msg', title: 'Una voz a lo lejos', portrait: left[0].img, lines: [
          'Antes de seguir, oís a alguien pedir ayuda en algún rincón de esta zona que aún no habéis recorrido.',
          'Podéis volver a buscarle o seguir adelante pisando otra vez la salida.'] });
        continue;
      }
      // Cerrada: solo un aviso, sin parar la marcha (la casilla puede estar de paso hacia otras salas).
      const lock = exitLock(g);
      if (lock?.closed) { g.note = lock.text; continue; }
      if (lock?.ev) evs.push(lock.ev);
      const sum = zoneSummary(g);
      if (sum) evs.push(sum);
      evs.push({ kind: 'zone', to: m.id });
    }
  }
  if (k === keyCell(g.zone) && !g.done.includes(`${g.zone}_key`)) evs.push(findKey(g));
  // Encuentros "al entrar": se activan al pisar su casilla o una contigua.
  for (const m of plan(g.zone).marks) {
    if (m.kind !== 'encounter' || g.done.includes(m.id)) continue;
    const e = encounterById(m.id)!;
    const d = hdist([m.q, m.r], to);
    const near = g.fled.includes(m.id) ? d === 0 : d <= 1;
    // "A la vista": al cargar una partida la sala ya consta como visitada, así que también salta al acercarse o dentro de su sala.
    const seen = e.trigger === 'seen' && !g.fled.includes(m.id) && (d <= 1 || !!(room?.contents as Content[] | undefined)?.some(c => c.id === m.id));
    if ((seen || (near && (e.trigger === 'enter' || g.fled.includes(m.id)))) && !evs.some(x => x.kind === 'combat')) evs.push({ kind: 'combat', id: m.id });
  }
  logEvs(g, evs);
  return evs;
}

/**
 * Áreas que se abren con una decisión: cada una guarda una poción de curación en el suelo (el autor 2026-11-10).
 * Va en una casilla libre del propio pasadizo, la más honda, y se recoge con el sistema normal de suelo.
 */
export function secretPotions(g: Game) {
  for (const m of plan(g.zone).marks) {
    const done = `${m.id}_potion`;
    if (m.kind !== 'secret' || !m.path?.length || !g.found.includes(m.id) || g.done.includes(done)) continue;
    const taken = new Set(plan(g.zone).marks.filter(o => o.kind !== 'secret').map(o => `${o.q},${o.r}`));
    const cell = [...m.path].reverse().find(k => !taken.has(k)) ?? m.path[m.path.length - 1];
    const k = `${g.zone}:${cell}`;
    g.drops = { ...g.drops, [k]: [...(g.drops?.[k] ?? []), newItem('potion_healing')] };
    g.done.push(done);
  }
}

/** Combate de una escena del que se huyó: se queda en la casilla de la escena hasta vencerlo (el autor 2026-11-10). */
export const sceneFight = (g: Game, sceneId: string): string | undefined => {
  const f = g.scenes?.[sceneId]?.fight;
  return f && g.fled.includes(f) && !g.done.includes(f) && !encounterCell(f) ? f : undefined;
};

/** Posición fija del grupo enemigo. También corrige marcadores de partidas anteriores. */
export function encounterCell(id: string): string | undefined {
  const content = contentById(id);
  if (!content) return undefined;
  const m = plan(content.zone).marks.find(x => x.kind === 'encounter' && x.id === id);
  return m ? `${m.q},${m.r}` : undefined;
}

/** Cada grupo conserva su marcador en su casilla de origen, incluidos los refuerzos. */
export function wonCell(g: Game, id: string): string | undefined {
  if (!g.done.includes(id) || (g.fallen?.[id] && !Object.keys(g.fallen[id]).length)) return undefined;
  return encounterCell(id) ?? g.wonAt?.[id];
}

/** Los que cayeron en los combates ganados en esta casilla, con su número. */
function wonHere(g: Game, k: string): string[] {
  const out: string[] = [];
  for (const m of plan(g.zone).marks) {
    if (m.kind !== 'encounter' || wonCell(g, m.id) !== k) continue;
    // Solo los que cayeron; las partidas antiguas no lo apuntaban y se dan todos por caídos.
    const fell = g.fallen?.[m.id];
    out.push(...(fell ? Object.entries(fell).map(([name, n]) => (n > 1 ? `${name} ×${n}` : name))
      : (encounterById(m.id)?.enemies ?? []).map((e: any) => (e.count > 1 ? `${e.name} ×${e.count}` : e.name))));
  }
  return out;
}

/** Aviso corto para casillas que ya no hacen nada pero tienen dibujo. */
function note(g: Game, k: string, first: boolean): string | undefined {
  for (const m of marksAt(g.zone, k)) {
    if (m.kind === 'door' && first) return 'Abrís la puerta y pasáis.';
    if (m.kind === 'gate' && first) return 'Pasáis bajo la reja de los turnos.';
    if (m.kind === 'lever' && g.done.includes(m.id)) return 'La palanca de la reja, ya bajada.';
    if (m.kind === 'scene' && g.done.includes(m.id) && !sceneFight(g, m.id)) return 'Aquí ya no queda nada por hacer.';
    if (m.kind === 'thicket' && first) return 'Os abrís paso entre la espesura.';
    if (m.kind === 'trap' && g.done.includes(m.id)) return `Aquí estaba la trampa: ${contentById(m.id)!.c.name}.`;
    if (m.kind === 'secret' && g.found.includes(m.id)) return 'Losa del pasadizo secreto que encontrasteis.';
    if (m.kind === 'chest' && g.done.includes(m.id) && !g.chestLeft?.[m.id]?.length) return 'El cofre ya está vacío.';
    if (m.kind === 'rest' && g.done.includes(m.id)) return 'Aquí ya descansasteis.';
  }
  // Combates ganados: se recuerdan en la casilla donde se luchó (el autor 2026-11-06).
  const won = wonHere(g, k);
  if (won.length) return `Aquí vencisteis a: ${won.join(', ')}.`;
  return undefined;
}


/** Apunta en el registro lo que va pasando. */
export function logEvs(g: Game, evs: Ev[]) {
  for (const e of evs) {
    if (e.kind === 'msg') g.log.push(`${e.title}: ${[e.intro, ...(e.rolls ?? []).map(rollText), ...e.lines].filter(Boolean).join(' ')}`);
    if (e.kind === 'dialogue') for (const l of e.lines) {
      const who = l.speaker === 'hero' ? g.party.find(c => c.isHero)!.name : speaker(l.speaker).name;
      g.log.push(who ? `${who}: «${l.text}»` : l.text);
      (g.diary ??= []).push({ a: advOf(g.zone), s: l.speaker, t: l.text });
    }
  }
  if (g.log.length > 300) g.log.splice(0, g.log.length - 300);
}

export const rollText = (r: ShownRoll) => `${r.text}: ${r.d20}${r.bonus >= 0 ? '+' : ''}${r.bonus} = ${r.d20 + r.bonus} contra CD ${r.dc}, ${r.ok ? 'éxito' : 'fallo'}.`;

/** En El Invierno del Dragón, al entrar en el bosque los kobolds apresan a un aliado; se le rescata en el círculo de las trampas. */
const CAPTURE = { zone: 'm2', free: 'm2_r10', escape: 'm3' };

function capture(g: Game): Ev[] {
  const c = [...g.party].reverse().find(p => !p.isHero && !p.dead);
  if (!c || g.captive) return [];
  g.party = g.party.filter(p => p !== c);
  g.captive = c;
  const first = c.name.replace(/^(Hermano|Hermana|Dama|Maese) /, '').split(' ')[0];
  return [
    { kind: 'dialogue', lines: [{ speaker: 'narrator', text: `Una red cae de los pinos. Cuando conseguís cortarla, ${first} ya no está.` }, { speaker: 'hero', text: `Se lo han llevado a rastras: hay huellas de kobold. Iremos a por ${first}.` }] },
    { kind: 'msg', title: 'Aliado apresado', portrait: c.img, lines: [`Los kobolds se han llevado a ${c.name}. Buscad su campamento en este bosque para rescatarle.`] },
  ];
}

function rescue(g: Game, escaped: boolean): Ev[] {
  const c = g.captive;
  if (!c) return [];
  delete g.captive;
  g.party.push(c);
  const evs: Ev[] = escaped
    ? [{ kind: 'msg', title: 'De vuelta', portrait: c.img, lines: [`${c.name} se ha escapado de los kobolds y os alcanza en el camino.`] }]
    : [{ kind: 'dialogue', lines: [{ speaker: c.id, text: 'Sabía que vendríais. Sacadme de esta jaula y sigamos.' }] },
      { kind: 'msg', title: 'Aliado rescatado', portrait: c.img, lines: [`Abrís la jaula: ${c.name} vuelve al grupo.`] }];
  if (g.party.length > 4) evs.push({ kind: 'swap', ally: c.id });
  return evs;
}

function enterRoom(g: Game, room: Room): Ev[] {
  const evs: Ev[] = [];
  if (room.id === CAPTURE.free) evs.push(...rescue(g, false));
  const adv = ADVS[advOf(g.zone)];
  const pp = bestPerception(g.party);
  for (const c of room.contents as Content[]) {
    // Aviso al entrar si nadie lleva lo que conviene (antídoto en el nido de arañas…).
    // Si ya se lleva, el aviso se da igual pero recordando usarlo (text_ok).
    if (c.type === 'notice') {
      const has = g.party.some(p => !isDown(p) && p.items.some(i => (c.needs ?? []).includes(i.id)));
      if (!has || c.text_ok) evs.push({ kind: 'msg', title: c.title, img: c.img, lines: [has ? c.text_ok : c.text] });
    }
    // Los secretos con pista se buscan con una prueba (una escena en el mapa), no con la percepción pasiva.
    if (c.type === 'secret' && !CLUED.has(c.id) && !g.found.includes(c.id) && pp >= c.detect_dc) {
      g.found.push(c.id);
      evs.push({ kind: 'msg', title: 'Secreto descubierto', img: 'losa_secreta', lines: [c.description,
        c.reveals?.startsWith('chest:') ? 'Dentro hay un cofre escondido: ya lo veis en el mapa.' : 'Se abre un pasadizo secreto: ya aparece en el mapa.',
        `(Percepción pasiva ${pp} contra CD ${c.detect_dc})`] });
    }
    if (c.type === 'ally') {
      const hero = g.party.find(x => x.isHero)!;
      const id = allyFor(hero.cls, c.default_ally, adv.id);
      if (!g.party.some(p => p.id === id)) {
        const ally = createAlly(id, hero.level, hero.xp, adv.id);
        const sight = sightRadius(g.party);
        g.party.push(ally);
        const lines = [`${ally.name} se une al grupo (nivel ${ally.level}).`, 'Mantén pulsada su carta para verla en grande y tócala para girarla.'];
        if (sightRadius(g.party) > sight) lines.push(`${ally.name} ${ally.cls === 'cleric' || ally.cls === 'wizard' ? 'conoce el truco Luz' : 'lleva una antorcha'}: ahora veis dos casillas a vuestro alrededor.`);
        evs.push({ kind: 'dialogue', lines: id === adv.sub && c.default_ally !== adv.sub ? c.brunna_scene : c.default_scene });
        evs.push({ kind: 'msg', title: 'Nuevo aliado', portrait: ally.img, lines });
        if (g.chosen && !g.chosen.includes(id)) g.chosen = [...g.chosen, id];
        // El compañero de otra aventura que venía escoltando al héroe vuelve ahora al pueblo.
        const esc = g.escort ? g.party.find(p => p.id === g.escort) : undefined;
        if (esc) {
          g.party = g.party.filter(p => p !== esc);
          g.bench = [...(g.bench ?? []), esc];
          delete g.escort;
          evs.push({ kind: 'dialogue', lines: [{ speaker: esc.id, text: `Ya no me necesitas: estás en buenas manos. Vuelvo al pueblo, nos vemos allí.` }] });
          evs.push({ kind: 'msg', title: 'Despedida', portrait: esc.img, lines: [`${esc.name} vuelve al pueblo y os esperará allí.`, ...handOver(g, esc)] });
        }
        // Más de cuatro: se elige quién vuelve a la posada (el que se acaba de unir se queda).
        if (g.party.length > 4) evs.push({ kind: 'swap', ally: id });
      }
    }
    if (c.type === 'dialogue') {
      // Comentarios de un aliado de otra aventura: solo si va en el grupo.
      if (c.only && !g.party.some(p => p.id === c.only && !p.dead)) continue;
      evs.push({ kind: 'dialogue', lines: c.lines });
      // Regalo de quien habla si nadie lleva ya algo que sirva (la abuela da un antídoto antes de las arañas).
      const gift = c.gift as { item: string; unless: string[]; text: string } | undefined;
      if (gift && !g.party.some(p => !p.dead && p.items.some(i => gift.unless.includes(i.id)))) {
        const speakerId = c.lines.find((l: any) => l.speaker !== 'hero' && l.speaker !== 'narrator')?.speaker ?? 'narrator';
        evs.push({ kind: 'dialogue', lines: [{ speaker: speakerId, text: gift.text }] });
        const who = giveItem(g, gift.item);
        if (who) evs.push({ kind: 'msg', title: ITEMS[gift.item].name, items: [ITEMS[gift.item].img], lines: [`${who.name} guarda: ${ITEMS[gift.item].name}.`], save: true });
        else { const k = dropKey(g); g.drops = { ...g.drops, [k]: [...(g.drops?.[k] ?? []), newItem(gift.item)] }; evs.push({ kind: 'msg', title: ITEMS[gift.item].name, items: [ITEMS[gift.item].img], lines: ['No cabe en las mochilas: queda en el suelo.'] }); }
      }
    }
  }
  const boss = (room.contents as Content[]).find(c => c.type === 'encounter' && c.enemies.some((e: any) => e.srd_creature === adv.boss));
  if (boss && !g.done.includes(boss.id)) {
    const hero = g.party.find(x => x.isHero)!;
    const brunnaVersion = adv.id === 'hondaroca' && hero.cls === 'wizard' && !g.party.some(p => p.id === 'liss');
    evs.push({ kind: 'dialogue', lines: brunnaVersion ? adv.data.boss.pre_boss_dialogue_brunna : adv.data.boss.pre_boss_dialogue });
  }
  const seen = (room.contents as Content[]).find(c => c.type === 'encounter' && c.trigger === 'seen' && !g.done.includes(c.id) && !g.fled.includes(c.id));
  if (seen) evs.push({ kind: 'combat', id: seen.id });
  else if (boss && !g.done.includes(boss.id)) evs.push({ kind: 'combat', id: boss.id });
  return evs;
}

// Llaves de zona: la salida hacia la zona siguiente está cerrada y su llave espera en la sala más alejada
// del camino (sin contar pasadizos secretos), para que haya que explorar cada mapa.
const KEY_ROOM = new Map<string, string | undefined>();
export function keyRoom(zone: string): string | undefined {
  if (KEY_ROOM.has(zone)) return KEY_ROOM.get(zone);
  const rooms = zoneById(zone).rooms;
  const ids = new Set(rooms.map(r => r.id));
  const outward = (r: Room) => r.exits.some(e => !ids.has(e.to) && e.to.split('_')[0] > zone);
  let best: string | undefined;
  if (rooms.some(outward)) {
    const dist = new Map([[rooms[0].id, 0]]);
    const q = [rooms[0].id];
    while (q.length) {
      const id = q.shift();
      const r = rooms.find(x => x.id === id)!;
      for (const e of r.exits) if (e.type !== 'secret' && ids.has(e.to) && !dist.has(e.to)) { dist.set(e.to, dist.get(r.id)! + 1); q.push(e.to); }
    }
    let far = -1;
    for (const r of rooms) if (!outward(r) && (dist.get(r.id) ?? -1) >= far) { far = dist.get(r.id)!; best = r.id; }
  }
  KEY_ROOM.set(zone, best);
  return best;
}

/** Casilla libre de la sala de la llave más alejada de la entrada: ahí se dibuja y se recoge. */
const KEY_CELL = new Map<string, string | undefined>();
export function keyCell(zone: string): string | undefined {
  if (KEY_CELL.has(zone)) return KEY_CELL.get(zone);
  const room = keyRoom(zone);
  const p = plan(zone);
  const idx = zoneById(zone).rooms.findIndex(r => r.id === room);
  const taken = new Set(p.marks.map(m => `${m.q},${m.r}`));
  const free = p.cells.filter(([q, r, i]) => i === idx && !taken.has(`${q},${r}`) && `${q},${r}` !== hkey(p.start));
  const best = free.sort((a, b) => hdist([b[0], b[1]], p.start) - hdist([a[0], a[1]], p.start))[0];
  const k = room && best ? `${best[0]},${best[1]}` : undefined;
  KEY_CELL.set(zone, k);
  return k;
}

export const KEY_ITEM = (zone: string) => (advOf(zone) === 'corazon_hueco' ? 'bark_amulet' : 'zone_key');

function findKey(g: Game): Ev {
  g.done.push(`${g.zone}_key`);
  const id = KEY_ITEM(g.zone);
  const who = giveItem(g, id);
  const lines = [id === 'zone_key'
    ? 'Recogéis la llave de hierro. Abrirá la salida cerrada de esta zona.'
    : 'Los antiguos vigilantes del Corazón dejaron amuletos de corteza para cruzar los muros. Uno cuelga de esta raíz: su runa aún funciona.'];
  if (who) lines.push(`${who.name} guarda: ${ITEMS[id].name}.`);
  else {
    // Sin sitio en las mochilas: la llave se queda en el suelo de esta casilla.
    const k = dropKey(g);
    g.drops = { ...g.drops, [k]: [...(g.drops?.[k] ?? []), newItem(id)] };
    lines.push('No hay sitio en las mochilas: queda en el suelo. Deja algo en el suelo (toca una carta del grupo) y recógela; lo que sobre lo puedes vender en la tienda del pueblo.');
  }
  return { kind: 'msg', title: ITEMS[id].name, items: [ITEMS[id].img], lines, save: true };
}

/** Si la salida de la zona sigue cerrada: la abre con la llave (y la gasta) o avisa de que falta. */
/** Aliados de la zona que aún no se han unido: casilla donde se marcan (centro de su sala) y su retrato. */
export function pendingAllies(g: Game): { cell: string; img: ImgKey; id: string }[] {
  const adv = ADVS[advOf(g.zone)];
  const hero = g.party.find(x => x.isHero)!;
  const p = plan(g.zone);
  const taken = new Set(p.marks.map(m => `${m.q},${m.r}`));
  const out: { cell: string; img: ImgKey; id: string }[] = [];
  zoneById(g.zone).rooms.forEach((room, idx) => {
    const c = (room.contents as Content[]).find(x => x.type === 'ally');
    if (!c) return;
    const id = allyFor(hero.cls, c.default_ally, adv.id);
    if (g.party.some(x => x.id === id) || g.done.includes(room.id)) return;
    const cells = p.cells.filter(([, , i]) => i === idx);
    if (!cells.length) return;
    const mq = cells.reduce((s, x) => s + x[0], 0) / cells.length, mr = cells.reduce((s, x) => s + x[1], 0) / cells.length;
    const free = cells.filter(([q, r]) => !taken.has(`${q},${r}`));
    const best = (free.length ? free : cells).reduce((a, b) => hdist([a[0], a[1]], [mq, mr]) <= hdist([b[0], b[1]], [mq, mr]) ? a : b);
    out.push({ cell: `${best[0]},${best[1]}`, img: adv.allyImg[id], id });
  });
  return out;
}

/** La abuela Brezna espera en el mapa (aro de plata) en cada sala donde habla, hasta que se llega a ella. */
export function npcSpots(g: Game): { cell: string; img: ImgKey; id: string }[] {
  const p = plan(g.zone);
  const taken = new Set(p.marks.map(m => `${m.q},${m.r}`));
  const out: { cell: string; img: ImgKey; id: string }[] = [];
  zoneById(g.zone).rooms.forEach((room, idx) => {
    const d = (room.contents as Content[]).find(x => x.type === 'dialogue' && x.lines.some((l: any) => l.speaker === 'ortiga'));
    if (!d || g.done.includes(room.id)) return;
    const cells = p.cells.filter(([, , i]) => i === idx);
    if (!cells.length) return;
    const mq = cells.reduce((s, x) => s + x[0], 0) / cells.length, mr = cells.reduce((s, x) => s + x[1], 0) / cells.length;
    const free = cells.filter(([q, r]) => !taken.has(`${q},${r}`) && !blockedCells(g.zone).has(`${q},${r}`));
    const best = (free.length ? free : cells).reduce((a, b) => hdist([a[0], a[1]], [mq, mr]) <= hdist([b[0], b[1]], [mq, mr]) ? a : b);
    out.push({ cell: `${best[0]},${best[1]}`, img: 'abuela_ortiga', id: d.id });
  });
  return out;
}

function exitLock(g: Game): { ev?: Ev; text?: string; closed: boolean } | undefined {
  const open = `${g.zone}_open`;
  if (!keyCell(g.zone) || g.done.includes(open)) return undefined;
  const id = KEY_ITEM(g.zone);
  const holder = g.party.find(c => c.items.some(i => i.id === id));
  if (!holder) {
    return { closed: true, text: id === 'zone_key'
      ? 'Una reja de hierro cierra la salida. Buscad la llave en algún rincón de esta zona.'
      : 'Una pared de raíces bloquea el paso. Hace falta un amuleto de corteza antiguo para obligarlas a apartarse.' };
  }
  g.done.push(open);
  const it = holder!.items.find(i => i.id === id)!;
  holder!.items = holder!.items.filter(i => i !== it);
  return { closed: false, ev: { kind: 'msg', title: 'Paso abierto', items: [ITEMS[id].img], lines: [id === 'zone_key'
    ? `${holder!.name} abre la reja con la llave de hierro, que se queda en la cerradura.`
    : `${holder!.name} alza el amuleto de corteza. Las raíces reconocen su runa, se apartan y la madera del amuleto se deshace.`] } };
}

const chestVisible = (g: Game, id: string) =>
  !CONTENTS.some(x => x.c.type === 'secret' && x.c.reveals === `chest:${id}` && !g.found.includes(x.c.id));

/** Trofeo de una aventura (Astilla del Corazón, Sello del Deshielo): va al baúl y no se vende (el autor 2026-11-06). */
export const isTrophy = (id: string) => ADV_LIST.some(a => a.reward.item === id);

/** Trofeos que llevase alguien en la mochila (partidas de antes): pasan al baúl. */
export function storeTrophies(g: Game) {
  for (const c of [...g.party, ...(g.bench ?? [])]) {
    const t = c.items.filter(i => isTrophy(i.id));
    if (!t.length) continue;
    c.items = c.items.filter(i => !isTrophy(i.id));
    g.trophies = [...new Set([...(g.trophies ?? []), ...t.map(i => i.id)])];
  }
}

export function giveItem(g: Game, itemId: string): Char | undefined {
  if (isTrophy(itemId)) { g.trophies = [...new Set([...(g.trophies ?? []), itemId])]; return g.party.find(c => c.isHero); }
  const holder = g.party.find(c => !c.dead && c.items.length < MAX_ITEMS);
  if (holder) holder.items.push(newItem(itemId));
  return holder;
}

/** Obstáculo que guarda un cofre: lo que hace falta para pasarlo y qué pasa si no se tiene. */
export interface Obstacle {
  title: string; img: ImgKey; text: string; needs: string[]; use: string; missing: string;
  alt?: { abil: 'str' | 'dex'; dc: number; dmg: string; label: string; try: string; hurt: string };
}
/** Objetos que se gastan al usarlos en un obstáculo: todos de un solo uso salvo las herramientas de ladrón (equipo básico del pícaro). */
const SPENT = ['alchemists_fire', 'holy_water', 'antidote', 'potion_poison_resistance', 'rope', 'torch', 'crowbar'];
const SPENT_TXT: Record<string, string> = { rope: 'La cuerda se queda allí.', torch: 'La antorcha se consume.', crowbar: 'La palanqueta se parte con el esfuerzo.' };
const WITH: Record<string, string> = {
  torch: 'una antorcha', alchemists_fire: 'fuego de alquimista', thieves_tools: 'sus herramientas de ladrón', crowbar: 'la palanqueta',
  antidote: 'un antídoto', potion_poison_resistance: 'una poción de resistencia al veneno', holy_water: 'agua bendita', rope: 'la cuerda',
};

function obstacle(g: Game, id: string, o: Obstacle): { ev: Ev; open: boolean } {
  const team = g.party.filter(c => !isDown(c));
  for (const need of o.needs) {
    const who = team.find(c => c.items.some(i => i.id === need));
    if (!who) continue;
    if (SPENT.includes(need)) { const i = who.items.findIndex(x => x.id === need); who.items.splice(i, 1); }
    const use = o.use.replace('{who}', who.name).replace('{item}', WITH[need] ?? ITEMS[need].name.toLowerCase());
    return { open: true, ev: { kind: 'msg', title: o.title, img: o.img, items: [ITEMS[need].img], lines: [o.text, use, ...(SPENT_TXT[need] ? [SPENT_TXT[need]] : [])], save: true } };
  }
  const tried = `${id}_tried`;
  if (o.alt && !g.done.includes(tried)) {
    // Sin el objeto se puede probar suerte una vez: si falla, hace daño y ya solo queda volver con el objeto.
    const a = o.alt;
    const who = [...team].sort((x, y) => abilMod(y, a.abil) - abilMod(x, a.abil))[0];
    const d = die(g.rng, 20);
    const bonus = abilMod(who, a.abil);
    const ok = d + bonus >= a.dc;
    const rolls: ShownRoll[] = [{ d20: d, bonus, dc: a.dc, ok, text: `${a.label} de ${who.name}` }];
    if (ok) return { open: true, ev: { kind: 'msg', title: o.title, img: o.img, rolls, lines: [o.text, a.try.replace('{who}', who.name), '¡Lo consigue!'] } };
    g.done.push(tried);
    const dmg = Math.min(who.hp - 1, roll(g.rng, a.dmg));
    who.hp -= Math.max(0, dmg);
    return { open: false, ev: { kind: 'msg', title: o.title, img: o.img, rolls, lines: [o.text, a.try.replace('{who}', who.name), `${a.hurt.replace('{who}', who.name)}: pierde ${Math.max(0, dmg)} PG.`, o.missing] } };
  }
  return { open: false, ev: { kind: 'msg', title: o.title, img: o.img, lines: [o.text, o.missing] } };
}

function chest(g: Game, id: string): Ev {
  g.done.push(id);
  const c = contentById(id)!.c;
  g.gold += c.gold;
  tally(g, { chests: 1, gold: c.gold });
  const lines = [`Dentro hay ${c.gold} monedas de oro.`];
  const items: ImgKey[] = [];
  if (c.item) {
    const itemId = DESIGN_ITEM[c.item.id] ?? c.item.id;
    if (ITEMS[itemId]) {
      const who = giveItem(g, itemId);
      items.push(ITEMS[itemId].img);
      if (!who) g.chestLeft = { ...g.chestLeft, [id]: [itemId] };
      lines.push(isTrophy(itemId) ? `${ITEMS[itemId].name}: trofeo de la aventura. Se guardará en el baúl de la posada.` : who ? `${who.name} guarda: ${ITEMS[itemId].name}.` : NO_ROOM(ITEMS[itemId].name));
    }
  }
  return { kind: 'msg', title: 'Cofre', img: 'cofre_cerrado', img2: 'cofre_abierto', items: ['monedas', ...items], lines, save: true };
}

const NO_ROOM = (name: string) => `No hay sitio para ${name}: se queda en el cofre. Deja algo en el suelo (toca una carta del grupo) y vuelve a por él; lo que sobre lo puedes vender en la tienda del pueblo.`;

/** Cofre ya abierto con objetos que no cupieron: se intenta guardarlos otra vez. */
function chestLeftovers(g: Game, id: string): Ev {
  const left = g.chestLeft![id];
  const lines: string[] = [];
  const keep: string[] = [];
  for (const itemId of left) {
    const who = giveItem(g, itemId);
    if (who) lines.push(`${who.name} guarda: ${ITEMS[itemId].name}.`);
    else { keep.push(itemId); lines.push(NO_ROOM(ITEMS[itemId].name)); }
  }
  g.chestLeft = { ...g.chestLeft, [id]: keep };
  return { kind: 'msg', title: 'Cofre', img: 'cofre_abierto', items: left.map(i => ITEMS[i].img), lines, save: true };
}

/** Clave de una casilla para los objetos tirados en el suelo. */
export const dropKey = (g: Game) => `${g.zone}:${hkey(g.pos)}`;

function trap(g: Game, id: string): Ev {
  g.done.push(id);
  const t = contentById(id)!.c;
  const team = g.party.filter(c => !isDown(c));
  // El más atento del grupo tira Percepción (d20 + su bonificador) contra la CD de la trampa.
  const spotter = [...team].sort((a, b) => passivePerception(b) - passivePerception(a))[0];
  const pd = die(g.rng, 20);
  const pb = passivePerception(spotter) - 10;
  const seen = pd + pb >= t.detect_dc;
  const rolls: ShownRoll[] = [{ d20: pd, bonus: pb, dc: t.detect_dc, ok: seen, text: `Percepción de ${spotter.name}` }];
  const lines: string[] = [];
  const out = (): Ev => ({ kind: 'msg', title: '¡Trampa!', intro: 'Algo cruje bajo vuestros pies…', img: 'trampa', rolls, lines });
  let advSave = false;
  const rope = /foso|pozo|hoyo|lazo|sima|hund|tablon/i.test(`${t.name} ${t.description}`) && team.some(c => c.items.some(i => i.id === 'rope'));
  if (seen) {
    const rogue = team.find(c => c.cls === 'rogue');
    const who = rogue ?? [...team].sort((a, b) => abilMod(b, 'dex') - abilMod(a, 'dex'))[0];
    const tools = who.items.some(i => i.id === 'thieves_tools');
    const bonus = abilMod(who, 'dex') + (tools && who.cls === 'rogue' ? 2 : 0);
    const d = rogue ? Math.max(die(g.rng, 20), die(g.rng, 20)) : die(g.rng, 20);
    const ok = d + bonus >= t.disarm_dc;
    rolls.push({ d20: d, bonus, dc: t.disarm_dc, ok, text: `${who.name} intenta desactivarla${rogue ? ' (con ventaja)' : ''}` });
    if (ok) {
      lines.push(`Descubrís la trampa a tiempo: ${t.name}. ${who.name} la desactiva.`);
      tally(g, { traps: 1 });
      return out();
    }
    lines.push(`Descubrís la trampa (${t.name}), pero ${who.name} no logra desactivarla.`);
    advSave = true;
  } else lines.push(t.description);
  // La sufre alguien de la vanguardia (quien va delante), al azar; no siempre el héroe.
  const front = team.filter(c => c.row === 'front');
  const victim = pick(g.rng, front.length ? front : team);
  const abil = t.save_ability.toLowerCase() as 'dex';
  if (rope && !advSave) { advSave = true; lines.push('La cuerda os sirve de asidero.'); }
  const sd = advSave ? Math.max(die(g.rng, 20), die(g.rng, 20)) : die(g.rng, 20);
  const sb = abilMod(victim, abil);
  const save = sd + sb >= t.save_dc;
  rolls.push({ d20: sd, bonus: sb, dc: t.save_dc, ok: save, text: `Salvación de ${victim.name}${advSave ? ' (con ventaja)' : ''}` });
  const dice = (t.effect as string).match(/\d+d\d+/)?.[0];
  if (dice) {
    let dmg = roll(g.rng, dice);
    if (save && /mitad/.test(t.effect)) dmg = Math.floor(dmg / 2);
    victim.hp = Math.max(0, victim.hp - dmg);
    lines.push(dmg === 0 ? `${victim.name} esquiva la trampa y no recibe daño.` : save ? `${victim.name} esquiva parcialmente la trampa y recibe ${dmg} puntos de daño.` : `${victim.name} no consigue esquivar la trampa y recibe ${dmg} puntos de daño.`);
    if (victim.hp === 0) { victim.hp = 1; lines.push(`${victim.name} queda al borde del desmayo con 1 PG.`); }
  } else lines.push(save ? `${victim.name} se aparta a tiempo.` : `${victim.name} queda atrapado un rato hasta liberarse.`);
  return out();
}

export function doRest(g: Game, id: string, long: boolean): string[] {
  g.done.push(id);
  if (long) g.restReady = false;
  const lines = long
    ? (g.party.forEach(longRest), ['Descanso largo: el grupo recupera todos sus PG y conjuros.'])
    : g.party.filter(c => !c.dead).map(c => `${c.name} recupera ${shortRest(c, g.rng)} PG.`);
  g.log.push(...lines);
  return lines;
}

/** Lo que lleva puesto un compañero y se queda con él al irse a la posada: armas, armadura y escudo. */
const WORN = ['weapon', 'armor', 'shield'];

/**
 * Un compañero que vuelve a la posada deja lo demás (llaves, pociones, hallazgos) al grupo; lo que no cabe
 * en las mochilas va al baúl de la posada (el autor 2026-11-06: antes se perdía en el suelo).
 */
export function handOver(g: Game, c: Char): string[] {
  const leave = c.items.filter(i => !WORN.includes(ITEMS[i.id]?.kind));
  c.items = c.items.filter(i => WORN.includes(ITEMS[i.id]?.kind));
  const given: string[] = [], stored: string[] = [];
  for (const it of leave) {
    const to = g.party.find(p => !p.dead && p.items.length < MAX_ITEMS);
    if (to) { to.items.push(it); given.push(ITEMS[it.id].name); }
    else { g.chest = [...(g.chest ?? []), it]; stored.push(ITEMS[it.id].name); }
  }
  // Repetidos agrupados: «Poción de curación ×2».
  const group = (l: string[]) => [...new Set(l)].map(n => { const k = l.filter(x => x === n).length; return k > 1 ? `${n} ×${k}` : n; }).join(', ');
  return [...(given.length ? [`Antes de irse os deja: ${group(given)}.`] : []), ...(stored.length ? [`No cabe en las mochilas y lo guarda en el baúl de la posada: ${group(stored)}.`] : [])];
}

/** Objetos que curan y se pueden usar fuera de combate (pociones, ungüento, estuche de curandero). */
export const usableOutside = (id: string) => !!ITEMS[id]?.heal;

/** Usa fuera de combate un objeto que cura (el autor 2026-11-06). Devuelve lo que pasa. */
export function useOutside(g: Game, fromId: string, uid: string, toId: string): string {
  const from = g.party.find(c => c.id === fromId), to = g.party.find(c => c.id === toId);
  const it = from?.items.find(i => i.uid === uid);
  if (!from || !to || !it || to.dead || !usableOutside(it.id)) return '';
  const d = ITEMS[it.id];
  it.charges = (it.charges ?? d.charges ?? 1) - 1;
  if (it.charges <= 0) from.items = from.items.filter(i => i.uid !== uid);
  const n = Math.min(to.maxHp - to.hp, roll(g.rng, d.heal!));
  to.hp += n;
  if (to.hp > 0) { to.stable = false; to.deathS = to.deathF = 0; }
  const line = from === to ? `${to.name} usa ${d.name} y recupera ${n} PG.` : `${from.name} usa ${d.name} con ${to.name}: recupera ${n} PG.`;
  g.log.push(line);
  return line;
}

/** Zona anterior a la actual (la de la que se viene), si la hay. */
export function previousZone(g: Game): string | undefined {
  const ids = ADVS[advOf(g.zone)].data.zones.map(z => z.id);
  const i = ids.indexOf(g.zone);
  return i > 0 ? ids[i - 1] : undefined;
}

/** ¿Está el grupo en un punto de descanso? (usado o no) */
export const atRest = (g: Game) => marksAt(g.zone, hkey(g.pos)).some(m => m.kind === 'rest');

/**
 * Descanso desde el que se puede ir al pueblo: el último del mapa (el de la sala más avanzada);
 * en el mapa del jefe, el primero, para no volver con el jefe a medias.
 */
export function townRest(zone: string): string | undefined {
  const cm = cellMap(zone);
  const rests = plan(zone).marks.filter(m => m.kind === 'rest')
    .map(m => ({ id: m.id, room: cm.get(`${m.q},${m.r}`) ?? 0, d: hdist([m.q, m.r], plan(zone).start) }))
    .sort((a, b) => a.room - b.room || a.d - b.d);
  if (!rests.length) return undefined;
  const zones = ADVS[advOf(zone)].data.zones;
  return (zones[zones.length - 1].id === zone ? rests[0] : rests[rests.length - 1]).id;
}

/**
 * Texto de un descanso: solo dice que lleva al pueblo el que de verdad lleva (el autor 2026-11-06: los
 * «Rincón resguardado» lo decían todos). Se quita esa frase de los datos y se pone donde toca.
 */
export function restText(zone: string, id: string, desc: string): string {
  const base = desc.replace(/[;.,]?\s*(desde aquí se (puede regresar|permite volver)|permite (regresar|volver))[^.;]*/i, '').replace(/\s*$/, '').replace(/[;,]$/, '');
  const clean = /[.!]$/.test(base) ? base : `${base}.`;
  return id === townRest(zone) ? `${clean} Desde aquí se puede volver al pueblo.` : clean;
}

/** ¿Está el grupo en el descanso que lleva al pueblo? */
export const atTownRest = (g: Game) => marksAt(g.zone, hkey(g.pos)).some(m => m.kind === 'rest' && m.id === townRest(g.zone));

/** ¿Está el grupo en la entrada de la zona, donde se puede volver a la anterior? */
/** En la casilla de entrada: escalera a la zona anterior o, en la primera zona, puerta al pueblo. */
export const atEntrance = (g: Game) => hkey(g.pos) === hkey(plan(g.zone).start);

/** Vuelve a la zona anterior tal como se dejó: sin diálogo de entrada ni pasos automáticos. */
export function backToPrevious(g: Game): Ev[] {
  const z = previousZone(g);
  if (!z) return [];
  saveZone(g);
  const s = g.saved?.[z];
  g.zone = z;
  g.zoneBg = zoneArt(z).combat;
  g.visited = s ? s.visited : [hkey(plan(z).start)];
  g.pos = s ? s.pos : plan(z).start;
  g.prev = s ? s.prev : g.pos;
  g.log.push(`— Vuelves a ${zoneById(z).name} —`);
  const quiet = plan(z).marks.every(m => m.kind !== 'encounter' || g.done.includes(m.id));
  const line = quiet ? react(g, 'clear') : undefined;
  if (line) logEvs(g, [line]);
  return line ? [line] : [];
}

export function saveZone(g: Game) {
  g.saved = { ...(g.saved ?? {}), [g.zone]: { visited: [...g.visited], pos: g.pos, prev: g.prev } };
}

export function enterZone(g: Game, zone: string): Ev[] {
  if (g.zone !== zone) saveZone(g);
  const s = g.saved?.[zone];
  if (s) {
    // Zona ya visitada: se recupera donde se dejó, sin repetir la entrada ni los pasos.
    g.zone = zone;
    g.zoneBg = zoneArt(zone).combat;
    g.visited = s.visited;
    g.pos = s.pos;
    g.prev = s.prev;
    g.log.push(`— ${zoneById(zone).name} —`);
    markReturn(g);
    return [];
  }
  g.zone = zone;
  g.zoneBg = zoneArt(zone).combat;
  g.pos = plan(zone).start;
  g.prev = g.pos;
  g.visited = [hkey(g.pos)];
  g.log.push(`— ${zoneById(zone).name} —`);
  // Con un compañero de Hondaroca por la linde, el héroe ya no entra solo.
  const esc = g.escort ? g.party.find(p => p.id === g.escort) : undefined;
  const entry = (zoneById(zone).entry_dialogue as DialogueLine[]).map(l => esc && l.text.startsWith('Voy a buscar') ? { ...l, text: `${esc.name.split(' ')[0]} me acompaña a buscar a los desaparecidos. Los demás se quedan en Vegaumbría.` } : l);
  const evs: Ev[] = [{ kind: 'dialogue', lines: entry }];
  if (zone === CAPTURE.zone) evs.push(...capture(g));
  if (zone === CAPTURE.escape) evs.push(...rescue(g, true));
  const living = g.party.filter(c => !c.dead);
  const low = living.reduce((a, c) => a + c.hp, 0) < living.reduce((a, c) => a + c.maxHp, 0) / 2;
  const line = low ? react(g, 'hurt') : undefined;
  if (line) evs.push(line);
  logEvs(g, evs);
  return [...evs, ...step(g, g.pos)];
}

// ---------- Estadísticas y progreso de zona ----------

export interface ZoneStats { kills: number; xp: number; gold: number; chests: number; traps: number }
export function tally(g: Game, d: Partial<ZoneStats>, zone = g.zone) {
  const z = (g.stats ??= {})[zone] ??= { kills: 0, xp: 0, gold: 0, chests: 0, traps: 0 };
  for (const k of Object.keys(d) as (keyof ZoneStats)[]) z[k] += d[k] ?? 0;
}

/** Encuentros que quedan por vencer en una aventura (sin contar los de salas secretas). */
export function foesLeft(g: Game, adv: string): number {
  return ADVS[adv as keyof typeof ADVS].data.zones.flatMap(z => openRooms(z.id).map(id => z.rooms.find(r => r.id === id)!))
    .flatMap(r => r.contents as Content[]).filter(c => c.type === 'encounter' && c.trigger !== 'patrol' && c.trigger !== 'scene' && !g.done.includes(c.id)).length;
}

/** Salas de la zona que no están detrás de un pasadizo secreto (las que cuenta el progreso). */
const OPEN_ROOMS = new Map<string, string[]>();
function openRooms(zone: string): string[] {
  if (OPEN_ROOMS.has(zone)) return OPEN_ROOMS.get(zone)!;
  const rooms = zoneById(zone).rooms;
  const ids = new Set(rooms.map(r => r.id));
  const seen = new Set([rooms[0].id]);
  const q = [rooms[0].id];
  while (q.length) {
    const id = q.shift();
    const r = rooms.find(x => x.id === id)!;
    for (const e of r.exits) if (e.type !== 'secret' && ids.has(e.to) && !seen.has(e.to)) { seen.add(e.to); q.push(e.to); }
  }
  const list = rooms.filter(r => seen.has(r.id)).map(r => r.id);
  OPEN_ROOMS.set(zone, list);
  return list;
}

/** Salas vistas (sin contar las secretas, para no delatarlas) y estado de la llave de la zona. */
export function zoneProgress(g: Game) {
  const rooms = openRooms(g.zone);
  const key = !keyCell(g.zone) ? 'none' : g.done.includes(`${g.zone}_key`) || g.done.includes(`${g.zone}_open`) ? 'got' : 'missing';
  return { seen: rooms.filter(id => g.done.includes(id)).length, total: rooms.length, key } as const;
}

/** Resumen breve al salir de una zona por primera vez. */
function zoneSummary(g: Game): Ev | undefined {
  const id = `${g.zone}_summary`;
  if (g.done.includes(id)) return undefined;
  g.done.push(id);
  // Zona terminada: la posada vuelve a dar descanso largo.
  g.restReady = true;
  const z = g.stats?.[g.zone] ?? { kills: 0, xp: 0, gold: 0, chests: 0, traps: 0 };
  const p = zoneProgress(g);
  const secrets = zoneById(g.zone).rooms.flatMap(r => r.contents as Content[]).filter(c => c.type === 'secret' && g.found.includes(c.id)).length;
  // Tabla sin bordes: el dato a la izquierda y el valor a la derecha.
  const table: [string, string][] = ([
    ['Salas exploradas', `${p.seen} de ${p.total}`],
    ['Enemigos derrotados', `${z.kills}`],
    ['PX ganados', `${z.xp}`],
    ['Oro conseguido', `${z.gold} po`],
    z.chests ? ['Cofres abiertos', `${z.chests}`] : undefined,
    z.traps ? ['Trampas desactivadas', `${z.traps}`] : undefined,
    secrets ? ['Secretos descubiertos', `${secrets}`] : undefined,
  ] as ([string, string] | undefined)[]).filter((x): x is [string, string] => !!x);
  return { kind: 'msg', title: `${zoneById(g.zone).name} superada`, bg: zoneArt(g.zone).bg, lines: [], table };
}

// ---------- Frases que reaccionan al estado del grupo ----------

const REACT: Record<'hurt' | 'clear' | 'close' | 'closeDead', string[]> = {
  hurt: [
    'Vamos hechos polvo. Si vemos un sitio tranquilo, deberíamos descansar antes de seguir.',
    'Así no llegamos muy lejos. Curémonos en cuanto podamos.',
    'Me tiemblan las piernas. Despacio y con cuidado a partir de aquí.',
  ],
  clear: [
    'Qué silencio. Lo que dejamos atrás ya no se levantará.',
    'Esto está tranquilo ahora. Al menos aquí nadie nos espera.',
  ],
  close: [
    'Por poco. Otro golpe así y no lo contamos.',
    'Eso ha estado demasiado cerca. Hay que cuidarse más.',
    'Seguimos vivos, que no es poco. Respirad un momento.',
  ],
  // Con alguien muerto en el grupo no vale «seguimos vivos» (el autor 2026-11-05).
  closeDead: [
    'No todos hemos salido de esta. Sigamos, pero con cuidado.',
    'Ha caído uno de los nuestros. No dejemos que caiga nadie más.',
  ],
};

/** Una frase corta de alguien del grupo (un aliado si lo hay; si no, el propio héroe). */
export function react(g: Game, why: 'hurt' | 'clear' | 'close'): Ev | undefined {
  const awake = g.party.filter(c => !isDown(c));
  if (!awake.length) return undefined;
  const allies = awake.filter(c => !c.isHero);
  const who = allies.length ? pick(g.rng, allies) : awake[0];
  return { kind: 'dialogue', lines: [{ speaker: who.isHero ? 'hero' : who.id, text: pick(g.rng, REACT[why === 'close' && g.party.some(c => c.dead) ? 'closeDead' : why]) }] };
}

// ---------- Escenas en el mapa, reja y regresos ----------

/** Al volver a una zona ya recorrida se activan sus eventos de regreso y grupos de paso. */
export function markReturn(g: Game) {
  const f = `ret:${g.zone}`;
  if (!g.flags?.includes(f)) g.flags = [...(g.flags ?? []), f];
}

const reached = (g: Game, id: string) => g.done.includes(id) || g.found.includes(id) || !!g.flags?.includes(id);

/** ¿Está disponible la escena? Las de regreso piden haber vuelto a la zona y lo que digan after y before. */
export function sceneOn(g: Game, id: string): boolean {
  const c = contentById(id)?.c;
  if (!c || c.type !== 'scene' || g.done.includes(id)) return false;
  const zone = contentById(id)!.zone;
  if (c.on_return && !g.flags?.includes(`ret:${zone}`)) return false;
  if (c.after && !reached(g, c.after)) return false;
  if (c.before && reached(g, c.before)) return false;
  if (c.reveals && g.found.includes(c.reveals)) return false;
  return true;
}

/** Lo que dio una escena o una palanca ya usadas, para releerlo sin que se apunte otra vez en el registro ni en el diario. */
export function rereadAt(g: Game, k: string): Ev[] {
  for (const m of marksAt(g.zone, k)) {
    if (!g.done.includes(m.id)) continue;
    if (m.kind === 'scene') {
      const s = contentById(m.id)?.c;
      if (!s) continue;
      const said = g.scenes?.[m.id]?.said;
      return [{ kind: 'msg', title: s.title, img: s.img, lines: [s.text] }, ...(said ? [{ kind: 'msg', title: s.title, img: s.img, lines: said } as Ev] : [])];
    }
    if (m.kind === 'lever') {
      const c = contentById(m.id)?.c;
      if (c) return [...(c.lines?.length ? [{ kind: 'dialogue', lines: c.lines } as Ev] : []), { kind: 'msg', title: c.name, img: 'palanca', lines: [c.text] }];
    }
  }
  return [];
}

/** Palanca que abre una reja para siempre (atajo de vuelta). */
function lever(g: Game, id: string): Ev[] {
  const c = contentById(id)?.c;
  if (!c) return [];
  g.done.push(id, c.gate);
  const evs: Ev[] = [];
  if (c.lines?.length) evs.push({ kind: 'dialogue', lines: c.lines });
  evs.push({ kind: 'msg', title: c.name, img: 'palanca', lines: [c.text], save: true });
  return evs;
}

/** Pendientes del diario de una aventura: pistas vistas que aún no se han resuelto. */
export function pendingNotes(g: Game, adv: string): string[] {
  return ADVS[adv as keyof typeof ADVS].data.zones.flatMap(z => ((z as any).pending ?? []) as { id: string; from: string; until: string; text: string }[])
    .filter(p => reached(g, p.from) && !reached(g, p.until)).map(p => p.text);
}
