// Medición de la economía con el bot (solo informativa). Ejecutar con: ESTUDIO=1 npx jest economia
import { play, TOWN } from './partida.test';
import { HERO_CLASSES, ITEMS, ClassId } from '../data/srd';
declare const process: { env: Record<string, string | undefined> };
const run = process.env.ESTUDIO ? test : test.skip;
const N = Number(process.env.N ?? 10);

run('economía', () => {
  const out: string[] = [];
  for (const [adv, start, xp] of [['hondaroca', 'z1', 0], ['corazon', 'b1', 2700]] as const) {
    for (const cls of HERO_CLASSES as ClassId[]) {
      let wins = 0, gold = 0, sell = 0, potions = 0, n = 0, spent = 0;
      for (let s = 1; s <= N; s++) {
        TOWN.on = true;
        const before = { trips: TOWN.trips };
        const r = play(cls, 'human', s * 7919, start, xp, 'asi', start === 'b1' ? 'brunna' : undefined);
        void before;
        if (r.result !== 'win') continue;
        wins++; n++;
        const st = Object.values(r.g.stats ?? {});
        gold += st.reduce((a, z) => a + z.gold, 0);
        spent += st.reduce((a, z) => a + z.gold, 0) - r.g.gold;
        for (const c of r.g.party) for (const it of c.items) {
          const d = ITEMS[it.id];
          if (!d || it.basic) continue;
          if (d.kind === 'potion') potions++;
          if (d.value && !/key|amulet|relic|fragment/.test(it.id)) sell += Math.floor(d.value / (d.value >= 100 ? 4 : 2));
        }
      }
      out.push(`${adv} ${cls}: victorias ${wins}/${N} · oro ganado ${Math.round(gold / n)} · gastado (resucitar) ${Math.round(spent / n)} · venta de mochila ${Math.round(sell / n)} · pociones sin usar ${(potions / n).toFixed(1)}`);
    }
  }
  console.log(out.join('\n'));
});
