// Elementos dinámicos del mapa: estados, paso antes y después, acontecimientos, mecanismos, guardado,
// partidas antiguas y que ninguna aventura quede sin salida.
import { newGame, Game, clone } from './game';
import { ADV_LIST } from './aventuras';
import { bossEncounter, bumpable, contentById, enterZone, findPath, Hex, hkey, keyCell, neighbors, npcSpots, passable, pendingAllies, plan, step, ZONE_IDS } from './dungeon';
import { chooseOption, sceneById } from './escenas';
import { ELEM_TYPES, ElemDef, elemById, elemNews, elemPasses, elemState, migrateElements, zoneElements, artKey } from './elementos';
import { BUMP, play } from './partida.test';
import { HERO_CLASSES } from '../data/srd';

const H = (k: string) => k.split(',').map(Number) as Hex;
/** Partida en la casilla k de la zona, con esa zona como visitada. */
function at(zone: string, k: string, g = newGame(1, 'Prueba', 'fighter', 'human')): Game {
  g.zone = zone;
  g.pos = H(k);
  g.prev = g.pos;
  g.visited = [k];
  return g;
}
/** Casillas alcanzables desde la entrada (sin secretos ni rejas abiertas). */
function reach(g: Game, from = hkey(plan(g.zone).start)): Set<string> {
  const pass = passable(g, g.zone);
  const s = new Set([from]);
  const q = [from];
  while (q.length) for (const n of neighbors(H(q.shift()!))) { const k = hkey(n); if (pass.has(k) && !s.has(k)) { s.add(k); q.push(k); } }
  return s;
}
const el = (id: string) => elemById(id)!.el;
/**
 * ¿Alguna salida de la escena cierra otro elemento? (La escena de un elemento solo salta mientras él mismo está
 * cerrado y el grupo fuera, así que dejarlo cerrado, p. ej. «desbloqueada», no encierra a nadie.)
 */
const sceneCloses = (id: string, own: string) => {
  const s = sceneById(id)!;
  return [...s.options.flatMap(o => [o.ok, o.fail]), s.fallback].some(e => Object.entries(e?.set ?? {}).some(([x, st]) => x !== own && !elemPasses(el(x), st)));
};
const nextTo = (zone: string, k: string, g: Game) => neighbors(H(k)).map(hkey).find(n => passable(g, zone).has(n) && reach(g).has(n))!;

describe('datos de los elementos', () => {
  const all = ADV_LIST.flatMap(a => a.data.zones.flatMap(z => zoneElements(z.id).map(e => ({ zone: z.id, e }))));
  test('hay elementos en las tres aventuras de prueba y todos son válidos', () => {
    expect(all.length).toBeGreaterThanOrEqual(5);
    const ids = new Set<string>();
    for (const { zone, e } of all) {
      expect(ids.has(e.id)).toBe(false);
      ids.add(e.id);
      const t = ELEM_TYPES[e.type];
      expect([e.id, !!t]).toEqual([e.id, true]);
      expect(Object.keys(t.states)).toContain(e.state ?? Object.keys(t.states)[0]);
      // La casilla existe y no pisa nada que ya estuviera en el plano (cofres, escenas, llave, aliados...).
      const p = plan(zone);
      expect(p.cells.some(([q, r]) => `${q},${r}` === e.at)).toBe(true);
      expect([e.id, p.marks.some(m => `${m.q},${m.r}` === e.at)]).toEqual([e.id, false]);
      expect(e.at).not.toBe(keyCell(zone));
      expect(e.at).not.toBe(hkey(p.start));
      if (e.scene) expect([e.id, contentById(e.scene)?.c.type]).toEqual([e.id, 'scene']);
      for (const u of e.use ?? []) {
        expect(Object.keys(t.states)).toEqual(expect.arrayContaining([u.from, u.to]));
        for (const [id, st] of Object.entries(u.set ?? {})) expect(Object.keys(ELEM_TYPES[el(id).type].states)).toContain(st);
      }
      for (const r of e.on ?? []) {
        expect(Object.keys(t.states)).toContain(r.to);
        expect([e.id, !!contentById(r.if)]).toEqual([e.id, true]);
        // Un acontecimiento puede pasar con el grupo en cualquier sitio: nunca cierra un paso.
        expect(elemPasses(e, r.to)).toBe(true);
      }
    }
  });
  test('cada elemento cerrado tiene una forma de abrirse', () => {
    const sets = (id: string) => [
      ...all.flatMap(({ e }) => (e.use ?? []).flatMap(u => Object.entries(u.set ?? {}))),
      ...ADV_LIST.flatMap(a => a.data.zones.flatMap(z => z.rooms.flatMap(r => r.contents as any[])))
        .filter(c => c.type === 'scene').flatMap(c => [...c.options.flatMap((o: any) => [o.ok, o.fail]), c.fallback]).filter(Boolean)
        .flatMap((eff: any) => Object.entries(eff.set ?? {})),
    ].filter(([x]) => x === id).map(([, st]) => st as string);
    for (const { e } of all) {
      const st = e.state ?? Object.keys(ELEM_TYPES[e.type].states)[0];
      if (elemPasses(e, st)) continue;
      const ways = [...sets(e.id), ...(e.on ?? []).map(r => r.to), ...(e.use ?? []).filter(u => u.from !== st || true).map(u => u.to)];
      expect([e.id, ways.some(w => elemPasses(e, w))]).toEqual([e.id, true]);
    }
  });
  test('cada estado tiene su clave de imagen estable', () => {
    for (const [t, d] of Object.entries(ELEM_TYPES)) for (const s of Object.keys(d.states)) expect(artKey(t, s)).toBe(`din_${t}_${s}`);
  });

  test('los estados de los elementos que ya usan las aventuras tienen su imagen registrada', () => {
    const fs = require('fs');
    const assets: string = fs.readFileSync('src/assets.ts', 'utf8');
    const usados = [['escombros', ['intactos', 'retirados']], ['puerta', ['bloqueada', 'desbloqueada', 'abierta']], ['verja', ['cerrada', 'abierta']], ['palanca', ['reposo', 'activada']], ['barrera', ['activa', 'disipada']]] as const;
    for (const [t, estados] of usados) for (const e of estados) {
      expect(ELEM_TYPES[t].states[e]).toBeDefined();
      expect(assets).toContain(`${artKey(t, e)}: require('../assets/img/${artKey(t, e)}.webp')`);
      expect(fs.existsSync(`assets/img/${artKey(t, e)}.webp`)).toBe(true);
    }
  });
});

