// Estadística de partidas del bot (solo informativa). Ejecutar con: EQUILIBRIO=1 npx jest equilibrio
import { play } from './partida.test';
declare const process: { env: Record<string, string | undefined> };
const run = process.env.EQUILIBRIO ? test : test.skip;
run('equilibrio', () => {
  for (const cls of ['fighter', 'cleric', 'rogue', 'wizard'] as const) {
    const where: Record<string, number> = {};
    let wins = 0;
    for (let s = 1; s <= 60; s++) {
      const r = play(cls, 'human', s * 7919);
      if (r.result === 'win') wins++;
      else { const k = r.log.filter(l => /:lose/.test(l))[0] ?? r.g.zone; where[k] = (where[k] ?? 0) + 1; }
    }
    console.log(cls, 'victorias', wins, '/60', JSON.stringify(where));
  }
});
