import { buttonLabelLayout } from './buttonLabel';

test('TERMINAR TURNO se divide por palabras cuando el ancho no alcanza', () => {
  expect(buttonLabelLayout('TERMINAR TURNO', 100, 13)).toEqual({lines:['TERMINAR','TURNO'], fontSize:13});
  expect(buttonLabelLayout('TERMINAR TURNO', 150, 13)).toEqual({lines:['TERMINAR TURNO'], fontSize:13});
});

test.each(['HABILIDADES','ESQUIVAR','PALABRA DE CURACIÓN','ARCO LARGO +1','POCIÓN DE CURACIÓN ×2'])('%s conserva todo el texto en un máximo de dos líneas', text => {
  const result = buttonLabelLayout(text, 100, 13);
  expect(result.lines.length).toBeLessThanOrEqual(2);
  expect(result.lines.join('').replace(/\s/g,'')).toBe(text.replace(/\s/g,''));
  expect(result.fontSize).toBeGreaterThan(9);
  expect(result.fontSize).toBeLessThanOrEqual(13);
});

test.each(['HABILIDADES', 'ESCONDERSE'])('%s cabe en una línea con el ancho de un móvil estrecho', text => {
  // Botón de unos 158 px (pantalla de 320) menos los márgenes del icono y de la información.
  const result = buttonLabelLayout(text, 158 - 68, 12);
  expect(result.lines).toEqual([text]);
  expect(result.fontSize).toBeGreaterThanOrEqual(11);
});
