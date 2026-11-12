// Juega Hondaroca entera con un bot sencillo para comprobar que el motor no se rompe
// con ninguna de las 16 combinaciones de héroe.
import { newGame, Game } from './game';
import { bossEncounter, closedDoors, enterZone, step, findPath, plan, doRest, Ev, hkey, visibleCells, passable } from './dungeon';
import { startCombat, autoTurn, enemyTurn, actionsFor, targetsFor, perform, endTurn, current, Combat, hasUseful } from './combat';
import { HERO_CLASSES, ITEMS, SPECIES, ClassId, SpeciesId } from '../data/srd';
import { chooseFeat, FeatId, gainXp, longRest, MAX_ITEMS } from './rules';

/** Datos que recoge el estudio de equilibrio (estudio.test.ts) mientras juega el bot. */
export interface Rec { combats: { id: string; rounds: number; lost: number; down: number; result?: string }[]; acts: Record<string, number>; idle: number }
export const REC: { cur?: Rec } = {};
/** El bot va al pueblo a curarse (como una persona) solo si se activa: los tests normales siguen igual. */
export const TOWN = { on: false, trips: 0 };

const charOf0 = (g: Game, u: { charId?: string }) => g.party.find(c => c.id === u.charId)!;

function fight(g: Game, id: string): Combat {
  const hp0 = g.party.filter(c => !c.dead).reduce((a, c) => a + c.hp, 0);
  const max0 = g.party.filter(c => !c.dead).reduce((a, c) => a + c.maxHp, 0);
  const cb = startCombat(g, id);
  const rec = REC.cur;
  const perform_ = (gg: Game, c: Combat, a: Parameters<typeof perform>[2], t?: string) => {
    if (rec) { const k = a.id.split(':')[0]; rec.acts[k] = (rec.acts[k] ?? 0) + 1; }
    perform(gg, c, a, t);
  };
  for (let i = 0; i < 2000 && !cb.result; i++) {
    if (autoTurn(cb)) { enemyTurn(g, cb); continue; }
    const acts = actionsFor(g, cb);
    const u = current(cb);
    // Los que atacan a distancia se colocan en la retaguardia.
    if (u.row === 'front' && !['fighter', 'paladin'].includes(g.party.find(c => c.id === u.charId)!.cls)) {
      const mv = actionsFor(g, cb).find(a => a.id === 'row');
      if (mv) perform_(g, cb, mv);
    }
    const heal = acts.find(a => (a.id.startsWith('potion') || a.id === 'second_wind') && u.hp < u.maxHp / 2);
    if (heal) perform_(g, cb, heal);
    // En el estudio el bot se cura con conjuros cuando va mal y usa Dormir contra filas de 2 o más (como una persona).
    if (REC.cur) {
      const self = actionsFor(g, cb).find(a => (a.id === 'healing_word' || a.id === 'cure') && !a.off);
      if (self && u.hp < u.maxHp / 2) perform_(g, cb, self, u.key);
      const sl = actionsFor(g, cb).find(a => a.id === 'sleep' && !a.off);
      const row = (['front', 'back'] as const).find(r => cb.units.filter(x => x.side === 'enemy' && x.hp > 0 && !x.asleep && x.row === r).length >= 2);
      const t = row && cb.units.find(x => x.side === 'enemy' && x.hp > 0 && x.row === row);
      if (sl && t && cb.round <= 2) perform_(g, cb, sl, t.key);
    }
    const down = cb.units.find(x => x.side === 'party' && x.hp <= 0 && !x.dead);
    const hw = actionsFor(g, cb).find(a => a.id === 'healing_word' || a.id === 'cure');
    if (down && hw) perform_(g, cb, hw, down.key);
    // En el estudio, el mago usa sus trucos en vez de la daga (como haría una persona).
    const PRI = REC.cur && charOf0(g, u).cls === 'wizard' ? ['fireball', 'magic_missile', 'scorching', 'burning_hands', 'fire_bolt', 'atk'] : ['fireball', 'magic_missile', 'guiding_bolt', 'scorching', 'burning_hands', 'atk', 'fire_bolt', 'sacred_flame'];
    const rank = (id: string) => { const i = PRI.indexOf(id.split(':')[0]); return i < 0 ? 99 : i; };
    const rage = actionsFor(g, cb).find(a => a.id === 'rage');
    if (rage) perform_(g, cb, rage);
    const mass = actionsFor(g, cb).find(a => a.id === 'mass_heal' && !a.off);
    if (mass && cb.units.filter(x => x.side === 'party' && x.hp < x.maxHp / 2 && !x.dead).length >= 2) perform_(g, cb, mass);
    const sw = actionsFor(g, cb).find(a => a.id === 'spiritual' && targetsFor(cb, a).length);
    if (sw) perform_(g, cb, sw, targetsFor(cb, sw)[0].key);
    const atk = actionsFor(g, cb)
      .filter(a => (a.cost === 'action' && a.target.startsWith('enemy') && targetsFor(cb, a).length) || (a.id === 'burning_hands' && cb.units.filter(x => x.side === 'enemy' && x.hp > 0 && x.row === 'front').length >= 2))
      .sort((a, b) => rank(a.id) - rank(b.id))[0];
    if (atk) perform_(g, cb, atk, targetsFor(cb, atk)[0]?.key);
    else if (!cb.moved && current(cb).row === 'back' && actionsFor(g, cb).some(a => a.id === 'row')) perform_(g, cb, actionsFor(g, cb).find(a => a.id === 'row')!);
    const surge = actionsFor(g, cb).find(a => a.id === 'surge');
    if (surge) { perform_(g, cb, surge); const a2 = actionsFor(g, cb).find(a => a.id.startsWith('atk') && targetsFor(cb, a).length); if (a2) perform_(g, cb, a2, targetsFor(cb, a2)[0].key); }
    if (rec && !cb.result && !hasUseful(g, cb)) rec.idle++;
    if (!cb.result) endTurn(g, cb);
  }
  if (rec) {
    const hp1 = cb.units.filter(u => u.side === 'party' && !u.dead).reduce((a, u) => a + Math.max(0, u.hp), 0);
    rec.combats.push({ id, rounds: cb.round, lost: max0 ? (hp0 - hp1) / max0 : 0, down: cb.log.filter(l => /cae inconsciente/.test(l.t)).length, result: cb.result });
  }
  return cb;
}

