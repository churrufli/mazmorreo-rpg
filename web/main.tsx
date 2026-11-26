import { mdiArrowLeft, mdiCogOutline, mdiFullscreen, mdiFullscreenExit, mdiKeyboardOutline, mdiMenu } from '@mdi/js';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App';
import './style.css';
import { fullscreenAvailable, isFullscreen, toggleFullscreen } from './fullscreen';
import { useStore } from '../src/store';
import * as storage from '../src/storage';

function saveProgress() {
  const { game, screen, combat } = useStore.getState();
  if (game && screen === 'game' && !combat) storage.save(game);
}
window.addEventListener('pagehide', saveProgress);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveProgress(); });
function WebGame() {
  const screen = useStore(s => s.screen);
  // Atrás del navegador en plena aventura: avisa antes de salir en vez de abandonar la página.
  const inAdventure = screen === 'game' || screen === 'intro';
  React.useEffect(() => {
    if (!inAdventure) return;
    history.pushState({ mazmorreo: true }, '');
    const onPop = () => { history.pushState({ mazmorreo: true }, ''); window.dispatchEvent(new Event('mazmorreo:back')); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [inAdventure]);
  return <><App topInset={36} /><WebMenu screen={screen} /></>;
}

const icon = (d: string) => <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d={d} /></svg>;

/** Menú único de la web (el autor 2026-11-25): pantalla completa, ajustes, atajos de teclado y volver al menú. */
function WebMenu({ screen }: { screen: string }) {
  const [open, setOpen] = React.useState(false);
  const [keys, setKeys] = React.useState(false);
  const [full, setFull] = React.useState(isFullscreen());
  const [fail, setFail] = React.useState(false);
  React.useEffect(() => {
    const changed = () => setFull(isFullscreen());
    document.addEventListener('fullscreenchange', changed);
    return () => document.removeEventListener('fullscreenchange', changed);
  }, []);
  // Con el menú abierto, Esc solo lo cierra (no cancela la acción del combate ni sale de la partida).
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); setOpen(false); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open]);
  const pick = (f: () => void) => () => { setOpen(false); setKeys(false); f(); };
  return (
    <>
      <button className="web-menu" aria-label="Menú" title="Menú" aria-expanded={open} onClick={() => { setOpen(!open); setKeys(false); setFail(false); }}>{icon(mdiMenu)}</button>
      {open ? <div className="web-menu-veil" onClick={() => setOpen(false)} /> : null}
      {open ? (
        <div className="web-menu-panel" role="menu">
          {fullscreenAvailable() ? (
            <button role="menuitem" onClick={async () => { const ok = await toggleFullscreen(); setFail(!ok); if (ok) setOpen(false); }}>
              {icon(full ? mdiFullscreenExit : mdiFullscreen)}{full ? 'Salir de pantalla completa' : 'Pantalla completa'}
            </button>
          ) : null}
          {fail ? <p className="web-menu-note">No se ha podido cambiar la pantalla completa. Puedes volver a intentarlo.</p> : null}
          <button role="menuitem" onClick={pick(() => window.dispatchEvent(new Event('mazmorreo:ajustes')))}>{icon(mdiCogOutline)}Ajustes</button>
          <button role="menuitem" aria-expanded={keys} onClick={() => setKeys(!keys)}>{icon(mdiKeyboardOutline)}Atajos de teclado</button>
          {keys ? (
            <p className="web-menu-note">
              <b>En combate:</b> del 1 al 9 usan las acciones de la categoría abierta, en el mismo orden que los botones. <b>Esc</b> cancela la acción elegida.<br />
              <b>En el mapa:</b> la rueda del ratón acerca y aleja.<br />
              <b>Esc</b> cierra este menú.
            </p>
          ) : null}
          {screen !== 'title' ? <button role="menuitem" onClick={pick(() => window.dispatchEvent(new Event('mazmorreo:back')))}>{icon(mdiArrowLeft)}Volver al menú</button> : null}
        </div>
      ) : null}
    </>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('No se encuentra #root');
createRoot(root).render(<React.StrictMode><WebGame /></React.StrictMode>);
