// Dibujo de un elemento dinámico en el mapa (roca, verja, palanca, barrera...).
// Si existe la imagen definitiva de su estado (clave din_<tipo>_<estado> en IMG), se usa; si no, un marcador
// provisional de formas sencillas con el color del tipo. Al cambiar de estado, el anterior se funde con el nuevo.
import React, { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { Circle, Ellipse, G, Image as SvgImage, Line, Polygon, Rect } from 'react-native-svg';
import { IMG } from '../assets';
import { ELEM_TYPES, artKey } from '../engine/elementos';
import { fxOn } from './movimiento';

const AnimatedG = Animated.createAnimatedComponent(G);

/** Imagen definitiva de un estado, si ya se ha incorporado al proyecto (fase 2). */
export const elemArt = (type: string, state: string): any => (IMG as Record<string, any>)[artKey(type, state)];

/** Marcador provisional: forma del tipo y aspecto del estado. Centrado en (0,0) y del tamaño de una casilla de radio s. */
export function Provisional({ type, state, s }: { type: string; state: string; s: number }) {
  const t = ELEM_TYPES[type];
  const look = t.states[state]?.look ?? 'solid';
  const c = t.color;
  const ink = '#1a120a';
  const u = s / 10;
  switch (t.shape) {
    case 'rock':
      if (look === 'solid') return <G><Polygon points={`${-7 * u},${3 * u} ${-5 * u},${-4 * u} ${0},${-7 * u} ${6 * u},${-3 * u} ${7 * u},${4 * u} ${1 * u},${7 * u}`} fill={c} stroke={ink} strokeWidth={1.5} /><Line x1={-2 * u} y1={-3 * u} x2={2 * u} y2={2 * u} stroke={ink} strokeWidth={1} /></G>;
      // Restos en el suelo (o camino ya despejado): unas piedras pequeñas y apagadas.
      return <G opacity={0.75}><Circle cx={-4 * u} cy={3 * u} r={1.6 * u} fill={c} stroke={ink} /><Circle cx={3 * u} cy={4 * u} r={1.2 * u} fill={c} stroke={ink} /><Circle cx={4 * u} cy={-3 * u} r={1 * u} fill={c} stroke={ink} /></G>;
    case 'door':
      if (look === 'open') return <G><Rect x={-5 * u} y={-7 * u} width={10 * u} height={14 * u} fill="none" stroke={c} strokeWidth={2.5} /><Rect x={-5 * u} y={-7 * u} width={2.5 * u} height={14 * u} fill={c} stroke={ink} /></G>;
      return <G><Rect x={-5 * u} y={-7 * u} width={10 * u} height={14 * u} fill={c} stroke={ink} strokeWidth={1.5} /><Line x1={0} y1={-7 * u} x2={0} y2={7 * u} stroke={ink} strokeWidth={1} />
        {/* Bloqueada: cerrojo dorado. Desbloqueada o cerrada sin cerrojo: pomo claro. */}
        {look === 'solid' ? <Rect x={1 * u} y={-1.5 * u} width={3 * u} height={3 * u} fill="#d8b24a" stroke={ink} /> : <Circle cx={2.5 * u} cy={0} r={1 * u} fill="#e8dcc0" />}</G>;
    case 'bars': {
      const xs = [-5, -2.5, 0, 2.5, 5].map(x => x * u);
      if (look === 'open') return <G><Line x1={-6 * u} y1={-7 * u} x2={6 * u} y2={-7 * u} stroke={c} strokeWidth={2.5} />{xs.map(x => <Line key={x} x1={x} y1={-7 * u} x2={x} y2={-4.5 * u} stroke={c} strokeWidth={2} />)}</G>;
      return <G><Line x1={-6 * u} y1={-7 * u} x2={6 * u} y2={-7 * u} stroke={ink} strokeWidth={3} />{xs.map(x => <Line key={x} x1={x} y1={-7 * u} x2={x} y2={7 * u} stroke={c} strokeWidth={2.2} />)}<Line x1={-6 * u} y1={2 * u} x2={6 * u} y2={2 * u} stroke={c} strokeWidth={1.5} /></G>;
    }
    case 'bridge': {
      const planks = [-6, -3, 0, 3, 6];
      return <G opacity={look === 'off' ? 0.45 : 1}>{planks.map((y, i) => (look === 'broken' && (i === 2 || i === 3) ? null
        : <Rect key={y} x={-7 * u} y={(y - 1.2) * u} width={14 * u} height={2.4 * u} fill={c} stroke={ink} strokeWidth={1} />))}
        {look === 'solid' ? <G><Line x1={-7 * u} y1={-7 * u} x2={-7 * u} y2={7 * u} stroke={ink} strokeWidth={1.5} /><Line x1={7 * u} y1={-7 * u} x2={7 * u} y2={7 * u} stroke={ink} strokeWidth={1.5} /></G> : null}</G>;
    }
    case 'lever': {
      const on = look === 'on';
      return <G><Rect x={-5 * u} y={3 * u} width={10 * u} height={3.5 * u} rx={u} fill="#5a4a36" stroke={ink} />
        <Line x1={0} y1={4 * u} x2={(on ? 5 : -5) * u} y2={-5 * u} stroke={ink} strokeWidth={3.2} /><Line x1={0} y1={4 * u} x2={(on ? 5 : -5) * u} y2={-5 * u} stroke={c} strokeWidth={2} />
        <Circle cx={(on ? 5 : -5) * u} cy={-5 * u} r={1.8 * u} fill={on ? c : '#7a7a7a'} stroke={ink} /></G>;
    }
    case 'crate':
      if (look === 'solid') return <G><Rect x={-6 * u} y={-6 * u} width={12 * u} height={12 * u} fill={c} stroke={ink} strokeWidth={1.5} /><Line x1={-6 * u} y1={-6 * u} x2={6 * u} y2={6 * u} stroke={ink} /><Line x1={6 * u} y1={-6 * u} x2={-6 * u} y2={6 * u} stroke={ink} /></G>;
      return <G opacity={0.75}><Rect x={-6 * u} y={2 * u} width={5 * u} height={2 * u} fill={c} stroke={ink} transform="rotate(-20)" /><Rect x={1 * u} y={3 * u} width={5 * u} height={2 * u} fill={c} stroke={ink} transform="rotate(15)" /><Rect x={-1 * u} y={-4 * u} width={4 * u} height={2 * u} fill={c} stroke={ink} /></G>;
    case 'wall':
      if (look === 'solid') return <G><Rect x={-7 * u} y={-6 * u} width={14 * u} height={12 * u} fill={c} stroke={ink} strokeWidth={1.5} /><Line x1={-7 * u} y1={0} x2={7 * u} y2={0} stroke={ink} /><Line x1={0} y1={-6 * u} x2={0} y2={0} stroke={ink} /><Line x1={-3 * u} y1={0} x2={-3 * u} y2={6 * u} stroke={ink} /><Line x1={-1 * u} y1={-5 * u} x2={2 * u} y2={4 * u} stroke="#2b2622" strokeWidth={1.5} /></G>;
      return <G opacity={0.75}><Rect x={-6 * u} y={3 * u} width={4 * u} height={2.5 * u} fill={c} stroke={ink} /><Rect x={2 * u} y={2 * u} width={4 * u} height={2.5 * u} fill={c} stroke={ink} /></G>;
    case 'magic':
      if (look === 'on') return <G><Circle r={7.5 * u} fill={c} opacity={0.35} /><Circle r={6 * u} fill="none" stroke={c} strokeWidth={2.5} /><Polygon points={`0,${-4 * u} ${3.5 * u},${2 * u} ${-3.5 * u},${2 * u}`} fill="none" stroke={c} strokeWidth={1.5} /></G>;
      if (look === 'broken') return <G opacity={0.7}><Line x1={-5 * u} y1={-2 * u} x2={-1 * u} y2={1 * u} stroke={c} strokeWidth={2} /><Line x1={1 * u} y1={-1 * u} x2={5 * u} y2={3 * u} stroke={c} strokeWidth={2} /></G>;
      return <Circle r={6 * u} fill="none" stroke={c} strokeWidth={1} strokeDasharray={`${u},${u}`} opacity={0.5} />;
    case 'portal':
      return <G><Ellipse rx={6 * u} ry={7.5 * u} fill={look === 'on' ? c : 'none'} opacity={look === 'on' ? 0.55 : 1} /><Ellipse rx={6 * u} ry={7.5 * u} fill="none" stroke={look === 'on' ? c : '#777'} strokeWidth={2.5} /></G>;
    case 'water':
      if (look === 'solid') return <G><Circle r={8 * u} fill={c} opacity={0.85} /><Line x1={-5 * u} y1={-1 * u} x2={-1 * u} y2={-1 * u} stroke="#cfe3f2" strokeWidth={1.2} /><Line x1={1 * u} y1={2 * u} x2={5 * u} y2={2 * u} stroke="#cfe3f2" strokeWidth={1.2} /></G>;
      return <Circle r={8 * u} fill="none" stroke={c} strokeWidth={1} strokeDasharray={`${u},${u}`} opacity={0.5} />;
  }
}

function Look({ type, state, s }: { type: string; state: string; s: number }) {
  const art = elemArt(type, state);
  // Imagen definitiva: mismo encuadre que los decorados (cuadrado de 1,6 casillas centrado en la casilla).
  if (art) return <SvgImage href={art} x={-s * 0.8} y={-s * 0.8} width={s * 1.6} height={s * 1.6} />;
  return <Provisional type={type} state={state} s={s} />;
}

/** Elemento en su casilla (x, y): funde el estado anterior con el nuevo al cambiar, salvo con los efectos desactivados. */
export function ElementoMapa({ type, state, x, y, s }: { type: string; state: string; x: number; y: number; s: number }) {
  const [prev, setPrev] = useState<string>();
  const last = useRef(state);
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (last.current === state) return;
    const was = last.current;
    last.current = state;
    if (!fxOn()) { setPrev(undefined); return; }
    setPrev(was);
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: false }).start(() => setPrev(undefined));
  }, [state, fade]);
  return (
    <G x={x} y={y}>
      {prev ? <AnimatedG opacity={fade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })}><Look type={type} state={prev} s={s} /></AnimatedG> : null}
      <AnimatedG opacity={prev ? fade : 1}><Look type={type} state={state} s={s} /></AnimatedG>
    </G>
  );
}
