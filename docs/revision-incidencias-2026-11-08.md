# Revisión de incidencias — 8 de noviembre de 2026

Base: `master`, commit `cb6f58b208a8c7dd06881b04275c1afaa940b4f5`. Trabajo en `fix/revision-incidencias`.

## Resultado

Se revisaron 83 escenas de las tres aventuras; 45 recibieron cambios narrativos. Se inspeccionaron las ilustraciones propias y los fondos compartidos, y se revisaron descripción, opciones y resultados. Los elementos pequeños pueden descubrirse al investigar; las acciones principales se apoyan en el entorno visible. No se añadieron imágenes ni encuentros.

| Incidencia | Resolución |
| --- | --- |
| El cristal opaco (`z4_s01_pista`) | Pista basada en reflejos violetas y eco del agua. Conserva `z4_s01`, que descubre `z4_c01`. |
| El caudal contenido (`z4_p01`) | Recuperar monedas entre agua, ruinas y columnas; sin reguladores, cadena ni compuerta inventados. |
| Pasarela de las compuertas | Sala real `z4_r08`, índice 7 del plano. Tres casillas de agua, con la pasarela existente sobre una de ellas. Personajes, eventos, conexiones y demás marcas mantienen sus coordenadas. |
| Enemigos y marcadores | Los enemigos ya eran estáticos. El error guardaba la casilla del jugador al ganar. Cada grupo conserva ahora su casilla fija, también al leer partidas antiguas. Las marcas actuales no comparten casilla con otros elementos. Los grupos retirados sin bajas no dejan falsas victorias. |
| Cultista (`z4_q02`) | Se llama «El cultista rendido». Ofrece información, conservando `reveal: z4_s01` y `sub: z4_e04`. La decisión no entregaba ninguna llave al inventario. |
| El voto de silencio (`z4_p02`) | Recuperar la ofrenda entre piedras sumergidas junto a cristales, sin estatua ni losa de presión. |
| El mosaico de raíces | `z4_s02_pista` y `z4_s02_abrir` pasan a «El sello de Umbría»: símbolos violetas y ondas del agua. Se conserva el amuleto, los disparadores y `z4_s02`. Diario actualizado. |
| El escribiente cautivo (`z4_q01`) | Dos tablillas selladas tras barrotes, como en su ilustración. Información de guardias/provisiones con sus consecuencias originales. |
| Pájaros de Vega Umbría | Eliminada la frase que contradice el sonido ambiental de la primera zona. |
| El lazo tendido (`b1_p01`) | Su beneficio existente es desactivar `b1_t01`. Los resultados lo dicen expresamente. No se añade botín. |

## Refuerzos y equilibrio

No cambia `encounterGroup`, la entrada de refuerzos por ronda ni la composición de los combates. Cada grupo mantiene su marcador en su posición de origen, y los grupos que se retiran sin bajas no dejan marcador. Se conserva la activación de combates al acercarse a una casilla o al entrar en una sala.

Se compararon recursivamente los tres JSON contra la base: salvo `text`, `label`, `question` y `title`, todos los campos coinciden. Esto incluye `reveal`, `reveals`, condiciones, dificultades, características, objetos, oro, daño, PX, cantidades y estadísticas. Descubrir cofres y atajos sigue sin recogerlos ni atravesarlos automáticamente. El mensaje «Ya lo puedes ver en el mapa» no cambia.

Para dibujar agua bajo la pasarela se reconoce esa combinación de decorados como una capa de fondo transitable. El agua se dibuja antes de la pasarela. No se generaron recursos gráficos.

## Validación

- Validación estructural de las tres aventuras: correcta. Los 15 avisos también existen en la base.
- Batería completa: 17 suites, 448 pruebas correctas y 3 omitidas. Tras añadir el caso de retirada sin bajas y ajustar los marcadores se repitieron las suites afectadas: 39 pruebas correctas.
- TypeScript y compilación web: correctos. Vite conserva el aviso sobre tamaño del paquete.
- Navegador: flujo de nueva partida, pueblo, mapa, guardado y recarga correcto en 390×844, 1280×800, 1024×768 y 844×390.
- Navegador en `z4_r08`: pasarela y tres capas de agua visibles. Captura de revisión: `/tmp/mazmorreo-pasarela.png`.
- Transitabilidad: pruebas de todos los mapas y exclusividad de posiciones enemigas correctas.

