// Escena con opciones: ilustración, texto, pregunta y respuestas. Las que piden tirada dicen quién lo haría mejor
// y, al tocarlas, se elige quién del grupo la intenta (con su bonificador).
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { IMG } from '../assets';
import { ABIL_NAME, ITEMS } from '../data/srd';
import { C, F } from '../theme';
import type { Game } from '../engine/game';
import { bestFor, optionOpen, optionShown, sceneById, sceneState, testBonus, testChance } from '../engine/escenas';
import { isDown } from '../engine/rules';
import { Bg, Btn, Panel } from './kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { zoneArt } from '../engine/dungeon';
import { getDev } from '../storage';
import { FadeIn } from './Overlays';
import { DUR } from './movimiento';

const sign = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

export function Escena({ g, id, onChoose, onLeave }: { g: Game; id: string; onChoose: (i: number, charId?: string, force20?: boolean) => void; onLeave: () => void }) {
  const s = sceneById(id)!;
  const ins = useSafeAreaInsets();
  const [ask, setAsk] = useState<number>();
  const closed = sceneState(g, id).closed;
  const o = ask !== undefined ? s.options[ask] : undefined;
  // Ordenar solo las pruebas: la CD y el mejor modificador determinan la probabilidad real del d20.
  // Las alternativas narrativas conservan su orden relativo.
  // Las vías de un aliado van primero cuando está en el grupo; si no va, no se enseñan.
  const ordered = s.options.map((op, i) => ({ op, i })).filter(({ i }) => optionShown(g, s, i)).sort((a, b) => {
    const special = (op: typeof a.op) => !!(op.ally || op.if);
    if (special(a.op) || special(b.op)) return special(a.op) ? (special(b.op) ? 0 : -1) : 1;
    if (!a.op.attr || !b.op.attr) return 0;
    const chance = (op: typeof a.op) => Math.max(0, Math.min(20, 21 + (bestFor(g, op.attr!) ? testBonus(bestFor(g, op.attr!)!, op.attr!) : -20) - (op.dc ?? 10)));
    return chance(b.op) - chance(a.op);
  });
  return (
    // Pantalla entera: de fondo, la ilustración de la escena (o la de la zona si no tiene propia); el texto, abajo.
    <View style={StyleSheet.absoluteFill}>
      <Bg src={IMG[s.img ?? g.zoneBg ?? zoneArt(g.zone).combat]} dim={0.15}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', padding: 12, paddingBottom: ins.bottom + 12, paddingTop: ins.top + 40 }}>
      {/* El cuadro sube al aparecer y su contenido cambia con un fundido corto (pregunta ↔ quién lo intenta). */}
      <FadeIn key={id} from={18} duration={DUR.panel + 80}>
      <Panel style={st.panel}>
          <Text style={st.title}>{s.title}</Text>
          <View style={st.rule} />
          {o?.attr ? (
            <FadeIn key={`ask${ask}`} from={6} duration={DUR.panel}>
              <Text style={st.line}>{o.label}: prueba de {ABIL_NAME[o.attr]} (CD {o.dc}). ¿Quién lo intenta?</Text>
              {g.party.filter(c => !isDown(c)).sort((a, b) => testBonus(b, o.attr!) - testBonus(a, o.attr!)).map(c => (
                <Btn key={c.id} small label={`${c.name} (${sign(testBonus(c, o.attr!))})`} sub={`≈ ${testChance(c, o.attr!, o.dc ?? 10)} % de lograrlo`} onPress={() => { setAsk(undefined); onChoose(ask!, c.id); }} />
              ))}
              {getDev() ? <Btn small label="Superar (20)" onPress={() => { const index = ask!; const best = bestFor(g, o.attr!); setAsk(undefined); onChoose(index, best?.id, true); }} /> : null}
              <Btn small label="Volver" onPress={() => setAsk(undefined)} />
            </FadeIn>
          ) : (
            <FadeIn key="opts" from={ask === undefined ? 0 : 6} duration={DUR.panel}>
              <Text style={st.line}>{s.text}</Text>
              {s.question ? <Text style={[st.line, st.q]}>{s.question}</Text> : null}
              {ordered.map(({ op, i }) => {
                const shut = closed.includes(i);
                const open = optionOpen(g, s, i);
                const best = op.attr ? bestFor(g, op.attr) : undefined;
                const ally = op.ally ? g.party.find(c => c.id === op.ally) : undefined;
                const sub = shut ? 'Ya lo intentasteis: esta vía está cerrada'
                  : ally ? `Se encarga ${ally.name.split(' ')[0]}: sin tirada`
                  : op.if && !op.attr ? 'Por lo que hicisteis antes: sin tirada'
                  : !open && op.needs && !g.party.some(c => !c.dead && c.items.some(it => it.id === op.needs)) ? `Hace falta: ${ITEMS[op.needs]?.name ?? op.needs}`
                  : op.cost ? `Cuesta ${op.cost} po${g.gold < op.cost ? ' (no os llega)' : ''}`
                  : op.attr && best ? `${ABIL_NAME[op.attr]} CD ${op.dc} · mejor: ${best.name.split(' ')[0]} (${sign(testBonus(best, op.attr))}, ≈ ${testChance(best, op.attr, op.dc ?? 10)} %)` : undefined;
                return <Btn key={i} small label={op.label} sub={sub} off={!open} onPress={() => (!open ? undefined : op.attr ? setAsk(i) : onChoose(i))} />;
              })}
              <Btn small label={s.decision ? 'Ahora no' : 'Dejarlo para luego'} onPress={onLeave} />
            </FadeIn>
          )}
      </Panel>
      </FadeIn>
      </ScrollView>
      </Bg>
    </View>
  );
}

const st = StyleSheet.create({
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  panel: { borderColor: C.gold, borderWidth: 1.5, paddingTop: 10, backgroundColor: 'rgba(20,14,8,0.86)' },
  img: { width: '100%', aspectRatio: 1, borderRadius: 6, marginBottom: 8 },
  title: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 21, textAlign: 'center', letterSpacing: 1 },
  rule: { height: 1, backgroundColor: C.gold, opacity: 0.6, marginHorizontal: 40, marginTop: 6, marginBottom: 10 },
  line: { fontFamily: F.text, color: C.text, fontSize: 16, lineHeight: 22, marginBottom: 8 },
  q: { fontFamily: F.italic, color: C.goldHi },
});
