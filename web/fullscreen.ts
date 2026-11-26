/** Pantalla completa de la web, usada desde el menú único (web/main.tsx). La raíz completa mantiene visibles también los diálogos. */
export const fullscreenAvailable = () => !!document.fullscreenEnabled && !!document.documentElement.requestFullscreen;

export const isFullscreen = () => !!document.fullscreenElement;

/** Cambia la pantalla completa. Devuelve false si el navegador no lo ha permitido. */
export async function toggleFullscreen(): Promise<boolean> {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    return true;
  } catch {
    return false;
  }
}
