import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
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
    const sparks = t.interpolate({ inputRange: [0, 1], outputRange: [h * 0.05, -h * 0.7] });
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
        {layer(
          [[14, 110], [46, 126], [60, 104], [82, 120], [28, 88], [70, 84]].map(([x, y], i) => (
            <Line key={i} x1={x} y1={y} x2={x + (i % 2 ? 2 : -2)} y2={y - 7} stroke="#fff1a8" strokeWidth={1.4} strokeLinecap="round" />
          )),
          { opacity: fade(0.9, 0.75), transform: [{ translateY: sparks }] },
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
    const flicker2 = t.interpolate({ inputRange: [0, 0.1, 0.16, 0.24, 0.34, 0.5, 1], outputRange: [0, 0, 1, 0.2, 1, 0.6, 0], extrapolate: 'clamp' });
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
        {/* Segundo rayo, a contratiempo del primero, y chispas donde toca. */}
        {layer(
          <>
            <Polyline points="66,0 72,34 60,38 76,78 62,82 70,150" stroke="#9cc4ff" strokeWidth="6" opacity={0.4} fill="none" strokeLinejoin="round" />
            <Polyline points="66,0 72,34 60,38 76,78 62,82 70,150" stroke="#f4f8ff" strokeWidth="2.2" fill="none" strokeLinejoin="round" />
            {[[40, 40], [54, 44], [36, 88], [76, 78], [52, 92]].map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={i % 2 ? 2 : 3} fill="#ffffff" />)}
          </>,
          { opacity: flicker2 },
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

  if (kind === 'smoke') {
    // Necrótico: humo oscuro que sube, zarcillos de sombra desde los bordes y un velo que apaga la carta.
    const up = t.interpolate({ inputRange: [0, 1], outputRange: [h * 0.12, -h * 0.2] });
    const grow = t.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] });
    const creep = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 1, 1.05] });
    return (
      <>
        {tint('#1a0a24', 0.65)}
        {layer(
          <>
            {['M0 150 C14 120, 4 98, 18 76 C24 66, 16 56, 22 44', 'M100 150 C86 124, 98 102, 82 82 C76 72, 86 60, 78 48', 'M30 150 C36 132, 26 120, 36 104', 'M70 150 C64 134, 74 118, 64 102'].map((d, i) => (
              <Path key={i} d={d} stroke={i % 2 ? '#5b2f73' : '#2a1236'} strokeWidth={i < 2 ? 5 : 3.5} strokeLinecap="round" fill="none" opacity={0.85} />
            ))}
          </>,
          { opacity: fade(1), transform: [{ scaleY: creep }] },
        )}
        {layer(
          [[30, 100, 18], [62, 92, 22], [46, 120, 20], [24, 70, 14], [74, 66, 16], [50, 54, 12]].map(([x, y, r], i) => (
            <Circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? '#2a1236' : '#3d2350'} opacity={0.55} />
          )),
          { opacity: fade(1), transform: [{ translateY: up }, { scale: grow }] },
        )}
      </>
    );
  }

  if (kind === 'poison') {
    // Veneno: vapores verdosos que suben ondulando y gotas pequeñas.
    const up = t.interpolate({ inputRange: [0, 1], outputRange: [h * 0.15, -h * 0.25] });
    const sway = t.interpolate({ inputRange: [0, 0.33, 0.66, 1], outputRange: [0, w * 0.04, -w * 0.04, 0] });
    return (
      <>
        {tint('#5a9a2a', 0.42)}
        {layer(
          <>
            {['M20 150 C10 128, 30 112, 20 92 C12 76, 28 64, 22 50', 'M50 150 C40 126, 60 108, 50 86 C42 70, 58 58, 52 42', 'M80 150 C70 130, 90 112, 80 94 C72 80, 88 68, 82 56'].map((d, i) => (
              <Path key={i} d={d} stroke="#b6f06a" strokeOpacity={0.4} strokeWidth={5} strokeLinecap="round" fill="none" />
            ))}
            {[[26, 116, 3], [58, 104, 2.4], [74, 124, 2.8], [40, 86, 2]].map(([x, y, r], i) => <Circle key={i} cx={x} cy={y} r={r} fill="#d8ff9a" />)}
          </>,
          { opacity: fade(0.9), transform: [{ translateY: up }, { translateX: sway }] },
        )}
      </>
    );
  }

  if (kind === 'acid') {
    // Ácido: una salpicadura que estalla en el centro y gotas que corroen y resbalan hacia abajo.
    const burst = t.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.2, 1.1, 1.2], extrapolate: 'clamp' });
    const drip = t.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0, h * 0.18], extrapolate: 'clamp' });
    return (
      <>
        {tint('#9fbf1a', 0.45)}
        {layer(
          <>
            {Array.from({ length: 8 }, (_, i) => {
              const r = (i * 45 * Math.PI) / 180, d = i % 2 ? 26 : 34;
              return <Circle key={i} cx={50 + Math.cos(r) * d} cy={75 + Math.sin(r) * d * 1.2} r={i % 2 ? 3 : 4.5} fill="#e4f25a" opacity={0.9} />;
            })}
            <Circle cx="50" cy="75" r="14" fill="#c8e64a" opacity={0.7} />
            <Circle cx="46" cy="71" r="5" fill="#f6ffb0" opacity={0.8} />
          </>,
          { opacity: fade(1), transform: [{ scale: burst }] },
        )}
        {layer(
          [[30, 60, 5], [56, 50, 4], [70, 66, 5.5], [40, 84, 4]].map(([x, y, l], i) => (
            <Path key={i} d={`M${x} ${y} q2 ${l} 0 ${l * 2.4} q-2 -${l} 0 -${l * 2.4}`} fill="#d4ec3a" opacity={0.85} />
          )),
          { opacity: fade(0.9), transform: [{ translateY: drip }] },
        )}
      </>
    );
  }

  if (kind === 'psychic') {
    // Psíquico: ondas finas que se abren y una leve distorsión de la carta (las ondas se deforman).
    const wob = t.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: [1, 1.06, 0.95, 1.04, 0.98, 1] });
    const ring = (delay: number) => t.interpolate({ inputRange: [0, delay, 1], outputRange: [0.15, 0.15, 1.5], extrapolate: 'clamp' });
    return (
      <>
        {tint('#b060c8', 0.38)}
        {[0, 0.15, 0.3].map(d => (
          <React.Fragment key={d}>
            {layer(<Path d="M20 75 C20 45, 80 45, 80 75 C80 105, 20 105, 20 75 Z" stroke="#ffb8ec" strokeWidth={2.2} fill="none" strokeDasharray="6 4" />,
              { opacity: t.interpolate({ inputRange: [0, d, d + 0.1, 1], outputRange: [0, 0, 0.9, 0], extrapolate: 'clamp' }), transform: [{ scale: ring(d) }, { scaleX: wob }] })}
          </React.Fragment>
        ))}
      </>
    );
  }

  // Fuerza: una onda expansiva gruesa. Trueno: dos ondas claras y rápidas, como un estampido.
  const thunder = kind === 'thunder';
  const color = thunder ? '#d6e6ff' : '#c49bff';
  const ring = (delay: number) => t.interpolate({ inputRange: [0, delay, 1], outputRange: [0.1, 0.1, 1.7], extrapolate: 'clamp' });
  return (
    <>
      {tint(color, thunder ? 0.3 : 0.4)}
      {layer(<Circle cx="50" cy="75" r="16" fill={color} />, { opacity: t.interpolate({ inputRange: [0, 0.08, 0.3], outputRange: [0, 0.7, 0], extrapolate: 'clamp' }) })}
      {(thunder ? [0, 0.12] : [0, 0.2, 0.4]).map((d, i) => (
        <React.Fragment key={d}>
          {layer(<Circle cx="50" cy="75" r="30" stroke={color} strokeWidth={thunder ? 3 : i === 0 ? 7 : 4} fill="none" />,
            { opacity: t.interpolate({ inputRange: [0, d, d + 0.1, 1], outputRange: [0, 0, 1, 0], extrapolate: 'clamp' }), transform: [{ scale: ring(d) }] })}
        </React.Fragment>
      ))}
    </>
  );
}

