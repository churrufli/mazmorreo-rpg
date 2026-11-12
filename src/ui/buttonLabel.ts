// Avances de Cinzel-Bold.ttf (fuente incluida en Android y web), en em.
// Se suman sin kerning para reservar un pequeño margen conservador.
const ADVANCE: Record<string, number> = {'A': 0.717, 'B': 0.674, 'C': 0.78, 'D': 0.828, 'E': 0.632, 'F': 0.596, 'G': 0.836, 'H': 0.862, 'I': 0.387, 'J': 0.385, 'K': 0.757, 'L': 0.617, 'M': 0.953, 'N': 0.865, 'O': 0.879, 'P': 0.656, 'Q': 0.883, 'R': 0.747, 'S': 0.578, 'T': 0.667, 'U': 0.821, 'V': 0.728, 'W': 0.971, 'X': 0.729, 'Y': 0.702, 'Z': 0.661, '0': 0.653, '1': 0.393, '2': 0.617, '3': 0.563, '4': 0.619, '5': 0.554, '6': 0.63, '7': 0.545, '8': 0.603, '9': 0.63, ' ': 0.25, '+': 0.481, '×': 0.412, '−': 0.481, '-': 0.38, '/': 0.426, '(': 0.423, ')': 0.423, '’': 0.245, '.': 0.222, ',': 0.231, ':': 0.222};
const units = (s: string) => [...s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')].reduce((n, c) => n + (ADVANCE[c] ?? 0.9), 0);

function twoLines(caption: string): string[] {
  const syllableBreak: Record<string, number> = { DEFENDER: 5, HABILIDADES: 6, OBJETOS: 4, ESQUIVAR: 5 };
  const cut = syllableBreak[caption];
  if (cut) return [caption.slice(0, cut), caption.slice(cut)];
  const words = caption.split(/\s+/);
  const cuts = words.length > 1 ? words.slice(1).map((_, i) => [words.slice(0, i + 1).join(' '), words.slice(i + 1).join(' ')])
    : [...caption].slice(1).map((_, i) => [caption.slice(0, i + 1), caption.slice(i + 1)]);
  return cuts.reduce((best, pair) => Math.max(...pair.map(units)) < Math.max(...best.map(units)) ? pair : best, [caption]);
}

export function buttonLabelLayout(caption: string, availableWidth: number, fontSize: number) {
  const room = Math.max(1, availableWidth - 2);
  // Antes de partir en dos, se acepta reducir un poco la letra (como mucho un 12 %).
  const almostFits = units(caption) * fontSize <= room * 1.12;
  const lines = units(caption) * fontSize <= room || almostFits ? [caption] : twoLines(caption);
  return { lines, fontSize: Math.min(fontSize, room / Math.max(...lines.map(units), 0.01)) };
}

/** Evita encoger los nombres largos de acciones por debajo del tamaño legible. */
export function minActionButtonWidth(caption: string, fontSize = 11) {
  return Math.ceil(Math.max(...twoLines(caption).map(units)) * fontSize + 90);
}
