// Decisiones que dejan huella (2026-11-16): objetivos de combate con consecuencias más adelante,
// vías de escena que solo salen por algo hecho antes, aliados que no son siempre la mejor respuesta,
// el arranque de Hondaroca y variantes de enemigos que no se disparan respecto a la original.
import { newGame, Game } from './game';
import { enterZone, pendingNotes } from './dungeon';
import { devWin, startCombat } from './combat';
import { createAlly } from './rules';
import { applyEffect, chooseOption, enemiesOf, optionShown, sceneById, sizeEncounter } from './escenas';
import { MONSTERS } from '../data/srd';
import hondaroca from '../data/hondaroca.json';
import corazon from '../data/corazon.json';
import montana from '../data/montana.json';

function party(zone: string, allies: string[] = []): Game {
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  g.rng.seed = 5;
  for (const a of allies) g.party.push(createAlly(a, 3, 900));
  enterZone(g, zone);
  return g;
}
const count = (g: Game, id: string) => enemiesOf(g, id).reduce((n, e) => n + e.count, 0);
/** Gana el combate con el objetivo cumplido o fallado. */
function win(g: Game, enc: string, ok: boolean) {
  const cb = startCombat(g, enc);
  expect(cb.goal?.status).toBe('open');
  if (ok) cb.goal!.status = 'ok';
  devWin(g, cb);
  return cb;
}

describe('objetivos con consecuencias', () => {
  it('si el vigía del pozo escapa, la prisión de la zona 2 espera con refuerzos y el diario lo apunta', () => {
    for (const ok of [true, false]) {
      const g = party('z1', ['brunna']);
      const cb = win(g, 'z1_e06', ok);
      expect(g.goals?.z1_e06).toBe(ok ? 'ok' : 'fail');
      expect(cb.summary!.some(l => l.includes('alarma'))).toBe(!ok);
      expect(pendingNotes(g, 'hondaroca').some(t => t.includes('alarma'))).toBe(!ok);
      const ref = party('z2', ['brunna']);
      enterZone(g, 'z2');
      sizeEncounter(g, ['z2_e01'], false);
      sizeEncounter(ref, ['z2_e01'], false);
      expect(count(g, 'z2_e01')).toBe(count(ref, 'z2_e01') + (ok ? 0 : 1));
    }
  });

  it('el refuerzo también se nota con el héroe solo fuera de la zona 1, pero no en la zona 1', () => {
    const g = party('z2');
    applyEffect(g, { add: 'z2_e01' });
    sizeEncounter(g, ['z2_e01'], false);
    expect(count(g, 'z2_e01')).toBe(2);
    const z1 = party('z1');
    applyEffect(z1, { add: 'z1_e05' });
    sizeEncounter(z1, ['z1_e05'], false);
    expect(count(z1, 'z1_e05')).toBe(1);
  });

  it('rendir a la dríade deja al Corazón Hueco con un árbol despertado menos', () => {
    const g = party('b4', ['tiko', 'brunna', 'edmund']);
    const ref = party('b4', ['tiko', 'brunna', 'edmund']);
    win(g, 'b4_e02', true);
    for (const x of [g, ref]) sizeEncounter(x, ['b4_e04'], true);
    const trees = (x: Game) => enemiesOf(x, 'b4_e04').filter(e => e.srd_creature === 'Awakened Tree').reduce((n, e) => n + e.count, 0);
    expect(trees(g)).toBe(trees(ref) - 1);
    expect(enemiesOf(g, 'b4_e04').some(e => e.srd_creature === 'Treant')).toBe(true);
  });

  it('si el kobold del tributo da la voz, Vharzûl espera con un kobold más', () => {
    const g = party('m4', ['tiko', 'brunna']);
    const ref = party('m4', ['tiko', 'brunna']);
    // A nivel 6, como se llega a la montaña: el combate del tributo conserva a la cría y al kobold.
    for (const x of [g, ref]) x.party.forEach(c => (c.level = 6));
    win(g, 'm4_e03', false);
    for (const x of [g, ref]) sizeEncounter(x, ['m4_e05'], true);
    expect(count(g, 'm4_e05')).toBe(count(ref, 'm4_e05') + 1);
    expect(enemiesOf(g, 'm4_e05').filter(e => e.srd_creature === 'Young White Dragon')[0].count).toBe(1);
  });

  it('el resinero rescatado abre una vía nueva en la caja de los resineros', () => {
    const g = party('b2', ['tiko']);
    const s = sceneById('b2_q01')!;
    const i = s.options.findIndex(o => o.if === 'b2_resinero');
    expect(i).toBeGreaterThanOrEqual(0);
    expect(optionShown(g, s, i)).toBe(false);
    win(g, 'b2_e08', true);
    expect(optionShown(g, s, i)).toBe(true);
    const gold = g.gold;
    chooseOption(g, 'b2_q01', i);
    expect(g.gold).toBe(gold + 6);
    expect(g.found).toContain('b2_s02');
  });
});

