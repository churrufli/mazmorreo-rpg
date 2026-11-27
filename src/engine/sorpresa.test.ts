// Elegir cómo empieza el combate (2026-11-27): sigilo, sorpresa y estudiar a los enemigos.
import { newGame } from './game';
import { bossEncounter, enterZone } from './dungeon';
import { startCombat } from './combat';
import { approachable, sneak, study, traitsOf } from './sorpresa';

describe('sorpresa y estudio', () => {
  it('se puede elegir cómo empezar salvo con el jefe o con un grupo del que se huyó', () => {
    const g = newGame(1, 'Prueba', 'rogue', 'halfling');
    enterZone(g, 'z1');
    expect(approachable(g, 'z1_e01')).toBe(true);
    g.zone = 'z4';
    expect(approachable(g, bossEncounter('z4'))).toBe(false);
    g.fled.push('z1_e01');
    expect(approachable(g, 'z1_e01')).toBe(false);
  });

  it('con sorpresa, los enemigos tiran la iniciativa con desventaja', () => {
    let surprised = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const g = newGame(1, 'Prueba', 'rogue', 'halfling');
      g.rng.seed = seed;
      enterZone(g, 'z1');
      const r = sneak(g, 'z1_e01');
      expect(r.rolls).toHaveLength(1);
      if (!r.ok) { expect(g.surprise).toBeUndefined(); continue; }
      surprised++;
      const cb = startCombat(g, 'z1_e01');
      expect(cb.log.some(l => l.t.includes('sorprendido'))).toBe(true);
      expect(g.surprise).toBeUndefined();
    }
    // El pícaro mediano tiene pericia en Sigilo: casi siempre lo consigue.
    expect(surprised).toBeGreaterThan(15);
  });

  it('estudiar cuenta los rasgos y solo se hace una vez', () => {
    const g = newGame(1, 'Prueba', 'wizard', 'human');
    enterZone(g, 'z1');
    const ev = study(g, 'z1_e01');
    expect(ev.kind).toBe('msg');
    expect(g.studied).toContain('z1_e01');
    expect(traitsOf('Zombie')).toContain('cuesta tumbarlo');
  });
});