describe('ninguna aventura queda bloqueada', () => {
  // Todas las combinaciones de estados: la salida, la llave y el jefe siguen al alcance. Y desde donde está el grupo
  // cuando algo se cierra (encima de un mecanismo o junto al elemento de una escena que cierra) se puede volver a la entrada.
  for (const zone of ZONE_IDS.filter(z => zoneElements(z).length)) test(zone, () => {
    const list = zoneElements(zone);
    const p = plan(zone);
    const need = [...p.marks.filter(m => m.kind === 'exit' || m.id === bossEncounter(zone)).map(m => `${m.q},${m.r}`), keyCell(zone)].filter(Boolean) as string[];
    const combos = list.reduce<Record<string, string>[]>((acc, e) => acc.flatMap(c => Object.keys(ELEM_TYPES[e.type].states).map(s => ({ ...c, [e.id]: s }))), [{}]);
    for (const c of combos) {
      const g = at(zone, hkey(p.start));
      g.elems = c;
      const r = reach(g);
      for (const k of need) expect([zone, JSON.stringify(c), k, r.has(k)]).toEqual([zone, JSON.stringify(c), k, true]);
      const pass = passable(g, zone);
      const closers = [
        ...list.filter(e => e.use?.some(u => Object.entries(u.set ?? {}).some(([id, st]) => !elemPasses(el(id), st)))).map(e => e.at),
        ...list.filter(e => e.scene && sceneCloses(e.scene, e.id)).flatMap(e => neighbors(H(e.at)).map(hkey)),
      ];
      for (const k of closers) {
        if (!pass.has(k)) continue;
        expect([zone, JSON.stringify(c), k, reach(g, k).has(hkey(p.start))]).toEqual([zone, JSON.stringify(c), k, true]);
      }
    }
  });
});

describe('derrumbe de Hondaroca: una prueba de Fuerza deja libre el paso', () => {
  const e = el('z1_x01');
  test('cerrado no se cruza; al topar sale la escena y el grupo no se mueve', () => {
    const g = enterAt('z1');
    expect(passable(g, 'z1').has(e.at)).toBe(false);
    const beyond = '6,-5';
    expect(reach(g).has(beyond)).toBe(false);
    const from = nextTo('z1', e.at, g);
    g.pos = H(from);
    g.visited.push(from);
    expect(findPath(g, H(e.at))?.map(hkey)).toEqual([e.at]);
    const evs = step(g, H(e.at));
    expect(evs).toEqual([{ kind: 'scene', id: 'z1_x01_p' }]);
    expect(hkey(g.pos)).toBe(from);
    // Fuerza superada: el derrumbe se retira y ya se puede pasar.
    const i = sceneById('z1_x01_p')!.options.findIndex(o => o.attr === 'str');
    chooseOption(g, 'z1_x01_p', i, g.party[0].id, true);
    expect(elemState(g, e)).toBe('retirados');
    expect(passable(g, 'z1').has(e.at)).toBe(true);
    expect(reach(g).has(beyond)).toBe(true);
    step(g, H(e.at));
    expect(hkey(g.pos)).toBe(e.at);
  });
  test('la vía sin tirada siempre abre el paso (a costa de unos PG)', () => {
    const g = enterAt('z1');
    const i = sceneById('z1_x01_p')!.options.findIndex(o => !o.attr && !o.needs);
    const hp = g.party[0].hp;
    chooseOption(g, 'z1_x01_p', i);
    expect(elemState(g, e)).toBe('retirados');
    expect(g.party[0].hp).toBeLessThanOrEqual(hp);
    expect(g.party[0].hp).toBeGreaterThan(0);
  });
});

