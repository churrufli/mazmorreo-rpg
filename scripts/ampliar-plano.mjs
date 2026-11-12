// Amplía una aventura con salas nuevas (bloque C): las añade al diseño (JSON) y al plano hexagonal
// sin tocar las casillas ni las marcas que ya había. Uso: node scripts/ampliar-plano.mjs hondaroca
// Se puede ejecutar más de una vez: las salas que ya están se saltan.
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const root = path.dirname(path.dirname(url.fileURLToPath(import.meta.url)));
const adv = process.argv[2] ?? 'hondaroca';
const DATA = { hondaroca: 'src/data/hondaroca.json', corazon: 'src/data/corazon.json', montana: 'src/data/montana.json' }[adv];
const spec = (await import(`./bloque-c/${adv}.mjs`)).default;
const design = JSON.parse(fs.readFileSync(path.join(root, DATA), 'utf8'));
const planFile = path.join(root, 'src/data/plano.json');
const P = JSON.parse(fs.readFileSync(planFile, 'utf8'));
const MON = parseMonsters();

const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const key = h => `${h[0]},${h[1]}`;
const unkey = k => k.split(',').map(Number);
const nb = h => DIRS.map(d => [h[0] + d[0], h[1] + d[1]]);
const dist = (a, b) => (Math.abs(a[0] - b[0]) + Math.abs(a[0] + a[1] - b[0] - b[1]) + Math.abs(a[1] - b[1])) / 2;

