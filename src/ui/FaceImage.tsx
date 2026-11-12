import React from 'react';
import { Image, View } from 'react-native';
import { Image as SvgImage } from 'react-native-svg';
import { IMG, ImgKey } from '../assets';
import { portraitFrame } from '../data/portraitFrames';

/** La misma cara y escala para diálogos, turnos, avisos y miniaturas de objetivos. */
export function FaceImage({ img, size }: { img: ImgKey; size: number }) {
  const frame = portraitFrame(img, size);
  return (
    <View style={{ width: size, height: size, overflow: 'hidden' }}>
      <Image source={IMG[img]} resizeMode="cover" style={{ position: 'absolute', left: frame.x, top: frame.y, width: frame.width, height: frame.height }} />
    </View>
  );
}

/** Versión SVG para fichas del mapa, centrada en el origen de su círculo. */
export function SvgFaceImage({ img, radius, clipPath, opacity = 1 }: { img: ImgKey; radius: number; clipPath: string; opacity?: number }) {
  const frame = portraitFrame(img, radius * 2);
  return <SvgImage href={IMG[img]} x={frame.x - radius} y={frame.y - radius} width={frame.width} height={frame.height} clipPath={clipPath} opacity={opacity} preserveAspectRatio="xMidYMid slice" />;
}
