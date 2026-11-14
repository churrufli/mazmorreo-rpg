import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { mdiCogOutline, mdiInformationOutline, mdiSwordCross, mdiHomeVariant, mdiKeyVariant, mdiScriptTextOutline } from '@mdi/js';
import { LogModal } from '../ui/LogModal';
import { Settings } from '../ui/Settings';
import Svg, { Circle, ClipPath, Defs, G, Image as SvgImage, Path, Pattern, Polygon } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IMG, ImgKey } from '../assets';
import { C, F } from '../theme';
import { useStore } from '../store';
import { hasPortraitFrame } from '../data/portraitFrames';
import { SvgFaceImage } from '../ui/FaceImage';
import { Escena } from '../ui/Escena';
import { sceneById, sceneSpent } from '../engine/escenas';
import { townRest, rereadAt, sceneOn, sceneFight, wonCell, useOutside, FLOOR_PROPS, OVER_PROPS, bossEncounter, contentById, npcSpots, pendingAllies, zoneProgress, Hex, KEY_ITEM, atRest, atTownRest, blockedCells, bridgedWater, keyCell, cellMap, dropKey, encounterById, hkey, passable, disarmBonus, plan, previousZone, visibleCells, zoneArt, zoneById } from '../engine/dungeon';
import { ADVS, TOWNS, advOf } from '../engine/aventuras';
import { ITEMS } from '../data/srd';
import { MONSTERS } from '../data/srd';
import { Card, CardInfo, CardModal, charInfo } from '../ui/Card';
import { Dialogue, FadeIn, Message } from '../ui/Overlays';
import { Btn, Icon } from '../ui/kit';
import { getDev } from '../storage';
import { MAX_ITEMS, isDown, needsRest } from '../engine/rules';
import { FeatPicker } from '../ui/FeatPicker';

const S = 30; // radio del hexágono en píxeles
const SQ3 = Math.sqrt(3);
const center = (q: number, r: number) => [S * SQ3 * (q + r / 2), S * 1.5 * r];
/** Casilla hexagonal bajo un punto del plano (redondeo cúbico). */
const hexAt = (x: number, y: number): Hex => {
  const r = y / (1.5 * S), q = x / (S * SQ3) - r / 2, s = -q - r;
  let rq = Math.round(q), rr = Math.round(r);
  const rs = Math.round(s);
  const dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs; else if (dr > ds) rr = -rq - rs;
  return [rq, rr];
};
const hexPts = (x: number, y: number, s = S) =>
  [0, 1, 2, 3, 4, 5].map(i => { const a = (Math.PI / 180) * (60 * i - 30); return `${x + s * Math.cos(a)},${y + s * Math.sin(a)}`; }).join(' ');

/** Lados del hexágono en el mismo orden que sus vértices (desde la derecha, en sentido horario). */
const EDGE_DIRS: Hex[] = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];

/** Solo la frontera suelo–muro visible; no dibuja líneas entre casillas de suelo. */
function wallOutline(cells: Hex[], walls: Set<string>): string {
  const segments: string[] = [];
  for (const [q, r] of cells) {
    const [x, y] = center(q, r);
    EDGE_DIRS.forEach(([dq, dr], i) => {
      if (!walls.has(hkey([q + dq, r + dr]))) return;
      const a = (Math.PI / 180) * (60 * i - 30), b = a + Math.PI / 3;
      segments.push(`M${x + S * Math.cos(a)},${y + S * Math.sin(a)}L${x + S * Math.cos(b)},${y + S * Math.sin(b)}`);
    });
  }
  return segments.join(' ');
}

const PROP: Record<string, ImgKey> = {
  mine_cart: 'vagoneta', rails: 'railes', torch: 'antorcha', stairs: 'escaleras', rubble: 'escombros', column: 'columna',
  altar: 'altar', sarcophagus: 'sarcofago', crystal: 'cristal', water: 'agua_oscura',
  big_tree: 'arbol_grande', fallen_tree: 'arbol_caido', standing_stone: 'piedra_erguida', swamp_water: 'agua_cienaga',
  thorn_bush: 'arbusto_espinoso', mossy_rock: 'roca_musgo', web: 'tela_arana', mushrooms: 'setas', cabin: 'cabana',
  bridge: 'puente', druid_altar: 'altar_druidico', stump: 'tocon', totem: 'totem',
  pine: 'pino_nevado', fallen_pine: 'pino_caido', snow_rock: 'roca_nieve', ice_pillar: 'pilar_hielo', frozen_pool: 'charca_helada',
  crevasse: 'grieta_hielo', snow_cabin: 'cabana_tramperos', dwarf_statue: 'estatua_enano', forge: 'forja_enana',
  bone_pile: 'monton_huesos', dragon_hoard: 'tesoro_dragon',
  lectern: 'atril_libro', barrels: 'barriles_cajas', milestone: 'hito_piedra', gravestone: 'lapida', desk: 'mesa_papeles',
  walkway: 'pasarela', pedestal: 'pedestal', root_arch: 'raiz_arqueada', ore_sacks: 'sacos_mineral', cell_bars: 'celda_reja',
};

/** Decorados planos del suelo, que se recortan como la casilla. */
const HEX_PROPS = new Set(['water', 'swamp_water']);

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

/** Resplandor breve en las casillas de un camino descubierto mediante una decisión. */
function PathGlow({ points }: { points: string }) {
  const light = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.sequence([Animated.timing(light, { toValue: 0.75, duration: 300, useNativeDriver: false }), Animated.timing(light, { toValue: 0, duration: 500, useNativeDriver: false })]);
    Animated.loop(anim, { iterations: 3 }).start();
    return () => light.stopAnimation();
  }, [light]);
  return <AnimatedPolygon points={points} fill="#f8d56c" opacity={light} />;
}


/** Casilla que acaba de aparecer entre la niebla: un velo negro que se desvanece. */
function Reveal({ points, delay }: { points: string; delay: number }) {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => { Animated.timing(v, { toValue: 0, duration: 650, delay, easing: Easing.out(Easing.quad), useNativeDriver: false }).start(); }, [v, delay]);
  return <AnimatedPolygon points={points} fill="#000" opacity={v} />;
}


