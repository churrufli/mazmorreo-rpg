import { pace } from './ritmos';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, ViewStyle } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { IMG, ImgKey } from '../assets';
import { C, F } from '../theme';
import { Bg, Btn, Panel } from './kit';
import { FaceImage } from './FaceImage';
import { FACE } from '../data/caras';
import type { DialogueLine, ShownRoll } from '../engine/dungeon';
import type { Roll } from '../engine/combat';
import { speaker } from '../engine/aventuras';
import { dado } from '../sonido';
import { ITEMS } from '../data/srd';
import { useEscritorio } from './escritorio';
import { victoryLines } from './victoria';
import { FichaObjeto } from './FichaObjeto';
import { DUR, EASE, fxFull, fxOn } from './movimiento';

/** Retrato: recorte de la cara de la ilustración de la carta. */
export function Portrait({ img, size = 64 }: { img: ImgKey; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', borderWidth: 2, borderColor: C.gold, backgroundColor: '#000' }}>
      <FaceImage img={img} size={size - 4} />
    </View>
  );
}

/**
 * Medallón de peligro de «Enemigos a la vista» (el autor 2026-11-27): borde dorado envejecido, remaches de
 * hierro y un resplandor rojo. La ilustración (2:3) se ancla arriba, con la cara a un tercio del medallón.
 */
const MEDAL = 150;
function FoeMedal({ img }: { img: ImgKey }) {
  const h = MEDAL * 1.5;
  const faceY = FACE[img]?.[1] ?? 0.2;
  const top = -Math.max(0, Math.min(h - MEDAL, faceY * h - MEDAL * 0.36));
  const rivet = (pos: ViewStyle) => <View style={[st.rivet, pos]} />;
  return (
    <View style={st.medal}>
      <View style={st.medalIn}>
        <Image source={IMG[img]} resizeMode="cover" style={{ position: 'absolute', left: 0, top, width: MEDAL, height: h }} />
      </View>
      {rivet({ top: -2, left: MEDAL / 2 - 1 })}
      {rivet({ bottom: -2, left: MEDAL / 2 - 1 })}
      {rivet({ left: -2, top: MEDAL / 2 - 1 })}
      {rivet({ right: -2, top: MEDAL / 2 - 1 })}
    </View>
  );
}

