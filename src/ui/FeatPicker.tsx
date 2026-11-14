import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C, F } from '../theme';
import { useStore } from '../store';
import { CLASSES } from '../data/srd';
import { FEATS, FeatId, chooseFeat } from '../engine/rules';
import { Btn, Panel } from './kit';
import { FadeIn, Portrait } from './Overlays';

/** Al llegar al nivel 4, cada personaje elige entre +2 a su característica principal o una dote (SRD 5.2). */
export function FeatPicker() {
  const { game, edit } = useStore();
  const c = game?.party.find(x => x.featPending && !x.dead);
  if (!c) return null;
  const pickIt = (f: FeatId) => edit(g => { chooseFeat(g.party.find(x => x.id === c.id)!, f); }, true);
  return (
    <View style={st.bg}>
      <FadeIn style={{ width: '90%' }}>
        <Panel style={st.panel}>
          <View style={{ alignSelf: 'center' }}><Portrait img={c.img} size={76} /></View>
          <Text style={st.title}>{c.name} llega a nivel {c.level}</Text>
          <Text style={st.sub}>{CLASSES[c.cls].name}: elige una mejora</Text>
          {(Object.keys(FEATS) as FeatId[]).map(f => (
            <View key={f} style={st.opt}>
              <Text style={st.name}>{FEATS[f].name}</Text>
              <Text style={st.desc}>{FEATS[f].desc(c)}</Text>
              <Btn small primary={f === 'asi'} label={`Elegir ${FEATS[f].name.toLowerCase()}`} onPress={() => pickIt(f)} />
            </View>
          ))}
        </Panel>
      </FadeIn>
    </View>
  );
}

const st = StyleSheet.create({
  bg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center' },
  panel: { borderColor: C.gold, borderWidth: 1.5 },
  title: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 21, textAlign: 'center', marginTop: 6 },
  sub: { fontFamily: F.italic, color: C.textDim, fontSize: 16, textAlign: 'center', marginBottom: 8 },
  opt: { borderTopWidth: 1, borderColor: '#ffffff18', paddingTop: 8, marginTop: 4 },
  name: { fontFamily: F.titleBold, color: C.gold, fontSize: 16 },
  desc: { fontFamily: F.rules, color: C.text, fontSize: 14.5, lineHeight: 21 },
});
