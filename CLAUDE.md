# Mazmorreo

RPG de fantasía para Android (y versión web) basado en las reglas de quinta edición (2024) del **SRD 5.2.1**. Tres aventuras: Hondaroca, El Corazón Hueco y El Invierno del Dragón. Pensado para Android con el móvil en vertical; la web es para probarlo y va en GitHub Pages. Ver `README.md`.

## Tecnología

- React Native 0.81 + TypeScript, Zustand, MMKV. Web con react-native-web y Vite.
- `src/engine/`: motor puro (combate, mazmorra, reglas, escenas) con tests junto al código.
- `src/data/`: aventuras (`hondaroca.json`, `corazon.json`, `montana.json`), charlas, ayuda y SRD.
- `src/screens/` y `src/ui/`: pantallas y componentes.
- `scripts/`: validación de aventuras, conversión de arte y pruebas en navegador.
- `docs/GUIA_CONTENIDOS.md`: convenciones de narrativa y equilibrio. Léela antes de tocar aventuras.
- `docs/GUIA_ARTE.md` y `docs/arte/referencia-maestra.png`: estilo y prompts para generar arte nuevo.
- Colaboración y licencias: `CONTRIBUTING.md`, `LICENSE-CONTENIDO.md`, `NOTICE.md` y `CREDITS.md`.
- El audio (`android/app/src/main/res/raw/`) es libre (CC0 y CC BY): cada archivo nuevo, con su autor y licencia en `CREDITS.md`.

## Reglas de trabajo

- Todo en **español**: textos, commits, PR y respuestas.
- **Rama buena: `master`.** Parte siempre de `origin/master` actualizado, trabaja en una rama y abre PR a master.
- **Nunca lances una APK sin orden expresa del responsable del proyecto (@churrufli).** Ni siquiera con `[release]` en un commit. Cómo hacerlo: skill `publicar-apk`.
- Cambio mínimo que resuelva lo pedido. Nada de refactorizar o «mejorar» lo que no se ha pedido.
- Si algo choca con una decisión anterior, avisa antes de cambiarlo.
- En el contenedor no hay SDK de Android: la APK solo se compila en GitHub Actions.

## Antes de abrir un PR

Ejecuta `/validar` (o lo mismo a mano):

```bash
npx tsc --noEmit
npm test -- --ci --runInBand
node scripts/validar-aventuras.mjs src/data/hondaroca.json src/data/corazon.json src/data/montana.json
npm run web:build
```

La validación de PR en CI hace además pruebas de combate en navegador (`scripts/probar-*.cjs`).

## Notas personales

`CLAUDE.local.md` (fuera de git) puede ampliar o cambiar estas reglas en tu equipo.
