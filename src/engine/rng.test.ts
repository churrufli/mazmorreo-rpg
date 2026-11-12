import { roll, die } from './rng';

test('roll respeta los límites', () => {
  const r = { seed: 42 };
  for (let i = 0; i < 500; i++) {
    const v = roll(r, '2d4+2');
    expect(v).toBeGreaterThanOrEqual(4);
    expect(v).toBeLessThanOrEqual(10);
    const d = die(r, 20);
    expect(d).toBeGreaterThanOrEqual(1);
    expect(d).toBeLessThanOrEqual(20);
  }
  expect(roll(r, '3')).toBe(3);
  expect(roll(r, '1d1-1')).toBe(0);
});

test('misma semilla, mismas tiradas', () => {
  const a = { seed: 7 }, b = { seed: 7 };
  expect([roll(a, '1d20'), roll(a, '1d20')]).toEqual([roll(b, '1d20'), roll(b, '1d20')]);
});
