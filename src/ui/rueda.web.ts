import { useEffect, useRef } from 'react';

/** Zoom con la rueda del ratón sobre el elemento `id` (web en escritorio). */
export function useRuedaZoom(id: string, zoom: (factor: number) => void) {
  const cb = useRef(zoom);
  cb.current = zoom;
  useEffect(() => {
    const el = document.getElementById(id);
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cb.current(e.deltaY < 0 ? 1.1 : 1 / 1.1);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [id]);
}