/**
 * Suelo y paredes de la zona, con las casillas que se tocan para andar. Va en su propio lienzo y solo se
 * redibuja cuando cambia lo que se ve (niebla, puertas abiertas, casillas pisadas), no en cada paso del grupo.
 */
const Ground = memo(function Ground({ zone, box, art, vis, pass, blocked, rooms, visited, onTap }: {
  zone: string; box: { minX: number; minY: number; w: number; h: number }; art: ReturnType<typeof zoneArt>; vis: Set<string>; visKey: string;
  pass: Set<string>; blocked: Set<string>; rooms: Map<string, number>; visited: string[]; onTap: { current: (h: Hex) => void };
}) {
  const zp = plan(zone);
  const X = (x: number) => x - box.minX;
  const Y = (y: number) => y - box.minY;
  // Paredes: casillas visibles que no son suelo.
  const floor = (k: string) => pass.has(k) || blocked.has(k);
  const walls: string[] = [];
  for (const k of vis) if (!floor(k)) walls.push(k);
  const outline = wallOutline(zp.cells.filter(([q, r]) => vis.has(hkey([q, r])) && floor(hkey([q, r]))).map(([q, r]) => [q, r] as Hex), new Set(walls));
  return (
    <Svg width={box.w} height={box.h}>
      <Defs>
              <Pattern id="floor" patternUnits="userSpaceOnUse" width={128} height={128}>
                <SvgImage href={IMG[art.floor]} width={128} height={128} />
              </Pattern>
              <Pattern id="wall" patternUnits="userSpaceOnUse" width={128} height={128}>
                <SvgImage href={IMG[art.wall]} width={128} height={128} />
              </Pattern>
      </Defs>
            {walls.map(k => {
              const [q, r] = k.split(',').map(Number);
              const [x, y] = center(q, r);
              return <Polygon key={`w${k}`} points={hexPts(X(x), Y(y))} fill="url(#wall)" stroke="#000" strokeWidth={1} />;
            })}
            {zp.cells.map(([q, r]) => {
              const k = hkey([q, r]);
              if (!vis.has(k) || !floor(k)) return null;
              const [x, y] = center(q, r);
              const seen = visited.includes(k);
              return (
                <G key={k}>
                  <Polygon points={hexPts(X(x), Y(y))} fill="url(#floor)" stroke="#1a120a" strokeWidth={1.5} />
                  {!seen && !blocked.has(k) ? <Polygon points={hexPts(X(x), Y(y))} fill="#000" opacity={0.5} /> : null}
                  {rooms.get(k) === -1 ? <Polygon points={hexPts(X(x), Y(y))} fill="#000" opacity={0.18} /> : null}
                </G>
              );
            })}
            {/* Un relieve oscuro y fino en la unión con el muro, sin remarcar toda la cuadrícula. */}
            <Path d={outline} transform={`translate(${-box.minX},${-box.minY})`} fill="none" stroke="#080604" strokeOpacity={1} strokeWidth={3.5} strokeLinecap="round" pointerEvents="none" />
            {zp.cells.map(([q, r]) => {
              const k = hkey([q, r]);
              if (!vis.has(k) || !pass.has(k)) return null;
              const [x, y] = center(q, r);
              return <Polygon key={`t${k}`} points={hexPts(X(x), Y(y))} fill="#000" fillOpacity={0.01} onPress={() => onTap.current([q, r] as Hex)} />;
            })}
    </Svg>
  );
}, (a, b) => a.visKey === b.visKey && a.box === b.box);

/** Carta del grupo abajo: solo se redibuja si cambia lo que enseña (no en cada paso). */
const PartyCard = memo(function PartyCard({ info, id, width, dead, onOpen }: { info: CardInfo; id: string; width: number; dead: boolean; onOpen: (id: string) => void }) {
  return <Card info={info} width={width} dim={dead} onPress={() => onOpen(id)} onLongPress={() => onOpen(id)} />;
}, (a, b) => a.width === b.width && a.dead === b.dead && JSON.stringify(a.info) === JSON.stringify(b.info));

