import { pace } from '../ui/ritmos';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useEscritorio } from '../ui/escritorio';
import { useTeclas } from '../ui/teclado';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IMG } from '../assets';
import { C, F } from '../theme';
import { foeList } from '../ui/anuncio';
import { useStore } from '../store';
import { Action, MASTERY_NAME, Unit, actionsFor, autoTurn, current, hasUseful, masteryOf, preview, targetsFor } from '../engine/combat';
import { Card, CardInfo, CardModal, resetFx, slotsOf } from '../ui/Card';
import { statesOf } from '../ui/estados';
import { ADVS, TOWNS, advOf } from '../engine/aventuras';
import { LogModal } from '../ui/LogModal';
import { Bg, Btn } from '../ui/kit';
import { FaceImage } from '../ui/FaceImage';
import { fxFull } from '../ui/movimiento';
import { getDevOpt, getFlag, markAction, seenAction } from '../storage';
import { D20, FadeIn, Message, MiniDie, revealMs, rollMs } from '../ui/Overlays';
import { CLASSES, DmgType, ITEMS } from '../data/srd';
import { setEndOpen } from '../sonido';
import { Settings } from '../ui/Settings';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { Icon, Panel } from '../ui/kit';
import { mdiAutoFix, mdiBowArrow, mdiBullseyeArrow, mdiCardsOutline, mdiCogOutline, mdiFire, mdiGestureTap, mdiInformationOutline, mdiShieldSword, mdiSword, mdiCircle, mdiRhombus, mdiSwapVertical, mdiLightningBolt, mdiRun, mdiScriptTextOutline, mdiSwordCross, mdiCreation, mdiSack, mdiChevronDown, mdiChevronUp } from '@mdi/js';
import { CombatGroup, groupOf, menuActionsFor, quickAttack } from '../ui/combatMenu';
import { slotsLeft } from '../engine/rules';
import { ACTION_HELP as DESC, MASTERY_HELP } from '../data/actionHelp';
import { AYUDA_COMBATE, GESTOS_COMBATE, ZONAS_COMBATE } from '../data/ayuda';
import { BASIC, TUTO_IDS, TutoTarget, tutoKey, tutoStep } from '../ui/tutorial';

const COST: Record<Action['cost'], string> = { action: 'Acción', bonus: 'Acción adicional', move: 'Movimiento', free: 'Sin acción' };
/** El mismo símbolo en el indicador del turno y en cada botón: qué gasta. */
const COST_ICON: Record<Action['cost'], string> = { action: mdiCircle, bonus: mdiRhombus, move: mdiSwapVertical, free: mdiLightningBolt };
/** Lo que se gasta en cada turno, con el nombre que acompaña a su símbolo en la cabecera del registro. */
export const BUDGET = [['action', 'Acción'], ['bonus', 'Acción adicional'], ['move', 'Movimiento']] as const;
const CATEGORY_HELP: Record<string, string> = {
  attack: 'Armas y ataques. Cada opción indica su coste y su tirada. Tocar directamente un enemigo le ataca con un arma que le alcance; mantén pulsada su carta para ver su ficha sin atacar.',
  skills: 'Rasgos y conjuros disponibles. Con un único objetivo se usan al tocarlos; con varios, eliges la carta. Mantén pulsado un botón para leer qué hace sin usarlo.',
  items: 'Objetos consumibles del personaje. Con un único objetivo se usan al tocarlos; con varios, eliges la carta. Mantén pulsado un botón para leer qué hace sin gastarlo.',
};
type TipPart = { h?: string; t: string };
type Tip = { title: string; text: string; parts?: TipPart[]; odds?: { title: string; rows: { name: string; pct: number; why: string }[] }; a?: Action };
/** Parte un texto de reglas en frases, una por línea, para leerlo mejor en el móvil. */
const bullets = (t: string) => t.split(/\.\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/).map((x, i, a) => (i < a.length - 1 ? `${x}.` : x)).filter(Boolean);
const CATEGORIES = [['attack', 'Atacar'], ['skills', 'Habilidades'], ['items', 'Objetos']] as const;

/** Alto de la franja de arriba con el engranaje de Ajustes. */
const GEAR_H = 44;
/** Alto de una fila vacía del grupo (se ve para poder tocarla y moverse allí). */
const EMPTY_ROW = 28;