/** Aparece con un fundido y un pequeño desplazamiento al montarse. */
export function FadeIn({ children, style, delay = 0, from = 10, duration = 320 }: { children: React.ReactNode; style?: ViewStyle; delay?: number; from?: number; duration?: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(v, { toValue: 1, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); }, [v, delay, duration]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [from, 0] });
  return <Animated.View style={[style, { opacity: v, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

/** Rodar: el dado cae botando y girando sobre la mesa (sin volteos 3D, que lo aplanaban como un papel). */
export const tumble = (spin: Animated.Value, turns = 1.5) => [
  { translateY: spin.interpolate({ inputRange: [0, 0.45, 0.65, 0.8, 0.9, 1], outputRange: [-60, 0, -16, 0, -4, 0] }) },
  { translateX: spin.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) },
  { rotate: spin.interpolate({ inputRange: [0, 1], outputRange: [`${-360 * turns}deg`, '0deg'] }) },
  { scaleY: spin.interpolate({ inputRange: [0, 0.4, 0.45, 0.5, 1], outputRange: [1, 1, 0.85, 1, 1] }) },
];

/** Colores de los dados: blanco mientras rueda o si no hay éxito ni fallo; verde si acierta, rojo si falla;
 *  dorado para el 20 natural y granate para el 1 natural (el autor 2026-11-02). */
export const DIE_WHITE = '#f4ede0';
export const NAT1 = '#9b1c31';
export function dieColor(d20: number, ok: boolean | undefined, rolling = false) {
  if (rolling || ok === undefined) return DIE_WHITE;
  return d20 === 20 ? C.goldHi : d20 === 1 ? NAT1 : ok ? '#5fbf72' : '#e0483a';
}

// Caras de un d20 visto de frente: la central (iluminada) y las de alrededor, cada vez más en sombra.
const D20_FACETS: [string, string][] = [
  ['50,3 93,27 50,24', '#4a3b2b'], ['50,3 50,24 7,27', '#5a4834'], ['93,27 76,66 50,24', '#3a2e22'],
  ['93,27 93,73 76,66', '#241c15'], ['93,73 50,97 76,66', '#1a140f'], ['50,97 24,66 76,66', '#2a2119'],
  ['50,97 7,73 24,66', '#1d1712'], ['7,73 7,27 24,66', '#3a2e22'], ['7,27 50,24 24,66', '#4a3b2b'],
];
const D6_FACES: [string, string][] = [['8,30 30,8 92,8 70,30', '#4a3b2b'], ['70,30 92,8 92,70 70,92', '#1d1712']];

/** Dados de daño (d4, d8, d10, d12) de frente: contorno, caras en sombra, la de delante iluminada y dónde va el número. */
const SHAPES: Record<number, { out: string; facets: [string, string][]; face: string; ty: number; fs: number }> = {
  4: { out: '50,4 96,88 4,88', facets: [['50,4 96,88 80,78 50,24', '#3a2e22'], ['50,4 50,24 20,78 4,88', '#4a3b2b'], ['4,88 20,78 80,78 96,88', '#1a140f']], face: '50,24 80,78 20,78', ty: 69, fs: 26 },
  8: { out: '50,3 92,50 50,97 8,50', facets: [['8,50 92,50 50,97', '#241c15']], face: '50,3 92,50 8,50', ty: 44, fs: 30 },
  10: { out: '50,3 95,42 50,97 5,42', facets: [['50,3 24,52 5,42', '#3a2e22'], ['50,3 95,42 76,52', '#241c15'], ['5,42 24,52 50,68 50,97', '#2a2119'], ['95,42 50,97 50,68 76,52', '#1a140f']], face: '50,3 76,52 50,68 24,52', ty: 54, fs: 28 },
  12: { out: '50,5 78,14 95,37 95,67 78,90 50,99 22,90 5,67 5,37 22,14', facets: [], face: '50,25 76,44 66,74 34,74 24,44', ty: 62, fs: 28 },
};

/** Dado con volumen: caras sombreadas, aristas en el color del resultado y brillo arriba a la izquierda. */
export function DieShape({ size, color, value, faces = 20, edge = 4, plain, ink }: { size: number; color: string; value: number | string; faces?: number; edge?: number; plain?: boolean; ink?: string }) {
  const d6 = faces === 6;
  const big = size >= 70; // en los dados pequeños el número se agranda para que se lea
  // Solo el contorno del dado con el número grande (iniciativa): se lee mejor en tamaño pequeño.
  if (plain) return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Polygon points="50,3 93,27 93,73 50,97 7,73 7,27" fill="#1a140f" stroke={color} strokeWidth={6} strokeLinejoin="round" />
      <SvgText x={50} y={68} fontSize={48} fontWeight="bold" fill={ink ?? DIE_WHITE} stroke="#000" strokeWidth={1.2} textAnchor="middle">{value}</SvgText>
    </Svg>
  );
  if (d6) return <Cube size={size} color={color} value={value} ink={ink} />;
  const sh = SHAPES[faces];
  if (sh) return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Polygon points={sh.out} fill="#1d1712" stroke={color} strokeWidth={edge} strokeLinejoin="round" />
      {sh.facets.map(([pts, fill], i) => <Polygon key={i} points={pts} fill={fill} stroke={color} strokeWidth={edge * 0.4} strokeLinejoin="round" />)}
      <Polygon points={sh.face} fill="#5e4b36" stroke={color} strokeWidth={edge * 0.6} strokeLinejoin="round" />
      <SvgText x={50} y={sh.ty} fontSize={sh.fs} fontWeight="bold" fill={ink ?? color} stroke="#000" strokeWidth={0.8} textAnchor="middle">{value}</SvgText>
    </Svg>
  );
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {(d6 ? D6_FACES : D20_FACETS).map(([pts, fill], i) => <Polygon key={i} points={pts} fill={fill} stroke={color} strokeWidth={edge * 0.4} strokeLinejoin="round" />)}
      <Polygon points={d6 ? '8,30 70,30 70,92 8,92' : '50,24 76,66 24,66'} fill={d6 ? '#2f251b' : '#5e4b36'} stroke={color} strokeWidth={edge * 0.6} strokeLinejoin="round" />
      <Polygon points={d6 ? '8,8 92,8 92,92 8,92' : '50,3 93,27 93,73 50,97 7,73 7,27'} fill="none" stroke={color} strokeWidth={edge} strokeLinejoin="round" opacity={d6 ? 0 : 1} />
      {d6 ? <Polygon points="8,30 30,8 92,8 92,70 70,92 8,92" fill="none" stroke={color} strokeWidth={edge} strokeLinejoin="round" /> : null}
      <Polygon points={d6 ? '12,34 30,34 12,52' : '50,8 62,16 50,20 38,16'} fill="#fff" opacity={0.18} />
      <SvgText x={d6 ? 39 : 50} y={d6 ? 74 : big ? 60 : 64} fontSize={d6 ? 40 : big ? 24 : 34} fontWeight="bold" fill={ink ?? color} stroke={ink === NAT1 ? '#f4ede0' : '#000'} strokeWidth={ink === NAT1 ? 1.4 : 0.8} textAnchor="middle">{value}</SvgText>
    </Svg>
  );
}

