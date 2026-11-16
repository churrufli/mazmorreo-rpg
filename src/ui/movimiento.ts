// Lenguaje común de las animaciones: duraciones, curvas y nivel de efectos visuales.
// Todo lo que sea puramente decorativo pregunta aquí si debe verse y con qué intensidad.
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Easing } from 'react-native';
import { getFxMode, setFxMode } from '../storage';

/** Duraciones en milisegundos. Cortas a propósito: ningún efecto alarga un turno. */
export const DUR = {
  /** Respuesta al tocar (botones, casillas). */
  press: 70,
  /** Vuelta al reposo tras soltar. */
  release: 220,
  /** Paneles y ventanas que aparecen. */
  panel: 260,
  /** Cambios de puntos de golpe en la barra. */
  bar: 380,
  /** Retardo del rastro claro de la barra al recibir daño. */
  barLag: 260,
  /** Estados que aparecen o desaparecen en la carta. */
  state: 320,
} as const;

/** Curvas: salida suave para lo que llega, entrada para lo que se va y un rebote leve para lo que «pesa». */
export const EASE = {
  out: Easing.out(Easing.cubic),
  in: Easing.in(Easing.quad),
  inOut: Easing.inOut(Easing.quad),
  settle: Easing.out(Easing.back(1.4)),
};

/** full = todos los efectos; reduced = sin sacudidas, partículas ni destellos; off = solo lo imprescindible para entender la acción. */
export type FxMode = 'full' | 'reduced' | 'off';
const MODES: FxMode[] = ['full', 'reduced', 'off'];

let systemReduced = false;
let mode: FxMode = (MODES as string[]).includes(getFxMode() ?? '') ? (getFxMode() as FxMode) : 'full';
let chosen = (MODES as string[]).includes(getFxMode() ?? '');
const listeners = new Set<(m: FxMode) => void>();
const emit = () => listeners.forEach(l => l(fxMode()));

// Sin elección guardada, se respeta «reducir movimiento» del sistema (Android y navegador).
try {
  AccessibilityInfo.isReduceMotionEnabled?.().then(v => { systemReduced = !!v; emit(); }).catch(() => undefined);
  AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v: boolean) => { systemReduced = !!v; emit(); });
} catch { /* sin accesibilidad (tests) */ }

/** Nivel de efectos vigente. */
export const fxMode = (): FxMode => (chosen ? mode : systemReduced ? 'reduced' : 'full');
/** Efectos decorativos de más (partículas, sacudidas, destellos). */
export const fxFull = () => fxMode() === 'full';
/** Algún efecto (los reducidos incluidos). */
export const fxOn = () => fxMode() !== 'off';

export function setFx(m: FxMode) {
  mode = m;
  chosen = true;
  setFxMode(m);
  emit();
}

/** Nivel de efectos que se vuelve a pintar al cambiarlo en Ajustes. */
export function useFxMode(): FxMode {
  const [m, setM] = useState(fxMode());
  useEffect(() => {
    listeners.add(setM);
    setM(fxMode());
    return () => { listeners.delete(setM); };
  }, []);
  return m;
}
