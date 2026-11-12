import React, { useRef } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { C, F } from '../theme';
import { Btn } from './kit';

/** Registro de todo lo que ha pasado en la partida. */
export function LogModal({ lines, onClose, title = 'Registro' }: { lines: string[]; onClose: () => void; title?: string }) {
  const ref = useRef<ScrollView>(null);
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={st.logBg}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar" />
        <View style={st.logPanel}>
          <Text style={st.logTitle}>{title}</Text>
          <ScrollView ref={ref} onContentSizeChange={() => ref.current?.scrollToEnd({ animated: false })} style={{ flex: 1 }}>
            {lines.length ? lines.map((l, i) => <Text key={i} style={[st.logLine, l.startsWith('—') && st.logZone]}>{l}</Text>) : <Text style={st.logLine}>Aún no ha pasado nada.</Text>}
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
});