/** Dado de seis caras dibujado como un cubo: cara de arriba iluminada, lateral en sombra y el número grande delante. */
function Cube({ size, color, value, ink }: { size: number; color: string; value: number | string; ink?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Polygon points="10,30 32,10 92,10 70,30" fill="#7a6346" stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <Polygon points="70,30 92,10 92,70 70,92" fill="#241c15" stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <Polygon points="10,30 70,30 70,92 10,92" fill="#4a3b2b" stroke={color} strokeWidth={4} strokeLinejoin="round" />
      <Polygon points="14,34 34,34 14,50" fill="#fff" opacity={0.16} />
      <Circle cx={51} cy={20} r={4} fill="#efe2c2" opacity={0.8} />
      <Circle cx={78} cy={41} r={3.5} fill="#efe2c2" opacity={0.45} />
      <Circle cx={84} cy={62} r={3.5} fill="#efe2c2" opacity={0.45} />
      <SvgText x={40} y={76} fontSize={46} fontWeight="bold" fill={ink ?? DIE_WHITE} stroke="#000" strokeWidth={1.2} textAnchor="middle">{value}</SvgText>
    </Svg>
  );
}

/** Rodar sin girar el dibujo entero (el cubo mantiene su luz): bota, se balancea y se queda de frente. */
const roll6 = (v: Animated.Value) => [
  { translateY: v.interpolate({ inputRange: [0, 0.35, 0.55, 0.72, 0.86, 1], outputRange: [-34, 0, -12, 0, -3, 0] }) },
  { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-26, 0] }) },
  { rotate: v.interpolate({ inputRange: [0, 0.35, 0.55, 0.72, 0.86, 1], outputRange: ['-35deg', '18deg', '-10deg', '5deg', '-2deg', '0deg'] }) },
  { scale: v.interpolate({ inputRange: [0, 0.35, 0.4, 0.86, 0.93, 1], outputRange: [0.8, 1, 0.9, 1, 1.12, 1] }) },
];

/** Mientras el dado gira enseña caras al azar; al terminar, la de verdad. */
function useFlicker(value: number, faces: number, ms: number, key: unknown) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const iv = setInterval(() => setShown(1 + Math.floor(Math.random() * faces)), 70);
    const t = setTimeout(() => { clearInterval(iv); setShown(value); }, ms);
    return () => { clearInterval(iv); clearTimeout(t); };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return shown;
}

export function MiniDie({ value, delay = 0, size = 30, color = C.goldHi, faces = 20, plain }: { value: number; delay?: number; size?: number; color?: string; faces?: number; plain?: boolean }) {
  const spin = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState<number>(1 + Math.floor(Math.random() * faces));
  const ms = pace(faces === 6 ? 750 : 600);
  useEffect(() => {
    dado(delay);
    const iv = setInterval(() => setShown(1 + Math.floor(Math.random() * faces)), 70);
    const t = setTimeout(() => { clearInterval(iv); setShown(value); }, delay + ms);
    Animated.timing(spin, { toValue: 1, duration: ms, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    return () => { clearInterval(iv); clearTimeout(t); };
  }, [spin, value, delay, faces, ms]);
  return (
    <Animated.View style={{ transform: faces === 6 ? roll6(spin) : tumble(spin, 1) }}>
      <DieShape size={size} color={color} value={shown} faces={faces} edge={5} plain={plain} />
    </Animated.View>
  );
}

/** Dado pequeño que gira y deja ver una tirada contra una CD. */
function RollBadge({ r }: { r: ShownRoll }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => { dado(); Animated.timing(spin, { toValue: 1, duration: pace(550), easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); }, [spin]);
  const face = useFlicker(r.d20, 20, pace(550), r);
  const [rolling, setRolling] = useState(true);
  useEffect(() => { const t = setTimeout(() => setRolling(false), pace(550)); return () => clearTimeout(t); }, [r]);
  const col = dieColor(r.d20, r.ok, rolling);
  const txt = dieColor(r.d20, r.ok);
  const total = r.d20 + r.bonus;
  const tc = txt === NAT1 ? '#e0485e' : txt;
  const calc = `${r.d20} ${r.bonus >= 0 ? '+' : '−'} ${Math.abs(r.bonus)} = ${total} contra CD ${r.dc}`;
  const res = r.ok ? 'Éxito' : 'Fallo';
  const long = calc.length + res.length + 3 > 30;
  // Al pararse el dado: el éxito se ilumina en verde y el fallo da un respingo, sin retrasar el texto.
  const fb = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (rolling || !fxOn()) return;
    fb.setValue(0);
    Animated.timing(fb, { toValue: 1, duration: 420, easing: EASE.out, useNativeDriver: true }).start();
  }, [rolling]); // eslint-disable-line react-hooks/exhaustive-deps
  const jolt = !r.ok && fxFull() ? fb.interpolate({ inputRange: [0, 0.15, 0.3, 0.45, 0.6, 1], outputRange: [0, -5, 4, -2, 1, 0] }) : 0;
  return (
    <Animated.View style={[st.rollRow, { transform: [{ translateX: jolt }] }]}>
      {!rolling && fxOn() ? <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 6, borderWidth: 1.5, borderColor: r.ok ? '#7fcf8f' : '#e0483a', backgroundColor: r.ok ? 'rgba(95,191,114,0.14)' : 'rgba(224,72,58,0.12)', opacity: fb.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, r.ok ? 0.55 : 0.3] }) }]} /> : null}
      <Animated.View style={{ transform: tumble(spin) }}>
        <DieShape size={52} color={col} value={face} edge={4} ink={col} />
      </Animated.View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={st.rollTxt}>{r.text}</Text>
        {/* Si el resultado no cabe en una línea: letra algo menor, en dos líneas centradas. */}
        {long
          ? <Text style={[st.rollRes, st.rollResLong, { color: tc }]}>{calc}{'\n'}{res}</Text>
          : <Text style={[st.rollRes, { color: tc }]}>{calc} · {res}</Text>}
      </View>
    </Animated.View>
  );
}

