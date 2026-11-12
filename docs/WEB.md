# Mazmorreo en navegador

Mazmorreo está pensado para jugar en Android con el móvil en vertical (la app va bloqueada en vertical); la versión web sirve para probarlo en el navegador y se publica en GitHub Pages. Reutiliza las pantallas, el motor de reglas y las tres aventuras de Android mediante React Native Web y Vite.

## Ejecutar y compilar

```bash
npm ci
npm run web
npm run web:build
```

El servidor muestra la dirección local. La compilación estática queda en `dist/index.html` y `dist/assets/`, lista para servir por HTTPS, también bajo una subcarpeta. No abrir el HTML directamente desde el disco.

## Adaptadores

- `src/storage.web.ts`: tres ranuras en localStorage, independientes de Android. Las partidas pertenecen a cada navegador y origen; borrar los datos del sitio las elimina.
- `web/Sound.ts`: reproduce los OGG originales mediante HTMLAudioElement y reutiliza la mezcla, música, ambiente y efectos del juego. El audio empieza tras el primer toque o pulsación, de acuerdo con las reglas del navegador.
- `src/platform.web.ts`: botón Menú y tecla Escape con la misma confirmación de salida del juego. Fuera de combate también se guarda al dejar la pestaña. En combate se conserva el último guardado.
- `scripts/generar-assets-web.mjs`: genera imports de las ilustraciones sin modificar el registro Metro de Android.
- `web/style.css`: mismas fuentes e ilustraciones, pantalla vertical centrada en móviles y disposición a ancho completo en portátiles y tabletas apaisadas, sin deformar las imágenes.
- Vite selecciona las implementaciones web de SVG y safe-area y evita cargar módulos nativos.

## Verificación

```bash
npx tsc --noEmit
npm test -- --runInBand
npm run validate:adventures
npm run web:build
npx playwright install chromium
npx vite preview --host 127.0.0.1 --port 5173
# En otra terminal:
npm run web:test
```

`web:test` prueba en Chromium a 390×844, 1280×800, 1024×768 y 844×390 píxeles: creación del héroe, introducción, pueblo, mapa, guardado, salida, recarga y recuperación. Falla ante errores JavaScript o recursos HTTP fallidos. `WEB_URL` permite usar otro servidor.

## Publicación en GitHub Pages

La web se publica en **https://churrufli.github.io/mazmorreo-rpg/** con el workflow `.github/workflows/pages.yml`. Se ejecuta al actualizar `master` (también al fusionar una PR) o a mano desde **Actions → Web en GitHub Pages → Run workflow**.

- Solo se publica desde el repositorio `churrufli/mazmorreo-rpg`; en forks y en otros repositorios el trabajo se salta.
- En **Settings → Pages**, la fuente debe ser **GitHub Actions**.
- Es una web estática: no hay servidor, cuentas ni datos de jugadores. Las partidas se guardan en el navegador de cada persona.
