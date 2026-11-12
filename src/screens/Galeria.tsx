import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { IMG, ImgKey } from '../assets';
import { C, F } from '../theme';
import { Btn, Crop, Panel } from '../ui/kit';
import { ADV_LIST, AdvId, TOWNS, TownId, advOf } from '../engine/aventuras';
import { MONSTERS } from '../data/srd';
import type { Game } from '../engine/game';

interface Pic { img: ImgKey; name: string; known: boolean; hint?: string }

/** Pista bajo la interrogación de un personaje sin conocer: qué papel tiene, sin decir su nombre. */
const hintOf = (id: string, img: string) => (['orvane', 'corazon', 'dragon'].includes(id) ? 'Jefe' : img.startsWith('ally_') ? 'Aliado' : 'Personaje');

/** Imágenes de una aventura por categoría; las que aún no se han visto salen con interrogación. */
function picsOf(g: Game, adv: AdvId): { title: string; pics: Pic[] }[] {
  const A = ADV_LIST.find(a => a.id === adv)!;
  const talked = new Set([...(g.met ?? []), ...g.party.map(c => c.id), ...(g.diary ?? []).map(d => d.s)]);
  const chars: Pic[] = Object.entries(A.faces).map(([id, img]) => ({ img, name: A.speakers[id] ?? id, known: talked.has(id), hint: hintOf(id, img) }));
  const seenFoe = new Set<string>();
  const foes: Pic[] = [];
  for (const z of A.data.zones) for (const r of z.rooms) for (const c of r.contents as any[]) {
    if (c.type !== 'encounter') continue;
    const fought = g.done.includes(c.id) || g.fled.includes(c.id);
    for (const e of c.enemies) {
      const m = MONSTERS[e.srd_creature];
      if (!m) continue;
      const prev = foes.find(f => f.img === m.img);
      if (prev) { prev.known = prev.known || fought; continue; }
      if (seenFoe.has(m.img)) continue;
      seenFoe.add(m.img);
      foes.push({ img: m.img, name: m.name, known: fought });
    }
  }
  const places: Pic[] = A.data.zones.map(z => ({ img: A.art[z.id].bg, name: z.name, known: !!g.saved?.[z.id] || g.zone === z.id || !!g.stats?.[z.id] }));
  // El pueblo de la aventura y sus sitios (el autor 2026-11-06).
  const tid = (Object.keys(TOWNS) as TownId[]).find(t => TOWNS[t].adv === adv);
  if (tid) {
    const T = TOWNS[tid];
    const been = (g.town ?? 'valdescarcha') === tid || adv === 'hondaroca' || advOf(g.zone) === adv || !!g.wins?.includes(adv) || !!g.saved?.[A.data.zones[0].id];
    const label: Record<string, string> = { menu: T.name, tienda: `Tienda de ${T.name}`, templo: `Templo de ${T.name}`, posada: `Posada de ${T.name}`, puerta: `Puerta de ${T.name}` };
    places.unshift(...Object.entries(T.bg).map(([k, img]) => ({ img: img as ImgKey, name: label[k] ?? T.name, known: been })));
  }
  return [{ title: 'Personajes', pics: chars }, { title: 'Enemigos', pics: foes }, { title: 'Lugares', pics: places }];
}

/** Galería del pueblo: miniaturas por aventura y categoría; tocar una conocida la abre a pantalla completa (deslizable). */
export function Galeria({ g }: { g: Game }) {
  // Se abre en la aventura del pueblo en el que se está.
  const [adv, setAdv] = useState<AdvId>(TOWNS[g.town ?? 'valdescarcha']?.adv ?? ADV_LIST[0].id);
  const [open, setOpen] = useState<{ list: Pic[]; i: number }>();
  const { width, height } = useWindowDimensions();
  const cats = picsOf(g, adv);
  const tw = (width - 92) / 4;
  return (
    <Panel>
      <View style={st.tabs}>
        {ADV_LIST.map(a => (
          <Pressable key={a.id} onPress={() => setAdv(a.id)} style={[st.tab, adv === a.id && st.tabOn]} accessibilityRole="button">
            <Text style={[st.tabTxt, adv === a.id && { color: C.bg }]} numberOfLines={1}>{a.name}</Text>
          </Pressable>
        ))}
      </View>
      {cats.map(cat => (
        <View key={cat.title}>
          <Text style={st.h}>{cat.title} <Text style={st.count}>{cat.pics.filter(p => p.known).length}/{cat.pics.length}</Text></Text>
          <View style={st.grid}>
            {cat.pics.map((p, i) => (
              <Pressable key={p.img + i} disabled={!p.known} accessibilityLabel={p.known ? p.name : `Sin descubrir${p.hint ? `: ${p.hint}` : ''}`}
                onPress={() => { const list = cat.pics.filter(x => x.known); setOpen({ list, i: list.indexOf(p) }); }}
                style={[st.thumb, { width: tw, height: tw * 1.3 }]}>
                {p.known
                  ? <Crop img={p.img} w={tw - 2} h={tw * 1.3 - 2} zoom={1.15} fy={0.3} />
                  : <>
                    <Text style={st.q}>?</Text>
                    {p.hint ? <Text style={st.hint} numberOfLines={1}>{p.hint}</Text> : null}
                  </>}
              </Pressable>
            ))}
          </View>
        </View>
      ))}
      {open ? (
        <Modal transparent animationType="fade" onRequestClose={() => setOpen(undefined)}>
          <View style={st.full}>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              contentOffset={{ x: open.i * width, y: 0 }}>
              {open.list.map(p => (
                <Pressable key={p.img} onPress={() => setOpen(undefined)} style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
                  <Image source={IMG[p.img]} style={{ width, height: height * 0.82 }} resizeMode="contain" />
                  <Text style={st.fullName}>{p.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Btn small label="Cerrar" onPress={() => setOpen(undefined)} style={st.close} />
          </View>
        </Modal>
      ) : null}
    </Panel>
  );
}

const st = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  tab: { flex: 1, borderWidth: 1, borderColor: C.gold, borderRadius: 14, paddingVertical: 6, paddingHorizontal: 8, alignItems: 'center' },
  tabOn: { backgroundColor: C.gold },
  tabTxt: { fontFamily: F.textBold, color: C.goldHi, fontSize: 14 },
  h: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 17, marginTop: 8, marginBottom: 4 },
  count: { fontFamily: F.text, color: C.textDim, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  thumb: { borderWidth: 1, borderColor: C.border, borderRadius: 4, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0008' },
  q: { fontFamily: F.titleBold, color: C.textDim, fontSize: 30 },
  hint: { fontFamily: F.italic, color: C.textDim, fontSize: 13, marginTop: 2 },
  full: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  fullName: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 20, marginTop: 8, textAlign: 'center' },
  close: { position: 'absolute', top: 40, right: 12 },
});
