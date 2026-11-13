import { mdiFullscreen, mdiFullscreenExit } from '@mdi/js';

/** Icono SVG de 20 px con el trazado de MDI. */
const svg = (d: string) => `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${d}"/></svg>`;

/** Control exclusivo de la web; la raíz completa mantiene visibles también los diálogos. */
export function installFullscreenControl() {
  if (!document.fullscreenEnabled || !document.documentElement.requestFullscreen) return () => {};

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'web-fullscreen';
  const status = document.createElement('div');
  status.className = 'web-fullscreen-status';
  status.setAttribute('role', 'status');
  status.hidden = true;
  let pending = false;

  const update = () => {
    const active = !!document.fullscreenElement;
    // Solo icono, para que ocupe poco (el autor 2026-11-13); el nombre va en la etiqueta accesible y en el título.
    const label = active ? 'Salir de pantalla completa' : 'Pantalla completa';
    button.innerHTML = svg(active ? mdiFullscreenExit : mdiFullscreen);
    button.setAttribute('aria-label', label);
    button.title = label;
    button.setAttribute('aria-pressed', String(active));
    button.disabled = pending;
  };
  const changed = () => {
    status.hidden = true;
    update();
  };
  const toggle = async () => {
    if (pending) return;
    pending = true;
    status.hidden = true;
    update();
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    } catch {
      status.textContent = 'No se ha podido cambiar la pantalla completa. Puedes volver a intentarlo.';
      status.hidden = false;
    } finally {
      pending = false;
      update();
    }
  };

  button.addEventListener('click', toggle);
  document.addEventListener('fullscreenchange', changed);
  document.body.append(button, status);
  update();
  return () => {
    button.removeEventListener('click', toggle);
    document.removeEventListener('fullscreenchange', changed);
    button.remove();
    status.remove();
  };
}
