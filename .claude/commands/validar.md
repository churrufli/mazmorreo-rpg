---
description: Comprueba el proyecto como la validación de PR (TypeScript, lint, tests, aventuras y web)
---

Ejecuta en orden y para en el primer fallo:

1. `npx tsc --noEmit`
2. `npm run lint` (sin errores; los avisos no paran)
3. `npm test -- --ci --runInBand`
4. `node scripts/validar-aventuras.mjs src/data/hondaroca.json src/data/corazon.json src/data/montana.json src/data/tumba.json`
5. `npm run web:build`

Resume en español qué pasó en cada paso. Si algo falla, explica la causa y propón el arreglo mínimo, pero no lo apliques sin que te lo pidan.
