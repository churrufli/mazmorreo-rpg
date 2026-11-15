import { newGame, Game } from './game';
import { hkey, neighbors, passable, plan, step, zoneById } from './dungeon';
import { newItem } from './rules';
import { MONSTERS } from '../data/srd';

/** Partida en una zona con las salas ya visitadas (sin avisos de sala por medio). */
function game(torch: boolean): Game {
  const g = newGame(1, 'Prueba', 'fighter', 'human');
  g.visited = plan(g.zone).cells.map(([q, r]) => hkey([q, r]));
  g.done = zoneById(g.zone).rooms.map(r => r.id);
  if (torch) g.party[0].items.push(newItem('torch'));
  return g;
}

/** Una casilla transitable junto a la posición, sin nada encima. */
function free(g: Game) {
  const pass = passable(g, g.zone);
  const marks = new Set(plan(g.zone).marks.map(m => `${m.q},${m.r}`));
  return neighbors(g.pos).find(n => pass.has(hkey(n)) && !marks.has(hkey(n)))!;
}

test('sin luz, el grupo comenta una vez por aventura que le falta una antorcha y dónde comprarla', () => {
  const g = game(false);
  const evs = step(g, free(g));
  const tip = evs.find(e => e.kind === 'dialogue');
  expect(tip && tip.kind === 'dialogue' && tip.lines[0].text).toMatch(/antorcha.*Valdescarcha/);
  expect(step(g, free(g)).some(e => e.kind === 'dialogue')).toBe(false);
});

test('con antorcha no hay comentario', () => {
  const g = game(true);
  expect(step(g, free(g)).some(e => e.kind === 'dialogue')).toBe(false);
});

test('fichas del SRD 5.2.1: sectario solo con hoz ritual y enjambre más flojo maltrecho', () => {
  expect(MONSTERS.Cultist.attacks.map(a => a.name)).toEqual(['Hoz ritual']);
  expect(MONSTERS['Swarm of Bats'].attacks[0].bloodied).toBe('1d4');
  expect(MONSTERS['Goblin Boss'].saves.cha).toBe(0);
});