for (const zs of spec.zones) {
  const zone = design.zones.find(z => z.id === zs.id);
  const plan = P.zones[zs.id];
  const occ = new Map(plan.cells.map(c => [key(c), c[2]]));
  const marked = new Set(plan.marks.map(m => `${m.q},${m.r}`));
  const roomIdx = id => zone.rooms.findIndex(r => r.id === id);
  const cellsOf = id => plan.cells.filter(c => c[2] === roomIdx(id)).map(c => [c[0], c[1]]);
  const free = (id, n = 1) => {
    // Casillas libres de una sala, las más alejadas de la entrada primero si n<0.
    const cs = cellsOf(id).filter(c => !marked.has(key(c)) && key(c) !== key(plan.start));
    return cs;
  };
  const put = (q, r, kind, id, extra = {}) => { plan.marks.push({ q, r, kind, id, ...extra }); marked.add(`${q},${r}`); };

  // Salas nuevas.
  for (const nr of zs.rooms ?? []) {
    if (zone.rooms.some(r => r.id === nr.id)) continue;
    const from = nr.attach;
    // Se puede colgar de una sala o del pasadizo de un secreto.
    const secretMark = plan.marks.find(m => m.kind === 'secret' && m.id === nr.secret);
    const anchor = cellsOf(from ?? nr.via);
    if (nr.secret && secretMark?.path) anchor.push(...secretMark.path.map(unkey));
    const anchorSet = new Set(anchor.map(key));
    const best = place(occ, anchorSet, nr.size ?? 10, nr.seed ?? 0);
    if (!best) { console.log(ascii(plan)); throw new Error(`No cabe ${nr.id}`); }
    const idx = zone.rooms.length;
    zone.rooms.push({ id: nr.id, name: nr.name, description: nr.description, exits: [], contents: [] });
    plan.rooms.push(nr.id);
    for (const c of best.corridor) { plan.cells.push([...unkey(c), -1]); occ.set(c, -1); }
    for (const c of best.blob) { plan.cells.push([...unkey(c), idx]); occ.set(c, idx); }
    const fromId = from ?? nr.via;
    const type = nr.secret ? 'secret' : nr.door ?? 'open';
    zone.rooms.find(r => r.id === fromId).exits.push({ to: nr.id, type, key_item_id: null });
    zone.rooms[idx].exits.push({ to: fromId, type, key_item_id: null });
    const entry = unkey(best.corridor[0] ?? best.blob[0]);
    if (nr.secret) {
      // Escondido hasta encontrar el secreto: el pasadizo y la sala entera.
      const hidden = [...best.corridor, ...best.blob];
      if (secretMark?.path) secretMark.path.push(...hidden);
      else put(entry[0], entry[1], 'secret', nr.secret, { path: hidden });
    } else if (type === 'door') put(entry[0], entry[1], 'door', `${fromId}-${nr.id}`);
    // Contenidos y sus marcas: lo importante lejos de la entrada.
    const room = zone.rooms[idx];
    const cells = best.blob.map(unkey).sort((a, b) => dist(b, entry) - dist(a, entry));
    const take = () => { const i = cells.findIndex(c => !marked.has(key(c))); return i < 0 ? undefined : cells.splice(i, 1)[0]; };
    for (const c of nr.contents) {
      room.contents.push(c);
      const kind = { encounter: 'encounter', chest: 'chest', scene: 'scene', rest_point: 'rest', lever: 'lever' }[c.type];
      if (!kind || (c.type === 'encounter' && c.trigger === 'scene') || (c.type === 'encounter' && c.trigger === 'patrol') || c.noMark) continue;
      const h = take();
      put(h[0], h[1], kind, c.id);
    }
    // Decorados: en casillas sueltas que no sean la entrada (los que bloquean solo si no aíslan nada).
    for (const pr of nr.props ?? []) {
      const h = cells.filter(c => !marked.has(key(c)) && dist(c, entry) > 1).pop();
      if (!h) break;
      put(h[0], h[1], 'prop', pr);
      room.contents.push({ type: 'prop', prop: pr, count: 1 });
    }
    // Reja de vuelta: un pasillo desde esta sala hasta otra, cerrado junto a la de destino.
    if (nr.gate) gate(nr.gate.id, nr.id, nr.gate.to, new Set(best.blob));
  }
  // Rejas entre dos salas que ya estaban (la palanca va en `add` de la sala de origen).
  for (const gt of zs.gates ?? []) if (!plan.marks.some(m => m.kind === 'gate' && m.id === gt.id)) gate(gt.id, gt.from, gt.to, new Set(cellsOf(gt.from).map(key)));

  function gate(id, fromId, toId, fromSet) {
    const toCells = new Set(cellsOf(toId).map(key));
    const pathC = corridor(occ, fromSet, toCells);
    if (!pathC) throw new Error(`Sin camino para la reja ${id}`);
    for (const c of pathC) { plan.cells.push([...unkey(c), -1]); occ.set(c, -1); }
    const last = unkey(pathC[pathC.length - 1]);
    put(last[0], last[1], 'gate', id);
    zone.rooms.find(r => r.id === fromId).exits.push({ to: toId, type: 'gate', key_item_id: null });
    zone.rooms.find(r => r.id === toId).exits.push({ to: fromId, type: 'gate', key_item_id: null });
  }

  // Contenidos nuevos en salas que ya existían.
  for (const [roomId, list] of Object.entries(zs.add ?? {})) {
    const room = zone.rooms.find(r => r.id === roomId);
    for (const c of list) {
      if (room.contents.some(x => x.id && x.id === c.id)) continue;
      room.contents.push(c);
      const kind = { chest: 'chest', lever: 'lever' }[c.type];
      if (kind) { const h = free(roomId).filter(x => !marked.has(key(x))).pop(); put(h[0], h[1], kind, c.id); }
      if (c.type === 'scene' && !c.noMark) {
        const near = (c.near ?? c.reveals) ? plan.marks.find(m => m.id === (c.near ?? c.reveals)) : undefined;
        const cs = free(roomId).filter(h => !nb(h).some(n => marked.has(key(n)) && plan.marks.some(m => m.kind === 'door' && key([m.q, m.r]) === key(n))));
        const pickC = near ? cs.sort((a, b) => dist(a, [near.q, near.r]) - dist(b, [near.q, near.r]))[0] : cs[Math.floor(cs.length / 2)];
        if (!pickC) throw new Error(`Sin sitio para ${c.id} en ${roomId}`);
        put(pickC[0], pickC[1], 'scene', c.id);
      }
    }
  }

  // Pendientes del diario.
  if (zs.pending) zone.pending = zs.pending;
  // Textos que cambian (diálogos de entrada recortados, presentaciones...).
  if (zs.entry) zone.entry_dialogue = zs.entry;

  // Mismo PX y oro en total que antes: se reparten entre todos los combates y cofres de la zona.
  const all = zone.rooms.flatMap(r => r.contents);
  // Los combates que se pueden saltar (áreas secretas, los que dependen de una decisión) son un extra con sus PX del SRD.
  const bonusIds = new Set((zs.rooms ?? []).filter(r => r.secret).flatMap(r => r.contents.map(c => c.id)));
  const encs = all.filter(c => c.type === 'encounter' && c.trigger !== 'patrol' && c.trigger !== 'scene' && !bonusIds.has(c.id));
  const isNew = c => c.new;
  for (const c of all.filter(x => x.type === 'encounter' && x.trigger !== 'patrol' && isNew(x))) c.xp_total ??= c.enemies.reduce((s, e) => s + (MON[e.srd_creature] ?? 25) * e.count, 0);
  const T = zs.totals ?? (zs.totals = { xp: encs.filter(c => !isNew(c)).reduce((s, c) => s + c.xp_total, 0) });
  const sumXp = encs.reduce((s, c) => s + c.xp_total, 0);
  if (sumXp !== T.xp && !zone.c_scaled) {
    const k = T.xp / sumXp;
    for (const c of encs) c.xp_total = Math.max(5, Math.round((c.xp_total * k) / 5) * 5);
    zone.c_scaled = true;
  }
  // Oro: lo mismo, contando el de cofres nuevos y el que dan las escenas al salir bien.
  if (!zone.c_gold) {
    const box = all.filter(c => (c.type === 'encounter' && c.trigger !== 'patrol') || c.type === 'chest');
    const old = box.filter(c => !c.new && !(zs.rooms ?? []).some(r => r.contents.includes(c))).reduce((s, c) => s + (c.gold_drop ?? c.gold ?? 0), 0);
    const sceneGold = all.filter(c => c.type === 'scene').reduce((s, c) => s + Math.max(0, ...c.options.map(o => o.ok.gold ?? 0)), 0);
    const now = box.reduce((s, c) => s + (c.gold_drop ?? c.gold ?? 0), 0) + sceneGold;
    const k = old / now;
    for (const c of box) { if (c.type === 'chest' && c.gold) c.gold = Math.max(1, Math.round(c.gold * k)); if (c.type === 'encounter' && c.gold_drop) c.gold_drop = Math.max(1, Math.round(c.gold_drop * k)); }
    for (const c of all.filter(x => x.type === 'scene')) for (const o of c.options) for (const e of [o.ok, o.fail]) if (e?.gold > 0) e.gold = Math.max(1, Math.round(e.gold * k));
    zone.c_gold = true;
    console.log(zs.id, 'oro', old, '->', now, 'factor', k.toFixed(2));
  }
  for (const c of all) delete c.new;
}

