// Ambientación del mapa de exploración: luz de antorchas y cristales, bruma, motas en el aire y agua.
// Todo es decorativo: no toca la niebla de guerra ni la lógica, no recoge toques y solo dibuja sobre casillas visibles.
// Rendimiento: cada capa es una vista pequeña que solo anima opacidad y desplazamiento (bucle.tsx: hilo nativo en
// Android, CSS en la web). No hay cálculos por fotograma en JavaScript salvo las pocas motas.
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, AppState, View } from 'react-native';
import Svg, { Defs, Ellipse, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { Mark } from '../engine/dungeon';
import { hdist } from '../engine/dungeon';
import type { FxMode } from './movimiento';
import { Deriva, Pulso, Vuelo, VueloProps } from './bucle';
import type { Ritmo } from './ritmos';

type Pt = { x: number; y: number };
type Mota = 'dust' | 'damp' | 'spore' | 'blight' | 'snow' | 'ice';
interface Bruma { color: string; a: number; every: number; drift: number; period: number }
interface Perfil { fog: Bruma; mota: Mota; n: number }

/** Fuentes de luz que ya existen en los mapas. Nada más se ilumina. */
const LUZ: Record<string, { color: string; rad: number; a: number; fire: boolean }> = {
  torch: { color: '#ffa94d', rad: 2.3, a: 0.3, fire: true },
  forge: { color: '#ff8f3a', rad: 2.6, a: 0.32, fire: true },
  crystal: { color: '#c7a2ff', rad: 1.8, a: 0.22, fire: false },
};
const AGUA: Record<string, { color: string; period: number; a: number }> = {
  water: { color: '#c9e2ef', period: 3600, a: 0.32 },
  swamp_water: { color: '#c3d6a4', period: 6200, a: 0.24 },
};
/** Superficies heladas que de vez en cuando devuelven un brillo. */
const HIELO = new Set(['ice_pillar', 'frozen_pool']);

const B = (color: string, a: number, every: number, drift = 0.8, period = 46000): Bruma => ({ color, a, every, drift, period });
/** Personalidad de cada zona: bruma, motas y cuántas como mucho a la vez. */
const PERFIL: Record<string, Perfil> = {
  // Hondaroca: polvo, humedad y bruma subterránea baja.
  z1: { fog: B('#b9a58a', 0.1, 14), mota: 'dust', n: 7 },
  z2: { fog: B('#b4ab9c', 0.09, 16), mota: 'dust', n: 6 },
  z3: { fog: B('#a9b8c4', 0.12, 12), mota: 'damp', n: 6 },
  z4: { fog: B('#9fc0c8', 0.13, 10), mota: 'damp', n: 6 },
  // El Corazón Hueco: niebla de bosque, esporas y, en el claro maldito, motas violáceas.
  b1: { fog: B('#c8d4c0', 0.12, 10), mota: 'spore', n: 6 },
  b2: { fog: B('#b8c8b4', 0.15, 8), mota: 'spore', n: 7 },
  b3: { fog: B('#b5c4a6', 0.19, 6, 1, 58000), mota: 'spore', n: 5 },
  b4: { fog: B('#b7a8c4', 0.15, 8), mota: 'blight', n: 6 },
  // El Invierno del Dragón: ventisca en el paso, nieve ligera entre los pinos y aire helado bajo techo.
  m1: { fog: B('#e8f0f8', 0.14, 9, 2.2, 19000), mota: 'snow', n: 14 },
  m2: { fog: B('#dfe8f0', 0.13, 9, 1.2, 32000), mota: 'snow', n: 9 },
  m3: { fog: B('#cfdbe6', 0.1, 14), mota: 'ice', n: 5 },
  m4: { fog: B('#cfe6f2', 0.14, 9, 1, 38000), mota: 'ice', n: 6 },
};
const MOTA: Record<Mota, { color: string; peak: number; size: [number, number]; dur: [number, number] }> = {
  dust: { color: '#eadcbc', peak: 0.45, size: [1.4, 2.4], dur: [9000, 14000] },
  damp: { color: '#bcd6e2', peak: 0.35, size: [1.2, 2], dur: [8000, 12000] },
  spore: { color: '#dbe8a4', peak: 0.5, size: [1.6, 2.6], dur: [10000, 15000] },
  blight: { color: '#cbb0ec', peak: 0.45, size: [1.6, 2.6], dur: [10000, 15000] },
  snow: { color: '#ffffff', peak: 0.85, size: [1.8, 3], dur: [6000, 9000] },
  ice: { color: '#e6f4ff', peak: 0.5, size: [1.2, 2], dur: [9000, 13000] },
};
/** Tono del borde de la pantalla por aventura: da profundidad sin teñir el centro. */
const VINETA: Record<string, string> = { z: '#140b04', b: '#06140b', m: '#0a1424' };

export const perfilDe = (zone: string): Perfil | undefined => PERFIL[zone];

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
/** Reparto fijo y sin patrón visible: el mismo para cada casilla en cada visita. */
const hash = (q: number, r: number) => { const h = Math.sin(q * 127.1 + r * 311.7) * 43758.5453; return h - Math.floor(h); };

/** ¿Debe moverse algo ahora? Se para con la app en segundo plano o con una ventana encima del mapa. */
export function useAmbientActive(base: boolean) {
  const [fg, setFg] = useState(AppState.currentState !== 'background');
  useEffect(() => {
    const s = AppState.addEventListener('change', a => setFg(a === 'active'));
    return () => s.remove();
  }, []);
  return base && fg;
}

export interface AmbienteProps {
  zone: string; marks: Mark[]; visKey: string; vis: Set<string>; floor: (k: string) => boolean;
  toXY: (q: number, r: number) => [number, number]; S: number; mode: FxMode; active: boolean;
}

/** Fuentes de luz, agua y hielo visibles, y unas pocas casillas para la bruma. Solo cambia al descubrir casillas. */
function useEscena({ zone, marks, vis, floor, toXY }: AmbienteProps, cells: [number, number][]) {
  return useMemo(() => {
    const seen = marks.filter(m => m.kind === 'prop' && vis.has(`${m.q},${m.r}`) && floor(`${m.q},${m.r}`));
    const lights = seen.filter(m => LUZ[m.id]).map(m => { const [x, y] = toXY(m.q, m.r); return { x, y, q: m.q, r: m.r, ...LUZ[m.id] }; });
    const waters = seen.filter(m => AGUA[m.id] && !marks.some(o => (o.id === 'bridge' || o.id === 'walkway') && o.q === m.q && o.r === m.r)).map(m => {
      const [x, y] = toXY(m.q, m.r);
      // Reflejo de una luz cercana sobre el agua.
      const near = lights.find(l => hdist([l.q, l.r], [m.q, m.r]) <= 2);
      return { x, y, k: `${m.q},${m.r}`, ...AGUA[m.id], color: near ? near.color : AGUA[m.id].color };
    });
    const ice = seen.filter(m => HIELO.has(m.id) && hash(m.q, m.r) < 0.45).slice(0, 8).map(m => { const [x, y] = toXY(m.q, m.r); return { x, y, k: `${m.q},${m.r}`, h: hash(m.r, m.q) }; });
    const p = PERFIL[zone];
    const open = cells.filter(([q, r]) => vis.has(`${q},${r}`) && floor(`${q},${r}`));
    const fog = p ? open.filter(([q, r]) => hash(q, r) < 1 / p.fog.every).slice(0, 12).map(([q, r]) => { const [x, y] = toXY(q, r); return { x, y, k: `${q},${r}`, h: hash(r, q) }; }) : [];
    const spots = open.map(([q, r]) => { const [x, y] = toXY(q, r); return { x, y }; });
    return { lights, waters, ice, fog, spots };
  }, [zone, vis]); // eslint-disable-line react-hooks/exhaustive-deps
}

const FILL = { position: 'absolute' as const, left: 0, top: 0, right: 0, bottom: 0 };
const abs = (x: number, y: number, w: number, h: number) => ({ position: 'absolute' as const, left: x - w / 2, top: y - h / 2, width: w, height: h });

/** Halo radial suave: una vista pequeña por fuente, nunca un lienzo del tamaño del mapa. */
function Halo({ color, a, size, id }: { color: string; a: number; size: number; id: string }) {
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={a} />
          <Stop offset="0.45" stopColor={color} stopOpacity={a * 0.42} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={size / 2} cy={size / 2} rx={size / 2} ry={size / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

/**
 * Capa bajo los objetos y las fichas: luz cálida de antorchas y forjas, luz fría de los cristales,
 * la luz que lleva el grupo y la bruma a ras de suelo. Los objetos y enemigos quedan siempre nítidos encima.
 */
export const AmbienteSuelo = memo(function AmbienteSuelo(props: AmbienteProps & { cells: [number, number][]; heroLight?: 'fire' | 'magic'; hx: Animated.Value; hy: Animated.Value }) {
  const { zone, mode, active, S, heroLight, hx, hy } = props;
  const sc = useEscena(props, props.cells);
  if (mode === 'off') return null;
  // Solo con efectos completos se mueve algo; con reducidos, las luces y la bruma se quedan quietas.
  const on = mode === 'full' && active;
  const p = PERFIL[zone];
  const drift = (p?.fog.drift ?? 0.8) * S;
  const FL: Ritmo[] = ['flame0', 'flame1', 'flame2'];
  return (
    <View pointerEvents="none" style={FILL}>
      {sc.lights.map((l, i) => {
        const size = S * 2 * l.rad;
        return (
          <Pulso key={`l${l.q},${l.r}`} on={on} k={l.fire ? FL[(i + Math.floor(hash(l.q, l.r) * 3)) % 3] : 'glow'} style={abs(l.x, l.y, size, size)}>
            <Halo color={l.color} a={l.a} size={size} id={`amb_l_${l.color.slice(1)}`} />
          </Pulso>
        );
      })}
      {heroLight ? (
        <Animated.View style={[abs(0, 0, S * 4.4, S * 4.4), { transform: [{ translateX: hx }, { translateY: hy }] }]}>
          <Pulso k="flame1" on={on && heroLight === 'fire'}>
            <Halo color={heroLight === 'fire' ? '#ffb35c' : '#fff0cf'} a={heroLight === 'fire' ? 0.17 : 0.12} size={S * 4.4} id={`amb_h_${heroLight}`} />
          </Pulso>
        </Animated.View>
      ) : null}
      {p ? sc.fog.map(b => {
        const w = S * (5 + b.h * 2.5), h = S * (2.2 + b.h);
        // Dos sentidos de deriva y tres periodos de vaivén: el conjunto no se repite de forma evidente.
        return (
          <Deriva key={`f${b.k}`} on={on} period={p.fog.period} amp={drift} ampY={drift * 0.35} sign={b.h < 0.5 ? 1 : -1} style={{ position: 'absolute', left: b.x, top: b.y, width: 0, height: 0 }}>
            <Svg width={w} height={h} style={{ position: 'absolute', left: -w / 2, top: -h / 2 }}>
              <Defs>
                <RadialGradient id={`amb_f_${zone}`} cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor={p.fog.color} stopOpacity={p.fog.a} />
                  <Stop offset="0.6" stopColor={p.fog.color} stopOpacity={p.fog.a * 0.45} />
                  <Stop offset="1" stopColor={p.fog.color} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} fill={`url(#amb_f_${zone})`} />
            </Svg>
          </Deriva>
        );
      }) : null}
    </View>
  );
}, (a, b) => a.visKey === b.visKey && a.mode === b.mode && a.active === b.active && a.heroLight === b.heroLight && a.zone === b.zone);

/** Capa sobre el agua y el hielo, solo con efectos completos: ondas que van y vienen y algún brillo suelto. */
export const AmbienteAgua = memo(function AmbienteAgua(props: AmbienteProps & { cells: [number, number][] }) {
  const { mode, active, S } = props;
  const sc = useEscena(props, props.cells);
  if (mode !== 'full') return null;
  const slow = sc.waters.some(w => w.period > 5000);
  const wave = (y: number, x0: number, x1: number) => `M${x0},${y} Q${(x0 + x1) / 2},${y - 2.5} ${x1},${y}`;
  const GL: Ritmo[] = ['glint0', 'glint1', 'glint2'];
  return (
    <View pointerEvents="none" style={FILL}>
      {sc.waters.map(w => {
        const ripples = (alt: boolean) => (
          <Svg width={S * 2} height={S * 2}>
            {(alt ? [[0.72, 0.3, 0.8], [1.18, 0.75, 1.5], [1.45, 0.4, 0.9]] : [[0.85, 0.7, 1.35], [1.05, 0.25, 0.7], [1.38, 0.95, 1.6]]).map(([y, a, b], i) => (
              <Path key={i} d={wave(S * y, S * a, S * b)} stroke={w.color} strokeOpacity={w.a} strokeWidth={1.1} strokeLinecap="round" fill="none" />
            ))}
          </Svg>
        );
        return (
          <React.Fragment key={`w${w.k}`}>
            <Pulso k={slow ? 'slowA' : 'waveA'} on={active} style={abs(w.x, w.y, S * 2, S * 2)}>{ripples(false)}</Pulso>
            <Pulso k={slow ? 'slowB' : 'waveB'} on={active} style={abs(w.x, w.y, S * 2, S * 2)}>{ripples(true)}</Pulso>
          </React.Fragment>
        );
      })}
      {sc.ice.map((c, i) => {
        const s = S * 0.55;
        const ox = (c.h - 0.5) * S * 0.7, oy = -S * 0.25 - c.h * S * 0.3;
        return (
          <Pulso key={`i${c.k}`} k={GL[i % 3]} on={active} style={abs(c.x + ox, c.y + oy, s, s)}>
            <Svg width={s} height={s}>
              <Path d={`M${s / 2},0 L${s * 0.56},${s * 0.44} L${s},${s / 2} L${s * 0.56},${s * 0.56} L${s / 2},${s} L${s * 0.44},${s * 0.56} L0,${s / 2} L${s * 0.44},${s * 0.44} Z`} fill="#f4fbff" />
            </Svg>
          </Pulso>
        );
      })}
    </View>
  );
}, (a, b) => a.visKey === b.visKey && a.mode === b.mode && a.active === b.active && a.zone === b.zone);

/** Una mota: aparece, deriva unos segundos y se apaga; luego vuelve a nacer en otra casilla visible cerca del grupo. */
function Particula({ kind, pick, active, first }: { kind: Mota | 'ember'; pick: (kind: Mota | 'ember') => (Pt & { s: number }) | undefined; active: boolean; first: number }) {
  const [p, setP] = useState<VueloProps & { n: number }>();
  useEffect(() => {
    if (!active) { setP(undefined); return; }
    let timer: ReturnType<typeof setTimeout>;
    const spawn = () => {
      const at = pick(kind);
      if (!at) { timer = setTimeout(spawn, 2500); return; }
      const s = at.s;
      const e = kind === 'ember';
      const m = e ? undefined : MOTA[kind];
      const d = Math.round(e ? rnd(2400, 3800) : rnd(m!.dur[0], m!.dur[1]));
      const rise = kind === 'snow' ? rnd(2.6, 3.8) * s : kind === 'damp' ? rnd(0.5, 0.9) * s : -(e ? rnd(1.6, 2.4) : rnd(0.5, 1.2)) * s;
      const size = e ? rnd(1.4, 2.1) : rnd(m!.size[0], m!.size[1]);
      setP(old => {
        const n = (old?.n ?? 0) + 1;
        const color = e ? (n % 2 ? '#ffc061' : '#ff8a3d') : m!.color;
        return { n, x: at.x, y: at.y, d, rise, size, color, peak: e ? 0.8 : m!.peak, sway: rnd(0.25, e ? 0.35 : 0.8) * s * (Math.random() < 0.5 ? -1 : 1), dx: kind === 'snow' ? rnd(1, 1.8) * s : 0 };
      });
      // La siguiente vida empieza tras una pausa: nunca hay muchas motas a la vez.
      timer = setTimeout(spawn, d + (e ? rnd(1500, 5000) : rnd(400, 2600)));
    };
    timer = setTimeout(spawn, first);
    return () => clearTimeout(timer);
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
  return p && active ? <Vuelo key={p.n} {...p} /> : null;
}

/**
 * Motas en el aire sobre el mapa, solo con efectos completos: polvo, humedad, esporas, nieve y brasas.
 * Nacen en casillas visibles cerca del grupo y son pocas a la vez.
 */
export const AmbienteAire = memo(function AmbienteAire(props: AmbienteProps & { cells: [number, number][]; focus: { current: Pt }; reach: () => Pt }) {
  const { zone, mode, active, S, focus, reach } = props;
  const sc = useEscena(props, props.cells);
  const live = useRef(sc);
  live.current = sc;
  const pick = useRef((kind: Mota | 'ember') => {
    const f = focus.current, r = reach();
    const near = (q: Pt) => Math.abs(q.x - f.x) < r.x && Math.abs(q.y - f.y) < r.y;
    if (kind === 'ember') {
      const fires = live.current.lights.filter(l => l.fire && near(l));
      const l = fires[Math.floor(Math.random() * fires.length)];
      return l ? { x: l.x + rnd(-0.2, 0.2) * S, y: l.y - S * 0.45, s: S } : undefined;
    }
    const spots = live.current.spots.filter(near);
    const c = spots[Math.floor(Math.random() * spots.length)];
    if (!c) return undefined;
    // La nieve nace algo más arriba para caer sobre la casilla.
    return { x: c.x + rnd(-0.8, 0.8) * S, y: c.y + rnd(-0.7, 0.7) * S - (kind === 'snow' ? S * 1.6 : 0), s: S };
  }).current;
  const p = PERFIL[zone];
  if (mode !== 'full' || !p) return null;
  const embers = sc.lights.some(l => l.fire) ? 3 : 0;
  return (
    <View pointerEvents="none" style={FILL}>
      {Array.from({ length: p.n }, (_, i) => <Particula key={`${zone}m${i}`} kind={p.mota} pick={pick} active={active} first={300 + i * 900} />)}
      {Array.from({ length: embers }, (_, i) => <Particula key={`${zone}e${i}`} kind="ember" pick={pick} active={active} first={600 + i * 1300} />)}
    </View>
  );
}, (a, b) => a.visKey === b.visKey && a.mode === b.mode && a.active === b.active && a.zone === b.zone);

/** Borde de la vista oscurecido con el tono de la aventura. Estático y fuera de la cámara. */
export const Vineta = memo(function Vineta({ zone, w, h, mode }: { zone: string; w: number; h: number; mode: FxMode }) {
  if (mode === 'off' || !w || !h) return null;
  const c = VINETA[zone[0]] ?? '#000';
  return (
    <Svg width={w} height={h} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0 }}>
      <Defs>
        <RadialGradient id={`amb_v_${zone[0]}`} cx="50%" cy="45%" r="72%">
          <Stop offset="0.55" stopColor={c} stopOpacity={0} />
          <Stop offset="1" stopColor={c} stopOpacity={0.42} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={w} height={h} fill={`url(#amb_v_${zone[0]})`} />
    </Svg>
  );
});
