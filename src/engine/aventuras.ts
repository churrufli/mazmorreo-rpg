// Aventuras del juego y sus pueblos. Las zonas de Hondaroca son z1..z4, las del bosque b1..b4 y las de la
// montaña m1..m4, así que un id de zona o de contenido basta para saber a qué aventura pertenece.
import H from '../data/hondaroca.json';
import B from '../data/corazon.json';
import M from '../data/montana.json';
import type { ImgKey } from '../assets';

export type AdvId = 'hondaroca' | 'corazon_hueco' | 'montana';
export type TownId = 'valdescarcha' | 'vegahumbria' | 'cumbrenieve';
export type Design = typeof H;
type Art = { bg: ImgKey; combat: ImgKey; floor: ImgKey; wall: ImgKey };

export interface Adv {
  id: AdvId;
  name: string;
  data: Design;
  town: TownId;
  /** Criatura del jefe final: su combate cierra la aventura. */
  boss: string;
  /** Aliado que sustituye al que comparte clase con el héroe. */
  sub: string;
  intro: ImgKey;
  victoryImg: ImgKey;
  defeatImg: ImgKey;
  victoryText: string;
  defeatText: string;
  reward: { gold: number; item?: string };
  art: Record<string, Art>;
  allyImg: Record<string, ImgKey>;
  speakers: Record<string, string>;
  /** Ilustración de cada personaje que habla (su retrato en los diálogos y en el diario). */
  faces: Record<string, ImgKey>;
  /** Aventura anterior: hay que vencerla para abrir esta, y uno de sus aliados puede acompañar al héroe al empezar. */
  prev?: AdvId;
  /** Nivel al que sube todo el grupo al terminarla (escalera aprobada por el autor el 2026-11-04). */
  level: number;
  /** Dónde acompaña el aliado de la aventura anterior («por la linde»). */
  escortWhere?: string;
  /** Descanso del mapa (la imagen de su casilla). */
  restImg: ImgKey;
}

const art = (bg: string, wall = bg): Art => ({
  bg: `ambiente_${bg}` as ImgKey, combat: `combate_${bg}` as ImgKey, floor: `suelo_${wall}` as ImgKey, wall: `pared_${wall}` as ImgKey,
});
const BD = B as unknown as Design & { traitor: { id: string; name: string } };
const MD = M as unknown as Design & { sage: { id: string; name: string } };

export const ADVS: Record<AdvId, Adv> = {
  hondaroca: {
    id: 'hondaroca', name: H.dungeon.name, data: H, town: 'valdescarcha', boss: 'Orvane', sub: 'brunna',
    intro: 'intro', victoryImg: 'victoria', defeatImg: 'derrota',
    victoryText: H.boss.victory_reward, defeatText: 'Todo el grupo ha caído en la oscuridad de Hondaroca.',
    reward: { gold: 150 },
    art: { z1: art('mina'), z2: art('ruinas'), z3: art('cripta'), z4: art('monasterio') },
    allyImg: { brunna: 'ally_brunna', tiko: 'ally_tiko', edmund: 'ally_edmund', liss: 'ally_liss' },
    speakers: { brunna: 'Brunna', tiko: 'Tiko', edmund: 'Hermano Edmund', liss: 'Liss', orvane: 'Maese Orvane' },
    faces: { brunna: 'ally_brunna', tiko: 'ally_tiko', edmund: 'ally_edmund', liss: 'ally_liss', orvane: 'orvane' },
    level: 3, restImg: 'punto_descanso',
  },
  corazon_hueco: {
    id: 'corazon_hueco', name: BD.dungeon.name, data: BD, town: 'vegahumbria', boss: 'Treant', sub: 'telmo',
    intro: 'intro_bosque', victoryImg: 'victoria_generica', defeatImg: 'derrota_generica',
    victoryText: 'El Corazón Hueco cae y sus raíces liberan a los desaparecidos. Los caminos vuelven a abrirse. Los cautivos despiertan y regresan a Vegaumbría. Sin Brezna, nadie volverá a alimentarse de ellos. Entre los restos encontráis 75 monedas de oro y la Astilla del Corazón.',
    defeatText: 'El Corazón Hueco derrota al grupo. Los desaparecidos siguen presos entre sus raíces.',
    reward: { gold: 75, item: 'heart_fragment' },
    art: { b1: art('linde'), b2: art('bosque_profundo'), b3: art('cienaga'), b4: { ...art('claro_maldito'), bg: 'ambiente_interior_corazon', combat: 'combate_interior_corazon' } },
    allyImg: { maren: 'ally_maren', anselmo: 'ally_anselmo', ivelle: 'ally_ivelle', telmo: 'ally_telmo' },
    speakers: {
      ...Object.fromEntries(BD.allies.map(a => [a.id, a.name])), [BD.traitor.id]: BD.traitor.name, corazon: BD.boss.name,
    },
    faces: { maren: 'ally_maren', anselmo: 'ally_anselmo', ivelle: 'ally_ivelle', telmo: 'ally_telmo', ortiga: 'abuela_ortiga', corazon: 'corazon_hueco' },
    prev: 'hondaroca', level: 5, escortWhere: 'por la linde', restImg: 'campamento',
  },
  montana: {
    id: 'montana', name: MD.dungeon.name, data: MD, town: 'cumbrenieve', boss: 'Young White Dragon', sub: 'aldric',
    intro: 'intro_montana', victoryImg: 'victoria_generica', defeatImg: 'derrota_generica',
    victoryText: 'Vharzûl cae sobre su tesoro y el hielo de la cumbre empieza a crujir. El paso volverá a abrirse y Cumbrenieve no pagará más tributo. Encontráis 120 monedas de oro y el Sello del Deshielo.',
    defeatText: 'Todo el grupo ha caído en el hielo de la montaña.',
    reward: { gold: 120, item: 'relic_dwarf' },
    art: { m1: art('paso_nevado'), m2: art('pinos_helados'), m3: art('fortaleza_enana'), m4: art('cueva_glaciar') },
    allyImg: { vurka: 'ally_vurka', durnok: 'ally_durnok', syrael: 'ally_syrael', aldric: 'ally_aldric' },
    speakers: { ...Object.fromEntries(MD.allies.map(a => [a.id, a.name])), sabio: MD.sage.name, dragon: MD.boss.name },
    faces: { vurka: 'ally_vurka', durnok: 'ally_durnok', syrael: 'ally_syrael', aldric: 'ally_aldric', sabio: 'ally_telmo', dragon: 'dragon_blanco_joven' },
    prev: 'corazon_hueco', level: 6, escortWhere: 'por el paso nevado', restImg: 'hoguera_nieve',
  },
};

