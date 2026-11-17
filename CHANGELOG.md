# Historial de cambios destacados

Este documento resume hitos funcionales comprobados en el código y en las PR recientes. **No sustituye las notas de versión de cada APK**, cuyo número depende de la ejecución de GitHub Actions.

## 17 de noviembre de 2026 — Niveles más bajos: 2, 3 y 4

- **Nivel objetivo por aventura** (`ADVS[].level`): 2 en Hondaroca, 3 en el bosque y 4 en la montaña. Dentro de la aventura nadie lo pasa (los PX de más se pierden, `gainXp`) y, al entrar en la sala del jefe, quien no lo tenga sube a él. También es el mínimo al terminarla (antes 3, 5 y 6).
- **Más PX por combate** (`xpScale`): ×2 en Hondaroca y el bosque, ×3 en la montaña. Nivel 2 al acabar la zona 1 de Hondaroca, nivel 3 en la zona 3 del bosque y nivel 4 en la zona 2 de la montaña.
- **Enemigos**: en el bosque, oso pardo en vez del oso lechuza (b2_e06) y serpiente constrictora gigante en vez del montículo andante (b3_e04); las dos arañas del nido de seda ya no se refuerzan entre sí. En la montaña, sin acompañante el oso pardo de m2_e05, el ogro de m3_e05 y el lobo invernal de m4_e02. Vharzûl baja a 75 PG, ataques +6 y aliento 5d8 CD 14, y su escolta pierde la cría de dragón blanco.
- Estudio con el bot: `NIVELES=1 N=10 npx jest niveles --runInBand`.

## 17 de noviembre de 2026 — Imágenes definitivas de los elementos dinámicos

- Incorporadas las 11 imágenes de escombros, puerta, verja, palanca y barrera (`din_<tipo>_<estado>.webp`). Sustituyen a los marcadores provisionales; los estados sin imagen siguen con el suyo.
- La conversión (`scripts/convertir-dinamicos.py`) no recorta ni recentra, para que los estados de un elemento conserven el mismo encuadre.

## 17 de noviembre de 2026 — Elementos dinámicos en los mapas

- **Sistema genérico** (`src/engine/elementos.ts`): elementos con estados que cambian por escenas, mecanismos o acontecimientos y que de verdad abren o cierran el paso. Se guardan con la partida; las partidas anteriores que ya habían pasado por esas casillas los encuentran abiertos.
- **Ejemplos jugables**: derrumbe en la galería de las poleas (z1, prueba de Fuerza), puerta de las cenizas (z3, cerrojo y empujón), contrapeso que alza y baja la verja de las válvulas (m3) y sello que se apaga al vencer a los devotos de la cámara de estudio (z4).
- Marcadores provisionales con transición suave (respetan «Efectos visuales»). Imágenes definitivas pendientes: `docs/arte/elementos-dinamicos-pendientes.md`.

## 16 de noviembre de 2026 — Efectos visuales y animaciones

- **Lenguaje común de animación** en `src/ui/movimiento.ts`: duraciones, curvas y nivel de efectos (completos, reducidos o mínimos) con ajuste persistente y respeto a «reducir movimiento» del sistema.
- **Combate**: tajos, chispas y destello en los golpes físicos; críticos con doble tajo dorado; sacudida mayor con golpes fuertes; «Fallo» y esquiva al fallar; peso en la embestida y estela en flechas y conjuros; efectos propios para ácido, veneno, necrótico, psíquico y trueno.
- **Cartas**: halo del turno, elevación animada, barra de vida con rastro, estados que entran y salen, velo al caer y esquirlas al romperse (más en los jefes).
- **Interfaz**: brillo al pulsar botones, victoria con rayos y subida de nivel destacada, objetos que aparecen con rebote, tiradas de escena que se iluminan o dan un respingo, oro animado en el pueblo y paso de la ficha en el mapa.
- Solo capa visual: sin cambios en el motor, las reglas, las aventuras ni la duración de los turnos.

## 16 de noviembre de 2026 — Decisiones que dejan huella

