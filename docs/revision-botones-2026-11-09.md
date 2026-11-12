# Botones originales y revisión de combate

Base: `e48a0f2` de `master`. Rama: `codex/botones-originales`.

## Cambios

- Incorporados sin modificar los originales `assets/ui/boton_padre.png` (1200×276, 638650 bytes) y `assets/ui/boton_hijo.png` (1200×276, 590379 bytes). Registrados para Metro y para el generador de recursos Vite.
- Los botones de acciones y categorías de combate usan recortes de nueve segmentos: esquinas a escala uniforme, cuero y tramos rectos adaptables. Padre marrón e hijo gris carbón, también al seleccionarlos. No se texturizan iconos ni pestañas de navegación.
- Tras la revisión del usuario se afina el marco (escala de esquinas 0,14), se baja la altura mínima de 64 a 48 px y se sube el texto de 13 a 14 px. La franja central omite los adornos laterales mediante recorte y usa cuero limpio del original. Los PNG archivados permanecen intactos.
- Misma fuente medieval, tamaño y grosor para padres e hijos. Textos dinámicos superpuestos y etiquetas de `Btn` en mayúsculas. Anchura mínima para evitar abreviar categorías en móviles pequeños.
- Pestaña ornamental con objetivo táctil independiente de 44×44 px y `stopPropagation`. No lleva iconos añadidos. Consultar una acción borra la selección de objetivos y abre ayuda de lectura, sin botón USAR ni cambios en el estado del combate.
- Se conservan acciones únicas directas (MAZA) y categorías con varias opciones. Los hijos quedan unidos visualmente al bloque seleccionado mediante un borde y un indicador de selección.
- Se elimina la posición absoluta del panel informativo. Texto desplazable y cierre separado. Los controles y el campo de combate pueden desplazarse independientemente cuando no caben. En horizontal desde 700 px se usan dos columnas; el registro ocupa menos altura en pantallas bajas.
- Se completan las ayudas de Furia, Marca del cazador, traslado de marca, Imposición de manos, Castigo divino, Bola de fuego y Curación en masa, además de los objetos. Las armas muestran su ficha y los valores calculados por el motor. Se corrige la ficha del pergamino: el motor lo ofrece al mago.

## Comprobaciones de tareas anteriores

| Tarea | Estado comprobado |
| --- | --- |
| FICHA / HABILIDADES / INVENTARIO | Ya implementadas. Los seis atributos están en FICHA; HABILIDADES muestra capacidades. Prueba de cambio de personaje y restauración de su pestaña añadida. El código conserva posiciones de desplazamiento por identificador y pestaña. |
| SUPERAR en modo desarrollador | Ya implementado y protegido también en la tienda de estado. Prueba de visibilidad en modo normal/desarrollador y envío de la opción; prueba de resultado 20 y revelación de `z2_s02`. |
| MAZA directa / categorías / objetivos | Conservados. Pruebas de navegador comprueban que el cuerpo ataca y la pestaña no cambia ni consume acciones. Las pruebas existentes del motor cubren objetivos. |
| Umbral de los muertos / Emblema gastado | Ya reescritos: losas, arcos y mampostería del fondo de la zona, sin alterar recompensas, pruebas ni revelación. Véase el registro anterior. |
| Cultista rendido | La sustitución por el cultista arrodillado con las manos levantadas ya consta en el registro anterior y está en el árbol actual. No se incorpora otra imagen. |
| Ilustraciones reutilizadas | El inventario anterior documenta fondos compartidos y dos usos del mismo personaje. No hay archivos gráficos de `assets/img` idénticos por SHA-256. No se han añadido sustituciones sin material adecuado. |
| Introducciones, diálogos y mercader | Ya revisados en los datos y el registro anterior. Se conserva la mercader del umbral; la clave interna `pnj_buhonera` no se renombra porque identifica el recurso existente. |
| Retratos, paredes, enemigos e interactivos | Implementados previamente. Pasan las pruebas de encuadres faciales, paredes y posiciones exclusivas de enemigos. |
| Pasarela de Hondaroca | Ya corregida: agua bajo la pasarela y paso transitable. Prueba existente conservada. |
| Web horizontal | Ya ocupa el ancho del navegador. Se mejora ahora específicamente el combate. |

Referencia: [revisión previa](revision-incidencias-2026-11-08.md).

## Reglamento y límites

No se modifican reglas, estadísticas, costes, recompensas ni resultados del motor de combate. Las explicaciones distinguen las adaptaciones preexistentes de las reglas del SRD 5.2.1: áreas por filas, Dormir, duración de Bendecir/Saeta guía/Furia, Esconderse, reducción de velocidad de Rayo de escarcha, pergamino de Escudo, restricciones de Oleada de acción y Telaraña. La conformidad estricta de esas mecánicas sigue pendiente; describirlas como reglas oficiales sería incorrecto. Este PR no las reimplementa ni cambia la jugabilidad para resolverlo.

## Validación

- TypeScript sin errores; compilación web correcta (se mantiene el aviso de Vite por tamaño del paquete).
- Batería completa: 18 suites y 452 pruebas correctas, 3 omitidas; después se añade una prueba de interfaz para SUPERAR y se ejecutan las cuatro suites afectadas: 26 pruebas correctas.
- Validador de aventuras correcto: 13 avisos de datos no bloqueantes.
- Chromium: nueva partida, pueblo, mapa, guardado, recarga y carga en 390×844, 1280×800, 1024×768 y 844×390.
- Chromium en combate: MAZA directa, selección de DEFENDER, hijos, pestañas independientes, ausencia de cambios de estado al consultar y ataque al pulsar el cuerpo. Tamaños 390×844, 844×390, 1280×800 y 320×568. Capturas en `/tmp/mazmorreo-combate-*.png`; revisión de bordes y textos anchos/estrechos.
- Metro genera el bundle Android y copia los 386 recursos, incluidos ambos PNG. No hay dispositivo/emulador Android conectado: queda pendiente la comprobación táctil y visual nativa en dispositivo. No se solicita ni ejecuta GitHub Actions para APK.

Para repetir la prueba de combate, iniciar `npm run web -- --port 5174` y ejecutar `node scripts/probar-combate.cjs`. La prueba importa módulos del servidor Vite para preparar estados reproducibles; no se añaden accesos de prueba a la aplicación publicada. Reiniciar Vite tras cambios de módulos evita mezclar instancias conservadas por HMR.
