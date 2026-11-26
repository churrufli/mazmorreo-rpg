# Historial de cambios destacados

Este documento resume hitos funcionales comprobados en el código y en las PR recientes. **No sustituye las notas de versión de cada APK**, cuyo número depende de la ejecución de GitHub Actions.

## 26 de noviembre de 2026 — Puntos 22 a 26

- **Finales** (`Victory` en `src/screens/Town.tsx`): el texto va en un panel con desplazamiento y el botón de volver queda fijo debajo. Vuelven los finales largos de Hondaroca (sin el aprendiz ni el escribiente) y de El Corazón Hueco. La música de victoria espera a que se abra el cuadro de Victoria.
- **Claro maldito** (`plano.json`, zona `b4`): el pasillo que iba de la Garganta de raíces a la Cámara del descanso se saltaba a Brezna. Ahora une las dos mitades de la Garganta y el orden es fijo: abuela, bruja, Corazón y Raíz silenciosa (`claro-maldito.test.ts`).
- **Compañeros**: retrato junto a cada botón al elegir quién os acompaña y en la posada.
- **Montaña**: el narrador presenta a Eldran Barbanieve, y «Buscaremos la verdad en la cumbre».

## 26 de noviembre de 2026 — Más anotaciones

- **Música** (`src/sonido.ts`): «Ancient Menace» en todas las batallas salvo las de jefe (sustituye a `mus_combate_tumba`), música de victoria que suena una vez en el cuadro de Victoria y música de derrota.
- **Mapa**: las espadas de un combate ganado van en la casilla donde estaba el grupo (`wonAt`), y por casillas ya vistas se anda algo más despacio (130 ms por paso). El zoom máximo sube de 2,2 a 2,6.
- **Combate**: el botón de un ataque lleva la etiqueta «Desventaja» o «Ventaja» cuando afecta a todos los objetivos, con una explicación la primera vez que se dispara con un enemigo encima. La carta ampliada usa casi todo el ancho.
- **Web**: un único menú (`web/main.tsx`) con pantalla completa, ajustes, atajos de teclado y volver al menú. Desaparecen las ruedas de ajustes de cada pantalla.
- **Aventuras**: 26 descripciones de sala que destripaban cofres o enemigos, reescritas sin tocar las pistas de ambiente.

## 26 de noviembre de 2026 — Efectos de los packs CC0

- **Animaciones por fotogramas** (`src/ui/Destello.tsx`): magia según el tipo de daño, curación y críticos sobre la carta, del «RPG VFX Pack» de System G6 (CC0). Solo con los efectos visuales completos.
- **Sonidos** del «RPG Sound Pack» de artisticdude (CC0): desenvainar al empezar el combate, voz de cada criatura (espectros, gigantes, lobos, bestias, limos, bichos), mordiscos de los bichos pequeños y un conjuro para la magia sin sonido propio.

## 25 de noviembre de 2026 — Morir de verdad

- **Salvaciones fuera del combate** (`src/engine/muerte.ts`): al acabar el combate los caídos ya no quedan estables solos. En el mapa tiran una salvación por casilla hasta estabilizarse, levantarse con un 20 o morir. Aviso con sus éxitos y fallos, botón **Estabilizar** (Medicina CD 10 de un compañero) o poción desde la ficha.
- **Jefes**: un tercio de las veces rematan cuerpo a cuerpo a un caído que tienen delante (crítico automático del SRD: dos fallos).

## 25 de noviembre de 2026 — Nuevas modificaciones