export function Explore() {
  const { game, queue, walking, walkTo, walkStep, next, rest, trapChoice, edit, zoom, setZoom, goTown, drop, pickUp, sceneChoose, sceneLeave, swapOut, reread } = useStore();
  const g = game!;
  const ins = useSafeAreaInsets();
  const win = useWindowDimensions();
  // Daño fuera de combate (trampas): número rojo sobre la carta pequeña de quien lo recibe.
  const hpBefore = useRef<Record<string, number>>({});
  const [hits, setHits] = useState<Record<string, { n: number; k: number }>>({});
  useEffect(() => {
    const now: Record<string, { n: number; k: number }> = {};
    for (const c of g.party) {
      const was = hpBefore.current[c.id];
      if (was !== undefined && c.hp < was) now[c.id] = { n: was - c.hp, k: Date.now() };
      hpBefore.current[c.id] = c.hp;
    }
    if (Object.keys(now).length) setHits(h => ({ ...h, ...now }));
  }, [g.party]);
  const [view, setView] = useState({ w: win.width, h: win.height });
  const [sheet, setSheet] = useState<string>();
  const [showLog, setShowLog] = useState(false);
  const [showOpts, setShowOpts] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const zp = plan(g.zone);
  const art = zoneArt(g.zone);

  const box = useMemo(() => {
    const pts = zp.cells.map(([q, r]) => center(q, r));
    const minX = Math.min(...pts.map(p => p[0])) - S * 3, minY = Math.min(...pts.map(p => p[1])) - S * 3;
    const maxX = Math.max(...pts.map(p => p[0])) + S * 3, maxY = Math.max(...pts.map(p => p[1])) + S * 3;
    return { minX, minY, w: maxX - minX, h: maxY - minY };
  }, [zp]);
  const X = (x: number) => x - box.minX;
  const Y = (y: number) => y - box.minY;

  const dev = getDev();
  const vis = useMemo(() => visibleCells(g, dev), [g, dev]);
  const pass = useMemo(() => passable(g, g.zone), [g]);
  // Las rejas cerradas se dibujan como suelo con la reja encima, pero no se pisan.
  const blocked = useMemo(() => {
    const gates = plan(g.zone).marks.filter(m => m.kind === 'gate' && !g.done.includes(m.id)).map(m => `${m.q},${m.r}`);
    // Lo que hay tras un secreto sin descubrir no se dibuja (tampoco sin niebla): ni suelo ni decorados.
    const hidden = new Set(plan(g.zone).marks.filter(m => m.kind === 'secret' && !g.found.includes(m.id)).flatMap(m => m.path ?? []));
    return new Set([...blockedCells(g.zone), ...gates].filter(k => !hidden.has(k)));
  }, [g]);
  const rooms = useMemo(() => cellMap(g.zone), [g.zone]);

  // Por casillas ya pisadas se anda más deprisa (volver por lo explorado); la marcha sigue parándose en cada evento.
  const quick = useRef(false);
  useEffect(() => {
    if (!walking.length) return;
    quick.current = g.visited.includes(hkey(walking[0]));
    const t = setTimeout(walkStep, quick.current ? 90 : 190);
    return () => clearTimeout(t);
  }, [walking, walkStep]); // eslint-disable-line react-hooks/exhaustive-deps

  // Casillas que aparecen entre la niebla en este paso.
  const prevVis = useRef<{ zone: string; set: Set<string> } | undefined>(undefined);
  const [reveals, setReveals] = useState<{ k: string; n: number }[]>([]);
  const prevFound = useRef<{ zone: string; ids: string[] } | undefined>(undefined);
  const [newPaths, setNewPaths] = useState<{ k: string; n: number }[]>([]);
  const pendingPaths = useRef<string[]>([]);
  // También iluminar los accesos abiertos por palanca: se registran en done, no en found.
  const prevOpened = useRef<{ zone: string; ids: string[] } | undefined>(undefined);
  useEffect(() => {
    const before = prevOpened.current;
    prevOpened.current = { zone: g.zone, ids: [...g.done] };
    if (!before || before.zone !== g.zone) return;
    const opened = zp.marks.filter(m => m.kind === 'gate' && g.done.includes(m.id) && !before.ids.includes(m.id));
    if (opened.length) pendingPaths.current = [...pendingPaths.current, ...opened.map(m => `${m.q},${m.r}`)];
  }, [g.zone, g.done, zp]);
  useEffect(() => {
    const before = prevFound.current;
    prevFound.current = { zone: g.zone, ids: [...g.found] };
    if (!before || before.zone !== g.zone) return;
    const fresh = zp.marks.filter(m => m.kind === 'secret' && g.found.includes(m.id) && !before.ids.includes(m.id));
    const cells = fresh.flatMap(m => m.path ?? []);
    if (cells.length) pendingPaths.current = [...pendingPaths.current, ...cells];
  }, [g.zone, g.found, zp]);
  useEffect(() => {
    const before = prevVis.current;
    prevVis.current = { zone: g.zone, set: vis };
    if (!before || before.zone !== g.zone) { setReveals([]); return; }
    const added = [...vis].filter(k => !before.set.has(k));
    if (added.length) setReveals(added.map((k, i) => ({ k, n: Date.now() + i })));
  }, [vis, g.zone]);

  // Cámara: sigue al héroe con suavidad; un dedo la desplaza y dos dedos acercan o alejan.
  const [px, py] = center(g.pos[0], g.pos[1]);
  const hx = useRef(new Animated.Value(X(px))).current;
  const hy = useRef(new Animated.Value(Y(py))).current;
  const scale = useRef(new Animated.Value(zoom)).current;
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lastPos = useRef({ x: X(px), y: Y(py) });
  // Si el jugador ha arrastrado el mapa, la cámara respeta ese desplazamiento mientras el grupo camina;
  // vuelve a centrarse en el héroe con la siguiente orden de movimiento.
  const dragged = useRef(false);
  const walkingNow = walking.length > 0;
  useEffect(() => {
    if (!walkingNow || !dragged.current) return;
    dragged.current = false;
    Animated.timing(pan, { toValue: { x: 0, y: 0 }, duration: 300, useNativeDriver: true }).start();
  }, [walkingNow]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const to = { x: X(px), y: Y(py) };
    const far = Math.hypot(to.x - lastPos.current.x, to.y - lastPos.current.y) > S * 4;
    lastPos.current = to;
    if (far) { hx.setValue(to.x); hy.setValue(to.y); pan.setValue({ x: 0, y: 0 }); dragged.current = false; return; }
    Animated.parallel([
      // En el hilo nativo: la cámara y la ficha se deslizan sin tirones aunque el mapa se esté redibujando.
      Animated.timing(hx, { toValue: to.x, duration: quick.current ? 110 : 235, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(hy, { toValue: to.y, duration: quick.current ? 110 : 235, easing: Easing.linear, useNativeDriver: true }),
      ...(dragged.current ? [] : [Animated.timing(pan, { toValue: { x: 0, y: 0 }, duration: 300, useNativeDriver: true })]),
    ]).start();
  }, [px, py, box]); // eslint-disable-line react-hooks/exhaustive-deps

  const zoomNow = useRef(zoom);
  useEffect(() => { const id = scale.addListener(v => { zoomNow.current = v.value; }); return () => scale.removeListener(id); }, [scale]);
  const gesture = useRef<{ s0: number; d0?: number; p0: { x: number; y: number } }>({ s0: 1, p0: { x: 0, y: 0 } });
  // Tocar en la oscuridad (donde ninguna casilla recoge el toque): el grupo avanza hacia allí hasta toparse con algo.
  const darkTap = useRef<(x: number, y: number) => void>(() => undefined);
  darkTap.current = (x, y) => {
    const z = zoomNow.current, p = { x: (pan.x as any)._value, y: (pan.y as any)._value };
    const lx = lastPos.current.x + (x - view.w / 2 - p.x) / z, ly = lastPos.current.y + (y - view.h * 0.42 - p.y) / z;
    walkTo(hexAt(lx + box.minX, ly + box.minY));
  };
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: (e, gs) => e.nativeEvent.touches.length >= 2 || Math.abs(gs.dx) + Math.abs(gs.dy) > 12,
    onPanResponderGrant: () => {
      pan.stopAnimation();
      gesture.current = { s0: zoomNow.current, p0: { x: (pan.x as any)._value, y: (pan.y as any)._value } };
    },
    onPanResponderMove: (e, gs) => {
      const t = e.nativeEvent.touches;
      if (t.length >= 2) {
        const d = Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);
        if (!gesture.current.d0) gesture.current.d0 = d;
        scale.setValue(Math.max(0.5, Math.min(2.2, gesture.current.s0 * (d / gesture.current.d0))));
      } else if (!gesture.current.d0) { dragged.current = true; pan.setValue({ x: gesture.current.p0.x + gs.dx, y: gesture.current.p0.y + gs.dy }); }
    },
    onPanResponderRelease: (_e, gs) => {
      if (!gesture.current.d0 && Math.abs(gs.dx) + Math.abs(gs.dy) < 12) darkTap.current(gs.x0, gs.y0);
      setZoom(zoomNow.current);
    },
    onPanResponderTerminate: () => setZoom(zoomNow.current),
  }), [pan, scale, setZoom]);

  // Punto del mapa que queda en el centro de la vista: el héroe (más el desplazamiento del dedo).
  const sx = view.w / 2, sy = view.h * 0.42;
  const cx = box.w / 2, cy = box.h / 2;
  const tx = Animated.add(Animated.subtract(sx - cx, Animated.multiply(scale, Animated.add(hx, -cx))), pan.x);
  const ty = Animated.add(Animated.subtract(sy - cy, Animated.multiply(scale, Animated.add(hy, -cy))), pan.y);

  // Tocar una casilla: siempre la orden de ahora, aunque el suelo no se redibuje.
  const tapRef = useRef(walkTo);
  tapRef.current = walkTo;

  const head = queue[0];
  useEffect(() => {
    if (head || !pendingPaths.current.length) return;
    const n = Date.now();
    setNewPaths(pendingPaths.current.map(k => ({ k, n })));
    pendingPaths.current = [];
    const t = setTimeout(() => setNewPaths(current => current[0]?.n === n ? [] : current), 2700);
    return () => clearTimeout(t);
  }, [head, g.found, g.done]);
  // Secreto recién descubierto: el mapa se desplaza hasta él y lo ilumina; lo siguiente (un combate, por ejemplo) espera a que se vea (el autor 2026-11-13).
  useEffect(() => {
    if (head?.kind !== 'look') return;
    const m = zp.marks.find(x => x.id === head.id);
    const cells = m ? (m.path?.length ? m.path : [`${m.q},${m.r}`]) : [];
    pendingPaths.current = pendingPaths.current.filter(k => !cells.includes(k));
    if (!cells.length) { next(); return; }
    const n = Date.now();
    setNewPaths(cells.map(k => ({ k, n })));
    const pts = cells.map(k => { const [q, r] = k.split(',').map(Number); const [x, y] = center(q, r); return { x: X(x), y: Y(y) }; });
    const mx = pts.reduce((t, p) => t + p.x, 0) / pts.length, my = pts.reduce((t, p) => t + p.y, 0) / pts.length;
    const z = zoomNow.current;
    dragged.current = true;
    Animated.timing(pan, { toValue: { x: -(mx - lastPos.current.x) * z, y: -(my - lastPos.current.y) * z }, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    // El brillo se apaga solo aunque ya haya empezado lo siguiente.
    setTimeout(() => setNewPaths(c => (c[0]?.n === n ? [] : c)), 2700);
    const t = setTimeout(next, 2300);
    return () => clearTimeout(t);
  }, [head]); // eslint-disable-line react-hooks/exhaustive-deps
  const hero = g.party.find(c => c.isHero)!;
  const sheetChar = g.party.find(c => c.id === sheet);
  const cardW = Math.min(86, (win.width - 24) / Math.max(4, g.party.length) - 6);
  const here = g.drops?.[dropKey(g)] ?? [];
  const restImg: ImgKey = ADVS[advOf(g.zone)].restImg;
  const townName = TOWNS[ADVS[advOf(g.zone)].town].name;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View nativeID="mazmorreo-map" style={{ flex: 1, overflow: 'hidden' }} onLayout={e => setView({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })} {...responder.panHandlers}>
        <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: box.w, height: box.h, transform: [{ translateX: tx }, { translateY: ty }, { scale }] }}>
          <Ground zone={g.zone} box={box} art={art} vis={vis} visKey={`${g.zone}:${vis.size}:${pass.size}:${g.visited.length}`} pass={pass} blocked={blocked} rooms={rooms} visited={g.visited} onTap={tapRef} />
          <Svg width={box.w} height={box.h} style={StyleSheet.absoluteFill} pointerEvents="none">
            <Defs>
              <ClipPath id="tok"><Circle cx={0} cy={0} r={S * 0.78} /></ClipPath>
              <ClipPath id="hex"><Polygon points={hexPts(0, 0)} /></ClipPath>
            </Defs>
            {zp.marks.map((m, i) => {
              const k = `${m.q},${m.r}`;
              if (!vis.has(k)) return null;
              if (!pass.has(k) && !blocked.has(k) && m.kind !== 'gate') return null;
              const [x, y] = center(m.q, m.r);
              let img: ImgKey | undefined;
              // Decorados bloqueantes y capas de suelo; el agua bajo una pasarela también se ve.
              if (m.kind === 'prop' && (blocked.has(k) || bridgedWater(g.zone, m) || (FLOOR_PROPS.has(m.id) && m.id !== 'stairs'))) img = PROP[m.id] === 'altar' && g.zone === 'z4' ? 'altar_orvane' : PROP[m.id];
              if (m.kind === 'chest') img = g.done.includes(m.id) ? 'cofre_abierto' : chestHidden(g, m.id) ? undefined : (contentById(m.id)?.c as any)?.obstacle?.img ?? 'cofre_cerrado';
              if (m.kind === 'door') img = g.visited.includes(k) ? 'puerta_abierta' : 'puerta_cerrada';
              if (m.kind === 'secret') img = g.found.includes(m.id) ? 'losa_secreta' : undefined;
              if (m.kind === 'exit') img = 'escaleras';
              if (m.kind === 'thicket') img = 'arbusto_espinoso';
              // Descanso desde el que se vuelve al pueblo: con una casita encima (el autor 2026-11-06).
              if (m.kind === 'rest' && m.id === townRest(g.zone)) {
                const sz = S * 1.5;
                return (
                  <G key={i}>
                    <SvgImage href={IMG[restImg]} x={X(x) - sz / 2} y={Y(y) - sz / 2} width={sz} height={sz} />
                    <G x={X(x) + S * 0.35} y={Y(y) - S * 0.95}>
                      <Circle r={S * 0.42} fill="#1a1a1a" stroke="#b9ad97" strokeWidth={1.5} />
                      <Path d={mdiHomeVariant} fill={C.goldHi} transform={`translate(${-S * 0.3} ${-S * 0.3}) scale(${(S * 0.6) / 24})`} />
                    </G>
                  </G>
                );
              }
              if (m.kind === 'rest') img = restImg;
              if (m.kind === 'trap') img = g.done.includes(m.id) || g.spotted?.includes(m.id) ? 'trampa' : undefined;
              if (m.kind === 'gate') img = g.done.includes(m.id) ? undefined : 'celda_reja';
              if (m.kind === 'lever') img = 'palanca';
              // Escena por hacer: ficha redonda con su ilustración (o una losa si es la pista de un secreto).
              // Hechas o agotadas: se quedan en gris (el autor 2026-11-06).
              if (m.kind === 'scene') {
                // Combate de la escena del que se huyó: sigue ahí, con la ficha del enemigo (el autor 2026-11-10).
                const fled = sceneFight(g, m.id);
                if (fled) return (
                  <G key={i} x={X(x)} y={Y(y)}>
                    <Circle r={S * 0.82} fill="#300" />
                    <SvgFaceImage img={MONSTERS[encounterById(fled)!.enemies[0].srd_creature].img as ImgKey} radius={S * 0.78} clipPath="url(#tok)" />
                    <Ring img="aro_enemigo" r={S} />
                  </G>
                );
                const gone = g.done.includes(m.id) || sceneSpent(g, m.id);
                if (!gone && !sceneOn(g, m.id)) return null;
                const sc = sceneById(m.id);
                if (!sc) return null;
                return (
                  <G key={i} x={X(x)} y={Y(y)} opacity={gone ? 0.55 : 1}>
                    <Circle r={S * 0.82} fill="#1a1a1a" />
                    {sc.img && hasPortraitFrame(sc.img)
                      ? <SvgFaceImage img={sc.img} radius={S * 0.78} clipPath="url(#tok)" opacity={gone ? 0.5 : 1} />
                      : <SvgImage href={IMG[sc.img ?? 'losa_secreta']} x={-S * 0.8} y={-S * 1.2} width={S * 1.6} height={S * 2.4} clipPath="url(#tok)" preserveAspectRatio="xMidYMid slice" opacity={gone ? 0.5 : 1} />}
                    {gone ? <Circle r={S * 0.82} fill="#6b6b6b" opacity={0.55} /> : null}
                    <Ring img="aro_plata" r={S} />
                  </G>
                );
              }
              if (m.kind === 'encounter') {
                const e = encounterById(m.id)!;
                const mon = MONSTERS[e.enemies[0].srd_creature];
                const boss = bossEncounter(g.zone) === m.id;
                // Vencidos: se quedan en el mapa en blanco y negro (al pisar la casilla se dice quién cayó allí).
                const won = g.done.includes(m.id);
                // Si todos huyeron (nadie cayó), la ficha desaparece.
                const fell = g.fallen?.[m.id];
                if (won && fell && !Object.keys(fell).length) return null;
                // Vencidos: espadas cruzadas, valga para el enemigo que sea (el autor 2026-11-05).
                // Vencidos: las espadas conservan la casilla del grupo enemigo (más abajo).
                if (won) return null;
                const pic = mon.img as ImgKey;
                return (
                  <G key={i} x={X(x)} y={Y(y)}>
                    <Circle r={S * 0.82} fill={won ? '#222' : '#300'} />
                    <SvgFaceImage img={pic} radius={S * 0.78} clipPath="url(#tok)" opacity={won ? 0.85 : 1} />
                    <G opacity={won ? 0.4 : 1}><Ring img={boss ? 'aro_jefe' : 'aro_enemigo'} r={boss ? S * 1.15 : S} /></G>
                  </G>
                );
              }
              if (!img) return null;
              // Agua y demás decorados planos del suelo: recortados con la forma de la casilla (el autor 2026-11-05).
              if (m.kind === 'prop' && HEX_PROPS.has(m.id)) return (
                <G key={i} x={X(x)} y={Y(y)}>
                  <SvgImage href={IMG[img]} x={-S} y={-S} width={S * 2} height={S * 2} clipPath="url(#hex)" preserveAspectRatio="xMidYMid slice" />
                </G>
              );
              const sz = m.kind === 'prop' ? S * 1.4 : S * 1.5;
              return <SvgImage key={i} href={IMG[img]} x={X(x) - sz / 2} y={Y(y) - sz / 2} width={sz} height={sz} />;
            })}
            {/* Combates ganados: espadas cruzadas en la posición fija de cada grupo enemigo (el autor 2026-11-05/06). */}
            {[...new Set(zp.marks.filter(m => m.kind === 'encounter').map(m => wonCell(g, m.id)).filter((k): k is string => !!k && vis.has(k)))].map(k => {
              const [x, y] = center(...(k.split(',').map(Number) as [number, number]));
              return (
                <G key={`won${k}`} x={X(x)} y={Y(y)} opacity={0.85}>
                  <Circle r={S * 0.6} fill="#222" />
                  <Path d={mdiSwordCross} fill="#b9ad97" transform={`translate(${-S * 0.45} ${-S * 0.45}) scale(${(S * 0.9) / 24})`} />
                </G>
              );
            })}
            {/* Entrada: escalera a la zona anterior o, en la primera zona, puerta al pueblo. Se pisa (o se toca estando encima). */}
            {vis.has(hkey(zp.start)) ? (() => {
              const [x, y] = center(zp.start[0], zp.start[1]);
              return <SvgImage href={IMG[previousZone(g) ? 'escaleras' : 'puerta_abierta']} x={X(x) - S * 0.75} y={Y(y) - S * 0.75} width={S * 1.5} height={S * 1.5} />;
            })() : null}
            {/* Aliados que esperan en la zona: círculo dorado (los enemigos, rojo). La niebla los oculta como a todo. */}
            {pendingAllies(g).map(a => {
              if (!vis.has(a.cell)) return null;
              const [x, y] = center(...(a.cell.split(',').map(Number) as [number, number]));
              return (
                <G key={`a${a.id}`} x={X(x)} y={Y(y)}>
                  <Circle r={S * 0.82} fill="#2a2010" />
                  <SvgFaceImage img={a.img} radius={S * 0.78} clipPath="url(#tok)" />
                  <Ring img="aro_oro" r={S} />
                </G>
              );
            })}
            {/* La abuela Brezna: aro de plata donde os espera para hablar. */}
            {npcSpots(g).map(a => {
              if (!vis.has(a.cell)) return null;
              const [x, y] = center(...(a.cell.split(',').map(Number) as [number, number]));
              return (
                <G key={`n${a.id}`} x={X(x)} y={Y(y)}>
                  <Circle r={S * 0.82} fill="#1a1a1a" />
                  <SvgFaceImage img={a.img} radius={S * 0.78} clipPath="url(#tok)" />
                  <Ring img="aro_plata" r={S} />
                </G>
              );
            })}
            {/* Llave (o amuleto) de la zona, hasta que se recoge. */}
            {(() => {
              const kc = keyCell(g.zone);
              if (!kc || g.done.includes(`${g.zone}_key`) || !vis.has(kc)) return null;
              const [x, y] = center(...(kc.split(',').map(Number) as [number, number]));
              return <SvgImage href={IMG[ITEMS[KEY_ITEM(g.zone)].img]} x={X(x) - S * 0.6} y={Y(y) - S * 0.6} width={S * 1.2} height={S * 1.2} />;
            })()}
            {/* Objetos tirados en el suelo. */}
            {Object.entries(g.drops ?? {}).map(([k, items]) => {
              const [z, c] = k.split(':');
              if (z !== g.zone || !items.length || !vis.has(c)) return null;
              const [x, y] = center(...(c.split(',').map(Number) as [number, number]));
              return <SvgImage key={`d${k}`} href={IMG[ITEMS[items[0].id].img]} x={X(x) - S * 0.6} y={Y(y) - S * 0.6} width={S * 1.2} height={S * 1.2} />;
            })}
          </Svg>
          {/* La niebla que se aparta va en su propio lienzo: animarla no obliga a redibujar fichas ni suelo. */}
          {reveals.length ? (
            <Svg width={box.w} height={box.h} style={StyleSheet.absoluteFill} pointerEvents="none">
              {reveals.map(({ k, n }, i) => {
                const [q, r] = k.split(',').map(Number);
                const [x, y] = center(q, r);
                return <Reveal key={`${k}:${n}`} points={hexPts(X(x), Y(y), S + 1)} delay={120 + (i % 6) * 60} />;
              })}
            </Svg>
          ) : null}
          {newPaths.length ? <Svg width={box.w} height={box.h} style={StyleSheet.absoluteFill} pointerEvents="none">
            {newPaths.map(({ k, n }) => {
              const [q, r] = k.split(',').map(Number);
              const [x, y] = center(q, r);
              return <PathGlow key={`${k}:${n}`} points={hexPts(X(x), Y(y), S + 1)} />;
            })}
          </Svg> : null}
          {/* El personaje: la misma ficha que los aliados (fondo, encuadre y aro dorado). */}
          <Animated.View pointerEvents="none" style={[st.token, { transform: [{ translateX: Animated.add(hx, -S) }, { translateY: Animated.add(hy, -S) }] }]}>
            <Svg width={S * 2} height={S * 2}>
              <Defs><ClipPath id="heroTok"><Circle cx={0} cy={0} r={S * 0.78} /></ClipPath></Defs>
              <G x={S} y={S}>
                <Circle r={S * 0.82} fill="#2a2010" />
                <SvgFaceImage img={hero.img} radius={S * 0.78} clipPath="url(#heroTok)" />
                <Ring img="aro_oro" r={S} />
              </G>
            </Svg>
          </Animated.View>
          {/* Árboles: se cruzan por debajo; van encima del grupo y se aclaran cuando el héroe está bajo ellos. */}
          <Svg width={box.w} height={box.h} style={StyleSheet.absoluteFill} pointerEvents="none">
            {zp.marks.map((m, i) => {
              const k = `${m.q},${m.r}`;
              if (m.kind !== 'prop' || !OVER_PROPS.has(m.id) || !vis.has(k)) return null;
              const [x, y] = center(m.q, m.r);
              const sz = S * 1.6;
              return <SvgImage key={i} href={IMG[PROP[m.id]]} x={X(x) - sz / 2} y={Y(y) - sz * 0.6} width={sz} height={sz} opacity={k === hkey(g.pos) ? 0.5 : 1} />;
            })}
          </Svg>
        </Animated.View>
      </View>

      <View style={[st.top, { paddingTop: ins.top + 6 }]}>
        {/* El nombre de la zona en su propia línea, entero. */}
        <Text style={st.zone}>{zoneById(g.zone).name}</Text>
        <View style={st.topRow}>
          {(() => {
            const p = zoneProgress(g);
            return (
              <Pressable onPress={() => setShowInfo(true)} accessibilityRole="button" accessibilityLabel="Información del mapa" style={st.prog} hitSlop={10}>
                <Icon path={mdiInformationOutline} size={18} />
                <Text style={st.progTxt}>{levelName(g.zone)} · Salas {p.seen}/{p.total}</Text>
                {p.key !== 'none' ? <Icon path={mdiKeyVariant} size={15} color={p.key === 'got' ? C.goldHi : '#6b6256'} /> : null}
              </Pressable>
            );
          })()}
          <View style={{ flex: 1 }} />
          <Text style={st.gold}>{g.gold} po</Text>
          <Pressable onPress={() => setShowOpts(true)} accessibilityRole="button" accessibilityLabel="Ajustes" style={st.logBtn} hitSlop={10}>
            <Icon path={mdiCogOutline} size={24} />
          </Pressable>
          <Pressable onPress={() => setShowLog(true)} accessibilityRole="button" accessibilityLabel="Registro de la partida" style={st.logBtn} hitSlop={10}>
            <Icon path={mdiScriptTextOutline} size={24} />
          </Pressable>
        </View>
        {/* Sala en la que está el grupo, en su propia línea (el autor 2026-11-06). */}
        {(() => { const r = zoneById(g.zone).rooms[rooms.get(hkey(g.pos)) ?? -1]; return r ? <Text style={st.room} numberOfLines={1}>{r.name}</Text> : null; })()}
      </View>
      {/* Avisos y botones apilados encima de las cartas, sin taparse entre sí. */}
      <View style={[st.stack, { bottom: ins.bottom + cardW * 1.5 + 20 }]} pointerEvents="box-none">
        {g.note && !head ? <Toast key={`${g.visited.length}:${g.pos}:${g.note}`} text={g.note} onReread={rereadAt(g, hkey(g.pos)).length ? reread : undefined} /> : null}
        {g.visited.length < 5 && !head && !g.note ? (
          <Text style={st.hint} pointerEvents="none">Toca una casilla para moverte (o la oscuridad para avanzar hacia allí). Pellizca para acercar o alejar el mapa. Mantén pulsada una carta para verla en grande.</Text>
        ) : null}
        {!head && !walking.length && (atTownRest(g) || here.length) ? (
          <View style={st.travel}>
            {here.length ? <Btn small label={`Recoger (${here.length})`} onPress={pickUp} /> : null}
            {atTownRest(g) ? <Btn small label={`Ir a ${townName}`} onPress={goTown} /> : null}
          </View>
        ) : null}
      </View>
      <View style={[st.party, { paddingBottom: ins.bottom + 8 }]}>
        {g.party.map(c => (
          <View key={c.id} style={{ marginHorizontal: 3 }}>
            <PartyCard info={charInfo(c)} id={c.id} width={cardW} dead={!!c.dead} onOpen={setSheet} />
            {hits[c.id] ? <HitNum key={hits[c.id].k} n={hits[c.id].n} /> : null}
          </View>
        ))}
      </View>

      {head?.kind === 'dialogue' ? <Dialogue key={`d${queue.length}:${JSON.stringify(head.lines[0])}`} lines={head.lines} hero={{ name: hero.name, img: hero.img }} onDone={next}
        met={g.met ?? []} onMeet={id => edit(gg => { if (!gg.met?.includes(id)) gg.met = [...(gg.met ?? []), id]; }, true)} /> : null}
      {head?.kind === 'scene' ? <Escena key={`s${head.id}:${queue.length}`} g={g} id={head.id} onChoose={sceneChoose} onLeave={sceneLeave} /> : null}
      {head?.kind === 'swap' ? (
        <Message key={`w${head.ally}`} title="El grupo está completo" lines={['Solo pueden ir cuatro. ¿Quién vuelve a la posada a esperaros?', 'Allí seguirá subiendo de nivel con el grupo.']} onDone={() => undefined}>
          {g.party.filter(c => !c.isHero && c.id !== head.ally).map(c => <Btn key={c.id} small label={c.name} sub={`Nivel ${c.level} · ${c.hp}/${c.maxHp} PG`} onPress={() => swapOut(c.id)} />)}
        </Message>
      ) : null}
      {/* Resultado de una escena: su ilustración de fondo, entera, en vez de una imagen pequeña recortada (el autor 2026-11-06). */}
      {head?.kind === 'msg' ? <Message key={`m${queue.length}:${head.title}:${head.lines[0]}`} {...head} {...(head.img?.startsWith('escena_') && !head.img2 ? { img: undefined, bg: head.img, low: true } : {})} onDone={next} /> : null}
      {head?.kind === 'trap' ? (
        <Message key={`t${head.id}`} title="¡Trampa!" img="trampa" lines={[`Estáis junto a la trampa: ${head.name}.`, 'Quien la desactive tira Destreza. Si falla, salta, pero con ventaja para esquivarla.']} onDone={() => undefined}>
          {g.party.filter(c => !isDown(c)).map(c => {
            const d = disarmBonus(c);
            return <Btn key={c.id} small label={`Desactiva ${c.name}`} sub={`Destreza ${d.bonus >= 0 ? '+' : ''}${d.bonus}${d.adv ? ' · con ventaja' : ''}`} onPress={() => trapChoice(c.id)} />;
          })}
          <Btn small label="Pasar con cuidado" sub="Salvación con ventaja" onPress={() => trapChoice('pass')} />
          <Btn small label="Volver atrás" onPress={() => trapChoice()} />
        </Message>
      ) : null}
      {head?.kind === 'rest' ? (
        <Message key={`r${head.id}`} title={head.name} img={restImg} lines={[head.text, head.long ? 'Descanso largo: recuperáis todos los PG y conjuros. Solo se puede usar una vez.' : 'Descanso corto: cada uno gasta dados de golpe para curarse. Solo se puede usar una vez.']}>
          {needsRest(g.party, head.long)
            ? <Btn primary label="Descansar" onPress={() => rest(true)} />
            : <Btn off label="Descansar" sub="No es necesario: estáis descansados" onPress={() => undefined} />}
          <Btn label="Ahora no" onPress={() => rest(false)} />
        </Message>
      ) : null}

      {!head && !walking.length ? <FeatPicker /> : null}
      {showOpts ? <Settings onClose={() => setShowOpts(false)} /> : null}
      {showInfo ? <MapInfo g={g} onClose={() => setShowInfo(false)} /> : null}
      {showLog ? <LogModal lines={g.log} onClose={() => setShowLog(false)} /> : null}

      {sheetChar ? (
        <CardModal
          char={sheetChar}
          info={charInfo(sheetChar)}
          party={g.party}
          onClose={() => setSheet(undefined)}
          town={townName}
          onDrop={uid => { drop(sheetChar.id, uid); setSheet(undefined); }}
          onUse={(uid, to) => edit(gg => { gg.note = useOutside(gg, sheetChar.id, uid, to); }, true)}
          onGive={(uid, to) => edit(gg => {
            const from = gg.party.find(c => c.id === sheetChar.id)!;
            const dest = gg.party.find(c => c.id === to)!;
            const it = from.items.find(i => i.uid === uid);
            if (it && dest.items.length < MAX_ITEMS) { from.items = from.items.filter(i => i.uid !== uid); dest.items.push(it); }
          }, false)}
        />
      ) : null}
    </View>
  );
}

