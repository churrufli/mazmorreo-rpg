# Guía de mantenimiento de contenido y narrativa

Estas convenciones describen el comportamiento actual de Mazmorreo y los criterios de las últimas revisiones. Aplicarlas a las tres aventuras y a futuras ampliaciones.

## 1. Historia independiente del decorado del mapa

Los mapas hexagonales utilizan fondos y objetos que pueden no coincidir exactamente con lo narrado. **No afirmar que el jugador ve en el mapa un objeto, camino, saco, escalera, hueco, reja, puerta o pasadizo si su presencia gráfica no está garantizada.**

- **Correcto:** «El vigía os confía una pista sobre una antigua ruta de mantenimiento».
- **Incorrecto:** «Detrás del saco hay un hueco. Ya lo veis en el mapa».
- **Correcto:** «Habéis descubierto un secreto».
- **Incorrecto:** «Se abre un pasadizo junto a la pared que podéis ver en la casilla».

Una escena interactiva **sí** puede presentar una trampa, un objeto o un mecanismo propio de la escena, pero no debe insinuar que está dibujado en el mapa si no lo está. Las consecuencias deben seguir funcionando aunque el decorado sea genérico.

## 2. Diálogos y escenas

- Priorizar textos breves, legibles en móvil, que aporten decisión, información relevante o carácter.
- Mantener coherencia con la trama, los nombres y las consecuencias ya definidas.
- Los aliados se eligen en la posada: **ninguna información imprescindible para entender una aventura debe depender de un aliado opcional**.
- Evitar referencias a cantidades exactas de enemigos cuando el escalado pueda cambiarlas.
- Las elecciones deben tener consecuencias reconocibles y conservar sus efectos de juego.

## 3. Estructura de aventuras

| Aventura | Datos | Prefijos de zona |
| --- | --- | --- |
| Las profundidades de Hondaroca | `src/data/hondaroca.json` | `z1`–`z4` |
| El Corazón Hueco | `src/data/corazon.json` | `b1`–`b4` |
| El Invierno del Dragón | `src/data/montana.json` | `m1`–`m4` |

El registro de aventuras, jefes, aliados y pueblos está en `src/engine/aventuras.ts`. Las conversaciones de afinidad están en `src/data/charlas.json`. Los textos de ayuda y novedades se mantienen en `src/data/ayuda.ts`.

## 4. Equilibrio de encuentros

- Mantener la referencia a D&D 2024 SRD 5.2.1, con adaptación de **composición y recursos** a un juego individual.
- No duplicar jefes por ajustes automáticos; conservar las recompensas previstas.
- Respetar filas y límites de enemigos, salvo refuerzos expresamente derivados de decisiones.
- Comprobar por separado el juego con uno, dos, tres y cuatro personajes; una prueba con grupo completo no garantiza que una clase solitaria sobreviva.
- Señalizar las amenazas opcionales especialmente duras y permitir que puedan evitarse.
- No confundir la simulación estadística simplificada con la ejecución de pruebas de integración o partidas reales.

## 5. Comprobaciones antes de publicar

```bash
npm ci
npm run validate:adventures
npx tsc --noEmit
npm test -- --runInBand
```

Para el estudio opcional con bot:

```bash
ESTUDIO=1 N=20 npx jest estudio --runInBand
```

Verificar también en Android la legibilidad de escenas, las consecuencias de elecciones, el guardado y la continuidad de aventuras. **No afirmar que una prueba ha pasado sin ejecutarla**.

## 6. APK y versiones

El workflow `.github/workflows/android.yml` se inicia **manualmente** con **Run workflow**. Compila y publica un APK de prueba con nombre `mazmorreo-N.apk` y etiqueta `v0.N`, siendo `N` el número de ejecución. Fusionar una PR no compila automáticamente el APK.
