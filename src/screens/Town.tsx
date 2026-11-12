import React, { useEffect, useState } from 'react';
import { BackHandler, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IMG, ImgKey } from '../assets';
import { C, F } from '../theme';
import { useStore } from '../store';
import { Bg, Btn, Icon, Panel, T } from '../ui/kit';
import { mdiCardAccountDetailsOutline } from '@mdi/js';
import { ITEMS } from '../data/srd';
import { MAX_ITEMS, itemOwnership, keeps, longRest, needsRest, newItem, shortRest } from '../engine/rules';
import { reopenScenes, sceneSpent } from '../engine/escenas';
import { FeatPicker } from '../ui/FeatPicker';
import { CLASSES } from '../data/srd';
import * as storage from '../storage';
import { Card, CardModal, charInfo } from '../ui/Card';
import { FaceImage } from '../ui/FaceImage';
import { FadeIn, Portrait } from '../ui/Overlays';
import { ADV_LIST, ADVS, MEJORES, TOWNS, TownId, advOf, speaker, wonAdv } from '../engine/aventuras';
import { pendingNotes, useOutside } from '../engine/dungeon';
import { MAX_PARTY, finishTalk, nextTalk, short, talkLines, talksDone } from '../engine/posada';
import { Dialogue } from '../ui/Overlays';
import { Galeria } from './Galeria';

type Place = 'menu' | 'tienda' | 'templo' | 'posada' | 'puerta' | 'diario' | 'galeria';
const HEAL_COST = 10;
const REVIVE_COST = 50;
/** El tendero paga la mitad; por los objetos mágicos (100 po o más), la cuarta parte: si no, sobra oro. */
export const sellPrice = (value: number) => Math.floor(value / (value >= 100 ? 4 : 2));