type Element = 'fire' | 'frost' | 'lightning' | 'thunder' | 'radiant' | 'smoke' | 'poison' | 'acid' | 'force' | 'psychic';

/** Tipo de efecto de cada daño. Los daños físicos no tienen efecto propio. */
export function elementOf(type?: DmgType): Element | undefined {
  switch (type) {
    case 'fuego': return 'fire';
    case 'frío': return 'frost';
    case 'relámpago': return 'lightning';
    case 'trueno': return 'thunder';
    case 'radiante': return 'radiant';
    case 'necrótico': return 'smoke';
    case 'veneno': return 'poison';
    case 'ácido': return 'acid';
    case 'fuerza': return 'force';
    case 'psíquico': return 'psychic';
    default: return undefined;
  }
}

/** Capa que sobresale de la carta (chispas, esquirlas): no tapa la ilustración más de un instante. */
export const OUTER = 0.35;

/**
 * Golpe físico en el punto de impacto: un tajo que cruza la carta y chispas que saltan hacia fuera.
 * El crítico cruza dos tajos dorados, más chispas y un anillo. `t` es el mismo valor del impacto (0 a 1).
 */
export function ImpactFx({ w, h, t, crit, strong }: { w: number; h: number; t: Animated.Value; crit?: boolean; strong?: boolean }) {
  const pad = w * OUTER;
  const W = w + pad * 2, H = h + pad * 2;
  const cx = W / 2, cy = pad + h * 0.42;
  const len = w * 1.15;
  const slash = (angle: string, color: string, delay: number, thick: number) => (
    <Animated.View key={angle} pointerEvents="none" style={{
      position: 'absolute', left: cx - len / 2, top: cy - thick / 2, width: len, height: thick, borderRadius: thick,
      backgroundColor: color, shadowColor: color, shadowOpacity: 0.9, shadowRadius: 6,
      opacity: t.interpolate({ inputRange: [0, delay, delay + 0.06, 0.45, 0.6], outputRange: [0, 0, 1, 0.6, 0], extrapolate: 'clamp' }),
      transform: [{ rotate: angle }, { scaleX: t.interpolate({ inputRange: [0, delay, delay + 0.16, 1], outputRange: [0.05, 0.05, 1, 1.05], extrapolate: 'clamp' }) }, { scaleY: t.interpolate({ inputRange: [0, 0.3, 0.6], outputRange: [1, 1, 0.3], extrapolate: 'clamp' }) }],
    }} />
  );
  const n = crit ? 12 : strong ? 9 : 7;
  const sparkCol = crit ? '#ffd76a' : '#fff1d0';
  const R = w * 0.62;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: -pad, top: -pad, width: W, height: H }}>
      {slash(crit ? '-38deg' : '-32deg', crit ? '#ffe9a8' : '#ffffff', 0, crit ? 4 : 3)}
      {crit ? slash('34deg', '#ffd76a', 0.08, 3.5) : null}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, {
        opacity: t.interpolate({ inputRange: [0, 0.06, 0.4, 0.62], outputRange: [0, 1, 0.7, 0], extrapolate: 'clamp' }),
        transform: [{ scale: t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.35, 1.1, 1.25] }) }],
      }]}>
        <Svg width={W} height={H}>
          {Array.from({ length: n }, (_, i) => {
            const a = (i / n) * Math.PI * 2 + 0.3, r0 = R * (i % 2 ? 0.55 : 0.7), r1 = r0 + w * (crit ? 0.2 : 0.13);
            return <Line key={i} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={cx + Math.cos(a) * r1} y2={cy + Math.sin(a) * r1} stroke={sparkCol} strokeWidth={i % 3 ? 1.6 : 2.4} strokeLinecap="round" />;
          })}
          {crit ? <Circle cx={cx} cy={cy} r={R * 0.9} stroke="#ffd76a" strokeWidth={2} fill="none" opacity={0.8} /> : null}
        </Svg>
      </Animated.View>
    </View>
  );
}

