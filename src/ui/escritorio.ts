import { Platform, useWindowDimensions } from 'react-native';

/**
 * Modo escritorio de la web: ventana apaisada y ancha. La interfaz va en una
 * columna centrada de 520-600 px; los fondos verticales se funden a negro por los lados.
 * En Android (fijo en vertical) y en móviles nunca se activa.
 */
export function useEscritorio() {
  const { width, height } = useWindowDimensions();
  const on = Platform.OS === 'web' && width > height && width >= 900;
  const col = on ? Math.round(Math.min(600, Math.max(520, width * 0.42))) : width;
  return { on, col, width, height };
}
