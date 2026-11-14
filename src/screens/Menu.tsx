import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { mdiAlertOutline, mdiDiceMultipleOutline, mdiPencilOutline, mdiTrashCanOutline } from '@mdi/js';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IMG } from '../assets';
import { C, F } from '../theme';
import { Bg, Btn, Crop, Icon, Panel, T } from '../ui/kit';
import { Sex, heroImg, randomName } from '../data/caras';
import { useStore } from '../store';
import * as storage from '../storage';
import { ABIL_NAME, Ability, CLASSES, ClassId, HERO_CLASSES, SPECIES, SpeciesId } from '../data/srd';
import { assignRolls, rollAbilities } from '../engine/rules';
import { zoneById } from '../engine/dungeon';
import { ADVS, TOWNS } from '../engine/aventuras';
import { Dialogue, FadeIn, MiniDie } from '../ui/Overlays';
import { COLABORAR, Settings } from '../ui/Settings';
import { BUILD } from '../version';
import { CAMBIOS } from '../versionWeb';

/** Motas de luz que suben despacio, como polvo o ascuas. */
function Particles({ n = 24, h }: { n?: number; h?: number }) {
  const win = useWindowDimensions();
  const width = win.width, height = h ?? win.height;
  // Cada mota empieza ya a mitad de su recorrido: desde el primer momento hay motas por toda la pantalla.
  const motes = useMemo(() => Array.from({ length: n }, () => {
    const start = Math.random();
    return { x: Math.random() * width, size: 2 + Math.random() * 3, dur: 7000 + Math.random() * 7000, start, drift: (Math.random() - 0.5) * 60, v: new Animated.Value(start) };
  }), [n, width]);
  useEffect(() => {
    const runs = motes.map(m => Animated.sequence([
      Animated.timing(m.v, { toValue: 1, duration: m.dur * (1 - m.start), easing: Easing.linear, useNativeDriver: true }),
      Animated.loop(Animated.sequence([
        Animated.timing(m.v, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.timing(m.v, { toValue: 1, duration: m.dur, easing: Easing.linear, useNativeDriver: true }),
      ])),
    ]));
    runs.forEach(r => r.start());
    return () => runs.forEach(r => r.stop());
  }, [motes]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {motes.map((m, i) => (
        <Animated.View key={i} style={{
          position: 'absolute', left: m.x, top: 0, width: m.size, height: m.size, borderRadius: m.size, backgroundColor: C.goldHi,
          shadowColor: C.goldHi, shadowOpacity: 1, shadowRadius: 4,
          opacity: m.v.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 0.9, 0.6, 0] }),
          transform: [
            { translateY: m.v.interpolate({ inputRange: [0, 1], outputRange: [height * 1.02, height * 0.15] }) },
            { translateX: m.v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, m.drift, m.drift * 0.3] }) },
          ],
        }} />
      ))}
    </View>
  );
}