fs.writeFileSync(path.join(root, DATA), JSON.stringify(design, null, 2) + '\n');
fs.writeFileSync(planFile, JSON.stringify(P));
console.log('Hecho.');
for (const zs of spec.zones) console.log(zs.id, ascii(P.zones[zs.id]));

// ---------- Colocación ----------

/** Busca hueco para una sala de `size` casillas cerca de las de `anchor`, separada de todo lo demás. */
function place(occ, anchor, size, seed) {
  const anchorCells = [...anchor].map(unkey);
  const cands = new Map();
  for (const a of anchorCells) for (let dq = -14; dq <= 14; dq++) for (let dr = -14; dr <= 14; dr++) {
    const c = [a[0] + dq, a[1] + dr];
    const d = dist(a, c);
    if (d >= 3 && d <= (anchorCells.length > 60 ? 11 : 14)) cands.set(key(c), c);
  }
  let best;
  const list = [...cands.values()].sort((a, b) => key(a) < key(b) ? -1 : 1);
  for (const c of list) {
    const blob = grow(c, size);
    // Ninguna casilla de la sala pegada a otra cosa (deja una de pared entre medias).
    if (blob.some(b => occ.has(key(b)) || nb(b).some(n => occ.has(key(n))))) continue;
    const pathC = corridor(occ, new Set(blob.map(key)), anchor);
    if (!pathC) continue;
    const score = pathC.length * 10 + ((c[0] * 7 + c[1] * 13 + seed * 31) % 10 + 10) % 10;
    // El pasillo, de la sala de partida hacia la nueva.
    if (!best || score < best.score) best = { score, blob: blob.map(key), corridor: pathC.reverse() };
  }
  return best;
}

