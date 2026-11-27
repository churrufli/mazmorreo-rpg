// Pulir las nuevas modificaciones (2026-11-27): emboscadas, icono del mapa, secretos unidos y refuerzos del cuerno.
import { newGame } from './game';
import { enterZone, hkey, lightUp, neighbors, passable, plan, visibleCells } from './dungeon';
import { startCombat } from './combat';
import { firstFoe } from './escenas';
import { ambush, LURKERS } from './sorpresa';
import { MONSTERS } from '../data/srd';
import { ADV_LIST, ADVS } from './aventuras';
import type { Hex } from './dungeon';

describe('emboscadas de los bichos del bosque', () => {
  it('la araña gigante puede emboscaros y entonces el grupo tira la iniciativa con desventaja', () => {
    let hits = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const g = newGame(1, 'Prueba', 'fighter', 'dwarf');
      g.rng.seed = seed;
      enterZone(g, 'z2');
      const ev = ambush(g, 'z2_e02');
      // Solo se intenta una vez por grupo.
      expect(ambush(g, 'z2_e02')).toBeUndefined();
      if (!ev) { expect(g.ambush).toBeUndefined(); continue; }
      hits++;
      expect(ev.kind).toBe('msg');
      const cb = startCombat(g, 'z2_e02');
      expect(cb.log.some(l => l.t.includes('emboscado'))).toBe(true);
      expect(g.ambush).toBeUndefined();
    }
    expect(hits).toBeGreaterThan(0);
    expect(hits).toBeLessThan(40);
  });

  it('los goblins no emboscan: siguen saliendo «Enemigos a la vista»', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const g = newGame(1, 'Prueba', 'fighter', 'dwarf');
      g.rng.seed = seed;
      enterZone(g, 'z1');
      expect(ambush(g, 'z1_e01')).toBeUndefined();
    }
  });

  it('solo acechan arañas, lobos, jabalíes y serpientes, todas del SRD', () => {
    for (const k of Object.keys(LURKERS)) expect(MONSTERS[k]).toBeDefined();
  });
});

describe('icono del mapa', () => {
  it('enseña al enemigo más potente de los que lucharán de verdad', () => {
    for (const adv of ADV_LIST) {
      for (const z of ADVS[adv.id].data.zones) {
        const g = newGame(1, 'Prueba', 'fighter', 'dwarf');
        g.party[0].level = 3;
        enterZone(g, z.id);
        for (const r of z.rooms) for (const c of r.contents as any[]) {
          if (c.type !== 'encounter') continue;
          const foe = firstFoe(g, c.id, false);
          expect(MONSTERS[foe.srd_creature]).toBeDefined();
          const t = { ...g };
          const cb = startCombat(t, c.id);
          const xps = cb.units.filter(u => u.side === 'enemy' && u.mon && !MONSTERS[u.mon].piece).map(u => MONSTERS[u.mon!].xp);
          // Ningún enemigo del combate supera al del icono (los jefes con 0 PX salen siempre).
          if (xps.length && MONSTERS[foe.srd_creature].xp > 0) expect(MONSTERS[foe.srd_creature].xp).toBeGreaterThanOrEqual(Math.max(...xps));
        }
      }
    }
  });
});

describe('secretos descubiertos por una decisión', () => {
  it('quedan unidos a lo ya explorado, sin islas en la niebla', () => {
    for (const adv of ADV_LIST) {
      for (const z of ADVS[adv.id].data.zones) {
        for (const m of plan(z.id).marks.filter(x => x.kind === 'secret' && x.path?.length)) {
          const g = newGame(1, 'Prueba', 'fighter', 'dwarf');
          enterZone(g, z.id);
          g.found.push(m.id);
          lightUp(g, m.id);
          const vis = visibleCells(g);
          const pass = passable(g, z.id);
          for (const k of m.path!) expect(vis.has(k)).toBe(true);
          // Desde la entrada se llega al pasadizo por casillas visibles y transitables.
          const seen = new Set(g.visited);
          const q = [...g.visited];
          while (q.length) {
            const k = q.shift()!;
            for (const n of neighbors(k.split(',').map(Number) as Hex)) {
              const nk = hkey(n);
              if (!seen.has(nk) && vis.has(nk) && pass.has(nk)) { seen.add(nk); q.push(nk); }
            }
          }
          expect(m.path!.some(k => seen.has(k))).toBe(true);
        }
      }
    }
  });
});
