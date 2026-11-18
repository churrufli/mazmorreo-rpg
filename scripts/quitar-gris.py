# Quita el fondo blanco y las sombras grises de un objeto con color (estatua de la cobra de la tumba).
# Uso: python3 scripts/quitar-gris.py entrada.png salida.png
# Transparente: lo casi gris (saturación < 0,06) salvo que sea oscuro; borde suavizado hasta 0,12.
import sys
import numpy as np
from PIL import Image, ImageFilter

im = np.asarray(Image.open(sys.argv[1]).convert('RGBA')).astype(np.float32) / 255
rgb = im[..., :3]
mx, mn = rgb.max(-1), rgb.min(-1)
light = (mx + mn) / 2
sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
alpha = np.maximum(np.clip((sat - 0.06) / 0.06, 0, 1), np.clip((0.45 - light) / 0.08, 0, 1))
a = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5))
out = np.asarray(Image.open(sys.argv[1]).convert('RGBA')).copy()
out[..., 3] = np.asarray(a)
Image.fromarray(out).save(sys.argv[2])