- **Objetivos de combate con consecuencias** (`okFx` / `failFx` en `objetivos.ts`): el vigía del pozo (z1_e06) da la alarma y la prisión (z2_e01) espera con refuerzos; rendir a la dríade (b4_e02) quita un árbol despertado al Corazón Hueco; si el kobold del tributo (m4_e03) da la voz, Vharzûl tiene un kobold más; el resinero rescatado (b2_e08) abre una vía nueva en la caja de los resineros (`if` en las opciones de escena).
- Las decisiones que añaden o quitan enemigos se aplican después del ajuste al grupo, así que se notan con cualquier tamaño de grupo (salvo el héroe solo en la zona 1, que sigue con un único enemigo).
- **Vías de aliados equilibradas** en 10 escenas: siguen siendo seguras, pero otra vía con tirada da algo más.
- **La viga que cede** (z1_p01): opción segura con poco premio u opción arriesgada con una cuerda que abre el arcón del pozo.
- **Variantes revisadas** por amenaza (PG × daño por asalto): fuera la serpiente constrictora gigante del jabalí gigante (×4) y el hipogrifo pasa de la arpía (×2) al oso pardo de la montaña.

## 16 de noviembre de 2026 — Más decisiones tácticas

- **12 objetivos opcionales nuevos** sin reloj: «que el primero en caer sea…» y «que no caiga nadie del grupo». Premios con objetos tácticos (red, fuego de alquimista, agua bendita, vial de ácido, poción de resistencia al frío).
- **Previsión de la tirada** al elegir objetivo y en la explicación de cada ataque: probabilidad aproximada con las mismas reglas del SRD 5.2.1 (CA, bonificador, ventaja, desventaja, cobertura), sin tocar los dados.
- El registro explica cada ventaja o desventaja y avisa cuando un enemigo cambia de objetivo porque el grupo ha cambiado de fila.
- **13 vías de aliados** en escenas de las tres aventuras: solo aparecen si ese aliado va en el grupo; nunca son la única solución.
- Probabilidad aproximada en las pruebas de las escenas y ajuste «Combate pausado».

## 6 de noviembre de 2026 — Narrativa independiente del mapa (PR #13)

- Revisión de **83 introducciones de escenas** de las tres aventuras: Hondaroca (30), El Corazón Hueco (27) y El Invierno del Dragón (26).
- Ajuste de **23 resultados de decisiones** y **5 diálogos** que dependían de ubicaciones u objetos no garantizados visualmente.
- El motor deja de mostrar «ya lo veis en el mapa» / «ya aparece en el mapa» al descubrir secretos.
- El resultado narrativo es neutro: «Habéis descubierto un secreto».
- Se mantienen los efectos de decisiones, recompensas, encuentros, rutas y estadísticas.

## 6 de noviembre de 2026 — Equilibrio y progresión (PR #12)

- Jefes únicos, sin duplicación por el escalado automático.
- Límites ordinarios de enemigos adaptados al grupo (1, 2, 3 o 4), con excepciones por decisiones que añaden refuerzos.
- Refuerzos de acompañantes con límite de tres enemigos por fila.
- Corrección de la experiencia recibida por derrotar a los jefes cuyo PX técnico es cero.
- Montículo andante de la ciénaga convertido en un encuentro evitable con aviso.
- Penalización de derrota reducida al **10 % del oro**.
- Nuevas pruebas de regresión de escenas y equilibrio.

## Revisión narrativa integral anterior (PR #11)

- Revisión de la coherencia de introducciones, diálogos, elecciones y textos de las tres aventuras.
- Mejora de la continuidad narrativa, sin convertir los aliados opcionales en narradores indispensables.
- Revisión de las conversaciones de aliados en la posada.

## Sistemas presentes en el juego

- Tres aventuras encadenadas, cuatro zonas por aventura y pueblos de partida.
- Héroe con hasta tres aliados intercambiables, afinidad y charlas en la posada.
- Exploración hexagonal, secretos, decisiones con consecuencias y combates por turnos con dos filas.
- Descansos, tiendas, templo, inventario, baúl, diario y progresión entre aventuras.
- Validación de aventuras, pruebas automatizadas y estudio opcional con bot.

## Advertencia sobre pruebas

El historial de cambios no implica que se haya generado o verificado un APK después de cada PR. Para generar una versión de prueba, ejecutar manualmente el workflow **Android APK** en GitHub Actions. Los estudios simplificados de combate no equivalen a ejecutar partidas completas con el motor real.
