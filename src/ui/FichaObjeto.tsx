import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { IMG } from '../assets';
import { C, F } from '../theme';
import { ITEMS } from '../data/srd';
import { Char, Item, compareItem, equipState, keeps } from '../engine/rules';

/**
 * Ficha de un objeto, igual que al tocarlo en el inventario: icono, nombre, descripción, si está equipado,
 * comparación con lo que lleva el personaje y valor. Se usa en el inventario, la tienda, el baúl y los cofres
 * (el autor 2026-11-25). Sin `owner` no hay comparación; sin `item` (aún no es de nadie) no hay estado de equipo.
 * En la tienda, `value={false}`: el precio ya va en la pregunta de compra o venta.
 */
export function FichaObjeto({ id, owner, item, compare = true, value = true }: { id: string; owner?: Char; item?: Item; compare?: boolean; value?: boolean }) {
  const def = ITEMS[id];
  if (!def) return null;
  const eq = owner && item ? equipState(owner, item) : undefined;
  const cmp = owner && compare ? compareItem(owner, id, item?.uid) : undefined;
  return (
    <View style={st.row}>
      <Image source={IMG[def.img]} style={st.big} />
      <View style={{ flex: 1 }}>
        <Text style={st.name}>{def.name}{item?.charges !== undefined ? ` (${item.charges} cargas)` : ''}</Text>
        <Text style={st.small}>{def.desc}</Text>
        {eq ? <Text style={[st.small, { color: eq.on ? '#7fcf8f' : C.textDim }]}>{eq.on ? 'Equipado.' : 'Sin equipar.'}{eq.why ? ` ${eq.why}` : ''}</Text> : null}
        {cmp ? <Text style={st.small}>{cmp}</Text> : null}
        {def.key || (item && keeps(item)) ? <Text style={st.small}>Llave: no se vende ni se deja en el suelo.</Text>
          : value ? <Text style={st.small}>Valor: {def.value} po</Text> : null}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  big: { width: 110, height: 110 },
  name: { fontFamily: F.titleBold, color: C.goldHi, fontSize: 14, marginBottom: 2 },
  small: { fontFamily: F.rules, color: C.text, fontSize: 15, lineHeight: 22 },
});