export function Title() {
  const pick = useStore(s => s.pickSlot);
  const ins = useSafeAreaInsets();
  const any = storage.SLOTS.some(n => storage.load(n));
  const [opts, setOpts] = useState(false);
  // Tamaño en píxeles: con ancho en porcentaje, Android dibujaba el logo ampliado y cortado.
  const lw = Math.min(useWindowDimensions().width * 0.9, 520);
  const logo = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(logo, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start(); }, [logo]);
  const scale = logo.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });
  return (
    <Bg src={IMG.titulo} dim={0.15}>
      <Particles />
      <View style={[st.titleWrap, { paddingTop: ins.top + 40 }]}>
        <Animated.View style={{ alignSelf: 'stretch', alignItems: 'center', opacity: logo, transform: [{ scale }] }}>
          <Image source={IMG.logo} style={{ width: lw, height: (lw * 340) / 1200 }} resizeMode="contain" accessibilityLabel="Mazmorreo" />
          <Text style={{ fontFamily: F.title, color: C.goldHi, fontSize: 14, letterSpacing: 1, marginTop: 4, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 12, overflow: 'hidden' }}>RPG con las reglas SRD 5.2</Text>
        </Animated.View>
      </View>
      <FadeIn delay={1600} style={{ ...st.bottom, paddingBottom: ins.bottom + 30 }}>
        {/* Con partidas guardadas, lo primero es seguir jugando. */}
        {any ? <Btn primary label="Cargar partida" onPress={() => pick('load')} /> : null}
        <Btn primary={!any} label="Nueva partida" onPress={() => pick('new')} />
        {any ? null : <Btn label="Cargar partida" onPress={() => pick('load')} disabled />}
        <Btn label="Ajustes" onPress={() => setOpts(true)} />
        {/* Mazmorreo es abierto: lleva a la guía para colaborar en GitHub. */}
        <Btn small label="Participa en el proyecto" onPress={() => Linking.openURL(COLABORAR)} />
        <Text style={st.version}>{BUILD ? `v0.${BUILD}${CAMBIOS ? `+${CAMBIOS}` : ''} · ` : ''}Versión de prueba · Tres aventuras</Text>
      </FadeIn>
      {opts ? <Settings onClose={() => setOpts(false)} /> : null}
    </Bg>
  );
}

/** «3 h 12 min» o «25 min». */
const jugado = (ms: number) => { const m = Math.floor(ms / 60000), h = Math.floor(m / 60); return h ? `${h} h ${m % 60} min` : `${m} min`; };

export function Slots() {
  const { slotMode, chooseNewSlot, loadSlot, go } = useStore();
  const [confirm, setConfirm] = useState<number>();
  const [del, setDel] = useState<number>();
  const [ren, setRen] = useState<number>();
  const [, refresh] = useState(0);
  const ins = useSafeAreaInsets();
  return (
    <Bg src={IMG.titulo} dim={0.6}>
      <Particles n={18} />
      <View style={{ flex: 1, padding: 16, paddingTop: ins.top + 20, justifyContent: 'center' }}>
        <T h={2} style={{ textAlign: 'center' }}>{slotMode === 'new' ? 'Selecciona archivo de guardado' : 'Cargar partida'}</T>
        {storage.SLOTS.map(n => {
          const g = storage.load(n);
          const hero = g?.party.find(c => c.isHero);
          return (
            <Pressable key={n} accessibilityRole="button" onPress={() => {
              if (slotMode === 'load') { if (g) loadSlot(n); return; }
              // Un archivo ocupado no se puede usar para empezar: hay que borrarlo antes con la papelera.
              if (g) { setConfirm(n); return; }
              chooseNewSlot(n);
            }}>
              <Panel style={[st.slot, confirm === n && { borderColor: C.damage }]}>
                {hero ? <View style={st.slotImg}><Crop img={hero.img} w={54} h={82} zoom={2.2} fy={0.25} /></View> : <View style={st.slotImg} />}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[st.slotTitle, { flexShrink: 1 }]} numberOfLines={1}>{storage.slotName(n)}</Text>
                    <Pressable onPress={() => setRen(n)} accessibilityRole="button" accessibilityLabel={`Cambiar el nombre de ${storage.slotName(n)}`} hitSlop={12} style={{ marginLeft: 8 }}>
                      <Icon path={mdiPencilOutline} size={18} color={C.textDim} />
                    </Pressable>
                  </View>
                  {g && hero ? (
                    <>
                      <Text style={st.slotLine}>{hero.name} · {CLASSES[hero.cls].name} nivel {hero.level}</Text>
                      <Text style={st.slotLine}>{g.place === 'town' ? TOWNS[g.town ?? 'valdescarcha'].name : zoneById(g.zone).name}</Text>
                      <Text style={st.slotDate}>{new Date(g.savedAt).toLocaleString('es-ES')}{g.playMs ? ` · Jugado: ${jugado(g.playMs)}` : ''}</Text>
                    </>
                  ) : <Text style={st.slotLine}>Vacío</Text>}
                  {confirm === n ? <Text style={[st.slotLine, { color: C.damage }]}>Archivo ocupado. Para empezar aquí, bórralo antes con la papelera.</Text> : null}
                </View>
                {g ? (
                  <Pressable onPress={() => setDel(n)} accessibilityRole="button" accessibilityLabel={`Borrar la partida de ${storage.slotName(n)}`} hitSlop={12} style={st.trash}>
                    <Icon path={mdiTrashCanOutline} size={22} color={C.textDim} />
                  </Pressable>
                ) : null}
              </Panel>
            </Pressable>
          );
        })}
        <Btn label="Volver" onPress={() => { setConfirm(undefined); refresh(x => x + 1); go('title'); }} />
      </View>
      {ren ? <RenameSlot slot={ren} onClose={() => { setRen(undefined); refresh(x => x + 1); }} /> : null}
      {del ? <DeleteSlot slot={del} onClose={deleted => { setDel(undefined); if (deleted) { storage.remove(del); setConfirm(undefined); refresh(x => x + 1); } }} /> : null}
    </Bg>
  );
}

