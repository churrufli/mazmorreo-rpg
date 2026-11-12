import { AppState, Vibration } from 'react-native';
import Sound from 'react-native-sound';
import * as storage from './storage';
import { useStore } from './store';
import type { Combat } from './engine/combat';
import type { Game } from './engine/game';
import { DmgType, ITEMS } from './data/srd';
import { bossEncounter } from './engine/dungeon';

/** Efectos de sonido y ambiente. Los archivos están en android/app/src/main/res/raw (OGG). */

type Fx = 'dado' | 'arrow_shot' | 'chest_open' | 'click_soft' | 'coin_pickup' | 'coins_pouch' | 'confirm' | 'door_wood_open' | 'error'
  | 'explosion_big' | 'fireball' | 'heal' | 'ice_spell' | 'lightning' | 'monster_growl' | 'potion_drink' | 'punch' | 'slime'
  | 'sword_hit_shield' | 'sword_swing' | 'ui_nivel' | 'ui_victoria' | 'ui_victoria_corta' | 'ui_objeto' | 'ui_derrota';

/** Variantes de cada efecto: se elige una al azar para que no suene siempre igual. */
const VARIANTS: Partial<Record<Fx, string[]>> = { sword_swing: ['02'], dado: ['01'] };
const files = (k: Fx) => (k.startsWith('ui_') ? [k] : (VARIANTS[k] ?? ['01', '02']).map(v => `sfx_${k}_${v}`));

/** Volumen: los del mapa más bajos que los del combate. */
const MAP = 0.4;
const STEPS = 0.22;
const AMB = 0.18;
const AMB_COMBAT = 0.1;

/** Efectos sonando ahora: cada uno usa su propio reproductor y se libera al acabar (sin cargar todos a la vez). */
let playing = 0;
const MAX_FX = 6;


const note = (_name: string, _err: unknown) => undefined;

const soundOn = () => storage.getFlag('sound');
/** Barras de Ajustes (0 a 10). Ambiente y efectos empiezan en 4. */
export const VOL_DEF = { musica: 10, ambiente: 4, efectos: 4 } as const;
export const level = (k: keyof typeof VOL_DEF) => storage.getLevel(k, VOL_DEF[k]) / 10;
const musicOn = () => storage.getFlag('music');
/** Vibración corta (golpes recibidos, críticos, trampas); se apaga en Ajustes. */
export const vibra = (ms: number) => { if (storage.getFlag('vibra')) Vibration.vibrate(ms); };

/** Un dado rodando. Cada dado que se tira llama a esto con su retraso, así varios dados suenan como varios. */
export function dado(delay = 0) {
  setTimeout(() => sfx('dado', 0.75 + Math.random() * 0.25), delay + Math.random() * 40);
}

export function sfx(k: Fx, vol = 1) {
  vol *= level('efectos');
  if (!soundOn() || playing >= MAX_FX || vol <= 0) return;
  const list = files(k);
  const name = list[Math.floor(Math.random() * list.length)];
  playing++;
  const s = new Sound(name, '', err => {
    if (err) { note(name, err); playing--; s.release(); return; }
    let over = false;
    const end = () => { if (over) return; over = true; playing--; s.release(); };
    s.setVolume(vol);
    s.play(end);
    setTimeout(end, 8000); // por si el aviso de fin no llega

  });
}

/** Sonido que se repite mientras dure (pasos, ambiente). */
function loop(name: string | undefined, cur: { name?: string; s?: Sound }, vol: number) {
  if (cur.name !== name) {
    const old = cur.s;
    old?.stop(() => old.release());
    cur.name = name;
    cur.s = undefined;
    if (!name) return;
    const s = new Sound(name, '', err => {
      if (err) note(name, err);
      if (err || cur.name !== name) { s.release(); return; }
      cur.s = s;
      s.setNumberOfLoops(-1);
      s.setVolume(vol);
      s.play();
    });
    return;
  }
  cur.s?.setVolume(vol);
}

const steps: { name?: string; s?: Sound } = {};
const amb: { name?: string; s?: Sound } = {};
const mus: { name?: string; s?: Sound } = {};
const MUSIC = 0.5;
/** Con el juego en segundo plano no suena nada. */
let away = false;

/** Al aire libre: el bosque y las dos primeras zonas de la montaña (paso nevado y pinos helados). */
const forest = (g: Game) => g.zone.startsWith('b') || g.zone === 'm1' || g.zone === 'm2';
const AMBIENCE: Record<string, string> = { z1: 'amb_lava_cave', z2: 'amb_lava_cave', z3: 'amb_lava_cave', z4: 'amb_waterfall', m4: 'amb_waterfall' };

