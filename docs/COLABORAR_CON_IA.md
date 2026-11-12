# Colaborar con tu IA

Mazmorreo se ha hecho así desde el principio: una persona decide qué quiere y una IA (Claude, ChatGPT, Codex…) lo programa, lo escribe o lo dibuja siguiendo las reglas del repositorio. Puedes colaborar igual, con la herramienta que uses.

## Cómo trabajamos

1. **Una petición, un cambio.** Cada mejora sale de un issue y acaba en una PR pequeña.
2. **La IA lee las reglas antes de tocar nada.** Están en [CLAUDE.md](../CLAUDE.md), [AGENTS.md](../AGENTS.md) y `.claude/rules/`.
3. **Cambio mínimo.** Se resuelve lo pedido y nada más: sin refactorizar ni «mejorar» lo que nadie ha pedido.
4. **Si algo choca con una decisión anterior, se avisa** antes de cambiarlo.
5. **Validación antes de la PR.** Ver [CONTRIBUTING.md](../CONTRIBUTING.md#validación).
6. **Una persona revisa siempre** lo que hizo la IA antes de enviarlo, y el responsable del proyecto decide qué se fusiona y cuándo sale una APK.

## Paso a paso

1. Elige un issue (mejor si lleva `buena primera tarea`) y di en él que lo coges.
2. Haz un fork, clónalo y crea una rama desde `master`.
3. Abre el repositorio con tu IA. Cada herramienta lee su archivo de instrucciones:

| Herramienta | Qué lee | Qué tienes que hacer |
| --- | --- | --- |
| Claude Code | `CLAUDE.md`, `.claude/rules/`, `.claude/commands/`, `.claude/agents/` | Nada: lo carga solo. Usa `/validar` antes de la PR |
| OpenAI Codex, Cursor, Aider, Jules y otros agentes | `AGENTS.md` | Nada: lo carga solo |
| GitHub Copilot | `.github/copilot-instructions.md` | Nada: lo carga solo |
| Gemini CLI | `GEMINI.md` | Nada: lo carga solo |
| ChatGPT, Claude o Gemini en el navegador | Lo que les pegues | Pega la plantilla de abajo y los archivos que vaya a tocar |

4. Pide el cambio con una de las plantillas de abajo.
5. Revisa el resultado, pasa la validación y abre la PR en español. Indica qué IA usaste.

## Plantillas para copiar

Cambia lo que va entre corchetes.

### Para empezar (cualquier área)

```text
Vas a colaborar en Mazmorreo, un RPG para Android y web en React Native, basado en el SRD 5.2.1.
Lee primero CLAUDE.md, AGENTS.md, CONTRIBUTING.md y .claude/rules/.
Tarea: [issue #N o descripción].
Reglas: todo en español de España; cambio mínimo; si algo choca con una decisión anterior, avísame antes;
solo material del SRD 5.2.1; nada de recursos con licencia dudosa.
Al terminar: pasa la validación de CONTRIBUTING.md y prepara el texto de la PR con qué cambia y cómo lo has comprobado.
```

### Corregir un fallo

```text
En Mazmorreo pasa esto: [qué haces, qué esperas y qué ocurre].
Busca la causa en src/engine/ o src/screens/, arréglala con el cambio mínimo y añade un test junto al código
(src/engine/*.test.ts) que falle sin el arreglo. Luego pasa la validación.
```

### Narrativa

```text
Revisa [escena o diálogo] de src/data/[hondaroca|corazon|montana].json.
Sigue .claude/rules/textos.md y docs/GUIA_CONTENIDOS.md: español de España, «vosotros» para el grupo,
frases cortas para móvil, sin cantidades exactas de enemigos y sin prometer objetos que no se ven en el mapa.
No cambies ids, encuentros ni recompensas. Pasa scripts/validar-aventuras.mjs al terminar.
```

### Estrategia de combate

```text
Quiero mejorar la estrategia del combate de Mazmorreo: [por ejemplo, que los enemigos lanzadores busquen la retaguardia,
que los goblins huyan al quedarse solos, una acción nueva del SRD].
Lee src/engine/combat.ts, los tipos de IA de src/data/srd.ts y docs/flujo-combate-y-textos.md.
Primero explícame cómo funciona ahora y qué propones cambiar, fiel al SRD 5.2.1. Cuando te lo confirme,
haz el cambio mínimo con tests en src/engine/ y comprueba que el bot del estudio (src/engine/estudio.test.ts) no empeora.
```

### Exploración del mapa

```text
Quiero mejorar la exploración de los mapas hexagonales de Mazmorreo: [por ejemplo, más secretos, trampas visibles con tirada,
atajos entre zonas, mejor niebla de guerra].
Lee src/engine/dungeon.ts, src/screens/Explore.tsx y scripts/generar-plano.mjs. Recuerda que la narración no puede prometer
elementos que el mapa no dibuja (docs/GUIA_CONTENIDOS.md). Propón el cambio antes de hacerlo y añade tests en src/engine/.
```

### Jugabilidad

```text
Tengo una idea para Mazmorreo: [idea, por ejemplo una misión secundaria en la posada o una recompensa por no huir].
Antes de programar, revisa cómo encaja con lo que ya hay (src/engine/aventuras.ts, rules.ts, posada.ts) y con el SRD 5.2.1,
dime qué archivos tocarías y qué riesgos ves para el equilibrio. Hazla solo cuando te lo confirme.
```

### Equilibrio

```text
Revisa el equilibrio de [encuentro o zona]. Usa solo criaturas de src/data/srd.ts (SRD 5.2.1)
y las reglas de .claude/rules/aventuras.md. Explica el cambio con números (PX, PG, CA, tamaño del grupo)
antes de tocar nada.
```

### Arte (para ChatGPT, Gemini u otro generador de imágenes)

La guía completa, con la imagen maestra de estilo y las reglas por tipo de imagen, está en [GUIA_ARTE.md](GUIA_ARTE.md). Adjunta siempre `docs/arte/referencia-maestra.png` al generador. Versión corta:

```text
Pintura digital semirrealista de fantasía medieval, luz cálida y sombras profundas, sin estética infantil ni anime.
Tema: [personaje, enemigo, objeto o lugar].
Formato vertical 2:3. Fondo neutro: penumbra con un resplandor suave, sin rocas, árboles, muros ni antorchas.
Sin texto, sin marcos, sin rectángulos ni paneles.
```

Lo que hemos aprendido generando el arte del juego:

- Si pides transparencia, el generador pinta un damero falso: pide **fondo blanco puro** y recórtalo después.
- En fondos de combate, prohíbe expresamente rectángulos o paneles.
- En texturas de suelo y pared, pide que los bordes opuestos encajen.
- Tras muchas imágenes en el mismo chat el estilo deriva: abre un chat nuevo cada 5 imágenes.
- Da a cada personaje ropa, complexión, color y pose propios para que no salgan todos iguales.
- Convierte el resultado a WebP como explica [GUIA_ARTE.md](GUIA_ARTE.md) y di en la PR qué herramienta usaste.

### Sonido

```text
Busca un sonido CC0 o CC BY para [uso: abrir cofre, conjuro de hielo…] en Kenney u OpenGameArt.
Conviértelo a OGG con el nombre que usa src/sonido.ts (efectos en mono, 32 kHz), iguala el volumen
al archivo que sustituye y añade autor, enlace y licencia a CREDITS.md.
```

### Revisar una PR

```text
Revisa esta PR de Mazmorreo: [enlace]. Busca errores, regresiones, textos que no sigan .claude/rules/textos.md
y código de más. Di qué cambiarías y por qué, sin reescribir lo que está bien.
```

## Lo que no se negocia

- Nada de contenido de Wizards of the Coast que no esté en el SRD 5.2.1, ni la marca «Dungeons & Dragons».
- Nada de imágenes, sonidos o textos con licencia que prohíba compartirlos, ni copiados de otros juegos o artistas.
- Nada de claves, tokens ni datos personales en el código.
- No se sube APK ni se cambia el número de versión: eso lo hace el responsable del proyecto.
