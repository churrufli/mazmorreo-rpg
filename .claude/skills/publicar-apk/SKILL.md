---
name: publicar-apk
description: Lanzar el workflow manual que compila la APK de Mazmorreo y la publica en Releases. Usar solo cuando el autor pida expresamente sacar o lanzar una APK.
---

# Publicar APK

**Solo con orden expresa del responsable del proyecto (@churrufli)** («lanza la APK», «saca la versión»). Si no la hay, no sigas.

1. Comprueba que lo que se quiere publicar ya está en `master` (PR unidos) y que la validación de PR está en verde.
2. Lanza el workflow **Android APK** (`.github/workflows/android.yml`) en la rama `master` con «Run workflow» (`workflow_dispatch`). Con la herramienta de GitHub: `actions_run_trigger` sobre `android.yml`, ref `master`.
3. El número de versión es el número de ejecución: la release sale como `v0.<run_number>` (prerelease) con `mazmorreo-<run_number>.apk`. No lo cambies a mano.
4. Espera a que termine (unos 10 minutos). Si falla, lee el registro del job y explica el error antes de tocar nada.
5. Da al responsable del proyecto el enlace de la release y la lista de novedades.

No uses `[release]` en mensajes de commit.
