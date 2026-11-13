import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { IMG, ImgKey } from '../assets';
import { C, F } from '../theme';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Bar, Btn, Crop, Icon } from './kit';
import { mdiBagPersonalOutline, mdiCardAccountDetailsOutline, mdiCheck, mdiStarShooting } from '@mdi/js';
import { Portrait } from './Overlays';
import { FACE } from '../data/caras';
import type { FxKind } from '../engine/combat';
import { ABIL_NAME, ABIL_SHORT, Ability, CLASSES, ITEMS, MONSTERS, SPECIES } from '../data/srd';
import { usableOutside } from '../engine/dungeon';
import { Char, LEVEL_FEATURES, MAX_ITEMS, equipState, keeps, abilMod, armorClass, passivePerception, saveBonus, score } from '../engine/rules';
import { XP_LEVELS } from '../data/srd';
import { StateOrb, StateTag, STATES } from './estados';
import { slotsAt } from '../engine/rules';

export interface CardInfo {
  name: string;
  img: ImgKey;
  hp: number;
  maxHp: number;
  ac: number;
  temp?: number;
  /** Muerto de verdad (tres salvaciones fallidas o derrotado): la carta lo dice en vez de "CAÍDO". */
  dead?: boolean;
  /** Espacios de conjuro que quedan y los máximos (nivel 1 y nivel 2). */
  slots?: { have: number[]; max: number[] };
  /** Estados con su esfera (abajo de la carta). */
  states?: StateTag[];
}

// Grietas de la carta rota (coordenadas en una carta de 100x150).
const CRACKS = [
  'M50 70 L38 52 L42 38 L30 18 L34 4', 'M50 70 L66 58 L72 40 L88 30 L97 12', 'M50 70 L58 88 L52 104 L64 124 L60 146',
  'M50 70 L34 80 L22 76 L10 92 L2 90', 'M50 70 L72 82 L86 104 L98 108', 'M50 70 L44 94 L30 110 L26 134', 'M42 38 L56 30', 'M58 88 L74 96',
];

const FX_IMG: Record<FxKind, ImgKey> = { hit: 'golpe_fisico', magic: 'hechizo_arcano', crit: 'impacto_critico', heal: 'curacion' };

// Efectos ya vistos por carta: al cambiar de fila la carta se vuelve a montar y no debe repetir el golpe anterior.
const PLAYED = new Map<string, number>();
export const resetFx = () => PLAYED.clear();

/**
 * Carta: ilustración bajo el marco, nombre en la franja de arriba y PG/CA en la de abajo.
 * Los personajes se ven de la cabeza a la cintura; con full, la ilustración entera.
 */
