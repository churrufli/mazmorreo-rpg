// Elegir cómo empieza el combate (2026-11-27): acercarse en sigilo, atacar o estudiar a los enemigos.
// Sorpresa del SRD 5.2.1: quien es sorprendido tira la iniciativa con desventaja, y nada más.
// Estudiar es la acción Estudio: una prueba de Inteligencia (Arcanos, Naturaleza o Religión) que desvela sus rasgos.
import { MONSTERS, SKILLS, Skill } from '../data/srd';
import { bossEncounter, encounterById, Ev, ShownRoll } from './dungeon';
import { enemiesOf } from './escenas';
import type { Game } from './game';
import { die } from './rng';
import { Char, elvenBoots, isDown, passivePerception, skillBonus } from './rules';

/** ¿Se puede elegir cómo empezar este combate? No con el jefe ni con un grupo del que ya huisteis. */
export const approachable = (g: Game, id: string) =>
  !!encounterById(id) && id !== bossEncounter(g.zone) && !g.fled.includes(id) && !g.done.includes(id) && g.party.some(c => !isDown(c));

const mons = (g: Game, id: string) => enemiesOf(g, id).map(e => MONSTERS[e.srd_creature]).filter(Boolean);

/** CD de Sigilo: la Percepción pasiva del enemigo más atento (10 + su Sabiduría). */
export const sneakDc = (g: Game, id: string) => 10 + Math.max(0, ...mons(g, id).map(m => m.saves.wis ?? 0));

/** Quién estudia: el que mejor sabe de Arcanos, Naturaleza o Religión, con esa habilidad. */
export function studyWho(g: Game): { c: Char; skill: Skill } {
  const up = g.party.filter(c => !isDown(c));
  const opts = up.flatMap(c => (['arcana', 'nature', 'religion'] as Skill[]).map(skill => ({ c, skill, b: skillBonus(c, skill) })));
  const best = opts.sort((a, b) => b.b - a.b)[0];
  return { c: best.c, skill: best.skill };
}
export const STUDY_DC = 12;

/** Prueba de grupo de Sigilo (SRD 5.2.1): sale bien si al menos la mitad del grupo la supera. */
export function sneak(g: Game, id: string): { ok: boolean; rolls: ShownRoll[] } {
  const dc = sneakDc(g, id);
  const up = g.party.filter(c => !isDown(c));
  const rolls = up.map(c => {
    const d = elvenBoots(c) ? Math.max(die(g.rng, 20), die(g.rng, 20)) : die(g.rng, 20), bonus = skillBonus(c, 'stealth');
    return { d20: d, bonus, dc, ok: d + bonus >= dc, text: `Sigilo de ${c.name}` };
  });
  const ok = rolls.filter(r => r.ok).length * 2 >= up.length;
  if (ok) g.surprise = id;
  return { ok, rolls };
}

/** Lo que se sabe de cada criatura al estudiarla: resistencias, vulnerabilidades y rasgos especiales. */
export function traitsOf(mon: string): string {
  const m = MONSTERS[mon];
  const t: string[] = [];
  if (m.vuln?.length) t.push(`vulnerable a ${m.vuln.join(', ')}`);
  if (m.resist?.length) t.push(`resiste ${m.resist.join(', ')}`);
  if (m.immune?.length) t.push(`inmune a ${m.immune.join(', ')}`);
  if (m.undeadFortitude) t.push('cuesta tumbarlo salvo con daño radiante o un crítico');
  if (m.packTactics) t.push('caza en manada');
  if (m.attacks.some(a => a.paralyze)) t.push('su ataque puede paralizar');
  if (m.attacks.some(a => a.save?.area)) t.push('tiene un ataque que alcanza a toda una fila');
  if (m.noSleep) t.push('no se le puede dormir');
  return `${m.name}: CA ${m.ac}${t.length ? `, ${t.join('; ')}` : ', sin rasgos especiales'}.`;
}

/** Estudiar a los enemigos: con éxito, se cuenta lo que tienen de especial. Solo una vez por grupo. */
export function study(g: Game, id: string): Ev {
  const { c, skill } = studyWho(g);
  const d = die(g.rng, 20), bonus = skillBonus(c, skill);
  const ok = d + bonus >= STUDY_DC;
  g.studied = [...(g.studied ?? []), id];
  const kinds = [...new Set(enemiesOf(g, id).map(e => e.srd_creature).filter(k => MONSTERS[k]))];
  return {
    kind: 'msg', title: 'Estudiarlos',
    rolls: [{ d20: d, bonus, dc: STUDY_DC, ok, text: `${SKILLS[skill].name} de ${c.name}` }],
    lines: ok ? [`${c.name} los observa con calma y reconoce lo que son.`, ...kinds.map(traitsOf)] : [`${c.name} no saca nada en claro desde aquí.`],
  };
}

/**
 * Criaturas que acechan y pueden emboscar al grupo, con su Sigilo del SRD 5.2.1 (sin la habilidad, su Destreza).
 * Solo los bichos del bosque: arañas, lobos, jabalíes y serpientes (el autor 2026-11-27).
 */
export const LURKERS: Record<string, number> = {
  Spider: 4, 'Giant Spider': 7, Wolf: 4, 'Dire Wolf': 4, 'Winter Wolf': 5,
  Boar: 0, 'Giant Boar': 0, 'Venomous Snake': 2, 'Giant Constrictor Snake': 2,
};

/**
 * Emboscada: si todo el grupo enemigo son criaturas que acechan, el más sigiloso tira Sigilo contra la
 * Percepción pasiva más alta del grupo. Si gana, no hay cuadro de elegir: el grupo queda sorprendido
 * (tira la iniciativa con desventaja). Solo se intenta una vez por grupo de enemigos.
 */
export function ambush(g: Game, id: string): Ev | undefined {
  if (g.lurked?.includes(id)) return undefined;
  const foes = enemiesOf(g, id).filter(e => e.count > 0 && MONSTERS[e.srd_creature]);
  if (!foes.length || !foes.every(e => e.srd_creature in LURKERS)) return undefined;
  g.lurked = [...(g.lurked ?? []), id];
  const up = g.party.filter(c => !isDown(c));
  if (!up.length) return undefined;
  const lead = [...foes].sort((a, b) => LURKERS[b.srd_creature] - LURKERS[a.srd_creature])[0];
  const pp = Math.max(...up.map(passivePerception));
  if (die(g.rng, 20) + LURKERS[lead.srd_creature] < pp) return undefined;
  g.ambush = id;
  return {
    kind: 'msg', title: '¡Emboscada!', img: MONSTERS[lead.srd_creature].img,
    lines: ['Salen de su escondite antes de que los veáis.', 'Os han sorprendido: tiráis la iniciativa con desventaja.'],
  };
}
