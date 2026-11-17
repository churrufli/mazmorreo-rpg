# Elementos dinámicos: imágenes pendientes (fase 2)

Los mapas tienen elementos que cambian de estado durante la aventura (un derrumbe que se retira, una verja que se alza, una barrera que se apaga…). Ya funcionan con **marcadores provisionales** dibujados con formas sencillas. Este documento recoge todas las imágenes que hacen falta para sustituirlos.

Cómo funciona por dentro: `src/engine/elementos.ts` (motor y catálogo de tipos), `src/ui/ElementoMapa.tsx` (dibujo) y el campo `elements` de cada zona en `src/data/*.json`.

## Lo que hay que hacer con cada imagen

Cada estado tiene una **clave fija** con la forma `din_<tipo>_<estado>`. Para incorporar una imagen no hay que tocar código ni reglas:

1. Guarda el original como `/mnt/project-files/arte/mapa/dinamicos/din_<tipo>_<estado>.png`.
2. Conviértelo a `assets/img/din_<tipo>_<estado>.webp` (256 × 256 con transparencia). `scripts/convertir-arte.sh` ya lo hace con todo lo que haya en esa carpeta mediante `scripts/convertir-dinamicos.py` (sin recortar ni recentrar, para no mover el encuadre entre estados).
3. Añade su línea en `src/assets.ts`, en orden alfabético: `  din_<tipo>_<estado>: require('../assets/img/din_<tipo>_<estado>.webp'),`. La versión web (`src/assets.web.ts`) se genera sola al compilar.

En cuanto la clave existe, el mapa usa la imagen en lugar del marcador provisional. Si falta la imagen de un estado, ese estado sigue con su marcador: se pueden entregar una a una.

## Reglas comunes a todas las imágenes

Son objetos del mapa, así que siguen el prompt de «Objetos del mapa» de `docs/GUIA_ARTE.md` y la `docs/arte/referencia-maestra.png`, con estas condiciones extra:

- **Formato del original**: PNG cuadrado 1024 × 1024, fondo blanco puro (#FFFFFF) liso. Sin damero de transparencia, sin sombras sobre el fondo, sin textos ni cuadrícula. El recorte lo hacemos nosotros: el resultado final es WebP 256 × 256 **con transparencia**.
- **Perspectiva**: vista cenital o de tres cuartos desde arriba, **la misma en todos los estados de un elemento y en todos los elementos**. La luz, suave desde arriba a la izquierda.
- **Encuadre fijo**: el objeto, centrado, ocupa alrededor del 75 % del lienzo. En el juego se dibuja en un cuadrado de 1,6 veces el radio de la casilla, centrado en ella (unos 48 px en pantalla), por encima del suelo y por debajo de las fichas.
- **Mismo sitio, misma escala**: los estados de un mismo elemento se intercambian sin moverse. Hay que generarlos como variantes de una misma imagen: mismo encuadre, mismo centro, mismo tamaño de la base y misma luz. Lo que cambia es solo lo que pide el estado (la verja sube, las piedras quedan en el suelo…). Recomendación: hacer primero el estado inicial y pedir los demás como edición de esa imagen.
- **Orientación**: los pasos que cierran (verja, puerta, barrera, derrumbe) se dibujan de frente, con el hueco o la abertura en horizontal, porque la casilla no sabe hacia dónde va el pasillo. Nada debe depender de una dirección concreta.
- **Estados «abiertos»**: deben dejar claro que se puede pasar. Lo que quede (restos, marco, verja alzada) se dibuja pegado a los bordes o al suelo y deja libre el centro de la casilla, donde se pone la ficha del grupo.
- **Legibilidad**: deben distinguirse sobre suelos de mina, piedra enana, cripta, monasterio inundado y fortaleza helada. Silueta clara, legible a 48 px.
- **Genéricas**: la misma imagen sirve para todas las aventuras. Sin emblemas ni símbolos de un lugar concreto, y sin violeta salvo en los elementos mágicos.

## Imágenes necesarias ahora (11): ya incorporadas

Las 11 están incorporadas (17 de noviembre de 2026). Son las de los elementos que ya están en las aventuras. Agrupadas por tipo de elemento.

### Escombros (rocas y escombros)

Se usa en la mina de Hondaroca (`z1_x01`, «Derrumbe de la galería», zona `z1`, casilla `4,-1`): tapa la galería que lleva a la cámara de las poleas y se retira con una prueba de Fuerza, una palanqueta o a mano.

| Código | Elemento | Estado | Descripción visual | Transparencia | Relación con los demás estados |
| --- | --- | --- | --- | --- | --- |
| `din_escombros_intactos` | Escombros | Intactos (bloquea) | Montón alto y compacto de rocas grises y pardas de mina, con alguna viga de madera rota asomando. Llena casi todo el cuadrado y se ve claramente infranqueable. | Sí | Estado inicial. Base y encuadre de referencia para `retirados`. |
| `din_escombros_retirados` | Escombros | Retirados (se pasa) | Las mismas rocas, ya apartadas: unas pocas piedras pequeñas y polvo repartidos por los bordes, la viga rota tirada a un lado. El centro queda libre y transitable. | Sí | Misma luz, misma escala y mismas piedras que `intactos`, solo que movidas. |

### Puertas

Se usa en la cripta de Hondaroca (`z3_x01`, «Puerta de las cenizas», zona `z3`, casilla `3,5`): se fuerza el cerrojo (queda desbloqueada) y después se empuja, o se abre de una embestida.

| Código | Elemento | Estado | Descripción visual | Transparencia | Relación con los demás estados |
| --- | --- | --- | --- | --- | --- |
| `din_puerta_bloqueada` | Puerta | Bloqueada (bloquea) | Puerta de una hoja, de madera reforzada con herrajes de bronce viejo, vista de frente y cerrada, dentro de un marco de piedra. Un cerrojo grueso de bronce, cerrado y verdoso de óxido, bien visible. | Sí | Estado inicial. Base de `desbloqueada` y `abierta`. |
| `din_puerta_desbloqueada` | Puerta | Desbloqueada (aún bloquea) | La misma puerta, todavía cerrada, pero con el cerrojo descorrido y suelto. Una rendija de luz cálida en el borde de la hoja indica que ya cede. | Sí | Idéntica a `bloqueada` salvo el cerrojo abierto y la rendija. |
| `din_puerta_abierta` | Puerta | Abierta (se pasa) | El mismo marco de piedra con la hoja abierta hacia dentro, pegada a un lado; el hueco central, despejado y oscuro. | Sí | Mismo marco, misma posición y escala que los otros dos. |

### Verjas

Se usa en la fortaleza enana de El Invierno del Dragón (`m3_x02`, «Verja de las válvulas», zona `m3`, casilla `-7,6`): la mueve el contrapeso de otra sala. Es reversible (sube y baja).

| Código | Elemento | Estado | Descripción visual | Transparencia | Relación con los demás estados |
| --- | --- | --- | --- | --- | --- |
| `din_verja_cerrada` | Verja | Cerrada (bloquea) | Rastrillo de barrotes de hierro gruesos, verticales, con un travesaño horizontal, bajado hasta el suelo entre dos jambas de piedra enana. Algo de escarcha en el hierro. Sin cerradura. | Sí | Estado inicial. Base de `abierta`. |
| `din_verja_abierta` | Verja | Abierta (se pasa) | Las mismas jambas con el rastrillo alzado: solo se ven las puntas de los barrotes asomando por arriba. El hueco central, libre. | Sí | Mismas jambas, misma escala y posición. Se alterna con `cerrada` en ambos sentidos. |

### Palancas (mecanismos)

Se usa en la misma fortaleza (`m3_x01`, «Palanca del contrapeso», zona `m3`, casilla `-7,-2`): al pisarla se baja o se sube y mueve la verja de otra sala.

| Código | Elemento | Estado | Descripción visual | Transparencia | Relación con los demás estados |
| --- | --- | --- | --- | --- | --- |
| `din_palanca_reposo` | Palanca | En reposo (se pisa) | Palanca enana de hierro con empuñadura de latón, sobre una base de piedra cuadrada y baja anclada al suelo. Brazo inclinado hacia la izquierda. Cadena corta que sale de la base. | Sí | Estado inicial. Base de `activada`. |
| `din_palanca_activada` | Palanca | Activada (se pisa) | La misma palanca con el brazo inclinado hacia la derecha y la cadena tensa. | Sí | Idéntica salvo el brazo y la cadena. Se alterna con `reposo` en ambos sentidos. |

### Barreras mágicas

Se usa en el monasterio de Hondaroca (`z4_x01`, «Sello de la sala de los sellos», zona `z4`, casilla `-12,15`): se apaga al vencer a los devotos de la cámara de estudio.

| Código | Elemento | Estado | Descripción visual | Transparencia | Relación con los demás estados |
| --- | --- | --- | --- | --- | --- |
| `din_barrera_activa` | Barrera mágica | Activa (bloquea) | Cortina vertical de luz violeta translúcida que surge de un círculo de runas en el suelo, con destellos leves. Se ve a través, pero es claramente una barrera. | Sí (semitransparente) | Estado inicial. Base de `disipada`. |
| `din_barrera_disipada` | Barrera mágica | Disipada (se pasa) | El mismo círculo de runas en el suelo, apagado y gris, con unas últimas chispas apagándose. Sin cortina de luz. | Sí | Mismo círculo, misma escala y posición. |

## Imágenes para más adelante (opcionales)

El catálogo de tipos ya admite estos elementos aunque ninguna aventura los use todavía. No hace falta prepararlos ahora; cuando una aventura los use, se piden con las mismas reglas.

| Tipo | Estados (clave `din_<tipo>_<estado>`) | Idea visual |
| --- | --- | --- |
| `roca` | `intacta`, `destruida` | Roca grande única / la misma roca partida en trozos en el suelo. |
| `puerta` | `cerrada` | Como `abierta` pero cerrada sin cerrojo (puerta reversible). |
| `puente` | `roto`, `reparado`, `intacto`, `destruido` | Puente corto de tablones sobre agua o grieta: con tablas que faltan / completo con tablas nuevas / completo / solo cuerdas colgando. |
| `pasarela` | `recogida`, `desplegada` | Pasarela de tablones plegada contra un lado / extendida cruzando la casilla. |
| `interruptor` | `apagado`, `encendido` | Placa de presión o cristal en un pedestal: apagado / brillando. |
| `compuerta` | `cerrada`, `abierta` | Compuerta de piedra en un canal: bajada / alzada con agua pasando. |
| `barricada` | `intacta`, `destruida` | Barricada de tablas y troncos / tablas rotas por el suelo. |
| `barriles` | `intactos`, `rotos` | Barriles y cajas apilados / astillas y aros. |
| `muro_agrietado` | `agrietado`, `derrumbado` | Muro con una grieta grande / hueco con cascotes. |
| `sello` | `intacto`, `roto` | Sello circular dorado en el suelo / partido en dos. |
| `portal` | `inactivo`, `activo` | Arco de piedra vacío / con un velo de luz verdeazulada. |
| `agua` | `inundado`, `drenado` | Agua profunda que cubre la casilla / suelo mojado con charcos. |
| `camino` | `bloqueado`, `despejado` | Árbol caído o ramas cruzadas / ramas apartadas. |

## Entrega

Puedes entregarme las imágenes una a una en una conversación nueva diciendo solo su código (por ejemplo, «esta es `din_verja_cerrada`»). Yo las convierto, las añado a `src/assets.ts` y compruebo en el navegador que el cambio entre estados no da saltos.
