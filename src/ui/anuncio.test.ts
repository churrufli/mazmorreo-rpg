import { foeList, plural } from './anuncio';

test('agrupa los enemigos repetidos del cartel de combate', () => {
  expect(foeList(['Enjambre de murciélagos 1', 'Enjambre de murciélagos 2'])).toBe('Dos enjambres de murciélagos');
  expect(foeList(['Goblin cocinero 1', 'Goblin cocinero 2', 'Cocinero mayor'])).toBe('Dos goblins cocineros y cocinero mayor');
  expect(foeList(['Xiximanter', 'Goblin sirviente 1', 'Goblin sirviente 2'])).toBe('Xiximanter y dos goblins sirvientes');
  expect(foeList(['Falso rey', 'Esposa del falso rey'])).toBe('Falso rey y esposa del falso rey');
});

test('plurales de los nombres de las aventuras', () => {
  expect(plural('Guardián de hueso')).toBe('Guardianes de hueso');
  expect(plural('Hongo chillón')).toBe('Hongos chillones');
  expect(plural('Carcelero goblin')).toBe('Carceleros goblin');
  expect(plural('Mefit de hielo')).toBe('Mefits de hielo');
  expect(plural('Acólitos de Orvane')).toBe('Acólitos de Orvane');
  expect(plural('Árbol ahogado')).toBe('Árboles ahogados');
});
