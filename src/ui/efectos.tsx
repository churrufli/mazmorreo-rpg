import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, G, Line, Path, Polygon, Polyline, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { DmgType } from '../data/srd';

/**
 * Efecto propio de cada tipo de daño mágico sobre una carta: llamas que suben,
 * escarcha que cubre la carta, un rayo que parpadea, haces de luz, humo, burbujas
 * o anillos de fuerza. `t` va de 0 a 1 con la misma animación del impacto.
 */
export function ElementFx({ type, w, h, t, uid }: { type: DmgType; w: number; h: number; t: Animated.Value; uid: string }) {
  const kind = elementOf(type);
  if (!kind) return null;
  const fade = (peak: number, end = 1) => t.interpolate({ inputRange: [0, 0.12, end * 0.7, end], outputRange: [0, peak, peak * 0.8, 0], extrapolate: 'clamp' });
  const layer = (children: React.ReactNode, style: any) => (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width={w} height={h} viewBox="0 0 100 150" preserveAspectRatio="none">{children}</Svg>
    </Animated.View>
  );
  const id = `fx_${uid.replace(/[^a-zA-Z0-9_]/g, '_')}`;
  const tint = (color: string, peak: number) => layer(
    <>
      <Defs>
        <RadialGradient id={`${id}_t`} cx="50" cy="75" r="80" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={color} stopOpacity={0.15} />
          <Stop offset="1" stopColor={color} stopOpacity={0.85} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100" height="150" fill={`url(#${id}_t)`} />
    </>,
    { opacity: fade(peak) },
  );

  if (kind === 'fire') {
    const rise = t.interpolate({ inputRange: [0, 1], outputRange: [h * 0.25, -h * 0.12] });
    const embers = t.interpolate({ inputRange: [0, 1], outputRange: [h * 0.1, -h * 0.45] });
    return (
      <>
        {tint('#ff5a1f', 0.55)}
        {layer(
          <>
            <Defs>
              <RadialGradient id={`${id}_f`} cx="50" cy="150" r="90" gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor="#fff4b0" />
                <Stop offset="0.45" stopColor="#ffb13b" />
                <Stop offset="1" stopColor="#e8361a" />
              </RadialGradient>
            </Defs>
            {[8, 26, 44, 62, 80].map((x, i) => (
              <Path key={i} fill={`url(#${id}_f)`} opacity={0.9}
                d={`M${x} 150 C${x - 6} ${128 - i % 2 * 12}, ${x + 6} ${112 - i % 3 * 10}, ${x + 4} ${86 - i % 2 * 18} C${x + 14} ${110}, ${x + 18} ${130}, ${x + 16} 150 Z`} />
            ))}
          </>,
          { opacity: fade(1), transform: [{ translateY: rise }] },
        )}
        {layer(
          [[20, 120], [38, 132], [55, 116], [72, 128], [86, 112], [30, 100], [64, 98]].map(([x, y], i) => (
            <Circle key={i} cx={x} cy={y} r={i % 2 ? 1.6 : 2.4} fill={i % 3 ? '#ffd36b' : '#ff7a2e'} />
          )),
          { opacity: fade(1), transform: [{ translateY: embers }] },
        )}
      </>
    );
  }

  if (kind === 'frost') {
    const grow = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1.1, 1.2] });
    const spin = t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '60deg'] });
    const inward = t.interpolate({ inputRange: [0, 0.4, 1], outputRange: [1.15, 1, 1] });
    const arm = (a: number) => {
      const r = (a * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
      const p = (d: number, o = 0) => `${50 + c * d - s * o},${75 + s * d + c * o}`;
      return <G key={a}><Line x1="50" y1="75" x2={50 + c * 30} y2={75 + s * 30} stroke="#eaf8ff" strokeWidth="2.4" strokeLinecap="round" />
        <Polyline points={`${p(14, -7)} ${p(20)} ${p(14, 7)}`} stroke="#eaf8ff" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <Polyline points={`${p(22, -5)} ${p(27)} ${p(22, 5)}`} stroke="#bfe9ff" strokeWidth="1.5" fill="none" strokeLinecap="round" /></G>;
    };
    return (
      <>
        {tint('#7fd0ff', 0.6)}
        {/* Escarcha que entra desde los bordes y se queda un poco más. */}
        {layer(
          <>
            {[[0, 0, 22, 0, 0, 30], [100, 0, 78, 0, 100, 34], [0, 150, 26, 150, 0, 116], [100, 150, 74, 150, 100, 120], [0, 60, 14, 75, 0, 90], [100, 55, 86, 72, 100, 92]].map((q, i) => (
              <Polygon key={i} points={`${q[0]},${q[1]} ${q[2]},${q[3]} ${q[4]},${q[5]}`} fill="#dff5ff" opacity={0.8} stroke="#ffffff" strokeWidth="0.8" />
            ))}
          </>,
          { opacity: t.interpolate({ inputRange: [0, 0.2, 0.85, 1], outputRange: [0, 0.9, 0.9, 0], extrapolate: 'clamp' }), transform: [{ scale: inward }] },
        )}
        {layer(<>{[0, 60, 120, 180, 240, 300].map(arm)}<Circle cx="50" cy="75" r="4" fill="#ffffff" /></>,
          { opacity: fade(1), transform: [{ scale: grow }, { rotate: spin }] })}
      </>
    );
  }

  if (kind === 'lightning') {
    // Parpadeo irregular, como un relámpago de verdad.
    const flicker = t.interpolate({ inputRange: [0, 0.06, 0.12, 0.2, 0.28, 0.45, 1], outputRange: [0, 1, 0.15, 1, 0.3, 0.9, 0], extrapolate: 'clamp' });
    const flash = t.interpolate({ inputRange: [0, 0.05, 0.12, 0.22, 0.35], outputRange: [0, 0.8, 0, 0.5, 0], extrapolate: 'clamp' });
    const bolt = '48,0 40,40 54,44 36,88 52,92 34,150';
    return (
      <>
        {layer(<Rect x="0" y="0" width="100" height="150" fill="#eef4ff" />, { opacity: flash })}
        {layer(
          <>
            <Polyline points={bolt} stroke="#7fb4ff" strokeWidth="9" opacity={0.45} fill="none" strokeLinejoin="round" />
            <Polyline points={bolt} stroke="#ffffff" strokeWidth="3.5" fill="none" strokeLinejoin="round" />
            <Polyline points="54,44 70,62 66,80" stroke="#d6e6ff" strokeWidth="1.8" fill="none" />
            <Polyline points="36,88 22,104 26,120" stroke="#d6e6ff" strokeWidth="1.8" fill="none" />
          </>,
          { opacity: flicker },
        )}
      </>
    );
  }

  if (kind === 'radiant') {
    const grow = t.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1.3] });
    const spin = t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '25deg'] });
    return (
      <>
        {tint('#ffe9a3', 0.5)}
        {layer(
          <>
            {Array.from({ length: 12 }, (_, i) => {
              const r = (i * 30 * Math.PI) / 180;
              return <Polygon key={i} fill={i % 2 ? '#fff3c4' : '#ffd76a'} opacity={0.85}
                points={`50,75 ${50 + Math.cos(r - 0.08) * 70},${75 + Math.sin(r - 0.08) * 70} ${50 + Math.cos(r + 0.08) * 70},${75 + Math.sin(r + 0.08) * 70}`} />;
            })}
            <Circle cx="50" cy="75" r="10" fill="#ffffff" />
          </>,
          { opacity: fade(1), transform: [{ scale: grow }, { rotate: spin }] },
        )}
      </>
    );
  }

  if (kind === 'smoke' || kind === 'bubbles') {
    const toxic = kind === 'bubbles';
    const up = t.interpolate({ inputRange: [0, 1], outputRange: [h * 0.12, -h * 0.2] });
    const grow = t.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] });
    const dots = toxic
      ? [[22, 120, 6], [40, 132, 4], [58, 112, 7], [76, 126, 5], [32, 96, 4], [66, 90, 5], [50, 70, 3]]
      : [[30, 100, 18], [62, 92, 22], [46, 120, 20], [24, 70, 14], [74, 66, 16], [50, 54, 12]];
    return (
      <>
        {tint(toxic ? '#7ad23a' : '#3b1f4a', toxic ? 0.45 : 0.6)}
        {layer(
          dots.map(([x, y, r], i) => toxic
            ? <Circle key={i} cx={x} cy={y} r={r} fill="#b6f06a" fillOpacity={0.35} stroke="#e4ffb0" strokeWidth="1.2" />
            : <Circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? '#2a1236' : '#4f6b2e'} opacity={0.6} />),
          { opacity: fade(1), transform: [{ translateY: up }, { scale: grow }] },
        )}
      </>
    );
  }

  // Fuerza y psíquico: anillos que se abren desde el centro.
  const color = kind === 'psychic' ? '#ff8ad8' : '#c49bff';
  const ring = (delay: number) => t.interpolate({ inputRange: [0, delay, 1], outputRange: [0.1, 0.1, 1.6], extrapolate: 'clamp' });
  return (
    <>
      {tint(color, 0.4)}
      {[0, 0.2, 0.4].map(d => (
        <React.Fragment key={d}>
          {layer(<Circle cx="50" cy="75" r="30" stroke={color} strokeWidth="4" fill="none" />,
            { opacity: t.interpolate({ inputRange: [0, d, d + 0.1, 1], outputRange: [0, 0, 1, 0], extrapolate: 'clamp' }), transform: [{ scale: ring(d) }] })}
        </React.Fragment>
      ))}
    </>
  );
}

type Element = 'fire' | 'frost' | 'lightning' | 'radiant' | 'smoke' | 'bubbles' | 'force' | 'psychic';

/** Tipo de efecto de cada daño. Los daños físicos no tienen efecto propio. */
export function elementOf(type?: DmgType): Element | undefined {
  switch (type) {
    case 'fuego': return 'fire';
    case 'frío': return 'frost';
    case 'relámpago': case 'trueno': return 'lightning';
    case 'radiante': return 'radiant';
    case 'necrótico': return 'smoke';
    case 'veneno': case 'ácido': return 'bubbles';
    case 'fuerza': return 'force';
    case 'psíquico': return 'psychic';
    default: return undefined;
  }
}
