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
    button.textContent = active ? 'Salir de pantalla completa' : 'Pantalla completa';
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
