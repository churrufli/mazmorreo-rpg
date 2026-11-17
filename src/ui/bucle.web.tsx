// Bucles decorativos del mapa en la web: animaciones CSS, que el navegador hace sin JavaScript en cada fotograma.
// Misma interfaz que bucle.tsx (Android).
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Paso, RITMOS, Ritmo, derivaY, respira, reposo } from './ritmos';

const total = (steps: Paso[]) => steps.reduce((t, s) => t + s[1], 0);
/** Fotogramas clave de un ritmo: empieza en el último valor, como el bucle nativo. */
function frames(steps: Paso[], prop: (v: number) => object) {
  const T = total(steps);
  const kf: Record<string, object> = { '0%': prop(steps[steps.length - 1][0]) };
  let t = 0;
  for (const [v, d] of steps) { t += d; kf[`${((t / T) * 100).toFixed(2)}%`] = prop(v); }
  return kf;
}
const anim = (kf: object, ms: number): any => ({
  animationKeyframes: [kf], animationDuration: `${ms}ms`, animationIterationCount: 'infinite', animationTimingFunction: 'ease-in-out',
});

const PULSOS = StyleSheet.create(Object.fromEntries((Object.keys(RITMOS) as Ritmo[]).map(k =>
  [k, anim(frames(RITMOS[k], v => ({ opacity: v })), total(RITMOS[k]))])) as Record<Ritmo, any>);

/** Vista cuya opacidad sigue un ritmo en bucle. */
export function Pulso({ k, on, style, children }: { k: Ritmo; on: boolean; style?: StyleProp<ViewStyle>; children?: React.ReactNode }) {
  return <View pointerEvents="none" style={[style, on ? PULSOS[k] : { opacity: reposo(k) }]}>{children}</View>;
}

// La deriva se expresa en % del tamaño de la propia vista, que mide amp × ampY: así unas pocas reglas valen para todas las zonas.
const derivas = new Map<number, { x: any; xr: any; y: any }>();
function deriva(period: number) {
  let d = derivas.get(period);
  if (!d) {
    const x = (s: number) => ({ '0%': { transform: [{ translateX: `${-100 * s}%` }] }, '50%': { transform: [{ translateX: `${100 * s}%` }] }, '100%': { transform: [{ translateX: `${-100 * s}%` }] } });
    const y = { '0%': { transform: [{ translateY: '-100%' }] }, '50%': { transform: [{ translateY: '100%' }] }, '100%': { transform: [{ translateY: '-100%' }] } };
    const br = frames(respira(period), v => ({ opacity: v }));
    const s = StyleSheet.create({
      x: anim(x(1), period * 2) as any,
      xr: anim(x(-1), period * 2) as any,
      y: { ...anim(y, derivaY(period) * 2), animationKeyframes: [y, br], animationDuration: `${derivaY(period) * 2}ms, ${total(respira(period))}ms` } as any,
    });
    d = { x: s.x, xr: s.xr, y: s.y };
    derivas.set(period, d);
  }
  return d;
}

/**
 * Bruma que deriva despacio: se desplaza de −amp a +amp (en el sentido `sign`), con un vaivén vertical
 * y una respiración de opacidad de periodos distintos. El contenido se coloca dentro, centrado en (0, 0).
 */
export function Deriva({ on, period, amp, ampY, sign, style, children }: {
  on: boolean; period: number; amp: number; ampY: number; sign: 1 | -1; style?: StyleProp<ViewStyle>; children?: React.ReactNode;
}) {
  const d = deriva(period);
  const box = { position: 'absolute' as const, left: 0, top: 0, width: amp, height: ampY };
  return (
    <View pointerEvents="none" style={style}>
      <View style={[box, on ? (sign > 0 ? d.x : d.xr) : null]}>
        <View style={[box, on ? d.y : null]}>{children}</View>
      </View>
    </View>
  );
}

export interface VueloProps { x: number; y: number; size: number; color: string; peak: number; d: number; rise: number; sway: number; dx: number }

// Recorrido de una mota en % del tamaño de cada capa (que mide lo que se desplaza): una capa por movimiento.
const VUELO = StyleSheet.create({
  dx: { animationKeyframes: [{ '0%': { transform: [{ translateX: '0%' }] }, '100%': { transform: [{ translateX: '100%' }] } }], animationTimingFunction: 'linear', animationFillMode: 'both' } as any,
  sway: { animationKeyframes: [{ '0%': { transform: [{ translateX: '0%' }] }, '25%': { transform: [{ translateX: '100%' }] }, '50%': { transform: [{ translateX: '0%' }] }, '75%': { transform: [{ translateX: '-100%' }] }, '100%': { transform: [{ translateX: '0%' }] } }], animationTimingFunction: 'ease-in-out', animationFillMode: 'both' } as any,
  swayL: { animationKeyframes: [{ '0%': { transform: [{ translateX: '0%' }] }, '25%': { transform: [{ translateX: '-100%' }] }, '50%': { transform: [{ translateX: '0%' }] }, '75%': { transform: [{ translateX: '100%' }] }, '100%': { transform: [{ translateX: '0%' }] } }], animationTimingFunction: 'ease-in-out', animationFillMode: 'both' } as any,
  up: { animationKeyframes: [{ '0%': { transform: [{ translateY: '0%' }] }, '100%': { transform: [{ translateY: '-100%' }] } }, { '0%': { opacity: 0 }, '20%': { opacity: 1 }, '75%': { opacity: 1 }, '100%': { opacity: 0 } }], animationTimingFunction: 'linear', animationFillMode: 'both' } as any,
  down: { animationKeyframes: [{ '0%': { transform: [{ translateY: '0%' }] }, '100%': { transform: [{ translateY: '100%' }] } }, { '0%': { opacity: 0 }, '20%': { opacity: 1 }, '75%': { opacity: 1 }, '100%': { opacity: 0 } }], animationTimingFunction: 'linear', animationFillMode: 'both' } as any,
});

/** Una mota que cruza el aire una vez en `d` ms: sube (o cae), se mece a los lados y se apaga al final. */
export function Vuelo({ x, y, size, color, peak, d, rise, sway, dx }: VueloProps) {
  const ms = `${d}ms`;
  const layer = (w: number, h: number) => ({ position: 'absolute' as const, left: 0, top: 0, width: Math.max(Math.abs(w), 0.01), height: Math.max(Math.abs(h), 0.01) });
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x, top: y, width: 0, height: 0 }}>
      <View style={[layer(dx, 1), dx ? VUELO.dx : null, { animationDuration: ms } as any]}>
        <View style={[layer(sway, 1), sway < 0 ? VUELO.swayL : VUELO.sway, { animationDuration: ms } as any]}>
          <View style={[layer(1, rise), rise < 0 ? VUELO.up : VUELO.down, { animationDuration: `${ms}, ${ms}` } as any]}>
            <View style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: peak }} />
          </View>
        </View>
      </View>
    </View>
  );
}