/** Aviso breve que se va solo. */
function Toast({ text, onReread }: { text: string; onReread?: () => void }) {
  const [on, setOn] = useState(true);
  useEffect(() => { const t = setTimeout(() => setOn(false), onReread ? 6000 : 3200); return () => clearTimeout(t); }, [onReread]);
  if (!on) return null;
  return (
    <FadeIn style={st.toastWrap}>
      <Text style={st.toast} pointerEvents="none">{text}</Text>
      {onReread ? <Btn small label="Releer" onPress={onReread} /> : null}
    </FadeIn>
  );
}

const ORD = ['Primer', 'Segundo', 'Tercer', 'Cuarto', 'Quinto', 'Sexto'];
/** «Primer nivel», «Segundo nivel»…: lugar de la zona dentro de su aventura. */
const levelName = (zone: string) => `${ORD[ADVS[advOf(zone)].data.zones.findIndex(z => z.id === zone)] ?? ''} nivel`;

/** Estadísticas del mapa en una tabla sin bordes. */
function MapInfo({ g, onClose }: { g: ReturnType<typeof useStore.getState>['game'] & object; onClose: () => void }) {
  const p = zoneProgress(g);
  const s = g.stats?.[g.zone] ?? { kills: 0, xp: 0, gold: 0, chests: 0, traps: 0 };
  const rows: [string, string][] = [
    ['Aventura', ADVS[advOf(g.zone)].name],
    ['Nivel', levelName(g.zone)],
    ['Zona', zoneById(g.zone).name],
    ['Salas exploradas', `${p.seen} de ${p.total}`],
    ...(p.key !== 'none' ? [[KEY_ITEM(g.zone) === 'zone_key' ? 'Llave' : 'Amuleto', p.key === 'got' ? 'Encontrada' : 'Sin encontrar'] as [string, string]] : []),
    ['Enemigos vencidos', `${s.kills}`],
    ['Experiencia', `${s.xp} PX`],
    ['Oro conseguido', `${s.gold} po`],
    ['Cofres abiertos', `${s.chests}`],
    ['Trampas', `${s.traps}`],
  ];
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={st.logBg} onPress={onClose}>
        <View style={[st.logPanel, { flex: 0 }]}>
          <Text style={st.logTitle}>{zoneById(g.zone).name}</Text>
          {rows.map(([k, v]) => (
            <View key={k} style={st.infoRow}>
              <Text style={st.infoK}>{k}</Text>
              <Text style={st.infoV}>{v}</Text>
            </View>
          ))}
          <Btn label="Cerrar" onPress={onClose} style={{ marginTop: 10 }} />
        </View>
      </Pressable>
    </Modal>
  );
}

