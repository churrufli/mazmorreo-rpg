// Lista de enemigos del cartel «¡Combate!»: agrupa los repetidos («dos enjambres de murciélagos»).

const NUM = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho'];
const CORTE = new Set(['de', 'del', 'sin', 'con', 'en', 'a', 'al']);
const SIN_TILDE: Record<string, string> = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' };

/** Plural de una palabra en español (casos de los nombres de las aventuras). */
function pluralWord(w: string, first: boolean): string {
  const low = w.toLowerCase();
  if (low === 'goblin' || low === 'kobold') return first ? `${w}s` : w;
  if (/[sx]$/i.test(w)) return w;
  if (/[aeiouáéó]$/i.test(w)) return `${w}s`;
  if (/z$/i.test(w)) return `${w.slice(0, -1)}ces`;
  if (/[nlrdjy]$/i.test(w)) return `${w.replace(/[áéíóú](?=n$)/, c => SIN_TILDE[c])}es`;
  return `${w}s`;
}

/** «Enjambre de murciélagos» → «enjambres de murciélagos»: plural hasta la primera preposición. */
export function plural(name: string): string {
  const words = name.split(' ');
  const cut = words.findIndex((w, i) => i > 0 && CORTE.has(w.toLowerCase()));
  const end = cut < 0 ? words.length : cut;
  return words.map((w, i) => (i < end ? pluralWord(w, i === 0) : w)).join(' ');
}

/** Nombres de los enemigos (con el número de orden si se repiten) → texto del cartel. */
export function foeList(names: string[]): string {
  const groups: [string, number][] = [];
  for (const n of names) {
    const base = n.replace(/ \d+$/, '');
    const g = groups.find(x => x[0] === base);
    if (g) g[1]++;
    else groups.push([base, 1]);
  }
  const parts = groups.map(([n, c], i) => {
    if (c === 1) return i ? n.charAt(0).toLowerCase() + n.slice(1) : n;
    const p = `${NUM[c] ?? c} ${plural(n.charAt(0).toLowerCase() + n.slice(1))}`;
    return i ? p : p.charAt(0).toUpperCase() + p.slice(1);
  });
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} y ${parts[parts.length - 1]}` : parts[0] ?? '';
}
