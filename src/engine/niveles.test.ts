// Estudio con el bot (solo informativo): victorias, dónde cae, nivel del grupo ante cada jefe y PX al empezar cada zona.
// Ejecutar con: NIVELES=1 N=10 npx jest niveles --runInBand (ONLY=montana para una sola; XP2/XP3 cambian los PX iniciales).
import { play, REC, TOWN } from './partida.test';
import * as combat from './combat';
import { HERO_CLASSES } from '../data/srd';
declare const process: { env: Record<string, string | undefined> };
const N = Number(process.env.N ?? 10);
const run = process.env.NIVELES ? test : test.skip;
const ESC: Record<string, string> = { fighter: 'edmund', cleric: 'brunna', rogue: 'brunna', wizard: 'brunna', ranger: 'brunna', paladin: 'liss' };
run('niveles', () => {
  TOWN.on = true;
  const orig = combat.startCombat;
  let atBoss: number[] | undefined;
  let zl: Record<string, number[]> = {};
  let seenZ = new Set<string>();
  const spy = jest.spyOn(combat, 'startCombat').mockImplementation((g: any, id: string) => {
    if (!seenZ.has(g.zone)) { seenZ.add(g.zone); (zl[g.zone] ??= []).push(g.party.find((c: any) => c.isHero).xp); }
    atBoss = g.party.filter((c: any) => !c.dead).map((c: any) => c.level);
    return orig(g, id);
  });
  const cfg: [string, string, number, (c: string) => string | undefined][] = [
    ['hondaroca', 'z1', Number(process.env.XP1 ?? 0), () => undefined],
    ['corazon', 'b1', Number(process.env.XP2 ?? 300), c => ESC[c]],
    ['montana', 'm1', Number(process.env.XP3 ?? 900), () => 'maren'],
  ];
  for (const [name, start, xp, esc] of cfg) {
    if (process.env.ONLY && !process.env.ONLY.includes(name)) continue;
    zl = {};
    REC.cur = process.env.DETALLE ? { combats: [], acts: {}, idle: 0 } : undefined;
    const lv: Record<string, number> = {}; let wins = 0, n = 0; const where: Record<string, number> = {};
    for (const cls of HERO_CLASSES) for (let s = 1; s <= N; s++) {
      atBoss = undefined; n++; seenZ = new Set();
      const r = play(cls as any, 'human', s * 7919, start, xp, 'asi', esc(cls));
      if (r.result === 'win') wins++; else { const k = r.log.filter((l: string) => /:lose/.test(l))[0]?.split(':')[0] ?? r.g.zone; where[k] = (where[k] ?? 0) + 1; }
      const k = r.result === 'win' && atBoss ? (atBoss as number[]).join('').split('').sort().join('') : 'no llega';
      lv[k] = (lv[k] ?? 0) + 1;
    }
    console.log(name, 'xp inicial', xp, 'victorias', wins, '/', n, 'cae', JSON.stringify(where), 'niveles ante el jefe (partidas ganadas)', JSON.stringify(lv));
    if (REC.cur) {
      const by: Record<string, { n: number; lost: number }> = {};
      for (const c of REC.cur.combats) { const e = (by[c.id] ??= { n: 0, lost: 0 }); e.n++; e.lost += c.lost; }
      console.log('PG perdidos por combate', Object.entries(by).sort((a, b) => b[1].lost / b[1].n - a[1].lost / a[1].n).map(([id, e]) => `${id} ${Math.round((e.lost / e.n) * 100)}%`).join(', '));
      REC.cur = undefined;
    }
    console.log('PX medios del héroe al primer combate de cada zona', Object.entries(zl).map(([z, a]) => `${z} ${Math.round(a.reduce((x, y) => x + y, 0) / a.length)} (${a.length})`).join(', '));
  }
  spy.mockRestore();
});
