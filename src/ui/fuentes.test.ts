// Cada fuente del tema existe en Android (assets/fonts, con su licencia) y está declarada en la web.
import { F } from '../theme';

declare const require: (m: string) => any;
declare const __dirname: string;
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', '..');
const fonts = path.join(root, 'android/app/src/main/assets/fonts');
const css = fs.readFileSync(path.join(root, 'web/style.css'), 'utf8');

test.each(Object.values(F))('la fuente %s está en Android y en la web', (name: string) => {
  expect(fs.existsSync(path.join(fonts, `${name}.ttf`))).toBe(true);
  expect(css).toContain(`font-family:${name};`);
});

test('Inter lleva su licencia OFL junto a las fuentes', () => {
  expect(fs.readFileSync(path.join(fonts, 'OFL-Inter.txt'), 'utf8')).toContain('SIL Open Font License');
});
