import type { ImgKey } from '../assets';
import type { Ability, ClassId, SpeciesId } from '../data/srd';
import type { Rng } from './rng';
import { Char, Item, createHero } from './rules';
import type { Hex } from './dungeon';
import type { AdvId, TownId } from './aventuras';

export interface Game {
  slot: number;
  savedAt: number;
  /** Tiempo jugado (solo con el juego abierto y delante), en milisegundos. */
  playMs?: number;
  rng: Rng;
  place: 'dungeon' | 'town';
  zone: string;
  zoneBg?: ImgKey;
  pos: Hex;
  prev: Hex;
  visited: string[];
  party: Char[];
  gold: number;
  /** Ids ya resueltos: encuentros, cofres, trampas, descansos y salas visitadas. */
  done: string[];
  /** Secretos descubiertos. */
  found: string[];
  /** Trampas vistas antes de pisarlas (aún sin resolver si no están en done). */
  spotted?: string[];
  /** PG de enemigos de los que se huyó. */
  enemyHp: Record<string, number[]>;
  fled: string[];
  /** Enemigos que cayeron en cada encuentro ganado (nombre → cuántos). Los que huyeron no cuentan. */
  fallen?: Record<string, Record<string, number>>;
  /** Objetivos opcionales de combate ya resueltos (por encuentro). */
  goals?: Record<string, 'ok' | 'fail'>;
  /** Se puede hacer un descanso largo en la posada (se gana al terminar una zona). */
  restReady?: boolean;
  /** Personajes con los que ya se ha hablado (su primera intervención sale a pantalla completa). */
  met?: string[];
  won: boolean;
  /** Registro de lo que ha pasado en la partida. */
  log: string[];
  /** Diario: diálogos vividos, por aventura (s = quien habla, t = texto). */
  diary?: { a: AdvId; s: string; t: string }[];
  /** Aviso breve de la última casilla pisada (puerta, trampa ya desactivada...). */
  note?: string;
  /** Cómo quedó cada zona al salir de ella (para volver y encontrarla igual). */
  saved?: Record<string, { visited: string[]; pos: Hex; prev: Hex }>;
  /** Punto de descanso desde el que se fue al pueblo; al volver se aparece ahí. */
  back?: { zone: string; pos: Hex };
  /** Lo mismo por aventura (back es el de la última). */
  backs?: Partial<Record<AdvId, { zone: string; pos: Hex }>>;
  /** Pueblo en el que se está (Valdescarcha si falta). */
  town?: TownId;
  /** Aventuras terminadas. */
  wins?: AdvId[];
  /** Aliados que esperan en el pueblo mientras el héroe está en otra aventura. */
  bench?: Char[];
  /** Aliado apresado por los kobolds en El Invierno del Dragón, hasta que se le rescata. */
  captive?: Char;
  /** Objetos tirados en el mapa, por casilla "zona:q,r". */
  drops?: Record<string, Item[]>;
  /** Objetos vendidos que siguen a la venta en cada pueblo. */
  sold?: Partial<Record<TownId, string[]>>;
  /** Objetos de cofre que no cupieron: siguen en el cofre. */
  chestLeft?: Record<string, string[]>;
  /** Lo conseguido en cada zona, para el resumen al salir de ella. */
  stats?: Record<string, import('./dungeon').ZoneStats>;
  /** Aliado de otra aventura que acompaña al héroe al principio del bosque (hasta que se une el primero de allí). */
  escort?: string;
  /** Escenas con opciones: vías ya cerradas por un fallo. */
  scenes?: Record<string, { closed: number[]; said?: string[]; fight?: string }>;
  /** Enemigos de más (o de menos) en un encuentro por las decisiones tomadas. */
  encMod?: Record<string, number>;
  /** Enemigos de más (o de menos) de cada encuentro según el tamaño del grupo, fijado la primera vez que se lucha. */
  encSize?: Record<string, number>;
  /** Combates en los que los goblins guerreros pasan a esbirros (héroe solo en la zona 1). */
  weak?: string[];
  /** Casilla fija de cada grupo vencido; las partidas antiguas pueden guardar la del jugador. */
  wonAt?: Record<string, string>;
  /** Baúl de la posada, el mismo en todos los pueblos. */
  chest?: Item[];
  /** Trofeos de las aventuras terminadas (se guardan en el baúl y no se venden). */
  trophies?: string[];
  /** Marcas sueltas de lo decidido (pistas, ayudas de PNJ...). */
  flags?: string[];
  /** Aventura en la que cada personaje gastó ya su Inspiración heroica. */
  inspUsed?: Record<string, AdvId>;
  /** Afinidad con cada aliado: charlas hechas y aventuras terminadas con él. */
  bond?: Record<string, { talks: number; advs: number }>;
  /** Encargos de los aliados que esperan en la posada: aventuras ya contadas. */
  errands?: AdvId[];
  /** Avisos que se enseñan al llegar al pueblo (aventura siguiente abierta). */
  news?: string[];
  /** Aliados elegidos en la posada para la próxima salida (si falta, van los de la aventura). */
  chosen?: string[];
}

export function newGame(slot: number, name: string, cls: ClassId, species: SpeciesId, abil?: Record<Ability, number>, img?: ImgKey): Game {
  return {
    slot, savedAt: Date.now(), rng: { seed: (Date.now() % 2147483647) | 0 }, place: 'dungeon', zone: 'z1',
    pos: [0, 0], prev: [0, 0], visited: [], party: [createHero(name, cls, species, abil, img)], gold: 0, done: [], found: [],
    enemyHp: {}, fled: [], won: false, log: [],
  };
}

export const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
