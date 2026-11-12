import { Action, Combat, actionsFor, autoTurn, current, targetsFor } from '../engine/combat';
import { Game } from '../engine/game';
import { ITEMS } from '../data/srd';

/** Tres categorías; esquivar, cambiar de fila y huir van fuera (fila fija, campo y barra de arriba). */
export type CombatGroup = 'attack' | 'skills' | 'items' | 'other';
const CANTRIPS = ['sacred_flame', 'fire_bolt', 'ray_frost'];
export function groupOf(a: Action): CombatGroup {
  const id = a.id.split(':')[0];
  if (['potion', 'throw', 'web', 'wand', 'scroll'].includes(id)) return 'items';
  if (['dodge', 'row', 'flee'].includes(id)) return 'other';
  return id === 'atk' || CANTRIPS.includes(id) ? 'attack' : 'skills';
}

/** Presentación únicamente: conserva las opciones gastadas, pero nunca las habilita. */
export function menuActionsFor(g: Game, cb: Combat): Action[] {
  if (cb.result || autoTurn(cb)) return [];
  const actual = new Map(actionsFor(g, cb).map(a => [a.id, a]));
  const candidates = new Map(actionsFor(g, { ...cb, acted: false, bonus: false, moved: false }).map(a => [a.id, a]));
  actual.forEach((a, id) => candidates.set(id, a));
  const u = cb.result ? undefined : current(cb);
  // Disparar desde la vanguardia con enemigos delante tiene desventaja (mismo criterio que el motor).
  const pressed = u?.row === 'front' && cb.units.some(x => x.side === 'enemy' && x.row === 'front' && !x.dead && !x.fled && x.hp > 0);
  return [...candidates.values()].map(a => {
    const shown = actual.get(a.id) ?? {
      ...a,
      off: a.cost === 'action' && cb.acted ? 'Ya has utilizado la acción de este turno.'
        : a.cost === 'bonus' && cb.bonus ? 'Ya has utilizado la acción adicional de este turno.'
        : a.cost === 'move' && cb.moved ? 'Ya has cambiado de fila este turno.'
        : a.off ?? 'Esta opción no está disponible ahora.',
    };
    const [k, arg] = a.id.split(':');
    return pressed && k === 'atk' && ITEMS[arg]?.weapon?.ranged ? { ...shown, detail: `${shown.detail ?? ''} · desventaja (enemigos delante)` } : shown;
  });
}

/** Ataque con arma que se usa al tocar directamente a un enemigo: el primero que lo alcance, cuerpo a cuerpo antes. */
export function quickAttack(g: Game, cb: Combat, targetKey: string): Action | undefined {
  if (cb.result || autoTurn(cb)) return undefined;
  const atks = actionsFor(g, cb).filter(a => a.id.startsWith('atk:') && !a.off && targetsFor(cb, a).some(t => t.key === targetKey));
  return atks.find(a => a.target === 'enemy-melee') ?? atks[0];
}
