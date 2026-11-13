import React, { useState } from 'react';
import { Image, ImageSourcePropType, Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { C, F } from '../theme';
import { IMG, ImgKey } from '../assets';
import { FACE } from '../data/caras';
import { buttonLabelLayout } from './buttonLabel';
import { sfx } from '../sonido';

/** Fondo a pantalla completa: se amplía sin deformarse hasta llegar a todos los bordes (el autor 2026-11-02). */
export function Bg({ src, dim = 0.35, children, style }: { src: ImageSourcePropType; dim?: number; children?: React.ReactNode; style?: ViewStyle }) {
  // Tamaño explícito: en Android, una Image solo con absoluteFill puede salir a su tamaño natural.
  const { width, height } = useWindowDimensions();
  const box = { position: 'absolute' as const, left: 0, top: 0, width, height };
  return (
    <View style={[s.fill, style]}>
      <Image source={src} style={box} resizeMode="cover" />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(0,0,0,${dim})` }]} />
      {children}
    </View>
  );
}

/**
 * Recorte de una ilustración de personaje centrado en su cara.
 * zoom = alto de la imagen respecto al alto de la caja; fy = altura de la cara dentro de la caja (0-1).
 */
/** topShare: parte del sobrante que como mucho se recorta por arriba (el resto, por abajo). */
export function Crop({ img, w, h, zoom, fy, topShare = 1 }: { img: ImgKey; w: number; h: number; zoom: number; fy: number; topShare?: number }) {
  const face = FACE[img] ?? [0.5, 0.15]; // sin medir: la cabeza suele estar arriba; se recorta por los pies
  const ih = h * zoom;
  const iw = ih * (2 / 3);
  const left = Math.min(0, Math.max(w - iw, w / 2 - face[0] * iw));
  const top = Math.min(0, Math.max(h - ih, -(ih - h) * topShare, h * fy - face[1] * ih));
  return (
    <View style={{ width: w, height: h, overflow: 'hidden' }}>
      <Image source={IMG[img]} style={{ position: 'absolute', left, top, width: iw, height: ih }} />
    </View>
  );
}

// Octógono: rectángulo con las esquinas cortadas en diagonal.
const oct = (x: number, y: number, w: number, h: number, c: number) =>
  `M${x + c} ${y}H${x + w - c}L${x + w} ${y + c}V${y + h - c}L${x + w - c} ${y + h}H${x + c}L${x} ${y + h - c}V${y + c}Z`;

/**
 * Botón con esquinas cortadas (sin rombos: el autor los quitó el 2026-11-01).
 * primary = relleno pergamino con texto oscuro; el resto, fondo oscuro con borde ocre.
 */
/** Largo de la línea más larga al partir el texto en dos por la palabra que más lo equilibra. */
function split2(t: string): [string, string] {
  const w = t.split(' ');
  let best: [string, string] = [t, ''];
  for (let i = 1; i < w.length; i++) {
    const a = w.slice(0, i).join(' '), b = w.slice(i).join(' ');
    if (Math.max(a.length, b.length) < Math.max(best[0].length, best[1].length)) best = [a, b];
  }
  return best;
}

/** Nueve recortes del PNG original. Las esquinas mantienen escala uniforme;
 * solo se estiran los tramos rectos y el cuero central. Igual en Metro y Vite. */
function ButtonSkin({ tone, width, height, selected, dim }: { tone: 'parent' | 'child'; width: number; height: number; selected?: boolean; dim?: boolean }) {
  const scale = 0.14;
  const ys = [0, 100, 176, 276];
  const dy = [0, 100 * scale, height - 100 * scale, height];
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>{[0, 1, 2].flatMap(y => {
    // La franja central conserva el marco vertical y toma cuero limpio del
    // centro: se omiten las filigranas laterales para dejar respirar al texto.
    const segments = y === 1 ? [[0, 50], [240, 960], [1150, 1200]] : [[0, 200], [200, 1000], [1000, 1200]];
    const edge = (y === 1 ? 50 : 200) * scale;
    const dx = [0, edge, width - edge, width];
    return [0, 1, 2].map(x => {
      const w = dx[x + 1] - dx[x], h = dy[y + 1] - dy[y];
      const [left, right] = segments[x];
      const sx = w / (right - left), sy = h / (ys[y + 1] - ys[y]);
      return <View key={`${x}:${y}`} style={{ position: 'absolute', left: dx[x], top: dy[y], width: w, height: h, overflow: 'hidden' }}>
        <Image source={tone === 'parent' ? IMG.boton_padre : IMG.boton_hijo} resizeMode="stretch" style={{ position: 'absolute', width: 1200 * sx, height: 276 * sy, left: -left * sx, top: -ys[y] * sy }} />
      </View>;
    });
  })}
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Path d={oct(0, 0, width, height, 9)} fill={dim ? '#101010' : '#100c08'} fillOpacity={dim ? 0.78 : 0.42} />
      {selected && !dim ? <>
        <Path d={oct(3, 3, width - 6, height - 6, 8)} fill="none" stroke="#ffca5a" strokeWidth={7} strokeOpacity={0.12} />
        <Path d={oct(3, 3, width - 6, height - 6, 8)} fill="none" stroke="#ffca5a" strokeWidth={3.5} strokeOpacity={0.3} />
      </> : null}
      <Path d={oct(2, 2, width - 4, height - 4, 8)} fill="none" stroke={dim ? '#6f6a60' : selected ? '#ffe6a0' : '#b99960'} strokeWidth={selected ? 1.4 : 0.7} />
      <Path d={oct(6, 6, width - 12, height - 12, 5)} fill="none" stroke={dim ? '#4c4943' : '#c4a168'} strokeOpacity={selected ? 0.9 : 0.45} strokeWidth={0.6} />
    </Svg>
  </View>;
}

/** off = se ve apagado pero se puede tocar (para explicar por qué no sirve ahora). */
export function Btn({ label, onPress, onLongPress, disabled, off, small, sub, style, danger, primary, combatTone, onInfo, icon, tight }: {
  /** Botón de combate estrecho (tres en una fila): sin icono y con la zona de información más estrecha. */
  tight?: boolean;
  label: string; onPress?: () => void; onLongPress?: () => void; disabled?: boolean; off?: boolean; small?: boolean; sub?: string; style?: ViewStyle; danger?: boolean; primary?: boolean; combatTone?: 'parent' | 'child'; onInfo?: () => void; icon?: string;
}) {
  const { width: screenWidth, fontScale } = useWindowDimensions();
  const combatFont = screenWidth < 350 ? 12 : 13;
  const caption = label.toLocaleUpperCase('es-ES');
  const dim = disabled || off;
  const [box, setBox] = useState<{ width: number; height: number }>();
  const showIcon = !!icon && !!combatTone && !tight;
  // Margen simétrico para el icono (izquierda) y la zona de información (derecha): deja sitio a «HABILIDADES» o «ESCONDERSE» en una línea.
  const combatPadding = onInfo || showIcon ? 34 : 10;
  const textInset = combatTone ? (tight ? 36 : combatPadding * 2) : small ? 24 : 44;
  let labelLayout = box && combatTone ? buttonLabelLayout(caption, box.width - textInset, combatFont * fontScale) : undefined;
  // Tres en una fila: antes de partir la palabra se prueba con letra algo menor.
  if (box && tight && labelLayout && labelLayout.lines.length > 1) {
    const small1 = buttonLabelLayout(caption, box.width - textInset, 10.5 * fontScale);
    if (small1.lines.length === 1) labelLayout = small1;
  }
  const c = small ? 9 : 12;
  const edge = dim ? '#756b60' : danger ? C.damage : primary ? PARCH2 : C.gold;
  const ink = combatTone ? (dim ? '#a29c90' : '#f4dcaa') : primary ? '#1a130b' : C.goldHi;
  // Texto largo: en dos líneas con letra algo menor, sin que el botón crezca.
  const fs = combatTone ? combatFont : small ? 13 : 17;
  const two = !!box && caption.length * fs * 0.66 > box.width - textInset;
  const room = box ? box.width - textInset : 1;
  const halves = split2(caption);
  const fs2 = combatTone ? combatFont : Math.max(9, Math.min(small ? 11.5 : 14, room / (Math.max(halves[0].length, halves[1].length) * 0.64)));
  return (
    <Pressable
      onPress={onPress && (e => { if (combatTone && ((e.nativeEvent as unknown as { detail?: number }).detail ?? 0) > 1) return; sfx(off ? 'error' : 'click_soft', 0.5); onPress(); })}
      onLongPress={onLongPress}
      delayLongPress={350}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, selected: !!primary }}
      aria-pressed={combatTone ? !!primary : undefined}
      onLayout={e => setBox(e.nativeEvent.layout)}
      style={({ pressed }) => [s.btn, small && s.btnSmall, combatTone && { marginVertical: 2, marginHorizontal: 1, paddingHorizontal: combatPadding, minHeight: 44, paddingVertical: 3 }, combatTone && tight && { paddingHorizontal: 18 }, two && { paddingVertical: small ? 4 : 8 }, pressed && s.btnPressed, dim && !combatTone && s.btnOff, style]}>
      {({ pressed }) => (
        <>
          {box && combatTone ? <ButtonSkin tone={combatTone} width={box.width} height={box.height} selected={primary || pressed} dim={!!dim} /> : box ? (
            <Svg width={box.width} height={box.height} style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="parch" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={pressed ? '#fff3d6' : PARCH} />
                  <Stop offset="1" stopColor={pressed ? '#e8d6a8' : PARCH2} />
                </LinearGradient>
              </Defs>
              <Path d={oct(0, 0, box.width, box.height, c)} fill={edge} />
              <Path d={oct(1.5, 1.5, box.width - 3, box.height - 3, c - 0.6)} fill={primary && !dim ? 'url(#parch)' : pressed ? C.panelHi : 'rgba(26,22,18,0.94)'} />
              {/* Esquina doblada en dorado: este botón tiene más detalles manteniéndolo pulsado. */}
              {(onInfo || onLongPress) && !dim ? <Path d={`M${box.width - c - 7} 1.5H${box.width - c}L${box.width - 1.5} ${c + 7}V${c + 14}Z`} fill={edge} /> : null}
            </Svg>
          ) : null}
          {showIcon ? <View pointerEvents="none" style={{ position: 'absolute', left: 10, top: 0, bottom: 0, justifyContent: 'center' }}><Icon path={icon!} size={18} color={ink} /></View> : null}
          {combatTone ? <Text testID="combat-button-label" style={[s.btnText, { color: ink, fontSize: labelLayout ? labelLayout.fontSize / fontScale : combatFont, lineHeight: (labelLayout ? labelLayout.fontSize / fontScale : combatFont) * 1.18, letterSpacing: 0, textAlign: 'center', width: '100%' }]} numberOfLines={2} ellipsizeMode="clip">{labelLayout?.lines.join('\n') ?? caption}</Text> : two
            ? <Text style={[s.btnText, { color: ink, fontSize: fs2, lineHeight: fs2 * 1.18, letterSpacing: 0, textAlign: 'center' }]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={combatTone ? 1 : 0.75}>{halves[1] ? `${halves[0]}\n${halves[1]}` : caption}</Text>
            : <Text style={[s.btnText, small && s.btnTextSmall, { color: ink, ...(combatTone ? { fontSize: combatFont, letterSpacing: 0 } : {}) }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={combatTone ? 1 : 0.7}>{caption}</Text>}
          {onInfo ? <Pressable accessibilityRole="button" accessibilityLabel={`Información sobre ${label}`} onPress={e => { e.stopPropagation(); onInfo(); }} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: tight ? 28 : 36, minHeight: 44 }} /> : null}
          {sub ? <Text style={[s.btnSub, primary && { color: '#4a3b26' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{sub}</Text> : null}
        </>
      )}
    </Pressable>
  );
}
const PARCH = '#efe2c2';
const PARCH2 = '#d9c497';

export function Panel({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.panel, style]}>{children}</View>;
}

export const T = ({ children, style, h }: { children: React.ReactNode; style?: TextStyle | TextStyle[]; h?: 1 | 2 | 3 }) => (
  <Text style={[h === 1 ? s.h1 : h === 2 ? s.h2 : h === 3 ? s.h3 : s.p, style]}>{children}</Text>
);

/** Icono MDI. Con `outline`, lleva borde oscuro y sombra (crecen con el icono) para verse sobre fondos de color. */
export function Icon({ path, size = 20, color = C.gold, outline }: { path: string; size?: number; color?: string; outline?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox={outline ? '-2 -2 28 28' : '0 0 24 24'}>
      {outline ? <Path d={path} fill="#000" fillOpacity={0.55} stroke="#000" strokeOpacity={0.55} strokeWidth={2.4} strokeLinejoin="round" transform="translate(0.7 1.1)" /> : null}
      {outline ? <Path d={path} fill={color} stroke="#1a0f05" strokeWidth={2.2} strokeLinejoin="round" /> : null}
      <Path d={path} fill={color} />
    </Svg>
  );
}

export function Bar({ value, max, color = C.heal, height = 5 }: { value: number; max: number; color?: string; height?: number }) {
  const pct = Math.max(0, Math.min(1, value / Math.max(1, max)));
  return (
    <View style={{ height, backgroundColor: '#000a', borderRadius: height, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height, backgroundColor: pct < 0.3 ? C.damage : color }} />
    </View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: C.bg },
  btn: { paddingVertical: 12, paddingHorizontal: 22, alignItems: 'center', marginVertical: 7, minHeight: 50, justifyContent: 'center' },
  btnSmall: { paddingVertical: 6, paddingHorizontal: 12, minHeight: 44, marginVertical: 5, marginHorizontal: 3 },
  btnPressed: { transform: [{ translateY: 1 }, { scale: 0.985 }] },
  btnOff: { opacity: 0.55 },
  btnText: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 17, letterSpacing: 1 },
  btnTextSmall: { fontSize: 13, letterSpacing: 0.5 },
  btnSub: { fontFamily: F.text, color: C.textDim, fontSize: 13, marginTop: 1 },
  panel: { backgroundColor: 'rgba(20,17,13,0.94)', borderColor: C.border, borderWidth: 1, borderRadius: 8, padding: 14 },
  h1: { fontFamily: F.titleBold, color: C.gold, fontSize: 38, textAlign: 'center', letterSpacing: 2 },
  h2: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 22, marginBottom: 6 },
  h3: { fontFamily: F.title, color: C.gold, fontSize: 16, marginBottom: 4 },
  p: { fontFamily: F.text, color: C.text, fontSize: 18, lineHeight: 24 },
});
