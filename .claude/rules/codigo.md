---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "App.tsx"
---

# Código

- Estilo de Prettier del repo: comillas simples, coma final, sin paréntesis en flechas de un parámetro.
- Lógica de juego en `src/engine/`, sin React ni dependencias de plataforma; las pantallas solo la llaman.
- Lo específico de Android o web va en archivos `.ts` / `.web.ts` (ver `platform`, `storage`).
- Tiradas siempre con `src/engine/rng.ts` para que los tests sean reproducibles.
- Un cambio de reglas o de equilibrio lleva su test en `src/engine/*.test.ts`.
- No toques `src/version.ts` a mano: lo escribe el workflow de la APK.