function chestHidden(g: ReturnType<typeof useStore.getState>['game'] & object, id: string) {
  return zoneById(g.zone).rooms.some(r => r.contents.some((c: any) => c.type === 'secret' && c.reveals === `chest:${id}` && !g.found.includes(c.id)));
}

const st = StyleSheet.create({
  logBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', padding: 16, paddingVertical: 50 },
  logPanel: { flex: 1, backgroundColor: C.panel, borderColor: C.gold, borderWidth: 1, borderRadius: 8, padding: 14 },
  logTitle: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 20, textAlign: 'center', marginBottom: 8 },
  hitNum: { position: 'absolute', top: '28%', alignSelf: 'center', fontFamily: F.titleBold, fontSize: 30, color: C.damage, textShadowColor: '#000', textShadowRadius: 6 },
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 14, paddingBottom: 8, backgroundColor: 'rgba(0,0,0,0.7)' },
  topRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  infoK: { fontFamily: F.text, color: C.textDim, fontSize: 16 },
  infoV: { fontFamily: F.textBold, color: C.text, fontSize: 16, flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  zone: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 15 },
  prog: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 },
  progTxt: { fontFamily: F.text, color: C.textDim, fontSize: 13 },
  room: { fontFamily: F.italic, color: C.text, fontSize: 13, marginTop: 1 },
  logBtn: { marginLeft: 14 },
  stack: { position: 'absolute', left: 12, right: 12, alignItems: 'center', gap: 6 },
  travel: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8 },
  token: { position: 'absolute', left: 0, top: 0, width: S * 2, height: S * 2 },
  toastWrap: { alignItems: 'center' },
  toast: { fontFamily: F.italic, color: C.text, fontSize: 16, backgroundColor: 'rgba(20,17,13,0.92)', borderColor: C.border, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, textAlign: 'center' },
  hint: { textAlign: 'center', fontFamily: F.italic, color: C.goldHi, fontSize: 15, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 6 },
  gold: { fontFamily: F.textBold, color: C.gold, fontSize: 16 },
  party: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', paddingTop: 8, backgroundColor: 'rgba(0,0,0,0.75)' },
});

/** Número rojo de daño que sube y se desvanece sobre una carta. */
function HitNum({ n }: { n: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(v, { toValue: 1, duration: 2200, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(); }, [v]);
  return (
    <Animated.Text pointerEvents="none" style={[st.hitNum, {
      opacity: v.interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 1, 0] }),
      transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -28] }) }, { scale: v.interpolate({ inputRange: [0, 0.12, 0.25, 1], outputRange: [0.6, 1.3, 1, 1] }) }],
    }]}>-{n}</Animated.Text>
  );
}

/** Aro de la ficha del mapa: oro (aliados), plata (PNJ), rojo (enemigos) o de jefe. */
function Ring({ img, r }: { img: ImgKey; r: number }) {
  return <SvgImage href={IMG[img]} x={-r} y={-r} width={r * 2} height={r * 2} />;
}

