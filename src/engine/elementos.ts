// Elementos dinámicos del mapa: rocas, puertas, verjas, puentes, mecanismos, barreras… que cambian de estado
// durante la exploración y, con él, por dónde se puede andar. Se declaran en cada zona de la aventura
// (campo `elements`) y el motor no sabe nada de ninguna aventura en concreto.
//
// Cómo se decide el estado de un elemento, de más a menos fuerte:
//   1. Sus reglas `on`: la última cuyo acontecimiento ya ocurrió (escena hecha, combate ganado, secreto
//      encontrado o marca puesta). Son cambios permanentes.
//   2. Lo que se le haya puesto en la partida (`g.elems`): efectos `set` de escenas y mecanismos. Pueden ser reversibles.
//   3. Su estado inicial.
// El estado se calcula, no se copia en el plano: cambiar un elemento no reconstruye el mapa ni la zona.
import { ADV_LIST } from './aventuras';
import type { Game } from './game';
import type { Ev } from './dungeon';
import * as D from './dungeon';

/** Un estado de un tipo de elemento: si se cruza y cómo se dibuja mientras no haya imagen definitiva. */
export interface ElemStateDef {
  /** Se puede pisar y atravesar. Si no, bloquea el paso y la vista. */
  pass: boolean;
  /** Dibujo provisional: forma sólida, rota (restos en el suelo), abierta (hueco libre) o apagada/encendida. */
  look: 'solid' | 'broken' | 'open' | 'off' | 'on';
}
export interface ElemTypeDef {
  /** Nombre del tipo para el documento de arte y los avisos. */
  name: string;
  /** Familia visual del marcador provisional. */
  shape: 'rock' | 'door' | 'bars' | 'bridge' | 'lever' | 'crate' | 'wall' | 'magic' | 'portal' | 'water';
  /** Color base del marcador provisional. */
  color: string;
  states: Record<string, ElemStateDef>;
}

/**
 * Catálogo de tipos. Cada estado tiene una imagen futura con clave estable `din_<tipo>_<estado>`
 * (ver docs/arte/elementos-dinamicos-pendientes.md). Añadir un tipo nuevo es añadir una entrada aquí.
 */
export const ELEM_TYPES: Record<string, ElemTypeDef> = {
  roca: { name: 'Roca', shape: 'rock', color: '#8a7f72', states: { intacta: { pass: false, look: 'solid' }, destruida: { pass: true, look: 'broken' } } },
  escombros: { name: 'Escombros', shape: 'rock', color: '#7d6a55', states: { intactos: { pass: false, look: 'solid' }, retirados: { pass: true, look: 'broken' } } },
  puerta: { name: 'Puerta', shape: 'door', color: '#7a5532', states: { bloqueada: { pass: false, look: 'solid' }, desbloqueada: { pass: false, look: 'off' }, abierta: { pass: true, look: 'open' }, cerrada: { pass: false, look: 'off' } } },
  verja: { name: 'Verja', shape: 'bars', color: '#9aa3ab', states: { cerrada: { pass: false, look: 'solid' }, abierta: { pass: true, look: 'open' } } },
  puente: { name: 'Puente', shape: 'bridge', color: '#9b7447', states: { roto: { pass: false, look: 'broken' }, reparado: { pass: true, look: 'solid' }, intacto: { pass: true, look: 'solid' }, destruido: { pass: false, look: 'broken' } } },
  pasarela: { name: 'Pasarela', shape: 'bridge', color: '#a88a5c', states: { recogida: { pass: false, look: 'off' }, desplegada: { pass: true, look: 'solid' } } },
  palanca: { name: 'Palanca', shape: 'lever', color: '#c9a14a', states: { reposo: { pass: true, look: 'off' }, activada: { pass: true, look: 'on' } } },
  interruptor: { name: 'Interruptor', shape: 'lever', color: '#6fa0c8', states: { apagado: { pass: true, look: 'off' }, encendido: { pass: true, look: 'on' } } },
  compuerta: { name: 'Compuerta', shape: 'bars', color: '#6d7f8c', states: { cerrada: { pass: false, look: 'solid' }, abierta: { pass: true, look: 'open' } } },
  barricada: { name: 'Barricada', shape: 'crate', color: '#8c6a3f', states: { intacta: { pass: false, look: 'solid' }, destruida: { pass: true, look: 'broken' } } },
  barriles: { name: 'Barriles y cajas', shape: 'crate', color: '#94703f', states: { intactos: { pass: false, look: 'solid' }, rotos: { pass: true, look: 'broken' } } },
  muro_agrietado: { name: 'Muro agrietado', shape: 'wall', color: '#6f6a64', states: { agrietado: { pass: false, look: 'solid' }, derrumbado: { pass: true, look: 'broken' } } },
  barrera: { name: 'Barrera mágica', shape: 'magic', color: '#a46ee0', states: { activa: { pass: false, look: 'on' }, disipada: { pass: true, look: 'off' } } },
  sello: { name: 'Sello mágico', shape: 'magic', color: '#e0b84e', states: { intacto: { pass: false, look: 'on' }, roto: { pass: true, look: 'broken' } } },
  portal: { name: 'Portal', shape: 'portal', color: '#58c2b8', states: { inactivo: { pass: true, look: 'off' }, activo: { pass: true, look: 'on' } } },
  agua: { name: 'Agua', shape: 'water', color: '#3f6f9a', states: { inundado: { pass: false, look: 'solid' }, drenado: { pass: true, look: 'open' } } },
  camino: { name: 'Camino', shape: 'rock', color: '#7b7b62', states: { bloqueado: { pass: false, look: 'solid' }, despejado: { pass: true, look: 'open' } } },
};