function play(cls: ClassId, sp: SpeciesId, seed?: number, start = 'z1', xp = 0, feat: FeatId = 'asi', escort?: string) {
  const g = newGame(1, 'Prueba', cls, sp);
  if (seed !== undefined) g.rng.seed = seed;
  gainXp(g.party, xp);
  g.party.forEach(c => chooseFeat(c, feat));
  if (escort) {
    const { createAlly } = require('./rules');
    const { ADV_LIST } = require('./aventuras');
    const from = ADV_LIST.find((a: any) => a.data.allies.some((x: any) => x.id === escort)).id;
    const e = createAlly(escort, g.party[0].level, g.party[0].xp, from); g.party.push(e); g.escort = escort;
  }
  let queue: Ev[] = enterZone(g, start);
  const log: string[] = [];
  // Obstáculos cerrados ya intentados: como un jugador, no insiste en una puerta que no cede.
  const knocked = new Set<string>();
  let steps = 0;
  while (steps++ < 6000) {
    const ev = queue.shift();
    if (ev) {
      if (ev.kind === 'combat') {
        const cb = fight(g, ev.id);
        log.push(`${ev.id}:${cb.result}`);
        if (cb.result === 'lose') return { g, log, result: 'lose' };
        if (cb.result !== 'win') throw new Error('combate sin final');
        g.party.forEach(c => chooseFeat(c, feat));
        // Como haría una persona: muy tocado o con un muerto, vuelve a un descanso ya visto y va al pueblo
        // (posada gratis, resucitar 50 po). Solo si hay un punto de descanso descubierto en la zona.
        const living = g.party.filter(c => !c.dead);
        const low = living.reduce((a, c) => a + c.hp, 0) < 0.4 * living.reduce((a, c) => a + c.maxHp, 0);
        const restSeen = plan(g.zone).marks.some(m => m.kind === 'rest' && g.visited.includes(`${m.q},${m.r}`));
        if (TOWN.on && restSeen && (low || g.party.some(c => c.dead))) {
          for (const c of g.party) { if (c.dead && g.gold >= 50) { g.gold -= 50; c.dead = false; } if (!c.dead) longRest(c); }
          TOWN.trips++;
        }
        if (g.done.includes(bossEncounter(g.zone))) return { g, log, result: 'win' };
      } else if (ev.kind === 'scene') {
        // Escena: la primera opción que siga abierta, con quien mejor lo haría.
        const { chooseOption, optionOpen, sceneById } = require('./escenas');
        const sc = sceneById(ev.id);
        const i = sc.options.findIndex((_: any, k: number) => optionOpen(g, sc, k));
        if (i >= 0) queue.unshift(...chooseOption(g, ev.id, i));
      } else if (ev.kind === 'swap') {
        const { sendToInn } = require('./posada');
        sendToInn(g, g.party.find(c => !c.isHero && c.id !== ev.ally)!);
      } else if (ev.kind === 'rest') log.push(...doRest(g, ev.id, ev.long));
      else if (ev.kind === 'zone') queue.push(...enterZone(g, ev.to));
      continue;
    }
    // Como haría un jugador, tira las armas repetidas que no usa para no llenar la mochila.
    for (const c of g.party) while (c.items.length >= 10) {
      const i = c.items.findIndex(it => !it.basic && ITEMS[it.id]?.weapon);
      if (i < 0) break;
      c.items.splice(i, 1);
    }
    // Como haría un jugador: no carga más de cuatro pociones y recoge la llave si se quedó en el suelo.
    for (const c of g.party) while (c.items.filter(i => i.id === 'potion_healing').length > 4) c.items.splice(c.items.findIndex(i => i.id === 'potion_healing'), 1);
    const here = g.drops?.[`${g.zone}:${hkey(g.pos)}`];
    if (here?.length) {
      for (const it of [...here]) {
        let to = g.party.find(c => !c.dead && c.items.length < MAX_ITEMS);
        // Con las mochilas llenas, deja algo prescindible para coger la llave.
        if (!to && (it.id === 'zone_key' || it.id === 'bark_amulet')) {
          to = g.party.find(c => !c.dead && c.items.some(x => !x.basic && x.id !== 'zone_key' && x.id !== 'bark_amulet'));
          if (to) to.items.splice(to.items.findIndex(x => !x.basic && x.id !== 'zone_key' && x.id !== 'bark_amulet'), 1);
        }
        if (to) { to.items.push(it); here.splice(here.indexOf(it), 1); }
      }
    }
    // Explora: va a la casilla visible no visitada más cercana (o a la salida).
    const vis = visibleCells(g);
    const pass = passable(g, g.zone);
    const doors = closedDoors(g);
    const targets = [...vis].filter(k => pass.has(k) && !g.visited.includes(k) && !(doors.has(k) && knocked.has(`${g.zone}:${k}`)));
    // Con la llave de la zona en la mochila, vuelve a la salida cerrada.
    const key = g.party.some(c => c.items.some(i => i.id === 'zone_key' || i.id === 'bark_amulet'));
    if (key) targets.push(...plan(g.zone).marks.filter(m => m.kind === 'exit').map(m => `${m.q},${m.r}`));
    for (const [k, list] of Object.entries(g.drops ?? {})) if (k.startsWith(`${g.zone}:`) && list.some(i => i.id === 'zone_key' || i.id === 'bark_amulet')) targets.push(k.split(':')[1]);
    let best: ReturnType<typeof findPath> = null;
    for (const k of targets) {
      const p = findPath(g, k.split(',').map(Number) as [number, number]);
      if (p && (!best || p.length < best.length)) best = p;
    }
    if (!best) throw new Error(`atascado en ${g.zone} ${hkey(g.pos)} items=${g.party.map(c => c.name + ':' + c.items.map(i => i.id).join('/')).join(' ')} bench=${(g.bench ?? []).map(c => c.name + ':' + c.items.map(i => i.id).join('/')).join(' ')} drops=${JSON.stringify(g.drops)} done=${g.done.filter(d => /key|open/.test(d)).join(',')} tras ${log.join(' ')}`);
    for (const h of best) {
      if (doors.has(hkey(h))) knocked.add(`${g.zone}:${hkey(h)}`);
      const evs = step(g, h);
      if (evs.length) { queue.push(...evs); break; }
    }
  }
  throw new Error(`demasiados pasos en ${g.zone} ${hkey(g.pos)} llave=${g.party.some(c => c.items.some(i => i.id === 'zone_key'))} done=${g.done.filter(d => d.includes('_key') || d.includes('_open')).join(',')} drops=${JSON.stringify(g.drops)}`);
}

