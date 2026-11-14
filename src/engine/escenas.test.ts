import { newGame } from './game';
import { devWin, startCombat } from './combat';
import { chooseOption, enemiesOf, inspire, maxFoesFor, reopenScenes, sceneById, sceneSpent, sizeEncounter } from './escenas';
import { contentById, enterZone, hkey, markReturn, passable, pendingNotes, plan, sceneOn, step } from './dungeon';
import { endAdventure, finishTalk, nextTalk, sendToInn } from './posada';
import { createAlly, gainXp } from './rules';

const game = () => { const g = newGame(1, 'Prueba', 'fighter', 'human'); enterZone(g, 'z1'); return g; };

test('las 8 decisiones de Hondaroca tienen su ilustración y todas las escenas, marca en el mapa', () => {
  for (const id of ['z1_q01', 'z1_q02', 'z2_q01', 'z2_q02', 'z3_q01', 'z3_q02', 'z4_q01', 'z4_q02']) {
    const s = sceneById(id)!;
    expect(s.decision).toBe(true);
    expect(s.img).toMatch(/^escena_/);
  }
  for (const f of ['hondaroca', 'corazon', 'montana']) for (const z of require(`../data/${f}.json`).zones) for (const r of z.rooms)
    for (const c of r.contents) {
      if (c.type === 'scene') expect([c.id, plan(z.id).marks.some(m => m.kind === 'scene' && m.id === c.id)]).toEqual([c.id, true]);
      if (c.type === 'scene' && c.img) expect(require('../assets').IMG[c.img]).toBeTruthy();
    }
});

test('prueba: un fallo cierra solo esa vía; si fallan todas, sale el final de repuesto y se reabre tras la posada', () => {
  // Con todo a 1 (−5) casi nunca se pasa CD 11-12: se busca una semilla en la que se fallen las tres.
  for (let seed = 1; seed < 200; seed++) {
    const g = game();
    g.rng.seed = seed;
    g.party[0].abil = { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 };
    g.party[0].hp = 99;
    g.gold = 20;
    const evs0 = chooseOption(g, 'z1_p02', 0);
    if (g.done.includes('z1_p02')) continue;
    expect(evs0.some(e => e.kind === 'scene')).toBe(true);
    expect(g.scenes!.z1_p02.closed).toEqual([0]);
    chooseOption(g, 'z1_p02', 1);
    if (g.done.includes('z1_p02')) continue;
    chooseOption(g, 'z1_p02', 2);
    if (g.scenes!.z1_p02.closed.length < 3) continue;
    // Se queda en el mapa, agotada, hasta el descanso largo de la posada.
    expect(g.done).not.toContain('z1_p02');
    expect(g.gold).toBeLessThan(20);
    expect(sceneSpent(g, 'z1_p02')).toBe(true);
    expect(reopenScenes(g)).toBe(1);
    expect(sceneSpent(g, 'z1_p02')).toBe(false);
    expect(g.scenes!.z1_p02.closed).toEqual([]);
    return;
  }
  throw new Error('ninguna semilla falla las tres');
});

test('decisiones: un enemigo más, uno menos o el combate fuera', () => {
  const g = game();
  chooseOption(g, 'z1_q01', 1);
  expect(enemiesOf(g, 'z1_e05').reduce((s, e) => s + e.count, 0)).toBe(2);
  const g2 = game();
  chooseOption(g2, 'z1_q01', 2);
  expect(g2.done).toContain('z1_e05');
  const g3 = game();
  chooseOption(g3, 'z2_q02', 0);
  expect(g3.done).toContain('z2_e08');
});

test('los eventos de regreso solo salen al volver', () => {
  const g = game();
  g.done.push('z1_e04');
  expect(sceneOn(g, 'z1_pat01_paso')).toBe(false);
  markReturn(g);
  expect(sceneOn(g, 'z1_pat01_paso')).toBe(true);
  // El del entibador pide además haber visto la prisión de las ruinas.
  expect(sceneOn(g, 'z1_ev01')).toBe(false);
  g.done.push('z2_r02');
  expect(sceneOn(g, 'z1_ev01')).toBe(true);
});

