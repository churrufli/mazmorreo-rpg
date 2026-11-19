// Comentarios breves de los compañeros (2026-11-19).
import { newGame, Game } from './game';
import { enterZone } from './dungeon';
import { chooseOption, sceneById } from './escenas';
import { createAlly } from './rules';
import { TONE_LINES } from '../data/comentarios';
import hondaroca from '../data/hondaroca.json';
import corazon from '../data/corazon.json';
import montana from '../data/montana.json';
import tumba from '../data/tumba.json';

function party(zone: string, allies: string[]): Game {
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  g.rng.seed = 3;
  for (const a of allies) g.party.push(createAlly(a, 3, 900));
  enterZone(g, zone);
  return g;
}
const says = (evs: any[], who: string) => evs.some(e => e.kind === 'dialogue' && e.lines.some((l: any) => l.speaker === who));

describe('comentarios de los compañeros', () => {
  it('un compañero reacciona a una decisión con tono', () => {
    const g = party('z4', ['tiko']);
    const s = sceneById('z4_ev01')!;
    const evs = chooseOption(g, 'z4_ev01', s.options.findIndex(o => o.tone === 'piedad'));
    expect(says(evs, 'tiko')).toBe(true);
  });

  it('sin compañeros, nadie comenta', () => {
    const g = party('z4', []);
    const s = sceneById('z4_ev01')!;
    const evs = chooseOption(g, 'z4_ev01', s.options.findIndex(o => o.tone === 'piedad'));
    expect(evs.some(e => e.kind === 'dialogue')).toBe(false);
  });

  it('comenta un lugar de su propia aventura al entrar por primera vez', () => {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    g.party.push(createAlly('tiko', 3, 900));
    expect(says(enterZone(g, 'z4'), 'tiko')).toBe(true);
  });

  it('todos los tonos de las aventuras tienen frase para cada compañero', () => {
    const tones = new Set<string>();
    for (const d of [hondaroca, corazon, montana, tumba] as any[])
      for (const z of d.zones) for (const r of z.rooms) for (const c of r.contents) for (const o of c.options ?? []) if (o.tone) tones.add(o.tone);
    expect(tones.size).toBeGreaterThan(0);
    for (const lines of Object.values(TONE_LINES)) for (const t of tones) expect((lines as any)[t]).toBeTruthy();
  });
});
