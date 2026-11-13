import { mdiMenu } from '@mdi/js';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App';
import './style.css';
import { installFullscreenControl } from './fullscreen';
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
  return <><App topInset={36} />{screen !== 'title' && <button className="web-back" aria-label="Volver al menú" title="Volver al menú" onClick={() => window.dispatchEvent(new Event('mazmorreo:back'))}><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d={mdiMenu} /></svg></button>}</>;
}

const removeFullscreenControl = installFullscreenControl();
if (import.meta.hot) import.meta.hot.dispose(removeFullscreenControl);

const root = document.getElementById('root');
if (!root) throw new Error('No se encuentra #root');
createRoot(root).render(<React.StrictMode><WebGame /></React.StrictMode>);