/** Ajusta el ambiente y los pasos a lo que se ve ahora (también al cambiar los interruptores de Ajustes). */
export function refresh() {
  const st = useStore.getState();
  const g = st.game;
  const inDungeon = !away && st.screen === 'game' && g && g.place !== 'town';
  // Música: título y menús; el pueblo; la de cada aventura en la mazmorra; combate; combate contra el jefe.
  let track: string | undefined;
  if (st.screen === 'game' && g) {
    if (g.place === 'town') track = 'mus_pueblo';
    else if (st.combat) track = st.combat.encounters.includes(bossEncounter(g.zone)) ? 'mus_jefe' : 'mus_combate';
    else track = forest(g) ? 'mus_bosque' : 'mus_minas';
  } else if (st.screen === 'intro') {
    // Imagen de entrada de la aventura: ya suena la música de su primera zona (el autor 2026-11-06).
    track = (st.intro?.adv ?? 'hondaroca') === 'hondaroca' ? 'mus_minas' : 'mus_bosque';
  } else if (st.screen !== 'victory' && st.screen !== 'defeat') track = 'mus_principal';
  loop(!away && musicOn() && level('musica') > 0 ? track : undefined, mus, MUSIC * level('musica'));
  const ambName = inDungeon && musicOn() && level('ambiente') > 0 ? (forest(g!) ? 'amb_forest_day' : AMBIENCE[g!.zone] ?? 'amb_lava_cave') : undefined;
  loop(ambName, amb, (st.combat ? AMB_COMBAT : AMB) * level('ambiente'));
  const walking = inDungeon && !st.combat && st.walking.length > 0 && soundOn() && level('efectos') > 0;
  loop(walking ? (forest(g!) ? 'sfx_steps_grass_01' : 'sfx_steps_stone_01') : undefined, steps, STEPS * level('efectos'));
}

const MAGIC: Partial<Record<DmgType, Fx>> = { fuego: 'fireball', frío: 'ice_spell', radiante: 'heal' };
const SLIMY = ['Zombie', 'Shambling Mound'];

/** Sonidos de un paso del combate: ataque, golpe o fallo, conjuro, curación, crítico, final. */
function combatSounds(a: Combat | undefined, b: Combat) {
  if (!a) { sfx('monster_growl', 0.7); return; }
  const sw = b.swing;
  if (sw && sw.id !== a.swing?.id) {
    const from = b.units.find(u => u.key === sw.from);
    const hit = b.pops?.[sw.to] && b.pops[sw.to].id !== a.pops?.[sw.to]?.id;
    if (hit && from?.side === 'enemy') vibra(40);
    if (sw.kind === 'arrow') sfx('arrow_shot');
    else if (sw.kind === 'magic') sfx(MAGIC[sw.type] ?? 'lightning');
    else if (!hit) sfx('sword_hit_shield');
    else if (from?.side === 'enemy' && !from.weapon) sfx(SLIMY.includes(from.mon ?? '') ? 'slime' : 'punch');
    else sfx('sword_swing');
  }
  for (const [k, f] of Object.entries(b.fx ?? {})) {
    if (a.fx?.[k]?.id === f.id) continue;
    if (f.kind === 'heal') sfx('heal');
    else if (f.kind === 'crit') { sfx('explosion_big', 0.35); vibra(90); }
  }
  if (b.goal?.status === 'ok' && a.goal?.status !== 'ok') sfx('confirm');
  if (b.result && !a.result) sfx(b.result === 'lose' ? 'ui_derrota' : b.result === 'win' ? 'ui_victoria_corta' : 'error');
}

const potions = (g: Game) => g.party.reduce((n, c) => n + c.items.filter(i => /^potion|antidote/.test(i.id)).length, 0);
const levels = (g: Game) => g.party.reduce((n, c) => n + c.level, 0);

const hpOf = (g: Game) => g.party.reduce((n, c) => n + (c.dead ? 0 : c.hp), 0);

/** Escucha los cambios de la partida y suena lo que toque. Se llama una vez al arrancar. */
export function startSound() {
  // Que la música y los efectos suenen a la vez sin quitarse el foco de audio entre ellos.
  try { Sound.setCategory('Playback', true); } catch {}
  useStore.subscribe((s, p) => {
    if (s.screen !== p.screen && s.screen === 'victory') sfx('ui_victoria');
    if (s.combat && s.combat !== p.combat) combatSounds(p.combat, s.combat);
    const g = s.game, h = p.game;
    if (g && h && g !== h && g.slot === h.slot) {
      const town = g.place === 'town';
      if (g.gold > h.gold) sfx(town ? 'coins_pouch' : 'coin_pickup', town ? 1 : MAP);
      else if (g.gold < h.gold) sfx('coins_pouch');
      if (potions(g) < potions(h) && g.gold === h.gold && g.drops === h.drops) sfx('potion_drink', s.combat ? 1 : MAP);
      if (levels(g) > levels(h)) sfx('ui_nivel');
      // Curarse descansando (o con un objeto fuera de combate) suena (el autor 2026-11-06).
      else if (!s.combat && !p.combat && g.savedAt >= h.savedAt && hpOf(g) > hpOf(h)) sfx('heal', town ? 1 : MAP);
    }
    const ev = s.queue[0];
    if (ev && ev !== p.queue[0] && ev.kind === 'msg') {
      const opened = ev.img && ev.title !== 'Cofre' && (ev.save || ev.lines.includes('¡Lo consigue!'));
      const burn = ev.items?.some(i => i === ITEMS.torch.img || i === ITEMS.alchemists_fire.img);
      if (ev.title === 'Cofre') sfx('chest_open', MAP);
      else if (ev.title === '¡Trampa!') { sfx('explosion_big', MAP * 0.6); vibra(120); }
      else if (opened) sfx(burn ? 'fireball' : /cofre|arc/.test(ev.img!) ? 'chest_open' : 'door_wood_open', MAP);
      else if (ev.title === 'Paso abierto') sfx('door_wood_open', MAP);
      else if (ev.items?.length) sfx('ui_objeto', MAP);
    }
    refresh();
  });
  AppState.addEventListener('change', a => { away = a !== 'active'; refresh(); });
  refresh();
}