/** Cambio por acontecimiento: cuando `if` ya ocurrió, el elemento pasa a `to` (y se avisa con `text` la primera vez). */
export interface ElemRule { if: string; to: string; text?: string }
/** Uso de un mecanismo al pisarlo: desde el estado `from` pasa a `to` y cambia otros elementos (`set`). */
export interface ElemUse { from: string; to: string; set?: Record<string, string>; text: string; title?: string }

export interface ElemDef {
  id: string;
  type: string;
  /** Casilla "q,r" de la zona. */
  at: string;
  name: string;
  /** Estado inicial (si falta, el primero del tipo). */
  state?: string;
  on?: ElemRule[];
  /** Escena que se abre al topar con él mientras bloquea (pruebas, objetos, decisiones). */
  scene?: string;
  /** Mecanismo: lo que hace al pisarlo, según su estado. */
  use?: ElemUse[];
  /** Aviso por estado: al topar con él si bloquea, o al pisarlo si se cruza. */
  texts?: Record<string, string>;
  /** Portal: casilla "q,r" a la que lleva mientras su estado es «activo». */
  to?: string;
}

export const artKey = (type: string, state: string) => `din_${type}_${state}`;

const ZONE_ELEMS = new Map<string, ElemDef[]>(
  ADV_LIST.flatMap(a => a.data.zones.map(z => [z.id, (((z as any).elements ?? []) as ElemDef[])] as [string, ElemDef[]])),
);
const ALL = [...ZONE_ELEMS.entries()].flatMap(([zone, list]) => list.map(el => ({ zone, el })));

export const zoneElements = (zone: string): ElemDef[] => ZONE_ELEMS.get(zone) ?? [];
export const elemById = (id: string) => ALL.find(x => x.el.id === id);
export const elemAt = (zone: string, k: string) => zoneElements(zone).find(el => el.at === k);
/** Casillas con elemento en una zona (aunque estén abiertos). */
export const elemCells = (zone: string) => new Set(zoneElements(zone).map(el => el.at));

export const initialState = (el: ElemDef) => el.state ?? Object.keys(ELEM_TYPES[el.type].states)[0];

/** Estado actual del elemento en la partida. */
export function elemState(g: Game, el: ElemDef): string {
  const ruled = [...(el.on ?? [])].reverse().find(r => D.reached(g, r.if));
  return ruled?.to ?? g.elems?.[el.id] ?? initialState(el);
}
export const elemPasses = (el: ElemDef, state: string) => !!ELEM_TYPES[el.type].states[state]?.pass;
export const isMechanism = (el: ElemDef) => !!el.use?.length;

/** Casillas que los elementos cierran ahora mismo en la zona. */
export function elemBlocked(g: Game, zone: string): Set<string> {
  return new Set(zoneElements(zone).filter(el => !elemPasses(el, elemState(g, el))).map(el => el.at));
}