/** Mancha compacta alrededor de un centro. */
function grow(c, size) {
  const out = [c];
  const seen = new Set([key(c)]);
  let ring = [c];
  while (out.length < size) {
    const next = [];
    for (const h of ring) for (const n of nb(h)) if (!seen.has(key(n))) { seen.add(key(n)); next.push(n); }
    for (const n of next) { if (out.length < size) out.push(n); }
    ring = next;
  }
  return out;
}

/** Pasillo más corto (BFS) desde la sala nueva hasta tocar `to`, sin rozar otras salas. Devuelve del lado de la nueva al de destino. */
function corridor(occ, fromSet, toSet) {
  const ok = k => !occ.has(k) && !fromSet.has(k) && nb(unkey(k)).every(n => !occ.has(key(n)) || toSet.has(key(n)) || fromSet.has(key(n)));
  const prev = new Map();
  const q = [];
  for (const f of fromSet) for (const n of nb(unkey(f))) { const k = key(n); if (ok(k) && !prev.has(k)) { prev.set(k, ''); q.push(k); } }
  while (q.length) {
    const k = q.shift();
    if (nb(unkey(k)).some(n => toSet.has(key(n)))) {
      const out = [];
      for (let x = k; x; x = prev.get(x)) out.unshift(x);
      return out;
    }
    if (prev.size > 4000) return undefined;
    for (const n of nb(unkey(k))) { const nk = key(n); if (!prev.has(nk) && ok(nk)) { prev.set(nk, k); q.push(nk); } }
  }
  return undefined;
}

function ascii(p) {
  const cm = new Map(p.cells.map(c => [key(c), c[2]]));
  const mk = new Map(p.marks.map(m => [`${m.q},${m.r}`, m.kind[0]]));
  const qs = p.cells.map(c => c[0]), rs = p.cells.map(c => c[1]);
  const lines = [];
  for (let r = Math.min(...rs); r <= Math.max(...rs); r++) {
    let s = ' '.repeat(r - Math.min(...rs));
    for (let q = Math.min(...qs); q <= Math.max(...qs); q++) {
      const k = `${q},${r}`;
      const v = cm.get(k);
      s += (v === undefined ? ' ' : mk.get(k) ?? (v < 0 ? '·' : 'abcdefghijklmnopqrstuvwxyz'[v])) + ' ';
    }
    lines.push(s);
  }
  return '\n' + lines.join('\n');
}

function parseMonsters() {
  const ts = fs.readFileSync(path.join(root, 'src/data/srd.ts'), 'utf8');
  const i = ts.indexOf('export const MONSTERS');
  const out = {};
  for (const m of ts.slice(i, i + 40000).matchAll(/^ {2}(?:'([^']+)'|(\w+)): \{\n\s+name: '[^']+'.*?xp: (\d+)/gms)) out[m[1] || m[2]] = +m[3];
  return out;
}
