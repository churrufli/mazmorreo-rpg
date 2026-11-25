// Caídos fuera del combate (SRD 5.2.1): siguen tirando salvaciones contra la muerte hasta estabilizarse,
// levantarse o morir (el autor 2026-11-25: «que los personajes puedan morir de verdad»).
import type { Game } from './game';
import { Char, abilMod } from './rules';
import { die } from './rng';
import type { Ev, ShownRoll } from './dungeon';

/** A 0 PG, vivo y sin estabilizar: se desangra. */
export const dying = (c: Char) => !c.dead && c.hp <= 0 && !c.stable;

/** Una salvación contra la muerte: 10 o más es un éxito, un 20 le levanta con 1 PG y un 1 cuenta como dos fallos. */
export function deathSave(g: Game, c: Char): { d: number; text: string; died: boolean; up: boolean } {
  const d = die(g.rng, 20);
  if (d === 20) {
    Object.assign(c, { hp: 1, deathS: 0, deathF: 0, stable: false });
    return { d, text: `${c.name} saca un 20 y se levanta con 1 PG.`, died: false, up: true };
  }
  if (d === 1) c.deathF += 2;
  else if (d >= 10) c.deathS += 1;
  else c.deathF += 1;
  if (c.deathF >= 3) {
    Object.assign(c, { dead: true, hp: 0, deathS: 0, deathF: 0, stable: false });
    return { d, text: `${c.name} saca un ${d}: tercer fallo. Ha muerto. Solo el templo de un pueblo puede devolverle la vida.`, died: true, up: false };
  }
  if (c.deathS >= 3) {
    Object.assign(c, { stable: true, deathS: 0, deathF: 0 });
    return { d, text: `${c.name} saca un ${d} y se estabiliza. Sigue inconsciente a 0 PG hasta que le curen o descanséis.`, died: false, up: true };
  }
  return { d, text: `${c.name}: salvación contra la muerte ${d} (${c.deathS} éxito${c.deathS === 1 ? '' : 's'}, ${c.deathF} fallo${c.deathF === 1 ? '' : 's'}).`, died: false, up: false };
}

/**
 * Cada casilla que avanza el grupo, cada caído sin estabilizar tira una salvación.
 * Una muerte se cuenta en un aviso; levantarse o estabilizarse, en la nota del mapa.
 */
export function bleed(g: Game): { evs: Ev[]; note?: string } {
  const evs: Ev[] = [];
  const notes: string[] = [];
  for (const c of g.party.filter(dying)) {
    const r = deathSave(g, c);
    if (r.died) evs.push({ kind: 'msg', title: `${c.name.split(' ')[0]} ha muerto`, portrait: c.img, lines: [r.text], save: true });
    else if (r.up) notes.push(r.text);
  }
  return { evs, note: notes.length ? notes.join(' ') : undefined };
}

/** Quién socorre a un caído: el compañero en pie con mejor Sabiduría (Medicina). */
export const medic = (g: Game, id: string) => g.party.filter(c => c.id !== id && !c.dead && c.hp > 0)
  .sort((a, b) => abilMod(b, 'wis') - abilMod(a, 'wis'))[0];

/**
 * Estabilizar a un caído: prueba de Sabiduría (Medicina) CD 10 de un compañero.
 * Si falla, pasa el tiempo y el caído tira otra salvación.
 */
export function stabilize(g: Game, id: string): Ev | undefined {
  const c = g.party.find(x => x.id === id);
  const who = medic(g, id);
  if (!c || !who || !dying(c)) return undefined;
  const d = die(g.rng, 20), bonus = abilMod(who, 'wis'), ok = d + bonus >= 10;
  const rolls: ShownRoll[] = [{ d20: d, bonus, dc: 10, ok, text: `${who.name.split(' ')[0]}: Medicina` }];
  if (ok) {
    Object.assign(c, { stable: true, deathS: 0, deathF: 0 });
    return { kind: 'msg', title: 'Estabilizado', portrait: c.img, rolls, save: true, lines: [`${who.name} venda las heridas de ${c.name}: ya no se desangra. Sigue inconsciente a 0 PG hasta que le curen o descanséis.`] };
  }
  const r = deathSave(g, c);
  return { kind: 'msg', title: r.died ? `${c.name.split(' ')[0]} ha muerto` : 'No lo consigue', portrait: c.img, rolls, save: true,
    lines: [`${who.name} no logra cortar la hemorragia.`, r.text] };
}