export function Dialogue({ lines, hero, onDone, met, onMeet }: {
  lines: DialogueLine[]; hero: { name: string; img: ImgKey }; onDone: () => void;
  /** Quién ya ha hablado antes: la primera intervención de cada aliado, PNJ o jefe sale a pantalla completa. */
  met?: string[]; onMeet?: (id: string) => void;
}) {
  const [i, setI] = useState(0);
  const [n, setN] = useState(0);
  const esc = useEscritorio();
  const line = lines[i];
  const full = line?.text ?? '';
  // Lo conocido al abrir el diálogo: así la línea no cambia de formato al apuntarse.
  const known = useRef(new Set(met ?? [])).current;
  const sp = line ? (line.speaker === 'hero' ? hero : speaker(line.speaker)) : undefined;
  const first = !!met && !!line && line.speaker !== 'hero' && line.speaker !== 'narrator' && !!sp?.img && !known.has(line.speaker)
    && lines.findIndex(l => l.speaker === line.speaker) === i;
  useEffect(() => {
    setN(0);
    const t = setInterval(() => setN(x => (x >= full.length ? x : x + 1)), 22);
    return () => clearInterval(t);
  }, [i, full]);
  useEffect(() => { if (first) onMeet?.(line!.speaker); }, [first, i]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!line || !sp) return null;
  const tap = () => {
    if (n < full.length) setN(full.length);
    else if (i + 1 < lines.length) setI(i + 1);
    else onDone();
  };
  if (first) {
    // Primera vez: su ilustración a pantalla completa y el diálogo abajo, como en la introducción.
    return (
      <Pressable style={StyleSheet.absoluteFill} onPress={tap} accessibilityLabel="Continuar diálogo">
        <FadeIn key={i} from={0} duration={500} style={{ flex: 1 }}>
          <Bg src={IMG[sp.img!]} dim={0.1} wash>
            <View style={{ flex: 1, justifyContent: 'flex-end', padding: 12, paddingBottom: 28 }}>
              <Panel style={st.dlg}>
                <Text style={[st.speaker, { fontSize: 22 }]}>{sp.name}</Text>
                <Text style={st.dlgText}>{full.slice(0, n)}</Text>
                <Text style={st.hint}>{n < full.length ? 'Toca para acelerar' : i + 1 < lines.length ? 'Toca para seguir ▸' : 'Toca para continuar ▸'}</Text>
              </Panel>
            </View>
          </Bg>
        </FadeIn>
      </Pressable>
    );
  }
  return (
    <Pressable style={st.dlgWrap} onPress={tap} accessibilityLabel="Continuar diálogo">
      <FadeIn from={40} style={esc.on ? { alignSelf: 'center', width: esc.col } : { alignSelf: 'stretch' }}>
      <Panel style={st.dlg}>
        <View style={{ flexDirection: 'row' }}>
          {sp.img ? <Portrait img={sp.img} /> : null}
          <View style={{ flex: 1, marginLeft: sp.img ? 10 : 0 }}>
            {sp.name ? <Text style={st.speaker}>{sp.name}</Text> : null}
            <Text style={[st.dlgText, !sp.name && { fontFamily: F.italic }]}>{full.slice(0, n)}</Text>
          </View>
        </View>
        <Text style={st.hint}>{n < full.length ? 'Toca para acelerar' : i + 1 < lines.length ? 'Toca para seguir ▸' : 'Toca para continuar ▸'}</Text>
      </Panel>
      </FadeIn>
    </Pressable>
  );
}

export interface MessageProps {
  title: string; lines: string[]; table?: [string, string][]; intro?: string; img?: ImgKey; img2?: ImgKey; /** Objetos (id de ITEMS: al tocarlos se lee su descripción) o imágenes sueltas. */ items?: string[]; portrait?: ImgKey; rolls?: ShownRoll[];
  bg?: ImgKey; onDone?: () => void; children?: React.ReactNode;
  /** Victoria: título con un golpe de escala y las líneas apareciendo en cascada. */
  celebrate?: boolean;
  /** Enemigos a la vista: la imagen en un medallón de peligro, encuadrada arriba para que se vea la cara. */
  foe?: boolean;
  /** Con fondo: el cuadro abajo, para ver la ilustración entera (resultado de una escena). */
  low?: boolean;
  /** Milisegundos en los que solo se ve la ilustración de fondo antes del cuadro (tocar la pantalla lo adelanta). */
  hold?: number;
}

