import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { mdiChevronDown, mdiChevronRight } from '@mdi/js';
import { C, F } from '../theme';
import { IMG } from '../assets';
import { COMO_FUNCIONA } from '../data/ayuda';
import { FadeIn } from './Overlays';

/** «**palabra**» en dorado y negrita; el resto, texto normal. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return <Text style={st.txt}>{parts.map((p, i) => (i % 2 ? <Text key={i} style={st.strong}>{p}</Text> : p))}</Text>;
}

/** Proporción de las capturas (ancho / alto). */
const RATIO: Record<string, number> = { ayuda_combate: 780 / 1688, ayuda_mapa: 780 / 1040 };

/** Número dorado: el mismo que lleva la captura para señalar esa parte de la pantalla. */
const Num = ({ n }: { n: string }) => <View style={st.num}><Text style={st.numTxt}>{n}</Text></View>;

/**
 * «Cómo funciona» (Ajustes): temas plegables con un resumen, una captura numerada en los que la tienen
 * y puntos cortos con lo importante resaltado (el autor 2026-11-25).
 */
export function ComoFunciona() {
  const [open, setOpen] = useState<string | undefined>(COMO_FUNCIONA[0].title);
  return (
    <>
      <Text style={st.intro}>Toca un tema para abrirlo.</Text>
      {COMO_FUNCIONA.map(t => {
        const on = open === t.title;
        return (
          <View key={t.title} style={[st.card, on && st.cardOn]}>
            <Pressable onPress={() => setOpen(on ? undefined : t.title)} style={st.head} accessibilityRole="button" accessibilityState={{ expanded: on }} accessibilityLabel={`${t.title}: ${t.sub}`}>
              <View style={st.iconBox}><Svg width={22} height={22} viewBox="0 0 24 24"><Path d={t.icon} fill={C.goldHi} /></Svg></View>
              <View style={{ flex: 1 }}>
                <Text style={st.title}>{t.title}</Text>
                <Text style={st.sub}>{t.sub}</Text>
              </View>
              <Svg width={22} height={22} viewBox="0 0 24 24"><Path d={on ? mdiChevronDown : mdiChevronRight} fill={C.gold} /></Svg>
            </Pressable>
            {on ? (
              <FadeIn from={6} style={st.body}>
                {t.img ? <Image source={IMG[t.img]} style={[st.img, { aspectRatio: RATIO[t.img] ?? 0.75 }]} resizeMode="contain" accessibilityLabel={`Captura de ${t.title.toLowerCase()} con sus partes numeradas`} /> : null}
                {t.text.map((p, i) => {
                  const m = /^\((\d)\)\s*(.*)$/.exec(p);
                  return (
                    <View key={i} style={st.point}>
                      {m ? <Num n={m[1]} /> : <View style={st.dot} />}
                      <View style={{ flex: 1 }}><Rich text={m ? m[2] : p} /></View>
                    </View>
                  );
                })}
              </FadeIn>
            ) : null}
          </View>
        );
      })}
    </>
  );
}

const st = StyleSheet.create({
  intro: { fontFamily: F.italic, color: C.textDim, fontSize: 15, textAlign: 'center', marginBottom: 8 },
  card: { borderWidth: 1, borderColor: C.border, borderRadius: 8, marginBottom: 8, backgroundColor: 'rgba(0,0,0,0.25)' },
  cardOn: { borderColor: C.gold },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, minHeight: 56 },
  iconBox: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: C.gold, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(224,181,110,0.08)' },
  title: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 16 },
  sub: { fontFamily: F.italic, color: C.textDim, fontSize: 14 },
  body: { paddingHorizontal: 12, paddingBottom: 10 },
  img: { width: '100%', maxWidth: 320, alignSelf: 'center', borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.gold, marginTop: 8, marginLeft: 5, marginRight: 5 },
  num: { width: 18, height: 18, borderRadius: 9, backgroundColor: C.goldHi, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  numTxt: { fontFamily: F.rulesBold, color: '#1a0f05', fontSize: 11 },
  txt: { fontFamily: F.rules, color: C.text, fontSize: 14.5, lineHeight: 21 },
  strong: { fontFamily: F.rulesBold, color: C.goldHi },
});
