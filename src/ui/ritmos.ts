// Ritmos en bucle de la ambientación del mapa: pasos de [valor, duración en ms]. El bucle vuelve al último valor.
// En Android los anima Animated en el hilo nativo (un valor compartido por ritmo); en la web, animaciones CSS.
export type Paso = [number, number];

export const RITMOS = {
  // Llamas: tres ritmos irregulares y suaves (entre el 82 % y el 100 %) para que las antorchas no laten a la vez.
  flame0: [[0.88, 180], [1, 240], [0.84, 210], [0.97, 160], [0.9, 260], [1, 200]],
  flame1: [[0.95, 220], [0.83, 190], [1, 280], [0.9, 170], [0.98, 230], [0.86, 250]],
  flame2: [[0.9, 260], [1, 170], [0.92, 230], [0.82, 200], [1, 310], [0.93, 190]],
  // Cristales: respiran despacio en lugar de parpadear.
  glow: [[0.78, 3400], [1, 3800]],
  // Ondas del agua: dos capas que se relevan.
  waveA: [[1, 1800], [0, 1800]],
  waveB: [[0, 1800], [1, 1800]],
  slowA: [[1, 3100], [0, 3100]],
  slowB: [[0, 3100], [1, 3100]],
  // Brillos del hielo: casi siempre apagados, se encienden un instante.
  glint0: [[0, 5200], [0.75, 260], [0, 640]],
  glint1: [[0, 7300], [0.7, 260], [0, 640]],
  glint2: [[0, 9100], [0.8, 260], [0, 640]],
} satisfies Record<string, Paso[]>;
export type Ritmo = keyof typeof RITMOS;

/** Valor de reposo cuando no hay animación (efectos reducidos o ventana encima). */
export const REPOSO: Partial<Record<Ritmo, number>> = { waveA: 0.5, waveB: 0.5, slowA: 0.5, slowB: 0.5, glint0: 0, glint1: 0, glint2: 0 };
export const reposo = (k: Ritmo) => REPOSO[k] ?? 1;

/** Periodos de la deriva de la bruma: el vertical y la respiración no coinciden con el horizontal. */
export const derivaY = (period: number) => Math.round(period * 0.63);
export const respira = (period: number): Paso[] => [[0.7, Math.round(period * 0.41)], [1, Math.round(period * 0.47)]];
