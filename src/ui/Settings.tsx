import React, { useRef, useState } from 'react';
import { Linking, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { mdiChevronRight } from '@mdi/js';
import { C, F } from '../theme';
import { Btn } from './kit';
import { VOL_DEF, refresh, sfx } from '../sonido';
import * as storage from '../storage';
import { BUILD } from '../version';
import { COMO_FUNCIONA, CREDITOS, NOVEDADES } from '../data/ayuda';

const RELEASES = 'https://api.github.com/repos/churrufli/mazmorreo-rpg/releases?per_page=10';
const RELEASES_PAGE = 'https://github.com/churrufli/mazmorreo-rpg/releases';
/** Guía para colaborar en el proyecto (código, narrativa, arte, sonido), también con IA. */
export const COLABORAR = 'https://github.com/churrufli/mazmorreo-rpg/blob/master/CONTRIBUTING.md';
const CLAVE_DEV = '12345678';
const tagNum = (t: string) => Number(t.replace(/^v0\./, '')) || 0;

type Vista = 'main' | 'como' | 'novedades' | 'creditos';

/** Ajustes: sonido y música, ayuda (cómo funciona, novedades, créditos), versión, actualizaciones y modo desarrollador. */
export function Settings({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<Vista>('main');
  const [sound, setSound] = useState(storage.getFlag('sound'));
  const [music, setMusic] = useState(storage.getFlag('music'));
  const [dev, setDev] = useState(storage.getDev());
  const [vibra, setVibra] = useState(storage.getFlag('vibra'));
  // Mientras se arrastra una barra de volumen, el panel no se desplaza (si no, se queda con el dedo).
  const [scroll, setScroll] = useState(true);
  const [pidiendo, setPidiendo] = useState(false);
  const [msgClave, setMsgClave] = useState('');
  const [upd, setUpd] = useState<{ text: string; url?: string }>();
  const toggle = (k: string, set: (v: boolean) => void) => (v: boolean) => { storage.setFlag(k, v); set(v); refresh(); };

  const check = async () => {
    setUpd({ text: 'Buscando…' });
    try {
      const list: { tag_name: string; assets: { browser_download_url: string }[] }[] = await (await fetch(RELEASES)).json();
      const best = list.filter(r => r.assets.length).sort((a, b) => tagNum(b.tag_name) - tagNum(a.tag_name))[0];
      if (best && tagNum(best.tag_name) > BUILD) setUpd({ text: `Hay una versión nueva: ${best.tag_name}.`, url: best.assets[0].browser_download_url });
      else setUpd({ text: 'Tienes la última versión.' });
    } catch {
      setUpd({ text: 'No se ha podido comprobar. Revisa la conexión a internet.' });
    }
  };

  const activarDev = (texto: string) => {
    if (texto.trim() === CLAVE_DEV) { storage.setDev(true); setDev(true); setPidiendo(false); setMsgClave(''); }
    else setMsgClave('Clave incorrecta.');
  };

  const cerrar = view === 'main' ? onClose : () => setView('main');

  return (
    <Modal transparent animationType="fade" onRequestClose={cerrar}>
      <View style={st.bg}>
        {/* Tocar fuera del panel también cierra (el autor 2026-11-06). */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar" />
        <View style={st.panel}>
          {view === 'main' ? (
            <ScrollView showsVerticalScrollIndicator={false} scrollEnabled={scroll}>
              <Text style={st.title}>Ajustes</Text>
              <Row label="Sonido" value={sound} onChange={toggle('sound', setSound)} />
              <Row label="Música" value={music} onChange={toggle('music', setMusic)} />
              <Text style={st.volTitle}>Volumen</Text>
              <Barra label="Música" k="musica" onDrag={d => setScroll(!d)} />
              <Barra label="Ambiente" k="ambiente" onDrag={d => setScroll(!d)} />
              <Barra label="Efectos" k="efectos" onDrag={d => setScroll(!d)} />
              <Text style={st.note}>Sonido: efectos de combate, del mapa y de los botones. Música: la de la pantalla principal, el pueblo, cada aventura y los combates, y el ambiente de cada zona.</Text>
              <Row label="Vibración" value={vibra} onChange={toggle('vibra', setVibra)} />
              <Enlace label="Cómo funciona" onPress={() => setView('como')} />
              <Enlace label="Novedades" onPress={() => setView('novedades')} />
              <Enlace label="Créditos" onPress={() => setView('creditos')} />
              <Enlace label="Participa en el proyecto" onPress={() => Linking.openURL(COLABORAR)} />
              <Text style={st.version}>Versión {BUILD ? `v0.${BUILD}` : 'de desarrollo'}</Text>
              <Btn small label="Buscar actualizaciones" onPress={check} />
              <Btn small label="Descargar última actualización" onPress={() => Linking.openURL(RELEASES_PAGE)} />
              {upd ? <Text style={st.note}>{upd.text}</Text> : null}
              {upd?.url ? <Btn small label="Descargar la nueva versión" onPress={() => Linking.openURL(upd.url!)} /> : null}
              <View style={st.dev}>
                <Text style={st.devTitle}>Modo desarrollador</Text>
                <Text style={st.note}>Para probar el juego: mapa descubierto y botón para ganar combates.</Text>
                {dev ? (
                  <Btn small label="Desactivar modo desarrollador" onPress={() => { storage.setDev(false); setDev(false); }} />
                ) : pidiendo ? (
                  <>
                    <TextInput style={st.clave} keyboardType="number-pad" secureTextEntry placeholder="Clave" placeholderTextColor={C.textDim} onSubmitEditing={e => activarDev(e.nativeEvent.text)} onChangeText={t => { if (t === CLAVE_DEV) activarDev(t); }} accessibilityLabel="Clave del modo desarrollador" />
                    {msgClave ? <Text style={st.note}>{msgClave}</Text> : null}
                  </>
                ) : (
                  <Btn small label="Introducir clave" onPress={() => setPidiendo(true)} />
                )}
              </View>
              <Btn label="Cerrar" onPress={onClose} style={{ marginTop: 10 }} />
            </ScrollView>
          ) : null}

          {view === 'como' ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={st.title}>Cómo funciona</Text>
              {COMO_FUNCIONA.map(t => (
                <View key={t.title} style={st.tema}>
                  <View style={st.temaHead}>
                    <Svg width={26} height={26} viewBox="0 0 24 24"><Path d={t.icon} fill={C.goldHi} /></Svg>
                    <Text style={st.temaTitle}>{t.title}</Text>
                  </View>
                  {t.text.map((p, i) => <Text key={i} style={st.parrafo}>{p}</Text>)}
                </View>
              ))}
              <Btn label="Volver" onPress={() => setView('main')} />
            </ScrollView>
          ) : null}

          {view === 'novedades' ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={st.title}>Novedades</Text>
              {NOVEDADES.map(v => (
                <View key={v.version} style={st.tema}>
                  <Text style={st.temaTitle}>{v.version}</Text>
                  {v.items.map((p, i) => <Text key={i} style={st.parrafo}>• {p}</Text>)}
                </View>
              ))}
              <Btn label="Volver" onPress={() => setView('main')} />
            </ScrollView>
          ) : null}

          {view === 'creditos' ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={st.title}>Créditos</Text>
              {CREDITOS.map((p, i) => <Text key={i} style={st.parrafo}>{p}</Text>)}
              <Btn label="Volver" onPress={() => setView('main')} />
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function Row({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={st.row}>
      <Text style={st.label}>{label}</Text>
      <Switch value={value} onValueChange={onChange} accessibilityLabel={label} trackColor={{ false: C.border, true: C.gold }} thumbColor={value ? C.goldHi : C.textDim} />
    </View>
  );
}

/** Barra de volumen de 0 a 10: se toca o se arrastra. Los efectos suenan al soltar, para oír cómo quedan. */
function Barra({ label, k, onDrag }: { label: string; k: keyof typeof VOL_DEF; onDrag: (on: boolean) => void }) {
  const [v, setV] = useState(storage.getLevel(k, VOL_DEF[k]));
  const w = useRef(1);
  const cur = useRef(v);
  const x0 = useRef(0);
  const put = (x: number) => {
    const n = Math.max(0, Math.min(10, Math.round((x / w.current) * 10)));
    if (n === cur.current) return;
    cur.current = n;
    setV(n);
    storage.setLevel(k, n);
    refresh();
  };
  const pr = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: e => { onDrag(true); x0.current = e.nativeEvent.locationX; put(x0.current); },
    onPanResponderMove: (_e, gs) => put(x0.current + gs.dx),
    onPanResponderTerminate: () => onDrag(false),
    onPanResponderRelease: () => { onDrag(false); if (k === 'efectos') sfx('confirm'); },
  })).current;
  return (
    <View style={st.row}>
      <Text style={[st.label, { width: 96 }]}>{label}</Text>
      <View style={st.barBox} onLayout={e => { w.current = e.nativeEvent.layout.width || 1; }} {...pr.panHandlers}
        accessible accessibilityRole="adjustable" accessibilityLabel={`Volumen de ${label}`} accessibilityValue={{ min: 0, max: 10, now: v }}
        onAccessibilityAction={e => { const n = Math.max(0, Math.min(10, v + (e.nativeEvent.actionName === 'increment' ? 1 : -1))); cur.current = n; setV(n); storage.setLevel(k, n); refresh(); }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}>
        <View pointerEvents="none" style={st.barTrack}><View style={[st.barFill, { width: `${v * 10}%` }]} /></View>
        <View pointerEvents="none" style={[st.barThumb, { left: `${v * 10}%` }]} />
      </View>
      <Text style={st.barNum}>{v}</Text>
    </View>
  );
}

function Enlace({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={st.row}>
      <Text style={st.label}>{label}</Text>
      <Svg width={22} height={22} viewBox="0 0 24 24"><Path d={mdiChevronRight} fill={C.gold} /></Svg>
    </Pressable>
  );
}

const st = StyleSheet.create({
  bg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  panel: { backgroundColor: C.panel, borderColor: C.gold, borderWidth: 1, borderRadius: 8, padding: 16, maxHeight: '90%' },
  title: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 22, textAlign: 'center', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, minHeight: 48 },
  label: { fontFamily: F.textBold, color: C.text, fontSize: 18 },
  volTitle: { fontFamily: F.title, color: C.gold, fontSize: 16, textAlign: 'center', marginTop: 6 },
  barBox: { flex: 1, height: 40, justifyContent: 'center', marginHorizontal: 8 },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: C.border, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: C.gold },
  barThumb: { position: 'absolute', width: 22, height: 22, marginLeft: -11, borderRadius: 11, backgroundColor: C.goldHi, borderWidth: 2, borderColor: '#1a0f05' },
  barNum: { fontFamily: F.textBold, color: C.text, fontSize: 18, width: 26, textAlign: 'right' },
  note: { fontFamily: F.italic, color: C.textDim, fontSize: 15, marginVertical: 6, textAlign: 'center' },
  version: { fontFamily: F.title, color: C.gold, fontSize: 15, textAlign: 'center', marginTop: 10, marginBottom: 4 },
  tema: { marginBottom: 12 },
  temaHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  temaTitle: { fontFamily: F.title, color: C.gold, fontSize: 17, marginBottom: 4 },
  parrafo: { fontFamily: F.rules, color: C.text, fontSize: 14.5, lineHeight: 22, marginBottom: 6 },
  dev: { marginTop: 14, borderTopWidth: 1, borderColor: C.border, paddingTop: 10 },
  devTitle: { fontFamily: F.title, color: C.gold, fontSize: 16, textAlign: 'center' },
  clave: { fontFamily: F.text, color: C.text, borderColor: C.gold, borderWidth: 1, borderRadius: 4, padding: 8, marginTop: 6, textAlign: 'center', fontSize: 18 },
});
