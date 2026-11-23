import { compareItem, createHero, itemOwnership, newItem } from './rules';

test('la compra indica cuando ningún personaje tiene el objeto', () => {
  const hero = createHero('Brakka', 'fighter', 'human');
  expect(itemOwnership([hero], 'potion_healing')).toBe('Ningún personaje tiene este objeto.');
});

test('la compra identifica todos los propietarios y sus unidades sin modificar inventarios', () => {
  const hero = createHero('Brakka', 'fighter', 'human');
  const ally = createHero('Tiko Manosrápidas', 'rogue', 'halfling');
  hero.items.push(newItem('potion_healing'), newItem('potion_healing'));
  ally.items.push(newItem('potion_healing'));
  const party = [hero, ally];
  const before = JSON.stringify(party);
  expect(itemOwnership(party, 'potion_healing')).toBe('Ya lo tienen: Brakka ×2, Tiko Manosrápidas ×1.');
  expect(JSON.stringify(party)).toBe(before);
});

test('el aviso también cuenta equipo que un personaje ya lleva', () => {
  const hero = createHero('Brakka', 'fighter', 'human');
  expect(itemOwnership([hero], 'longsword')).toBe('Ya lo tienen: Brakka ×1.');
});

test('comparar equipo: la CA con y sin la armadura, y el arma frente a la que lleva', () => {
  const hero = createHero('Brakka', 'fighter', 'human');
  hero.items = [newItem('leather'), newItem('dagger')];
  const before = JSON.stringify(hero);
  expect(compareItem(hero, 'chain_mail')).toMatch(/^Su CA pasaría de \d+ a \d+\.$/);
  expect(compareItem(hero, 'leather')).toMatch(/^No le mejora la CA/);
  expect(compareItem(hero, 'longsword')).toMatch(/Ahora usa Daga/);
  expect(compareItem(hero, 'shortbow')).toMatch(/No lleva otra arma a distancia/);
  expect(compareItem(hero, 'leather', hero.items[0].uid)).toMatch(/^Le da CA/);
  expect(compareItem(hero, 'potion_healing')).toBeUndefined();
  expect(JSON.stringify(hero)).toBe(before);
});
