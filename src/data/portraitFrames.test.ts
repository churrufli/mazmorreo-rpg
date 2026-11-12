import { ADVS } from '../engine/aventuras';
import { MONSTERS, HERO_CLASSES } from './srd';
import { FACE, heroImg } from './caras';
import { hasPortraitFrame, PORTRAIT_FRAMES, portraitFrame } from './portraitFrames';
import type { ImgKey } from '../assets';

const heroes = HERO_CLASSES.flatMap(cls => (['human', 'elf', 'dwarf', 'halfling'] as const).flatMap(sp =>
  (['man', 'woman'] as const).map(sex => heroImg(cls, sp, sex))));
const images = [...new Set<ImgKey>([...heroes, ...Object.values(ADVS).flatMap(a => Object.values(a.faces)),
  ...Object.values(MONSTERS).map(m => m.img), ...Object.keys(PORTRAIT_FRAMES) as ImgKey[]])];

test.each(images)('%s tiene encuadre facial y cubre el círculo sin huecos', img => {
  expect(hasPortraitFrame(img)).toBe(true);
  const frame = portraitFrame(img, 64);
  expect(frame.x).toBeLessThanOrEqual(0);
  expect(frame.y).toBeLessThanOrEqual(0);
  expect(frame.x + frame.width).toBeGreaterThanOrEqual(64 - 1e-8);
  expect(frame.y + frame.height).toBeGreaterThanOrEqual(64 - 1e-8);
  expect(frame.width / frame.height).toBeCloseTo(2 / 3);
  const [fx, fy] = PORTRAIT_FRAMES[img] ?? FACE[img]!;
  const x = frame.x + fx * frame.width, y = frame.y + fy * frame.height;
  expect(Math.hypot(x - 32, y - 32)).toBeLessThan(64 * 0.18);
});

test.each([24, 32, 40, 64, 84, 128])('el mismo encuadre se mantiene al cambiar a %s píxeles', size => {
  for (const img of images) {
    const base = portraitFrame(img, 64), scaled = portraitFrame(img, size);
    for (const key of ['x', 'y', 'width', 'height'] as const) expect(scaled[key] / size).toBeCloseTo(base[key] / 64);
  }
});

test('las versiones en gris usan la misma cara y los objetos conservan su encuadre general', () => {
  expect(portraitFrame('gris_goblin_espada', 64)).toEqual(portraitFrame('goblin_espada', 64));
  expect(hasPortraitFrame('escena_dos_valvulas')).toBe(false);
  const before = JSON.stringify(FACE);
  images.forEach(img => portraitFrame(img, 64));
  expect(JSON.stringify(FACE)).toBe(before);
});
