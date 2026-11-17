#!/usr/bin/env python3
"""Convierte los originales de mapa/dinamicos (fondo blanco) a WebP 256x256 con transparencia.
A diferencia de `cutout`, NO recorta ni recentra: los estados de un elemento deben conservar el mismo encuadre.
Uso: convertir-dinamicos.py <origen.png> <destino.webp>"""
import sys
import numpy as np
from PIL import Image
from PIL import ImageFilter

src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB').resize((256, 256), Image.LANCZOS)
a = np.asarray(im).astype(np.float32)
mn = a.min(axis=2)
if 'barrera' in src:
    # Luz translúcida: el blanco pasa a alfa y se recupera el color (alfa = 255 - min(R,G,B)).
    alpha = np.clip((255 - mn) * 1.6, 0, 255)
    al = np.maximum(alpha, 1) / 255
    rgb = np.clip((a - 255 * (1 - al[..., None])) / al[..., None], 0, 255)
    out = np.dstack([rgb, alpha]).astype(np.uint8)
else:
    # Fondo = zonas casi blancas conectadas con el borde (30 %); huecos cerrados solo si son blanco puro.
    near = mn >= 255 * 0.70
    # Relleno desde el borde (sin scipy): se dilata la semilla dentro de la máscara hasta que no crece.
    reach = np.zeros_like(near)
    reach[0, :], reach[-1, :], reach[:, 0], reach[:, -1] = near[0, :], near[-1, :], near[:, 0], near[:, -1]
    while True:
        g = reach.copy()
        g[1:, :] |= reach[:-1, :]; g[:-1, :] |= reach[1:, :]; g[:, 1:] |= reach[:, :-1]; g[:, :-1] |= reach[:, 1:]
        g &= near
        if (g == reach).all():
            break
        reach = g
    bg = reach | (mn >= 250)
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    alpha = np.asarray(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.6)))
    out = np.dstack([a.astype(np.uint8), alpha])
Image.fromarray(out, 'RGBA').save(dst, quality=85, method=6)
