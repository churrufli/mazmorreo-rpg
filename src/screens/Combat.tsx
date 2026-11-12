import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IMG } from '../assets';
import { C, F } from '../theme';
import { useStore } from '../store';
import { Action, Unit, actionsFor, autoTurn, current, hasUseful, targetsFor } from '../engine/combat';
import { Card, CardInfo, CardModal, resetFx, slotsOf } from '../ui/Card';
import { statesOf } from '../ui/estados';
import { ADVS, TOWNS, advOf } from '../engine/aventuras';
import { LogModal } from '../ui/LogModal';
import { Bg, Btn } from '../ui/kit';
import { FaceImage } from '../ui/FaceImage';
import { getDev, markAction, seenAction } from '../storage';
import { D20, FadeIn, Message, MiniDie, rollMs } from '../ui/Overlays';
import { CLASSES, DmgType, ITEMS, MONSTERS } from '../data/srd';
import { Settings } from '../ui/Settings';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { Icon, Panel } from '../ui/kit';
import { mdiAutoFix, mdiBowArrow, mdiBullseyeArrow, mdiCardsOutline, mdiCogOutline, mdiFire, mdiGestureTap, mdiInformationOutline, mdiShieldSword, mdiSword, mdiCircle, mdiRhombus, mdiSwapVertical, mdiLightningBolt, mdiRun, mdiScriptTextOutline, mdiSwordCross, mdiCreation, mdiSack } from '@mdi/js';
import { CombatGroup, groupOf, menuActionsFor, quickAttack } from '../ui/combatMenu';
import { slotsLeft } from '../engine/rules';
import { ACTION_HELP as DESC } from '../data/actionHelp';
import { AYUDA_COMBATE, GESTOS_COMBATE, ZONAS_COMBATE } from '../data/ayuda';

const COST: Record<Action['cost'], string> = { action: 'Acción', bonus: 'Adicional', move: 'Movimiento', free: 'Sin acción' };
/** El mismo símbolo en el indicador del turno y en cada botón: qué gasta. */
const COST_ICON: Record<Action['cost'], string> = { action: mdiCircle, bonus: mdiRhombus, move: mdiSwapVertical, free: mdiLightningBolt };
const CATEGORY_HELP: Record<string, string> = {
  attack: 'Armas y ataques. Cada opción indica su coste y su tirada. Tocar directamente un enemigo le ataca con un arma que le alcance; mantén pulsada su carta para ver su ficha sin atacar.',
  skills: 'Rasgos y conjuros disponibles. Con un único objetivo se usan al tocarlos; con varios, eliges la carta. Mantén pulsado un botón para leer qué hace sin usarlo.',
  items: 'Objetos consumibles del personaje. Con un único objetivo se usan al tocarlos; con varios, eliges la carta. Mantén pulsado un botón para leer qué hace sin gastarlo.',
};
const CATEGORIES = [['attack', 'Atacar'], ['skills', 'Habilidades'], ['items', 'Objetos']] as const;

/** Alto de la franja de arriba con el engranaje de Ajustes. */
const GEAR_H = 44;
/** Alto de una fila vacía del grupo (se ve para poder tocarla y moverse allí). */
const EMPTY_ROW = 28;

