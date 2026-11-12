// Genera el plano hexagonal FIJO de cada aventura (src/data/hondaroca.json, corazon.json y montana.json).
// OJO: las zonas ya publicadas tienen marcas recolocadas a mano (obstáculos). Al añadir una aventura, copia en plano.json
// solo las zonas nuevas de la salida de este script; no sobrescribas las demás o se moverían en las partidas guardadas.
// Salida: src/data/plano.json (lo lee la app) y plano-<zona>.svg (para revisarlo a ojo).
// Uso: node scripts/generar-plano.mjs [carpeta-svg]
import fs from 'node:fs';

const OUT_SVG = process.argv[2];
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const key = (q, r) => `${q},${r}`;
const dist = (a, b) => (Math.abs(a[0] - b[0]) + Math.abs(a[0] + a[1] - b[0] - b[1]) + Math.abs(a[1] - b[1])) / 2;
const px = ([q, r]) => [Math.sqrt(3) * (q + r / 2), 1.5 * r];

// Semilla fija para que el plano salga siempre igual.
let seed;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

// La sala crece desde el centro añadiendo siempre la casilla vecina con menor "coste" según su forma,
// así queda siempre conectada.
function roomCells(center, size, shape) {
  const score = c => {
    const [x, y] = px([c[0] - center[0], c[1] - center[1]]);
    if (shape === 'corridor' || shape === 'long') return Math.abs(x) * 3 + Math.abs(y);
    if (shape === 'cross') return Math.min(Math.abs(x), Math.abs(y)) * 3 + Math.max(Math.abs(x), Math.abs(y));
    if (shape === 'irregular') return Math.hypot(x, y) + rnd() * 1.6;
    return Math.hypot(x, y);
  };
  const cells = [center];
  const inSet = new Set([key(...center)]);
  const frontier = new Map();
  const addN = c => DIRS.forEach(([dq, dr]) => {
    const n = [c[0] + dq, c[1] + dr], k = key(...n);
    if (!inSet.has(k) && !frontier.has(k)) frontier.set(k, [score(n), n]);
  });
  addN(center);
  while (cells.length < size) {
    const [k, [, c]] = [...frontier.entries()].sort((a, b) => a[1][0] - b[1][0])[0];
    frontier.delete(k); inSet.add(k); cells.push(c); addN(c);
  }
  return cells;
}

function line(a, b) {
  const n = dist(a, b);
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = n === 0 ? 0 : i / n;
    // interpolación cúbica redondeada
    let x = a[0] + (b[0] - a[0]) * t + 1e-6, z = a[1] + (b[1] - a[1]) * t + 1e-6, y = -x - z;
    let rx = Math.round(x), rz = Math.round(z), ry = Math.round(y);
    const dx = Math.abs(rx - x), dy = Math.abs(ry - y), dz = Math.abs(rz - z);
    if (dx > dy && dx > dz) rx = -ry - rz; else if (dy <= dz) rz = -rx - ry;
    out.push([rx, rz]);
  }
  return out;
}

