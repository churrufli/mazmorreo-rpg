// Copia el icono de la app como icono para instalar Mazmorreo desde la web.
import { copyFileSync, mkdirSync } from 'node:fs';
const dir = 'web/public/icons';
mkdirSync(dir, { recursive: true });
copyFileSync('android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png', `${dir}/icon-192.png`);
copyFileSync('web/icono-app-512.png', `${dir}/icon-512.png`);