describe('puerta de la cripta: bloqueada, desbloqueada y abierta', () => {
  test('el cerrojo se fuerza y luego se empuja la puerta', () => {
    const e = el('z3_x01');
    const g = enterAt('z3');
    const from = nextTo('z3', e.at, g);
    g.pos = H(from);
    g.visited.push(from);
    expect(step(g, H(e.at))).toEqual([{ kind: 'scene', id: 'z3_x01_p' }]);
    chooseOption(g, 'z3_x01_p', 0, g.party[0].id, true);
    expect(elemState(g, e)).toBe('desbloqueada');
    expect(passable(g, 'z3').has(e.at)).toBe(false);
    // Topar otra vez la abre (sin moverse) y ya se cruza.
    const evs = step(g, H(e.at));
    expect(evs[0]).toMatchObject({ kind: 'msg', title: e.name });
    expect(hkey(g.pos)).toBe(from);
    expect(elemState(g, e)).toBe('abierta');
    step(g, H(e.at));
    expect(hkey(g.pos)).toBe(e.at);
  });
});

describe('contrapeso de la fortaleza: un mecanismo mueve una verja en otra sala', () => {
  test('bajar la palanca abre la verja; subirla la cierra otra vez', () => {
    const lever = el('m3_x01'), gate = el('m3_x02');
    const g = enterAt('m3');
    expect(passable(g, 'm3').has(gate.at)).toBe(false);
    // La verja cerrada solo da un aviso.
    g.pos = H(nextTo('m3', gate.at, g));
    expect(step(g, H(gate.at))).toEqual([]);
    expect(g.note).toMatch(/verja/);
    // El camino no pasa por encima de la palanca sin querer, pero se puede ir a ella.
    g.pos = H(nextTo('m3', lever.at, g));
    g.visited.push(hkey(g.pos));
    expect(findPath(g, H(lever.at))?.map(hkey)).toEqual([lever.at]);
    const evs = step(g, H(lever.at));
    expect(evs[0]).toMatchObject({ kind: 'msg', save: true });
    expect(elemState(g, lever)).toBe('activada');
    expect(elemState(g, gate)).toBe('abierta');
    expect(passable(g, 'm3').has(gate.at)).toBe(true);
    // Reversible: al volver a pisarla, la verja cae.
    step(g, g.prev);
    step(g, H(lever.at));
    expect(elemState(g, lever)).toBe('reposo');
    expect(elemState(g, gate)).toBe('cerrada');
    expect(passable(g, 'm3').has(gate.at)).toBe(false);
  });
});

describe('sello del monasterio: vencer a los devotos lo disipa', () => {
  test('cambia por el combate, se avisa una vez y no depende de lo guardado', () => {
    const e = el('z4_x01');
    const g = enterAt('z4');
    expect(elemState(g, e)).toBe('activa');
    expect(passable(g, 'z4').has(e.at)).toBe(false);
    g.done.push('z4_e03');
    expect(elemState(g, e)).toBe('disipada');
    expect(passable(g, 'z4').has(e.at)).toBe(true);
    expect(elemNews(g)).toHaveLength(1);
    expect(elemNews(g)).toHaveLength(0);
    // Aunque algo intentara cerrarlo, el acontecimiento manda.
    g.elems = { z4_x01: 'activa' };
    expect(elemState(g, e)).toBe('disipada');
  });
});

