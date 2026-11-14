import { create } from 'zustand';
import type { ImgKey } from './assets';
import type { Ability, ClassId, SpeciesId } from './data/srd';
import { clone, Game, newGame } from './engine/game';
import { chooseOption, leaveScene, sceneSpent, spentMsg } from './engine/escenas';
import { endAdventure, sendToInn } from './engine/posada';
import { markReturn, react, atEntrance, atRest, atTownRest, backToPrevious, previousZone, rereadAt, bossEncounter, doRest, dropKey, enterZone, Ev, findPath, giveItem, storeTrophies, Hex, hkey, passable, pathToward, step, trap, logEvs } from './engine/dungeon';
import { ADVS, ADV_LIST, AdvId, TOWNS, TownId, advOf, firstZone, wonAdv } from './engine/aventuras';
import { ITEMS } from './data/srd';
import { Action, actionsFor, autoTurn, Combat, devWin, endTurn, enemyTurn, perform, startCombat, withDice, useInspiration } from './engine/combat';
import * as storage from './storage';
import { Char, MAX_ITEMS, longRest, raiseTo } from './engine/rules';

export type Screen = 'title' | 'slots' | 'create' | 'intro' | 'game' | 'victory' | 'defeat';

interface State {
  screen: Screen;
  slotMode: 'new' | 'load';
  newSlot: number;
  game?: Game;
  combat?: Combat;
  queue: Ev[];
  /** Intro que se está mostrando: la de una aventura nueva o una repetida desde el diario. */
  intro?: { adv: AdvId; replay?: boolean };
  showIntro: (adv: AdvId) => void;
  closeIntro: () => void;
  walking: Hex[];
  /** Casilla lejana o sin explorar hacia la que se avanza solo. */
  goal?: Hex;
  /** Zoom del mapa, se mantiene durante la exploración. */
  zoom: number;
  setZoom: (z: number) => void;
  go: (s: Screen) => void;
  pickSlot: (mode: 'new' | 'load') => void;
  chooseNewSlot: (slot: number) => void;
  create: (name: string, cls: ClassId, sp: SpeciesId, abil?: Record<Ability, number>, img?: ImgKey) => void;
  enterDungeon: () => void;
  loadSlot: (slot: number) => void;
  walkTo: (h: Hex) => void;
  walkStep: () => void;
  next: () => void;
  rest: (accept: boolean) => void;
  /** Trampa vista: quién la desactiva (id), 'pass' para pasar con cuidado o nada para volver atrás. */
  trapChoice: (choice?: string) => void;
  act: (a: Action, target?: string) => void;
  endTurn: () => void;
  /** Repetir el último ataque fallado gastando la Inspiración heroica (o descartarlo). */
  reroll: (use: boolean) => void;
  enemyStep: () => void;
  closeCombat: () => void;
  edit: (fn: (g: Game) => void, save?: boolean) => void;
  toTown: () => void;
  goBack: () => void;
  devWin: () => void;
  goTown: () => void;
  leaveTown: (escort?: string) => void;
  travel: (t: TownId) => void;
  drop: (charId: string, uid: string) => void;
  pickUp: () => void;
  /** Escena con opciones: elegir una (y quién tira) o dejarla para luego. */
  sceneChoose: (i: number, charId?: string, force20?: boolean) => void;
  sceneLeave: () => void;
  /** Vuelve a mostrar lo que dio la escena o palanca de esta casilla, sin apuntarlo otra vez. */
  reread: () => void;
  /** Grupo lleno: este aliado vuelve a la posada. */
  swapOut: (charId: string) => void;
}

const isDev = () => storage.getDev();

/** Sale al pueblo de la aventura; al volver se aparece en esta misma casilla. */
function enterTown(g: Game) {
  const adv = advOf(g.zone);
  g.back = { zone: g.zone, pos: g.pos };
  g.backs = { ...g.backs, [adv]: g.back };
  g.town = ADVS[adv].town;
  g.place = 'town';
  g.note = undefined;
  joinTown(g);
}

