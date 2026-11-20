// Objetos contra una amenaza concreta (veneno, fuego, no muertos, basilisco...): solo se ofrecen en las
// tiendas y se guardan en los cofres de las aventuras donde algún enemigo la trae (el autor 2026-11-20).
import { MONSTERS } from '../data/srd';
import { ADVS, AdvId, TOWNS, TownId } from './aventuras';

/** Amenaza de la que protege cada objeto: un tipo de daño, los no muertos o una criatura concreta. */
export const COUNTERS: Record<string, string> = {
  antidote: 'veneno',
  potion_poison_resistance: 'veneno',
  potion_resistance_fire: 'fuego',
  potion_resistance_necrotic: 'necrótico',
  potion_resistance_acid: 'ácido',
  cold_resistance_potion: 'frío',
  holy_water: 'undead',
  steel_mirror: 'Basilisk',
};

const THREATS = new Map<AdvId, Set<string>>();
/** Lo que traen los enemigos de una aventura (también sus variantes): tipos de daño, «undead» y sus nombres del SRD. */
export function threats(adv: AdvId): Set<string> {
  const cached = THREATS.get(adv);
  if (cached) return cached;
  const out = new Set<string>();
  const walk = (o: unknown): void => {
    if (Array.isArray(o)) return o.forEach(walk);
    if (!o || typeof o !== 'object') return;
    const c = (o as { srd_creature?: string }).srd_creature;
    const m = c ? MONSTERS[c] : undefined;
    if (c && m) {
      out.add(c);
      if (m.ai === 'undead') out.add('undead');
      for (const a of m.attacks) { out.add(a.type); if (a.extra) out.add(a.extra.type); }
    }
    Object.values(o).forEach(walk);
  };
  walk(ADVS[adv].data.zones);
  THREATS.set(adv, out);
  return out;
}

/** Si un objeto sirve en una aventura: los generales siempre; los de una amenaza, solo si está allí. */
export const usefulIn = (id: string, adv: AdvId) => !COUNTERS[id] || threats(adv).has(COUNTERS[id]);

/** Lo que vende la tienda de un pueblo: lo suyo que sirva en su aventura y los remedios de lo que hay allí. */
export function shopStock(town: TownId): string[] {
  const adv = TOWNS[town].adv;
  const base = TOWNS[town].stock.filter(id => usefulIn(id, adv));
  const extra = Object.keys(COUNTERS).filter(id => usefulIn(id, adv) && !base.includes(id));
  return [...base, ...extra];
}
