# Créditos

## Reglas

- **System Reference Document 5.2.1** de Wizards of the Coast LLC, con licencia CC BY 4.0. Atribución completa en [NOTICE.md](NOTICE.md).

## Tipografías

- **Cinzel**, de The Cinzel Project Authors ([NDISCOVER/Cinzel](https://github.com/NDISCOVER/Cinzel)). SIL Open Font License 1.1.
- **Cormorant Garamond**, de The Cormorant Project Authors ([CatharsisFonts/Cormorant](https://github.com/CatharsisFonts/Cormorant)). SIL Open Font License 1.1.

## Iconos

- **Material Design Icons** de [Pictogrammers](https://pictogrammers.com/), vía `@mdi/js`. Apache 2.0.

## Ilustraciones

- Generadas con ChatGPT (OpenAI) a partir de indicaciones del proyecto, y seleccionadas, corregidas y recortadas a mano. Licencia en [LICENSE-CONTENIDO.md](LICENSE-CONTENIDO.md).

## Música, ambientes y efectos de sonido

Todo el audio está en `android/app/src/main/res/raw/`, convertido a OGG, recortado y con el volumen igualado.

### Música

Las seis pistas (`mus_principal`, `mus_pueblo`, `mus_combate`, `mus_minas`, `mus_bosque` y `mus_jefe`) se crearon con [Suno](https://suno.com) en su plan gratuito.

**Excepción a las licencias del proyecto.** Según las condiciones de Suno, estas pistas pertenecen a Suno y solo se pueden usar sin fines comerciales y citando a Suno. Por eso **no** van con la licencia CC BY-NC-SA 4.0 ni con la MIT del proyecto:

- Se incluyen solo para que Mazmorreo, que es y será siempre gratuito y sin anuncios, tenga su música.
- No se pueden reutilizar fuera de Mazmorreo ni en una versión con fines comerciales.
- Si haces una versión derivada del juego, sustitúyelas o comprueba antes las condiciones de Suno.

### Ambientes

| Archivo | Origen | Autor | Licencia |
| --- | --- | --- | --- |
| `amb_lava_cave` | [Ambience pack](https://freesound.org/people/yewbic/packs/2122/) (ambience01) | yewbic | CC0 |
| `amb_forest_day` | [Nature Sounds Pack](https://opengameart.org/content/nature-sounds-pack) (AmbientNatureOutside) | Antoine Goumain | CC BY 4.0 |
| `amb_waterfall` | [Nature Sounds Pack](https://opengameart.org/content/nature-sounds-pack) (Stream01, en bucle) | Antoine Goumain | CC BY 4.0 |

### Efectos

| Archivos | Origen | Autor | Licencia |
| --- | --- | --- | --- |
| `sfx_door_wood_open`, `sfx_chest_open_02`, `sfx_coins_pouch` | [RPG Audio](https://kenney.nl/assets/rpg-audio) | Kenney | CC0 |
| `sfx_punch`, `sfx_explosion_big`, `sfx_steps_grass`, `sfx_steps_stone` | [Impact Sounds](https://kenney.nl/assets/impact-sounds) | Kenney | CC0 |
| `sfx_click_soft`, `sfx_confirm`, `sfx_error`, `sfx_heal` | [Interface Sounds](https://kenney.nl/assets/interface-sounds) | Kenney | CC0 |
| `sfx_dado` | [Casino Audio](https://kenney.nl/assets/casino-audio) | Kenney | CC0 |
| `ui_victoria`, `ui_victoria_corta`, `ui_nivel`, `ui_objeto`, `ui_derrota` | [Music Jingles](https://kenney.nl/assets/music-jingles) (pizzicato) | Kenney | CC0 |
| `sfx_fireball`, `sfx_ice_spell`, `sfx_monster_growl`, `sfx_slime`, `sfx_coin_pickup`, `sfx_chest_open_01` | [80 CC0 RPG SFX](https://opengameart.org/content/80-cc0-rpg-sfx) | rubberduck | CC0 |
| `sfx_sword_hit_shield`, `sfx_arrow_shot`, `sfx_potion_drink` | [Fantasy Sound Effects (Tinysized SFX)](https://opengameart.org/content/fantasy-sound-effects-tinysized-sfx) | Vehicle (Jan Schupke) | CC0 |
| `sfx_sword_swing`, `sfx_lightning` | [RPG Sound Pack](https://opengameart.org/content/rpg-sound-pack) | artisticdude | CC0 |

## Librerías

React Native, React, React Native Web, Zustand, MMKV, react-native-sound, react-native-svg, Vite y sus dependencias, con licencias MIT, ISC, BSD y Apache 2.0. La lista completa está en `package-lock.json`.
