import type { Game } from './engine/game';

// Almacenamiento independiente del Android: nunca se sincronizan partidas entre dispositivos.
const prefix = 'mazmorreo:';
const get = (key: string) => { try { return window.localStorage.getItem(prefix + key); } catch { return null; } };
const set = (key: string, value: string) => { try { window.localStorage.setItem(prefix + key, value); } catch {} };
const del = (key: string) => { try { window.localStorage.removeItem(prefix + key); } catch {} };
export const SLOTS = [1, 2, 3];
export function save(g: Game) { g.savedAt = Date.now(); set('slot:' + g.slot, JSON.stringify(g)); }
export function load(slot: number): Game | undefined {
  const raw = get('slot:' + slot);
  if (!raw) return undefined;
  try { const g = JSON.parse(raw) as Game; g.log ??= []; return g; } catch { return undefined; }
}
export function remove(slot: number) { del('slot:' + slot); del('slotname:' + slot); }
export const slotName = (slot: number) => get('slotname:' + slot) || 'Archivo ' + slot;
export const setSlotName = (slot: number, name: string) => name.trim() ? set('slotname:' + slot, name.trim()) : del('slotname:' + slot);
export const getFlag = (k: string) => get('opt:' + k) !== 'off';
export const setFlag = (k: string, on: boolean) => set('opt:' + k, on ? 'on' : 'off');
export const getLevel = (k: string, def: number) => { const v = Number(get('vol:' + k)); return get('vol:' + k) !== null && v >= 0 && v <= 10 ? v : def; };
export const setLevel = (k: string, v: number) => set('vol:' + k, String(v));
export const getZoom = () => { const v = Number(get('opt:zoom')); return v >= 0.5 && v <= 2.2 ? v : 1.4; };
export const setZoom = (v: number) => set('opt:zoom', String(v));
export const getDev = () => get('opt:dev') === 'on';
export const setDev = (on: boolean) => set('opt:dev', on ? 'on' : 'off');
export const seenAction = (k: string) => get('seen:' + k) === '1';
export const markAction = (k: string) => set('seen:' + k, '1');