/** Tiempo que se deja ver una ilustración antes de su cartel (zona superada, introducciones, escenas). */
export const HOLD_MS = 2000;

/** Espera `ms` antes de enseñar algo; devuelve si ya se enseña y cómo adelantarlo. */
export function useHold(ms: number): [boolean, () => void] {
  const [on, setOn] = useState(!ms);
  useEffect(() => {
    if (!ms) return;
    const t = setTimeout(() => setOn(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return [on, () => setOn(true)];
}

/**
 * Ventana de aviso con entrada animada. Va mostrando por pasos: la imagen (el cofre se abre),
 * cada tirada con su dado y al final el texto y los botones. Tocarla enseña todo de golpe.
 */
export function Message({ title, lines, table, intro, img, img2, items, portrait, rolls = [], bg, low, onDone, children, celebrate, foe, hold = 0 }: MessageProps) {
  const pop = useRef(new Animated.Value(0)).current;
  const [shown, show] = useHold(hold);
  const { height } = useWindowDimensions();
  // Escritorio: avisos estrechos, no del ancho de la columna.
  const esc = useEscritorio();
  const steps = (img2 ? 1 : 0) + rolls.length + 1;
  // Sin pasos animados (victoria, avisos) el texto sale desde el principio, sin esperar a ningún temporizador.
  const [k, setK] = useState(steps === 1 ? 1 : 0);
  // Objeto tocado: se muestra su descripción bajo las imágenes.
  const [look, setLook] = useState<string>();
  useEffect(() => { if (shown) Animated.spring(pop, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }).start(); }, [pop, shown]);
  useEffect(() => {
    // Con dos imágenes (cofre cerrado y abierto), la primera se ve un segundo largo antes de abrirse.
    const t0 = img2 ? 1100 : 350;
    const ts = Array.from({ length: steps }, (_, i) => setTimeout(() => setK(x => Math.max(x, i + 1)), t0 + i * 850));
    return () => ts.forEach(clearTimeout);
  }, [steps, img2]);
  const opened = img2 && k >= 1;
  const rollsShown = rolls.slice(0, Math.max(0, k - (img2 ? 1 : 0)));
  const done = k >= steps;
  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  // Las líneas del final entran en cascada (muy rápida: el texto se puede leer enseguida).
  const step = fxOn() ? 70 : 0;
  const panel = (
    <Animated.View style={{ width: esc.on ? Math.min(480, esc.col * 0.88) : '88%', opacity: pop, transform: [{ scale }] }}>
      <Pressable onPress={() => setK(steps)} accessibilityLabel={title}>
        <Panel style={st.msgPanel}>
          {portrait ? <View style={{ alignSelf: 'center', marginBottom: 6 }}><Portrait img={portrait} size={84} /></View> : null}
          {img && foe ? <FoeMedal img={img} /> : img ? (
            <View style={st.msgImgBox}>
              {opened ? <FadeIn from={0}><Image source={IMG[img2!]} style={st.msgImg} /></FadeIn> : <Image source={IMG[img]} style={st.msgImg} />}
              {opened && fxFull() ? <Glints size={110} /> : null}
            </View>
          ) : null}
          {celebrate ? <TitlePunch><Text style={[st.msgTitle, st.winTitle]}>{title}</Text></TitlePunch> : <Text style={st.msgTitle}>{title}</Text>}
          <View style={st.rule} />
          {intro ? <Text style={[st.msgLine, { fontFamily: F.italic }]}>{intro}</Text> : null}
          {rollsShown.map((r, i) => <FadeIn key={i}><RollBadge r={r} /></FadeIn>)}
          {done ? (
            <View>
              {/* Textos largos (subida de nivel de todo el grupo): se desplazan y el botón queda siempre a la vista. */}
              <ScrollView style={{ maxHeight: height * (img || portrait ? 0.4 : 0.55) }}>
              {items?.length ? <View style={st.items}>{items.map((it, i) => ITEMS[it]
                ? <Pressable key={i} onPress={() => setLook(x => (x === it ? undefined : it))} accessibilityRole="button" accessibilityLabel={`Ver ${ITEMS[it].name}`}><PopIn delay={i * 90}><Image source={IMG[ITEMS[it].img]} style={[st.itemImg, look === it && st.itemSel]} /></PopIn></Pressable>
                : <PopIn key={i} delay={i * 90}><Image source={IMG[it as ImgKey]} style={st.itemImg} /></PopIn>)}</View> : null}
              {look && ITEMS[look] ? <View style={st.itemInfo}><FichaObjeto id={look} /></View> : null}
              {!look && items?.some(it => ITEMS[it]) ? <Text style={st.itemHint}>Toca un objeto para leer qué hace.</Text> : null}
              {table?.map(([k, v]) => (
                <View key={k} style={st.tRow}>
                  <Text style={st.tKey}>{k}</Text>
                  <Text style={st.tVal}>{v}</Text>
                </View>
              ))}
              {table?.length ? <View style={{ height: 8 }} /> : null}
              {victoryLines(lines).map((l, i) => (
                <FadeIn key={i} delay={i * step} from={6} duration={DUR.panel}>
                  {l.kind === 'level' ? <LevelUp text={l.title} hp={l.hp} />
                    : l.kind === 'feature' ? (
                      <View style={st.feat}>
                        {l.tag ? <Text style={st.featTag}>{l.tag.toUpperCase()}</Text> : null}
                        <Text style={st.featName}>{l.name}</Text>
                        {l.text ? <Text style={st.featTxt}>{l.text}</Text> : null}
                      </View>
                    )
                    : l.kind === 'summary' ? <Text style={st.summary}>{l.text}</Text>
                    : <Text style={[st.msgLine, /^Objetivo cumplido/.test(l.text) && st.goalOk, /^Objetivo fallado/.test(l.text) && st.goalKo]}>{l.text}</Text>}
                </FadeIn>
              ))}
              </ScrollView>
              {children ?? <Btn primary label="Continuar" onPress={onDone} />}
            </View>
          ) : null}
        </Panel>
      </Pressable>
    </Animated.View>
  );
  const wait = <Pressable style={StyleSheet.absoluteFill} onPress={show} accessibilityLabel="Continuar" />;
  if (bg) return <View style={StyleSheet.absoluteFill}><Bg src={IMG[bg]} dim={low ? 0.15 : 0.3} wash>{shown ? <View style={[st.center0, low && { justifyContent: 'flex-end', paddingBottom: 40 }]}>{panel}</View> : wait}</Bg></View>;
  if (!shown) return wait;
  return <View style={st.center}>{panel}</View>;
}

/** Aparece creciendo con un rebote corto (objetos ganados, recompensas). */
export function PopIn({ children, delay = 0, skip, from = 0.4 }: { children: React.ReactNode; delay?: number; skip?: boolean; from?: number }) {
  const v = useRef(new Animated.Value(skip || !fxOn() ? 1 : 0)).current;
  useEffect(() => {
    if (skip || !fxOn()) return;
    const a = Animated.sequence([Animated.delay(delay), Animated.spring(v, { toValue: 1, friction: 5, tension: 150, useNativeDriver: true })]);
    a.start();
    return () => a.stop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <Animated.View style={{ opacity: from < 0.6 ? v.interpolate({ inputRange: [0, 0.3], outputRange: [0, 1], extrapolate: 'clamp' }) : 1, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [from, 1] }) }] }}>{children}</Animated.View>;
}

/** Título de la victoria: entra un poco grande y se asienta. */
function TitlePunch({ children }: { children: React.ReactNode }) {
  const v = useRef(new Animated.Value(fxOn() ? 0 : 1)).current;
  useEffect(() => { if (fxOn()) Animated.timing(v, { toValue: 1, duration: 520, delay: 120, easing: EASE.settle, useNativeDriver: true }).start(); }, [v]);
  return <Animated.View style={{ opacity: v.interpolate({ inputRange: [0, 0.3], outputRange: [0, 1], extrapolate: 'clamp' }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1.5, 1] }) }] }}>{children}</Animated.View>;
}