export const ADV_LIST = Object.values(ADVS);
export const advOf = (zoneOrId: string): AdvId => (zoneOrId[0] === 'b' ? 'corazon_hueco' : zoneOrId[0] === 'm' ? 'montana' : 'hondaroca');
/** ¿Ha terminado esa aventura? (Hondaroca guardaba antes la victoria en g.won) */
export const wonAdv = (g: { won: boolean; wins?: AdvId[] }, a: AdvId) => !!g.wins?.includes(a) || (a === 'hondaroca' && g.won);
export const firstZone = (a: AdvId) => ADVS[a].data.zones[0].id;

export interface Town { name: string; adv: AdvId; bg: Record<'menu' | 'tienda' | 'templo' | 'posada' | 'puerta', ImgKey>; stock: string[] }
const COMUNES = B.shops.comunes;
/** Armas mejores (+1) en los dos pueblos, a la venta tras completar la primera aventura (el autor 2026-11-03). */
export const MEJORES = ['longsword_plus1', 'mace_plus1', 'rapier_plus1', 'wand_war_mage', 'longbow_plus1', 'weapon_plus1_warhammer', 'greataxe_plus1'];
export const TOWNS: Record<TownId, Town> = {
  valdescarcha: {
    name: 'Valdescarcha', adv: 'hondaroca',
    bg: { menu: 'valdescarcha', tienda: 'pueblo_tienda', templo: 'pueblo_templo', posada: 'pueblo_posada', puerta: 'pueblo_puerta' },
    stock: [...COMUNES, ...B.shops.valdescarcha],
  },
  vegahumbria: {
    name: 'Vegaumbría', adv: 'corazon_hueco',
    bg: { menu: 'vegahumbria', tienda: 'vegahumbria_tienda', templo: 'vegahumbria_templo', posada: 'vegahumbria_posada', puerta: 'vegahumbria_puerta' },
    stock: [...COMUNES, ...B.shops.vegahumbria],
  },
  cumbrenieve: {
    name: 'Cumbrenieve', adv: 'montana',
    bg: { menu: 'cumbrenieve', tienda: 'cumbrenieve_tienda', templo: 'cumbrenieve_templo', posada: 'cumbrenieve_posada', puerta: 'cumbrenieve_puerta' },
    stock: [...COMUNES, ...M.shops.cumbrenieve],
  },
};

/** Nombre y retrato de quien habla, sea de la aventura que sea. */
export function speaker(id: string): { name: string; img?: ImgKey } {
  const a = ADV_LIST.find(x => x.speakers[id]);
  return a ? { name: a.speakers[id], img: a.faces[id] } : { name: id === 'narrator' ? '' : id };
}