describe('guardado y partidas antiguas', () => {
  test('el estado se guarda con la partida y se recupera igual', () => {
    const g = enterAt('m3');
    step(g, H(nextTo('m3', el('m3_x01').at, g)));
    step(g, H(el('m3_x01').at));
    const back = clone(JSON.parse(JSON.stringify(g))) as Game;
    migrateElements(back);
    expect(back.elems).toEqual(g.elems);
    expect(elemState(back, el('m3_x02'))).toBe('abierta');
    expect(passable(back, 'm3')).toEqual(passable(g, 'm3'));
  });
  test('una partida de antes que ya había pasado por ahí encuentra el paso abierto', () => {
    const g = enterAt('z1');
    delete (g as any).elems;
    g.visited.push('6,-5');
    migrateElements(g);
    expect(elemState(g, el('z1_x01'))).toBe('retirados');
    // Y en otra zona guardada (la fortaleza recorrida hasta la cámara de las válvulas).
    const h = enterAt('z1');
    delete (h as any).elems;
    h.saved = { m3: { visited: ['-9,6'], pos: [-9, 6], prev: [-9, 6] } };
    migrateElements(h);
    expect(elemState(h, el('m3_x02'))).toBe('abierta');
    expect(elemState(h, el('z1_x01'))).toBe('intactos');
  });
  test('una partida de antes que no había llegado deja los elementos como empiezan', () => {
    const g = enterAt('z1');
    delete (g as any).elems;
    migrateElements(g);
    expect(g.elems).toEqual({});
    expect(elemState(g, el('z1_x01'))).toBe('intactos');
    // Los acontecimientos que ya pasaron no se cuentan de golpe al cargar.
    const h = enterAt('z4');
    delete (h as any).elems;
    h.done.push('z4_e03');
    migrateElements(h);
    expect(elemNews(h)).toEqual([]);
  });
  test('las zonas sin elementos se recorren exactamente igual', () => {
    for (const zone of ZONE_IDS.filter(z => !zoneElements(z).length)) {
      const g = at(zone, hkey(plan(zone).start));
      const h = clone(g);
      h.elems = { z1_x01: 'retirados', m3_x02: 'abierta' };
      expect(passable(h, zone)).toEqual(passable(g, zone));
      expect(bumpable(g).size).toBe(0);
    }
  });
  test('los elementos no ocupan la casilla de un aliado ni de un personaje que espera', () => {
    for (const zone of ZONE_IDS.filter(z => zoneElements(z).length)) {
      const g = at(zone, hkey(plan(zone).start));
      const spots = [...pendingAllies(g), ...npcSpots(g)].map(x => x.cell);
      for (const e of zoneElements(zone)) expect(spots).not.toContain(e.at);
    }
  });
});

describe('portal (tipo preparado para el futuro)', () => {
  test('activo lleva a su destino; inactivo se pisa sin más', () => {
    const list = zoneElements('m1') as ElemDef[];
    const g = at('m1', hkey(plan('m1').start));
    const pass = [...passable(g, 'm1')];
    const from = pass.find(k => neighbors(H(k)).some(n => pass.includes(hkey(n))) && k !== hkey(plan('m1').start) && !plan('m1').marks.some(m => `${m.q},${m.r}` === k))!;
    const to = pass.find(k => k !== from && !neighbors(H(from)).map(hkey).includes(k) && !plan('m1').marks.some(m => `${m.q},${m.r}` === k))!;
    list.push({ id: 'prueba_portal', type: 'portal', at: from, name: 'Portal de prueba', to });
    try {
      const n = neighbors(H(from)).map(hkey).find(k => pass.includes(k))!;
      g.pos = H(n);
      step(g, H(from));
      expect(hkey(g.pos)).toBe(from);
      step(g, H(n));
      g.elems = { prueba_portal: 'activo' };
      step(g, H(from));
      expect(hkey(g.pos)).toBe(to);
    } finally { list.pop(); }
  });
});

describe('el bot completa las aventuras resolviendo los elementos', () => {
  afterAll(() => { BUMP.on = false; });
  const runs: [string, string, number, string][] = [['z1', 'fighter', 0, ''], ['b1', 'cleric', 300, ''], ['m1', 'rogue', 900, 'maren']];
  test.each(runs)('%s con %s', (start, cls, xp, escort) => {
    BUMP.on = true;
    BUMP.bumps = 0;
    const r = play(cls as any, 'human', 11, start, xp, 'asi', escort || undefined);
    expect(['win', 'lose']).toContain(r.result);
  });
  test('topa con los elementos que encuentra', () => {
    BUMP.on = true;
    BUMP.bumps = 0;
    for (const cls of HERO_CLASSES.slice(0, 2)) play(cls, 'human', 3, 'm1', 900, 'asi', 'maren');
    expect(BUMP.bumps).toBeGreaterThan(0);
  });
});

/** Partida recién entrada en la zona (como al llegar por primera vez). */
function enterAt(zone: string): Game {
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  g.party[0].abil.str = 18;
  enterZone(g, zone);
  return g;
}