/** Pone estados (efecto `set` de una escena o de un mecanismo). Ignora ids o estados que no existen. */
export function setElems(g: Game, set: Record<string, string> | undefined) {
  for (const [id, st] of Object.entries(set ?? {})) {
    const x = elemById(id);
    if (x && ELEM_TYPES[x.el.type].states[st]) g.elems = { ...g.elems, [id]: st };
  }
}

/** Topar con un elemento que bloquea: su escena (si sigue pendiente) o su aviso. El grupo no se mueve. */
export function bumpElement(g: Game, el: ElemDef): Ev[] {
  const st = elemState(g, el);
  if (el.scene && !g.done.includes(el.scene) && D.contentById(el.scene)) return [{ kind: 'scene', id: el.scene }];
  const use = el.use?.find(u => u.from === st);
  if (use) return useElement(g, el, use);
  g.note = el.texts?.[st] ?? `${el.name}: no se puede pasar.`;
  return [];
}

function useElement(g: Game, el: ElemDef, use: ElemUse): Ev[] {
  g.elems = { ...g.elems, [el.id]: use.to };
  setElems(g, use.set);
  return [{ kind: 'msg', title: use.title ?? el.name, lines: [use.text], save: true }];
}

/** Pisar la casilla de un elemento que se cruza: mecanismo que se acciona, portal que lleva a otro sitio o su aviso. */
export function enterElement(g: Game, el: ElemDef): { evs: Ev[]; warp?: string } {
  const st = elemState(g, el);
  const use = el.use?.find(u => u.from === st);
  if (use) return { evs: useElement(g, el, use) };
  if (el.type === 'portal' && st === 'activo' && el.to) return { evs: [], warp: el.to };
  const t = el.texts?.[st];
  if (t) g.note = t;
  return { evs: [] };
}

/** Avisos de los cambios por acontecimiento (una sola vez cada uno), para contarlos al seguir explorando. */
export function elemNews(g: Game): Ev[] {
  const evs: Ev[] = [];
  for (const { el } of ALL) (el.on ?? []).forEach((r, i) => {
    const id = `${el.id}#${i}`;
    if (!r.text || g.elemNews?.includes(id) || !D.reached(g, r.if)) return;
    g.elemNews = [...(g.elemNews ?? []), id];
    evs.push({ kind: 'msg', title: el.name, lines: [r.text] });
  });
  return evs;
}

/**
 * Partidas de antes de los elementos dinámicos: si ya se había pisado algo que ahora queda detrás de un
 * elemento cerrado, ese elemento se abre para que nadie quede encerrado ni pierda lo que ya exploró.
 * Las partidas nuevas llevan `elems` desde el principio y no pasan por aquí.
 */
export function migrateElements(g: Game) {
  if (g.elems) return;
  g.elems = {};
  // Avisos de acontecimientos ya pasados: no se cuentan de golpe al cargar.
  g.elemNews = ALL.flatMap(({ el }) => (el.on ?? []).map((r, i) => (D.reached(g, r.if) ? `${el.id}#${i}` : '')).filter(Boolean));
  for (const [zone, list] of ZONE_ELEMS) {
    if (!list.length) continue;
    const seen = new Set([...(zone === g.zone ? g.visited : []), ...(g.saved?.[zone]?.visited ?? [])]);
    if (!seen.size) continue;
    for (const el of list) {
      const st = elemState(g, el);
      if (elemPasses(el, st)) continue;
      const open = Object.entries(ELEM_TYPES[el.type].states).find(([, s]) => s.pass)?.[0];
      if (!open) continue;
      const closed = D.passable(g, zone);
      g.elems[el.id] = open;
      const opened = D.passable(g, zone);
      delete g.elems[el.id];
      const reach = (pass: Set<string>) => {
        const start = D.hkey(D.plan(zone).start);
        const s = new Set([start]);
        const q = [start];
        while (q.length) for (const n of D.neighbors(q.shift()!.split(',').map(Number) as D.Hex)) {
          const k = D.hkey(n);
          if (pass.has(k) && !s.has(k)) { s.add(k); q.push(k); }
        }
        return s;
      };
      const before = reach(closed);
      if ([...reach(opened)].some(k => !before.has(k) && seen.has(k))) g.elems[el.id] = open;
    }
  }
}
