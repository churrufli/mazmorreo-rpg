import type { LogLine } from '../engine/combat';

/** Bloque del registro de combate: una ronda y, dentro, los turnos con sus líneas. */
export interface LogRound { r: number; turns: { who?: string; lines: LogLine[] }[] }

/** Agrupa el registro por rondas y, dentro de cada ronda, por turnos seguidos del mismo personaje. */
export function groupLog(log: LogLine[]): LogRound[] {
  const rounds: LogRound[] = [];
  for (const l of log) {
    const r = l.r ?? rounds[rounds.length - 1]?.r ?? 1;
    let round = rounds[rounds.length - 1];
    if (!round || round.r !== r) rounds.push(round = { r, turns: [] });
    const turn = round.turns[round.turns.length - 1];
    if (turn && turn.who === l.who) turn.lines.push(l);
    else round.turns.push({ who: l.who, lines: [l] });
  }
  return rounds;
}
