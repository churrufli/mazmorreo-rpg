# Flujo de combate, huida y etiquetas completas

La selección inteligente de una acción única podía ejecutar un ataque al tocar el primer botón. HUIR solo se encontraba dentro de DEFENDER y no se veía al desplegar las armas. Además, los márgenes reservados a la pestaña desplazaban el texto y la estimación por número de caracteres podía dejar una etiqueta larga con puntos suspensivos.

## Decisiones de interfaz

- Las categorías siempre conservan sus nombres: ATACAR, DEFENDER, HABILIDADES y OBJETOS. Abrir cualquiera de ellas no ejecuta una acción, aunque solo contenga una opción. Al comenzar un turno no se despliega automáticamente ATACAR.
- HUIR y TERMINAR TURNO permanecen en la fila inferior, con el mismo ancho. HUIR está visible durante el turno del personaje; cuando se ha gastado la acción sigue visible, atenuado, y explica por qué no puede usarse. No se permite huir después de gastar la acción salvo que una capacidad existente devuelva esa acción.
- DEFENDER contiene Esquivar y cambiar de fila. HUIR no se duplica dentro de sus opciones.
- El menú conserva las opciones cuyo coste del turno ya se ha gastado, con su motivo; pulsarlas abre información, sin ejecutarlas. La disponibilidad real sigue procediendo de `actionsFor`. Recursos agotados, falta de objetivos y efectos inútiles mantienen sus condiciones originales.
- Elegir una acción explícita con un único objetivo válido la ejecuta. Los enemigos indistinguibles conservan su selección automática. Los objetivos distintos se eligen en las cartas; no se reutiliza silenciosamente un objetivo anterior.
- Mientras se elige objetivo, el registro indica qué hay que seleccionar y muestra CANCELAR. Se puede cambiar de categoría, volver a pulsar la acción, cancelar, huir o terminar turno. Gastar la acción no cierra el turno si todavía queda un cambio de fila útil. No se consumen recursos antes de ejecutar. La petición de objetivo no desplaza los controles; la consulta de ayuda sigue siendo de lectura y puede desplazarse hasta su cierre.
- Antes de ejecutar se vuelve a consultar la acción y sus objetivos en el estado actual. Se comprueban personaje, turno y ronda para impedir callbacks de un turno anterior; una protección de 300 ms al ejecutar o terminar turno evita que un doble toque salte otro personaje o consuma otra acción.
- La información y las selecciones se limpian al cambiar de turno. Consultar información pausa el cierre automático por falta de acciones útiles.

## Texto y alineación

- Se restauran los iconos en las categorías, también en móvil, usando el margen reservado a su izquierda.
- Márgenes simétricos y texto centrado en todo el botón. Las categorías impares y una única acción hija quedan centradas en su fila. Los botones inferiores tienen anchuras iguales.
- Las etiquetas de combate se calculan con los avances de la fuente Cinzel Bold incluida en el proyecto y con la escala de fuente del dispositivo. Se distribuyen en una o dos líneas por anchura real, sin puntos suspensivos. Las palabras largas de categorías tienen cortes silábicos; los nombres largos de acciones reciben el ancho mínimo necesario para seguir siendo legibles.
- TERMINAR TURNO no lleva pestaña: es un control del turno y así reserva todo su ancho al texto. Las acciones y categorías conservan la pestaña independiente de 44×44 px.
- Se mantiene el límite del panel y la cuadrícula compacta de dos categorías por fila. No se alteran reglas, estadísticas ni recursos del SRD.

## Casos revisados y validación

1. Una o varias armas; una o varias opciones por categoría; categoría impar y acción única centradas.
2. Objetivo único, varios objetivos indistinguibles, enemigos distintos y varios aliados heridos.
3. Cancelación, cambio de categoría y huida antes de confirmar un ataque; huida tras gastar solo una acción adicional.
4. Acción, acción adicional o movimiento gastados; las seis clases del héroe y la clase adicional de aliados, con/sin recursos y en ambas filas. La matriz de ocho combinaciones de costes verifica que el menú habilita exactamente las opciones legales del motor.
5. Arma cuerpo a cuerpo desde retaguardia, curación con PG completos, objetos repetidos, objetivo inválido para una poción, consumo de una sola dosis y Oleada de acción.
6. Consulta de arma/categoría/acción atenuada sin ataques ni consumo; doble toque sin ejecutar dos ataques.
7. Etiquetas centradas y completas, incluidas TERMINAR TURNO y nombres en dos líneas; iconos, filas impares y botones inferiores con ancho coherente.

Pruebas: 20 suites, 464 casos correctos y 3 omitidos; pruebas adicionales de interfaz en Chromium a 320×640, 360×640, 390×844 y 844×390, junto a los cinco tamaños del grupo completo y los flujos web existentes. TypeScript, compilación web y bundle Android con Metro se comprueban sin generar APK. La guía de combate se actualiza al nuevo flujo y deja de indicar el antiguo primer uso con USAR. La nueva prueba de flujo se ejecuta en la validación de PR y sus capturas se conservan como artefacto. Sigue pendiente la revisión táctil y visual en dispositivo Android real;

Guías reproducibles: `scripts/probar-combate.cjs`, `scripts/probar-combate-compacto.cjs` y `scripts/probar-flujo-combate.cjs`, contra un servidor Vite local indicado por `COMBAT_URL`. Capturas de selección: `/tmp/mazmorreo-flujo-objetivos-*.png`.