test('la reja de los turnos se abre con la palanca y queda abierta', () => {
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  enterZone(g, 'z2');
  const gate = plan('z2').marks.find(m => m.kind === 'gate')!;
  const lever = plan('z2').marks.find(m => m.kind === 'lever')!;
  expect(passable(g, 'z2').has(`${gate.q},${gate.r}`)).toBe(false);
  const evs = step(g, [lever.q, lever.r]);
  expect(evs.some(e => e.kind === 'msg')).toBe(true);
  expect(passable(g, 'z2').has(`${gate.q},${gate.r}`)).toBe(true);
  expect(contentById('z2_b01_open')).toBeTruthy();
});

test('pistas de secretos: se abren con la prueba, no con la percepción pasiva', () => {
  const g = game();
  g.party[0].abil.wis = 30; g.party[0].abil.int = 30;
  chooseOption(g, 'z1_s01_pista', 0);
  expect(g.found).toContain('z1_s01');
  expect(sceneOn(g, 'z1_s01_pista')).toBe(false);
  const m = plan('z1').marks.find(x => x.kind === 'secret' && x.id === 'z1_s01')!;
  const { blockedCells } = require('./dungeon');
  expect(m.path!.filter(k => !blockedCells('z1').has(k)).every(k => passable(g, 'z1').has(k))).toBe(true);
});

test('pendientes del diario: salen con su pista y se van al resolverla', () => {
  const g = game();
  g.done.push('z1_r03');
  expect(pendingNotes(g, 'hondaroca').join(' ')).toMatch(/corriente de aire/);
  g.found.push('z1_s01');
  expect(pendingNotes(g, 'hondaroca').join(' ')).not.toMatch(/corriente de aire/);
});

test('inspiración heroica: una vez por aventura', () => {
  const g = game();
  const c = g.party[0];
  expect(inspire(g, c)).toBe(false);
  c.inspired = true;
  expect(inspire(g, c)).toBe(true);
  expect(inspire(g, c)).toBe(false);
});

test('posada: charlas tras cada aventura juntos; la tercera da Inspiración heroica', () => {
  const g = game();
  const tiko = createAlly('tiko', 1, 0, 'hondaroca');
  g.party.push(tiko);
  expect(nextTalk(g, tiko)).toBeUndefined();
  for (let i = 0; i < 3; i++) {
    endAdventure(g, (['hondaroca', 'corazon_hueco', 'montana'] as const)[i]);
    expect(nextTalk(g, tiko)).toBe(i);
    finishTalk(g, 'tiko');
  }
  expect(tiko.inspired).toBe(true);
  expect(nextTalk(g, tiko)).toBeUndefined();
});

test('posada: sin encargos; al terminar una aventura se avisa de la siguiente', () => {
  const g = game();
  const liss = createAlly('liss', 1, 0, 'hondaroca');
  g.bench = [liss];
  const gold = g.gold, items = liss.items.length;
  endAdventure(g, 'hondaroca');
  expect(g.gold).toBe(gold);
  expect(liss.items.length).toBe(items);
  expect(g.news!.join(' ')).toMatch(/siguiente aventura/);
  // Solo una vez por aventura.
  const n = g.news!.length;
  endAdventure(g, 'hondaroca');
  expect(g.news!.length).toBe(n);
});

test('grupo lleno: al unirse un aliado se elige quién vuelve a la posada', () => {
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  g.party.push(createAlly('maren', 1, 0, 'corazon_hueco'), createAlly('vurka', 1, 0, 'montana'), createAlly('durnok', 1, 0, 'montana'));
  const evs = enterZone(g, 'z2');
  // Tiko está en la prisión de las ruinas: se va andando hasta su sala.
  const room = plan('z2').cells.find(c => c[2] === 1)!;
  let got = evs;
  if (!got.some(e => e.kind === 'swap')) got = step(g, [room[0], room[1]]);
  expect(got.some(e => e.kind === 'swap')).toBe(true);
  expect(g.party).toHaveLength(5);
  const lines = sendToInn(g, g.party.find(c => c.id === 'maren')!);
  expect(g.party).toHaveLength(4);
  expect(g.bench!.map(c => c.id)).toContain('maren');
  expect(lines[0]).toMatch(/posada/);
  expect(hkey(g.pos)).toBeTruthy();
});