export function Card({ info, width, active, target, help, dim, onPress, onLongPress, tag, fx, fxKey, fxDelay = 0, full, onBroken, pop, intent, minTouchSize = 0, selecting, interactionHint }: {
  info: CardInfo; width: number; active?: boolean; target?: boolean; dim?: boolean; tag?: string; fxDelay?: number; fxKey?: string;
  /** Objetivo de una ayuda (curar, bendecir…): borde verde en vez de rojo. */
  help?: boolean;
  onPress?: () => void; onLongPress?: () => void; fx?: { id: number; kind: FxKind }; full?: boolean;
  /** Cifra del daño o la curación que acaba de recibir: aparece un momento y se va. */
  pop?: { id: number; n: number; kind: 'dmg' | 'heal' | 'crit' };
  /** Lo que prepara un enemigo: icono de la acción y retratos de a quién apunta. */
  intent?: { icon: string; faces: ImgKey[] };
  minTouchSize?: number; selecting?: boolean; interactionHint?: string;
  /** Si se pasa, la carta se agrieta, se rompe y avisa al terminar (enemigo derrotado). */
  onBroken?: () => void;
}) {
  const w = width;
  const h = w * 1.5;
  const fs = Math.max(9, Math.min(17, w * 0.11));
  const down = info.hp <= 0;
  // Hueco de la ilustración, medido sobre el marco v3 (512x768, sin placas): entra un poco bajo el borde.
  const ax = w * 0.03, ay = h * 0.013, aw = w * 0.94, ah = h * 0.974;
  // Franja de PG y CA dentro de la ilustración, abajo, sobre un degradado (como el nombre arriba): así los números
  // nunca tocan el borde de la carta. La placa del marco queda como adorno.
  const plateH = fs * 1.7, plateTop = h * 0.975 - plateH;
  const orb = Math.max(12, Math.min(30, w * 0.2));
  const person = !!FACE[info.img] && !['corazon_hueco', 'dragon_blanco_joven'].includes(info.img);
  // Tamaño del nombre calculado (adjustsFontSizeToFit hacía temblar los nombres de cartas vecinas).
  const nameFs = Math.min(fs, (w * 0.84) / (info.name.length * 0.5), h * 0.075);
  const anim = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const turnGlow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) { turnGlow.stopAnimation(); turnGlow.setValue(0); return; }
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(turnGlow, { toValue: 1, duration: 850, useNativeDriver: false }),
      Animated.timing(turnGlow, { toValue: 0, duration: 850, useNativeDriver: false }),
    ]));
    pulse.start();
    return () => pulse.stop();
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!fx) return;
    if (fxKey) { if (PLAYED.get(fxKey) === fx.id) return; PLAYED.set(fxKey, fx.id); }
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 700, delay: fxDelay, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    if (fx.kind !== 'heal') {
      shake.setValue(0);
      Animated.sequence([Animated.delay(fxDelay), ...[6, -6, 4, -3, 0].map(v => Animated.timing(shake, { toValue: v, duration: 50, useNativeDriver: true }))]).start();
    }
  }, [fx?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const popV = useRef(new Animated.Value(0)).current;
  // Sin cifra al montar: al cambiar de fila la carta se vuelve a montar y no debe repetir la del turno anterior.
  const [popShown, setPopShown] = useState<typeof pop>();
  useEffect(() => {
    if (!pop) return;
    if (fxKey) { if (PLAYED.get(`${fxKey}:pop`) === pop.id) return; PLAYED.set(`${fxKey}:pop`, pop.id); }
    setPopShown(pop);
    popV.setValue(0);
    Animated.sequence([
      Animated.delay(fxDelay),
      Animated.spring(popV, { toValue: 1, friction: 5, tension: 160, useNativeDriver: true }),
      ...(pop.kind === 'crit' ? [Animated.timing(popV, { toValue: 1.15, duration: 140, useNativeDriver: true }), Animated.timing(popV, { toValue: 1, duration: 160, useNativeDriver: true })] : []),
      Animated.delay(900),
      Animated.timing(popV, { toValue: 2, duration: 300, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => setPopShown(undefined), fxDelay + 1900);
    return () => clearTimeout(t);
  }, [pop?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const crack = useRef(new Animated.Value(0)).current;
  const breaking = !!onBroken;
  useEffect(() => {
    if (!onBroken) return;
    Animated.sequence([
      Animated.delay(500),
      Animated.timing(crack, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(450),
      Animated.timing(crack, { toValue: 2, duration: 450, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start(() => onBroken());
  }, [breaking]); // eslint-disable-line react-hooks/exhaustive-deps
  const fxScale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.25] });
  const fxOpacity = anim.interpolate({ inputRange: [0, 0.15, 0.6, 1], outputRange: [0, 1, 0.9, 0] });
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} delayLongPress={350} style={minTouchSize ? { width: Math.max(w, minTouchSize), height: Math.max(h, minTouchSize), alignItems: 'center', justifyContent: 'center' } : undefined} accessibilityHint={selecting ? target || help ? 'Objetivo válido: toca para seleccionarlo.' : 'No es un objetivo válido para esta acción.' : interactionHint ?? 'Toca para ver la ficha.'} accessibilityLabel={`${info.name}, ${info.hp} de ${info.maxHp} puntos de golpe, CA ${info.ac}${selecting && (target || help) ? ', objetivo válido' : ''}`}>
      <Animated.View style={[st.card, { width: w, height: h, transform: [{ translateX: shake }, { scale: active ? 1.06 : 1 }] }, (dim || down) && !breaking && { opacity: 0.45 },
        breaking && { opacity: crack.interpolate({ inputRange: [0, 1, 2], outputRange: [1, 1, 0] }), transform: [{ scale: crack.interpolate({ inputRange: [0, 1, 2], outputRange: [1, 1, 0.8] }) }, { rotate: crack.interpolate({ inputRange: [0, 1, 2], outputRange: ['0deg', '0deg', '8deg'] }) }] }]}>
        {active ? <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { borderRadius: 8, borderWidth: 3, borderColor: C.goldHi, opacity: turnGlow.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }), zIndex: 3 }]} /> : null}
        <View style={{ position: 'absolute', left: ax, top: ay }}>
          {person
            ? <Crop img={info.img} w={aw} h={ah} zoom={full ? (aw * 1.5) / ah : 1.85} fy={full ? 0.1 : 0.26} topShare={0.25} />
            : <Crop img={info.img} w={aw} h={ah} zoom={(aw * 1.5) / ah} fy={0.15} topShare={0.25} />}
        </View>
        <Image source={IMG.marco_carta_v3} style={{ position: 'absolute', left: 0, top: 0, width: w, height: h }} resizeMode="stretch" />
        {/* Nombre sobre una franja translúcida encima de la ilustración. */}
        <Svg pointerEvents="none" style={{ position: 'absolute', left: ax, top: ay }} width={aw} height={nameFs * 2.4}>
          <Defs><LinearGradient id="nameG" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#0a0806" stopOpacity={0.85} /><Stop offset="0.6" stopColor="#0a0806" stopOpacity={0.6} /><Stop offset="1" stopColor="#0a0806" stopOpacity={0} /></LinearGradient></Defs>
          <Rect width={aw} height={nameFs * 2.4} fill="url(#nameG)" />
        </Svg>
        <View style={[st.nameBand, { top: ay + h * 0.004, height: nameFs * 1.5, left: ax, width: aw }]}>
          <Text style={[st.name, { fontSize: nameFs, lineHeight: nameFs * 1.5 }]} numberOfLines={1}>{info.name}</Text>
        </View>
        <Svg pointerEvents="none" style={{ position: 'absolute', left: ax, top: plateTop - plateH * 0.6 }} width={aw} height={plateH * 1.6}>
          <Defs><LinearGradient id="plate" x1="0" y1="1" x2="0" y2="0"><Stop offset="0" stopColor="#0a0806" stopOpacity={0.85} /><Stop offset="0.62" stopColor="#0a0806" stopOpacity={0.6} /><Stop offset="1" stopColor="#0a0806" stopOpacity={0} /></LinearGradient></Defs>
          <Rect width={aw} height={plateH * 1.6} fill="url(#plate)" />
        </Svg>
        {/* Estados abajo de la ilustración, sin tapar la cara: una esfera con su icono por estado. */}
        {info.states?.length ? (
          <View pointerEvents="none" style={[st.orbs, { left: ax, width: aw, top: plateTop - orb - h * 0.012 }]}>
            {info.states.slice(0, 4).map(t => <StateOrb key={t.key + t.label} k={t.key} size={orb} />)}
          </View>
        ) : null}
        {/* Barra de vida justo encima de la placa. */}
        <View style={{ position: 'absolute', left: ax + 1, width: aw - 2, top: plateTop - (w < 100 ? 4 : 6) }}>
          <Bar value={info.hp} max={info.maxHp} height={w < 100 ? 3 : 5} />
        </View>
        <View style={[st.band, st.stats, { top: plateTop, height: plateH, left: ax + w * 0.03, right: w - ax - aw + w * 0.03 }]}>
          <View style={st.stat}>
            <Image source={IMG.icono_puntos_golpe} style={{ width: fs * 1.15, height: fs * 1.15 }} />
            <Text style={[st.statTxt, { fontSize: fs, lineHeight: fs * 1.5, height: fs * 1.5 }]} numberOfLines={1}>{Math.max(0, info.hp)}{w >= 90 ? `/${info.maxHp}` : ''}{info.temp ? <Text style={{ color: C.goldHi }}>+{info.temp}</Text> : null}</Text>
          </View>
          {info.slots ? <Slots s={info.slots} size={Math.min(plateH * 0.9, fs * 1.4)} /> : null}
          <View style={st.stat}>
            <Image source={IMG.icono_defensa} style={{ width: fs * 1.15, height: fs * 1.15 }} />
            <Text style={[st.statTxt, { fontSize: fs, lineHeight: fs * 1.5, height: fs * 1.5 }]}>{info.ac}</Text>
          </View>
        </View>
        {fx ? (
          <Animated.View pointerEvents="none" style={{ position: 'absolute', left: w * 0.1, top: h * 0.2, opacity: fxOpacity, transform: [{ scale: fxScale }] }}>
            <Image source={IMG[FX_IMG[fx.kind]]} style={{ width: w * 0.8, height: w * 0.8 }} />
          </Animated.View>
        ) : null}
        {breaking ? (
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: crack.interpolate({ inputRange: [0, 1, 2], outputRange: [0, 1, 1] }) }]}>
            <Svg width={w} height={h} viewBox="0 0 100 150">
              {CRACKS.map((d, i) => <Path key={i} d={d} stroke="#000" strokeWidth={2.2} fill="none" />)}
              {CRACKS.map((d, i) => <Path key={`l${i}`} d={d} stroke="#e8dcc8" strokeWidth={0.7} fill="none" opacity={0.8} />)}
            </Svg>
          </Animated.View>
        ) : null}
        {popShown ? (() => {
          const big = popShown.kind === 'crit' ? 1.3 : 1;
          const pfs = Math.max(14, w * 0.2) * big;
          const col = popShown.kind === 'heal' ? { bg: '#1f5e2b', bd: '#7fcf8f' } : popShown.kind === 'crit' ? { bg: '#7a1414', bd: C.goldHi } : { bg: '#7a1414', bd: '#e0705f' };
          return (
            <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: h * 0.16, alignItems: 'center',
              opacity: popV.interpolate({ inputRange: [0, 0.2, 1, 1.15, 2], outputRange: [0, 1, 1, 1, 0] }),
              transform: [{ scale: popV.interpolate({ inputRange: [0, 1, 1.15, 2], outputRange: [0.3, 1, 1.15, 1.05] }) }, { translateY: popV.interpolate({ inputRange: [0, 1, 1.15, 2], outputRange: [10, 0, 0, -h * 0.08] }) }] }}>
              <View style={[st.pop, { backgroundColor: col.bg, borderColor: col.bd, borderWidth: popShown.kind === 'crit' ? 3 : 2, paddingHorizontal: pfs * 0.45, borderRadius: pfs }]}>
                <Text style={[st.popTxt, { fontSize: pfs, lineHeight: pfs * 1.25 }]}>{popShown.kind === 'heal' ? '+' : '−'}{popShown.n}</Text>
              </View>
            </Animated.View>
          );
        })() : null}
        {tag ? <Text style={[st.tag, { top: h * 0.12, width: w - 12 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{tag}</Text> : null}
        {down ? <Text style={[st.downTxt, { fontSize: Math.max(14, w * 0.14) }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{info.dead ? 'MUERTO' : 'CAÍDO'}</Text> : null}
        {intent ? (
          // Intención del enemigo abajo de la ilustración, encima de los estados (si los hay) y de la barra de vida.
          <View pointerEvents="none" style={[st.intent, { top: plateTop - h * 0.012 - (info.states?.length ? orb + h * 0.008 : 0) - w * 0.24, height: w * 0.24 }]}>
            <View style={[st.intentIcon, { width: w * 0.24, height: w * 0.24, borderRadius: w * 0.12 }]}><Icon path={intent.icon} size={w * 0.17} color={C.text} outline /></View>
            {intent.faces.slice(0, 3).map((f, i) => <View key={i} style={{ marginLeft: -w * 0.03 }}><Portrait img={f} size={w * 0.24} /></View>)}
          </View>
        ) : null}
        {/* El borde va encima: si fuese de la propia carta, el marco (w x h) quedaría recortado a la derecha y abajo. */}
        <View pointerEvents="none" style={[st.edge, active && st.active, target && st.target, help && st.help]} />
      </Animated.View>
    </Pressable>
  );
}

/** Carta en grande: tocar la ilustración la gira a la ficha; tocar la ficha (fuera de los objetos) vuelve. */
export function CardModal({ char, monster, info, onClose, party, onGive, onDrop, onUse, town = 'Valdescarcha', intent }: {
  char?: Char; monster?: string; info: CardInfo; onClose: () => void; intent?: { icon: string; faces: ImgKey[] }; party?: Char[]; onGive?: (uid: string, to: string) => void;
  /** Dejar el objeto en el suelo de la casilla del mapa. */
  onDrop?: (uid: string) => void;
  /** Usar fuera de combate un objeto que cura con un compañero. */
  onUse?: (uid: string, to: string) => void;
  town?: string;
}) {
  const rot = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const [back, setBack] = useState(false);
  const { width, height } = useWindowDimensions();
  useEffect(() => {
    Animated.timing(rot, { toValue: back ? 1 : 0, duration: 380, useNativeDriver: true }).start();
  }, [back, rot]);
  useEffect(() => { Animated.spring(pop, { toValue: 1, friction: 7, useNativeDriver: true }).start(); }, [pop]);
  const front = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const rear = rot.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const swipe = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_event, gs) =>
      gs.numberActiveTouches === 1 && Math.abs(gs.dx) > 12 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5,
    onPanResponderRelease: (_event, gs) => {
      if (Math.abs(gs.dx) >= 40 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5) setBack(value => !value);
    },
  }), []);
  const sts = info.states ?? [];
  const W = Math.min(width - 24, (height - 150 - sts.length * 46) / 1.5);
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={st.modalBg}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar" />
        <Animated.View nativeID="character-card-flip" {...swipe.panHandlers} style={{ width: W, height: W * 1.5, transform: [{ scale }] }}>
          <Animated.View style={[st.face, { transform: [{ perspective: 1000 }, { rotateY: front }] }]} pointerEvents={back ? 'none' : 'auto'}>
            <Card info={info} width={W} full intent={intent} onPress={() => setBack(true)} />
          </Animated.View>
          <Animated.View style={[st.face, st.backFace, { transform: [{ perspective: 1000 }, { rotateY: rear }] }]} pointerEvents={back ? 'auto' : 'none'}>
            {char ? <Sheet c={char} party={party} onGive={onGive} onDrop={onDrop} onUse={onUse} onFlip={() => setBack(false)} /> : <MonsterSheet id={monster!} info={info} onFlip={() => setBack(false)} />}
          </Animated.View>
        </Animated.View>
        {/* Estados explicados: su esfera, el nombre y qué hace. */}
        {sts.length ? (
          <View style={{ width: Math.max(W, Math.min(width - 24, 360)), marginTop: 8 }}>
            {sts.map(t => (
              <View key={t.key + t.label} style={st.stateRow}>
                <StateOrb k={t.key} size={36} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={st.stateName}>{t.label}</Text>
                  <Text style={st.stateDesc}>{STATES[t.key].desc}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
        {info.dead ? <Text style={[st.deadNote, { width: W }]}>{`${info.name} ha muerto. Solo el templo de ${town} puede devolverle la vida. Para volver al pueblo, usa el último punto de descanso del mapa.`}</Text> : null}
        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          <Btn small label={back ? 'Ver carta' : 'Ver ficha'} onPress={() => setBack(!back)} />
          <Btn small label="Cerrar" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const ABILS: Ability[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const ABIL_ICON: Record<Ability, ImgKey> = {
  str: 'icono_fuerza', dex: 'icono_destreza', con: 'icono_constitucion', int: 'icono_inteligencia', wis: 'icono_sabiduria', cha: 'icono_carisma',
};
const sign = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

// Resumen de conjuros realmente implementados en el motor de combate.
// No añade conjuros nuevos ni cambia sus tiradas o costes.
const SPELL_CARDS: Partial<Record<Char['cls'], { name: string; level: number; cost: string; desc: string }[]>> = {
  cleric: [
    { name: 'Llama sagrada', level: 0, cost: 'Acción', desc: 'Truco. Salvación de Destreza del enemigo; 1d8 de daño radiante.' },
    { name: 'Curar heridas', level: 1, cost: 'Acción', desc: 'Gasta un espacio de conjuro; cura 2d8 + Sabiduría a un aliado.' },
    { name: 'Palabra de curación', level: 1, cost: 'Acción adicional', desc: 'Gasta un espacio; cura 2d4 + Sabiduría a un aliado.' },
    { name: 'Saeta guía', level: 1, cost: 'Acción', desc: 'Ataque de conjuro, 4d6 radiante; el siguiente ataque tiene ventaja.' },
    { name: 'Bendecir', level: 1, cost: 'Acción', desc: 'Hasta tres aliados suman 1d4 a ataques y salvaciones durante el combate.' },
    { name: 'Arma espiritual', level: 2, cost: 'Acción adicional', desc: 'Arma mágica que inflige 1d8 + Sabiduría y puede volver a usarse.' },
    { name: 'Curación en masa', level: 3, cost: 'Acción adicional', desc: 'Cura 2d4 + Sabiduría a todo el grupo.' },
  ],
  wizard: [
    { name: 'Descarga de fuego', level: 0, cost: 'Acción', desc: 'Truco. Ataque de conjuro, 1d10 de fuego.' },
    { name: 'Rayo de escarcha', level: 0, cost: 'Acción', desc: 'Truco. Ataque de conjuro, 1d8 de frío.' },
    { name: 'Proyectil mágico', level: 1, cost: 'Acción', desc: 'Tres dardos que impactan automáticamente: 1d4+1 cada uno.' },
    { name: 'Manos ardientes', level: 1, cost: 'Acción', desc: 'Salvación de Destreza de la fila delantera enemiga; 3d6 de fuego, mitad con éxito.' },
    { name: 'Dormir', level: 1, cost: 'Acción', desc: 'Salvación de Sabiduría de una fila enemiga; duerme hasta recibir daño.' },
    { name: 'Rayo abrasador', level: 2, cost: 'Acción', desc: 'Tres rayos de 2d6 de fuego con tiradas de ataque independientes.' },
    { name: 'Bola de fuego', level: 3, cost: 'Acción', desc: 'Explosión sobre una fila enemiga, 8d6 de fuego.' },
  ],
  ranger: [
    { name: 'Marca del cazador', level: 1, cost: 'Acción adicional', desc: 'Marca a un enemigo; +1d6 al impactar. Puede cambiarse de objetivo.' },
    { name: 'Curar heridas', level: 1, cost: 'Acción', desc: 'Gasta un espacio; cura 2d8 + Sabiduría a un aliado.' },
  ],
  paladin: [
    { name: 'Bendecir', level: 1, cost: 'Acción', desc: 'Hasta tres aliados suman 1d4 a ataques y salvaciones.' },
    { name: 'Curar heridas', level: 1, cost: 'Acción', desc: 'Gasta un espacio; cura 2d8 + Carisma a un aliado.' },
    { name: 'Castigo divino', level: 1, cost: 'Acción adicional', desc: 'Tras impactar, gasta un espacio para añadir 2d8 de daño radiante.' },
  ],
};

type SheetTab = 'ficha' | 'habilidades' | 'inventario';
const sheetPositions = new Map<string, { tab: SheetTab; offsets: Record<SheetTab, number> }>();
const initialSheet = (id: string) => sheetPositions.get(id) ?? { tab: 'ficha' as SheetTab, offsets: { ficha: 0, habilidades: 0, inventario: 0 } };

// En la ficha, tocar la parte de arriba (fuera de los objetos) vuelve a la carta; deslizar solo desplaza.
function Sheet({ c, party, onGive, onDrop, onUse, onFlip }: { c: Char; party?: Char[]; onGive?: (uid: string, to: string) => void; onDrop?: (uid: string) => void; onUse?: (uid: string, to: string) => void; onFlip: () => void }) {
  const [sel, setSel] = useState<string | undefined>();
  // Tocar un icono explica qué es, en una ventanita (el autor 2026-11-06); la ficha ya no se gira al tocarla.
  const [tip, setTip] = useState<string>();
  const [expanded, setExpanded] = useState<string>();
  const [tab, setTab] = useState<SheetTab>(() => initialSheet(c.id).tab);
  useEffect(() => { setTab(initialSheet(c.id).tab); offsets.current = { ...initialSheet(c.id).offsets }; setSel(undefined); setTip(undefined); }, [c.id]);
  const scroll = useRef<ScrollView>(null);
  const offsets = useRef(initialSheet(c.id).offsets);
  const changeTab = (nextTab: SheetTab) => {
    sheetPositions.set(c.id, { tab: nextTab, offsets: offsets.current });
    setTab(nextTab);
  };
  const restoreScroll = () => scroll.current?.scrollTo({ y: offsets.current[tab], animated: false });
  const it = c.items.find(i => i.uid === sel);
  const next = XP_LEVELS[c.level] ?? XP_LEVELS[XP_LEVELS.length - 1];
  void onFlip;
  return (
    <View style={{ flex: 1 }}>
    <View style={st.sheetTabs}>
      {([['ficha', 'Ficha', mdiCardAccountDetailsOutline], ['habilidades', 'Habilidades', mdiStarShooting], ['inventario', 'Inventario', mdiBagPersonalOutline]] as const).map(([id, label, icon]) => (
        <Pressable key={id} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: tab === id }} onPress={() => changeTab(id)} style={[st.sheetTab, tab === id && st.sheetTabActive]}>
          <Icon path={icon} size={16} color={tab === id ? C.goldHi : C.textDim} />
          <Text style={[st.sheetTabText, tab === id && { color: C.goldHi }]}>{label}</Text>
        </Pressable>
      ))}
    </View>
    <ScrollView ref={scroll} key={`${c.id}:${tab}`} style={st.sheet} contentContainerStyle={{ padding: 10 }}
      onContentSizeChange={restoreScroll} scrollEventThrottle={100}
      onScroll={e => { offsets.current[tab] = e.nativeEvent.contentOffset.y; sheetPositions.set(c.id, { tab, offsets: offsets.current }); }}>
      <View>
      {tab === 'ficha' ? (<>
      <Text style={st.sheetName}>{c.name}</Text>
      <Text style={st.sheetSub}>{CLASSES[c.cls].name} {SPECIES[c.species].name.toLowerCase()} · nivel {c.level}</Text>
      <View style={st.row}>
        <Stat icon="icono_puntos_golpe" label="PG" value={`${c.hp}/${c.maxHp}`} onPress={() => setTip('Puntos de golpe: la vida del personaje. Si llegan a 0 cae y tira salvaciones contra muerte hasta que lo curan o se estabiliza.')} />
        <Stat icon="icono_defensa" label="CA" value={`${armorClass(c)}`} onPress={() => setTip('Clase de armadura: lo que tiene que sacar un ataque enemigo (d20 + su bonificador) para acertarle. Sube con armadura y escudo.')} />
        <Stat icon="icono_experiencia" label="PX" value={`${c.xp}/${next}`} onPress={() => setTip(`Puntos de experiencia: se ganan venciendo combates. Con ${next} PX sube al nivel ${c.level + 1}.`)} />
      </View>
      <View style={[st.row, { flexWrap: 'wrap' }]}>
        {ABILS.map(a => (
          <Pressable key={a} style={st.abil} onPress={() => setTip(`${ABIL_NAME[a]} ${score(c, a)}: suma ${sign(abilMod(c, a))} a las pruebas de ${ABIL_NAME[a].toLowerCase()} y ${sign(saveBonus(c, a))} a sus salvaciones.`)}>
            <Image source={IMG[ABIL_ICON[a]]} style={{ width: 30, height: 30 }} />
            <Text style={st.abilName}>{ABIL_SHORT[a]}</Text>
            <Text style={st.abilVal}>{score(c, a)} ({sign(abilMod(c, a))})</Text>
            <Text style={st.abilSave}>salv. {sign(saveBonus(c, a))}</Text>
          </Pressable>
        ))}
      </View>
      </>) : null}
      {tab === 'inventario' ? (<>
      <View>
      <Text style={st.itemName}>Equipo e inventario</Text>
      <View style={st.grid}>
        {Array.from({ length: MAX_ITEMS }).map((_, i) => {
          const item = c.items[i];
          return (
            <Pressable key={i} style={[st.slot, item && equipState(c, item)?.on && st.slotOn, item && sel === item.uid && st.slotSel]} onPress={() => item && setSel(item.uid === sel ? undefined : item.uid)}>
              {item ? <Image source={IMG[ITEMS[item.id].img]} style={{ width: 48, height: 48 }} /> : null}
              {item && equipState(c, item)?.on ? <View style={st.onMark}><Icon path={mdiCheck} size={12} color={C.bg} /></View> : null}
            </Pressable>
          );
        })}
      </View>
      {it ? (
        <View style={st.itemBox}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Image source={IMG[ITEMS[it.id].img]} style={st.itemBig} />
            <View style={{ flex: 1 }}>
              <Text style={st.itemName}>{ITEMS[it.id].name}{it.charges !== undefined ? ` (${it.charges} cargas)` : ''}</Text>
              <Text style={st.small}>{ITEMS[it.id].desc}</Text>
              {equipState(c, it) ? <Text style={[st.small, { color: equipState(c, it)!.on ? '#7fcf8f' : C.textDim }]}>{equipState(c, it)!.on ? 'Equipado.' : 'Sin equipar.'}{equipState(c, it)!.why ? ` ${equipState(c, it)!.why}` : ''}</Text> : null}
              <Text style={st.small}>{keeps(it) ? 'Llave: no se vende ni se deja en el suelo.' : `Valor: ${ITEMS[it.id].value} po`}</Text>
            </View>
          </View>
          {onUse && party && usableOutside(it.id) ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
              {party.filter(p => !p.dead && p.hp < p.maxHp).map(p => (
                <Btn key={p.id} small primary label={`Curar a ${p.name.split(' ')[0]}`} onPress={() => { onUse(it.uid, p.id); setSel(undefined); }} />
              ))}
            </View>
          ) : null}
          {onGive && party ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
              {party.filter(p => p.id !== c.id && !p.dead && p.items.length < MAX_ITEMS).map(p => (
                <Btn key={p.id} small label={`Dar a ${p.name.split(' ')[0]}`} onPress={() => { onGive(it.uid, p.id); setSel(undefined); }} />
              ))}
              {onDrop && !keeps(it) ? <Btn small label="Dejar en el suelo" onPress={() => { onDrop(it.uid); setSel(undefined); }} /> : null}
            </View>
          ) : null}
        </View>
      ) : <Text style={st.small}>Toca un objeto para ver sus datos.</Text>}

      </View>
      </>) : null}
      {tab === 'habilidades' ? (<>
      <Text style={st.small}>Percepción pasiva {passivePerception(c)}{c.slots[0] + c.slots[1] > 0 || CLASSES[c.cls].spell ? ` · Espacios de conjuro: ${c.slots[0]} de nivel 1${c.level >= 3 ? `, ${c.slots[1]} de nivel 2` : ''}${c.level >= 5 && slotsAt(c.cls, c.level)[2] ? `, ${c.slots[2] ?? 0} de nivel 3` : ''}` : ''}{c.cls === 'fighter' ? ` · Tomar aliento: ${c.secondWind}` : ''}{c.cls === 'paladin' ? ` · Imposición de manos: ${c.channel} PG` : ''}{c.cls === 'barbarian' ? ` · Furia: ${c.channel}` : ''}</Text>
      {slotsOf(c) ? (
        <Pressable style={st.featureCard} onPress={() => setExpanded(expanded === 'spells' ? undefined : 'spells')}>
          <Text style={st.featureTitle}>✦ Espacios de conjuro {expanded === 'spells' ? '▴' : '▾'}</Text>
          <Slots s={slotsOf(c)!} size={26} />
          <Text style={st.small}>Nivel 1: {c.slots[0]}/{slotsAt(c.cls, c.level)[0]} · Nivel 2: {c.slots[1]}/{slotsAt(c.cls, c.level)[1]}{slotsAt(c.cls, c.level)[2] ? ` · Nivel 3: ${c.slots[2] ?? 0}/${slotsAt(c.cls, c.level)[2]}` : ''}</Text>
          {expanded === 'spells' ? <Text style={st.small}>Las esferas muestran los espacios disponibles: violeta nivel 1, azul nivel 2 y dorada nivel 3; gris cuando se gastan. Los trucos no gastan espacios. Los espacios se recuperan con un descanso largo.</Text> : null}
        </Pressable>
      ) : null}
      <Pressable style={st.featureCard} onPress={() => setExpanded(expanded === 'hitdice' ? undefined : 'hitdice')}>
        <Text style={st.featureTitle}>⚄ Dados de golpe · {c.hitDice}/{c.level} ▾</Text>
        {expanded === 'hitdice' ? <Text style={st.small}>Se utilizan para recuperar puntos de golpe durante un descanso corto. Disponibles: {c.hitDice} de {c.level}.</Text> : null}
      </Pressable>
      {SPELL_CARDS[c.cls]?.length ? (
        <>
          <Text style={st.itemName}>Conjuros y trucos</Text>
          <Text style={st.small}>Resumen de los conjuros disponibles en el combate de Mazmorreo. Despliega una tarjeta para conocer su efecto.</Text>
          {SPELL_CARDS[c.cls]!.filter(sp => sp.level === 0 || (sp.level === 1 && slotsAt(c.cls, c.level)[0] > 0) || (sp.level === 2 && slotsAt(c.cls, c.level)[1] > 0) || (sp.level === 3 && slotsAt(c.cls, c.level)[2] > 0)).map(sp => {
            const key = `spell-${sp.name}`;
            return (
              <Pressable key={key} accessibilityRole="button" onPress={() => setExpanded(expanded === key ? undefined : key)} style={st.featureCard}>
                <Text style={st.featureTitle}>{sp.level === 0 ? '✧' : '✦'} {sp.name} · {sp.level === 0 ? 'Truco' : `Nivel ${sp.level}`} {expanded === key ? '▴' : '▾'}</Text>
                {expanded === key ? <Text style={st.small}>{sp.cost}. {sp.desc}</Text> : null}
              </Pressable>
            );
          })}
        </>
      ) : null}
      <Text style={st.itemName}>Rasgos y habilidades adquiridos</Text>
      {([
        ['clase', '⚔ Clase', CLASSES[c.cls].blurb],
        ['especie', '✦ Especie', SPECIES[c.species].blurb],
        ...Array.from({ length: c.level }, (_, i) => i + 1).flatMap(level =>
          (LEVEL_FEATURES[level]?.[c.cls] ?? []).map((desc, i) => [`nivel-${level}-${i}`, `✧ Nivel ${level}`, desc])),
        ...(c.feats ?? []).map(feat => [`feat-${feat}`, '★ Dote', feat === 'alert' ? 'Alerta: añade competencia a la iniciativa.' : feat === 'savage' ? 'Atacante salvaje: mejora el daño de un arma una vez por turno.' : feat]),
      ] as string[][]).map(([key, title, desc]) => (
        <Pressable key={key} accessibilityRole="button" accessibilityLabel={title} onPress={() => setExpanded(expanded === key ? undefined : key)} style={st.featureCard}>
          <Text style={st.featureTitle}>{title} {expanded === key ? '▴' : '▾'}</Text>
          {expanded === key ? <Text style={st.small}>{desc}</Text> : null}
        </Pressable>
      ))}
      </>) : null}
      </View>
    </ScrollView>
    {tip ? (
      <Pressable style={st.tip} onPress={() => setTip(undefined)} accessibilityLabel="Cerrar explicación">
        <Text style={st.small}>{tip}</Text>
      </Pressable>
    ) : null}
    </View>
  );
}

function MonsterSheet({ id, info, onFlip }: { id: string; info: CardInfo; onFlip: () => void }) {
  const m = MONSTERS[id];
  return (
    <Pressable style={[st.sheet, { padding: 12 }]} onPress={onFlip} accessibilityLabel="Volver a la carta">
      <Text style={st.sheetName}>{info.name}</Text>
      <Text style={st.sheetSub}>{m.name} · {m.xp} PX</Text>
      <View style={st.row}>
        <Stat icon="icono_puntos_golpe" label="PG" value={`${Math.max(0, info.hp)}/${info.maxHp}`} />
        <Stat icon="icono_defensa" label="CA" value={`${info.ac}`} />
      </View>
      {m.attacks.map(a => (
        <Text key={a.name} style={st.small}>• {a.name}: {a.save ? `salvación ${a.save.abil.toUpperCase()} CD ${a.save.dc}` : `+${a.bonus} al ataque`}, {a.dice}{a.extra ? ` + ${a.extra.dice} ${a.extra.type}` : ''} {a.type}{a.ranged ? ' (distancia)' : ''}</Text>
      ))}
      {m.resist ? <Text style={st.small}>Resistente a: {m.resist.join(', ')}</Text> : null}
      {m.vuln ? <Text style={st.small}>Vulnerable a: {m.vuln.join(', ')}</Text> : null}
      {m.immune ? <Text style={st.small}>Inmune a: {m.immune.join(', ')}</Text> : null}
    </Pressable>
  );
}

function Stat({ icon, label, value, onPress }: { icon: ImgKey; label: string; value: string; onPress?: () => void }) {
  return (
    <Pressable style={st.statBox} onPress={onPress}>
      <Image source={IMG[icon]} style={{ width: 34, height: 34 }} />
      <Text style={st.abilName}>{label}</Text>
      <Text style={st.statVal}>{value}</Text>
    </Pressable>
  );
}

/** Espacios de conjuro de un personaje para su carta (solo si tiene alguno). */
export const slotsOf = (c: Char): CardInfo['slots'] => {
  const max = slotsAt(c.cls, c.level);
  return max[0] + max[1] > 0 ? { have: [c.slots[0], c.slots[1], c.slots[2] ?? 0], max } : undefined;
};

export const charInfo = (c: Char): CardInfo => ({ name: c.name, img: c.img, hp: c.hp, maxHp: c.maxHp, ac: armorClass(c), dead: !!c.dead, slots: slotsOf(c) });

/** Una esfera por nivel de conjuro (violeta nivel 1, azul nivel 2, dorada nivel 3; gastada si no quedan), con los que quedan encima. */
const ORB: ImgKey[] = ['esfera_violeta', 'esfera_azul', 'esfera_dorada'];
function Slots({ s, size }: { s: NonNullable<CardInfo['slots']>; size: number }) {
  const lv = [0, 1, 2].filter(i => (s.max[i] ?? 0) > 0);
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {lv.map(i => (
        <View key={i} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <Image source={IMG[s.have[i] > 0 ? ORB[i] : 'esfera_gastada']} style={{ position: 'absolute', width: size, height: size }} />
          <Text style={[st.slotNum, { fontSize: size * 0.55, lineHeight: size * 0.7, textShadowRadius: Math.max(2, size * 0.14), textShadowOffset: { width: 0, height: size * 0.04 } }]}>{s.have[i]}</Text>
        </View>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  tip: { position: 'absolute', left: 10, right: 10, top: 70, backgroundColor: '#1b140d', borderWidth: 1, borderColor: C.goldHi, borderRadius: 8, padding: 10 },
  pop: { minWidth: 30, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 6, elevation: 6 },
  popTxt: { fontFamily: F.titleBold, color: '#fff', textShadowColor: '#000', textShadowRadius: 4 },
  intent: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', zIndex: 4 },
  intentIcon: { backgroundColor: '#7a1414', borderWidth: 2, borderColor: '#e0705f', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  // Sin elevation ni sombra: en Android, al quitarlas la carta podía quedarse en negro.
  card: { borderRadius: 8, overflow: 'hidden', backgroundColor: '#000' },
  edge: { ...StyleSheet.absoluteFillObject, borderRadius: 8, borderWidth: 2, borderColor: 'transparent' },
  band: { position: 'absolute', justifyContent: 'center' },
  name: { fontFamily: F.textBold, color: C.goldHi, textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' },
  stats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stat: { flexDirection: 'row', alignItems: 'center' },
  statTxt: { fontFamily: F.textBold, color: C.text, marginLeft: 2, includeFontPadding: false, textAlignVertical: 'center' },
  active: { borderColor: C.goldHi },
  target: { borderColor: C.damage },
  help: { borderColor: '#5fbf72' },
  stateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  stateName: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 15 },
  stateDesc: { fontFamily: F.text, color: C.text, fontSize: 14, lineHeight: 17 },
  slotNum: { fontFamily: F.titleBold, color: '#fff4dc', textShadowColor: '#000', textShadowRadius: 3, includeFontPadding: false },
  nameBand: { position: 'absolute', justifyContent: 'center' },
  orbs: { position: 'absolute', flexDirection: 'row', justifyContent: 'center', gap: 2 },
  tag: { position: 'absolute', alignSelf: 'center', textAlign: 'center', fontFamily: F.titleBold, color: C.goldHi, fontSize: 11, backgroundColor: '#000a', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 },
  deadNote: { color: C.textDim, textAlign: 'center', fontFamily: F.text, fontSize: 14, marginTop: 8, paddingHorizontal: 6 },
  downTxt: { position: 'absolute', top: '40%', alignSelf: 'center', maxWidth: '90%', textAlign: 'center', fontFamily: F.titleBold, color: C.damage, fontSize: 14 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center' },
  face: { position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden' },
  backFace: { borderRadius: 10, overflow: 'hidden', borderWidth: 2, borderColor: C.gold },
  sheet: { flex: 1, backgroundColor: C.panel },
  sheetTabs: { flexDirection: 'row', backgroundColor: C.panel, borderBottomWidth: 1, borderColor: C.border },
  sheetTab: { flex: 1, flexDirection: 'row', gap: 5, paddingVertical: 9, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderColor: 'transparent' },
  sheetTabActive: { borderColor: C.goldHi },
  sheetTabText: { fontFamily: F.textBold, fontSize: 12, color: C.textDim },
  sheetName: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 24, textAlign: 'center' },
  sheetSub: { fontFamily: F.italic, color: C.textDim, fontSize: 18, textAlign: 'center', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 6 },
  abil: { width: '33%', alignItems: 'center', marginBottom: 4 },
  abilName: { fontFamily: F.title, color: C.gold, fontSize: 13 },
  abilVal: { fontFamily: F.textBold, color: C.text, fontSize: 18 },
  abilSave: { fontFamily: F.text, color: C.textDim, fontSize: 15 },
  statBox: { alignItems: 'center' },
  statVal: { fontFamily: F.textBold, color: C.text, fontSize: 20 },
  small: { fontFamily: F.text, color: C.text, fontSize: 17, lineHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  slot: { width: 60, height: 60, margin: 3, borderWidth: 1, borderColor: C.border, borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0006' },
  slotSel: { borderColor: C.goldHi, borderWidth: 2 },
  slotOn: { borderColor: C.gold },
  onMark: { position: 'absolute', right: 2, top: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: C.goldHi, alignItems: 'center', justifyContent: 'center' },
  itemBig: { width: 110, height: 110 },
  itemBox: { marginTop: 6, padding: 8, borderWidth: 1, borderColor: C.border, borderRadius: 6 },
  itemName: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 14, marginBottom: 2 },
  featureCard: { borderWidth: 1, borderColor: C.border, borderRadius: 7, backgroundColor: '#211f1a', padding: 8, marginBottom: 5 },
  featureTitle: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 15 },
});
