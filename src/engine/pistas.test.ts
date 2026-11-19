// Cadena de pistas en Hondaroca y Maese Orvane según lo hecho antes (2026-11-19).
import { newGame, Game } from './game';
import { bossPrep, enterZone } from './dungeon';
import { startCombat } from './combat';
import { chooseOption, optionShown, sceneById } from './escenas';

function party(zone: string): Game {
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  g.rng.seed = 5;
  enterZone(g, zone);
  return g;
}
const orvane = (g: Game) => startCombat(g, 'z4_e05').units.find(u => u.mon === 'Orvane')!;

describe('cadena de pistas: el agua y el cristal', () => {
  it('sin haber leído la inscripción de la cripta no sale la opción de las compuertas', () => {
    const g = party('z4');
    const s = sceneById('z4_p01')!;
    const i = s.options.findIndex(o => o.if === 'pista_agua');
    expect(i).toBeGreaterThanOrEqual(0);
    expect(optionShown(g, s, i)).toBe(false);
    g.flags = ['pista_agua'];
    expect(optionShown(g, s, i)).toBe(true);
  });

  it('cerrar las compuertas deja a Orvane con un Escudo menos y se avisa antes del jefe', () => {
    const g = party('z4');
    const before = orvane(g).shieldSlots!;
    expect(bossPrep(g, 'Orvane')).toEqual([]);
    g.flags = ['pista_agua'];
    const s = sceneById('z4_p01')!;
    chooseOption(g, 'z4_p01', s.options.findIndex(o => o.if === 'pista_agua'));
    expect(g.flags).toContain('z4_compuertas');
    expect(orvane(g).shieldSlots).toBe(before - 1);
    expect(bossPrep(g, 'Orvane').join(' ')).toMatch(/Escudo menos/);
  });

  it('cortar el ritual también se anuncia antes del jefe', () => {
    const g = party('z4');
    g.goals = { z4_e03: 'ok' };
    expect(bossPrep(g, 'Orvane').join(' ')).toMatch(/Rayo abrasador menos/);
    expect(bossPrep(g, 'Young White Dragon')).toEqual([]);
  });
});