test('releer: una escena terminada se puede releer sin apuntarse otra vez', () => {
  const { rereadAt } = require('./dungeon');
  const g = game();
  chooseOption(g, 'z1_q01', 2);
  const m = plan('z1').marks.find(x => x.kind === 'scene' && x.id === 'z1_q01')!;
  const log = g.log.length, diary = g.diary?.length ?? 0;
  const evs = rereadAt(g, `${m.q},${m.r}`);
  expect(evs).toHaveLength(2);
  expect(evs[1].lines).toEqual(g.scenes!.z1_q01.said);
  expect(g.log.length).toBe(log);
  expect(g.diary?.length ?? 0).toBe(diary);
});

test('un secreto con pista no lo encuentra la percepción pasiva', () => {
  const g = game();
  g.party[0].abil.wis = 30;
  const room = plan('z1').cells.find(c => require('../data/hondaroca.json').zones[0].rooms[c[2]]?.id === 'z1_r03')!;
  step(g, [room[0], room[1]]);
  expect(g.found).not.toContain('z1_s01');
});

test('montaña: los kobolds apresan a un aliado al entrar en el bosque y se le rescata en las trampas', () => {
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  g.party.push(createAlly('vurka', 5, 0, 'montana'));
  enterZone(g, 'm2');
  expect(g.party.some(c => c.id === 'vurka')).toBe(false);
  expect(g.captive?.id).toBe('vurka');
  const room = require('../data/montana.json').zones.find((z: any) => z.id === 'm2').rooms.findIndex((r: any) => r.id === 'm2_r10');
  const cell = plan('m2').cells.find(c => c[2] === room)!;
  const evs = step(g, [cell[0], cell[1]]);
  expect(evs.some(e => e.kind === 'msg' && e.title === 'Aliado rescatado')).toBe(true);
  expect(g.party.some(c => c.id === 'vurka')).toBe(true);
  expect(g.captive).toBeUndefined();
});

test('secretos de regreso: el mosaico de Hondaroca solo se abre tras usar un amuleto de corteza', () => {
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  enterZone(g, 'z4');
  expect(sceneOn(g, 'z4_s02_pista')).toBe(true);
  expect(sceneOn(g, 'z4_s02_abrir')).toBe(false);
  g.done.push('b2_r01');
  expect(sceneOn(g, 'z4_s02_pista')).toBe(false);
  expect(sceneOn(g, 'z4_s02_abrir')).toBe(true);
  chooseOption(g, 'z4_s02_abrir', 0);
  expect(g.found).toContain('z4_s02');
});

test('equilibrio: los jefes no se duplican y sus acompañantes se ajustan al tamaño del grupo', () => {
  const party = () => {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    g.zone = 'm4';
    g.party.push(
      createAlly('aldric', 1, 0, 'montana'),
      createAlly('vurka', 1, 0, 'montana'),
      createAlly('durnok', 1, 0, 'montana'),
    );
    gainXp(g.party, 6500 * g.party.length);
    return g;
  };
  const g = party();
  sizeEncounter(g, ['m4_e05'], true);
  const foes = enemiesOf(g, 'm4_e05');
  expect(foes.filter(e => e.srd_creature === 'Young White Dragon').reduce((n, e) => n + e.count, 0)).toBe(1);
  expect(foes.reduce((n, e) => n + e.count, 0)).toBeLessThanOrEqual(maxFoesFor(4));

  // Una decisión que activa un refuerzo añade un kobold, no otro dragón.
  const challenged = party();
  challenged.encMod = { m4_e05: 1 };
  sizeEncounter(challenged, ['m4_e05'], true);
  const withExtra = enemiesOf(challenged, 'm4_e05');
  expect(withExtra.filter(e => e.srd_creature === 'Young White Dragon').reduce((n, e) => n + e.count, 0)).toBe(1);
  expect(withExtra.filter(e => e.srd_creature === 'Kobold').reduce((n, e) => n + e.count, 0)).toBe(3);
  for (const row of ['front', 'back'])
    expect(withExtra.filter(e => e.row === row).reduce((n, e) => n + e.count, 0)).toBeLessThanOrEqual(3);

  // Aunque el jugador llegue sin acompañantes, nunca se borra el jefe.
  const solo = newGame(1, 'Prueba', 'fighter', 'human');
  solo.zone = 'm4';
  sizeEncounter(solo, ['m4_e05'], true);
  expect(enemiesOf(solo, 'm4_e05').map(e => e.srd_creature)).toEqual(['Young White Dragon']);
});