/** Destello breve sobre toda la carta al recibir el golpe: blanco, dorado en el crítico. */
export function FlashFx({ t, crit }: { t: Animated.Value; crit?: boolean }) {
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: crit ? '#ffe2a0' : '#ffffff',
    opacity: t.interpolate({ inputRange: [0, 0.04, crit ? 0.2 : 0.14], outputRange: [0, crit ? 0.55 : 0.35, 0], extrapolate: 'clamp' }) }]} />;
}

/** Curación: un brillo verde que sube desde abajo y motas doradas y verdes que ascienden. */
export function HealFx({ w, h, t, uid }: { w: number; h: number; t: Animated.Value; uid: string }) {
  const id = `heal_${uid.replace(/[^a-zA-Z0-9_]/g, '_')}`;
  const fade = t.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 0.8, 0], extrapolate: 'clamp' });
  const up = t.interpolate({ inputRange: [0, 1], outputRange: [h * 0.2, -h * 0.35] });
  return (
    <>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: t.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.7, 0], extrapolate: 'clamp' }) }]}>
        <Svg width={w} height={h} viewBox="0 0 100 150" preserveAspectRatio="none">
          <Defs>
            <RadialGradient id={id} cx="50" cy="150" r="110" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#bff5a8" stopOpacity={0.85} />
              <Stop offset="0.6" stopColor="#4a9d5b" stopOpacity={0.35} />
              <Stop offset="1" stopColor="#4a9d5b" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100" height="150" fill={`url(#${id})`} />
        </Svg>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: fade, transform: [{ translateY: up }] }]}>
        <Svg width={w} height={h} viewBox="0 0 100 150" preserveAspectRatio="none">
          {[[18, 130, 2.2], [34, 118, 1.6], [52, 136, 2.6], [68, 122, 1.8], [84, 132, 2.2], [26, 100, 1.4], [60, 104, 2], [44, 90, 1.4], [76, 96, 1.6]].map(([x, y, r], i) => (
            <Circle key={i} cx={x} cy={y} r={r} fill={i % 3 ? '#d9ffc8' : '#ffe9a3'} />
          ))}
          {[[30, 112], [70, 110], [50, 92]].map(([x, y], i) => (
            <Path key={`p${i}`} d={`M${x - 3} ${y}H${x + 3}M${x} ${y - 3}V${y + 3}`} stroke="#eaffdf" strokeWidth={1.6} strokeLinecap="round" />
          ))}
        </Svg>
      </Animated.View>
    </>
  );
}

