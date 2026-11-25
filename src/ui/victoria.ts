// Líneas del cuadro de victoria con formato: banda de subida de nivel, novedades del personaje y resumen
// (el autor 2026-11-25: «con un formato bonito, como el registro de combate»).

export type Linea =
  | { kind: 'level'; title: string; hp?: string }
  | { kind: 'feature'; tag?: string; name: string; text: string }
  | { kind: 'summary'; text: string }
  | { kind: 'plain'; text: string };

const SUMMARY = [/ gana \d+ PX\.$/, /^Cada miembro del grupo gana/, /^Nivel \d+ es el máximo/, /^Botín:/];

/** Clasifica las líneas: lo que sigue a una subida de nivel son novedades de ese personaje hasta el resumen. */
export function victoryLines(lines: string[]): Linea[] {
  const out: Linea[] = [];
  let inLevel = false;
  for (const l of lines) {
    const lv = /^(¡.+ sube a nivel \d+!) \(\+(\d+) PG\)\s*(.*)$/.exec(l);
    if (lv) {
      out.push({ kind: 'level', title: lv[1], hp: `+${lv[2]} PG` });
      if (lv[3]) out.push({ kind: 'feature', name: 'Mejora', text: lv[3] });
      inLevel = true;
      continue;
    }
    if (SUMMARY.some(r => r.test(l))) { out.push({ kind: 'summary', text: l }); inLevel = false; continue; }
    if (inLevel) {
      // «Nueva habilidad: Nombre. Descripción.» → etiqueta, nombre y descripción.
      const nu = /^(Nueva [^:]+|Mejora de [^:]+|Patrón [^:]+): ([^.]+)\.\s*(.*)$/.exec(l);
      if (nu) { out.push({ kind: 'feature', tag: nu[1], name: nu[2], text: nu[3] }); continue; }
      const kv = /^([^:]{2,40}): (.+)$/.exec(l);
      if (kv) { out.push({ kind: 'feature', name: kv[1], text: kv[2] }); continue; }
      inLevel = false;
    }
    out.push({ kind: 'plain', text: l });
  }
  return out;
}
