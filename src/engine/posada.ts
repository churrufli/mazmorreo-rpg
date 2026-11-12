// La posada: quién acompaña al héroe, charlas con los aliados (afinidad e Inspiración heroica)
// y aviso de la aventura siguiente.
import CH from '../data/charlas.json';
import type { AdvId } from './aventuras';
import { ADV_LIST, wonAdv } from './aventuras';
import { DialogueLine, handOver } from './dungeon';
import type { Game } from './game';
import type { Char } from './rules';

/** Héroe y hasta tres aliados. */
export const MAX_PARTY = 4;
/** Nombre corto sin tratamiento: «Hermano Edmund» → «Edmund». */
export const short = (c: Char) => c.name.replace(/^(Hermano|Hermana|Dama|Maese) /, '').split(' ')[0];

const TALKS = CH as Record<string, { talks: DialogueLine[][]; insp: string }>;

/** Aventuras terminadas con ese aliado en el grupo (las partidas de antes cuentan la suya si se ganó). */
export const advsWith = (g: Game, c: Char) => g.bond?.[c.id]?.advs ?? (wonAdv(g, c.adv ?? 'hondaroca') ? 1 : 0);
export const talksDone = (g: Game, id: string) => g.bond?.[id]?.talks ?? 0;

/** Siguiente charla que se puede tener con él (0, 1 o 2), si la hay. */
export function nextTalk(g: Game, c: Char): number | undefined {
  if (c.isHero || !TALKS[c.id]) return undefined;
  const n = talksDone(g, c.id);
  return n < 3 && n < advsWith(g, c) ? n : undefined;
}

export const talkLines = (id: string, n: number) => TALKS[id].talks[n];

/** Termina una charla: sube la afinidad y, con la tercera, el aliado gana Inspiración heroica. */
export function finishTalk(g: Game, id: string): string[] {
  const c = [...g.party, ...(g.bench ?? [])].find(x => x.id === id)!;
  const b = { talks: talksDone(g, id) + 1, advs: advsWith(g, c) };
  g.bond = { ...g.bond, [id]: b };
  const first = short(c);
  if (b.talks < 3) return [`Afinidad con ${first}: ${b.talks} de 3.`];
  c.inspired = true;
  return [`Afinidad con ${first}: 3 de 3.`, `«${TALKS[id].insp}.»`, `${first} gana Inspiración heroica: una vez por aventura repetirá una tirada fallida.`];
}

/** Al terminar una aventura: cuenta para la afinidad de los que fueron y avisa de la aventura siguiente. */
export function endAdventure(g: Game, adv: AdvId) {
  for (const c of g.party) {
    if (c.isHero || !TALKS[c.id]) continue;
    // Partidas de antes: su propia aventura, si ya estaba ganada, también cuenta.
    const before = g.bond?.[c.id]?.advs ?? ((c.adv ?? 'hondaroca') !== adv && wonAdv(g, c.adv ?? 'hondaroca') ? 1 : 0);
    g.bond = { ...g.bond, [c.id]: { talks: talksDone(g, c.id), advs: before + 1 } };
  }
  // Sin encargos (el autor 2026-11-06). Aviso de la aventura que se abre al vencer al jefe.
  const next = ADV_LIST.find(a => a.prev === adv);
  if (g.errands?.includes(adv)) return;
  g.errands = [...(g.errands ?? []), adv];
  const news: string[] = next ? [`Ya podéis viajar a la siguiente aventura, ${next.name}: id a la puerta del pueblo.`] : [];
  if (news.length) g.news = [...(g.news ?? []), ...news];
}

/**
 * Manda a un aliado a esperar en la posada. Antes reparte lo que no lleva puesto entre los que siguen;
 * lo que no cabe va al baúl de la posada.
 */
export function sendToInn(g: Game, c: Char): string[] {
  g.party = g.party.filter(p => p !== c);
  g.bench = [...(g.bench ?? []), c];
  if (g.chosen) g.chosen = g.chosen.filter(x => x !== c.id);
  return [`${c.name} vuelve al pueblo y os esperará en la posada.`, ...handOver(g, c)];
}