/** Un estado que llega: los beneficiosos con un aro dorado y destellos; los perjudiciales, con una sombra violácea. */
export function StateFx({ w, h, t, good }: { w: number; h: number; t: Animated.Value; good: boolean }) {
  const o = t.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0], extrapolate: 'clamp' });
  if (!good) return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: o, borderRadius: 8, borderWidth: Math.max(4, w * 0.08), borderColor: 'rgba(70,20,90,0.75)' }]} />
  );
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: o }]}>
      <View style={[StyleSheet.absoluteFill, { borderRadius: 8, borderWidth: 3, borderColor: '#ffe39a' }]} />
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [h * 0.1, -h * 0.12] }) }] }]}>
        <Svg width={w} height={h} viewBox="0 0 100 150" preserveAspectRatio="none">
          {[[16, 120], [84, 112], [28, 60], [74, 52], [50, 130]].map(([x, y], i) => (
            <Path key={i} d={`M${x} ${y - 5} L${x + 1.4} ${y - 1.4} L${x + 5} ${y} L${x + 1.4} ${y + 1.4} L${x} ${y + 5} L${x - 1.4} ${y + 1.4} L${x - 5} ${y} L${x - 1.4} ${y - 1.4} Z`} fill="#fff1c0" />
          ))}
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

// Esquirlas de la carta rota: dirección, distancia y tamaño (fijas, para que no cambien en cada render).
const SHARDS = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2 + (i % 3) * 0.2;
  return { a, d: 0.55 + ((i * 37) % 10) / 22, s: 3 + ((i * 53) % 5), spin: (i % 2 ? 1 : -1) * (120 + i * 17) };
});

/**
 * Carta que se rompe: las esquirlas salen despedidas en la última fase (`v` de 1 a 2, la misma que el fundido).
 * Los jefes sueltan más esquirlas y una onda rojiza.
 */
export function ShardsFx({ w, h, v, boss }: { w: number; h: number; v: Animated.Value; boss?: boolean }) {
  const pad = w * OUTER;
  const W = w + pad * 2, H = h + pad * 2, cx = W / 2, cy = H / 2;
  const list = boss ? SHARDS : SHARDS.filter((_, i) => i % 2 === 0);
  const go = v.interpolate({ inputRange: [0, 1, 2], outputRange: [0, 0, 1], extrapolate: 'clamp' });
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: -pad, top: -pad, width: W, height: H }}>
      {boss ? (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: v.interpolate({ inputRange: [0, 0.9, 1.05, 1.8], outputRange: [0, 0, 0.9, 0], extrapolate: 'clamp' }), transform: [{ scale: v.interpolate({ inputRange: [0, 1, 2], outputRange: [0.3, 0.3, 1.25], extrapolate: 'clamp' }) }] }]}>
          <Svg width={W} height={H}><Circle cx={cx} cy={cy} r={Math.min(W, H) * 0.45} stroke="#e0705f" strokeWidth={4} fill="none" /><Circle cx={cx} cy={cy} r={Math.min(W, H) * 0.38} stroke="#ffd76a" strokeWidth={1.5} fill="none" /></Svg>
        </Animated.View>
      ) : null}
      {list.map((p, i) => {
        const dx = Math.cos(p.a) * w * p.d, dy = Math.sin(p.a) * h * p.d * 0.7;
        const sz = p.s * (w / 60);
        return (
          <Animated.View key={i} style={{
            position: 'absolute', left: cx - sz, top: cy - sz, width: sz * 2, height: sz * 2,
            opacity: v.interpolate({ inputRange: [0, 1, 1.15, 2], outputRange: [0, 0, 1, 0], extrapolate: 'clamp' }),
            transform: [{ translateX: go.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) }, { translateY: go.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) }, { rotate: go.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) }],
          }}>
            <Svg width={sz * 2} height={sz * 2} viewBox="0 0 10 10"><Polygon points={i % 2 ? '0,0 10,3 3,10' : '2,0 10,6 0,9'} fill={i % 3 ? '#3a2a1c' : '#c9a25c'} stroke="#e8dcc8" strokeWidth={0.6} /></Svg>
          </Animated.View>
        );
      })}
    </View>
  );
}

/** Estados que se reciben como ayuda: el resto se pinta como perjudicial. */
export const GOOD_STATES = new Set(['dodge', 'bless', 'hidden']);