export function Combat() {
  const { game, combat, act, endTurn, enemyStep, closeCombat, devWin } = useStore();
  const g = game!;
  const cb = combat!;
  const ins = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const landscape = width >= 700 && width > height;
  const controlsWidth = landscape ? Math.min(420, width * 0.48) : width;
  const boardWidth = landscape ? width - controlsWidth : width;
  const lastCommit = useRef(0);
  // Acción seleccionada: el primer toque la explica (y marca objetivos); el segundo, o tocar un objetivo, la ejecuta.
  const [sel, setSel] = useState<Action>();
  const [actionGroup, setActionGroup] = useState<CombatGroup>('attack');
  // Última categoría abierta por cada personaje.
  const lastGroup = useRef<Record<string, CombatGroup>>({});
  const [askFlee, setAskFlee] = useState(false);
  const [sheet, setSheet] = useState<Unit>();
  const [help, setHelp] = useState(false);
  const [showLog, setShowLog] = useState(false);
  // Cuadro de explicación superpuesto a los botones (pulsación prolongada, como en las primeras versiones).
  const [tip, setTip] = useState<{ title: string; text: string; a?: Action }>();
  const [targetFeedback, setTargetFeedback] = useState<string>();
  // Ajustes encima del combate: mientras están abiertos, el combate se para (el autor 2026-11-05).
  const [opts, setOpts] = useState(false);
  // Enemigos derrotados cuya carta ya se ha roto y desaparecido.
  const [gone, setGone] = useState<string[]>([]);
  const me = current(cb);
  const auto = !cb.result && autoTurn(cb);
  // Presentación del encuentro con la iniciativa; nadie actúa hasta cerrarla.
  const [ready, setReady] = useState(false);
  // La ventana del final espera a que se vea la última tirada.
  const [endShown, setEndShown] = useState(false);
  const logRef = useRef<ScrollView>(null);
  const [area, setArea] = useState(0);
  const [logH, setLogH] = useState(0);
  // Animación de cada ataque: la carta embiste a su objetivo o un proyectil vuela hasta él.
  const rootRef = useRef<View>(null);
  const cardRefs = useRef<Record<string, View | null>>({});
  const lunge = useRef(new Animated.ValueXY()).current;
  const fly = useRef(new Animated.Value(0)).current;
  const tilt = useRef(new Animated.Value(0)).current;
  const rot = tilt.interpolate({ inputRange: [-1, 1], outputRange: ['-18deg', '18deg'] });
  const [lungeKey, setLungeKey] = useState<string>();
  const [shot, setShot] = useState<{ x: number; y: number; dx: number; dy: number; kind: 'arrow' | 'magic'; color: string }>();
  // Cada ataque se anima una sola vez: al volver a montar la pantalla no se repite el último (el autor 2026-11-10).
  const playedSwing = useRef(cb.swing?.id);
  useEffect(() => {
    const sw = cb.swing;
    const a = sw && cardRefs.current[sw.from], b = sw && cardRefs.current[sw.to], root = rootRef.current;
    if (!sw || !a || !b || !root || playedSwing.current === sw.id) return;
    playedSwing.current = sw.id;
    root.measureInWindow((rx, ry) => a.measureInWindow((ax, ay, aw, ah) => b.measureInWindow((bx, by, bw, bh) => {
      const dx = bx + bw / 2 - (ax + aw / 2), dy = by + bh / 2 - (ay + ah / 2);
      if (sw.kind === 'melee') {
        // Se echa atrás, se lanza girada hacia el lado del objetivo y golpea con la esquina; luego vuelve.
        // Girada hacia el objetivo para que entre por la esquina más cercana (arriba o abajo según el bando).
        const side = (dx === 0 ? 1 : Math.sign(dx)) * (dy > 0 ? -1 : 1);
        setLungeKey(sw.from);
        lunge.setValue({ x: 0, y: 0 });
        tilt.setValue(0);
        Animated.parallel([
          Animated.sequence([
            Animated.timing(lunge, { toValue: { x: -dx * 0.08, y: -dy * 0.08 }, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(lunge, { toValue: { x: dx * 0.8, y: dy * 0.8 }, duration: IMPACT - 120, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
            Animated.timing(lunge, { toValue: { x: 0, y: 0 }, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(tilt, { toValue: -0.4 * side, duration: 120, useNativeDriver: true }),
            Animated.timing(tilt, { toValue: side, duration: IMPACT - 120, easing: Easing.in(Easing.quad), useNativeDriver: true }),
            Animated.timing(tilt, { toValue: 0, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          ]),
        ]).start(() => setLungeKey(undefined));
      } else {
        setShot({ x: ax + aw / 2 - rx, y: ay + ah / 2 - ry, dx, dy, kind: sw.kind, color: SPELL_COLOR[sw.type] ?? '#b48cff' });
        fly.setValue(0);
        Animated.timing(fly, { toValue: 1, duration: IMPACT, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => setShot(undefined));
      }
    })));
  }, [cb.swing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cuándo se quita de la pantalla la última tirada: los carteles esperan a que se vea entera.
  const rollEnd = useRef(0);
  useEffect(() => { if (cb.roll) rollEnd.current = Date.now() + rollMs(cb.roll); }, [cb.roll?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const rollLeft = () => Math.max(0, rollEnd.current - Date.now());
  // Cartel del asalto: sale cuando acaba la última tirada y, mientras se ve, nadie tira dados.
  const [banner, setBanner] = useState<{ round: number; delay: number }>();
  useEffect(() => {
    if (!ready || cb.result) return;
    setBanner({ round: cb.round, delay: rollLeft() });
  }, [ready, cb.round]); // eslint-disable-line react-hooks/exhaustive-deps
  // El cartel del asalto no bloquea al jugador; los enemigos sí esperan a que acabe (el autor 2026-11-10).
  const busy = opts || help || !!sheet || showLog;
  const paused = busy || !!banner || !!sel || !!tip || askFlee;

  useEffect(() => {
    if (!auto || !ready || paused) return;
    const t = setTimeout(enemyStep, Math.max(rollLeft(), me.side === 'enemy' ? 1400 : 700));
    return () => clearTimeout(t);
  }, [auto, ready, paused, cb, enemyStep, me.side]);

  // Al acabar: se espera a la última tirada, sale un cartel con lo último que pasó y luego la ventana del final.
  const [endBanner, setEndBanner] = useState<{ text: string; delay: number }>();
  useEffect(() => {
    if (!cb.result) { setEndShown(false); setEndBanner(undefined); return; }
    const delay = rollLeft();
    if (cb.endLine) setEndBanner({ text: cb.endLine, delay });
    const t = setTimeout(() => setEndShown(true), delay + (cb.endLine ? END_MS : 300));
    return () => clearTimeout(t);
  }, [cb.result]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    setTargetFeedback(undefined);
    setTip(undefined);
    // Nunca reutilizar un objetivo ni una acción de otro personaje sin su elección.
    setSel(undefined);
    setAskFlee(false);
    setActionGroup(lastGroup.current[me.key] ?? 'attack');
  }, [cb.turn, cb.round, auto]); // eslint-disable-line react-hooks/exhaustive-deps
  useState(resetFx); // antes de montar las cartas

  const menu = !auto && !cb.result ? menuActionsFor(g, cb) : [];
  const fleeAct = menu.find(a => a.id === 'flee');
  const rowAct = menu.find(a => a.id === 'row');
  const dodgeAct = menu.find(a => a.id === 'dodge');
  const groups = CATEGORIES.map(([id]) => id).filter(id => menu.some(a => groupOf(a) === id));
  const activeGroup = groups.includes(actionGroup as typeof groups[number]) ? actionGroup : groups[0];
  const grouped = menu.filter(a => groupOf(a) === activeGroup);
  const meChar = me.side === 'party' ? g.party.find(c => c.id === me.charId) : undefined;
  const slots = meChar && CLASSES[meChar.cls].spell ? slotsLeft(meChar) : undefined;
  const pending = sel && !sel.off && sel.target !== 'none' ? sel : undefined;
  // Si ya no queda nada útil que hacer (solo cambiar de fila o acciones que no sirven), el turno acaba solo.
  const idle = ready && !paused && !auto && !cb.result && !sel && !tip && !askFlee && !hasUseful(g, cb) && (!rowAct || !!rowAct.off);
  useEffect(() => {
    if (!idle) return;
    const t = setTimeout(endTurn, 1100);
    return () => clearTimeout(t);
  }, [idle, cb, endTurn]);
  const targets = pending ? targetsFor(cb, pending).map(u => u.key) : [];
  const rowOf = (side: Unit['side'], row: Unit['row']) => cb.units.filter(u => u.side === side && u.row === row && !u.fled && !(u.side === 'enemy' && u.dead && gone.includes(u.key)));
  // Las filas enemigas vacías apenas ocupan sitio; las del grupo se ven siempre (se puede tocar para moverse allí).
  const counts = (['enemy', 'party'] as const).flatMap(sd => (['front', 'back'] as const).map(r => rowOf(sd, r).length)).filter(n => n > 0);
  const emptyH = (['front', 'back'] as const).reduce((n, r) => n + (rowOf('enemy', r).length ? 0 : 14) + (rowOf('party', r).length ? 0 : EMPTY_ROW + 4), 0);
  // Alto real libre para las cartas: zona superior menos el registro (los botones de abajo ya se restan solos).
  const free = area && logH ? area - logH - 8 - GEAR_H - 4 * counts.length - emptyH : height - ins.top - ins.bottom - 320;
  const cardW = Math.max(30, Math.min((boardWidth - 12) / Math.max(2.2, ...counts) - 6, free / Math.max(2, counts.length) / 1.5));

  const close = () => { setTip(undefined); setTargetFeedback(undefined); setSel(undefined); };
  // Los objetivos indistinguibles siguen sin exigir una pulsación adicional.
  const same = (ts: Unit[]) => ts.length > 1 && ts.every(t => t.side === 'enemy' && t.mon === ts[0].mon && t.hp === ts[0].hp && t.row === ts[0].row && !statesOf(cb, t).length);
  const go = (a: Action, t?: string) => {
    if (busy || Date.now() - lastCommit.current < 300) return;
    const live = useStore.getState();
    if (!live.game || !live.combat || live.combat.result || autoTurn(live.combat) || live.combat.turn !== cb.turn || live.combat.round !== cb.round || current(live.combat).key !== me.key) return;
    const allowed = actionsFor(live.game, live.combat).find(x => x.id === a.id);
    if (!allowed || allowed.off || (allowed.target !== 'none' && !targetsFor(live.combat, allowed).some(x => x.key === t))) return;
    lastCommit.current = Date.now();
    act(allowed, t);
    close();
  };
  const finishTurn = () => {
    if (busy || Date.now() - lastCommit.current < 300) return;
    const live = useStore.getState().combat;
    if (!live || live.result || autoTurn(live) || live.turn !== cb.turn || live.round !== cb.round || current(live).key !== me.key) return;
    lastCommit.current = Date.now();
    close();
    endTurn();
  };
  const explain = (a: Action) => { setSel(undefined); setTip({ title: a.label.toLocaleUpperCase('es-ES'), text: descOf(a) ?? '', a }); };
  // Mantener pulsado (o la pestaña) abre el cuadro de explicación sin usar nada.
  // Toque corto: un único objetivo se usa directamente; con varios se marcan las cartas;
  // sin objetivo sale el cuadro con USAR (o se usa tocando el botón otra vez); apagada, explica el motivo.
  const choose = (a: Action, infoOnly = false) => {
    setTargetFeedback(undefined);
    if (infoOnly || a.off) return explain(a);
    if (busy) return;
    // Sin objetivo: la explicación sale solo la primera vez; luego se usa al tocar (el autor 2026-11-10).
    // Siempre se puede releer con la pestaña de la derecha o manteniendo pulsado.
    if (a.target === 'none') {
      const k = a.id.split(':')[0];
      if (tip?.a?.id === a.id || seenAction(k)) return go(a);
      markAction(k);
      return explain(a);
    }
    const ts = targetsFor(cb, a);
    if (ts.length === 1 || same(ts)) return go(a, ts[0].key);
    if (sel?.id === a.id) return close();
    setTip(undefined);
    setSel(a);
  };
  const showCategory = (id: string) => { setSel(undefined); setTip({ title: (CATEGORIES.find(c => c[0] === id)?.[1] ?? '').toLocaleUpperCase('es-ES'), text: CATEGORY_HELP[id] }); };
  const useTip = () => {
    const a = tip?.a;
    if (!a || a.off) return;
    if (a.target === 'none') return go(a);
    const ts = targetsFor(cb, a);
    if (ts.length === 1 || same(ts)) return go(a, ts[0].key);
    setTip(undefined);
    setSel(a);
  };
  const tryFlee = () => {
    if (!fleeAct || busy) return;
    if (fleeAct.off) return explain(fleeAct);
    setSel(undefined);
    setAskFlee(true);
  };
  // Los objetos se explican con su propia ficha (antídoto, pociones, arrojadizos…).
  const descOf = (a: Action) => {
    const [k, arg] = a.id.split(':');
    const it = ['potion', 'throw', 'web', 'wand', 'scroll'].includes(k) ? g.party.flatMap(c => c.items).find(i => i.uid === arg) : undefined;
    return k === 'atk' ? `${ITEMS[arg]?.desc ?? ''} ${DESC.atk}` : it ? `${ITEMS[it.id].desc} ${DESC[k] ?? ''}` : DESC[k];
  };

  const info = (u: Unit): CardInfo => {
    const c = u.side === 'party' ? g.party.find(x => x.id === u.charId) : undefined;
    return { name: u.name, img: u.img, hp: u.hp, maxHp: u.maxHp, ac: u.ac + (u.shield ? 5 : 0), temp: u.temp, dead: !!u.dead, states: statesOf(cb, u), slots: c ? slotsOf(c) : undefined };
  };

  // Lo que prepara cada enemigo: icono de la acción y retratos de sus objetivos.
  const intentOf = (u: Unit) => {
    const p = u.side === 'enemy' && !cb.result && ready && !u.dead ? u.plan : undefined;
    if (!p) return undefined;
    const icon = p.guard ? mdiShieldSword : { melee: mdiSword, ranged: mdiBowArrow, magic: mdiAutoFix, area: mdiFire }[p.kind];
    const faces = [...new Set(p.targets)].map(k => cb.units.find(x => x.key === k)?.img).filter((x): x is Unit['img'] => !!x);
    return { icon, faces };
  };

  // Lo que queda del turno, con los mismos símbolos que llevan los botones (en pantallas estrechas, solo símbolos).
  const budget = !auto && !cb.result && me.side === 'party' ? (
    <View testID="combat-budget" style={st.budget}>
      {([['action', 'Acción', cb.acted], ['bonus', 'Adicional', cb.bonus], ['move', 'Mover', cb.moved]] as const).map(([k, label, used]) => (
        <View key={k} style={[st.budgetItem, used && { opacity: 0.3 }]} accessible accessibilityLabel={`${label}: ${used ? 'gastada' : 'disponible'}`}>
          <Icon path={COST_ICON[k]} size={12} color={used ? C.textDim : C.goldHi} /><Text testID={`budget-${k}`} style={st.budgetTxt}>{used ? '0' : '1'}</Text>
          {width >= 380 ? <Text style={[st.budgetTxt, used && { textDecorationLine: 'line-through' }]}>{label}</Text> : null}
        </View>
      ))}
      {slots !== undefined ? <Text style={st.budgetTxt} accessibilityLabel={`Espacios de conjuro: ${slots}`}>{width >= 380 ? 'Conjuros ' : '✦'}{slots}</Text> : null}
    </View>
  ) : null;

  const renderRow = (side: Unit['side'], row: Unit['row']) => {
    const us = rowOf(side, row);
    const name = row === 'front' ? 'Vanguardia' : 'Retaguardia';
    if (side === 'enemy' && !us.length) return <View style={{ height: 14 }} />;
    if (!us.length) {
      return (
        <View testID={`combat-row-${row}`} style={[st.rowBand, st.emptyRow]}>
          <Text style={st.emptyRowTxt}>{`${name} vacía`}</Text>
        </View>
      );
    }
    return (
      <View style={[st.row, st.rowBand, side === 'enemy' && st.rowEnemy, { minHeight: cardW * 1.5 + 2 }]}>
        <Text style={st.rowLabel}>{name}</Text>
        {us.map(u => {
          const isT = targets.includes(u.key);
          return (
            <Animated.View testID={`combat-unit-${u.key}`} key={u.key} ref={(r: View | null) => { cardRefs.current[u.key] = r; }} collapsable={false} style={{ marginHorizontal: 3, zIndex: lungeKey === u.key ? 5 : 0, transform: lungeKey === u.key ? [...lunge.getTranslateTransform(), { rotate: rot }] : [] }}>
              <Card
                info={info(u)}
                minTouchSize={44}
                selecting={!!pending}
                interactionHint={!auto && u.side === 'enemy' ? 'Toca para atacar si hay un arma disponible que le alcance. Mantén pulsado para consultar la ficha sin atacar.' : 'Toca para consultar la ficha.'}
                width={cardW}
                active={u.key === me.key && !cb.result}
                target={isT && pending?.target !== 'ally'}
                help={isT && pending?.target === 'ally'}
                dim={u.dead || (!!pending && !pending.off && pending.target !== 'none' && !isT)}
                fx={cb.fx?.[u.key]}
                pop={cb.pops?.[u.key]}
                intent={intentOf(u)}
                fxKey={u.key}
                fxDelay={IMPACT}
                onBroken={u.side === 'enemy' && u.dead ? () => setGone(x => [...x, u.key]) : undefined}
                // Tocar: si se está eligiendo objetivo, lo elige; si no, amplía la carta con sus estados.
                // En tu turno, tocar a un enemigo le ataca con tu arma (si está a tu alcance). Mantener pulsado abre su ficha.
                onPress={() => {
                  if (pending) { if (isT) go(pending, u.key); else setTargetFeedback(pending.target === 'ally' ? 'elige un aliado resaltado' : 'elige un objetivo resaltado'); return; }
                  const quick = !auto && !busy && ready && u.side === 'enemy' && !u.dead ? quickAttack(g, cb, u.key) : undefined;
                  if (quick) go(quick, u.key); else setSheet(u);
                }}
                onLongPress={() => setSheet(u)}
              />
            </Animated.View>
          );
        })}
      </View>
    );
  };

  return (
    <Bg src={IMG[cb.bg]} dim={0.45}>
      <View style={{ flex: 1, flexDirection: landscape ? 'row' : 'column' }}>
      <View testID="combat-field" ref={rootRef} collapsable={false} style={{ flex: 1, minHeight: 0, overflow: 'hidden', paddingTop: ins.top + 4, paddingHorizontal: 6 }} onLayout={e => setArea(e.nativeEvent.layout.height - ins.top - 4)}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Orden de turnos arriba (maqueta aprobada por el autor 2026-11-06): asalto, retratos por iniciativa y engranaje. */}
        <View style={st.turns}>
          <Text style={st.turnsRound}>{'Asalto\n'}{cb.round}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ alignItems: 'center', gap: 4, paddingHorizontal: 2 }}>
            {cb.order.map((k, i) => {
              const u = cb.units.find(x => x.key === k);
              if (!u) return null;
              const now = i === cb.turn, past = i < cb.turn, down = !!u.dead || u.hp <= 0;
              const sz = now ? 40 : 32;
              return (
                <View key={k} style={{ width: sz, height: sz, borderRadius: sz / 2, overflow: 'hidden', borderWidth: now ? 3 : 2, backgroundColor: '#000',
                  borderColor: down ? '#555' : now ? C.goldHi : u.side === 'enemy' ? '#b5483a' : C.gold, opacity: down ? 0.35 : past ? 0.5 : 1 }}>
                  <FaceImage img={u.img} size={sz - (now ? 6 : 4)} />
                </View>
              );
            })}
          </ScrollView>
          {fleeAct ? (
            <Pressable disabled={!ready} onPress={tryFlee} accessibilityRole="button" accessibilityLabel="HUIR" hitSlop={8} style={[st.fleeBtn, !!fleeAct.off && { opacity: 0.45 }]}>
              <Icon path={mdiRun} size={16} color={C.text} />
              <Text style={st.fleeTxt}>HUIR</Text>
            </Pressable>
          ) : null}
          {!auto && !cb.result && getDev() ? <Pressable accessibilityRole="button" accessibilityLabel="GANAR COMBATE" onPress={devWin} style={st.devControl}><Text style={st.devText}>GANAR COMBATE</Text></Pressable> : null}
          <Pressable onPress={() => setOpts(true)} accessibilityRole="button" accessibilityLabel="Ajustes" hitSlop={12} style={{ marginLeft: 4 }}>
            <Icon path={mdiCogOutline} size={22} />
          </Pressable>
        </View>
        {renderRow('enemy', 'back')}
        {renderRow('enemy', 'front')}
        <View style={st.log} onLayout={e => setLogH(e.nativeEvent.layout.height)}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text accessibilityLiveRegion="polite" style={[st.round, { flex: 1 }, !!sel && { color: C.goldHi }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{!sel ? `Turno de ${me.name}`
              : `${sel.label}: ${targetFeedback ?? `toca ${sel.target === 'ally' ? 'un aliado' : 'un objetivo'}`}`}</Text>
            {!sel ? budget : null}
            <Pressable onPress={() => setShowLog(true)} accessibilityRole="button" accessibilityLabel="Registro del combate" style={{ padding: 4 }}><Icon path={mdiScriptTextOutline} size={20} /></Pressable>
            {sel && !tip ? <Pressable accessibilityRole="button" accessibilityLabel="CANCELAR ACCIÓN" onPress={close} hitSlop={8} style={{ padding: 5, minHeight: 28, justifyContent: 'center' }}><Text style={st.devText}>CANCELAR</Text></Pressable> : null}
            <Pressable onPress={() => setHelp(true)} accessibilityRole="button" accessibilityLabel="Cómo funciona el combate" hitSlop={12}>
              <Icon path={mdiInformationOutline} size={20} />
            </Pressable>
          </View>
          {cb.goal ? (
            <View style={st.goal}>
              <Icon path={mdiBullseyeArrow} size={16} color={cb.goal.status === 'ok' ? '#7fcf8f' : cb.goal.status === 'fail' ? C.textDim : C.goldHi} />
              <Text style={[st.goalTxt, cb.goal.status === 'ok' && { color: '#7fcf8f' }, cb.goal.status === 'fail' && { color: C.textDim, textDecorationLine: 'line-through' }]} numberOfLines={2}>
                {cb.goal.status === 'ok' ? '✓ ' : ''}{cb.goal.g.text}
              </Text>
            </View>
          ) : null}
          {/* Desliza para ver todo el registro del combate. */}
          <ScrollView ref={logRef} style={{ height: height < 700 ? 28 : 52, flexGrow: 0, flexShrink: 0 }} nestedScrollEnabled onContentSizeChange={() => logRef.current?.scrollToEnd({ animated: true })}>
            {cb.log.map((l, i) => (
              <Text key={i} style={[st.logLine, l.c === 'dmg' && { color: '#e8796b' }, l.c === 'heal' && { color: '#7fcf8f' }, l.c === 'big' && { color: C.goldHi }, l.c === 'miss' && { color: C.textDim }]}>{l.t}</Text>
            ))}
          </ScrollView>
        </View>
        {renderRow('party', 'front')}
        {renderRow('party', 'back')}
        </ScrollView>
        {shot ? <Projectile {...shot} t={fly} /> : null}
      </View>
      <View testID="combat-controls" style={[st.actions, { height: landscape ? height : 240 + ins.bottom, width: controlsWidth, flexGrow: 0, flexShrink: 0, paddingTop: landscape ? ins.top + 4 : 3, paddingBottom: ins.bottom + 3 }]}>
        {auto ? (
          <Text style={st.wait}>{me.side === 'enemy' ? `${me.name} actúa…` : me.paralyzed ? `${me.name} está paralizado y no puede actuar…` : `${me.name} no puede actuar…`}</Text>
        ) : !cb.result ? (
          <>
            {groups.length ? (
              <View testID="combat-categories" style={st.categoryRow}>
                {CATEGORIES.filter(([id]) => groups.includes(id)).map(([id, label]) => (
                  <Btn key={id} small combatTone="parent" disabled={!ready} icon={{attack:mdiSwordCross,skills:mdiCreation,items:mdiSack}[id]} onInfo={() => showCategory(id)} onLongPress={() => showCategory(id)}  primary={activeGroup === id} off={menu.filter(a => groupOf(a) === id).every(a => !!a.off)}
                    label={label.toLocaleUpperCase('es-ES')}
                    onPress={() => { lastGroup.current[me.key] = id; setActionGroup(id); close(); }}
                    style={st.categoryOrnate} />
                ))}
              </View>
            ) : null}
            <ScrollView testID="combat-action-scroll" style={{ flex: 1 }} contentContainerStyle={st.actionGrid} nestedScrollEnabled>
              {grouped.map(a => <Btn key={a.id} small combatTone="child" icon={COST_ICON[a.cost]} disabled={!ready} onInfo={() => choose(a, true)} onLongPress={() => choose(a, true)} primary={sel?.id === a.id || tip?.a?.id === a.id} label={a.label.toLocaleUpperCase('es-ES')} off={!!a.off} onPress={() => choose(a)} style={st.gridBtn} />)}
            </ScrollView>
            <View style={st.fixedRow}>
              {dodgeAct ? <Btn small combatTone="child" icon={COST_ICON[dodgeAct.cost]} disabled={!ready} onInfo={() => choose(dodgeAct, true)} onLongPress={() => choose(dodgeAct, true)} primary={tip?.a?.id === dodgeAct.id} label="ESQUIVAR" off={!!dodgeAct.off} onPress={() => choose(dodgeAct)} style={st.fixedBtn} /> : null}
              {rowAct ? <Btn small combatTone="child" icon={COST_ICON.move} disabled={!ready} label={rowAct.label.toLocaleUpperCase('es-ES')} off={!!rowAct.off} onInfo={() => choose(rowAct, true)} onLongPress={() => choose(rowAct, true)} onPress={() => rowAct.off ? choose(rowAct) : go(rowAct)} style={st.fixedBtn} /> : null}
              <Btn small combatTone="child" label="TERMINAR TURNO" disabled={!ready} onPress={finishTurn} style={{...st.fixedBtn,width:'100%'}} />
            </View>

          </>
        ) : null}
        {/* Cuadro de explicación encima de los botones: no mueve ni encoge las cartas. */}
        {tip && !cb.result ? (
          <View testID="combat-tip" style={[st.strip, { bottom: ins.bottom + 4 }]}>
            <Text style={st.stripTitle}>{tip.title}{tip.a ? <Text style={st.stripCost}>{[COST[tip.a.cost], tip.a.detail].filter(Boolean).map(x => `  ·  ${x}`).join('')}</Text> : null}</Text>
            <ScrollView style={{ maxHeight: 130, flexGrow: 0 }} nestedScrollEnabled>
              {tip.a?.off ? <Text style={st.stripOff}>{tip.a.off}</Text> : null}
              {tip.text ? <Text style={st.stripTxt}>{tip.text}</Text> : null}
            </ScrollView>
            <View style={st.stripBtns}>
              {tip.a && !tip.a.off && !auto ? <Btn small primary label="Usar" onPress={useTip} style={{ flex: 1 }} /> : null}
              <Pressable accessibilityRole="button" accessibilityLabel="CANCELAR ACCIÓN" onPress={close} style={st.stripClose}><Text style={st.stripCloseTxt}>CERRAR</Text></Pressable>
            </View>
          </View>
        ) : null}
      </View>
      </View>
      <D20 roll={cb.roll} />
      {cb.result && endShown ? (
        <Message
          title={cb.result === 'win' ? 'Victoria' : cb.result === 'fled' ? 'Huida' : 'Derrota'}
          bg={cb.result === 'win' ? 'victoria' : cb.result === 'lose' ? 'derrota' : undefined}
          lines={cb.summary ?? []}
          onDone={closeCombat}
        />
      ) : null}
      {banner && !cb.result ? <RoundBanner key={banner.round} round={banner.round} delay={banner.delay} onEnd={() => setBanner(b => (b?.round === banner.round ? undefined : b))} /> : null}
      {endBanner && !endShown ? <RoundBanner key="fin" text={endBanner.text} delay={endBanner.delay} hold={END_MS - 900} /> : null}
      {!ready ? <EncounterIntro cb={cb} onDone={() => setReady(true)} /> : null}
      {showLog ? <LogModal title="Registro del combate" lines={cb.log.map(line => line.t)} onClose={() => setShowLog(false)} /> : null}
      {help ? <CombatHelp onClose={() => setHelp(false)} /> : null}
      {opts ? <Settings onClose={() => setOpts(false)} /> : null}
      {askFlee && fleeAct && !cb.result ? (
        <View style={st.confirmBg}>
            <Panel style={{ width: '86%' }}>
              <Text style={st.initTitle}>¿Huir del combate?</Text>
              <Text style={[st.stripTxt, { textAlign: 'center', marginBottom: 10 }]}>El grupo retrocede una casilla. Los enemigos se quedan como estaban y seguirán ahí.</Text>
              <Btn label="Seguir luchando" primary onPress={() => setAskFlee(false)} />
              <Btn label="Huir" danger onPress={() => { setAskFlee(false); go(fleeAct); }} style={{ marginTop: 6 }} />
            </Panel>
        </View>
      ) : null}
      {sheet ? (
        sheet.side === 'party'
          ? <CardModal char={g.party.find(c => c.id === sheet.charId)} town={TOWNS[ADVS[advOf(g.zone)].town].name} info={info(cb.units.find(u => u.key === sheet.key)!)} onClose={() => setSheet(undefined)} />
          : <CardModal monster={sheet.mon} info={info(cb.units.find(u => u.key === sheet.key)!)} intent={intentOf(cb.units.find(u => u.key === sheet.key)!)} onClose={() => setSheet(undefined)} />
      ) : null}
    </Bg>
  );
}

/** Guía del combate, superpuesta: esquema numerado de la pantalla, gestos y reglas básicas. */
function CombatHelp({ onClose }: { onClose: () => void }) {
  const ins = useSafeAreaInsets();
  const Num = ({ n }: { n: number }) => <View style={st.num}><Text style={st.numTxt}>{n}</Text></View>;
  const Mini = ({ n, red, lit }: { n?: number; red?: boolean; lit?: boolean }) => (
    <View style={[st.miniCard, red && { borderColor: '#b5483a' }, lit && { borderColor: C.goldHi, transform: [{ scale: 1.08 }] }]}>{n ? <Num n={n} /> : null}</View>
  );
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={[st.helpBg, { paddingTop: ins.top + 16, paddingBottom: ins.bottom + 16 }]}>
        <View style={st.helpPanel}>
          <Text style={st.helpTitle}>Cómo funciona el combate</Text>
          <ScrollView style={{ flex: 1 }}>
            {/* Esquema de la pantalla con sus zonas numeradas. */}
            <View style={st.scheme}>
              <View style={st.schemeRow}><Mini red /><Mini red n={1} /><Mini red /></View>
              <View style={st.schemeLog}><Num n={2} /><Text style={st.schemeTxt}>Asalto 1 · turno de…</Text><Icon path={mdiInformationOutline} size={14} /></View>
              <View style={st.schemeRow}><Mini lit n={3} /><Mini /></View>
              <View style={st.schemeBtns}>
                <View style={st.schemeBtn}><Num n={4} /><Text style={st.schemeTxt}>Atacar</Text></View>
                <View style={st.schemeBtn}><Text style={st.schemeTxt}>Habilidades</Text></View>
                <View style={st.schemeBtn}><Text style={st.schemeTxt}>Objetos</Text></View>
              </View>
              <View style={st.schemeBtns}>
                <View style={st.schemeBtn}><Text style={st.schemeTxt}>Esquivar</Text></View>
                <View style={st.schemeBtn}><Num n={5} /><Text style={st.schemeTxt}>Terminar</Text></View>
              </View>
            </View>
            {ZONAS_COMBATE.map((h, i) => (
              <View key={h.title} style={st.helpRow}>
                <Num n={i + 1} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={st.stripTitle}>{h.title}</Text>
                  <Text style={st.stripTxt}>{h.text}</Text>
                </View>
              </View>
            ))}
            <Text style={st.helpSub}>Gestos</Text>
            {GESTOS_COMBATE.map((h, i) => (
              <View key={h.title} style={st.helpRow}>
                <Icon path={[mdiGestureTap, mdiGestureTap, mdiCardsOutline][i]} size={26} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={st.stripTitle}>{h.title}</Text>
                  <Text style={st.stripTxt}>{h.text}</Text>
                </View>
              </View>
            ))}
            <Text style={st.helpSub}>Reglas</Text>
            {AYUDA_COMBATE.map(h => (
              <View key={h.title} style={{ marginBottom: 10 }}>
                <Text style={st.stripTitle}>{h.title}</Text>
                <Text style={st.stripTxt}>{h.text}</Text>
              </View>
            ))}
          </ScrollView>
          <Btn label="Cerrar" onPress={onClose} style={{ marginTop: 8 }} />
        </View>
      </View>
    </Modal>
  );
}

/** Pantalla de entrada al combate: título animado, enemigos y tirada de iniciativa de cada uno. */
function EncounterIntro({ cb, onDone }: { cb: ReturnType<typeof useStore.getState>['combat'] & object; onDone: () => void }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(v, { toValue: 1, duration: 700, easing: Easing.out(Easing.back(1.6)), useNativeDriver: true }).start(); }, [v]);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [2.4, 1] });
  const order = cb.order.map(k => cb.units.find(u => u.key === k)!).filter(u => !u.dead);
  const foes = cb.units.filter(u => u.side === 'enemy');
  const kinds = new Map<string, number>();
  for (const f of foes) { const n = MONSTERS[f.mon!].name; kinds.set(n, (kinds.get(n) ?? 0) + 1); }
  return (
    <View style={st.introBg}>
      <Animated.Text style={[st.introTitle, { opacity: v, transform: [{ scale }] }]}>¡Combate!</Animated.Text>
      <FadeIn delay={500}><Text style={st.introSub}>{foes.length === 1 ? foes[0].name : `${foes.length} enemigos: ${[...kinds].map(([n, k]) => `${k} × ${n}`).join(', ')}`}</Text></FadeIn>
      {cb.goal ? (
        <FadeIn delay={700} style={{ width: '86%', marginBottom: 10 }}>
          <View style={st.goalIntro}>
            <Icon path={mdiBullseyeArrow} size={22} color={C.goldHi} />
            <Text style={st.goalIntroTxt}>Objetivo opcional: {cb.goal.g.text}</Text>
          </View>
        </FadeIn>
      ) : null}
      <FadeIn delay={900} style={{ width: '86%' }}>
        <Panel>
          <Text style={st.initTitle}>Iniciativa</Text>
          {order.map((u, i) => {
            const total = Math.floor(u.init);
            const d = u.initD20 ?? total;
            const mod = total - d;
            return (
              <View key={u.key} style={st.initRow}>
                <MiniDie value={d} delay={900 + i * 250} size={34} plain color={u.side === 'enemy' ? '#e8796b' : C.goldHi} />
                <Text style={[st.initName, u.side === 'enemy' && { color: '#e8796b' }]}>{i + 1}. {u.name}</Text>
                <Text style={st.initVal}>{mod >= 0 ? '+' : '−'} {Math.abs(mod)} = {total}</Text>
              </View>
            );
          })}
          <Btn primary label="¡A luchar!" onPress={onDone} style={{ marginTop: 10 }} />
        </Panel>
      </FadeIn>
    </View>
  );
}

/**
 * Cartel de ronda (estilo cartas digitales): la franja se abre desde el centro, el texto entra rápido por la
 * izquierda, frena con un rebote, un destello lo recorre y sale acelerando por la derecha. No bloquea los toques.
 */
function RoundBanner({ round, text, delay = 0, hold = 0, onEnd }: { round?: number; text?: string; delay?: number; hold?: number; onEnd?: () => void }) {
  const { width } = useWindowDimensions();
  const band = useRef(new Animated.Value(0)).current;
  const x = useRef(new Animated.Value(-width)).current;
  const shine = useRef(new Animated.Value(0)).current;
  const [on, setOn] = useState(true);
  useEffect(() => {
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.timing(band, { toValue: 1, duration: 100, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(x, { toValue: 0, friction: 9, tension: 180, useNativeDriver: true }),
      Animated.timing(shine, { toValue: 1, duration: 200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.delay(hold),
      Animated.timing(x, { toValue: width, duration: 160, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(band, { toValue: 0, duration: 100, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]);
    anim.start(() => { setOn(false); onEnd?.(); });
    // Por si Android no llega a terminar la animación: el cartel nunca bloquea el combate más de la cuenta.
    const t = setTimeout(() => { setOn(false); onEnd?.(); }, delay + hold + 1200);
    return () => { anim.stop(); clearTimeout(t); };
  }, [band, x, shine, width]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!on) return null;
  return (
    <View pointerEvents="none" style={[st.bannerWrap, text ? { height: 96 } : null]}>
      <Animated.View style={[st.band, { transform: [{ scaleX: band }] }]} />
      <Animated.View style={{ transform: [{ translateX: x }], alignItems: 'center', paddingHorizontal: 16 }}>
        {text ? <Text style={st.endTxt} numberOfLines={2} adjustsFontSizeToFit>{text}</Text> : <Text style={st.bannerTxt}>ASALTO {round}</Text>}
      </Animated.View>
    </View>
  );
}

// Lo que se ve el cartel del final del combate antes de la ventana de victoria o derrota.
const END_MS = 1500;
// Lo que tarda un ataque en llegar: el golpe y su efecto en la carta se ven justo entonces.
const IMPACT = 300;
const SPELL_COLOR: Partial<Record<DmgType, string>> = { fuego: '#ff8a3d', 'frío': '#8fd8ff', radiante: '#ffe08a', fuerza: '#c49bff', necrótico: '#9ad17a', 'trueno': '#d0e4ff' };

/** Flecha o destello mágico que viaja de una carta a otra. */
function Projectile({ x, y, dx, dy, kind, color, t }: { x: number; y: number; dx: number; dy: number; kind: 'arrow' | 'magic'; color: string; t: Animated.Value }) {
  const S = 56;
  const angle = `${(Math.atan2(dy, dx) * 180) / Math.PI}deg`;
  const tx = t.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
  const ty = t.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });
  const scale = kind === 'magic' ? t.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] }) : 1;
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: x - S / 2, top: y - S / 2, width: S, height: S, transform: [{ translateX: tx }, { translateY: ty }, { rotate: angle }, { scale }] }}>
      <Svg width={S} height={S} viewBox="0 0 36 36">
        {kind === 'arrow' ? (
          <>
            <Line x1="2" y1="18" x2="30" y2="18" stroke="#d9c7a0" strokeWidth="2" />
            <Path d="M34 18 L27 14 L27 22 Z" fill="#cfd3d6" />
            <Path d="M2 18 L7 13 M2 18 L7 23" stroke="#e8dcc8" strokeWidth="2" />
          </>
        ) : (
          <>
            <Circle cx="18" cy="18" r="14" fill={color} opacity={0.25} />
            <Circle cx="18" cy="18" r="9" fill={color} opacity={0.55} />
            <Circle cx="20" cy="18" r="5" fill="#fff" />
          </>
        )}
      </Svg>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  turns: { height: GEAR_H, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 6 },
  turnsRound: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 11, textAlign: 'center', marginRight: 4, lineHeight: 13 },
  helpBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 16 },
  helpPanel: { flex: 1, backgroundColor: C.panel, borderColor: C.gold, borderWidth: 1, borderRadius: 8, padding: 14 },
  helpSub: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 17, marginTop: 6, marginBottom: 8, borderBottomWidth: 1, borderColor: C.border, paddingBottom: 2 },
  helpRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  num: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.goldHi, alignItems: 'center', justifyContent: 'center' },
  numTxt: { fontFamily: F.titleBold, color: '#1a130b', fontSize: 13 },
  scheme: { backgroundColor: '#0008', borderRadius: 8, padding: 8, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  schemeRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginVertical: 4 },
  miniCard: { width: 38, height: 54, borderRadius: 4, borderWidth: 2, borderColor: C.border, backgroundColor: '#2a2119', alignItems: 'center', justifyContent: 'center' },
  schemeLog: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#000a', borderRadius: 4, padding: 4, marginVertical: 2 },
  schemeTxt: { fontFamily: F.text, color: C.text, fontSize: 13, flex: 1, marginLeft: 4 },
  schemeBtns: { flexDirection: 'row', gap: 4, marginTop: 6 },
  schemeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.gold, borderRadius: 4, padding: 4 },
  helpTitle: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 20, textAlign: 'center', marginBottom: 10 },
  introBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.78)', alignItems: 'center', justifyContent: 'center' },
  introTitle: { fontFamily: F.titleBold, color: C.damage, fontSize: 46, letterSpacing: 3, textShadowColor: '#000', textShadowRadius: 12 },
  introSub: { fontFamily: F.italic, color: C.text, fontSize: 18, textAlign: 'center', marginTop: 4, marginBottom: 16, paddingHorizontal: 20 },
  initTitle: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 16, textAlign: 'center', marginBottom: 6 },
  initRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3, borderBottomWidth: 1, borderColor: '#ffffff12' },
  initName: { fontFamily: F.textBold, color: C.text, fontSize: 16, flex: 1, marginLeft: 8 },
  initVal: { fontFamily: F.text, color: C.textDim, fontSize: 16 },
  btn: { width: '31.5%' },
  fixedRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 2, marginTop: 2, gap: 2 },
  fixedBtn: { width: '49%', flexGrow: 0, flexShrink: 0, minWidth: 0, marginHorizontal: 0, marginVertical: 0 },
  devControl: { alignSelf: 'flex-end', paddingHorizontal: 8, minHeight: 24, justifyContent: 'center' },
  devText: { fontFamily: F.titleBold, fontSize: 11, color: C.textDim },
  hint: { width: '100%', fontFamily: F.italic, color: C.textDim, fontSize: 11, textAlign: 'center', marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 1 },
  rowLabel: { position: 'absolute', left: 6, top: 0, fontFamily: F.titleBold, color: C.text, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', textShadowColor: '#000', textShadowRadius: 4 },
  rowBand: { borderRadius: 6, borderWidth: 1, borderColor: 'rgba(201,162,92,0.25)', backgroundColor: 'rgba(0,0,0,0.18)' },
  rowEnemy: { borderColor: 'rgba(181,72,58,0.35)' },
  emptyRow: { height: EMPTY_ROW, paddingTop: 0, marginVertical: 2, alignItems: 'center', justifyContent: 'center' },
  emptyRowTxt: { fontFamily: F.titleBold, color: C.textDim, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  fleeBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, borderWidth: 1, borderColor: C.border, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 4, marginLeft: 4 },
  fleeTxt: { fontFamily: F.titleBold, color: C.text, fontSize: 11 },
  confirmBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center' },
  budget: { flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 8 },
  budgetItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  budgetTxt: { fontFamily: F.textBold, color: C.text, fontSize: 11 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 4, paddingHorizontal: 2, paddingVertical: 2 },
  gridBtn: { width: '49.4%', flexGrow: 0, flexShrink: 0, minWidth: 0, marginHorizontal: 0, marginVertical: 0 },
  log: { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: 6, marginVertical: 4 },
  goal: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  goalTxt: { flex: 1, fontFamily: F.textBold, color: C.goldHi, fontSize: 13, lineHeight: 16 },
  goalIntro: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#000a', borderColor: C.gold, borderWidth: 1, borderRadius: 6, padding: 8 },
  goalIntroTxt: { flex: 1, fontFamily: F.textBold, color: C.goldHi, fontSize: 15, lineHeight: 19 },
  round: { fontFamily: F.titleBold, color: C.gold, fontSize: 12 },
  logLine: { fontFamily: F.text, color: C.text, fontSize: 14, lineHeight: 17 },
  actions: { backgroundColor: 'rgba(10,9,7,0.92)', paddingTop: 6, paddingHorizontal: 6, borderTopWidth: 1, borderColor: C.border },
  btns: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  actionFamily: { borderWidth: 1, borderColor: '#6e5431', borderRadius: 3, padding: 2, marginBottom: 2 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, rowGap: 2, marginBottom: 2 },
  categoryOrnate: { width: '49%', flexGrow: 0, flexShrink: 0, minWidth: 0, marginHorizontal: 0, marginVertical: 0 },
  scrollerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 0, borderTopWidth: 1, borderColor: '#5f4a2d', paddingTop: 2 },
  arrowSlot: { width: 20, alignItems: 'center', justifyContent: 'center' },
  scrollArrow: { color: C.goldHi, fontSize: 26, fontWeight: 'bold' },
  categoryButton: { flexGrow: 1, flexBasis: '46%', minHeight: 40, paddingHorizontal: 6, flexDirection: 'row', gap: 6, borderWidth: 1, borderColor: C.border, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(75,55,32,0.85)' },
  categorySelected: { borderColor: C.goldHi, backgroundColor: 'rgba(110,80,35,0.45)' },
  categoryText: { fontFamily: F.textBold, color: C.text, fontSize: 12, textAlign: 'center' },
  categorySingle: { backgroundColor: 'rgba(50,39,24,0.92)', borderColor: C.gold },
  actionScroller: { maxHeight: 48, flex: 1 },
  actionChoices: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 2 },
  wait: { fontFamily: F.italic, color: C.textDim, fontSize: 16, textAlign: 'center', paddingVertical: 14 },
  strip: { position: 'absolute', left: 6, right: 6, backgroundColor: 'rgba(18,15,12,0.98)', borderColor: C.gold, borderWidth: 1, borderRadius: 6, padding: 10 },
  stripTitle: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 20 },
  stripCost: { fontFamily: F.text, color: C.textDim, fontSize: 14 },
  stripTxt: { fontFamily: F.text, color: C.text, fontSize: 15, lineHeight: 19, marginTop: 2 },
  stripAsk: { fontFamily: F.italic, color: C.goldHi, fontSize: 15, marginTop: 4 },
  stripOff: { fontFamily: F.textBold, color: '#e8796b', fontSize: 15, marginTop: 4 },
  stripBtns: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 6, marginTop: 6 },
  stripClose: { minHeight: 40, paddingHorizontal: 14, justifyContent: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 6 },
  stripCloseTxt: { fontFamily: F.titleBold, color: C.text, fontSize: 13 },
  bannerWrap: { position: 'absolute', left: 0, right: 0, top: '38%', height: 74, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  band: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.72)', borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.gold },
  endTxt: { fontFamily: F.titleBold, color: '#fff', fontSize: 26, textAlign: 'center', textShadowColor: '#000', textShadowRadius: 8 },
  bannerTxt: { fontFamily: F.titleBold, color: '#fff', fontSize: 40, letterSpacing: 6, textShadowColor: '#000', textShadowRadius: 8 },
  shine: { position: 'absolute', top: 4, bottom: 4, width: 26, backgroundColor: 'rgba(255,240,200,0.45)' },
});

