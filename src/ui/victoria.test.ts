import { victoryLines } from './victoria';

test('separa la subida de nivel, sus novedades y el resumen', () => {
  const r = victoryLines([
    'Todos los enemigos han caído.',
    'Cada miembro del grupo gana 100 PX.',
    '¡Hrothi sube a nivel 2! (+9 PG)',
    'Imposición de manos: +5 PG en la reserva de curación.',
    '¡Tiko Manosrápidas sube a nivel 2! (+7 PG)',
    'Nueva habilidad: Esconderse como acción adicional.',
    'Nueva habilidad: Oleada de acción. Permite realizar otra acción en el turno.',
    'Nivel 2 es el máximo en esta aventura: los PX de más no cuentan.',
    'Botín: 8 monedas de oro.',
    'Objetivo cumplido. Llegáis a tiempo.',
  ]);
  expect(r.map(x => x.kind)).toEqual(['plain', 'summary', 'level', 'feature', 'level', 'feature', 'feature', 'summary', 'summary', 'plain']);
  expect(r[2]).toEqual({ kind: 'level', title: '¡Hrothi sube a nivel 2!', hp: '+9 PG' });
  expect(r[3]).toEqual({ kind: 'feature', name: 'Imposición de manos', text: '+5 PG en la reserva de curación.' });
  expect(r[5]).toEqual({ kind: 'feature', tag: 'Nueva habilidad', name: 'Esconderse como acción adicional', text: '' });
  expect(r[6]).toEqual({ kind: 'feature', tag: 'Nueva habilidad', name: 'Oleada de acción', text: 'Permite realizar otra acción en el turno.' });
});

test('fuera de una subida de nivel las líneas con dos puntos no cambian', () => {
  expect(victoryLines(['Aviso: algo pasa.'])).toEqual([{ kind: 'plain', text: 'Aviso: algo pasa.' }]);
});
