// Reglas del SRD 5.2.1 en la Tumba (2026-11-27): Dividirse, maldición de la momia y mirada petrificadora.
import { newGame, Game } from './game';
import { enterZone } from './dungeon';
import { actionsFor, applyDamage, Combat, endTurn, enemyTurn, fearOf, perform, preview, startCombat, Unit } from './combat';
import { itemOutside } from './dungeon';
import { longRest, shortRest } from './rules';

function fight(id: string, zone = id.slice(0, 2)): { g: Game; cb: Combat; foe: Unit; hero: Unit } {
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  g.rng.seed = 5;
  enterZone(g, zone);
  const cb = startCombat(g, id);
  return { g, cb, foe: cb.units.find(u => u.side === 'enemy')!, hero: cb.units.find(u => u.side === 'party')! };
}

describe('la Tumba con sus reglas', () => {
  it('el pudin negro se divide con daño cortante y sigue inmune', () => {
    const { g, cb, foe, hero } = fight('s2_e06');
    const hp = foe.hp;
    applyDamage(g, cb, foe, 8, 'cortante', hero);
    const halves = cb.units.filter(u => u.mon === 'Black Pudding' && !u.dead);
    expect(halves).toHaveLength(2);
    expect(halves.every(u => u.hp === Math.floor(hp / 2))).toBe(true);
    expect(cb.goal?.status).toBe('fail');
  });

  it('las mitades pequeñas ya no se dividen', () => {
    const { g, cb, foe, hero } = fight('s2_e06');
    applyDamage(g, cb, foe, 1, 'cortante', hero);
    applyDamage(g, cb, foe, 1, 'cortante', hero);
    applyDamage(g, cb, foe, 1, 'cortante', hero);
    expect(foe.splits).toBe(2);
  });

  it('la maldición de la momia deja la curación en la mitad hasta el templo', () => {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    const c = g.party[0];
    c.cursed = true;
    c.hp = 1;
    c.hitDice = 0;
    shortRest(c, g.rng);
    expect(c.hp).toBe(1);
    longRest(c);
    expect(c.hp).toBe(1 + Math.floor((c.maxHp - 1) / 2));
    expect(c.hp).toBeLessThan(c.maxHp);
  });

  it('la mirada del basilisco apresa y, si se vuelve a fallar, petrifica', () => {
    let stone = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const { g, cb, foe, hero } = fight('s3_e05');
      g.rng.seed = seed;
      hero.row = 'front';
      cb.turn = cb.order.indexOf(foe.key);
      foe.plan = undefined;
      enemyTurn(g, cb);
      if (!hero.stoning) continue;
      cb.turn = cb.order.indexOf(hero.key);
      endTurn(g, cb);
      if (hero.petrified) {
        stone++;
        expect(hero.dead).toBe(true);
        expect(g.party[0].petrified ?? true).toBe(true);
      }
    }
    expect(stone).toBeGreaterThan(0);
  });

  it('la mirada espantosa de la momia asusta: desventaja y no se le acerca', () => {
    let scared = 0, safe = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const { g, cb, foe, hero } = fight('s2_e02');
      g.rng.seed = seed;
      hero.row = 'back';
      foe.row = 'front';
      cb.turn = cb.order.indexOf(foe.key);
      foe.plan = undefined;
      enemyTurn(g, cb);
      if (hero.glareSafe?.includes(foe.key)) safe++;
      if (!fearOf(cb, hero) || !hero.hp) continue;
      scared++;
      cb.turn = cb.order.indexOf(hero.key);
      cb.moved = cb.acted = cb.bonus = false;
      expect(actionsFor(g, cb).some(a => a.id === 'row')).toBe(false);
      const atk = actionsFor(g, cb).find(a => a.id.startsWith('atk:'))!;
      expect(preview(g, cb, atk, foe)?.why.join(' ')).toContain('asustado');
    }
    expect(scared).toBeGreaterThan(0);
    expect(safe).toBeGreaterThan(0);
  });

  it('la forma corrosiva del pudin quema a quien le acierta y corroe su arma', () => {
    const { g, cb, foe, hero } = fight('s2_e06');
    hero.row = foe.row = 'front';
    cb.turn = cb.order.indexOf(hero.key);
    const atk = actionsFor(g, cb).find(a => a.id.startsWith('atk:'))!;
    let tries = 0;
    while (!hero.corroded && tries++ < 30) {
      cb.acted = false;
      hero.hp = hero.maxHp;
      perform(g, cb, atk, foe.key);
    }
    expect(hero.corroded).toBeDefined();
    expect(Object.values(hero.corroded!)[0]).toBe(1);
    expect(cb.log.some(l => l.t.includes('forma corrosiva'))).toBe(true);
  });

  it('el pepino azul devuelve la carne a quien se volvió piedra', () => {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    const c = g.party[0];
    c.dead = c.petrified = true;
    c.hp = 0;
    c.items.push({ uid: 'pep', id: 'blue_cucumber' } as any);
    const t = itemOutside(g, c.id, 'pep', c.id);
    expect(t).toContain('vuelve a la carne');
    expect(c.dead).toBe(false);
    expect(c.petrified).toBe(false);
    expect(c.hp).toBeGreaterThan(0);
  });
});
