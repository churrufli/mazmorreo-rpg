// Piezas comunes para describir el bloque C de cada aventura (ver hondaroca.mjs).
export const N = t => ({ speaker: 'narrator', text: t });
export const H = t => ({ speaker: 'hero', text: t });
export const S = (who, t) => ({ speaker: who, text: t });
export const enc = (id, enemies, trigger = 'enter', gold = 0) => ({
  type: 'encounter', id, trigger, can_reinforce: [], new: true, gold_drop: gold,
  enemies: enemies.map(([srd_creature, name, count = 1, row = 'front', weapon]) => ({ srd_creature, name, count, row, weapon, drop_weapon: false })),
  ...(trigger === 'patrol' ? { xp_total: 0, gold_drop: 0 } : {}),
});
export const patrol = (id, enemies) => enc(id, enemies, 'patrol');
export const chest = (id, gold, item) => ({ type: 'chest', id, locked: false, lock_dc: null, gold, item: item ? { id: item } : null });
export const dlg = (id, lines, only) => ({ type: 'dialogue', id, lines, ...(only ? { only } : {}) });
export const scene = o => ({ type: 'scene', ...o });
export const DMG = '1d4';

/** Pista de un secreto: dos vías (Sabiduría e Inteligencia); un fallo cierra solo la que se intentó. */
export const clue = (id, secret, title, text, wis, int, wisLabel, intLabel) => scene({
  id, title, text, question: '¿Cómo lo buscáis?', reveals: secret,
  options: [
    { label: wisLabel, attr: 'wis', dc: wis, ok: { reveal: secret }, fail: { text: 'No dais con ello por ahí.' } },
    { label: intLabel, attr: 'int', dc: int, ok: { reveal: secret }, fail: { text: 'No dais con ello por ahí.' } },
  ],
});

/** Grupo de paso al volver: luchar, esquivarlo (Destreza) o espantarlo (Carisma). Fallar lleva al combate. */
export const passing = (id, encId, title, text, dc, fight, dodge, scare, extra = {}) => scene({
  id, title, text, question: '¿Qué hacéis?', on_return: true, ...extra,
  options: [
    { label: 'Luchar', ok: { text: fight, fight: encId } },
    { label: 'Esquivarlos', attr: 'dex', dc, ok: { text: dodge, remove: encId }, fail: { text: 'Os descubren.', fight: encId } },
    { label: 'Espantarlos', attr: 'cha', dc, ok: { text: scare, remove: encId }, fail: { text: 'No se lo tragan.', fight: encId } },
  ],
});
