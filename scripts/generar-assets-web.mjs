// Convierte el registro require() de Metro en imports de Vite.
// No modifica el registro original de Android.
import { readFileSync, writeFileSync } from 'node:fs';
const input = readFileSync('src/assets.ts', 'utf8');
const matches = [...input.matchAll(/^\s*(\w+): require\('([^']+)'\),?$/gm)];
if (!matches.length) throw new Error('No se encontraron imágenes en src/assets.ts');
const imports = matches.map((m, i) => `import asset${i} from '${m[2]}';`).join('\n');
const entries = matches.map((m, i) => `  ${m[1]}: { uri: asset${i} },`).join('\n');
writeFileSync('src/assets.web.ts', `// Generado automáticamente. No editar.\n${imports}\nexport const IMG = {\n${entries}\n};\nexport type ImgKey = keyof typeof IMG;\n`);
console.log(`Generadas ${matches.length} referencias de arte web`);
