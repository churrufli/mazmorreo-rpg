// Estudio de jugabilidad con el bot (solo informativo). Ejecutar con: ESTUDIO=1 npx jest estudio
// Juega muchas partidas con las 16 combinaciones de Hondaroca y las 4 clases en el bosque (solo y con escolta)
// y escribe un resumen: victorias, dónde cae, rondas por combate, combates de relleno y acciones repetidas.
import { play, REC, Rec, TOWN } from './partida.test';
import { HERO_CLASSES, SPECIES, SpeciesId, ClassId } from '../data/srd';
declare const process: { env: Record<string, string | undefined> };
declare const require: (m: string) => any;
const run = process.env.ESTUDIO ? test : test.skip;
const N = Number(process.env.N ?? 20);

function sample(f: (seed: number) => ReturnType<typeof play>) {
  const rec: Rec = { combats: [], acts: {}, idle: 0 };
  TOWN.on = !process.env.SIN_PUEBLO;
  TOWN.trips = 0;
  REC.cur = rec;
  let wins = 0;
  const where: Record<string, number> = {};
  for (let s = 1; s <= N; s++) {
    const r = f(s * 7919);
    if (r.result === 'win') wins++;
    else where[r.g.zone] = (where[r.g.zone] ?? 0) + 1;
  }
  REC.cur = undefined;
  const cs = rec.combats;
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const total = Object.values(rec.acts).reduce((a, b) => a + b, 0);
  const top = Object.entries(rec.acts).sort((a, b) => b[1] - a[1])[0];
  return {
    wins, where,
    rounds: avg(cs.map(c => c.rounds)),
    long: cs.filter(c => c.rounds >= 6).length / Math.max(1, cs.length),
    filler: cs.filter(c => c.result === 'win' && c.lost < 0.05).length / Math.max(1, cs.length),
    downs: avg(cs.map(c => c.down)),
    top: top ? `${top[0]} ${Math.round((top[1] / total) * 100)}%` : '-',
    idle: rec.idle,
    trips: TOWN.trips / N,
    byId: cs,
  };
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

run('estudio de jugabilidad', () => {
  const out: string[] = ['# Estudio con el bot', '', `Partidas por combinación: ${N}.`, ''];
  out.push('## Hondaroca (héroe solo en la zona 1, aliados después)', '', '| Héroe | Victorias | Cae en | Viajes al pueblo | Rondas/combate | Combates de 6+ rondas | Combates de relleno | Acción más usada |', '|---|---|---|---|---|---|---|---|');
  const enc: Record<string, { n: number; lost: number; rounds: number; downs: number }> = {};
  for (const cls of HERO_CLASSES as ClassId[]) for (const sp of Object.keys(SPECIES) as SpeciesId[]) {
    const r = sample(seed => play(cls, sp, seed));
    for (const c of r.byId) { const e = (enc[c.id] ??= { n: 0, lost: 0, rounds: 0, downs: 0 }); e.n++; e.lost += c.lost; e.rounds += c.rounds; e.downs += c.down; }
    out.push(`| ${cls}/${sp} | ${r.wins}/${N} | ${JSON.stringify(r.where).replace(/[{}"]/g, '') || '-'} | ${r.trips.toFixed(1)} | ${r.rounds.toFixed(1)} | ${pct(r.long)} | ${pct(r.filler)} | ${r.top} |`);
  }
  out.push('', '## El Corazón Hueco (llega con 2.700 PX, nivel 4)', '', '| Héroe | Solo: victorias | Solo: cae en | Con escolta: victorias | Con escolta: cae en | Rondas/combate (escolta) |', '|---|---|---|---|---|---|');
  const ESC: Record<string, string> = { fighter: 'edmund', cleric: 'brunna', rogue: 'brunna', wizard: 'brunna', ranger: 'brunna', paladin: 'liss' };
  for (const cls of HERO_CLASSES as ClassId[]) {
    const a = sample(seed => play(cls, 'human', seed, 'b1', 2700));
    const b = sample(seed => play(cls, 'human', seed, 'b1', 2700, 'asi', ESC[cls]));
    for (const c of b.byId) { const e = (enc[c.id] ??= { n: 0, lost: 0, rounds: 0, downs: 0 }); e.n++; e.lost += c.lost; e.rounds += c.rounds; e.downs += c.down; }
    out.push(`| ${cls} | ${a.wins}/${N} | ${JSON.stringify(a.where).replace(/[{}"]/g, '') || '-'} | ${b.wins}/${N} | ${JSON.stringify(b.where).replace(/[{}"]/g, '') || '-'} | ${b.rounds.toFixed(1)} |`);
  }
  out.push('', '## Encuentros', '', '| Encuentro | Veces | PG perdidos (media) | Rondas | Caídos por combate |', '|---|---|---|---|---|');
  for (const [id, e] of Object.entries(enc).sort((x, y) => y[1].lost / y[1].n - x[1].lost / x[1].n)) {
    out.push(`| ${id} | ${e.n} | ${pct(e.lost / e.n)} | ${(e.rounds / e.n).toFixed(1)} | ${(e.downs / e.n).toFixed(2)} |`);
  }
  const fs = require('fs');
  fs.writeFileSync(process.env.ESTUDIO_OUT ?? 'estudio.md', out.join('\n'));
  console.log(out.slice(0, 40).join('\n'));
});
