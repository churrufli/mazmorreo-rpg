# Ajuste a la referencia visual de combate

Continuación del PR #45, a partir de la imagen que el usuario indicó como estilo preferido.

- Se conservan los dos PNG originales y sus recortes de nueve segmentos. Una capa oscura reduce el brillo para aproximarse al cuero y al carbón sobrios de la referencia. No se regeneran ni sustituyen los archivos gráficos.
- Padres e hijos comparten fuente medieval en negrita de 16 px y texto dinámico en mayúsculas. La altura mínima es de 54 px, con espacio para dos líneas cuando hace falta.
- Iconos de acción en los padres: armas, escudo, magia y objetos. HABILIDADES ocupa una fila completa, como en la propuesta. Los hijos quedan dentro del mismo marco fino que su categoría.
- Marco dorado fino, doble línea interior, resalte luminoso para el estado seleccionado/pulsado y tratamiento atenuado del estado no disponible. El fondo de un hijo seleccionado sigue siendo gris carbón.
- La categoría seleccionada también expone su estado mediante `aria-pressed` en web; se conserva `accessibilityState` para Android.
- La información de armas y objetos muestra la ilustración existente, título destacado, coste y cifras separadas de la explicación. Las cifras proceden del motor: la maza conserva su daño real de 1d6 contundente; no se copian el 1d8 ni la propiedad versátil del ejemplo gráfico.
- La pestaña conserva un área táctil independiente de 44×44 px. Consultarla no selecciona objetivos ni ejecuta acciones. MAZA sigue atacando directamente al pulsar su cuerpo.

No se cambian las reglas, los recursos, la disponibilidad de acciones ni los controles de desarrollador. Se mantienen la distribución adaptable y los desplazamientos independientes del campo de combate y de los controles.

Validación: TypeScript y compilación web correctos; 18 suites con 453 pruebas correctas y 3 omitidas. Chromium comprueba combate, pestañas, selección accesible e ilustración de la maza en 390×844, 844×390, 1280×800 y 320×568; también pasan los flujos web de partida, guardado y carga en los cuatro tamaños habituales. Metro genera el bundle Android con los 386 recursos. Queda pendiente la comprobación táctil/visual en dispositivo Android real; no se compila APK.

Capturas locales: `/tmp/mazmorreo-combate-390x844.png`, `/tmp/mazmorreo-combate-844x390.png` y `/tmp/mazmorreo-combate-info-390x844.png`. Para repetir las interacciones: `node scripts/probar-combate.cjs` contra el servidor Vite local.
