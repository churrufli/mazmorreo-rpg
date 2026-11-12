// HTML audio adapter: reuse the game's existing mixing and combat sound logic.
const files = import.meta.glob('../android/app/src/main/res/raw/*.ogg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const sounds = new Set<Sound>();
let unlocked = false;
function unlock() {
  unlocked = true;
  for (const sound of sounds) sound.resume();
}
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
}
export default class Sound {
  private audio: HTMLAudioElement;
  private wanted = false;
  static setCategory(_category: string, _mix: boolean) {}
  constructor(name: string, _base: string, ready: (error?: unknown) => void) {
    const url = files[`../android/app/src/main/res/raw/${name}.ogg`];
    this.audio = new Audio(url);
    this.audio.preload = 'none';
    sounds.add(this);
    queueMicrotask(() => ready(url ? undefined : new Error(`Audio desconocido: ${name}`)));
  }
  setVolume(volume: number) { this.audio.volume = Math.max(0, Math.min(1, volume)); }
  setNumberOfLoops(count: number) { this.audio.loop = count === -1; }
  play(done?: () => void) {
    this.wanted = true;
    this.audio.onended = () => { this.wanted = false; done?.(); };
    this.audio.onerror = () => { this.wanted = false; done?.(); };
    this.resume();
  }
  resume() {
    if (unlocked && this.wanted && !document.hidden) void this.audio.play().catch(() => {});
  }
  stop(done?: () => void) { this.wanted = false; this.audio.pause(); done?.(); }
  release() { this.stop(); this.audio.removeAttribute('src'); this.audio.load(); sounds.delete(this); }
}
