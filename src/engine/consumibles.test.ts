// Consumibles variados del SRD 5.2.1 en los cofres (el autor 2026-11-19).
import { newGame, Game } from './game';
import { newItem, score, weaponStat } from './rules';
import { Combat, actionsFor, applyDamage, current, enemyTurn, perform, startCombat, targetsFor, withDice } from './combat';
import { ClassId, ITEMS } from '../data/srd';
import H from '../data/hondaroca.json';
import C from '../data/corazon.json';
import M from '../data/montana.json';
import T from '../data/tumba.json';

/** Combate de la zona 1 de Hondaroca con el héroe en su turno y el objeto en la mochila. */
function setup(item: string, cls: ClassId = 'fighter'): { g: Game; cb: Combat } {
  const g = newGame(1, 'Prueba', cls, 'human');
  g.rng.seed = 7919;
  g.party[0].items.push(newItem(item));
  const cb = startCombat(g, 'z1_e01');
  for (let i = 0; i < 20 && current(cb).side === 'enemy' && !cb.result; i++) withDice(cb, () => enemyTurn(g, cb));
  return { g, cb };
}
/** Acción por su prefijo; las de objetos, la del objeto nuevo (el héroe ya lleva una poción de curación). */
const act = (g: Game, cb: Combat, prefix: string) => {
  const uid = g.party[0].items[g.party[0].items.length - 1]?.uid;
  return actionsFor(g, cb).find(a => a.id.startsWith(prefix) && (!a.id.includes(':') || prefix.startsWith('atk') || prefix.startsWith('haste') || a.id.endsWith(`:${uid}`)))!;
};
const hero = (cb: Combat) => cb.units.find(u => u.side === 'party')!;
const foe = (cb: Combat) => cb.units.find(u => u.side === 'enemy' && u.hp > 0)!;

describe('consumibles nuevos', () => {
  it('todos los objetos de los cofres y las tiendas existen', () => {
    const ids: string[] = [];
    const walk = (o: any) => {
      if (Array.isArray(o)) o.forEach(walk);
      else if (o && typeof o === 'object') { if (o.type === 'chest' && o.item?.id) ids.push(o.item.id); Object.values(o).forEach(walk); }
    };
    [H, C, M, T].forEach(walk);
    const shops = [...Object.values(C.shops), ...Object.values(M.shops), ...Object.values(T.shops)].filter(Array.isArray).flat() as string[];
    for (const id of ['potion_speed', 'potion_heroism', 'oil_flask', 'basic_poison']) expect(ids).toContain(id);
    for (const id of shops) expect(ITEMS[id]).toBeDefined();
  });

  it('la poción de velocidad da +2 CA y un ataque más después de la acción', () => {
    const { g, cb } = setup('potion_speed');
    const u = hero(cb), ac = u.ac;
    withDice(cb, () => perform(g, cb, act(g, cb, 'potion:'), u.key));
    expect(u.ac).toBe(ac + 2);
    expect(act(g, cb, 'haste:')).toBeUndefined();
    withDice(cb, () => perform(g, cb, act(g, cb, 'atk:'), foe(cb).key));
    if (cb.result) return;
    const extra = act(g, cb, 'haste:');
    expect(extra).toBeDefined();
    withDice(cb, () => perform(g, cb, extra, foe(cb)?.key));
    expect(act(g, cb, 'haste:')).toBeUndefined();
  });

  it('la poción de heroísmo da 10 PG temporales y +1d4', () => {
    const { g, cb } = setup('potion_heroism');
    const u = hero(cb);
    withDice(cb, () => perform(g, cb, act(g, cb, 'potion:'), u.key));
    expect(u.temp).toBe(10);
    expect(u.heroism).toBe(true);
  });

  it('la poción de fuerza de gigante deja la Fuerza en 21 solo durante el combate', () => {
    const { g, cb } = setup('potion_giant_strength');
    const c = g.party[0], before = weaponStat(c, 'longsword').toHit;
    withDice(cb, () => perform(g, cb, act(g, cb, 'potion:'), hero(cb).key));
    expect(score(c, 'str')).toBe(21);
    expect(weaponStat(c, 'longsword').toHit).toBeGreaterThan(before);
    withDice(cb, () => perform(g, cb, act(g, cb, 'flee'), undefined));
    expect(c.giantStr).toBeUndefined();
  });

  it('las pociones de resistencia parten el daño de su tipo', () => {
    const { g, cb } = setup('potion_resistance_fire');
    const u = hero(cb);
    withDice(cb, () => perform(g, cb, act(g, cb, 'potion:'), u.key));
    const hp = u.hp;
    applyDamage(g, cb, u, 4, 'fuego', foe(cb));
    expect(hp - u.hp).toBe(2);
  });

  it('el aceite suma 5 al siguiente daño de fuego', () => {
    const { g, cb } = setup('oil_flask');
    const e = foe(cb);
    e.oiled = true;
    e.hp = e.maxHp = 50;
    applyDamage(g, cb, e, 1, 'fuego', hero(cb));
    expect(e.hp).toBe(44);
    expect(e.oiled).toBe(false);
  });

  it('el polvo de desaparición vuelve invisible al grupo hasta que ataca', () => {
    const { g, cb } = setup('dust_disappearance');
    withDice(cb, () => perform(g, cb, act(g, cb, 'dust:'), undefined));
    expect(hero(cb).invisible).toBe(true);
  });

  it('el elixir de salud solo se ofrece a quien está envenenado o paralizado', () => {
    const { g, cb } = setup('elixir_health');
    const a = act(g, cb, 'potion:');
    expect(targetsFor(cb, a)).toHaveLength(0);
    hero(cb).poisoned = true;
    expect(targetsFor(cb, a)).toHaveLength(1);
  });

  it('el pergamino lanza el conjuro sin gastar espacio y solo para su clase', () => {
    expect(act(setup('scroll_magic_missile').g, setup('scroll_magic_missile').cb, 'scroll:')).toBeUndefined();
    const { g, cb } = setup('scroll_magic_missile', 'wizard');
    const c = g.party[0], slots = [...c.slots];
    withDice(cb, () => perform(g, cb, act(g, cb, 'scroll:'), foe(cb).key));
    expect(c.slots).toEqual(slots);
    expect(c.items.some(i => i.id === 'scroll_magic_missile')).toBe(false);
  });
});