export function Town() {
  const { game, edit, leaveTown, travel } = useStore();
  const g = game!;
  const ins = useSafeAreaInsets();
  const [place, setPlace] = useState<Place>('menu');
  // Al volver desde cualquier mapa, entrar siempre al menú principal del pueblo.
  useEffect(() => {
    if (game?.place === 'town') { setPlace('menu'); setNote(''); }
  }, [game?.place]);
  // Botón Atrás de Android: desde tienda, templo, posada, diario o puerta vuelve al menú del pueblo.
  useEffect(() => {
    if (place === 'menu') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { setPlace('menu'); setNote(''); return true; });
    return () => sub.remove();
  }, [place]);
  const [who, setWho] = useState(g.party[0].id);
  const [note, setNote] = useState('');
  const [sheet, setSheet] = useState<string>();
  const [chestSel, setChestSel] = useState<string>();
  const [bagSel, setBagSel] = useState<string>();
  const [selling, setSelling] = useState<string>();
  const [buying, setBuying] = useState<string>();
  const [asking, setAsking] = useState(false);
  const [talk, setTalk] = useState<{ id: string; n: number }>();
  const buyer = g.party.find(c => c.id === who) ?? g.party[0];
  const townId: TownId = g.town ?? 'valdescarcha';
  const town = TOWNS[townId];
  const adv = ADVS[town.adv];
  // Modo desarrollador: oro infinito (comprar, curar y resucitar no cuestan nada).
  const dev = storage.getDev();
  const pay = (n: number) => (dev ? 0 : n);
  const afford = (n: number) => dev || g.gold >= n;
  const sold = g.sold?.[townId] ?? [];
  const firstDone = g.won || !!g.wins?.length;
  const stock = [...town.stock, ...(firstDone ? MEJORES : []), ...sold.filter((id, i) => !town.stock.includes(id) && !(firstDone && MEJORES.includes(id)) && sold.indexOf(id) === i)];
  const started = !!g.saved?.[adv.data.zones[0].id] || (advOf(g.zone) === town.adv && g.visited.length > 0);
  const prevOf = (t: TownId) => ADVS[TOWNS[t].adv].prev;
  // La siguiente aventura se abre al vencer al jefe de la anterior (el autor 2026-11-06).
  const open = (t: TownId) => { const p = prevOf(t); return !p || dev || wonAdv(g, p); };
  const lockText = (t: TownId) => {
    const p = ADVS[prevOf(t)!];
    return `Vence al jefe de ${p.name} para abrir el camino`;
  };

  const say = (t: string) => setNote(t);
  const living = g.party.filter(c => !c.dead);
  // Bosque y montaña: hasta que se une su primer aliado, un compañero de otra aventura puede acompañar al héroe al principio.
  const firstStart = !!adv.prev && !g.party.some(c => c.adv === town.adv);
  const escorts = firstStart ? living.filter(c => !c.isHero && (c.adv ?? 'hondaroca') !== town.adv) : [];
  // Compañeros para la próxima salida: los elegidos en la posada o, si no se eligió nunca, los de esta aventura.
  const allies = g.party.filter(c => !c.isHero);
  const going = firstStart ? [] : g.chosen ? allies.filter(c => g.chosen!.includes(c.id)) : allies.filter(c => (c.adv ?? 'hondaroca') === town.adv);
  const go2 = () => (escorts.length ? setAsking(true) : (setPlace('menu'), leaveTown()));
  // Barra común para tienda y baúl: tocar otro personaje lo selecciona; repetir toque abre su ficha.
  const renderPartyBar = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginVertical: 8 }}
      contentContainerStyle={{ flexDirection: 'row', gap: 10, paddingHorizontal: 3 }}>
      {living.map(c => (
        <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={`Seleccionar o ver ficha de ${c.name}`}
          onPress={() => { if (who === c.id) setSheet(c.id); else { setWho(c.id); setBagSel(undefined); setChestSel(undefined); setBuying(undefined); setSelling(undefined); } }}
          style={{ alignItems: 'center', minWidth: 70, padding: 4, borderRadius: 8, borderWidth: 1, borderColor: who === c.id ? C.goldHi : C.border, backgroundColor: 'rgba(0,0,0,0.55)' }}>
          <View style={{ borderRadius: 24, borderWidth: who === c.id ? 3 : 1, borderColor: who === c.id ? C.goldHi : C.gold, overflow: 'hidden' }}>
            <FaceImage img={c.img} size={42} />
          </View>
          <Text style={{ color: who === c.id ? C.goldHi : C.text, fontSize: 12, marginTop: 3 }}>{c.name.split(' ')[0]}</Text>
          <Text style={{ color: C.textDim, fontSize: 11 }}>{c.items.length}/{MAX_ITEMS}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );


  return (
    // Al cambiar de lugar, la ilustración nueva entra con un fundido.
    <FadeIn key={place} from={0} duration={500} style={{ flex: 1 }}>
    <Bg src={IMG[town.bg[place === 'diario' ? 'posada' : place === 'galeria' ? 'menu' : place]]} dim={place === 'menu' ? 0.15 : 0.45}>
      <View style={[st.top, { paddingTop: ins.top + 8 }]}>
        <Text style={st.title}>{place === 'menu' ? town.name : place === 'galeria' ? 'Galería' : place[0].toUpperCase() + place.slice(1)}</Text>
        <View style={st.topRight}>
          <Text style={st.gold}>{dev ? '∞' : g.gold} po</Text>
          {place !== 'menu' ? <Btn small label="Volver" onPress={() => { setPlace('menu'); say(''); }} /> : null}
        </View>
      </View>
      {/* El templo deja ver la ilustración arriba; en el resto, la imagen se ve un segundo y luego aparece el contenido a pantalla completa. */}
      {place === 'templo' ? <View style={{ flex: 1 }} /> : null}
      <ScrollView key={place} style={place === 'templo' ? { maxHeight: '62%' } : { flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 12, paddingBottom: ins.bottom + 12 }}>
        <FadeIn delay={place === 'templo' ? 150 : 500} duration={450} from={6}>
        {note ? <Text style={st.note}>{note}</Text> : null}
        {place === 'menu' ? (
          <Panel>
            <Btn primary label={started ? 'Volver a la mazmorra' : 'Ir a la mazmorra'}
              sub={`${g.backs?.[town.adv] ? 'Apareces en el punto de descanso' : started ? 'Donde dejasteis la aventura' : 'Empieza la aventura'}${allies.length ? ` · ${going.length ? `Con ${going.map(short).join(', ')}` : 'Solo'}` : ''}`} onPress={go2} />
            {g.news?.length ? (
              <View style={st.escort}>
                {g.news.map((n, i) => <Text key={i} style={st.itemDesc}>{n}</Text>)}
                <Btn small label="Entendido" onPress={() => edit(gg => { gg.news = []; }, true)} />
              </View>
            ) : null}
            {asking ? (
              <View style={st.escort}>
                <Text style={st.h}>¿Quién te acompaña {adv.escortWhere}?</Text>
                <Text style={st.itemDesc}>Irá contigo hasta que se una a vosotros alguien de {adv.id === 'montana' ? 'la montaña' : 'el bosque'}; entonces volverá al pueblo.</Text>
                {escorts.map(c => <Btn key={c.id} label={c.name} sub={`${CLASSES[c.cls].name} · nivel ${c.level} · ${c.hp}/${c.maxHp} PG`} onPress={() => { setAsking(false); setPlace('menu'); leaveTown(c.id); }} />)}
                <Btn label="Ir solo" onPress={() => { setAsking(false); setPlace('menu'); leaveTown(); }} />
                <Btn small label="Cancelar" onPress={() => setAsking(false)} />
              </View>
            ) : null}
            <Btn label="Tienda" sub="Comprar y vender" onPress={() => { setPlace('tienda'); say(''); }} />
            <Btn label="Templo" sub="Curar heridas pagando oro" onPress={() => { setPlace('templo'); say(''); }} />
            <Btn label="Posada" sub={allies.some(c => nextTalk(g, c) !== undefined) ? 'Descansar, elegir compañeros y charlar (hay charlas nuevas)' : 'Descansar, elegir compañeros y charlar'} onPress={() => { setPlace('posada'); say(''); }} />
            <Btn label="Diario" sub="Historias y diálogos vividos" onPress={() => { setPlace('diario'); say(''); }} />
            <Btn label="Puerta del pueblo" sub="Viajar por el reino" onPress={() => { setPlace('puerta'); say(''); }} />
            <Btn label="Galería" sub="Personajes, enemigos y lugares que habéis conocido" onPress={() => { setPlace('galeria'); say(''); }} />
            <View style={st.partyRow}>
              {g.party.map(c => <View key={c.id} style={{ margin: 2 }}><Card info={charInfo(c)} width={70} dim={c.dead} onPress={() => setSheet(c.id)} /></View>)}
            </View>
          </Panel>
        ) : null}
        {place === 'galeria' ? <Galeria g={g} /> : null}
        {place === 'tienda' ? (
          <Panel>
            <Text style={st.h}>Personajes · toca el seleccionado para ver su ficha</Text>
            {renderPartyBar()}
            <Text style={st.h}>Comprar</Text>
            {buyer.items.length >= MAX_ITEMS ? <Text style={st.full}>Inventario lleno: {buyer.name.split(' ')[0]} no puede llevar más objetos. Vende algo o elige a otro.</Text> : null}
            {stock.map(id => buying === id ? (
              <View key={id} style={st.confirm}>
                <Text style={st.itemName}>¿Comprar {ITEMS[id].name} para {buyer.name.split(' ')[0]} por {pay(ITEMS[id].value)} po?</Text>
                <Text style={st.itemDesc}>{itemOwnership([...g.party, ...(g.bench ?? []), ...(g.captive ? [g.captive] : [])], id)}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Btn small primary label="Comprar" onPress={() => {
                    edit(gg => {
                      gg.gold -= pay(ITEMS[id].value);
                      gg.party.find(c => c.id === buyer.id)!.items.push(newItem(id));
                      // Lo que se vendió aquí se puede recomprar una vez por cada unidad vendida.
                      const list = gg.sold?.[townId] ?? [];
                      const i = list.indexOf(id);
                      if (i >= 0) gg.sold = { ...gg.sold, [townId]: list.filter((_, j) => j !== i) };
                    }, true);
                    setBuying(undefined);
                    say(`${buyer.name} compra ${ITEMS[id].name}.`);
                  }} />
                  <Btn small label="No" onPress={() => setBuying(undefined)} />
                </View>
              </View>
            ) : (
              <ItemRow key={id} img={ITEMS[id].img} name={ITEMS[id].name} desc={ITEMS[id].desc} price={`${ITEMS[id].value} po`}
                disabled={!afford(ITEMS[id].value) || buyer.items.length >= MAX_ITEMS}
                onPress={() => setBuying(id)} />
            ))}
            <Text style={st.h}>Vender (mitad de su valor)</Text>
            {buyer.items.filter(it => !keeps(it)).map(it => {
              const v = sellPrice(ITEMS[it.id].value);
              return selling === it.uid ? (
                <View key={it.uid} style={st.confirm}>
                  <Text style={st.itemName}>¿Vender {ITEMS[it.id].name} por {v} po?</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Btn small primary label="Vender" onPress={() => {
                      edit(gg => {
                        const c = gg.party.find(x => x.id === buyer.id)!;
                        c.items = c.items.filter(i => i.uid !== it.uid);
                        gg.gold += v;
                        gg.sold = { ...gg.sold, [townId]: [...(gg.sold?.[townId] ?? []), it.id] };
                      }, true);
                      setSelling(undefined);
                      say(`Vendido: ${ITEMS[it.id].name}. Sigue a la venta en la tienda.`);
                    }} />
                    <Btn small label="No" onPress={() => setSelling(undefined)} />
                  </View>
                </View>
              ) : (
                <ItemRow key={it.uid} img={ITEMS[it.id].img} name={ITEMS[it.id].name} desc="" price={`+${v} po`} onPress={() => setSelling(it.uid)} />
              );
            })}
            {buyer.items.some(keeps) ? <Text style={st.itemDesc}>Las llaves no se venden.</Text> : null}
          </Panel>
        ) : null}
        {place === 'templo' ? (
          <Panel>
            <T>El sacerdote cura heridas por {HEAL_COST} po por persona y devuelve la vida a los caídos por {REVIVE_COST} po.</T>
            {g.party.map(c => c.dead ? (
              <Btn key={c.id} label={`Resucitar a ${c.name}`} sub={`${REVIVE_COST} po`} disabled={!afford(REVIVE_COST)}
                onPress={() => { edit(gg => { const x = gg.party.find(y => y.id === c.id)!; gg.gold -= pay(REVIVE_COST); x.dead = false; longRest(x); }, true); say(`${c.name} vuelve a la vida.`); }} />
            ) : c.hp < c.maxHp ? (
              <Btn key={c.id} label={`Curar a ${c.name}`} sub={`${c.hp}/${c.maxHp} PG · ${HEAL_COST} po`} disabled={!afford(HEAL_COST)}
                onPress={() => { edit(gg => { const x = gg.party.find(y => y.id === c.id)!; gg.gold -= pay(HEAL_COST); x.hp = x.maxHp; }, true); say(`${c.name} queda curado.`); }} />
            ) : null)}
            {g.party.every(c => !c.dead && c.hp >= c.maxHp) ? <Text style={st.itemDesc}>No es necesario: nadie está herido ni ha caído.</Text> : null}
          </Panel>
        ) : null}
        {place === 'posada' ? (
          <Panel>
            <T>La posada ofrece cama caliente y un rincón tranquilo para escribir el diario.</T>
            {/* Un descanso largo por zona: solo se duerme de verdad tras terminar una zona; si no, descanso corto. */}
            {(() => {
              // La posada siempre da descanso largo (el autor 2026-11-06: el descanso largo solo se hace aquí).
              const full = true;
              // Pruebas falladas por completo: el descanso largo de la posada las reabre (el autor 2026-11-05).
              const retry = full && Object.keys(g.scenes ?? {}).some(id => sceneSpent(g, id));
              const need = full ? needsRest(g.party, true) || retry : g.party.some(c => !c.dead && ((c.hp < c.maxHp && c.hitDice > 0) || c.secondWind < 2));
              const sub = !need ? (full ? 'No es necesario: estáis descansados' : 'No es necesario: ya no os quedan dados de golpe que gastar')
                : full ? 'Descanso largo y guardar' : 'Solo descanso corto: terminad una zona para un descanso largo';
              return (
                <Btn label={full ? 'Descansar (gratis)' : 'Descanso corto (gratis)'} off={!need} sub={sub}
                  onPress={!need ? () => say(sub) : full
                    ? () => { let n = 0; edit(gg => { gg.party.forEach(longRest); gg.restReady = false; n = reopenScenes(gg); }, true); say(`El grupo descansa toda la noche.${n ? ' Las pruebas que fallasteis se pueden volver a intentar.' : ''} Partida guardada.`); }
                    : () => { let lines: string[] = []; edit(gg => { lines = gg.party.filter(c => !c.dead).map(c => `${c.name} recupera ${shortRest(c, gg.rng)} PG.`); }, true); say(`Descanso corto. ${lines.join(' ')}`); }} />
              );
            })()}
            <Btn label="Guardar partida" onPress={() => { storage.save(g); say('Partida guardada.'); }} />
            {/* Baúl de la posada, el mismo en todos los pueblos (el autor 2026-11-06). */}
            <Text style={st.h}>Personajes · toca el seleccionado para ver su ficha</Text>
            {renderPartyBar()}
            <Text style={st.h}>Baúl de la posada</Text>
            {(g.trophies ?? []).length ? <Text style={st.itemDesc}>Trofeos: {(g.trophies ?? []).map(id => ITEMS[id]?.name ?? id).join(', ')}. No se venden.</Text> : null}
            <Text style={st.itemDesc}>Inventario de {buyer.name} · {buyer.items.length}/{MAX_ITEMS}. Toca un objeto para guardarlo.</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
              {Array.from({ length: MAX_ITEMS }).map((_, i) => {
                const it = buyer.items[i];
                return <Pressable key={i} onPress={() => { if (it) { setBagSel(it.uid); setChestSel(undefined); } }}
                  style={{ width: 56, height: 56, borderWidth: 1.5, borderRadius: 6, borderColor: it?.uid === bagSel ? C.gold : C.border, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                  {it ? <Image source={IMG[ITEMS[it.id].img]} style={{ width: 48, height: 48 }} /> : null}
                </Pressable>;
              })}
            </View>
            {buyer.items.find(i => i.uid === bagSel) ? <Btn small label={`Guardar ${ITEMS[buyer.items.find(i => i.uid === bagSel)!.id].name} ↓`}
              onPress={() => { const uid = bagSel!; edit(gg => { const c = gg.party.find(x => x.id === buyer.id)!; const it = c.items.find(x => x.uid === uid); if (!it || keeps(it)) return; c.items = c.items.filter(x => x.uid !== uid); gg.chest = [...(gg.chest ?? []), it]; }, true); setBagSel(undefined); }} /> : null}
            <Text style={st.itemDesc}>Baúl · {(g.chest ?? []).length} objetos. Selecciona uno para sacarlo al inventario del personaje elegido.</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
              {(g.chest ?? []).map(it => <Pressable key={it.uid} onPress={() => { setChestSel(it.uid); setBagSel(undefined); }}
                style={{ width: 56, height: 56, borderWidth: 1.5, borderRadius: 6, borderColor: chestSel === it.uid ? C.gold : C.border, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                <Image source={IMG[ITEMS[it.id].img]} style={{ width: 48, height: 48 }} />
              </Pressable>)}
            </View>
            {(g.chest ?? []).find(i => i.uid === chestSel) ? <>
              <Text style={st.itemDesc}>{ITEMS[(g.chest ?? []).find(i => i.uid === chestSel)!.id].desc}</Text>
              <Btn small label={`Sacar ↑ para ${buyer.name}`} onPress={() => {
                if (buyer.items.length >= MAX_ITEMS) { say('Inventario lleno.'); return; }
                const uid = chestSel!;
                edit(gg => { const it = (gg.chest ?? []).find(x => x.uid === uid); const c = gg.party.find(x => x.id === buyer.id); if (!it || !c || c.items.length >= MAX_ITEMS) return; gg.chest = (gg.chest ?? []).filter(x => x.uid !== uid); c.items.push(it); }, true);
                setChestSel(undefined);
              }} />
              <Text style={st.itemDesc}>Las armas y armaduras se equipan automáticamente según las reglas de la clase al incorporarlas al inventario.</Text>
            </> : null}
            {allies.length ? (
              <View>
                <Text style={st.h}>Compañeros para la próxima salida</Text>
                <Text style={st.itemDesc}>{firstStart ? `Al empezar ${adv.name} solo os acompaña uno: lo eliges al salir hacia la mazmorra. Los demás esperan aquí y suben de nivel con el grupo.` : `Elige hasta ${MAX_PARTY - 1}. Los demás esperan aquí y suben de nivel con el grupo.`}</Text>
                {firstStart ? null : allies.map(c => {
                  const on = going.includes(c);
                  return <Btn key={c.id} small primary={on} label={`${on ? '✓ ' : ''}${c.name}`} sub={`${CLASSES[c.cls].name} · nivel ${c.level}${c.inspired ? ' · Inspiración heroica' : ''}`}
                    onPress={() => edit(gg => {
                      const cur = gg.chosen ?? going.map(x => x.id);
                      gg.chosen = on ? cur.filter(x => x !== c.id) : cur.length < MAX_PARTY - 1 ? [...cur, c.id] : cur;
                      if (!on && cur.length >= MAX_PARTY - 1) say(`Ya van ${MAX_PARTY - 1}: quita a alguien antes.`);
                    }, true)} />;
                })}
                <Text style={st.h}>Charlas</Text>
                <T>Cada aventura terminada juntos abre una charla con ese aliado. Con la tercera, la afinidad llega al máximo y gana Inspiración heroica: una vez por aventura repetirá una tirada fallida.</T>
                {allies.map(c => {
                  const n = nextTalk(g, c);
                  const done = talksDone(g, c.id);
                  return <Btn key={c.id} small off={n === undefined} label={`Hablar con ${short(c)}`}
                    sub={n !== undefined ? `Charla ${n + 1} de 3` : done >= 3 ? 'Afinidad máxima' : 'Haced otra aventura juntos para seguir hablando'}
                    onPress={() => (n === undefined ? undefined : setTalk({ id: c.id, n }))} />;
                })}
              </View>
            ) : null}
          </Panel>
        ) : null}
        {place === 'puerta' ? (
          <Panel>
            <T>Más allá de la puerta se extiende el reino. ¿Adónde viajáis?</T>
            {(Object.keys(TOWNS) as TownId[]).filter(t => t !== townId).map(t => (
              <Btn key={t} label={`Viajar a ${TOWNS[t].name}`} disabled={!open(t)}
                sub={open(t) ? `Pueblo de ${ADVS[TOWNS[t].adv].name}${dev && prevOf(t) ? ` · el grupo sube a nivel ${ADVS[prevOf(t)!].level}` : ''}` : lockText(t)}
                onPress={() => { travel(t); setPlace('menu'); say(`Llegáis a ${TOWNS[t].name}.`); }} />
            ))}
          </Panel>
        ) : null}
        {place === 'diario' ? <Diary /> : null}
        </FadeIn>
      </ScrollView>
      {sheet ? (
        <CardModal char={g.party.find(c => c.id === sheet)} info={charInfo(g.party.find(c => c.id === sheet)!)} party={g.party} town={town.name} onClose={() => setSheet(undefined)}
          onUse={(uid, to) => { let t = ''; edit(gg => { t = useOutside(gg, sheet, uid, to); }, true); say(t); }}
          onGive={(uid, to) => edit(gg => {
            const from = gg.party.find(c => c.id === sheet)!;
            const dest = gg.party.find(c => c.id === to)!;
            const it = from.items.find(i => i.uid === uid);
            if (it && dest.items.length < MAX_ITEMS) { from.items = from.items.filter(i => i.uid !== uid); dest.items.push(it); }
          }, true)} />
      ) : null}
      <FeatPicker />
      {talk ? (
        <Dialogue lines={talkLines(talk.id, talk.n)} hero={{ name: (g.party.find(c => c.isHero) ?? g.party[0]).name, img: (g.party.find(c => c.isHero) ?? g.party[0]).img }}
          onDone={() => { let out: string[] = []; edit(gg => { out = finishTalk(gg, talk.id); }, true); say(out.join(' ')); setTalk(undefined); }} />
      ) : null}
    </Bg>
    </FadeIn>
  );
}

/** Diario: diálogos vividos en cada aventura, con el retrato de quien habla, y la intro para volver a verla. */
function Diary() {
  const { game, showIntro } = useStore();
  const g = game!;
  const hero = g.party.find(c => c.isHero) ?? g.party[0];
  const played = ADV_LIST.filter(a => a.id === 'hondaroca' || advOf(g.zone) === a.id || g.saved?.[a.data.zones[0].id] || g.diary?.some(d => d.a === a.id));
  return (
    <>
      {played.map(a => {
        const lines = (g.diary ?? []).filter(d => d.a === a.id);
        return (
          <Panel key={a.id} style={{ marginBottom: 10 }}>
            <Text style={st.h}>{a.name}</Text>
            <Btn small label="Ver la introducción" onPress={() => showIntro(a.id)} />
            {pendingNotes(g, a.id).length ? (
              <View style={{ marginVertical: 6 }}>
                <Text style={st.diaryWho}>Pendientes</Text>
                {pendingNotes(g, a.id).map((t, i) => <Text key={i} style={[st.itemDesc, { color: C.text, fontSize: 15 }]}>• {t}</Text>)}
              </View>
            ) : null}
            {lines.length ? lines.map((d, i) => {
              const sp = d.s === 'hero' ? { name: hero.name, img: hero.img } : speaker(d.s);
              return (
                <View key={i} style={st.diaryRow}>
                  {sp.img ? <Portrait img={sp.img} size={44} /> : <View style={{ width: 44 }} />}
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    {sp.name ? <Text style={st.diaryWho}>{sp.name}</Text> : null}
                    <Text style={[st.itemDesc, { color: C.text, fontSize: 15 }, !sp.name && { fontFamily: F.italic }]}>{d.t}</Text>
                  </View>
                </View>
              );
            }) : <Text style={st.itemDesc}>Aún no hay nada escrito de esta aventura.</Text>}
          </Panel>
        );
      })}
    </>
  );
}

function ItemRow({ img, name, desc, price, onPress, disabled }: { img: ImgKey; name: string; desc: string; price: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [st.item, pressed && { backgroundColor: C.panelHi }, disabled && { opacity: 0.4 }]} accessibilityRole="button" accessibilityLabel={`${name}, ${price}`}>
      <Image source={IMG[img]} style={{ width: 40, height: 40 }} />
      <View style={{ flex: 1, marginLeft: 8 }}>
        <Text style={st.itemName}>{name}</Text>
        {desc ? <Text style={st.itemDesc} numberOfLines={2}>{desc}</Text> : null}
      </View>
      <Text style={st.price}>{price}</Text>
    </Pressable>
  );
}

export function Victory() {
  const { toTown, game } = useStore();
  const ins = useSafeAreaInsets();
  const A = ADVS[advOf(game!.zone)];
  return (
    <Bg src={IMG[A.victoryImg]} dim={0.2}>
      <View style={{ flex: 1, justifyContent: 'flex-end', padding: 16, paddingBottom: ins.bottom + 20 }}>
        <Panel>
          <T h={2} style={{ textAlign: 'center' }}>¡Victoria!</T>
          <T>{A.victoryText}</T>
          <T>Todo el grupo llega al menos a nivel {A.level}.</T>
          <Btn label={`Volver a ${TOWNS[A.town].name}`} onPress={toTown} style={{ marginTop: 10 }} />
        </Panel>
      </View>
    </Bg>
  );
}

export function Defeat() {
  const { game, loadSlot, go } = useStore();
  const ins = useSafeAreaInsets();
  const A = ADVS[advOf(game!.zone)];
  return (
    <Bg src={IMG[A.defeatImg]} dim={0.25}>
      <View style={{ flex: 1, justifyContent: 'flex-end', padding: 16, paddingBottom: ins.bottom + 20 }}>
        <Panel>
          <T h={2} style={{ textAlign: 'center' }}>Derrota</T>
          <T>{A.defeatText}</T>
          <T>Al volver al último guardado perdéis una cuarta parte del oro.</T>
          <Btn label="Cargar el último guardado" onPress={() => loadSlot(game!.slot)} style={{ marginTop: 10 }} />
          <Btn label="Menú principal" onPress={() => go('title')} />
        </Panel>
      </View>
    </Bg>
  );
}

const st = StyleSheet.create({
  full: { fontFamily: F.textBold, color: '#e8796b', fontSize: 16, marginBottom: 6 },
  escort: { borderTopWidth: 1, borderColor: C.border, marginTop: 6, paddingTop: 4 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8, backgroundColor: 'rgba(0,0,0,0.6)' },
  diaryRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#3a2e22' },
  diaryWho: { fontFamily: F.textBold, color: C.goldHi, fontSize: 14 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 22 },
  gold: { fontFamily: F.textBold, color: C.gold, fontSize: 18 },
  note: { fontFamily: F.italic, color: C.goldHi, fontSize: 16, textAlign: 'center', marginBottom: 6, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 6 },
  h: { fontFamily: F.title, color: C.gold, fontSize: 15, marginTop: 8, marginBottom: 4 },
  partyRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 6 },
  who: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.gold, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, margin: 2, minHeight: 36 },
  whoOn: { backgroundColor: C.gold },
  whoTxt: { fontFamily: F.textBold, color: C.goldHi, fontSize: 14 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#3a2e22', minHeight: 52 },
  itemName: { fontFamily: F.textBold, color: C.text, fontSize: 16 },
  itemDesc: { fontFamily: F.text, color: C.textDim, fontSize: 13 },
  price: { fontFamily: F.textBold, color: C.gold, fontSize: 15, marginLeft: 6 },
  confirm: { paddingVertical: 8, borderBottomWidth: 1, borderColor: '#3a2e22', gap: 6 },
});