/** En el pueblo se junta todo el grupo, también los aliados de otras aventuras. */
function joinTown(g: Game) {
  storeTrophies(g);
  g.party.push(...(g.bench ?? []));
  g.bench = [];
}

/** Hito de nivel: tras terminar una aventura todo el grupo sube al menos al nivel que le toca (también las partidas antiguas). */
function milestone(g: Game) {
  const lv = Math.max(1, ...ADV_LIST.filter(a => wonAdv(g, a.id)).map(a => a.level));
  for (const c of [...g.party, ...(g.bench ?? [])]) g.log.push(...raiseTo(c, lv));
}

/** Al entrar en una aventura solo van el héroe, los aliados de esa aventura y, si lo hay, el que le escolta. */
function leaveFor(g: Game, adv: AdvId, escort?: string) {
  g.escort = escort;
  // Al empezar el bosque o la montaña solo va un compañero de otra aventura, el que escolta (el autor 2026-11-06).
  const firstStart = !!ADVS[adv].prev && ![...g.party, ...(g.bench ?? [])].some(c => c.adv === adv);
  // Si no, los elegidos en la posada (hasta tres); si nunca se eligió, los aliados de la aventura.
  const goes = (c: Char) => c.isHero || c.id === escort || (!firstStart && (g.chosen ? g.chosen.includes(c.id) : (c.adv ?? 'hondaroca') === adv));
  g.bench = [...(g.bench ?? []), ...g.party.filter(c => !goes(c))];
  g.party = g.party.filter(goes);
}

