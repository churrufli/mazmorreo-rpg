#!/usr/bin/env bash
# Convierte el arte aprobado (/mnt/project-files/arte) a WebP reducido en assets/img
# y genera src/assets.ts. Requiere ImageMagick con soporte WebP.
set -euo pipefail
SRC=${1:-/mnt/project-files/arte}
OUT=assets/img
rm -rf "$OUT"; mkdir -p "$OUT"
name() { basename "$1" | sed -E 's/\.[a-z]+$//; s/^[0-9]+\.[0-9]+[_-]//; s/^x?[0-9]+[_-]//'; }
# Fondo blanco -> transparente rellenando desde las 4 esquinas.
# Con un 4º argumento "todo", quita también el blanco encerrado (p. ej. dentro de un arco); con "x,y",
# rellena además desde ese punto (un hueco cerrado sin tocar los brillos blancos del objeto).
cutout() {
  local w h extra=(); read -r w h < <(identify -format "%w %h\n" "$1")
  [ "${4:-}" = todo ] && extra=(-fuzz "${TODO_FUZZ:-12%}" -transparent white -fuzz "${FUZZ:-12%}")
  [[ "${4:-}" =~ ^[0-9]+,[0-9]+$ ]] && extra=(-draw "color ${4/,/ } floodfill")
  convert "$1" -alpha set -fuzz "${FUZZ:-12%}" -fill none "${extra[@]}" \
    -draw "color 0,0 floodfill" -draw "color $((w-1)),0 floodfill" \
    -draw "color 0,$((h-1)) floodfill" -draw "color $((w-1)),$((h-1)) floodfill" \
    -trim +repage -resize "$2x$2" -background none -gravity center -extent "$2x$2" -quality 82 "$3"
}
# Objetos del mapa del bosque: además del blanco, quita la sombra clara grisácea que ChatGPT pinta debajo.
claro() { python3 scripts/quitar-claro.py "$1" /tmp/claro.png && convert /tmp/claro.png -trim +repage -resize "$2x$2" -background none -gravity center -extent "$2x$2" -quality 82 "$3"; }
# Héroes del otro sexo (3.xb): se guardan como hero_<clase>_<especie>_b.
for f in "$SRC"/personajes/heroes/sexo-sin-revisar/*.png; do
  convert "$f" +repage -resize 512x768^ -gravity center -extent 512x768 -quality 74 "$OUT/$(basename "$f" .png | sed -E 's/^[0-9.]+b_//')_b.webp"; done
for f in "$SRC"/fondos/*.*; do convert "$f" -resize 720x -quality 72 "$OUT/$(name "$f").webp"; done
for f in "$SRC"/personajes/heroes/*.* "$SRC"/personajes/aliados/*.* "$SRC"/enemigos/*.*; do
  convert "$f" -resize 512x768^ -gravity center -extent 512x768 -quality 74 "$OUT/$(name "$f").webp"; done
for f in "$SRC"/mapa/*.*; do
  n=$(name "$f")
  case "$n" in suelo_*|pared_*|agua_*) convert "$f" -resize 256x256 -quality 80 "$OUT/$n.webp";;
    puente) cutout "$f" 256 "$OUT/$n.webp" todo;;
    arbol_grande|arbol_caido|tocon|setas|arbusto_espinoso|roca_musgo|totem|altar_druidico|cabana|campamento|piedra_erguida|barriles_cajas|mesa_papeles|atril_libro) claro "$f" 256 "$OUT/$n.webp";;
    pasarela|raiz_arqueada|sacos_mineral) FUZZ=30% cutout "$f" 256 "$OUT/$n.webp" todo;;
    tela_arana|barricada_ramas) cutout "$f" 256 "$OUT/$n.webp" todo;;
    *) FUZZ=30% cutout "$f" 256 "$OUT/$n.webp";; esac  # 30 %: quita el halo claro que deja el recorte
done
cutout "$SRC/mapa/extras/5.16_altar_orvane.png" 256 "$OUT/altar_orvane.webp"
for f in "$SRC"/objetos/*.* "$SRC"/efectos/*.*; do
  n=$(name "$f"); case "$n" in llave) cutout "$f" 256 "$OUT/$n.webp" 882,294;; arco_*|periapto_*|red|simbolo_sagrado|amuleto_corteza|anillo_calor|sello_deshielo) cutout "$f" 256 "$OUT/$n.webp" todo;; *) cutout "$f" 256 "$OUT/$n.webp";; esac; done
# Aliados del bosque y de la montaña (banco de PNJ) y la abuela Brezna.
for p in 3.37_abuela_ortiga:abuela_ortiga pnj_exploradora_elfa_pelirroja:ally_maren pnj_monje_calvo_farol:ally_anselmo \
  pnj_guerrera_escudo_arbol_v1:ally_ivelle pnj_mago_anciano_v1:ally_telmo \
  pnj_orca_hacha_v1:ally_vurka pnj_enano_martillo_farol_v1:ally_durnok pnj_maga_elfa_morena_azul:ally_syrael pnj_explorador_humano_capucha_daga:ally_aldric; do
  convert "$SRC/personajes/banco-pnj/${p%%:*}.png" -resize 512x768^ -gravity center -extent 512x768 -quality 74 "$OUT/${p##*:}.webp"; done
convert "$SRC/ui/7.3_mapa_reino.png" -resize 1080x -quality 75 "$OUT/mapa_reino.webp"
for f in "$SRC"/ui/iconos/*.*; do cutout "$f" 96 "$OUT/icono_$(name "$f" | sed 's/^7\.1_//').webp"; done
cp "$SRC/ui/logo_definitivo_sombra.webp" "$OUT/logo.webp"
convert "$SRC/ui/1.7_marco_carta.png" -alpha set -fuzz 10% -transparent white -resize 512x768 -quality 85 "$OUT/marco_carta.webp"
{
  echo "// Generado por scripts/convertir-arte.sh. No editar a mano."
  echo "export const IMG = {"
  for f in "$OUT"/*.webp; do n=$(basename "$f" .webp); echo "  $n: require('../assets/img/$n.webp'),"; done
  echo "};"
  echo "export type ImgKey = keyof typeof IMG;"
} > src/assets.ts
du -sh "$OUT"; ls "$OUT" | wc -l
