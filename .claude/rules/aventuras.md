---
paths:
  - "src/data/*.json"
  - "src/engine/aventuras.ts"
  - "src/engine/escenas.ts"
---

# Aventuras

Sigue `docs/GUIA_CONTENIDOS.md`. Lo esencial:

- Prefijos de zona: Hondaroca `z1`–`z4`, Corazón Hueco `b1`–`b4`, Invierno del Dragón `m1`–`m4`.
- IDs de salas y contenidos únicos en toda la aventura.
- Criaturas y estadísticas fieles al SRD 5.2.1 (`src/data/srd.ts`); se ajusta la composición de encuentros, no las criaturas.
- Jefes únicos: el escalado nunca duplica a Orvane, el Corazón ni Vharzûl.
- Máximo tres enemigos por fila. Límite ordinario 1/2/3/4 enemigos para grupos de 1/2/3/4, salvo refuerzos decididos en una escena.
- La historia no puede depender de lo que se dibuje en el mapa ni de llevar un aliado opcional.
- Tras editar, valida: `node scripts/validar-aventuras.mjs src/data/<aventura>.json`.
