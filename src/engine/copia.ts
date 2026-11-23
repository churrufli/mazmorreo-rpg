import type { Game } from './game';

/**
 * Copia de seguridad de una partida: un texto que se guarda fuera del juego (en Android con Compartir,
 * en la web como archivo) y se restaura en un archivo de guardado vacío. Sin cuentas ni servidores.
 */
export interface Copia { mazmorreo: 1; build: number; game: Game }

export const exportGame = (g: Game, build: number): string => JSON.stringify({ mazmorreo: 1, build, game: g } satisfies Copia);

/** Lee una copia y la prepara para el archivo `slot`. Devuelve la partida o el motivo por el que no vale. */
export function importGame(text: string, slot: number, build: number): { game: Game } | { error: string } {
  let c: Partial<Copia>;
  try {
    c = JSON.parse(text.trim());
  } catch {
    return { error: 'El texto no es una copia de Mazmorreo. Pégalo entero, sin cortar.' };
  }
  const g = c?.game as Game | undefined;
  if (c?.mazmorreo !== 1 || !g || typeof g !== 'object' || !Array.isArray(g.party) || !g.party.length || !g.zone || !g.rng || !Array.isArray(g.visited)) {
    return { error: 'El texto no es una copia de Mazmorreo. Pégalo entero, sin cortar.' };
  }
  // Una copia de una versión más nueva puede traer datos que esta no entiende.
  if (build && typeof c.build === 'number' && c.build > build) {
    return { error: `La copia es de la versión v0.${c.build} y tienes la v0.${build}. Actualiza el juego antes de restaurarla.` };
  }
  g.slot = slot;
  g.log ??= [];
  return { game: g };
}
