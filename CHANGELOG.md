# Historial de cambios destacados

Este documento resume hitos funcionales comprobados en el código y en las PR recientes. **No sustituye las notas de versión de cada APK**, cuyo número depende de la ejecución de GitHub Actions.

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