/** Destellos dorados que saltan una vez alrededor de un objeto (cofre que se abre). */
function Glints({ size }: { size: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(v, { toValue: 1, duration: 700, easing: EASE.out, useNativeDriver: true }).start(); }, [v]);
  const c = size / 2;
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: size, height: size,
      opacity: v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.35] }) }] }}>
      <Svg width={size} height={size}>
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2, r0 = size * 0.32, r1 = size * (i % 2 ? 0.42 : 0.48);
          return <Line key={i} x1={c + Math.cos(a) * r0} y1={c + Math.sin(a) * r0} x2={c + Math.cos(a) * r1} y2={c + Math.sin(a) * r1} stroke={i % 3 ? '#ffe39a' : '#fff7dc'} strokeWidth={2} strokeLinecap="round" />;
        })}
      </Svg>
    </Animated.View>
  );
}

/** Subida de nivel: el recuadro dorado se enciende una vez, con un brillo que lo recorre. */
function LevelUp({ text, hp }: { text: string; hp?: string }) {
  const v = useRef(new Animated.Value(fxOn() ? 0 : 1)).current;
  const [w, setW] = useState(0);
  useEffect(() => { if (fxOn()) Animated.timing(v, { toValue: 1, duration: 900, delay: 200, easing: EASE.inOut, useNativeDriver: true }).start(); }, [v]);
  return (
    <View style={[st.levelUp, { overflow: 'hidden' }]} onLayout={e => setW(e.nativeEvent.layout.width)}>
      {w && fxFull() ? <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, width: 36, backgroundColor: 'rgba(255,240,200,0.35)',
        transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-40, w + 10] }) }, { skewX: '-20deg' }] }} /> : null}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#e0b56e', opacity: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.22, 0.06] }) }]} />
      <Text style={st.levelUpTxt}>{text}</Text>
      {hp ? <Text style={st.levelUpHp}>{hp}</Text> : null}
    </View>
  );
}

