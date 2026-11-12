# Cómo colaborar

¡Gracias por querer ayudar con Mazmorreo! Se aceptan aportaciones de código, narrativa, arte, equilibrio y diseño. Puedes trabajar a mano o con tu asistente de IA.

## Antes de empezar

1. Busca en los [issues](../../issues) si ya hay algo parecido. Los que llevan `buena primera tarea` son un buen punto de partida.
2. Si es algo grande, abre antes un issue para hablarlo.
3. Haz un fork, crea una rama desde `master` y abre una PR contra `master`.
4. Una PR, un cambio. Mejor varias PR pequeñas que una enorme.

## Reglas para todos

- **Español de España** en textos, commits y PR.
- **Cambio mínimo**: resuelve lo que dice el issue, sin refactorizar lo demás.
- **Licencias**: al enviar una PR aceptas que tu aportación se publique con la licencia que le corresponde ([LICENSE](LICENSE) para el código, [LICENSE-CONTENIDO.md](LICENSE-CONTENIDO.md) para arte y textos). Solo envía lo que tengas derecho a compartir.
- **Reglas de D&D**: solo material del SRD 5.2.1. Nada de criaturas, conjuros, lugares ni nombres de otros libros de Wizards of the Coast. No uses la marca «Dungeons & Dragons».
- **IA**: puedes usarla. Indica en la PR qué herramienta usaste y revisa tú el resultado antes de enviarlo.

## Colaborar con un asistente de IA

El repositorio ya está preparado para que una IA entienda el proyecto:

- [CLAUDE.md](CLAUDE.md) y [AGENTS.md](AGENTS.md): reglas generales. Claude Code lee `CLAUDE.md` solo; Codex y otros leen `AGENTS.md`.
- `.claude/rules/`: reglas de código, aventuras y textos.
- `.claude/commands/validar.md`: la validación que debe pasar toda PR.
- `.claude/agents/`: revisores de código y de equilibrio.
- [docs/GUIA_CONTENIDOS.md](docs/GUIA_CONTENIDOS.md): narrativa y equilibrio.

La guía completa, con plantillas por área para copiar y pegar, está en [docs/COLABORAR_CON_IA.md](docs/COLABORAR_CON_IA.md). Copilot lee `.github/copilot-instructions.md` y Gemini CLI, `GEMINI.md`.

## Por áreas

| Área | Qué se puede aportar | Dónde mirar |
| --- | --- | --- |
| Código | Fallos, rendimiento, versión web, pruebas | `src/engine/`, `src/screens/`, `src/ui/`, `.claude/rules/codigo.md` |
| Narrativa | Escenas, diálogos, charlas, secretos entre aventuras, correcciones | `src/data/*.json`, `src/data/charlas.json`, `.claude/rules/textos.md`, `docs/GUIA_CONTENIDOS.md` |
| Estrategia de combate | Tácticas de los enemigos, acciones, conjuros, estados, objetivos opcionales | `src/engine/combat.ts` (tipos de IA en `src/data/srd.ts`), `docs/flujo-combate-y-textos.md` |
| Exploración del mapa | Mapas hexagonales, niebla, secretos, trampas, obstáculos, descansos | `src/engine/dungeon.ts`, `src/screens/Explore.tsx`, `scripts/generar-plano.mjs` |
| Jugabilidad | Progresión, economía, tienda, posada, aliados y afinidad, nuevas aventuras | `src/engine/aventuras.ts`, `src/engine/rules.ts`, `src/engine/posada.ts`, `src/screens/Town.tsx` |
| Interfaz y usabilidad | Botones, legibilidad en móvil en vertical, accesibilidad, modo horizontal (aún no previsto) | `src/ui/`, `src/screens/`, `docs/estudio-usabilidad-combate.md` |
| Equilibrio y diseño | Encuentros, recompensas, criaturas del SRD, dificultad | `.claude/rules/aventuras.md`, `scripts/validar-aventuras.mjs`, `src/engine/equilibrio.test.ts` |
| Arte | Ilustraciones, fondos, objetos, iconos | `assets/img/` (WebP), `scripts/convertir-arte.sh` |
| Sonido | Efectos y música | Solo CC0 o CC BY, con autor y enlace en `CREDITS.md` |

### Textos

- Segunda persona del plural para el grupo («entráis», «veis»).
- Frases cortas, legibles en un móvil.
- Sin cantidades exactas de enemigos en la narración.
- Nombres propios tal y como están en las aventuras.

### Arte

Lee la [guía de arte](docs/GUIA_ARTE.md) y adjunta al generador la [imagen maestra](docs/arte/referencia-maestra.png), que marca el estilo de todo el juego.

- Pintura digital semirrealista, sin estética infantil ni anime.
- Cartas de personajes y enemigos con fondo neutro (penumbra, sin rocas ni muros) para poder reutilizarlas.
- Formato vertical 2:3 para personajes, convertido a WebP como explica la guía.
- Si es IA, di qué herramienta. No uses imágenes de otros artistas ni de juegos existentes como base.

### Sonido

Todo el audio es libre (CC0 o CC BY) y está en `android/app/src/main/res/raw/`. Para cambiar un sonido, sustituye el archivo con el mismo nombre que usa `src/sonido.ts` (OGG; efectos en mono) y actualiza su línea en `CREDITS.md` con autor, enlace y licencia. Nada de packs que prohíban redistribuir los archivos ni de música generada con planes gratuitos de IA.

## Validación

Antes de abrir la PR:

```bash
npm ci
npx tsc --noEmit
npm test -- --ci --runInBand
node scripts/validar-aventuras.mjs src/data/hondaroca.json src/data/corazon.json src/data/montana.json
npm run web:build
```

La PR se valida además en GitHub Actions con pruebas de combate en navegador.

## Qué no hace falta

- No subas APK ni cambies el número de versión: las APK las publica el responsable del proyecto.
- No toques `.github/workflows/` salvo que el issue lo pida.

## Conducta

Este proyecto sigue el [código de conducta](CODE_OF_CONDUCT.md).