const plano = { zones: {} };
for (const file of ['hondaroca', 'corazon', 'montana']) {
const D = JSON.parse(fs.readFileSync(`src/data/${file}.json`, 'utf8'));
seed = 20261101;
for (const zone of D.zones) {
  const rooms = zone.rooms;
  const cellRoom = new Map(); // key -> índice de sala (-1 = pasillo)
  const roomCellsList = [];
  let y = 0;
  rooms.forEach((room, i) => {
    const side = i % 2 === 0 ? -3 : 3;
    for (let tries = 0; ; tries++) {
      const r = y + tries;
      const center = [Math.round(side - r / 2), r];
      const cells = roomCells(center, room.size_hexes, room.shape);
      const clash = cells.some(c => [...cellRoom.keys()].some(k => dist(c, k.split(',').map(Number)) < 3));
      if (!clash) {
        cells.forEach(c => cellRoom.set(key(...c), i));
        roomCellsList.push(cells);
        y = r + 2;
        break;
      }
    }
  });

  const marks = [];
  const corridors = [];
  const idx = Object.fromEntries(rooms.map((r, i) => [r.id, i]));
  const links = [];
  rooms.forEach((room, i) => {
    for (const e of room.exits) if (idx[e.to] !== undefined && idx[e.to] > i) links.push([i, idx[e.to], e.type]);
    for (const c of room.contents)
      if (c.type === 'secret' && c.reveals.startsWith('exit:')) {
        const j = idx[c.reveals.slice(5)];
        if (j !== undefined && !links.some(l => (l[0] === i && l[1] === j) || (l[0] === j && l[1] === i))) links.push([i, j, 'secret', c.id]);
        else { const l = links.find(l2 => (l2[0] === i && l2[1] === j) || (l2[0] === j && l2[1] === i)); if (l) l[3] = c.id; }
      }
  });
  // Si un secreto apunta a una salida ya marcada como secreta, se enlaza con ella.
  const entry = rooms.map(() => null);
  for (const [a, b, type, secretId] of links) {
    let best = null;
    for (const ca of roomCellsList[a]) for (const cb of roomCellsList[b]) {
      const d = dist(ca, cb);
      if (!best || d < best[0]) best = [d, ca, cb];
    }
    const path = line(best[1], best[2]).slice(1, -1).filter(c => !cellRoom.has(key(...c)));
    path.forEach(c => cellRoom.set(key(...c), -1));
    const mid = path[Math.floor(path.length / 2)] ?? best[2];
    const kind = type === 'open' ? null : type === 'stairs_down' ? 'stairs' : type;
    if (kind) marks.push({ q: mid[0], r: mid[1], kind, id: secretId ?? `${rooms[a].id}-${rooms[b].id}`, path: kind === 'secret' ? path.map(c => key(...c)) : undefined });
    corridors.push(path);
    if (b === a + 1 && !entry[b]) entry[b] = best[2];
  }

  // Entrada de la zona: celda más alta de la primera sala.
  const first = [...roomCellsList[0]].sort((p, q) => p[1] - q[1])[0];
  entry[0] = first;
  const start = first;

  rooms.forEach((room, i) => {
    const ent = entry[i] ?? roomCellsList[i][0];
    const used = new Set([key(...ent)]);
    const free = roomCellsList[i].filter(c => key(...c) !== key(...ent)).sort((p, q) => dist(q, ent) - dist(p, ent));
    const take = (far = true) => {
      const list = far ? free : [...free].reverse();
      const c = list.find(x => !used.has(key(...x)) && !marks.some(m => m.q === x[0] && m.r === x[1]));
      if (c) used.add(key(...c));
      return c ?? ent;
    };
    for (const c of room.contents) {
      if (c.type === 'encounter') { const p = take(); marks.push({ q: p[0], r: p[1], kind: 'encounter', id: c.id }); }
      if (c.type === 'chest') { const p = take(); marks.push({ q: p[0], r: p[1], kind: 'chest', id: c.id }); }
      if (c.type === 'rest_point') { const p = take(false); marks.push({ q: p[0], r: p[1], kind: 'rest', id: c.id }); }
      if (c.type === 'trap') {
        // La trampa va en la celda de entrada: siempre se pisa.
        const p = room.contents.filter(t => t.type === 'trap').indexOf(c) === 0 ? ent : take(false);
        marks.push({ q: p[0], r: p[1], kind: 'trap', id: c.id });
      }
    }
    for (const c of room.contents) if (c.type === 'prop') for (let n = 0; n < (c.count ?? 1); n++) {
      const free2 = roomCellsList[i].filter(x => !used.has(key(...x)) && !marks.some(m => m.q === x[0] && m.r === x[1]));
      if (!free2.length) break;
      const p = free2[Math.floor(rnd() * free2.length)];
      used.add(key(...p));
      marks.push({ q: p[0], r: p[1], kind: 'prop', id: c.prop });
    }
    for (const e of room.exits) if (idx[e.to] === undefined && e.to.split('_')[0] > zone.id) {
      const p = [...roomCellsList[i]].sort((a, b) => b[1] - a[1]).find(x => !marks.some(m => m.q === x[0] && m.r === x[1])) ?? ent;
      marks.push({ q: p[0], r: p[1], kind: 'exit', id: e.to.split('_')[0] });
    }
  });
  // Bosque: decorados automáticos (árboles, rocas, setas...) para que el mapa no quede vacío. Van con su propio
  // azar, después de todo lo demás, para no mover nada de lo ya colocado; blockedCells cuida de no cortar el paso.
  const AUTO = { b1: ['big_tree', 'mossy_rock', 'mushrooms', 'thorn_bush', 'stump'], b2: ['big_tree', 'fallen_tree', 'mushrooms', 'mossy_rock', 'stump', 'totem'],
    b3: ['swamp_water', 'swamp_water', 'fallen_tree', 'mushrooms', 'stump'], b4: ['big_tree', 'thorn_bush', 'mossy_rock', 'mushrooms', 'totem'],
    // Montaña: pinos y rocas nevadas fuera; hielo y piedra enana dentro.
    m1: ['pine', 'pine', 'snow_rock', 'fallen_pine'], m2: ['pine', 'pine', 'fallen_pine', 'snow_rock', 'frozen_pool'],
    m3: ['snow_rock', 'ice_pillar', 'dwarf_statue', 'bone_pile'], m4: ['ice_pillar', 'ice_pillar', 'snow_rock', 'crevasse', 'bone_pile'] }[zone.id];
  if (AUTO) {
    let s2 = 7 + zone.id.charCodeAt(1);
    const r2 = () => ((s2 = (s2 * 1103515245 + 12345) % 2147483648) / 2147483648);
    roomCellsList.forEach(cells => {
      const free = cells.filter(x => !marks.some(m => m.q === x[0] && m.r === x[1]) && key(...x) !== key(...start));
      for (let n = Math.round(cells.length / 5); n > 0 && free.length; n--) {
        const p = free.splice(Math.floor(r2() * free.length), 1)[0];
        marks.push({ q: p[0], r: p[1], kind: 'prop', id: AUTO[Math.floor(r2() * AUTO.length)] });
      }
    });
  }

  // Laberinto (el autor 2026-11-03): bifurcaciones. Solo se AÑADEN casillas de pasillo, con su propio azar, para no
  // mover nada de lo ya colocado (las partidas guardadas siguen valiendo).
  {
    let s3 = 31 + zone.id.charCodeAt(0) * 7 + zone.id.charCodeAt(1) * 13;
    const r3 = () => ((s3 = (s3 * 1103515245 + 12345) % 2147483648) / 2147483648);
    const nb = c => DIRS.map(([dq, dr]) => [c[0] + dq, c[1] + dr]);
    // Una casilla nueva no puede tocar nada salvo la casilla de la que sale (así queda un pasillo con paredes).
    const isolated = (c, from, extra, okSet) => !cellRoom.has(key(...c)) && nb(c).every(n => key(...n) === key(...from) || okSet?.has(key(...n)) || (!cellRoom.has(key(...n)) && !extra.has(key(...n))));
    // Ramales sin salida que serpentean desde los pasillos y acaban en un rincón.
    corridors.forEach((path, ci) => {
      if (path.length < 2 || marks.some(m => m.kind === 'secret' && m.path?.includes(key(...path[0])))) return;
      if (r3() < 0.35) return;
      const from = path[Math.floor(r3() * path.length)];
      let d = Math.floor(r3() * 6), prev = from;
      const branch = [];
      const mine = new Set();
      for (let n = 0, len = 3 + Math.floor(r3() * 4); n < len; n++) {
        const turns = (n === 0 ? [0, 1, 2, 3, 4, 5] : [0, r3() < 0.5 ? 1 : 5, r3() < 0.5 ? 5 : 1]).map(t => (d + t) % 6);
        const okSet = n === 0 ? new Set(path.map(c => key(...c))) : undefined; // el primer paso puede rozar su propio pasillo
        const ok = turns.find(t => { const c = [prev[0] + DIRS[t][0], prev[1] + DIRS[t][1]]; return isolated(c, prev, mine, okSet); });
        if (ok === undefined) break;
        if (ok !== d && r3() < 0.6) d = ok; // a veces gira y sigue en la nueva dirección
        const c = [prev[0] + DIRS[ok][0], prev[1] + DIRS[ok][1]];
        mine.add(key(...prev)); branch.push(c); prev = c;
        if (r3() < 0.35) d = (d + (r3() < 0.5 ? 1 : 5)) % 6;
      }
      if (branch.length < 3) return;
      branch.forEach(c => cellRoom.set(key(...c), -1));
      // Rincón al final: una o dos casillas más.
      const end = branch[branch.length - 1];
      const nook = nb(end).filter(c => !cellRoom.has(key(...c)) && nb(c).every(n => key(...n) === key(...end) || !cellRoom.has(key(...n)) || branch.some(b => key(...b) === key(...n)) && dist(n, end) <= 1)).slice(0, 2);
      nook.forEach(c => cellRoom.set(key(...c), -1));
    });
    // Atajos: un segundo camino entre salas no consecutivas, para que haya que elegir. Nunca toca salas o pasillos secretos.
    const secretCells = new Set(marks.filter(m => m.kind === 'secret').flatMap(m => m.path ?? []));
    const secretRooms = new Set(links.filter(l => l[2] === 'secret').flatMap(l => [l[0], l[1]]));
    for (let i = 0; i + 2 < rooms.length; i++) {
      const j = i + 2;
      if (secretRooms.has(i) || secretRooms.has(j) || secretRooms.has(i + 1) || r3() < 0.4) continue;
      let best = null;
      for (const ca of roomCellsList[i]) for (const cb of roomCellsList[j]) { const dd = dist(ca, cb); if (!best || dd < best[0]) best = [dd, ca, cb]; }
      const path = line(best[1], best[2]).slice(1, -1);
      const bad = path.some(c => secretCells.has(key(...c)) || nb(c).some(n => secretCells.has(key(...n)) || secretRooms.has(cellRoom.get(key(...n)))));
      if (bad || path.length < 2) continue;
      path.filter(c => !cellRoom.has(key(...c))).forEach(c => cellRoom.set(key(...c), -1));
    }
  }

  const cells = [...cellRoom.entries()].map(([k, room]) => [...k.split(',').map(Number), room]);
  plano.zones[zone.id] = { rooms: rooms.map(r => r.id), start, cells, marks };

  if (OUT_SVG) {
    const S = 14;
    const pts = cells.map(c => px(c).map(v => v * S));
    const minX = Math.min(...pts.map(p => p[0])) - 30, minY = Math.min(...pts.map(p => p[1])) - 30;
    const maxX = Math.max(...pts.map(p => p[0])) + 30, maxY = Math.max(...pts.map(p => p[1])) + 30;
    const hex = (x, y) => DIRS.map((_, i) => { const a = Math.PI / 180 * (60 * i - 30); return `${(x + S * Math.cos(a)).toFixed(1)},${(y + S * Math.sin(a)).toFixed(1)}`; }).join(' ');
    const col = { door: '#a0522d', secret: '#9b59b6', stairs: '#ffffff', encounter: '#c0392b', chest: '#f1c40f', trap: '#e67e22', rest: '#27ae60', prop: '#7f8c8d', exit: '#3498db' };
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${maxX - minX}" height="${maxY - minY + 20}" viewBox="${minX} ${minY - 20} ${maxX - minX} ${maxY - minY + 20}"><rect x="${minX}" y="${minY - 20}" width="100%" height="100%" fill="#111"/>`;
    svg += `<text x="${minX + 6}" y="${minY - 4}" fill="#e0b56e" font-size="14">${zone.name}</text>`;
    cells.forEach((c, i) => { svg += `<polygon points="${hex(...pts[i])}" fill="${c[2] < 0 ? '#3a3026' : ['#5b4a38', '#6b5843'][c[2] % 2]}" stroke="#222"/>`; });
    marks.forEach(m => { const [x, y] = px([m.q, m.r]).map(v => v * S); svg += `<circle cx="${x}" cy="${y}" r="${m.kind === 'prop' ? 3 : 6}" fill="${col[m.kind]}"/>`; });
    rooms.forEach((r, i) => { const [x, y] = px(roomCellsList[i][0]).map(v => v * S); svg += `<text x="${x}" y="${y}" fill="#fff" font-size="10" text-anchor="middle">${r.id.split('_')[1]}</text>`; });
    const [sx, sy] = px(start).map(v => v * S); svg += `<circle cx="${sx}" cy="${sy}" r="8" fill="none" stroke="#3498db" stroke-width="2"/>`;
    fs.writeFileSync(`${OUT_SVG}/plano-${zone.id}.svg`, svg + '</svg>');
  }
}
}
fs.writeFileSync('src/data/plano.json', JSON.stringify(plano));
console.log(Object.entries(plano.zones).map(([z, v]) => `${z}: ${v.cells.length} casillas, ${v.marks.length} marcas`).join('\n'));