/** Cambiar el nombre de un archivo de guardado. */
function RenameSlot({ slot, onClose }: { slot: number; onClose: () => void }) {
  const [txt, setTxt] = useState(storage.slotName(slot));
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={st.delBg}>
        <Panel>
          <Text style={[st.slotTitle, { textAlign: 'center', fontSize: 18, marginBottom: 6 }]}>Nombre del archivo</Text>
          <TextInput value={txt} onChangeText={setTxt} autoFocus selectTextOnFocus maxLength={24} placeholder={`Archivo ${slot}`} placeholderTextColor="#5a4a36" style={[st.delInput, { letterSpacing: 0, fontSize: 20 }]} accessibilityLabel="Nombre del archivo de guardado" />
          <View style={{ flexDirection: 'row' }}>
            <Btn small label="Cancelar" onPress={onClose} style={{ flex: 1 }} />
            <Btn small primary label="Guardar" onPress={() => { storage.setSlotName(slot, txt); onClose(); }} style={{ flex: 1 }} />
          </View>
        </Panel>
      </View>
    </Modal>
  );
}

/** Confirmación de borrado: hay que escribir OK. */
function DeleteSlot({ slot, onClose }: { slot: number; onClose: (deleted: boolean) => void }) {
  const [txt, setTxt] = useState('');
  const ok = txt.trim().toUpperCase() === 'OK';
  return (
    <Modal transparent animationType="fade" onRequestClose={() => onClose(false)}>
      <View style={st.delBg}>
        <Panel style={{ borderColor: C.damage }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
            <Icon path={mdiAlertOutline} size={24} color={C.damage} />
            <Text style={[st.slotTitle, { marginLeft: 8, fontSize: 18 }]}>Borrar {storage.slotName(slot)}</Text>
          </View>
          <Text style={[st.slotLine, { textAlign: 'center' }]}>La partida se perderá para siempre. Escribe OK para confirmarlo.</Text>
          <TextInput value={txt} onChangeText={setTxt} autoCapitalize="characters" autoCorrect={false} maxLength={4} placeholder="OK" placeholderTextColor="#5a4a36" style={st.delInput} accessibilityLabel="Escribe OK para borrar" />
          <View style={{ flexDirection: 'row' }}>
            <Btn small label="Cancelar" onPress={() => onClose(false)} style={{ flex: 1 }} />
            <Btn small danger label="Borrar" disabled={!ok} onPress={() => onClose(true)} style={{ flex: 1 }} />
          </View>
        </Panel>
      </View>
    </Modal>
  );
}

const CLS: ClassId[] = HERO_CLASSES;
const SPS: SpeciesId[] = ['human', 'elf', 'dwarf', 'halfling'];

const STEPS = ['Sexo', 'Especie', 'Clase', 'Atributos', 'Nombre'];
const NEXT = ['Elegir especie', 'Elegir clase', 'Elegir atributos', 'Poner nombre', 'Empezar la aventura'];
// Lo que se sugiere a quien no conoce D&D: humano (versátil) y guerrero (aguanta solo la primera zona).
const REC_SP: SpeciesId = 'human';
const REC_CLS: ClassId = 'fighter';
const ABILS: Ability[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const fmtMod = (v: number) => { const m = Math.floor((v - 10) / 2); return m >= 0 ? `+${m}` : `${m}`; };

export function Create() {
  const { create, go } = useStore();
  const [step, setStep] = useState(0);
  const [cls, setCls] = useState<ClassId>(REC_CLS);
  const [sp, setSp] = useState<SpeciesId>(REC_SP);
  const [name, setName] = useState(() => randomName(REC_SP));
  const [custom, setCustom] = useState(false);
  const [editing, setEditing] = useState(false);
  const [abil, setAbil] = useState<Record<Ability, number>>(CLASSES[REC_CLS].abil);
  const [dice, setDice] = useState<Record<Ability, number[]>>();
  const [rolls, setRolls] = useState(0); // 0 = recomendados; 1 = tirada; 2 = ya repetida
  const [sel, setSel] = useState<Ability>();
  const ins = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [sex, setSex] = useState<Sex>('man');
  // Primero hombre o mujer, con el guerrero o la guerrera (el autor 2026-11-05).
  const img = step === 0 ? heroImg('fighter', 'human', sex) : heroImg(cls, sp, sex);
  const ok = name.trim().length > 0;
  const artH = Math.round(height * 0.4);
  // Si el nombre es de los sorteados, cambia con la especie.
  const pickHero = (c: ClassId, s: SpeciesId) => {
    setCls(c); setSp(s);
    if (!custom && s !== sp) setName(randomName(s));
    if (c !== cls) { setAbil(CLASSES[c].abil); setDice(undefined); setRolls(0); setSel(undefined); }
  };
  const roll = () => {
    const r = assignRolls(cls, rollAbilities());
    setAbil(r.abil); setDice(r.dice); setRolls(rolls + 1); setSel(undefined);
  };
  const tapAbil = (k: Ability) => {
    if (!sel || sel === k) return setSel(sel === k ? undefined : k);
    setAbil({ ...abil, [k]: abil[sel], [sel]: abil[k] });
    if (dice) setDice({ ...dice, [k]: dice[sel], [sel]: dice[k] });
    setSel(undefined);
  };
  const forward = () => (step < 4 ? setStep(step + 1) : create(name.trim(), cls, sp, abil, img));
  return (
    <Bg src={IMG.titulo} dim={0.82}>
      {/* Detrás del contenido: solo se ven sobre el fondo, no sobre botones ni textos. */}
      <Particles n={18} />
      <ScrollView contentContainerStyle={{ paddingTop: ins.top + 8, paddingBottom: ins.bottom + 20 }} keyboardShouldPersistTaps="handled">
        <Text style={st.createTitle}>Crea a tu héroe</Text>
        <View style={st.steps}>
          {STEPS.map((t, i) => (
            <Pressable key={t} onPress={() => i < step && setStep(i)} disabled={i >= step} accessibilityRole="button" accessibilityLabel={`Paso ${i + 1}: ${t}`} style={st.stepItem}>
              {i > 0 ? <View style={[st.stepLine, i <= step && { backgroundColor: C.gold }]} /> : null}
              <View style={[st.rombo, i < step && st.romboDone, i === step && st.romboNow]} />
              <Text style={[st.stepTxt, i === step && { color: C.goldHi }]}>{t}</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ height: artH, overflow: 'hidden' }}>
          <FadeIn key={img} from={0}><Crop img={img} w={width} h={artH} zoom={Math.max(1.75, (width * 1.5) / artH)} fy={0.2} /></FadeIn>
          <Svg width={width} height={artH} style={StyleSheet.absoluteFill} pointerEvents="none">
            <Defs>
              <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#0d0b09" stopOpacity="0" />
                <Stop offset="0.62" stopColor="#0d0b09" stopOpacity="0" />
                <Stop offset="1" stopColor="#0d0b09" stopOpacity="1" />
              </LinearGradient>
              <LinearGradient id="sides" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#0d0b09" stopOpacity="0.9" />
                <Stop offset="0.14" stopColor="#0d0b09" stopOpacity="0" />
                <Stop offset="0.86" stopColor="#0d0b09" stopOpacity="0" />
                <Stop offset="1" stopColor="#0d0b09" stopOpacity="0.9" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width={width} height={artH} fill="url(#sides)" />
            <Rect x="0" y="0" width={width} height={artH} fill="url(#fade)" />
          </Svg>
          {/* Motas también sobre el héroe. */}
          <Particles n={10} h={artH} />
          {step === 4 ? (
            <View style={st.nameBox}>
              {editing ? (
                <TextInput value={name} onChangeText={t => { setName(t); setCustom(true); }} autoFocus onBlur={() => setEditing(false)} onSubmitEditing={() => setEditing(false)}
                  maxLength={16} style={st.nameInput} placeholder="Escribe un nombre" placeholderTextColor={C.textDim} />
              ) : (
                <Pressable onPress={() => setEditing(true)} accessibilityRole="button" accessibilityLabel={`Nombre: ${name}. Toca para escribir otro`} style={st.nameRow}>
                  <Text style={st.nameBig} numberOfLines={1} adjustsFontSizeToFit>{name || 'Sin nombre'}</Text>
                  <Icon path={mdiPencilOutline} size={18} color={C.textDim} />
                </Pressable>
              )}
              <Pressable onPress={() => { setName(randomName(sp, name)); setCustom(false); setEditing(false); }} accessibilityRole="button" accessibilityLabel="Otro nombre" style={st.dice} hitSlop={8}>
                <Icon path={mdiDiceMultipleOutline} size={30} color={C.goldHi} />
              </Pressable>
            </View>
          ) : null}
          <Text style={st.heroSub}>{step === 0 ? (sex === 'man' ? 'Hombre' : 'Mujer') : `${step > 1 ? `${CLASSES[cls].name} · ` : ''}${SPECIES[sp].name}`}</Text>
        </View>
        <View style={{ paddingHorizontal: 16 }}>
          {step === 0 ? (
            <View style={st.chips}>{(['man', 'woman'] as const).map(x => <Chip key={x} label={x === 'man' ? 'Hombre' : 'Mujer'} on={sex === x} onPress={() => setSex(x)} />)}</View>
          ) : null}
          {step === 1 ? (
            <>
              <View style={st.chips}>{SPS.map(x => <Chip key={x} label={SPECIES[x].name} rec={x === REC_SP} on={sp === x} onPress={() => pickHero(cls, x)} />)}</View>
              <Panel style={{ marginTop: 10 }}>
                <Text style={st.blurbT}>{SPECIES[sp].name}</Text>
                <Text style={st.blurb}>{SPECIES[sp].blurb}</Text>
              </Panel>
            </>
          ) : null}
          {step === 2 ? (
            <>
              <View style={st.chips}>{CLS.map(c => <Chip key={c} label={CLASSES[c].name} rec={c === REC_CLS} on={cls === c} onPress={() => pickHero(c, sp)} />)}</View>
              <Panel style={{ marginTop: 10 }}>
                <Text style={st.blurbT}>{CLASSES[cls].name}</Text>
                <Text style={st.blurb}>{CLASSES[cls].blurb}</Text>
                <Text style={st.blurbSmall}>Los aliados serán de otras clases.</Text>
              </Panel>
            </>
          ) : null}
          {step === 3 ? (
            <Panel>
              {rolls === 0 ? <Text style={st.recTag}>Recomendado para {CLASSES[cls].name.toLowerCase()}</Text> : null}
              {ABILS.map((k, row) => (
                <Pressable key={k} onPress={() => tapAbil(k)} accessibilityRole="button" accessibilityLabel={`${ABIL_NAME[k]} ${abil[k]}. Toca dos atributos para intercambiarlos`} style={[st.abRow, sel === k && st.abSel]}>
                  <Text style={st.abName}>{ABIL_NAME[k]}</Text>
                  <View style={st.abDice}>
                    {dice ? dice[k].map((d, i) => (
                      <View key={`${rolls}${i}`} style={{ opacity: i === 3 ? 0.35 : 1, marginLeft: 2 }}>
                        <MiniDie value={d} faces={6} size={24} delay={row * 120} />
                      </View>
                    )) : null}
                  </View>
                  <Text style={st.abVal}>{abil[k]}</Text>
                  <Text style={st.abMod}>{fmtMod(abil[k])}</Text>
                </Pressable>
              ))}
              <Text style={st.blurbSmall}>{sel ? `Toca otro atributo para cambiarlo por ${ABIL_NAME[sel]}.` : 'Toca dos atributos para intercambiar sus valores.'}{dice ? ' Se tiran 4 dados y se quita el menor.' : ''}</Text>
              <View style={{ flexDirection: 'row' }}>
                <Btn small label={rolls === 0 ? 'Tirar dados' : rolls === 1 ? 'Repetir (1 vez)' : 'Ya repetida'} disabled={rolls >= 2} onPress={roll} style={{ flex: 1 }} />
                <Btn small label="Recomendados" disabled={rolls === 0} onPress={() => { setAbil(CLASSES[cls].abil); setDice(undefined); setSel(undefined); setRolls(rolls ? 2 : 0); }} style={{ flex: 1 }} />
              </View>
            </Panel>
          ) : null}
          {step === 4 ? <Text style={st.blurbSmall}>Toca el nombre para escribir uno propio, o el dado para otro al azar.</Text> : null}
          <Btn primary label={NEXT[step]} disabled={step === 4 && !ok} onPress={forward} style={{ marginTop: 12 }} />
          <Btn label={step ? 'Atrás' : 'Volver'} onPress={() => (step ? setStep(step - 1) : go('slots'))} />
        </View>
      </ScrollView>
    </Bg>
  );
}

function Chip({ label, on, rec, onPress }: { label: string; on: boolean; rec?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={rec ? `${label}, recomendado` : label} style={[st.chip, on && st.chipOn]}>
      <Text style={[st.chipText, on && { color: C.bg }]}>{label}</Text>
      {rec ? <Text style={[st.chipRec, on && { color: C.bg }]}>Recomendado</Text> : null}
    </Pressable>
  );
}

export function Intro() {
  const { game, intro, closeIntro } = useStore();
  const hero = game!.party.find(c => c.isHero) ?? game!.party[0];
  const A = ADVS[intro?.adv ?? 'hondaroca'];
  const lines = useMemo(() => [
    { speaker: 'narrator', text: A.data.dungeon.summary },
    { speaker: 'narrator', text: A.data.zones[0].description },
  ], [A]);
  return (
    <Bg src={IMG[A.intro]} dim={0.1}>
      <View style={{ flex: 1 }} />
      <Dialogue lines={lines} hero={{ name: hero.name, img: hero.img }} onDone={closeIntro} />
    </Bg>
  );
}

const st = StyleSheet.create({
  titleWrap: { alignItems: 'center' },
  bottom: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 40 },
  version: { fontFamily: F.italic, color: C.textDim, textAlign: 'center', marginTop: 10, fontSize: 14 },
  trash: { padding: 6, alignSelf: 'flex-start' },
  delBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  delInput: { fontFamily: F.titleBold, fontWeight: 'bold', color: C.goldHi, fontSize: 26, letterSpacing: 10, textAlign: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 6, marginVertical: 12, paddingVertical: 8, backgroundColor: '#0008' },
  slot: { flexDirection: 'row', marginVertical: 6, alignItems: 'center' },
  slotImg: { width: 56, height: 84, borderRadius: 4, marginRight: 12, backgroundColor: '#0008', borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  createTitle: { textAlign: 'center', marginBottom: 8, fontFamily: F.titleBold, color: C.goldHi, fontSize: 20, letterSpacing: 2, textShadowColor: '#000', textShadowRadius: 8 },
  nameBox: { position: 'absolute', left: 16, right: 16, bottom: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, borderBottomWidth: 1, borderColor: C.gold, paddingHorizontal: 6 },
  nameBig: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 32, letterSpacing: 1, marginRight: 6, textShadowColor: '#000', textShadowRadius: 10, flexShrink: 1 },
  nameInput: { flex: 1, fontFamily: F.titleBold, color: C.goldHi, fontSize: 26, borderBottomWidth: 1, borderColor: C.goldHi, paddingVertical: 2, textAlign: 'center' },
  dice: { marginLeft: 12, borderWidth: 1, borderColor: C.gold, borderRadius: 24, padding: 6, backgroundColor: '#000a' },
  heroSub: { position: 'absolute', left: 0, right: 0, bottom: 6, textAlign: 'center', fontFamily: F.italic, color: C.text, fontSize: 17 },
  slotTitle: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 16 },
  slotLine: { fontFamily: F.text, color: C.text, fontSize: 16 },
  slotDate: { fontFamily: F.italic, color: C.textDim, fontSize: 14 },
  hint: { fontFamily: F.italic, color: C.textDim, textAlign: 'center', marginVertical: 6 },
  label: { fontFamily: F.title, color: C.gold, fontSize: 13, marginTop: 8, marginBottom: 4, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  chip: { borderWidth: 1, borderColor: C.gold, backgroundColor: 'rgba(13,11,9,0.9)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, margin: 4, minHeight: 44, minWidth: '42%', alignItems: 'center', justifyContent: 'center' },
  chipRec: { fontFamily: F.title, color: C.goldHi, fontSize: 10, letterSpacing: 1 },
  steps: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8, paddingHorizontal: 12 },
  stepItem: { flex: 1, alignItems: 'center' },
  stepLine: { position: 'absolute', top: 7, right: '50%', width: '100%', height: 1, backgroundColor: C.border },
  rombo: { width: 14, height: 14, transform: [{ rotate: '45deg' }], borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  romboDone: { backgroundColor: C.gold, borderColor: C.gold },
  romboNow: { borderColor: C.goldHi, backgroundColor: C.goldHi, width: 16, height: 16 },
  stepTxt: { fontFamily: F.title, color: C.textDim, fontSize: 11, marginTop: 6 },
  recTag: { fontFamily: F.title, color: C.goldHi, fontSize: 12, textAlign: 'center', marginBottom: 4, letterSpacing: 1 },
  abRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 6, borderRadius: 6, borderWidth: 1, borderColor: 'transparent', minHeight: 40 },
  abSel: { borderColor: C.goldHi, backgroundColor: '#e0b56e22' },
  abName: { fontFamily: F.textBold, color: C.text, fontSize: 17, flex: 1 },
  abDice: { flexDirection: 'row', marginRight: 8 },
  abVal: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 20, width: 34, textAlign: 'right' },
  abMod: { fontFamily: F.text, color: C.textDim, fontSize: 16, width: 34, textAlign: 'right' },
  chipOn: { backgroundColor: C.gold },
  chipText: { fontFamily: F.textBold, color: C.goldHi, fontSize: 15 },
  blurbT: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 15 },
  blurb: { fontFamily: F.text, color: C.text, fontSize: 16, lineHeight: 21 },
  blurbSmall: { fontFamily: F.italic, color: C.textDim, fontSize: 14, marginTop: 8 },
});