/** Qué pasa con la tirada, dicho de quien tira cuando no es el grupo: «Necrófago falla» (el autor 2026-11-13). */
const resultOf = (r: Roll) => r.save && r.who ? `${r.who} ${r.ok ? 'la supera' : 'falla'}`
  : r.who ? `${r.who} ${r.ok ? 'le encuentra' : 'no le encuentra'}`
  : r.enemy ? (r.ok ? 'Acierta' : 'Falla') : r.ok ? 'Éxito' : 'Fallo';

/** La cuenta de la tirada: «13 + 3 = 16», o solo el dado si no hay modificador. */
const calcOf = (r: Roll) => {
  const b = r.total - r.d20;
  return b ? `${r.d20} ${b > 0 ? '+' : '−'} ${Math.abs(b)} = ${r.total}` : `${r.total}`;
};

/** Dado de veinte caras animado para las tiradas importantes. */
/** Lo que tarda en irse de la pantalla una tirada (giro, pausa y fundido). */
export { revealMs } from './ritmos';
export const rollMs = (r: Roll) => pace((r.enemy ? 320 : 500) + (r.enemy ? 900 : 650) + (r.dice ? 700 : 0) + 250);

export function D20({ roll }: { roll?: Roll }) {
  const spin = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(roll);
  useEffect(() => {
    if (!roll) return;
    setShown(roll);
    if (roll.d20) { dado(); if (roll.adv) dado(60); }
    spin.setValue(0);
    fade.setValue(1);
    const hold = pace((roll.enemy ? 900 : 650) + (roll.dice ? 700 : 0));
    const spinMs = pace(roll.enemy ? 320 : 500);
    Animated.sequence([
      Animated.timing(spin, { toValue: 1, duration: spinMs, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.delay(hold),
      Animated.timing(fade, { toValue: 0, duration: pace(250), useNativeDriver: true }),
    ]).start();
    // En Android el fundido a veces no llega a aplicarse: se quita el dado igualmente al acabar.
    const t = setTimeout(() => setShown(undefined), spinMs + hold + pace(400));
    return () => clearTimeout(t);
  }, [roll?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const ms = pace(roll?.enemy ? 320 : 500);
  const face = useFlicker(roll?.d20 ?? 1, 20, ms, roll?.id);
  const [rolling, setRolling] = useState(true);
  useEffect(() => { setRolling(true); const t = setTimeout(() => setRolling(false), ms); return () => clearTimeout(t); }, [roll?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!shown) return null;
  const scale = spin.interpolate({ inputRange: [0, 0.45, 0.85, 0.93, 1], outputRange: [0.6, 1.1, 1, shown.d20 === 20 ? 1.18 : 1, 1] });
  const col = dieColor(shown.d20, shown.ok, rolling);
  const fin = dieColor(shown.d20, shown.ok);
  // Sin d20 (proyectil mágico, curaciones…): solo los dados de daño o curación.
  const only = shown.d20 === 0;
  return (
    <Animated.View pointerEvents="none" style={[st.d20, { opacity: fade }]}>
      {!only ? (
        <>
          {/* Con ventaja o desventaja se tiran dos d20: el que no cuenta sale apagado al lado. */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Animated.View style={{ transform: [...tumble(spin), { scale }] }}>
              <DieShape size={96} color={col} value={face} edge={3} ink={col} />
            </Animated.View>
            {shown.adv ? (
              <Animated.View style={{ opacity: rolling ? 1 : 0.35, transform: [...tumble(spin)] }}>
                <DieShape size={72} color={rolling ? col : '#8a7f70'} value={rolling ? face : shown.other ?? 1} edge={3} ink={rolling ? col : '#8a7f70'} />
              </Animated.View>
            ) : null}
          </View>
          {shown.adv ? <Text style={[st.d20Label, { color: shown.adv > 0 ? '#7fcf8f' : '#e8796b', marginTop: 2 }]}>{shown.adv > 0 ? 'Ventaja' : 'Desventaja'}</Text> : null}
          <Text style={st.d20Label}>{shown.label}</Text>
          <Text style={[st.d20Total, { color: fin === NAT1 ? '#e0485e' : fin }, !rolling && shown.d20 === 20 && st.critGlow]}>{shown.crit ? '¡CRÍTICO! ' : ''}{calcOf(shown)} · {resultOf(shown)}</Text>
        </>
      ) : null}
      {shown.dice ? (
        <View key={shown.id} style={st.diceRow}>
          {shown.dice.map((d, i) => <MiniDie key={i} value={d.v} faces={d.f} size={44} color={DIE_WHITE} delay={(only ? 0 : ms) + i * 90} />)}
        </View>
      ) : null}
    </Animated.View>
  );
}

const st = StyleSheet.create({
  dlgWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 12, paddingBottom: 28, backgroundColor: 'rgba(0,0,0,0.35)' },
  dlg: { minHeight: 140 },
  speaker: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 16, marginBottom: 2 },
  dlgText: { fontFamily: F.text, color: C.text, fontSize: 19, lineHeight: 25 },
  hint: { fontFamily: F.italic, color: C.textDim, fontSize: 13, textAlign: 'right', marginTop: 8 },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)', overflow: 'hidden' },
  center0: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  msgPanel: { borderColor: C.gold, borderWidth: 1.5, paddingTop: 16 },
  msgImgBox: { alignSelf: 'center', width: 110, height: 110, marginTop: -4 },
  msgImg: { width: 110, height: 110 },
  medal: { alignSelf: 'center', width: MEDAL + 16, height: MEDAL + 16, borderRadius: (MEDAL + 16) / 2, marginTop: -4, marginBottom: 8, padding: 5,
    backgroundColor: '#2a2119', borderWidth: 3, borderColor: C.gold, shadowColor: '#b5483a', shadowOpacity: 0.85, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 10 },
  medalIn: { width: MEDAL, height: MEDAL, borderRadius: MEDAL / 2, overflow: 'hidden', borderWidth: 2, borderColor: '#b5483a', backgroundColor: '#000' },
  rivet: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#4a4038', borderWidth: 2, borderColor: C.gold },
  msgTitle: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 22, textAlign: 'center', letterSpacing: 1 },
  rule: { height: 1, backgroundColor: C.gold, opacity: 0.6, marginHorizontal: 40, marginTop: 6, marginBottom: 10 },
  rollRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, backgroundColor: '#0006', borderRadius: 6, padding: 6 },
  rollTxt: { fontFamily: F.text, color: C.text, fontSize: 16 },
  rollRes: { fontFamily: F.textBold, fontSize: 16 },
  tRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  tKey: { fontFamily: F.text, color: C.textDim, fontSize: 17 },
  tVal: { fontFamily: F.textBold, color: C.text, fontSize: 17 },
  goalOk: { color: '#7fcf8f', fontFamily: F.textBold },
  goalKo: { color: C.textDim },
  rollResLong: { fontSize: 14, lineHeight: 18, textAlign: 'center' },
  levelUp: { marginVertical: 8, padding: 8, borderWidth: 1, borderColor: C.gold, borderRadius: 6, backgroundColor: '#e0b56e18' },
  levelUpTxt: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 19, textAlign: 'center' },
  // Los PG ganados van aparte, en una etiqueta: así no se parten entre dos líneas.
  levelUpHp: { alignSelf: 'center', marginTop: 4, paddingHorizontal: 8, paddingVertical: 1, borderRadius: 10, backgroundColor: '#7fcf8f22', color: '#9fe0ad', fontFamily: F.rulesBold, fontSize: 13 },
  // Novedades del personaje bajo su banda: etiqueta, nombre en dorado y descripción, con un filete a la izquierda.
  feat: { marginLeft: 6, marginBottom: 8, paddingLeft: 10, borderLeftWidth: 2, borderColor: C.gold },
  featTag: { fontFamily: F.rulesBold, color: C.textDim, fontSize: 11, letterSpacing: 1 },
  featName: { fontFamily: F.textBold, color: C.goldHi, fontSize: 17, lineHeight: 21 },
  featTxt: { fontFamily: F.rules, color: C.text, fontSize: 14, lineHeight: 20 },
  summary: { fontFamily: F.italic, color: C.textDim, fontSize: 16, lineHeight: 21, marginBottom: 4 },
  winTitle: { fontSize: 28, textShadowColor: '#e0b56e', textShadowRadius: 12 },
  items: { flexDirection: 'row', justifyContent: 'center', marginBottom: 6 },
  itemImg: { width: 56, height: 56, marginHorizontal: 6 },
  itemSel: { borderWidth: 1.5, borderColor: C.gold, borderRadius: 6 },
  itemInfo: { borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 8, marginBottom: 8, backgroundColor: 'rgba(0,0,0,0.35)' },
  itemHint: { fontFamily: F.italic, color: C.textDim, fontSize: 12, textAlign: 'center', marginBottom: 6 },
  msgLine: { fontFamily: F.text, color: C.text, fontSize: 17, lineHeight: 23, marginBottom: 6 },
  d20: { position: 'absolute', alignSelf: 'center', top: '36%', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 12 },
  d20Label: { fontFamily: F.text, color: C.text, fontSize: 15, marginTop: 4 },
  d20Total: { fontFamily: F.titleBold, fontSize: 18 },
  diceRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, marginTop: 6, maxWidth: 260 },
  critGlow: { textShadowColor: C.goldHi, textShadowRadius: 10 },
});

