import { createMMKV } from 'react-native-mmkv';
import type { Game } from './engine/game';

const kv = createMMKV({ id: 'mazmorreo' });
export const SLOTS = [1, 2, 3];

export function save(g: Game) {
  g.savedAt = Date.now();
  kv.set(`slot:${g.slot}`, JSON.stringify(g));
}

export function load(slot: number): Game | undefined {
  const s = kv.getString(`slot:${slot}`);
  if (!s) return undefined;
  try {
    const g = JSON.parse(s) as Game;
    g.log ??= []; // partidas guardadas antes de la v0.7
    return g;
  } catch {
    return undefined;
  }
}

export function remove(slot: number) {
  kv.remove(`slot:${slot}`);
  kv.remove(`slotname:${slot}`);
}

/** Nombre que el jugador le pone a cada archivo de guardado («Archivo 1» si no tiene). */
export const slotName = (slot: number) => kv.getString(`slotname:${slot}`) || `Archivo ${slot}`;
export const setSlotName = (slot: number, name: string) => (name.trim() ? kv.set(`slotname:${slot}`, name.trim()) : kv.remove(`slotname:${slot}`));

/** Ajustes sencillos (sonido, música), activados por defecto. */
export const getFlag = (k: string) => kv.getString(`opt:${k}`) !== 'off';
export const setFlag = (k: string, on: boolean) => kv.set(`opt:${k}`, on ? 'on' : 'off');

/** Modo desarrollador: desactivado salvo que se haya introducido la clave en Ajustes. */
/** Volumen de 0 a 10 (música, ambiente, efectos). */
export const getLevel = (k: string, def: number) => { const v = Number(kv.getString(`vol:${k}`)); return kv.getString(`vol:${k}`) != null && v >= 0 && v <= 10 ? v : def; };
export const setLevel = (k: string, v: number) => kv.set(`vol:${k}`, String(v));
/** Zoom del mapa: se conserva entre pantallas y al cerrar el juego. */
export const getZoom = () => { const v = Number(kv.getString('opt:zoom')); return v >= 0.5 && v <= 2.2 ? v : 1.4; };
export const setZoom = (v: number) => kv.set('opt:zoom', String(v));
export const getDev = () => kv.getString('opt:dev') === 'on';
export const setDev = (on: boolean) => kv.set('opt:dev', on ? 'on' : 'off');

/** Acciones de combate cuya explicación ya ha visto cada personaje (la primera vez sale sola). */
export const seenAction = (k: string) => kv.getString(`seen:${k}`) === '1';
export const markAction = (k: string) => kv.set(`seen:${k}`, '1');
