# Combate compacto: dos categorías por fila

La captura del usuario mostraba cuatro categorías apiladas y el grupo fuera del área visible. La anchura mínima de 180 px, sumada a marcos y márgenes, impedía formar dos columnas en móviles estrechos. Además, HABILIDADES tenía una excepción que la extendía a toda una fila. La revisión visual anterior solo probaba de forma reproducible dos categorías con un personaje, por lo que no cubría este caso.

## Corrección

- Cuadrícula de dos columnas para todas las categorías, incluida HABILIDADES. Se eliminan anchuras mínimas que impedían el ajuste y se usa una anchura relativa del 49 %, sin márgenes horizontales añadidos. Cuatro categorías ocupan dos filas.
- Botones de combate de 44 px de altura mínima, texto medieval común de 13 px (12 px en ventanas inferiores a 350 px) y hasta dos líneas. Se mantienen marcos, colores y selección; los iconos decorativos se omiten en botones estrechos para dejar espacio al texto.
- La pestaña de información mantiene su objetivo táctil de 44×44 px y continúa separada de la acción principal.
- Dos acciones hijas completas por fila visible. Su anchura se calcula a partir del espacio real del desplazamiento horizontal. Las categorías con más de dos opciones reservan un ancho estable para las flechas, evitando cambios de tamaño al desplazarse.
- GANAR COMBATE pasa a un control de desarrollador discreto de 24 px, tras los controles normales. Sigue oculto en modo normal. Se reducen rellenos y el aviso inicial se reserva para pantallas altas sin modo desarrollador.
- En vertical, las acciones se limitan al menor de 240 px o el 36 % del alto, añadiendo el área segura inferior cuando existe. En la prueba con cuatro categorías, dos armas y modo desarrollador, el panel ocupa 226 px. TERMINAR TURNO permanece visible sin desplazar los controles.
- El registro de combate ocupa 30–36 px desplazables, más su encabezado y el objetivo si existe. El tamaño de cartas descuenta el alto real del registro, los márgenes y las filas vacías; se elimina el mínimo que forzaba el desbordamiento de las cartas aliadas.
- Al consultar información, el panel se desplaza hasta la explicación y su cierre; al cerrar se recuperan los controles. El campo conserva su espacio y no se ejecuta ninguna acción por consultar.

## Validación

Se añade `scripts/probar-combate-compacto.cjs` con una partida reproducible de cuatro personajes, cuatro categorías, dos armas, pociones repetidas y modo desarrollador. A diferencia del caso simple anterior, comprueba la distribución del grupo completo. El workflow de validación de PR ejecuta esta prueba con Chromium y conserva las capturas como artefacto durante siete días; no interviene el workflow de APK.

- Cuatro categorías en dos filas, botones de hasta 46 px, dos hijos completos, cuatro cartas aliadas dentro del campo visible, TERMINAR TURNO y control de desarrollador visibles, sin solapamiento entre campo y panel.
- Geometría y capturas: 360×640, 384×720, 390×844, 320×640 y 844×390. También comprueba el desplazamiento estable de una categoría con varios conjuros y que consultar MAZA no cambia el combate.
- Se conservan las pruebas anteriores de acción única directa, categorías, pestañas y ataques, en sus cuatro tamaños; también pasan los flujos web de creación, guardado y carga.
- Batería completa: 18 suites, 453 pruebas correctas y 3 omitidas. Tras los ajustes finales de distribución se repiten las suites de interfaz. TypeScript, compilación web y bundle Metro Android correctos; no se genera APK. Se mantiene el aviso de Vite por tamaño del paquete.
- Sigue pendiente la revisión visual y táctil en dispositivo Android real. No cambia ninguna regla ni disponibilidad de acciones.

Para repetir: iniciar `npm run web -- --port 5194` y ejecutar `node scripts/probar-combate-compacto.cjs`. `COMBAT_URL` permite indicar otro servidor Vite. Capturas locales: `/tmp/mazmorreo-compacto-*.png`.