describe('vías de aliados que no son siempre la mejor', () => {
  const scenes = [hondaroca, corazon, montana].flatMap((d: any) => d.zones.flatMap((z: any) => z.rooms.flatMap((r: any) => r.contents)))
    .filter((c: any) => c.type === 'scene' && c.options.some((o: any) => o.ally));
  const worth = (e: any) => (e.gold ?? 0) + (e.item ? 25 : 0) + (e.reveal ? 20 : 0) + (e.heal ?? 0) * 3;
  it('en las escenas con botín revisadas, otra vía con tirada da algo más que la del aliado', () => {
    for (const id of ['z1_p02', 'z2_q01', 'z3_p02', 'z3_q01', 'b2_q02', 'b3_q02', 'b4_q01', 'm3_p01', 'm3_q02', 'm4_p03']) {
      const s: any = scenes.find((c: any) => c.id === id);
      const ally = s.options.find((o: any) => o.ally);
      expect(`${id} ${s.options.some((o: any) => o.attr && worth(o.ok) > worth(ally.ok))}`).toBe(`${id} true`);
      // Siempre queda una vía para quien no lleva a ese aliado.
      expect(s.options.some((o: any) => !o.ally)).toBe(true);
    }
  });
});

describe('arranque de Hondaroca', () => {
  it('la viga que cede: coger lo que asoma es seguro; arriesgarse da una cuerda que abre el arcón del pozo', () => {
    const s = sceneById('z1_p01')!;
    const safe = s.options.findIndex(o => !o.attr);
    const risky = s.options.filter(o => o.attr);
    expect(s.options[safe].ok.item).toBeUndefined();
    expect(risky.length).toBe(2);
    for (const o of risky) expect(o.ok.item).toBe('rope');
    const obstacle: any = hondaroca.zones[0].rooms.flatMap((r: any) => r.contents).find((c: any) => c.id === 'z1_o01');
    expect(obstacle.obstacle.needs).toContain('rope');
    const g = party('z1');
    chooseOption(g, 'z1_p01', safe);
    expect(g.done).toContain('z1_p01');
    expect(g.party[0].items.some(i => i.id === 'rope')).toBe(false);
  });
});

describe('equilibrio de variantes', () => {
  // Amenaza aproximada: PG × daño medio por asalto contra CA 15. Una variante no debe pasar del doble de la original
  // (antes: constrictora gigante ×4 frente al jabalí gigante e hipogrifo ×2 frente a la arpía).
  const avg = (d: string) => d.split('+').reduce((n, p) => { const m = p.match(/(\d+)d(\d+)/); return n + (m ? +m[1] * (+m[2] + 1) / 2 : +p); }, 0);
  const threat = (k: string) => {
    const m = MONSTERS[k];
    const hit = (b: number) => Math.min(0.95, Math.max(0.05, (6 + b) / 20));
    // Tácticas de manada: ventaja (se tira dos veces).
    const adv = (p: number) => (m.packTactics ? 1 - (1 - p) ** 2 : p);
    const best = Math.max(...m.attacks.map(a => (a.save ? 0.6 : adv(hit(a.bonus))) * (avg(a.dice) + (a.extra ? avg(a.extra.dice) : 0))));
    return m.hp * best * (m.multi ?? 1);
  };
  it('ninguna variante duplica la amenaza de la criatura original', () => {
    for (const d of [hondaroca, corazon, montana] as any[]) for (const z of d.zones) for (const r of z.rooms) for (const c of r.contents) {
      if (c.type !== 'encounter') continue;
      // Las criaturas de VD 0 y 1/8 tienen 1-5 PG: el cociente no dice nada (y el autor quiso algunas más flojas).
      for (const e of c.enemies) for (const a of MONSTERS[e.srd_creature].xp >= 50 ? e.alt ?? [] : []) {
        expect(`${c.id} ${a.srd_creature} ${threat(a.srd_creature) <= 2 * threat(e.srd_creature)}`).toBe(`${c.id} ${a.srd_creature} true`);
      }
    }
  });
});
