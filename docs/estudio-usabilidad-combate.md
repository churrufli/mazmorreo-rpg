# Estudio de usabilidad del combate

Evaluación técnica y de recorridos de Mazmorreo, en español de España. Fecha: 9 de noviembre de 2026.

## Alcance, método y límites

Se revisan orientación, acciones, costes, objetivos, información, efectos, incapacidad, entrega del turno y resultados. El método combina lectura del motor y de la interfaz, evaluación heurística, recorrido cognitivo y pruebas de navegador con partidas preparadas. Se consideran principiantes en D&D, jugadores habituales, uso con una mano, móvil pequeño y orientación horizontal.

**No han participado usuarios reales.** Se han medido geometría, estados y transiciones; no tiempos de aprendizaje ni satisfacción. La evaluación no certifica accesibilidad y no sustituye la prueba física en Android. Se propone al final un protocolo con personas.

### Versiones analizadas y cambio concurrente

El diagnóstico comenzó en `2d58be0` (#48). Durante su validación se fusionó `576ee29` (#49), que cambia la interacción: tres categorías, Esquivar fijo, movimiento sobre el campo, ataque directo sobre enemigos y huida con confirmación. Después entró también `0247234` (#51): movimiento por botón y ejecución de cualquier acción con objetivo único. **La entrega integra #49 y #51** y conserva esos recorridos. No restaura el antiguo DEFENDER ni la propuesta intermedia MOVERSE: defensa y movimiento ya están separados.

El estudio diferencia los problemas iniciales, lo resuelto por la versión concurrente y las correcciones adicionales. Se repiten las pruebas sobre la integración, sin dar por válidas automáticamente las capturas de la versión anterior.

## Modelo mental y reglas de presentación

| Estado | Qué significa para el jugador |
| --- | --- |
| Acción disponible | Puede elegir una acción legal: atacar, Esquivar, huir, etc. Tener acción no garantiza un recurso u objetivo válido. |
| Acción gastada | No puede activar Esquivar ni atacar ni huir con esa acción; puede conservar adicional y movimiento. |
| Adicional gastada | Conserva la acción y el movimiento no utilizados. |
| Movimiento gastado | Conserva la acción y la adicional no utilizadas. |
| Turno terminado | Se cede el control al siguiente participante. No puede activar una nueva defensa para el anterior. |
| Esquivar activado | El efecto permanece hasta el inicio del siguiente turno propio, sujeto a las limitaciones que calcula el motor. No concede otra acción al terminar. |
| Incapacidad o enemigo | Resolución automática, sin decisiones manuales para ese participante. |
| Combate terminado | Victoria, derrota o huida; resumen y navegación existentes, sin nuevas acciones. |

No se modifican reglas del motor ni se añaden reacciones o recursos. La organización por vanguardia/retaguardia y sus costes son adaptaciones existentes del juego; no deben presentarse como reglas universales del SRD.

## Recorrido completo

1. **Entrada:** entender el encuentro y comenzar conscientemente; durante el cartel de asalto las acciones no se ejecutan.
2. **Orientación:** reconocer participante activo, recursos restantes, filas, intenciones enemigas y objetivo opcional.
3. **Decisión:** escoger entre ATACAR, HABILIDADES y OBJETOS, o Esquivar, IR ATRÁS / IR DELANTE, huir y terminar. Las categorías llevan iconos; los costes y sus símbolos conservan la correspondencia de #49.
4. **Consulta:** pestaña ornamental sin consumo; ficha por pulsación larga sobre enemigos, para evitar el ataque rápido. Ayuda y registro también son consultas.
5. **Elección:** con varios objetivos, el primer toque en habilidades u objetos explica y señala objetivos; un objetivo o un segundo toque confirma según la acción. Cualquier acción con objetivo único o indistinguible conserva ejecución directa (#51).
6. **Objetivo:** reconocer los resaltados, diferenciar curación y ataque, recibir aviso ante un toque inválido y poder cancelar o cambiar de categoría sin gasto.
7. **Confirmación:** comprobar estado vivo, participante, turno, recursos y objetivo; rechazar selección obsoleta y doble confirmación.
8. **Resultado:** ver tirada y efectos; conservar mensajes en el registro ampliado. La resolución automática espera la tirada anterior.
9. **Continuación:** actualizar recursos; gastar acción no implica gastar adicional o movimiento. Recuperar acción vuelve a habilitar sus opciones.
10. **Entrega:** borrar selección antes de presentar el siguiente turno. El cierre automático sin opciones útiles se conserva, pero se pausa al leer.
11. **Cierre:** esperar presentación del resultado y mostrar resumen. Las reglas existentes de victoria, derrota, huida, recompensas y secretos se conservan.

## Hallazgos y decisiones

P1 afecta a una tarea principal o a su comprensión. P2 aumenta esfuerzo o dificulta lectura. No se ha demostrado que el motor permitiera Esquivar ilegalmente en la versión inicial: el problema observado era la promesa visual de DEFENDER.

| ID | Prioridad y evidencia | Resultado final |
| --- | --- | --- |
| U01 | P1. DEFENDER parecía disponible con acción gastada porque agrupaba movimiento. | #49 separa Esquivar y cambio de fila. Se conserva esa solución y se refuerza la comprobación del participante activo antes de ejecutar. |
| U02 | P1. Costaba distinguir recursos gastados y fin del turno. | Se conserva el presupuesto de #49 y sus símbolos de coste; se añaden 1/0 visibles también en pantallas estrechas. Ayuda explícita sobre acción, adicional, movimiento y duración de Esquivar. |
| U03 | P1. La información podía desplazar controles y el campo. | Se conserva el panel fijo y la explicación en el registro de #49. Esquivar y terminar siguen fijos; HUIR permanece arriba y pide confirmación. Dos categorías por fila permiten mantener iconos y pestañas sin recortar nombres. El pie separa Esquivar y movimiento y deja terminar en otra fila para no reducir el texto. |
| U04 | P1. La resolución automática podía continuar detrás de consultas. | Pausa durante ficha, ayuda, ajustes, registro ampliado, explicación y confirmación de huida; continúa al cerrar. |
| U05 | P1. Superficies táctiles de cartas menores de 44 px en la muestra inicial. | Superficie mínima de carta de 44×44; ilustración centrada dentro. Márgenes y cabecera ajustados para conservar el campo. |
| U06 | P1. Una selección podía quedar obsoleta al cambiar de actor o incapacitarse. | Limpieza antes de pintar el nuevo turno; validación contra estado vivo e incapacidad automática para ejecución, fin de turno y ataque rápido. |
| U07 | P2. El registro compacto dificulta recuperar detalles anteriores. | Registro completo del combate, reutilizando la ventana de Exploración. No se pierde el historial al leer explicaciones. |
| U08 | P2. Tocar un objetivo inválido no explicaba el problema. | Aviso «elige un aliado/objetivo resaltado» y pistas de accesibilidad. Ningún consumo. |
| U09 | P2. Una acción automática podía sustituir una tirada aún visible. | Espera hasta terminar la presentación anterior; las acciones manuales conservan agilidad. |
| U10 | P1. Diferencia poco explícita entre activar Esquivar y conservar su efecto después del turno. | Explicación revisada y prueba de duración: persiste durante el turno enemigo y expira al comenzar el siguiente turno propio. |

### Evidencia inicial

En `2d58be0`, a 320×640 y 844×390: `dodgeLegal=false`, `rowLegal=true` y DEFENDER mantenía el dorado normal `rgb(244, 220, 170)`. La menor superficie táctil de carta medía respectivamente 33 y 28,66 px. Las capturas iniciales quedaron en `/tmp/usabilidad-antes-*.png` y las medidas en `/tmp/usabilidad-combate-base.json`. Son evidencia del estado inicial, no medidas de la interfaz integrada.

La estimación de contraste de la región central de las texturas, con el texto y capa oscura existentes, dio mínimos de 5,79:1 para padre y 7,42:1 para hijo. La medida se limita a esa región y combinación; no certifica bordes, estados ni toda la interfaz. Los PNG originales se conservan.

## Interacciones finales y prevención de errores

- ATACAR sigue como categoría incluso con una sola arma; ahora aparece abierta según #49. Abrir categorías no consume recursos.
- Tocar un enemigo puede atacar: para consultar su ficha sin atacar se mantiene pulsado. La pista de accesibilidad explica esta diferencia. La pestaña ornamental de un arma sigue siendo exclusivamente informativa.
- IR ATRÁS / IR DELANTE mueve al participante activo. Las cartas del grupo se reservan para consulta o selección de objetivo. El movimiento vuelve a validarse y no activa Esquivar.
- Esquivar está siempre en el pie. Primer toque explica; segundo ejecuta solo con acción y turno válidos. Si está agotado explica el motivo.
- HUIR arriba separa la retirada de terminar turno. Si es legal pide confirmación; «Seguir luchando» no consume nada. Si no, explica por qué.
- Las pestañas de categorías y acciones explican sin ejecutar ni consumir; consultar una acción no obliga a usarla. CANCELAR ACCIÓN deja la selección sin efecto.
- La confirmación de huida no debe provocar que avance el turno por debajo; ficha, ayuda y registro tampoco.
- Los símbolos de coste y sus números deben evaluarse con personas: disponibilidad del turno y recursos de ficha son conceptos distintos.

### Pulsaciones previstas

| Tarea | Recorrido final |
| --- | --- |
| Ataque rápido | Enemigo alcanzable: 1. |
| Arma explícita, ATACAR abierto, objetivo único | Arma: 1. |
| Arma y objetivos diferentes | Arma → objetivo: 2; abrir ATACAR añade 1 si estaba cerrada. |
| Consultar arma | Pestaña: 1 si está visible; cancelar: 1 más. |
| Esquivar | ESQUIVAR → ESQUIVAR: 2; primer toque sin consumo. |
| Moverse | IR ATRÁS / IR DELANTE: 1. |
| Poción con varios aliados | OBJETOS → poción → aliado: 3. |
| Huir | HUIR → confirmar: 2. Cancelar confirmación: 1 adicional sin gasto. |
| Terminar | TERMINAR TURNO: 1; descarta cualquier objetivo pendiente. |
| Revisar historial | Registro → Cerrar: 2. |

Son recorridos de diseño y automatización, no métricas de participantes.

## Matriz de situaciones

| Situación | Cobertura |
| --- | --- |
| Una o varias armas; categorías e hijos | Pruebas de flujo y compacto; dos columnas, nombres completos, centrado e iconos. |
| Ocho estados de acción/adicional/movimiento | Equivalencia con acciones legales del motor en 224 combinaciones: seis clases de héroe más bárbaro aliado, dos disponibilidades de recursos y dos filas. |
| Acción gastada, movimiento restante | Esquivar explica sin activarse; el botón de movimiento mueve sin defensa. Usabilidad y flujo. |
| Adicional gastada, acción restante | Esquivar sigue legal. Usabilidad. |
| Oleada de acción | Primer toque explica, segundo recupera acción y vuelve a permitir huir. Flujo. |
| Todos curados, recursos agotados, alcance y filas | Motivo o ausencia de opción según motor; sin consumo. Menú y flujo. |
| Objetivo inválido, cambio de categoría, cancelar | No ejecuta ni consume; feedback al tocar un enemigo durante curación. Flujo. |
| Ataque rápido y lectura | Ataque sobre enemigo en turno propio; ficha mediante pulsación larga; pestaña sin ataque. Flujo y usabilidad. |
| Doble toque y fin durante selección | Una confirmación, sin saltar participante ni ejecutar objetivo pendiente. Flujo. |
| Paralizado, caído o enemigo | Sin decisiones manuales ni ataque rápido; limpia selección anterior. Menú y usabilidad. |
| Ayuda, ficha y registro con enemigo activo | Estado congelado durante lectura y reanudación al cerrar. Usabilidad. |
| Duración de defensa | Persiste al ceder turno; desaparece en el siguiente turno propio, con acción renovada. Usabilidad. |
| Sin opciones útiles | Cierre automático existente, pausado al leer. Flujo. |
| Victoria, derrota, huida, muerte y recompensas | Pruebas existentes del motor; huida confirmada en navegador. No se rediseñan reglas. |
| Desarrollador, varias orientaciones y tamaños | Control compacto exclusivo del modo; geometría y campo en pruebas compacto. |

Estas pruebas no enumeran todos los encuentros ni todas las interacciones posibles de D&D.

## Verificación y entregables

El PR vuelve a ejecutar TypeScript, Jest, aventuras, web y tres scripts de navegador: `probar-combate-compacto.cjs`, `probar-flujo-combate.cjs` y `probar-usabilidad-combate.cjs`. Este último añade costes, defensa, superficies táctiles, incapacidad, duración y pausa/reanudación de consultas. Las pruebas usan React de producción: se reprodujo la desaparición del portal Modal de react-native-web con el montaje doble de StrictMode en desarrollo; StrictMode se conserva en la aplicación.

La integración pasa localmente **20 suites, 467 pruebas correctas y 3 omitidas**. La validación final de geometría, compilación y navegador se documenta en el PR y en CI, después de integrar #49 y #51. Las medidas anteriores a esa integración no se presentan como resultado final. Los formatos del estudio son 320×640, 360×640, 390×844, 844×390 y 1280×720.

CI publica `/tmp/mazmorreo-usabilidad-*.png`, el JSON de medidas y las capturas de compacto y flujo. Los PNG de producción no se modifican ni se crean otros nuevos. Android se comprueba mediante bundle JavaScript y resolución de recursos con Metro; no se genera APK. Queda pendiente Android físico.

Las pestañas de ficha por personaje, inventario, atributos, decisiones de desarrollador y consecuencias narrativas mantienen las pruebas existentes. Esta revisión no duplica sus implementaciones. La extracción del registro a `src/ui/LogModal.tsx` mantiene la ventana de Exploración por defecto.

## Pendientes y protocolo con personas

1. **Cartas pequeñas (P2):** ampliar la zona táctil no amplía la letra. En cuatro filas puede hacer falta abrir la ficha. Evaluar una lista nominal de objetivos antes de añadir más controles.
2. **Comprensión (P2):** comprobar si los símbolos y 1/0 se entienden y si la gente distingue tocar para atacar de mantener para consultar. El ataque rápido conservado de #49 requiere esa comprobación.
3. **Accesibilidad (P2):** revisar lector, foco, teclado, zoom y fuente del sistema en dispositivos reales. La pestaña mantiene la composición Pressable anidada existente; el HTML de desarrollo avisa de botones anidados. Separarlos como hermanos es trabajo pendiente, sin afirmar conformidad WCAG.
4. **Ritmo (P2):** evaluar movimiento reducido y presentación de dados con personas. El registro permite recuperar información, pero no demuestra comprensión.
5. **Dispositivos extremos (P2):** probar recortes, barras de navegador, cambio de orientación durante selección y fichas con numerosos estados. Los tamaños automatizados no los representan todos.

Propuesta: entre 5 y 8 participantes, principiantes y habituales; al menos tres en móvil. Usar partidas preparadas, sin riesgo para partidas personales. Pedir que identifiquen el turno y sus recursos, consulten un arma sin atacar, ataquen, valoren Esquivar tras atacar, cambien de fila, curen al aliado correcto, cancelen, recuperen acción, revisen el daño anterior, huyan o terminen. Incluir incapacidad y lectura durante turno enemigo.

Registrar éxito sin ayuda, dudas, errores de objetivo, consumos accidentales, pulsaciones y comprensión de acción/adicional/movimiento. Objetivos propuestos: 90 % de tareas sin ayuda, ningún gasto accidental y comprensión correcta de recursos por al menos cuatro de cada cinco personas. **Son metas futuras, no resultados observados.**

Si falla la comprensión del ataque rápido, probar una selección explícita previa; si falla el vocabulario, revisar símbolos y etiquetas; si fallan cartas pequeñas, ensayar lista de objetivos. Priorizar evidencia de tareas antes de aumentar la cantidad de botones.
