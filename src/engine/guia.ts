// Primera partida guiada: en Hondaroca, la primera vez que pasa cada cosa sale un consejo breve.
// Cada consejo sale una sola vez por partida (g.guide). Las partidas ya empezadas antes de esto no los ven.
import type { Game } from './game';
import type { Ev } from './dungeon';
import { advOf } from './aventuras';
import { GOALS } from '../data/objetivos';

const TIPS: Record<string, string[]> = {
  mover: ['Toca una casilla iluminada para caminar hasta ella.', 'Si tocas la oscuridad, avanzáis hacia allí hasta encontrar algo.'],
  combate: [
    'Cuando sea vuestro turno, toca a un enemigo para atacarle.',
    'Cada turno tenéis una acción, una acción adicional y un movimiento. Los botones gastados se apagan.',
    'Mantén pulsado cualquier botón para leer qué hace. TERMINAR TURNO cede el turno.',
  ],
  filas: [
    'Delante luchan los de cuerpo a cuerpo. Detrás, magos y arqueros están a salvo mientras alguien aguante delante.',
    'IR ATRÁS e IR DELANTE cambian de fila y gastan el movimiento.',
  ],
  objetivo: ['Este combate tiene un objetivo opcional, arriba. Cumplirlo da un premio y a veces cambia lo que viene después.'],
  trampa: ['Habéis visto una trampa. Podéis intentar desactivarla, pasar con cuidado o volver atrás.', 'Las tiradas suman un d20 y el bonificador del personaje: si igualan la dificultad, salen bien.'],
  escena: ['Aquí elegís qué hacer. Algunas opciones piden una tirada: suele ir mejor quien tiene más bonificador en esa característica.'],
  descanso: ['Un descanso corto cura un poco. El largo lo recupera todo, también los conjuros.', 'En la posada del pueblo siempre podéis hacer un descanso largo.'],
};

const tip = (g: Game, id: string): Ev[] => {
  if (g.guide?.includes(id)) return [];
  g.guide = [...(g.guide ?? []), id];
  return [{ kind: 'msg', title: 'Consejo', lines: TIPS[id] }];
};

/** Añade a la cola los consejos de lo que pasa por primera vez (solo en Hondaroca). */
export function guide(g: Game, evs: Ev[]): Ev[] {
  // Partida guardada antes de los consejos y ya avanzada: se dan por vistos.
  if (!g.guide && g.visited.length > 1) g.guide = Object.keys(TIPS);
  if (g.place !== 'dungeon' || advOf(g.zone) !== 'hondaroca') return evs;
  const out: Ev[] = [];
  for (const ev of evs) {
    if (ev.kind === 'combat') {
      out.push(...tip(g, 'combate'));
      if (g.party.length > 1) out.push(...tip(g, 'filas'));
      if (GOALS.some(x => x.enc === ev.id)) out.push(...tip(g, 'objetivo'));
    }
    if (ev.kind === 'trap') out.push(...tip(g, 'trampa'));
    if (ev.kind === 'scene') out.push(...tip(g, 'escena'));
    if (ev.kind === 'rest') out.push(...tip(g, 'descanso'));
    out.push(ev);
  }
  if (g.zone === 'z1') out.push(...tip(g, 'mover'));
  return out;
}