export function Combat() {
  const { game, combat, act, endTurn, enemyStep, closeCombat, devWin, reroll, edit } = useStore();
  const g = game!;
  const cb = combat!;
  const ins = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  // Escritorio (web apaisada ancha): tablero ancho arriba y botones abajo en la columna central.
  const esc = useEscritorio();
  const landscape = width >= 700 && width > height && !esc.on;
  // En escritorio los botones van en tres columnas para que quepan más sin desplazar.
  // En escritorio, los botones de abajo miden lo mismo que las cajas del campo (tablero menos su margen de 6 px por lado).
  const deskBoard = Math.min(width, Math.max(esc.col, height * 1.25));
  const controlsWidth = esc.on ? deskBoard - 12 : landscape ? Math.min(420, width * 0.48) : width;
  const boardWidth = esc.on ? deskBoard : landscape ? width - controlsWidth : width;
  const lastCommit = useRef(0);
  // Acción seleccionada: el primer toque la explica (y marca objetivos); el segundo, o tocar un objetivo, la ejecuta.
  const [sel, setSel] = useState<Action>();
  const [actionGroup, setActionGroup] = useState<CombatGroup>('attack');
  // Última categoría abierta por cada personaje.
  const lastGroup = useRef<Record<string, CombatGroup>>({});
  const [askFlee, setAskFlee] = useState(false);
  const [askEnd, setAskEnd] = useState(false);
  const [sheet, setSheet] = useState<Unit>();
  const [help, setHelp] = useState(false);
  const [showLog, setShowLog] = useState(false);
  // Registro en dos líneas; se despliega con la flecha para leer más sin abrir el registro completo (el autor 2026-11-20).
  const [logOpen, setLogOpen] = useState(false);
  // Cuadro de explicación superpuesto a los botones (pulsación prolongada, como en las primeras versiones).
  const [tip, setTip] = useState<Tip>();
  const [targetFeedback, setTargetFeedback] = useState<string>();
  // Ajustes encima del combate: mientras están abiertos, el combate se para (el autor 2026-11-05).
  const [opts, setOpts] = useState(false);
  // Enemigos derrotados cuya carta ya se ha roto y desaparecido.
  const [gone, setGone] = useState<string[]>([]);
  // Carta que parpadea al tocar su cara en la barra de turnos (para distinguir enemigos iguales).
  const [flash, setFlash] = useState<{ key: string; n: number }>();
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(f => (f?.n === flash.n ? undefined : f)), 1600);
    return () => clearTimeout(t);
  }, [flash]);
  const me = current(cb);
  const auto = !cb.result && autoTurn(cb);
  // Presentación del encuentro con la iniciativa; nadie actúa hasta cerrarla.
  const [ready, setReady] = useState(false);
  // Tutorial del campo de batalla: lo visto se guarda en la partida (una vez por partida, el autor 2026-11-19).
  const tutoSeen = (k: string) => !!g.guide?.includes(k);
  const tutoMark = (ids: string[]) => edit(gg => { gg.guide = [...new Set([...(gg.guide ?? []), ...ids.map(tutoKey)])]; });
  const tuto = ready && !auto && !cb.result ? tutoStep(g, cb, me, tutoSeen) : undefined;
  const lit = (t: TutoTarget) => (tuto?.target === t ? st.tutoLit : undefined);
  const tutoNext = () => tutoMark(tuto ? [tuto.id] : []);
  // Omitir el tutorial (con confirmación): no vuelve a salir ningún paso ni aviso en esta partida.
  const [askSkip, setAskSkip] = useState(false);
  // Atacar se da por aprendido en cuanto se usa la acción.
  useEffect(() => { if (cb.acted && !tutoSeen(tutoKey('atacar'))) tutoMark(['atacar']); }, [cb.acted]); // eslint-disable-line react-hooks/exhaustive-deps
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
  // Peso de la embestida: la carta se encoge al tomar impulso y se ensancha al golpear.
  const punch = useRef(new Animated.Value(1)).current;
  // Ataques fallados: el objetivo no recibe efecto. Se compara con el último efecto visto de cada carta.
  const fxSeen = useRef<Record<string, number | undefined>>(Object.fromEntries(Object.entries(cb.fx ?? {}).map(([k, v]) => [k, v.id])));
  const [misses, setMisses] = useState<Record<string, number>>({});
  const rot = tilt.interpolate({ inputRange: [-1, 1], outputRange: ['-18deg', '18deg'] });
  const [lungeKey, setLungeKey] = useState<string>();
  const [shot, setShot] = useState<{ x: number; y: number; dx: number; dy: number; kind: 'arrow' | 'magic'; color: string }>();
  // Cada ataque se anima una sola vez: al volver a montar la pantalla no se repite el último (el autor 2026-11-10).
  const playedSwing = useRef(cb.swing?.id);
  // Orden de cada ataque: primero se ve el resultado del dado, luego la embestida y al final baja la vida.
  // Se calcula al pintar (no en un efecto) para que las cartas reciban ya la espera de esta tirada.
  const reveal = useRef<{ id?: number; at: number }>({ at: 0 });
  if (cb.roll && reveal.current.id !== cb.roll.id) reveal.current = { id: cb.roll.id, at: Date.now() + revealMs(cb.roll) };
  const revealLeft = () => Math.max(0, reveal.current.at - Date.now());
  const fxWait = IMPACT + revealLeft();
  // Las líneas nuevas del registro salen cuando se ve el dado, no antes («¡Impacto!» con el d20 aún girando).
  const [logN, setLogN] = useState(cb.log.length);
  useEffect(() => {
    if (cb.log.length <= logN) { setLogN(cb.log.length); return; }
    const t = setTimeout(() => setLogN(cb.log.length), revealLeft());
    return () => clearTimeout(t);
  }, [cb.log.length]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const sw = cb.swing;
    if (!sw || playedSwing.current === sw.id) return;
    playedSwing.current = sw.id;
    const t = setTimeout(() => playSwing(sw), revealLeft());
    return () => clearTimeout(t);
  }, [cb.swing?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  function playSwing(sw: NonNullable<typeof cb.swing>) {
    const a = cardRefs.current[sw.from], b = cardRefs.current[sw.to], root = rootRef.current;
    if (!a || !b || !root) return;
    if (cb.fx?.[sw.to]?.id === fxSeen.current[sw.to] && cb.log.slice(-3).some(l => l.c === 'miss')) setMisses(m => ({ ...m, [sw.to]: sw.id }));
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
          Animated.sequence([
            Animated.timing(punch, { toValue: fxFull() ? 0.95 : 1, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(punch, { toValue: fxFull() ? 1.07 : 1, duration: IMPACT - 120, easing: Easing.in(Easing.quad), useNativeDriver: true }),
            Animated.timing(punch, { toValue: 1, duration: 220, easing: Easing.out(Easing.back(1.6)), useNativeDriver: true }),
          ]),
        ]).start(() => setLungeKey(undefined));
      } else {
        setShot({ x: ax + aw / 2 - rx, y: ay + ah / 2 - ry, dx, dy, kind: sw.kind, color: SPELL_COLOR[sw.type] ?? '#b48cff' });
        fly.setValue(0);
        Animated.timing(fly, { toValue: 1, duration: IMPACT, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => setShot(undefined));
      }
    })));
  }
  useEffect(() => { fxSeen.current = Object.fromEntries(Object.entries(cb.fx ?? {}).map(([k, v]) => [k, v.id])); }, [cb.fxId]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const paused = busy || !!banner || !!sel || !!tip || askFlee || askEnd;

  useEffect(() => {
    if (!auto || !ready || paused) return;
    // Ritmo ágil (Ajustes): los enemigos no esperan a que se vaya el dado, solo a que se lea.
    const fast = !getFlag('pausado');
    const t = setTimeout(enemyStep, fast ? Math.max(Math.min(rollLeft(), pace(700)), pace(me.side === 'enemy' ? 650 : 400)) : Math.max(rollLeft(), pace(me.side === 'enemy' ? 1400 : 700)));
    return () => clearTimeout(t);
  }, [auto, ready, paused, cb, enemyStep, me.side]);

  // Al acabar: se espera a la última tirada, sale un cartel con lo último que pasó y luego la ventana del final.
  const [endBanner, setEndBanner] = useState<{ text: string; delay: number }>();
  useEffect(() => {
    if (!cb.result) { setEndShown(false); setEndBanner(undefined); return; }
    const delay = rollLeft();
    if (cb.endLine) setEndBanner({ text: cb.endLine, delay });
    const t = setTimeout(() => setEndShown(true), delay + pace(cb.endLine ? END_MS : 300));
    return () => clearTimeout(t);
  }, [cb.result]); // eslint-disable-line react-hooks/exhaustive-deps
  // La música de victoria o derrota empieza con el cuadro, no con el golpe final.
  useEffect(() => { setEndOpen(endShown); return () => setEndOpen(false); }, [endShown]);

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
  // Ataque fallado que se puede repetir con Inspiración heroica: decide el jugador.
  const rerollAsk = !auto && !cb.result && ready && cb.reroll ? cb.reroll : undefined;
  const idle = ready && !paused && !rerollAsk && !auto && !cb.result && !sel && !tip && !askFlee && !hasUseful(g, cb) && (!rowAct || !!rowAct.off);
  useEffect(() => {
    if (!idle) return;
    const t = setTimeout(endTurn, pace(1100));
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
  const finishTurn = (sure = false) => {
    if (busy || Date.now() - lastCommit.current < 300) return;
    const live = useStore.getState().combat;
    if (!live || live.result || autoTurn(live) || live.turn !== cb.turn || live.round !== cb.round || current(live).key !== me.key) return;
    // Sin haber gastado nada del turno y con algo útil por hacer, seguramente es un error: se pregunta (el autor 2026-11-20).
    if (!sure && !live.acted && !live.bonus && !live.moved && hasUseful(g, live)) { close(); return setAskEnd(true); }
    setAskEnd(false);
    lastCommit.current = Date.now();
    close();
    endTurn();
  };
  // Probabilidad aproximada contra cada objetivo, con las mismas reglas que la tirada (no la cambia).
  // Va arriba del cuadro y destacada (el autor 2026-11-19).
  const odds = (a: Action): Tip['odds'] => {
    if (a.off || (a.target !== 'enemy' && a.target !== 'enemy-melee')) return undefined;
    const rows = targetsFor(cb, a).map(t => ({ t, p: preview(g, cb, a, t) })).filter(x => x.p);
    if (!rows.length) return undefined;
    const title = rows[0].p!.save ? 'Probabilidad de que falle la salvación' : 'Probabilidad aproximada de impactar';
    return { title, rows: rows.map(({ t, p }) => ({ name: t.name, pct: p!.pct, why: p!.why.join('; ') })) };
  };
  // Ventaja o desventaja contra todos los objetivos posibles: se avisa en el botón (el autor 2026-11-25).
  const advTag = (a: Action): { adv: number; melee: boolean } => {
    if (a.off || (a.target !== 'enemy' && a.target !== 'enemy-melee')) return { adv: 0, melee: false };
    const ps = targetsFor(cb, a).map(t => preview(g, cb, a, t)).filter((p): p is NonNullable<typeof p> => !!p && !p.save);
    if (!ps.length) return { adv: 0, melee: false };
    const adv = ps.every(p => p.adv < 0) ? -1 : ps.every(p => p.adv > 0) ? 1 : 0;
    return { adv, melee: adv < 0 && ps.every(p => p.why.some(w => w.includes('cuerpo a cuerpo'))) };
  };
  const explain = (a: Action) => { setSel(undefined); setTip({ title: a.label.toLocaleUpperCase('es-ES'), text: '', parts: descOf(a), odds: odds(a), a }); };
  // Imagen del objeto del que depende la acción (arma, poción, arrojadizo, varita o pergamino).
  const imgOf = (a: Action) => {
    const [k, arg] = a.id.split(':');
    const id = k === 'atk' ? arg : g.party.flatMap(c => c.items).find(i => i.uid === arg)?.id;
    return id && ITEMS[id]?.img ? IMG[ITEMS[id].img] : undefined;
  };
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
    // La primera vez que se dispara con un enemigo encima, se explica por qué va con desventaja.
    if (advTag(a).melee && !seenAction('desventaja_cac')) {
      markAction('desventaja_cac');
      setSel(undefined);
      return setTip({ title: a.label.toLocaleUpperCase('es-ES'), text: 'Disparar con un enemigo en vuestra vanguardia da desventaja: se tiran dos d20 y se queda el peor. Retrocede a la retaguardia o usa un arma cuerpo a cuerpo.', parts: descOf(a), odds: odds(a), a });
    }
    const ts = targetsFor(cb, a);
    if (ts.length === 1) return go(a, ts[0].key); // Con varios, elige el jugador aunque tengan los mismos PG (el autor 2026-11-20).
    if (sel?.id === a.id) return close();
    setTip(undefined);
    setSel(a);
  };
  // Web: 1-9 usan las acciones de la categoría abierta (como tocarlas) y Esc cancela la acción elegida.
  useTeclas(key => {
    if (key === 'Escape') { close(); return; }
    const n = Number(key);
    if (!ready || auto || cb.result || !n) return;
    const a = grouped[n - 1];
    if (a) choose(a);
  });
  const showCategory = (id: string) => { setSel(undefined); setTip({ title: (CATEGORIES.find(c => c[0] === id)?.[1] ?? '').toLocaleUpperCase('es-ES'), text: CATEGORY_HELP[id] }); };
  const useTip = () => {
    const a = tip?.a;
    if (!a || a.off) return;
    if (a.target === 'none') return go(a);
    const ts = targetsFor(cb, a);
    if (ts.length === 1) return go(a, ts[0].key);
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
  // Por apartados (arma, ataque, maestría…) para que no sea un solo párrafo (el autor 2026-11-19).
  const descOf = (a: Action): TipPart[] => {
    const [k, arg] = a.id.split(':');
    const it = ['potion', 'throw', 'web', 'wand', 'scroll'].includes(k) ? g.party.flatMap(c => c.items).find(i => i.uid === arg) : undefined;
    const mastery = k === 'atk' && meChar ? masteryOf(meChar, arg) : undefined;
    const parts: TipPart[] = k === 'atk'
      ? [{ h: ITEMS[arg]?.name ?? 'Arma', t: ITEMS[arg]?.desc ?? '' }, { h: 'Ataque', t: DESC.atk }, ...(mastery ? [{ h: `Maestría: ${MASTERY_NAME[mastery]}`, t: `${MASTERY_HELP[mastery]} ${MASTERY_HELP.all}` }] : [])]
      : it ? [{ h: ITEMS[it.id].name, t: ITEMS[it.id].desc }, { h: 'Uso', t: DESC[k] ?? '' }] : [{ t: DESC[k] ?? '' }];
    return parts.filter(p => p.t);
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

  // Lo que queda del turno, con los mismos símbolos que llevan los botones y su nombre al lado, en una línea propia.
  const budget = !auto && !cb.result && me.side === 'party' ? (
    <View testID="combat-budget" style={[st.budget, lit('budget')]}>
      {BUDGET.map(([k, label]) => {
        const used = { action: cb.acted, bonus: cb.bonus, move: cb.moved }[k];
        return (
          <View key={k} style={[st.budgetItem, used && { opacity: 0.35 }]} accessible accessibilityLabel={`${label}: ${used ? 'gastada' : 'disponible'}`}>
            <Icon path={COST_ICON[k]} size={12} color={used ? C.textDim : C.goldHi} />
            <Text style={[st.budgetTxt, used && { textDecorationLine: 'line-through' }]}>{label}</Text>
            <Text testID={`budget-${k}`} style={st.budgetTxt}>{used ? '0' : '1'}</Text>
          </View>
        );
      })}
      {slots !== undefined ? <Text style={st.budgetTxt} accessibilityLabel={`Espacios de conjuro: ${slots}`}>{`Conjuros ${slots}`}</Text> : null}
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
      <View style={[st.row, st.rowBand, side === 'enemy' && st.rowEnemy, { minHeight: cardW * 1.5 + 2 }, lit(side === 'enemy' ? 'enemies' : 'partyRows')]}>
        <View pointerEvents="none" style={[st.rowLabelBox, { width: cardW * 1.5, left: 7 - cardW * 0.75, top: cardW * 0.75 - 6 }]}><Text numberOfLines={1} style={st.rowLabel}>{name}</Text></View>
        {us.map(u => {
          const isT = targets.includes(u.key);
          return (
            <Animated.View testID={`combat-unit-${u.key}`} key={u.key} ref={(r: View | null) => { cardRefs.current[u.key] = r; }} collapsable={false} style={{ marginHorizontal: 3, zIndex: lungeKey === u.key ? 5 : 0, transform: lungeKey === u.key ? [...lunge.getTranslateTransform(), { rotate: rot }, { scale: punch }] : [] }}>
              {flash?.key === u.key ? <Blink key={flash.n} onActive={u.key === me.key && !cb.result} /> : null}
              <Card
                info={info(u)}
                minTouchSize={44}
                selecting={!!pending}
                tag={isT && pending && u.side === 'enemy' ? (() => { const p = preview(g, cb, pending, u); return p ? `${p.pct} %${p.adv > 0 ? ' ▲' : p.adv < 0 ? ' ▼' : ''}` : undefined; })() : undefined}
                interactionHint={!auto && u.side === 'enemy' ? 'Toca para atacar si hay un arma disponible que le alcance. Mantén pulsado para consultar la ficha sin atacar.' : 'Toca para consultar la ficha.'}
                width={cardW}
                active={u.key === me.key && !cb.result}
                target={isT && pending?.target !== 'ally'}
                help={isT && pending?.target === 'ally'}
                dim={u.dead || (!!pending && !pending.off && pending.target !== 'none' && !isT)}
                fx={cb.fx?.[u.key]}
                pop={cb.pops?.[u.key]}
                miss={misses[u.key]}
                boss={u.side === 'enemy' && u.mon === ADVS[advOf(g.zone)].boss}
                intent={intentOf(u)}
                fxKey={u.key}
                fxDelay={fxWait}
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
    <Bg src={IMG[cb.bg]} dim={0.45} full wash>
      <View style={{ flex: 1, flexDirection: landscape ? 'row' : 'column' }}>
      <View testID="combat-field" ref={rootRef} collapsable={false} style={[{ flex: 1, minHeight: 0, overflow: 'hidden', paddingTop: ins.top + 4, paddingHorizontal: 6 }, esc.on && { width: boardWidth, alignSelf: 'center' }]} onLayout={e => setArea(e.nativeEvent.layout.height - ins.top - 4)}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Orden de turnos arriba (maqueta aprobada por el autor 2026-11-06): asalto, retratos por iniciativa y engranaje. */}
        <View style={[st.turns, lit('turns')]}>
          <Text style={st.turnsRound}>{'Asalto\n'}{cb.round}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ alignItems: 'center', gap: 4, paddingHorizontal: 2 }}>
            {cb.order.map((k, i) => {
              const u = cb.units.find(x => x.key === k);
              if (!u) return null;
              const now = i === cb.turn, past = i < cb.turn, down = !!u.dead || u.hp <= 0;
              const sz = now ? 40 : 32;
              return (
                <Pressable key={k} onPress={() => setFlash(f => ({ key: k, n: (f?.n ?? 0) + 1 }))} accessibilityRole="button" accessibilityLabel={`Ver la carta de ${u.name}`} hitSlop={4}
                  style={{ width: sz, height: sz, borderRadius: sz / 2, overflow: 'hidden', borderWidth: now ? 3 : 2, backgroundColor: '#000',
                  borderColor: down ? '#555' : now ? C.goldHi : u.side === 'enemy' ? '#b5483a' : C.gold, opacity: down ? 0.35 : past ? 0.5 : 1 }}>
                  <FaceImage img={u.img} size={sz - (now ? 6 : 4)} />
                </Pressable>
              );
            })}
          </ScrollView>
          {fleeAct ? (
            <Pressable disabled={!ready} onPress={tryFlee} accessibilityRole="button" accessibilityLabel="HUIR" hitSlop={8} style={[st.fleeBtn, !!fleeAct.off && { opacity: 0.45 }, lit('flee')]}>
              <Icon path={mdiRun} size={16} color={C.text} />
              <Text style={st.fleeTxt}>HUIR</Text>
            </Pressable>
          ) : null}
          {!auto && !cb.result && getDevOpt('ganar') ? <Pressable accessibilityRole="button" accessibilityLabel="GANAR COMBATE" onPress={devWin} style={st.devControl}><Text style={st.devText}>GANAR COMBATE</Text></Pressable> : null}
          {/* En la web, los ajustes van en el menú único de arriba. */}
          {Platform.OS === 'web' ? null : (
            <Pressable onPress={() => setOpts(true)} accessibilityRole="button" accessibilityLabel="Ajustes" hitSlop={12} style={{ marginLeft: 4 }}>
              <Icon path={mdiCogOutline} size={22} />
            </Pressable>
          )}
        </View>
        {renderRow('enemy', 'back')}
        {renderRow('enemy', 'front')}
        <View style={[st.log, height < 700 && { paddingVertical: 3 }]} onLayout={e => setLogH(e.nativeEvent.layout.height)}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text accessibilityLiveRegion="polite" style={[st.round, { flex: 1 }, !!sel && { color: C.goldHi }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{!sel ? `Turno de ${me.name}`
              : `${sel.label}: ${targetFeedback ?? `toca ${sel.target === 'ally' ? 'un aliado' : 'un objetivo'}`}`}</Text>
            <Pressable onPress={() => setLogOpen(o => !o)} accessibilityRole="button" accessibilityLabel={logOpen ? 'Plegar el registro' : 'Desplegar el registro'} hitSlop={6} style={{ padding: 4 }}><Icon path={logOpen ? mdiChevronUp : mdiChevronDown} size={20} /></Pressable>
            <Pressable onPress={() => setShowLog(true)} accessibilityRole="button" accessibilityLabel="Registro del combate" style={{ padding: 4 }}><Icon path={mdiScriptTextOutline} size={20} /></Pressable>
            {sel && !tip ? <Pressable accessibilityRole="button" accessibilityLabel="CANCELAR ACCIÓN" onPress={close} hitSlop={8} style={{ padding: 5, minHeight: 28, justifyContent: 'center' }}><Text style={st.devText}>CANCELAR</Text></Pressable> : null}
            <Pressable onPress={() => setHelp(true)} accessibilityRole="button" accessibilityLabel="Cómo funciona el combate" hitSlop={12}>
              <Icon path={mdiInformationOutline} size={20} />
            </Pressable>
          </View>
          {!sel ? budget : null}
          {cb.goal ? (
            <View style={[st.goal, lit('goal')]}>
              <Icon path={mdiBullseyeArrow} size={16} color={cb.goal.status === 'ok' ? '#7fcf8f' : cb.goal.status === 'fail' ? C.textDim : C.goldHi} />
              <Text style={[st.goalTxt, cb.goal.status === 'ok' && { color: '#7fcf8f' }, cb.goal.status === 'fail' && { color: C.textDim, textDecorationLine: 'line-through' }]} numberOfLines={2}>
                {cb.goal.status === 'ok' ? '✓ ' : ''}{cb.goal.g.text}
              </Text>
            </View>
          ) : null}
          {/* Desliza para ver todo el registro del combate. En pantallas bajas, una línea menos cuando se ve lo que queda del turno. */}
          <ScrollView ref={logRef} style={{ height: logOpen ? 85 : (height < 700 || esc.on) && budget && !sel ? 17 : 34, flexGrow: 0, flexShrink: 0 }} nestedScrollEnabled onContentSizeChange={() => logRef.current?.scrollToEnd({ animated: true })}>
            {cb.log.slice(0, logN).map((l, i) => (
              <Text key={i} style={[st.logLine, l.c === 'dmg' && { color: '#e8796b' }, l.c === 'heal' && { color: '#7fcf8f' }, l.c === 'big' && { color: C.goldHi }, l.c === 'miss' && { color: C.textDim }]}>{l.t}</Text>
            ))}
          </ScrollView>
        </View>
        {renderRow('party', 'front')}
        {renderRow('party', 'back')}
        </ScrollView>
        {shot ? <Projectile {...shot} t={fly} /> : null}
        {tuto && !tip && !sel ? (
          <View testID="combat-tutorial" style={[st.tuto, ['turns', 'enemies', 'goal', 'flee', 'budget'].includes(tuto.target) ? { bottom: 6 } : { top: ins.top + GEAR_H + 8 }]}>
            <Text style={st.stripTitle}>{tuto.title}</Text>
            <Text style={st.stripTxt}>{tuto.text}</Text>
            <View style={st.stripBtns}>
              <Pressable accessibilityRole="button" accessibilityLabel="Omitir tutorial" onPress={() => setAskSkip(true)} style={st.stripClose}><Text style={st.stripCloseTxt}>OMITIR TUTORIAL</Text></Pressable>
              <Btn small primary label={tuto.basic && tuto.id !== BASIC[BASIC.length - 1].id ? 'Siguiente' : 'Entendido'} onPress={() => tutoNext()} style={{ flex: 1 }} />
            </View>
          </View>
        ) : null}
      </View>
      <View testID="combat-controls" style={[st.actions, esc.on && { alignSelf: 'center', borderWidth: 1, borderTopLeftRadius: 8, borderTopRightRadius: 8 }, { height: landscape ? height : esc.on ? 176 : 204 + ins.bottom, width: controlsWidth, flexGrow: 0, flexShrink: 0, paddingTop: landscape ? ins.top + 4 : 3, paddingBottom: ins.bottom + 3 }]}>
        {auto ? (
          <Text style={st.wait}>{me.side === 'enemy' ? `${me.name} actúa…` : me.paralyzed ? `${me.name} está paralizado y no puede actuar…` : `${me.name} no puede actuar…`}</Text>
        ) : !cb.result ? (
          <>
            {groups.length ? (
              <View testID="combat-categories" style={[st.categoryRow, lit('categories')]}>
                {CATEGORIES.filter(([id]) => groups.includes(id)).map(([id, label]) => (
                  <Btn key={id} small combatTone="parent" tight={groups.length > 2} disabled={!ready} icon={{attack:mdiSwordCross,skills:mdiCreation,items:mdiSack}[id]} onInfo={() => showCategory(id)} onLongPress={() => showCategory(id)}  primary={activeGroup === id} off={menu.filter(a => groupOf(a) === id).every(a => !!a.off)}
                    label={label.toLocaleUpperCase('es-ES')}
                    onPress={() => { lastGroup.current[me.key] = id; setActionGroup(id); close(); }}
                    style={{ ...st.categoryOrnate, ...(tuto?.target === 'items' && id === 'items' ? st.tutoLit : null) }} />
                ))}
              </View>
            ) : null}
            <ScrollView testID="combat-action-scroll" style={{ flex: 1 }} contentContainerStyle={[st.actionGrid, esc.on && { justifyContent: 'flex-start', columnGap: 4 }]} nestedScrollEnabled>
              {grouped.map(a => { const t = advTag(a); return <Btn key={a.id} small combatTone="child" icon={COST_ICON[a.cost]} badge={t.adv < 0 ? { text: 'DESVENTAJA', color: '#e0705f' } : t.adv > 0 ? { text: 'VENTAJA', color: '#7fcf8f' } : undefined} disabled={!ready} onInfo={() => choose(a, true)} onLongPress={() => choose(a, true)} primary={sel?.id === a.id || tip?.a?.id === a.id} label={a.label.toLocaleUpperCase('es-ES')} off={!!a.off} onPress={() => choose(a)} style={esc.on ? { ...st.gridBtn, width: Math.floor((controlsWidth - 28) / 3) } : st.gridBtn} />; })}
            </ScrollView>
            <View style={[st.fixedRow, lit('fixed')]}>
              {dodgeAct ? <Btn small combatTone="child" icon={COST_ICON[dodgeAct.cost]} disabled={!ready} onInfo={() => choose(dodgeAct, true)} onLongPress={() => choose(dodgeAct, true)} primary={tip?.a?.id === dodgeAct.id} label="ESQUIVAR" tight off={!!dodgeAct.off} onPress={() => choose(dodgeAct)} style={st.fixedBtn} /> : null}
              {rowAct ? <Btn small combatTone="child" icon={COST_ICON.move} disabled={!ready} label={rowAct.label.toLocaleUpperCase('es-ES')} tight off={!!rowAct.off} onInfo={() => choose(rowAct, true)} onLongPress={() => choose(rowAct, true)} onPress={() => rowAct.off ? choose(rowAct) : go(rowAct)} style={st.fixedBtn} /> : null}
              <Btn small combatTone="child" label="TERMINAR TURNO" tight disabled={!ready} onPress={() => finishTurn()} style={{ ...st.fixedBtn, ...(tuto?.target === 'end' ? st.tutoLit : null) }} />
            </View>

          </>
        ) : null}
        {/* Cuadro de explicación encima de los botones: no mueve ni encoge las cartas. */}
        {tip && !cb.result ? (
          <View testID="combat-tip" style={[st.strip, { bottom: ins.bottom + 4 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {tip.a && imgOf(tip.a) ? <Image source={imgOf(tip.a)!} style={st.stripImg} /> : null}
              <Text style={[st.stripTitle, { flex: 1 }]}>{tip.title}{tip.a ? <Text style={st.stripCost}>{[COST[tip.a.cost], tip.a.detail].filter(Boolean).map(x => `  ·  ${x}`).join('')}</Text> : null}</Text>
            </View>
            {tip.odds ? (
              <View testID="combat-odds" style={st.odds}>
                <Text style={st.oddsTitle}>{tip.odds.title}</Text>
                {tip.odds.rows.map((r, i) => (
                  <Text key={i} style={st.oddsRow}><Text style={st.oddsPct}>{r.pct} %</Text>  {r.name}{r.why ? <Text style={st.oddsWhy}>  ({r.why})</Text> : null}</Text>
                ))}
              </View>
            ) : null}
            <ScrollView style={{ maxHeight: tip.odds ? 110 : 150, flexGrow: 0 }} nestedScrollEnabled>
              {tip.a?.off ? <Text style={st.stripOff}>{tip.a.off}</Text> : null}
              {tip.text ? <Text style={st.stripTxt}>{tip.text}</Text> : null}
              {tip.parts?.map((p, i) => (
                <View key={i} style={{ marginTop: i ? 6 : 2 }}>
                  {p.h ? <Text style={st.stripHead}>{p.h}</Text> : null}
                  {bullets(p.t).map((l, j, all) => <Text key={j} style={st.stripTxt}>{all.length > 1 ? `•  ${l}` : l}</Text>)}
                </View>
              ))}
            </ScrollView>
            <View style={st.stripBtns}>
              {tip.a && !tip.a.off && !auto ? <Btn small primary label="Usar" onPress={useTip} style={{ flex: 1 }} /> : null}
              <Pressable accessibilityRole="button" accessibilityLabel="CANCELAR ACCIÓN" onPress={close} style={st.stripClose}><Text style={st.stripCloseTxt}>CERRAR</Text></Pressable>
            </View>
          </View>
        ) : null}
        {/* Inspiración heroica: tras fallar, el jugador decide si repite el dado (SRD 5.2.1). */}
        {rerollAsk && !tip ? (
          <View testID="combat-reroll" style={[st.strip, { bottom: ins.bottom + 4 }]}>
            <Text style={st.stripTitle}>INSPIRACIÓN HEROICA</Text>
            <Text style={st.stripTxt}>{`${me.name} ha fallado (${rerollAsk.total}). ¿Repites el dado? Te quedas con el nuevo resultado y la inspiración se gasta hasta la próxima aventura.`}</Text>
            <View style={st.stripBtns}>
              <Btn small primary label="Repetir dado" onPress={() => reroll(true)} style={{ flex: 1 }} />
              <Pressable accessibilityRole="button" accessibilityLabel="Conservar resultado" onPress={() => reroll(false)} style={st.stripClose}><Text style={st.stripCloseTxt}>CONSERVAR</Text></Pressable>
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
          celebrate={cb.result === 'win'}
          onDone={closeCombat}
        />
      ) : null}
      {banner && !cb.result ? <RoundBanner key={banner.round} round={banner.round} delay={banner.delay} onEnd={() => setBanner(b => (b?.round === banner.round ? undefined : b))} /> : null}
      {endBanner && !endShown ? <RoundBanner key="fin" text={endBanner.text} delay={endBanner.delay} hold={END_MS - 900} /> : null}
      {!ready ? <EncounterIntro cb={cb} onDone={() => setReady(true)} /> : null}
      {showLog ? <LogModal title="Registro del combate" lines={cb.log.map(line => line.t)} combat={cb.log} onClose={() => setShowLog(false)} /> : null}
      {help ? <CombatHelp onClose={() => setHelp(false)} /> : null}
      {opts ? <Settings onClose={() => setOpts(false)} /> : null}
      {askSkip && tuto ? (
        <View style={st.confirmBg}>
          <Panel style={{ width: '86%' }}>
            <Text style={st.initTitle}>¿Omitir el tutorial?</Text>
            <Text style={[st.stripTxt, { textAlign: 'center', marginBottom: 10 }]}>No volverá a salir en esta partida. Siempre podéis consultar «Cómo funciona el combate» en el botón de información.</Text>
            <Btn label="Seguir con el tutorial" primary onPress={() => setAskSkip(false)} />
            <Btn label="Omitir" danger onPress={() => { setAskSkip(false); tutoMark(TUTO_IDS); }} style={{ marginTop: 6 }} />
          </Panel>
        </View>
      ) : null}
      {askEnd && !cb.result && !auto ? (
        <View style={st.confirmBg}>
          <Panel style={{ width: '86%' }}>
            <Text style={st.initTitle}>¿Terminar el turno?</Text>
            <Text style={[st.stripTxt, { textAlign: 'center', marginBottom: 10 }]}>{`${me.name} aún no ha usado su acción, su acción adicional ni su movimiento.`}</Text>
            <Btn label="Seguir con el turno" primary onPress={() => setAskEnd(false)} />
            <Btn label="Terminar turno" danger onPress={() => finishTurn(true)} style={{ marginTop: 6 }} />
          </Panel>
        </View>
      ) : null}
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
      {sheet ? (() => {
        // En el orden del campo de batalla, de arriba abajo y de izquierda a derecha.
        const order = [...rowOf('enemy', 'back'), ...rowOf('enemy', 'front'), ...rowOf('party', 'front'), ...rowOf('party', 'back')];
        const others = order.filter(u => u.key !== sheet.key && u.side === sheet.side).map(u => ({ key: u.key, info: info(u) }));
        const pick = (key: string) => setSheet(cb.units.find(u => u.key === key));
        return sheet.side === 'party'
          ? <CardModal key={sheet.key} char={g.party.find(c => c.id === sheet.charId)} town={TOWNS[ADVS[advOf(g.zone)].town].name} info={info(cb.units.find(u => u.key === sheet.key)!)} others={others} onPick={pick} onClose={() => setSheet(undefined)} />
          : <CardModal key={sheet.key} monster={sheet.mon} info={info(cb.units.find(u => u.key === sheet.key)!)} intent={intentOf(cb.units.find(u => u.key === sheet.key)!)} others={others} onPick={pick} onClose={() => setSheet(undefined)} />;
      })() : null}
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
  // Con los mismos nombres que las cartas, y los repetidos agrupados («dos enjambres de murciélagos»).
  const foeText = foeList(foes.map(f => f.name));
  // Escritorio: cuadros estrechos, como los avisos.
  const esc = useEscritorio();
  const boxW = esc.on ? Math.min(480, esc.col * 0.88) : '86%';
  return (
    <View style={st.introBg}>
      <Animated.Text style={[st.introTitle, { opacity: v, transform: [{ scale }] }]}>¡Combate!</Animated.Text>
      <FadeIn delay={500}><Text style={st.introSub}>{foeText}</Text></FadeIn>
      {cb.goal ? (
        <FadeIn delay={700} style={{ width: boxW, marginBottom: 10 }}>
          <View style={st.goalIntro}>
            <Icon path={mdiBullseyeArrow} size={22} color={C.goldHi} />
            <Text style={st.goalIntroTxt}>Objetivo opcional: {cb.goal.g.text}</Text>
          </View>
        </FadeIn>
      ) : null}
      <FadeIn delay={900} style={{ width: boxW }}>
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

/**
 * Borde que parpadea alrededor de una carta. Sobre la carta activa, que ya
 * lleva un borde dorado grueso y está algo ampliada, el parpadeo es blanco y
 * queda por fuera para que se note.
 */
function Blink({ onActive }: { onActive?: boolean }) {
  const o = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const pulse = Animated.sequence([Animated.timing(o, { toValue: 1, duration: 180, useNativeDriver: true }), Animated.timing(o, { toValue: 0.15, duration: 180, useNativeDriver: true })]);
    Animated.sequence([pulse, pulse, pulse, Animated.timing(o, { toValue: 0, duration: 200, useNativeDriver: true })]).start();
  }, [o]);
  return <Animated.View pointerEvents="none" style={[st.blink, onActive && st.blinkActive, { opacity: o }]} />;
}

// Lo que se ve el cartel del final del combate antes de la ventana de victoria o derrota.
const END_MS = 1500;
// Lo que tarda un ataque en llegar: el golpe y su efecto en la carta se ven justo entonces.
const IMPACT = 300;
const SPELL_COLOR: Partial<Record<DmgType, string>> = { fuego: '#ff8a3d', 'frío': '#8fd8ff', radiante: '#ffe08a', fuerza: '#c49bff', necrótico: '#9ad17a', 'trueno': '#d0e4ff', 'relámpago': '#bcd6ff', veneno: '#a6e05a', 'ácido': '#c8e64a', 'psíquico': '#ff8ad8' };

/** Flecha o destello mágico que viaja de una carta a otra. */
function Projectile({ x, y, dx, dy, kind, color, t }: { x: number; y: number; dx: number; dy: number; kind: 'arrow' | 'magic'; color: string; t: Animated.Value }) {
  const S = 56;
  const angle = `${(Math.atan2(dy, dx) * 180) / Math.PI}deg`;
  const tx = t.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
  const ty = t.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });
  const scale = kind === 'magic' ? t.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] }) : 1;
  // Estela: dos copias tenues que siguen al proyectil un poco por detrás (solo con efectos completos).
  const ghost = (lag: number, o: number) => (
    <Animated.View key={lag} pointerEvents="none" style={{ position: 'absolute', left: x - S / 2, top: y - S / 2, width: S, height: S,
      opacity: t.interpolate({ inputRange: [0, lag, lag + 0.05, 1], outputRange: [0, 0, o, o * 0.6], extrapolate: 'clamp' }),
      transform: [{ translateX: t.interpolate({ inputRange: [0, lag, 1], outputRange: [0, 0, dx * (1 - lag)], extrapolate: 'clamp' }) }, { translateY: t.interpolate({ inputRange: [0, lag, 1], outputRange: [0, 0, dy * (1 - lag)], extrapolate: 'clamp' }) }, { rotate: angle }, { scale: kind === 'magic' ? 0.85 : 1 }] }}>
      <Svg width={S} height={S} viewBox="0 0 36 36">
        {kind === 'arrow' ? <Line x1="4" y1="18" x2="30" y2="18" stroke="#f4ede0" strokeWidth="1.2" /> : <Circle cx="18" cy="18" r="8" fill={color} />}
      </Svg>
    </Animated.View>
  );
  return (
    <>
    {fxFull() ? [ghost(0.12, 0.35), ghost(0.24, 0.18)] : null}
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
    </>
  );
}

const st = StyleSheet.create({
  turns: { height: GEAR_H, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 6 },
  turnsRound: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 11, textAlign: 'center', marginRight: 4, lineHeight: 13 },
  helpBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 16 },
  helpPanel: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center',  backgroundColor: C.panel, borderColor: C.gold, borderWidth: 1, borderRadius: 8, padding: 14 },
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
  // Botones fijos en una sola fila (el autor 2026-11-20).
  fixedRow: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 2, marginTop: 2, gap: 2 },
  fixedBtn: { flex: 1, flexBasis: 0, minWidth: 0, marginHorizontal: 0, marginVertical: 0 },
  devControl: { alignSelf: 'flex-end', paddingHorizontal: 8, minHeight: 24, justifyContent: 'center' },
  devText: { fontFamily: F.titleBold, fontSize: 11, color: C.textDim },
  hint: { width: '100%', fontFamily: F.italic, color: C.textDim, fontSize: 11, textAlign: 'center', marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 1 },
  // Rótulo de la fila en vertical, pegado a la izquierda (el autor 2026-11-13).
  rowLabelBox: { position: 'absolute', height: 12, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-90deg' }] },
  rowLabel: { textAlign: 'center', fontFamily: F.titleBold, color: C.text, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', textShadowColor: '#000', textShadowRadius: 4 },
  rowBand: { borderRadius: 6, borderWidth: 1, borderColor: 'rgba(201,162,92,0.25)', backgroundColor: 'rgba(0,0,0,0.18)' },
  rowEnemy: { borderColor: 'rgba(181,72,58,0.35)' },
  emptyRow: { height: EMPTY_ROW, paddingTop: 0, marginVertical: 2, alignItems: 'center', justifyContent: 'center' },
  emptyRowTxt: { fontFamily: F.titleBold, color: C.textDim, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  fleeBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, borderWidth: 1, borderColor: C.border, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 4, marginLeft: 4 },
  fleeTxt: { fontFamily: F.titleBold, color: C.text, fontSize: 11 },
  confirmBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center' },
  // Tutorial: lo que se explica brilla en dorado y el bocadillo flota sobre el campo.
  tutoLit: { borderWidth: 2, borderColor: C.goldHi, borderRadius: 8, shadowColor: C.goldHi, shadowOpacity: 0.9, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  tuto: { position: 'absolute', left: 10, right: 10, zIndex: 20, backgroundColor: '#1b140d', borderWidth: 2, borderColor: C.goldHi, borderRadius: 10, padding: 10 },
  budget: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 12 },
  budgetItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  budgetTxt: { fontFamily: F.rulesBold, color: C.text, fontSize: 11, lineHeight: 13 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 4, paddingHorizontal: 2, paddingVertical: 2 },
  gridBtn: { width: '49.4%', flexGrow: 0, flexShrink: 0, minWidth: 0, marginHorizontal: 0, marginVertical: 0 },
  log: { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: 6, marginVertical: 4 },
  goal: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  goalTxt: { flex: 1, fontFamily: F.textBold, color: C.goldHi, fontSize: 13, lineHeight: 16 },
  goalIntro: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#000a', borderColor: C.gold, borderWidth: 1, borderRadius: 6, padding: 8 },
  goalIntroTxt: { flex: 1, fontFamily: F.textBold, color: C.goldHi, fontSize: 15, lineHeight: 19 },
  round: { fontFamily: F.titleBold, color: C.gold, fontSize: 12 },
  logLine: { fontFamily: F.rules, color: C.text, fontSize: 12.5, lineHeight: 17 },
  actions: { backgroundColor: 'rgba(10,9,7,0.92)', paddingTop: 6, paddingHorizontal: 6, borderTopWidth: 1, borderColor: C.border },
  btns: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  actionFamily: { borderWidth: 1, borderColor: '#6e5431', borderRadius: 3, padding: 2, marginBottom: 2 },
  // Atacar, Habilidades y Objetos en una sola fila; sin objetos, las otras dos se reparten la fila (el autor 2026-11-13).
  categoryRow: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginBottom: 2 },
  categoryOrnate: { flex: 1, flexBasis: 0, minWidth: 0, marginHorizontal: 0, marginVertical: 0 },
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
  stripImg: { width: 40, height: 40 },
  blink: { position: 'absolute', left: -3, right: -3, top: -3, bottom: -3, borderRadius: 10, borderWidth: 3, borderColor: C.goldHi, zIndex: 3 },
  blinkActive: { left: -7, right: -7, top: -7, bottom: -7, borderRadius: 12, borderColor: '#ffffff', zIndex: 6 },
  stripCost: { fontFamily: F.rules, color: C.textDim, fontSize: 12 },
  stripHead: { fontFamily: F.rulesBold, color: C.goldHi, fontSize: 13.5, marginTop: 2 },
  odds: { marginTop: 6, marginBottom: 4, paddingVertical: 6, paddingHorizontal: 8, borderWidth: 1, borderColor: C.gold, borderRadius: 6, backgroundColor: 'rgba(201,162,74,0.14)' },
  oddsTitle: { fontFamily: F.rulesBold, color: C.goldHi, fontSize: 13, marginBottom: 2 },
  oddsRow: { fontFamily: F.rules, color: C.text, fontSize: 14, lineHeight: 21 },
  oddsPct: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 19 },
  oddsWhy: { fontFamily: F.rules, color: C.textDim, fontSize: 12 },
  stripTxt: { fontFamily: F.rules, color: C.text, fontSize: 13.5, lineHeight: 19, marginTop: 2 },
  stripAsk: { fontFamily: F.italic, color: C.goldHi, fontSize: 15, marginTop: 4 },
  stripOff: { fontFamily: F.rulesBold, color: '#e8796b', fontSize: 13.5, marginTop: 4 },
  stripBtns: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 6, marginTop: 6 },
  stripClose: { minHeight: 40, paddingHorizontal: 14, justifyContent: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 6 },
  stripCloseTxt: { fontFamily: F.titleBold, color: C.text, fontSize: 13 },
  bannerWrap: { position: 'absolute', left: 0, right: 0, top: '38%', height: 74, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  band: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.72)', borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.gold },
  endTxt: { fontFamily: F.titleBold, color: '#fff', fontSize: 26, textAlign: 'center', textShadowColor: '#000', textShadowRadius: 8 },
  bannerTxt: { fontFamily: F.titleBold, color: '#fff', fontSize: 40, letterSpacing: 6, textShadowColor: '#000', textShadowRadius: 8 },
  shine: { position: 'absolute', top: 4, bottom: 4, width: 26, backgroundColor: 'rgba(255,240,200,0.45)' },
});