export const useStore = create<State>((set, get) => {
  /** Aplica fn sobre una copia de la partida y del combate, y guarda el resultado. */
  const mutate = (fn: (g: Game, cb?: Combat) => Partial<State> | void, save = false) => {
    const g = clone(get().game!);
    const cb = get().combat ? clone(get().combat!) : undefined;
    const extra = fn(g, cb) ?? {};
    if (save) storage.save(g);
    set({ game: g, combat: cb, ...extra });
  };

  /** Resuelve los eventos automáticos (combate, cambio de zona) de la cola. */
  const advance = (g: Game, queue: Ev[]): Partial<State> => {
    const q = [...queue];
    while (q.length) {
      const ev = q[0];
      if (ev.kind === 'back') {
        // Puerta de entrada de la primera zona: al pueblo. En las demás, escalera a la zona anterior.
        if (!previousZone(g)) { enterTown(g); return { queue: [], walking: [], goal: undefined }; }
        q.shift();
        backToPrevious(g);
        markReturn(g);
        storage.save(g);
        continue;
      }
      if (ev.kind === 'zone') {
        q.shift();
        q.unshift(...enterZone(g, ev.to));
        storage.save(g);
        continue;
      }
      if (ev.kind === 'combat') {
        q.shift();
        return { queue: q, combat: startCombat(g, ev.id), walking: [] };
      }
      // Prueba con todas las vías falladas: solo un aviso hasta el próximo descanso largo en la posada.
      if (ev.kind === 'scene' && sceneSpent(g, ev.id)) { q[0] = spentMsg(ev.id); continue; }
      break;
    }
    return { queue: q };
  };

  return {
    screen: 'title',
    slotMode: 'new',
    newSlot: 1,
    queue: [],
    walking: [],
    zoom: storage.getZoom(),
    setZoom: zoom => { storage.setZoom(zoom); set({ zoom }); },
    go: screen => set({ screen }),
    showIntro: adv => set({ screen: 'intro', intro: { adv, replay: true } }),
    closeIntro: () => (get().intro ? set({ screen: 'game', intro: undefined }) : get().enterDungeon()),
    pickSlot: slotMode => set({ slotMode, screen: 'slots' }),
    chooseNewSlot: newSlot => set({ newSlot, screen: 'create' }),
    create: (name, cls, sp, abil, img) => {
      const g = newGame(get().newSlot, name, cls, sp, abil, img);
      set({ game: g, combat: undefined, queue: [], screen: 'intro', intro: undefined });
    },
    // Partida nueva: tras la imagen de entrada se empieza en el pueblo (el autor 2026-11-06); a la mina se va desde allí.
    enterDungeon: () => {
      const g = clone(get().game!);
      g.place = 'town';
      g.town = ADVS.hondaroca.town;
      storage.save(g);
      set({ game: g, screen: 'game', queue: [] });
    },
    loadSlot: slot => {
      const g = storage.load(slot);
      if (!g) return;
      set({ game: g, combat: undefined, queue: [], walking: [], screen: 'game' });
    },
    walkTo: h => {
      const { game, queue, combat } = get();
      if (!game || queue.length || combat) return;
      // Tocar la escalera de entrada estando encima: se vuelve a la zona anterior.
      if (hkey(h) === hkey(game.pos)) { if (atEntrance(game)) get().goBack(); return; }
      // Modo desarrollador: salto directo; solo cuenta lo que haya en la casilla de destino.
      if (isDev()) {
        if (passable(game, game.zone).has(hkey(h))) mutate(g => ({ walking: [], goal: undefined, ...advance(g, step(g, h, true)) }), true);
        return;
      }
      const p = findPath(game, h, isDev());
      if (p?.length) { set({ walking: p, goal: undefined }); return; }
      // Casilla en la oscuridad: se avanza hacia ella hasta llegar, encontrar algo o no poder seguir.
      const t = pathToward(game, h, isDev());
      if (t?.length) set({ walking: t, goal: h });
    },
    walkStep: () => {
      const [h, ...rest] = get().walking;
      if (!h) return;
      mutate(g => {
        const goal0 = get().goal;
        // La escalera de la entrada solo devuelve a la zona anterior si era el destino, no al pasar por encima.
        // Igual con los puntos de descanso: solo se ofrecen si es la casilla de destino.
        const dest = !rest.length && (!goal0 || hkey(goal0) === hkey(h));
        const evs = step(g, h).filter(e => (e.kind !== 'back' && e.kind !== 'rest') || dest);
        // Abrir un cofre o coger la llave guarda la partida: no se pierde aunque caiga el grupo después.
        if (evs.some(e => e.kind === 'msg' && e.save)) storage.save(g);
        if (evs.length) return { walking: [], goal: undefined, ...advance(g, evs) };
        const goal = get().goal;
        if (!goal || hkey(goal) === hkey(g.pos)) return { walking: rest, goal: rest.length ? goal : undefined };
        const p = pathToward(g, goal, isDev());
        return p?.length ? { walking: p } : { walking: [], goal: undefined };
      });
    },
    next: () => mutate(g => advance(g, get().queue.slice(1))),
    rest: accept => {
      const ev = get().queue[0];
      if (ev?.kind !== 'rest') return;
      mutate(g => {
        const q = get().queue.slice(1);
        if (!accept) { g.note = 'Puedes volver a este punto a descansar más tarde.'; return advance(g, q); }
        const lines = doRest(g, ev.id, ev.long);
        return advance(g, [{ kind: 'msg', title: ev.long ? 'Descanso largo' : 'Descanso corto', lines }, ...q]);
      }, accept);
    },
    trapChoice: choice => {
      const ev = get().queue[0];
      if (ev?.kind !== 'trap') return;
      mutate(g => {
        const q = get().queue.slice(1);
        if (!choice) { g.pos = g.prev; g.note = 'Volvéis atrás. La trampa sigue ahí.'; return advance(g, q); }
        const out = trap(g, ev.id, choice);
        logEvs(g, [out]);
        return advance(g, [out, ...q]);
      }, true);
    },
    act: (a, target) => mutate((g, cb) => { withDice(cb!, () => perform(g, cb!, a, target)); }),
    endTurn: () => mutate((g, cb) => { if (!cb!.result) endTurn(g, cb!); }),
    reroll: use => mutate((g, cb) => { if (!cb) return; if (use) withDice(cb, () => useInspiration(g, cb)); else cb.reroll = undefined; }),
    enemyStep: () => mutate((g, cb) => { if (cb && !cb.result && autoTurn(cb)) withDice(cb, () => enemyTurn(g, cb)); }),
    closeCombat: () => {
      const cb = get().combat;
      if (!cb?.result) return;
      if (cb.result === 'lose') {
        // Una derrota devuelve al último guardado con una penalización moderada del 10 % del oro.
        const last = storage.load(get().game!.slot);
        if (last) { last.gold -= Math.floor(last.gold * 0.10); storage.save(last); }
        set({ screen: 'defeat' });
        return;
      }
      mutate(g => {
        if (cb.result === 'fled') { g.pos = g.prev; return { combat: undefined, queue: [] }; }
        const adv = advOf(g.zone);
        if (g.done.includes(bossEncounter(g.zone)) && !g.wins?.includes(adv) && !(adv === 'hondaroca' && g.won)) {
          g.wins = [...(g.wins ?? []), adv];
          g.restReady = true;
          if (adv === 'hondaroca') g.won = true;
          return { combat: undefined, queue: [], screen: 'victory' as Screen };
        }
        // Si alguien cayó inconsciente, un compañero lo comenta al acabar.
        const close = cb.result === 'win' && cb.log.some(l => /cae inconsciente/.test(l.t)) ? react(g, 'close') : undefined;
        if (close) g.log.push(`${close.kind === 'dialogue' ? close.lines[0].text : ''}`);
        return { combat: undefined, ...advance(g, close ? [close, ...get().queue] : get().queue) };
      }, cb.result === 'win');
    },
    edit: (fn, save = false) => mutate(g => { fn(g); }, save),
    devWin: () => mutate((g, cb) => { if (cb) devWin(g, cb); }),
    goBack: () => {
      const { game, queue, combat, walking } = get();
      if (!game || queue.length || combat || walking.length) return;
      mutate(g => {
        if (previousZone(g)) { const evs = backToPrevious(g); markReturn(g); return advance(g, evs); }
        enterTown(g);
      }, true);
    },
    goTown: () => {
      const { game, queue, combat, walking } = get();
      if (!game || queue.length || combat || walking.length || !atTownRest(game)) return;
      mutate(g => { enterTown(g); return { goal: undefined }; }, true);
    },
    leaveTown: escort => mutate(g => {
      const adv = TOWNS[g.town ?? 'valdescarcha'].adv;
      // Punto de vuelta: el descanso desde el que se salió; si no lo hay (partida cargada en el pueblo,
      // aventura ya terminada), donde se dejó la aventura; y si nunca se entró, su comienzo.
      const b = g.backs?.[adv] ?? (g.back && advOf(g.back.zone) === adv ? g.back : undefined);
      milestone(g);
      leaveFor(g, adv, escort);
      g.place = 'dungeon';
      delete g.back;
      const target = b?.zone ?? (advOf(g.zone) === adv ? g.zone : firstZone(adv));
      // Partida nueva: aún no se ha pisado la primera zona.
      const first = target === g.zone && !g.visited.length;
      const fresh = (target !== g.zone || first) && !g.saved?.[target];
      const evs: Ev[] = target === g.zone && !first ? [] : enterZone(g, target);
      if (b) { g.pos = b.pos; g.prev = b.pos; }
      if (!fresh) { markReturn(g); g.log.push('— Volvéis a la mazmorra —'); return { queue: [] }; }
      // La imagen de entrada de una partida nueva ya se vio al crearla.
      if (first) return advance(g, evs);
      return { ...advance(g, evs), screen: 'intro' as Screen, intro: { adv } };
    }, true),
    toTown: () => mutate(g => {
      const A = ADVS[advOf(g.zone)];
      g.backs = { ...g.backs, [A.id]: { zone: g.zone, pos: g.pos } };
      g.town = A.town;
      g.place = 'town';
      g.gold += A.reward.gold; // recompensa del jefe según el diseño
      endAdventure(g, A.id);
      if (A.reward.item) {
        // El cofre del final (Astilla del Corazón) se entrega aquí.
        const all: any[] = A.data.zones.flatMap(z => z.rooms.flatMap(r => r.contents as any[]));
        const chest = all.find(c => c.type === 'chest' && c.item?.id === A.reward.item);
        if (chest && !g.done.includes(chest.id)) { g.done.push(chest.id); giveItem(g, A.reward.item); }
      }
      joinTown(g);
      milestone(g);
      g.party.forEach(longRest);
      return { screen: 'game' as Screen, queue: [] };
    }, true),
    travel: t => mutate(g => {
      g.town = t;
      g.log.push(`— Viajáis a ${TOWNS[t].name} —`);
      // Modo desarrollador: el grupo sube al nivel con el que se entra en esa aventura (el de terminar la anterior).
      const prev = ADVS[TOWNS[t].adv].prev;
      if (isDev() && prev) for (const c of [...g.party, ...(g.bench ?? [])]) g.log.push(...raiseTo(c, ADVS[prev].level));
    }, true),
    drop: (charId, uid) => mutate(g => {
      const c = g.party.find(x => x.id === charId)!;
      const it = c.items.find(i => i.uid === uid);
      if (!it) return;
      c.items = c.items.filter(i => i.uid !== uid);
      const k = dropKey(g);
      g.drops = { ...g.drops, [k]: [...(g.drops?.[k] ?? []), it] };
      g.note = `${c.name} deja ${ITEMS[it.id].name} en el suelo. Seguirá aquí cuando vuelvas.`;
    }, true),
    sceneChoose: (i, charId, force20) => {
      const ev = get().queue[0];
      if (ev?.kind !== 'scene') return;
      mutate(g => advance(g, [...chooseOption(g, ev.id, i, charId, isDev() && force20), ...get().queue.slice(1)]), true);
    },
    sceneLeave: () => {
      const ev = get().queue[0];
      if (ev?.kind !== 'scene') return;
      mutate(g => { g.note = leaveScene(g, ev.id); return advance(g, get().queue.slice(1)); });
    },
    reread: () => mutate(g => { g.note = undefined; return advance(g, rereadAt(g, hkey(g.pos))); }),
    swapOut: charId => {
      const ev = get().queue[0];
      if (ev?.kind !== 'swap') return;
      mutate(g => {
        const c = g.party.find(x => x.id === charId);
        if (!c || c.isHero || c.id === ev.ally) return;
        const lines = sendToInn(g, c);
        g.log.push(...lines);
        return advance(g, [{ kind: 'msg', title: 'Vuelve a la posada', portrait: c.img, lines }, ...get().queue.slice(1)]);
      }, true);
    },
    pickUp: () => mutate(g => {
      const k = dropKey(g);
      const left = [];
      const got: string[] = [];
      for (const it of g.drops?.[k] ?? []) {
        const who = g.party.find(c => !c.dead && c.items.length < MAX_ITEMS);
        if (who) { who.items.push(it); got.push(`${who.name.split(' ')[0]}: ${ITEMS[it.id].name}`); }
        else left.push(it);
      }
      g.drops = { ...g.drops, [k]: left };
      g.note = got.length ? `Recogéis ${got.join(', ')}.` + (left.length ? ' No cabe todo.' : '') : 'No hay sitio en las mochilas.';
    }, true),
  };
});

export const canAct = (g: Game, cb: Combat) => !cb.result && !autoTurn(cb) && actionsFor(g, cb).length > 0;