export { play, fight };
const combos = HERO_CLASSES.flatMap(c => (Object.keys(SPECIES) as SpeciesId[]).map(s => [c, s] as const));

test.each(combos)('%s %s puede jugar Hondaroca sin errores', (cls, sp) => {
  const r = play(cls, sp);
  expect(['win', 'lose']).toContain(r.result);
  expect(plan('z1').cells.length).toBeGreaterThan(50);
  // Información para equilibrar.
  const h = r.g.party[0];
  console.log(`${cls}/${sp}: ${r.result} en ${r.g.zone}, grupo ${r.g.party.map(c => `${c.name} N${c.level}`).join(', ')} — ${r.log.filter(l => l.includes(':')).length} combates`);
  expect(h.level).toBeGreaterThanOrEqual(1);
});

// El bosque: el héroe llega con unos 2700 PX (nivel 4), como al terminar Hondaroca.
test.each(HERO_CLASSES)('%s puede jugar El Corazón Hueco sin errores', cls => {
  const r = play(cls, 'human', 7, 'b1', 2700);
  expect(['win', 'lose']).toContain(r.result);
  console.log(`bosque ${cls}: ${r.result} en ${r.g.zone}, grupo ${r.g.party.map(c => `${c.name} N${c.level}`).join(', ')} — ${r.log.join(' ')}`);
});

// La montaña: el héroe llega a nivel 5 (hito al terminar el bosque) con un compañero del bosque por el paso nevado.
test.each(HERO_CLASSES)('%s puede jugar El Invierno del Dragón sin errores', cls => {
  const r = play(cls, 'human', 7, 'm1', 6500, 'asi', 'maren');
  expect(['win', 'lose']).toContain(r.result);
  expect(r.g.party[0].level).toBeGreaterThanOrEqual(5);
  console.log(`montaña ${cls}: ${r.result} en ${r.g.zone}, grupo ${r.g.party.map(c => `${c.name} N${c.level}`).join(', ')} — ${r.log.join(' ')}`);
});