test('equilibrio: un grupo de dos no combate contra tres enemigos normales', () => {
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  g.zone = 'z2';
  g.party.push(createAlly('tiko', 1, 0, 'hondaroca'));
  sizeEncounter(g, ['z2_e04'], false);
  const enemies = enemiesOf(g, 'z2_e04');
  expect(enemies.reduce((n, e) => n + e.count, 0)).toBeLessThanOrEqual(2);
});

test('equilibrio: el Corazón Hueco sigue siendo único con sus nudos de raíz', () => {
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  g.zone = 'b4';
  g.party.push(
    createAlly('maren', 1, 0, 'corazon_hueco'),
    createAlly('anselmo', 1, 0, 'corazon_hueco'),
    createAlly('ivelle', 1, 0, 'corazon_hueco'),
  );
  sizeEncounter(g, ['b4_e04'], true);
  const enemies = enemiesOf(g, 'b4_e04');
  expect(enemies.filter(e => e.srd_creature === 'Treant').reduce((n, e) => n + e.count, 0)).toBe(1);
  expect(enemies.reduce((n, e) => n + e.count, 0)).toBeLessThanOrEqual(4);
});

test('equilibrio: el montículo de la ciénaga es opcional y se advierte antes', () => {
  expect(contentById('b3_e04')!.c.trigger).toBe('enter');
  expect(contentById('b3_n_peligro')!.c.type).toBe('notice');
});

test('equilibrio: los jefes dan su PX completo aunque sus monstruos tengan PX internos cero', () => {
  for (const [zone, id, xp] of [['b4', 'b4_e04', 700], ['m4', 'm4_e05', 2800]] as const) {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    g.zone = zone;
    const cb = startCombat(g, id);
    devWin(g, cb);
    expect(cb.result).toBe('win');
    expect(g.party[0].xp).toBe(xp);
  }
});

test('superar con 20 aplica el resultado de éxito y revela el secreto del emblema', () => {
  const g = game(); enterZone(g, 'z2');
  const evs = chooseOption(g, 'z2_s02_pista', 0, g.party[0].id, true);
  const msg = evs.find(e => e.kind === 'msg');
  expect(msg?.kind === 'msg' && msg.rolls?.[0]).toMatchObject({ d20: 20, ok: true });
  expect(g.done).toContain('z2_s02_pista');
  expect(g.found).toContain('z2_s02');
});

test('equilibrio: Orvane combate con su escolta de mefits, empiece el combate por donde empiece', () => {
  const party = (allies: string[]) => {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    g.zone = 'z4';
    allies.forEach(a => g.party.push(createAlly(a, 1, 0, 'hondaroca')));
    gainXp(g.party, 2700 * g.party.length);
    return g;
  };
  const foes = (g: ReturnType<typeof newGame>, ids: string[]) => {
    sizeEncounter(g, ids, true);
    const all = ids.flatMap(id => enemiesOf(g, id));
    const n = (c: string) => all.filter(e => e.srd_creature === c).reduce((k, e) => k + e.count, 0);
    return { orvane: n('Orvane'), mefits: n('Steam Mephit') };
  };
  // Grupo completo: Orvane y tres mefits, entre por la sala o por su casilla.
  expect(foes(party(['tiko', 'brunna', 'liss']), ['z4_e04', 'z4_e05'])).toEqual({ orvane: 1, mefits: 3 });
  expect(foes(party(['tiko', 'brunna', 'liss']), ['z4_e05', 'z4_e04'])).toEqual({ orvane: 1, mefits: 3 });
  // Un grupo pequeño recibe la misma escolta recortada en los dos casos.
  const a = foes(party(['tiko']), ['z4_e04', 'z4_e05']);
  expect(foes(party(['tiko']), ['z4_e05', 'z4_e04'])).toEqual(a);
  expect(a.orvane).toBe(1);
});
