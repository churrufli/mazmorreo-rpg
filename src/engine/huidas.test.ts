// Objetivos opcionales y huidas: ningún combate se queda colgado sin enemigos y el mapa
// recuerda solo a los que cayeron (el autor, opiniones v0.58).
import { newGame, Game } from './game';
import { enterZone } from './dungeon';
import { startCombat, enemyTurn, current, endTurn, withDice, actionsFor, targetsFor, perform, conscious, Combat } from './combat';
import { GOALS } from '../data/objetivos';
import { HERO_CLASSES, ClassId } from '../data/srd';

/** El grupo no muere y, si «wait», deja pasar el plazo del objetivo antes de pegar (para que el objetivo falle). */
function fight(g: Game, enc: string, wait: number): Combat {
  const cb = startCombat(g, enc);
  for (let i = 0; i < 600 && !cb.result; i++) {
    for (const u of cb.units) if (u.side === 'party') u.hp = Math.max(u.hp, 1000);
    // La comprobación clave: sin enemigos en pie, el combate tiene que haber terminado.
    if (!cb.units.some(u => u.side === 'enemy' && conscious(u))) throw new Error(`${enc}: sin enemigos y sin final`);
    if (current(cb).side === 'enemy' || current(cb).hp <= 0) { withDice(cb, () => enemyTurn(g, cb)); continue; }
    const atk = cb.round > wait && actionsFor(g, cb).find(a => a.cost === 'action' && a.target.startsWith('enemy') && !a.off && targetsFor(cb, a).length);
    if (atk) perform(g, cb, atk, targetsFor(cb, atk)[0].key);
    if (!cb.result) endTurn(g, cb);
  }
  return cb;
}

describe('objetivos opcionales y huidas', () => {
  for (const goal of GOALS) for (const hit of [false, true]) for (const cls of HERO_CLASSES as readonly ClassId[]) {
    it(`${goal.enc} (${goal.kind}) ${hit ? 'atacando' : 'esperando'} con ${cls}`, () => {
      for (let seed = 1; seed <= 6; seed++) {
        const g = newGame(seed, 'Prueba', cls, 'human');
        enterZone(g, goal.enc.split('_')[0]);
        const cb = fight(g, goal.enc, hit ? 0 : (goal.by ?? 2) + 1);
        expect(cb.result).toBeDefined();
        if (cb.result !== 'win') continue;
        // Ganado: no vuelve a salir en el mapa y la ficha cuenta solo a los caídos.
        expect(g.fled).not.toContain(goal.enc);
        const dead = cb.units.filter(u => u.side === 'enemy' && u.encounter === goal.enc && u.dead).length;
        const fell = Object.values(g.fallen?.[goal.enc] ?? {}).reduce((a, b) => a + b, 0);
        expect(fell).toBe(dead);
      }
    });
  }
});
