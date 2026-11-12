import { createHero, itemOwnership, newItem } from './rules';

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
