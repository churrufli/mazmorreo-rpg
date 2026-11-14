import React, { useRef } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { mdiCircleSmall, mdiHeartPlus, mdiInformationOutline, mdiShieldOutline, mdiStarFourPoints, mdiSword } from '@mdi/js';
import type { LogLine } from '../engine/combat';
import { C, F } from '../theme';
import { Btn, Icon } from './kit';
import { groupLog } from './registro';

/** Icono y color de cada tipo de línea del registro de combate. */
const TONE: Record<NonNullable<LogLine['c']> | 'none', { icon: string; color: string }> = {
  dmg: { icon: mdiSword, color: '#e8796b' },
  heal: { icon: mdiHeartPlus, color: '#7fcf8f' },
  big: { icon: mdiStarFourPoints, color: C.goldHi },
  miss: { icon: mdiShieldOutline, color: C.textDim },
  info: { icon: mdiInformationOutline, color: '#9fb6c9' },
  none: { icon: mdiCircleSmall, color: C.text },
};

/** Registro de todo lo que ha pasado en la partida. Con `combat`, se ordena por rondas y turnos. */
export function LogModal({ lines, combat, onClose, title = 'Registro' }: { lines: string[]; combat?: LogLine[]; onClose: () => void; title?: string }) {
  const ref = useRef<ScrollView>(null);
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={st.logBg}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar" />
        <View style={st.logPanel}>
          <Text style={st.logTitle}>{title}</Text>
          <ScrollView ref={ref} onContentSizeChange={() => ref.current?.scrollToEnd({ animated: false })} style={{ flex: 1 }}>
            {combat?.length ? groupLog(combat).map(round => (
              <View key={round.r} style={st.round}>
                <Text style={st.roundTitle}>{`Ronda ${round.r}`}</Text>
                {round.turns.map((turn, i) => (
                  <View key={i} style={st.turn}>
                    {turn.who ? <Text style={st.turnWho}>{turn.who}</Text> : null}
                    {turn.lines.map((l, k) => {
                      const tone = TONE[l.c ?? 'none'];
                      return (
                        <View key={k} style={[st.entry, { borderLeftColor: tone.color }]}>
                          <Icon path={tone.icon} size={16} color={tone.color} />
                          <Text style={[st.entryTxt, l.c && l.c !== 'info' && { color: tone.color }, l.c === 'big' && st.entryBig]}>{l.t}</Text>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            )) : lines.length ? lines.map((l, i) => <Text key={i} style={[st.logLine, l.startsWith('—') && st.logZone]}>{l}</Text>) : <Text style={st.logLine}>Aún no ha pasado nada.</Text>}
          </ScrollView>
          <Btn label="Cerrar" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  logBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', padding: 16, paddingVertical: 50 },
  logPanel: { flex: 1, backgroundColor: C.panel, borderColor: C.gold, borderWidth: 1, borderRadius: 8, padding: 14 },
  logTitle: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 20, textAlign: 'center', marginBottom: 8 },
  logLine: { fontFamily: F.text, color: C.text, fontSize: 15, lineHeight: 20, marginBottom: 6 },
  logZone: { fontFamily: F.titleBold, color: C.gold, textAlign: 'center', marginTop: 6 },
  round: { marginBottom: 10 },
  roundTitle: { fontFamily: F.titleBold, color: C.gold, fontSize: 16, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 3, marginBottom: 6 },
  turn: { backgroundColor: '#0004', borderRadius: 6, padding: 6, marginBottom: 6 },
  turnWho: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 14, marginBottom: 4 },
  entry: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, borderLeftWidth: 3, paddingLeft: 6, paddingVertical: 2, marginBottom: 3 },
  entryTxt: { flex: 1, fontFamily: F.text, color: C.text, fontSize: 14, lineHeight: 19 },
  entryBig: { fontFamily: F.textBold },
});