## Sustitución de la ilustración completada

Recibido `cultist.rar` con el PNG original del cultista arrodillado y ambas manos levantadas. Se sustituye `assets/img/escena_cultista_llave.webp`, convertido a WebP con las dimensiones de presentación existentes, sin recortar la composición ni generar una alternativa. Se mantiene la referencia en `src/assets.ts`. La sustitución se aplica a sus dos usos, `z4_q02` y `z4_ev01`, cuyos textos ya contemplan la rendición con las manos levantadas. Archivo WebP verificado y compilación web comprobada.

No quedan incidencias del registro pendientes de implementación.

No se ha desplegado ni modificado el `master` remoto.

## Inventario de imágenes de las escenas

Los fondos de zona se usan cuando la escena no declara `img`.

| Imagen o zona de fondo | Usos | Escenas |
| --- | ---: | --- |
| `z1` | 5 | `z1_p01`, `z1_s01_pista`, `z1_s02_pista`, `z1_pat01_paso`, `z1_p02` |
| `escena_vigia_herido` | 1 | `z1_q01` |
| `escena_minero_agua_negra` | 2 | `z1_ev01`, `z1_q02` |
| `pnj_buhonera` | 1 | `z2_ev01` |
| `z2` | 4 | `z2_s01_pista`, `z2_p03`, `z2_s02_pista`, `z2_pat01_paso` |
| `escena_registro_excavador` | 1 | `z2_q01` |
| `escena_rendicion_hornos` | 1 | `z2_q02` |
| `z3` | 4 | `z3_p02`, `z3_s01_pista`, `z3_s02_pista`, `z3_p01` |
| `escena_escriba_nombres` | 1 | `z3_q01` |
| `escena_estatua_sin_rostro` | 1 | `z3_q02` |
| `z4` | 6 | `z4_s01_pista`, `z4_pat01_paso`, `z4_p02`, `z4_s02_pista`, `z4_s02_abrir`, `z4_p01` |
| `escena_cultista_llave` | 2 | `z4_ev01`, `z4_q02` |
| `escena_escribiente_cautivo` | 1 | `z4_q01` |
| `b1` | 6 | `b1_p01`, `b1_ev01`, `b1_s01_pista`, `b1_p04`, `b1_pat01_paso`, `b1_s02_pista` |
| `escena_fugitivo_robles` | 1 | `b1_q01` |
| `escena_barricada_cede` | 1 | `b1_q02` |
| `b2` | 3 | `b2_pat01_paso`, `b2_ev01`, `b2_s01_pista` |
| `escena_caja_resineros` | 1 | `b2_q01` |
| `escena_marcas_altas` | 1 | `b2_q02` |
| `b3` | 6 | `b3_p01`, `b3_ev01`, `b3_s02_pista`, `b3_s01_pista`, `b3_pat01_paso`, `b3_p02` |
| `escena_voz_agua` | 1 | `b3_q01` |
| `escena_ofrenda_guardian` | 1 | `b3_q02` |
| `b4` | 4 | `b4_s01_pista`, `b4_pat01_paso`, `b4_s02_pista`, `b4_s02_abrir` |
| `escena_altar_herido` | 1 | `b4_q01` |
| `escena_ultima_palabra` | 1 | `b4_q02` |
| `m1` | 5 | `m1_ev01`, `m1_s01_pista`, `m1_pat01_paso`, `m1_p01`, `m1_p02` |
| `escena_kobold_puente` | 1 | `m1_q02` |
| `escena_baliza_apagada` | 1 | `m1_q01` |
| `m2` | 4 | `m2_pat01_paso`, `m2_s01_pista`, `m2_ev01`, `m2_p01` |
| `escena_vigia_trampas` | 1 | `m2_q01` |
| `escena_correa_pino` | 1 | `m2_q02` |
| `m3` | 5 | `m3_ev01`, `m3_pat01_paso`, `m3_s01_pista`, `m3_s02_pista`, `m3_p01` |
| `escena_dos_valvulas` | 1 | `m3_q02` |
| `escena_kobold_estandarte` | 1 | `m3_q01` |
| `m4` | 4 | `m4_pat01_paso`, `m4_s01_pista`, `m4_p01`, `m4_p03` |
| `escena_carta_emisarios` | 1 | `m4_q02` |
| `escena_campanilla_hielo` | 1 | `m4_q01` |