- **Fondos**: todas las pantallas con ilustración (salvo crear héroe) usan en escritorio la misma imagen desenfocada a los lados (`Bg` con `wash`), y la ilustración se ancla arriba para que no se corten caras ni cabezas.
- **Escritorio**: Ajustes, información de la zona, ayuda del combate y ventanas de partidas con un ancho máximo de 560 px; el pueblo, más ancho.
- **Cómo funciona** (`src/ui/ComoFunciona.tsx`): temas plegables con resumen, puntos cortos con resaltes y capturas numeradas del mapa y del combate.
- **Victoria** (`src/ui/victoria.ts`): banda por subida de nivel con los PG aparte, novedades con nombre y descripción, y resumen discreto de PX, botín y nivel máximo.
- **Ficha de objeto común** (`src/ui/FichaObjeto.tsx`) en inventario, tienda, baúl y cofres.
- **Hongo chillón**: su primer grito trae una rata o un lagarto al empezar el asalto siguiente, también con el grupo pequeño.
- **Mapa**: el icono de cada combate sale del grupo ya ajustado (`firstFoe`). Las decisiones que revelan algo ya descubierto lo dicen.

## 24 y 25 de noviembre de 2026 — La web en modo escritorio

- **Modo escritorio** (`src/ui/escritorio.ts`): en la web, con la ventana apaisada y al menos 900 px de ancho, la interfaz va en una columna centrada de 520 a 600 px y las ilustraciones verticales se funden a negro con grano por los lados. En escenas y decisiones, los lados muestran la misma ilustración estirada y desenfocada (`Bg` con `wash`). En Android y en móviles no cambia nada.
- Crear héroe, pueblo, tienda y posada en dos columnas; galería con seis miniaturas por fila; registro del combate como panel lateral; avisos e iniciativa más estrechos; barras de desplazamiento oscuras.
- **Combate**: botones abajo, del ancho de las cajas del campo, y **atajos de teclado** (`src/ui/teclado.web.ts`): 1-9 usan las acciones de la categoría abierta y Esc cancela.
- **Mapa**: empieza más ampliado y la rueda del ratón acerca y aleja (`src/ui/rueda.web.ts`).
- El sonido del golpe, el crítico y la curación espera a que se vea la tirada (`revealMs` en `src/ui/ritmos.ts`). El cuadro de Victoria ya no lleva rayos de luz.

## 24 de noviembre de 2026 — Modo desarrollador por casillas

- En Ajustes, con el modo desarrollador activado, cada ayuda tiene su interruptor: mapa entero, teletransporte, superar obstáculos, superar pruebas, ganar combate, oro infinito, viajar a cualquier pueblo, subir al nivel de la aventura y empezar la aventura de cero. Se guardan en el dispositivo y, sin tocar, están todas encendidas.

## 23 de noviembre de 2026 — Copias de partida, decorados y música

- **Copias de seguridad** (`src/engine/copia.ts`): cada archivo se exporta (Compartir en Android, archivo en la web) y se restaura en un archivo vacío, con aviso si la copia es de una versión más nueva.
- **Comparar equipo**: al comprar, mirar o repartir un objeto se ve la CA con y sin él, o el ataque y el daño medio frente al arma que lleva.
- Los estados de las cartas dicen cuánto duran o cómo se pasan. El **diario** muestra los personajes conocidos y, en Hondaroca, los preparativos contra Maese Orvane.
- **96 decorados nuevos** en los mapas de las cuatro aventuras, sacados de lo que cuentan salas, diálogos y escenas, sin cortar el paso.
- **Mapa**: al entrar por primera vez en una sala sale su descripción; tocando su nombre se vuelve a leer. La caja de información crece con su contenido.
- **Combate**: primero se ve el dado, después embiste la carta y al final bajan los PG; el registro sigue al dado. Botones con etiquetas de dos líneas en vez de cortarse.
- Música nueva para el bosque y música propia para la montaña (`mus_montana`).

## 21 y 22 de noviembre de 2026 — Narrativas revisadas de las cuatro aventuras

- Textos revisados a mano de Hondaroca, El Corazón Hueco, El Invierno del Dragón y La Tumba de los Reyes Serpiente: introducciones, salas, diálogos, escenas, charlas y finales, fieles a la historia original y sin presuponer salas ni decisiones opcionales.

