// Tutorial en el campo de batalla (el autor 2026-11-19): en el primer combate se iluminan los botones paso a paso,
// y algunos avisos salen una sola vez cuando se da la situación (vida baja, compañeros, objetivo).
// Se guarda en la partida (Game.guide): sale una vez en cada partida nueva.
import type { Combat, Unit } from '../engine/combat';
import type { Game } from '../engine/game';
import { ITEMS } from '../data/srd';

/** Zona de la pantalla que se ilumina. */
export type TutoTarget = 'turns' | 'budget' | 'enemies' | 'categories' | 'fixed' | 'end' | 'items' | 'flee' | 'partyRows' | 'goal';
export interface TutoStep { id: string; target: TutoTarget; title: string; text: string; /** Paso del recorrido inicial del primer combate. */ basic?: boolean }

/** Recorrido del primer combate, en orden. */
export const BASIC: TutoStep[] = [
  { id: 'turnos', target: 'turns', title: 'Orden de los turnos', text: 'Arriba se ve quién actúa y en qué orden. El retrato grande es quien tiene el turno ahora.' },
  { id: 'presupuesto', target: 'budget', title: 'Tu turno', text: 'Cada turno tienes una acción, una acción adicional y un movimiento. Lo que gastas se tacha.' },
  { id: 'atacar', target: 'enemies', title: 'Atacar', text: 'Toca a un enemigo para atacarle con tu arma. Mantén pulsada su carta para ver su ficha.' },
  { id: 'acciones', target: 'categories', title: 'Tus acciones', text: 'Aquí están tus ataques, habilidades y objetos. Mantén pulsado cualquier botón para leer qué hace sin usarlo.' },
  { id: 'fijos', target: 'fixed', title: 'Defenderse y moverse', text: 'ESQUIVAR hace que a los enemigos les cueste más acertarte hasta tu próximo turno. IR ATRÁS o IR DELANTE te cambia de fila y gasta el movimiento.' },
  { id: 'terminar', target: 'end', title: 'Terminar el turno', text: 'Cuando acabes, toca TERMINAR TURNO y actuará el siguiente.' },
].map(s => ({ ...s, basic: true } as TutoStep));

export const TUTO_IDS = [...BASIC.map(s => s.id), 'filas', 'objetivo', 'vida'];
export const TUTO_KEYS = TUTO_IDS.map(k => `tuto:${k}`);
const key = (id: string) => `tuto:${id}`;

/** El paso que toca enseñar ahora, o ninguno. `seen` lee lo ya visto en el dispositivo. */
export function tutoStep(g: Game, cb: Combat, me: Unit, seen: (k: string) => boolean): TutoStep | undefined {
  if (me.side !== 'party' || cb.result) return undefined;
  const basic = BASIC.find(s => !seen(key(s.id)));
  // Atacar se da por aprendido en cuanto se usa la acción.
  if (basic && !(basic.id === 'atacar' && cb.acted)) return basic;
  if (basic) return BASIC.slice(BASIC.indexOf(basic) + 1).find(s => !seen(key(s.id)));
  const party = cb.units.filter(u => u.side === 'party' && !u.dead);
  if (party.length > 1 && !seen(key('filas')))
    return { id: 'filas', target: 'partyRows', title: 'Vanguardia y retaguardia', text: 'Delante luchan los de cuerpo a cuerpo. Detrás, magos y arqueros están a salvo mientras alguien aguante delante.' };
  if (cb.goal?.status === 'open' && !seen(key('objetivo')))
    return { id: 'objetivo', target: 'goal', title: 'Objetivo del combate', text: 'Este combate tiene un objetivo opcional. Cumplirlo da un premio y a veces cambia lo que viene después.' };
  if (me.hp > 0 && me.hp < me.maxHp / 2 && !seen(key('vida'))) {
    const c = g.party.find(x => x.id === me.charId);
    const potion = !!c?.items.some(i => ITEMS[i.id]?.kind === 'potion' && ITEMS[i.id]?.heal);
    return potion
      ? { id: 'vida', target: 'items', title: 'Vas mal de vida', text: 'En OBJETOS puedes beber una poción de curación.' }
      : { id: 'vida', target: 'flee', title: 'Vas mal de vida', text: 'No llevas pociones de curación. Si el combate se pone feo, con HUIR el grupo se retira una casilla.' };
  }
  return undefined;
}

export const tutoKey = key;
