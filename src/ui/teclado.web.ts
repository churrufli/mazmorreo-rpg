import { useEffect, useRef } from 'react';

/** Atajos de teclado en la web: llama a `on` con la tecla pulsada (fuera de los campos de texto). */
export function useTeclas(on: (key: string) => void) {
  const cb = useRef(on);
  cb.current = on;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.ctrlKey || e.metaKey || e.altKey || t?.tagName === 'INPUT' || t?.tagName === 'TEXTAREA') return;
      cb.current(e.key);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