## 19 y 20 de noviembre de 2026 — Fichas del SRD, consumibles y pulido

- **Fichas de enemigos** revisadas contra el SRD 5.2.1 (kobold, cría de dragón blanco, mefit de hielo, lobo invernal, espectro, dríade, bruja verde, necrófago y otros). Las adaptaciones hechas a propósito (jefes, basilisco, constrictora, oso lechuza, hongo chillón) se mantienen.
- **Consumibles del SRD** en cofres y tiendas: pociones de velocidad, heroísmo, crecimiento, fuerza de gigante y resistencia, elixir de salud, veneno básico, frasco de aceite, polvo de desaparición y pergaminos de conjuro, con iconos propios.
- Las tiendas solo venden remedios (antídoto, resistencias, agua bendita, espejo) donde algún enemigo trae esa amenaza (`src/engine/botin.ts`).
- Diario con botón para volver a ver el final de cada aventura; sin ataque automático; aviso al terminar el turno sin gastar nada; PNJ visibles mientras se habla con ellos; combate en vertical más despejado.

## 19 de noviembre de 2026 — Enemigos con carácter, primera partida guiada y pistas

- **IA enemiga por familias** (`decide` y `chooseTarget` en `combat.ts`): goblins sin su jefe (`leaderDown`) huyen a la mitad de PG; no muertos con presa fija (`Unit.prey`); sectarios contra quien hirió a su líder (`isLeader`); lanzadores que se retiran si alguien les cubre.
- **Sin enemigos parados por error**: un cuerpo a cuerpo detrás con la fila llena cambia el sitio con un tirador (`Plan.swap`); si no puede, espera y se anota. `rowSpace` limita a 3 por fila a los enemigos.
- **Consejos de la primera partida** (`guia.ts`, `Game.guide`): mover, trampa, escena y descanso, una vez cada uno y solo en Hondaroca.
- **Tutorial de combate** (`ui/tutorial.ts`): en el primer combate ilumina turnos, presupuesto del turno, enemigos, acciones, fijos y terminar turno; luego filas, objetivo y vida baja (poción o huida). Se guarda en `Game.guide` (una vez por partida) y se puede omitir con confirmación.
- **Cadena de pistas en Hondaroca**: el diálogo `z3_d09` pone la marca `pista_agua` (campo `flag` en diálogos), que abre una vía en `z4_p01`; cerrar las compuertas (`z4_compuertas`) quita un Escudo a Orvane. `bossPrep` lo anuncia antes del jefe, junto al ritual cortado.
- **Comentarios de compañeros** (`data/comentarios.ts`): opciones de escena con `tone` (piedad, dureza, codicia) y frases por lugar de su propia aventura.
- **Lint** sin errores y en la validación de PR.

## 19 de noviembre de 2026 — Objetos legibles, combate más claro y aviso legal

- **Objetos**: tocar cualquier objeto enseña su descripción: tienda (también lo que no se puede pagar), venta, baúl, inventario y objetos ganados en cofres y escenas (los eventos `msg` llevan el id del objeto en `items`).
- **Combate**: la probabilidad de acierto va arriba del cuadro de explicación, destacada; las armas se explican por apartados (`MASTERY_HELP`).
- **Cartas**: tocar la carta ampliada abre su arte a pantalla completa; la ficha, con «Ver ficha» o deslizando.
- **Mapa**: paredes oscurecidas (`wallDim`) en la tumba falsa y la tumba superior.
- **Aviso legal** de Dungeons & Dragons y Wizards of the Coast en el README, NOTICE, la pantalla de inicio y Créditos. README y notas de la APK recomiendan jugar desde la web.

## 18 de noviembre de 2026 — Dracónido, tiefling, brujo y bárbaro elegible

