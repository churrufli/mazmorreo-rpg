import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { IMG } from '../assets';
import type { DmgType } from '../data/srd';
import type { FxKind } from '../engine/combat';

/**
 * Animaciones por fotogramas del RPG VFX Pack (System G6 / Qoma, CC0) sobre la carta golpeada.
 * Cada hoja tiene 8 columnas; `n` es el número de fotogramas.
 */
const SHEETS = {
  fuego: { src: IMG.vfx_fuego, n: 32 },
  frio: { src: IMG.vfx_frio, n: 32 },
  relampago: { src: IMG.vfx_relampago, n: 16 },
  trueno: { src: IMG.vfx_trueno, n: 32 },
  radiante: { src: IMG.vfx_radiante, n: 16 },
  necrotico: { src: IMG.vfx_necrotico, n: 16 },
  veneno: { src: IMG.vfx_veneno, n: 32 },
  acido: { src: IMG.vfx_acido, n: 16 },
  fuerza: { src: IMG.vfx_fuerza, n: 32 },
  psiquico: { src: IMG.vfx_psiquico, n: 64 },
  curacion: { src: IMG.vfx_curacion, n: 16 },
  critico: { src: IMG.vfx_critico, n: 32 },
};
export type VfxSheet = keyof typeof SHEETS;

const BY_TYPE: Partial<Record<DmgType, VfxSheet>> = {
  fuego: 'fuego', frío: 'frio', relámpago: 'relampago', trueno: 'trueno', radiante: 'radiante',
  necrótico: 'necrotico', veneno: 'veneno', ácido: 'acido', fuerza: 'fuerza', psíquico: 'psiquico',
};

/** Hoja que toca a un efecto: curación, daño mágico por tipo o crítico físico. Los golpes normales no llevan. */
export function sheetFor(kind: FxKind, type?: DmgType): VfxSheet | undefined {
  if (kind === 'heal') return 'curacion';
  if (type && BY_TYPE[type]) return BY_TYPE[type];
  return kind === 'crit' ? 'critico' : undefined;
}

const TICK = 33;

/** Reproduce la hoja una vez, centrada en la carta y algo más grande que ella; al acabar llama a onEnd. */
export function Destello({ sheet, w, h, delay = 0, onEnd }: { sheet: VfxSheet; w: number; h: number; delay?: number; onEnd: () => void }) {
  const { src, n } = SHEETS[sheet];
  // Unos 24 pasos como mucho, para que ninguna dure más de un segundo.
  const step = Math.max(1, Math.round(n / 24));
  const [f, setF] = useState(-1);
  useEffect(() => {
    let i = -step, id: ReturnType<typeof setInterval> | undefined;
    const t = setTimeout(() => {
      id = setInterval(() => {
        i += step;
        if (i >= n) { clearInterval(id); onEnd(); return; }
        setF(i);
      }, TICK);
    }, delay);
    return () => { clearTimeout(t); if (id) clearInterval(id); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (f < 0) return null;
  const s = w * 1.15, rows = n / 8;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: (w - s) / 2, top: (h - s) / 2, width: s, height: s, overflow: 'hidden' }}>
      <Image source={src} style={{ position: 'absolute', width: s * 8, height: s * rows, left: -(f % 8) * s, top: -Math.floor(f / 8) * s }} />
    </View>
  );
}
