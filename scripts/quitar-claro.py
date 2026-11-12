# Quita el fondo blanco y las sombras claras grisáceas (suelo blanco que ChatGPT pinta bajo los objetos del mapa).
# Uso: python3 scripts/quitar-claro.py entrada.png salida.png
# Transparente: píxeles claros (luz > 0,78) y casi grises (saturación < 0,12); borde suavizado entre 0,72 y 0,78.
import sys
import numpy as np
from PIL import Image, ImageFilter

im = np.asarray(Image.open(sys.argv[1]).convert('RGBA')).astype(np.float32) / 255
rgb = im[..., :3]
mx, mn = rgb.max(-1), rgb.min(-1)
light = (mx + mn) / 2
sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
alpha = np.clip((0.78 - light) / 0.06, 0, 1)            # 1 = opaco, 0 = transparente
alpha = np.where(sat < 0.12, alpha, 1.0)                  # lo que tiene color se queda
a = Image.fromarray((alpha * im[..., 3] * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(3))
out = np.asarray(Image.open(sys.argv[1]).convert('RGBA')).copy()
out[..., 3] = np.asarray(a)
Image.fromarray(out).save(sys.argv[2])