- **Especies** (`SPECIES`): dracónido y tiefling, según el SRD 5.2.1. El linaje del dracónido sale del color de su retrato (`DRACONIC`): aliento de 1d10 (2d10 a nivel 5) sobre una fila enemiga, tantos usos como su competencia, y resistencia a ese daño. El tiefling tiene legado infernal fijo: resistencia al fuego, Descarga de fuego con Carisma y Reprensión infernal automática una vez por descanso largo desde nivel 3. Los usos van en `Char.racial`.
- **Brujo** (patrón infernal): magia del pacto (`slotsAt`) con espacios del mismo nivel que se recuperan en el descanso corto, Descarga sobrenatural (+Carisma desde nivel 2, dos rayos a nivel 5), Maleficio con concentración, Armadura de sombras (CA 13 + Destreza), Astucia mágica tras un combate, Bendición del oscuro y los conjuros del infernal.
- **Bárbaro** elegible como héroe; en la montaña, Vurka cede su sitio al suplente.
- 24 retratos nuevos con la cara centrada para las miniaturas.
- 20 retratos más del otro sexo (`hero_*_b`) para dracónidos, tieflings y brujos, y corregido el sexo de los cuatro dracónidos varones en `baseSex`.
- **Aliados sin repetir**: Kallux (brujo tiefling) sustituye al Hermano Ismerel, Ghaldra (guerrera dracónida de plata) a Syrael e Iskarra (bárbara dracónida de latón) a la Hermana Yara; Teodor pasa a brujo. Cada clase tiene dos aliados. Las aliadas dracónidas tienen su propio linaje (`draconic`).
- **Vurka, orca** (especie `orc`, solo para ella): Aguante incansable y Descarga de adrenalina del SRD 5.2.1. La visión en la oscuridad no está modelada, como en las demás especies.

## 17 de noviembre de 2026 — Cuarta aventura: La Tumba de los Reyes Serpiente

- Basada en *Tomb of the Serpent Kings*, de Skerples (CC BY-NC-SA). Se abre al vencer a Vharzûl; pueblo de **Arenaroja** y zonas `s1`-`s4` (tumba falsa, tumba superior, salas del sacrificio y madrigueras) hasta el hechicero **Xiximanter**. Se llega al jefe con **nivel 5**.
- Criaturas del SRD 5.2.1: momia, gelatina ocre, pudin negro, basilisco, íncubo, goblins de hongo y guardián cobra. El espejo de acero ayuda contra el basilisco y el hongo chillón atrae a otro enemigo.
- Aliados en la posada de Arenaroja, con sus charlas. Música de demostración (`mus_arenaroja`, `mus_tumba`, `mus_combate_tumba`) mientras se busca la definitiva.
- **Modo desarrollador**: botón «Superar» en obstáculos y salidas cerradas, y al viajar a un pueblo el grupo queda como llegaría jugando (nivel, compañeros y equipo mágico).

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

- Cuatro aventuras encadenadas (niveles 2, 3, 4 y 5 al llegar al jefe), cuatro zonas por aventura y un pueblo de partida en cada una.
- Seis especies elegibles (humano, elfo, enano, mediano, dracónido y tiefling) y ocho clases (guerrero, clérigo, pícaro, mago, explorador, paladín, bárbaro y brujo).
- Héroe con hasta tres aliados intercambiables, afinidad y charlas en la posada.
- Exploración hexagonal, elementos dinámicos, secretos, decisiones con consecuencias y combates por turnos con dos filas y enemigos del SRD 5.2.1.
- Descansos, tiendas, templo, inventario, consumibles, baúl, diario, galería, copias de partida y progresión entre aventuras.
- Versión web con modo escritorio y atajos de teclado en combate; modo desarrollador con un interruptor por ayuda.
- Validación de aventuras, lint, pruebas automatizadas, pruebas en navegador y estudio opcional con bot.

## Advertencia sobre pruebas

El historial de cambios no implica que se haya generado o verificado un APK después de cada PR. Para generar una versión de prueba, ejecutar manualmente el workflow **Android APK** en GitHub Actions. Los estudios simplificados de combate no equivalen a ejecutar partidas completas con el motor real.
