// Bucles decorativos del mapa en Android: Animated en el hilo nativo, con un valor compartido por ritmo
// (todas las antorchas con el mismo ritmo usan la misma animación). La web usa bucle.web.tsx (CSS).
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';
import { Paso, RITMOS, Ritmo, derivaY, respira, reposo } from './ritmos';

const pool = new Map<string, { v: Animated.Value; n: number; rest: number; steps: Paso[]; anim?: Animated.CompositeAnimation }>();

function shared(key: string, steps: Paso[], rest: number) {
  let e = pool.get(key);
  if (!e) { e = { v: new Animated.Value(rest), n: 0, rest, steps }; pool.set(key, e); }
  return e;
}

/** Valor compartido que se anima mientras haya alguien que lo use con `on`. */
function useShared(key: string, steps: Paso[], rest: number, on: boolean) {
  const e = shared(key, steps, rest);
  useEffect(() => {
    if (!on) return;
    e.n++;
    if (e.n === 1) {
      e.anim = Animated.loop(Animated.sequence(e.steps.map(([toValue, duration]) =>
        Animated.timing(e.v, { toValue, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }))));
      e.anim.start();
    }
    return () => {
      e.n--;
      if (!e.n) { e.anim?.stop(); e.anim = undefined; e.v.setValue(e.rest); }
    };
  }, [e, on]);
  return e.v;
}

/** Vista cuya opacidad sigue un ritmo en bucle. */
export function Pulso({ k, on, style, children }: { k: Ritmo; on: boolean; style?: StyleProp<ViewStyle>; children?: React.ReactNode }) {
  const v = useShared(k, RITMOS[k], reposo(k), on);
  return <Animated.View pointerEvents="none" style={[style, { opacity: v }]}>{children}</Animated.View>;
}

/**
 * Bruma que deriva despacio: la vista mide `amp` × `ampY` y se desplaza de −amp a +amp (en el sentido `sign`),
 * con un vaivén vertical y una respiración de opacidad de periodos distintos. El contenido se coloca dentro, centrado en (0, 0).
 */
export function Deriva({ on, period, amp, ampY, sign, style, children }: {
  on: boolean; period: number; amp: number; ampY: number; sign: 1 | -1; style?: StyleProp<ViewStyle>; children?: React.ReactNode;
}) {
  const dx = useShared(`dx${period}`, [[1, period], [-1, period]], 0, on);
  const dy = useShared(`dy${period}`, [[1, derivaY(period)], [-1, derivaY(period)]], 0, on);
  const br = useShared(`br${period}`, respira(period), 1, on);
  const x = useMemo(() => dx.interpolate({ inputRange: [-1, 1], outputRange: [-amp * sign, amp * sign] }), [dx, amp, sign]);
  const y = useMemo(() => dy.interpolate({ inputRange: [-1, 1], outputRange: [-ampY, ampY] }), [dy, ampY]);
  return (
    <Animated.View pointerEvents="none" style={[style, { opacity: br, transform: [{ translateX: x }, { translateY: y }] }]}>
      {children}
    </Animated.View>
  );
}

export interface VueloProps { x: number; y: number; size: number; color: string; peak: number; d: number; rise: number; sway: number; dx: number }

/** Una mota que cruza el aire una vez en `d` ms: sube (o cae), se mece a los lados y se apaga al final. */
export function Vuelo({ x, y, size, color, peak, d, rise, sway, dx }: VueloProps) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.timing(t, { toValue: 1, duration: d, easing: Easing.linear, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [t, d]);
  return (
    <Animated.View pointerEvents="none" style={{
      position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: size / 2, backgroundColor: color,
      opacity: t.interpolate({ inputRange: [0, 0.2, 0.75, 1], outputRange: [0, peak, peak, 0] }),
      transform: [
        { translateX: t.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, sway + dx * 0.25, dx * 0.5, -sway + dx * 0.75, dx] }) },
        { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, rise] }) },
      ],
    }} />
  );
}
