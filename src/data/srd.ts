// Datos de reglas basados en el SRD 5.2.1 (D&D 2024), reducidos a lo que usan las aventuras.
// Los valores de criaturas son los del SRD; el equilibrio se ajustará jugando.
import type { ImgKey } from '../assets';

export type Ability = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
export type ClassId = 'fighter' | 'cleric' | 'rogue' | 'wizard' | 'ranger' | 'paladin' | 'barbarian' | 'warlock';
/** Clases que puede elegir el héroe (el bárbaro también es aliado: Vurka, en la montaña). */
export const HERO_CLASSES: ClassId[] = ['fighter', 'cleric', 'rogue', 'wizard', 'ranger', 'paladin', 'barbarian', 'warlock'];
/** El orco solo lo tiene Vurka, aliada: no se elige al crear el héroe. */
export type SpeciesId = 'human' | 'elf' | 'dwarf' | 'halfling' | 'dragonborn' | 'tiefling' | 'orc';

export const ABIL_NAME: Record<Ability, string> = {
  str: 'Fuerza', dex: 'Destreza', con: 'Constitución', int: 'Inteligencia', wis: 'Sabiduría', cha: 'Carisma',
};
export const ABIL_SHORT: Record<Ability, string> = {
  str: 'FUE', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR',
};

export interface ClassDef {
  name: string;
  hitDie: number;
  saves: Ability[];
  abil: Record<Ability, number>; // reparto recomendado (matriz estándar + trasfondo)
  armor: ('light' | 'medium' | 'heavy' | 'shield')[];
  martial: boolean | 'finesse';
  spell?: Ability;
  perception: boolean;
  items: string[];
  blurb: string;
}

export const CLASSES: Record<ClassId, ClassDef> = {
  fighter: {
    name: 'Guerrero', hitDie: 10, saves: ['str', 'con'],
    abil: { str: 17, dex: 13, con: 15, int: 8, wis: 12, cha: 10 },
    armor: ['light', 'medium', 'heavy', 'shield'], martial: true, perception: false,
    items: ['chain_mail', 'shield', 'longsword', 'shortbow'],
    blurb: 'Resiste en primera fila. Tomar aliento le cura y, desde nivel 2, Oleada de acción le da un turno extra.',
  },
  cleric: {
    name: 'Clérigo', hitDie: 8, saves: ['wis', 'cha'],
    abil: { str: 14, dex: 10, con: 14, int: 8, wis: 17, cha: 12 },
    armor: ['light', 'medium', 'shield'], martial: false, spell: 'wis', perception: false,
    items: ['scale_mail', 'shield', 'mace', 'holy_symbol'],
    blurb: 'Cura al grupo y castiga a los no muertos con luz sagrada.',
  },
  rogue: {
    name: 'Pícaro', hitDie: 8, saves: ['dex', 'int'],
    abil: { str: 10, dex: 17, con: 14, int: 12, wis: 13, cha: 8 },
    armor: ['light'], martial: 'finesse', perception: true,
    items: ['leather', 'shortsword', 'shortbow', 'thieves_tools'],
    blurb: 'Ataque furtivo cuando un aliado distrae al objetivo. Detecta y desactiva trampas.',
  },
  wizard: {
    name: 'Mago', hitDie: 6, saves: ['int', 'wis'],
    abil: { str: 8, dex: 14, con: 14, int: 17, wis: 12, cha: 10 },
    armor: [], martial: false, spell: 'int', perception: false,
    items: ['robe', 'quarterstaff', 'dagger', 'spellbook'],
    blurb: 'Frágil, pero sus conjuros golpean filas enteras desde la retaguardia.',
  },
  ranger: {
    name: 'Explorador', hitDie: 10, saves: ['str', 'dex'],
    abil: { str: 12, dex: 17, con: 14, int: 8, wis: 15, cha: 10 },
    armor: ['light', 'medium', 'shield'], martial: true, spell: 'wis', perception: true,
    items: ['leather', 'longbow', 'shortsword'],
    blurb: 'Tirador experto: Marca del cazador añade 1d6 a sus impactos.',
  },
  paladin: {
    name: 'Paladín', hitDie: 10, saves: ['wis', 'cha'],
    abil: { str: 17, dex: 10, con: 14, int: 8, wis: 12, cha: 15 },
    armor: ['light', 'medium', 'heavy', 'shield'], martial: true, spell: 'cha', perception: false,
    items: ['chain_mail', 'shield', 'longsword'],
    blurb: 'Imposición de manos cura a los aliados y Castigo divino añade daño radiante.',
  },
  barbarian: {
    name: 'Bárbaro', hitDie: 12, saves: ['str', 'con'],
    abil: { str: 17, dex: 13, con: 15, int: 8, wis: 12, cha: 10 },
    armor: ['light', 'medium', 'shield'], martial: true, perception: false,
    items: ['battleaxe', 'hide_armor'],
    blurb: 'Furia: más daño cuerpo a cuerpo y resiste los golpes. Sin armadura, su CA suma Destreza y Constitución.',
  },
  warlock: {
    name: 'Brujo', hitDie: 8, saves: ['wis', 'cha'],
    abil: { str: 8, dex: 14, con: 14, int: 10, wis: 12, cha: 17 },
    armor: ['light'], martial: false, spell: 'cha', perception: false,
    items: ['leather', 'dagger', 'arcane_focus'],
    blurb: 'Pacto infernal: Descarga sobrenatural y Maleficio desde la retaguardia. Pocos espacios de conjuro, pero los recupera con un descanso corto.',
  },
};

export interface SpeciesDef { name: string; blurb: string }
export const SPECIES: Record<SpeciesId, SpeciesDef> = {
  human: { name: 'Humano', blurb: 'Versátil: competencia en Percepción.' },
  elf: { name: 'Elfo', blurb: 'Sentidos agudos: competencia en Percepción. Inmune al sueño mágico.' },
  dwarf: { name: 'Enano', blurb: 'Dureza enana: +1 PG por nivel y resistencia al veneno.' },
  halfling: { name: 'Mediano', blurb: 'Suerte: repite los 1 naturales en el d20.' },
  dragonborn: { name: 'Dracónido', blurb: 'Ataque de aliento contra una fila enemiga y resistencia al daño de su linaje, que marca el color de sus escamas.' },
  tiefling: { name: 'Tiefling', blurb: 'Legado infernal: resistencia al fuego y el truco Descarga de fuego. Desde nivel 3, responde a un golpe con Reprensión infernal.' },
  orc: { name: 'Orco', blurb: 'Aguante incansable: una vez por descanso largo se queda con 1 PG en vez de caer. Descarga de adrenalina: PG temporales como acción adicional.' },
};

/** Linaje dracónico de cada retrato (SRD 5.2.1, «Ancestros dracónicos»): el color de las escamas decide el aliento. */
export const DRACONIC: Record<ClassId, { dragon: string; type: DmgType }> = {
  fighter: { dragon: 'rojo', type: 'fuego' }, cleric: { dragon: 'de plata', type: 'frío' }, rogue: { dragon: 'negro', type: 'ácido' },
  wizard: { dragon: 'azul', type: 'relámpago' }, ranger: { dragon: 'verde', type: 'veneno' }, paladin: { dragon: 'de oro', type: 'fuego' },
  barbarian: { dragon: 'blanco', type: 'frío' }, warlock: { dragon: 'de cobre', type: 'ácido' },
};
/** Linaje de los aliados dracónidos, por el color de su retrato (el de los héroes sale de su clase). */
const DRACONIC_ALLY: Record<string, { dragon: string; type: DmgType }> = {
  syrael: { dragon: 'de plata', type: 'frío' }, yara: { dragon: 'de latón', type: 'fuego' },
};
export const draconic = (c: { id: string; cls: ClassId }) => DRACONIC_ALLY[c.id] ?? DRACONIC[c.cls];

export const XP_LEVELS = [0, 300, 900, 2700, 6500, 14000];
export const MAX_LEVEL = 6;
export const prof = (level: number) => (level >= 5 ? 3 : 2);
/** Espacios de conjuro de nivel 1, 2 y 3. */
export type Slots = [number, number, number];
export const SLOTS: Record<number, Slots> = { 1: [2, 0, 0], 2: [3, 0, 0], 3: [4, 2, 0], 4: [4, 3, 0], 5: [4, 3, 2], 6: [4, 3, 3] };
/** Explorador y paladín: medio lanzadores, solo conjuros de nivel 1 hasta nivel 4. */
export const HALF_SLOTS: Record<number, Slots> = { 1: [2, 0, 0], 2: [2, 0, 0], 3: [3, 0, 0], 4: [3, 0, 0], 5: [4, 2, 0], 6: [4, 2, 0] };

export type DmgType = 'cortante' | 'perforante' | 'contundente' | 'fuego' | 'frío' | 'radiante' | 'fuerza' | 'veneno' | 'necrótico' | 'trueno' | 'ácido' | 'relámpago' | 'psíquico';

export interface WeaponDef {
  dice: string;
  type: DmgType;
  finesse?: boolean;
  ranged?: boolean;
  martial?: boolean;
  bonus?: number;
}

export interface ItemDef {
  name: string;
  kind: 'weapon' | 'armor' | 'shield' | 'potion' | 'gear' | 'wand' | 'scroll' | 'throw' | 'wondrous';
  img: ImgKey;
  desc: string;
  value: number;
  /** Llave de zona: no se vende ni se tira. */
  key?: boolean;
  weapon?: WeaponDef;
  armor?: { base: number; type: 'light' | 'medium' | 'heavy'; dexMax?: number };
  heal?: string;
  charges?: number;
  /** Arrojadizos: daño con salvación de Destreza, o apresar (red). */
  thrown?: { dice?: string; type?: DmgType; undeadOnly?: boolean; restrain?: boolean; burn?: boolean; oil?: boolean };
  /** Varita que lanza Telaraña. */
  web?: boolean;
  resistPoison?: boolean;
  curePoison?: boolean;
  /** Resistencia al frío: la poción durante el combate; anillo y botas mientras se llevan. */
  resistCold?: boolean;
  /** Poción de resistencia a un tipo de daño durante el combate. */
  resist?: DmgType;
  /** Consumible con efecto propio durante el combate (pociones y polvos del SRD). */
  effect?: 'haste' | 'heroism' | 'growth' | 'giant' | 'elixir' | 'poison' | 'vanish';
  /** Pergamino de conjuro: el conjuro que lanza y las clases que lo tienen en su lista. */
  spell?: string;
  scrollFor?: ClassId[];
  /** Foco mágico: suma a las tiradas de ataque de conjuro de quien lo lleva. */
  spellBonus?: number;
}

export const ITEMS: Record<string, ItemDef> = {
  longsword: { name: 'Espada larga', kind: 'weapon', img: 'espada', value: 15, desc: 'Arma marcial cuerpo a cuerpo. 1d8 cortante.', weapon: { dice: '1d8', type: 'cortante', martial: true } },
  shortsword: { name: 'Espada corta', kind: 'weapon', img: 'espada', value: 10, desc: 'Arma marcial sutil. 1d6 perforante.', weapon: { dice: '1d6', type: 'perforante', finesse: true, martial: true } },
  scimitar: { name: 'Cimitarra', kind: 'weapon', img: 'espada', value: 25, desc: 'Arma marcial sutil. 1d6 cortante.', weapon: { dice: '1d6', type: 'cortante', finesse: true, martial: true } },
  dagger: { name: 'Daga', kind: 'weapon', img: 'dagas', value: 2, desc: 'Arma sencilla sutil. 1d4 perforante.', weapon: { dice: '1d4', type: 'perforante', finesse: true } },
  mace: { name: 'Maza', kind: 'weapon', img: 'maza', value: 5, desc: 'Arma sencilla. 1d6 contundente.', weapon: { dice: '1d6', type: 'contundente' } },
  warhammer: { name: 'Martillo de guerra', kind: 'weapon', img: 'maza', value: 15, desc: 'Arma marcial. 1d8 contundente.', weapon: { dice: '1d8', type: 'contundente', martial: true } },
  weapon_plus1_warhammer: { name: 'Martillo de guerra +1', kind: 'weapon', img: 'martillo_guerra_mas1', value: 400, desc: 'Arma mágica: +1 a las tiradas de ataque y daño. 1d8 contundente.', weapon: { dice: '1d8', type: 'contundente', martial: true, bonus: 1 } },
  quarterstaff: { name: 'Bastón', kind: 'weapon', img: 'baston_mago', value: 2, desc: 'Arma sencilla. 1d6 contundente.', weapon: { dice: '1d6', type: 'contundente' } },
  pick: { name: 'Pico de minero', kind: 'weapon', img: 'pico_minero', value: 5, desc: 'Arma marcial improvisada. 1d8 perforante.', weapon: { dice: '1d8', type: 'perforante', martial: true } },
  shortbow: { name: 'Arco corto', kind: 'weapon', img: 'arco_corto', value: 25, desc: 'Arma sencilla a distancia. 1d6 perforante.', weapon: { dice: '1d6', type: 'perforante', ranged: true } },
  light_crossbow: { name: 'Ballesta ligera', kind: 'weapon', img: 'arco_corto', value: 25, desc: 'Arma sencilla a distancia. 1d8 perforante.', weapon: { dice: '1d8', type: 'perforante', ranged: true } },
  leather: { name: 'Armadura de cuero', kind: 'armor', img: 'armadura_cuero', value: 10, desc: 'Armadura ligera. CA 11 + Destreza.', armor: { base: 11, type: 'light' } },
  scale_mail: { name: 'Cota de escamas', kind: 'armor', img: 'armadura_cuero', value: 50, desc: 'Armadura media. CA 14 + Destreza (máx. 2).', armor: { base: 14, type: 'medium', dexMax: 2 } },
  chain_mail: { name: 'Cota de malla', kind: 'armor', img: 'armadura_cuero', value: 75, desc: 'Armadura pesada. CA 16.', armor: { base: 16, type: 'heavy', dexMax: 0 } },
  robe: { name: 'Túnica', kind: 'gear', img: 'reliquia', value: 1, desc: 'Ropa de viaje de un aprendiz de mago.' },
  shield: { name: 'Escudo', kind: 'shield', img: 'escudo', value: 10, desc: '+2 a la CA.' },
  holy_symbol: { name: 'Símbolo sagrado', kind: 'gear', img: 'simbolo_sagrado', value: 5, desc: 'Foco para los conjuros del clérigo.' },
  spellbook: { name: 'Libro de conjuros', kind: 'gear', img: 'pergamino_escudo', value: 50, desc: 'Contiene los conjuros del mago.' },
  arcane_focus: { name: 'Foco arcano', kind: 'gear', img: 'cristal', value: 10, desc: 'Foco para los conjuros arcanos del mago o del brujo.' },
  torch: { name: 'Antorcha', kind: 'gear', img: 'antorcha', value: 5, desc: 'Basta con que alguien la lleve: el grupo ve dos casillas a su alrededor en lugar de una. Un clérigo o un mago no la necesitan (conocen el truco Luz). Se consume si se usa para quemar algo.' },
  thieves_tools: { name: 'Herramientas de ladrón', kind: 'gear', img: 'herramientas_ladron', value: 25, desc: 'Para abrir cerraduras y desactivar trampas.' },
  healers_kit_1: { name: 'Estuche de curandero', kind: 'gear', img: 'estuche_curandero', value: 5, desc: 'Fuera de combate, cura 1d6 + 4 PG a un compañero (también a un caído). Tiene 3 usos.', heal: '1d6+4', charges: 3 },
  potion_healing: { name: 'Poción de curación', kind: 'potion', img: 'pocion_curacion', value: 40, desc: 'Recupera 2d4 + 2 PG. Beberla es una acción adicional.', heal: '2d4+2' },
  potion_greater_healing_1: { name: 'Poción de curación mayor', kind: 'potion', img: 'pocion_curacion_mayor', value: 200, desc: 'Recupera 4d4 + 4 PG. Beberla es una acción adicional.', heal: '4d4+4' },
  antidote: { name: 'Antídoto', kind: 'potion', img: 'antidoto', value: 25, desc: 'Cura el envenenamiento (el veneno de las arañas hace atacar con desventaja). Usarlo es una acción adicional.', curePoison: true },
  spell_scroll_shield: { name: 'Pergamino de escudo', kind: 'scroll', img: 'pergamino_escudo', value: 25, desc: 'Un mago puede leerlo para ganar +5 a la CA durante el combate.' },
  wand_magic_missiles_1: { name: 'Varita de proyectiles mágicos', kind: 'wand', img: 'varita_proyectiles', value: 400, desc: '7 cargas. Lanza 3 proyectiles de 1d4+1 de fuerza que siempre impactan.', charges: 7 },
  // El Corazón Hueco
  longbow: { name: 'Arco largo', kind: 'weapon', img: 'arco_corto', value: 50, desc: 'Arma marcial a distancia. 1d8 perforante.', weapon: { dice: '1d8', type: 'perforante', ranged: true, martial: true } },
  longbow_plus1: { name: 'Arco largo +1', kind: 'weapon', img: 'arco_largo_mas1', value: 450, desc: 'Arco élfico de tejo: +1 a las tiradas de ataque y daño. 1d8 perforante.', weapon: { dice: '1d8', type: 'perforante', ranged: true, martial: true, bonus: 1 } },
  silver_dagger: { name: 'Daga de plata', kind: 'weapon', img: 'dagas', value: 102, desc: 'Daga plateada de un cazador. 1d4 perforante, sutil.', weapon: { dice: '1d4', type: 'perforante', finesse: true } },
  wand_of_web: { name: 'Varita de telarañas', kind: 'wand', img: 'varita_telaranas', value: 500, desc: 'Solo lanzadores de conjuros. 7 cargas: Telaraña (CD 13) sobre una fila enemiga; quien falle la salvación de Destreza queda apresado.', charges: 7, web: true },
  periapt_wound_closure: { name: 'Periapto de cierre de heridas', kind: 'wondrous', img: 'periapto_cierre_heridas', value: 500, desc: 'Quien lo lleva se estabiliza solo al caer a 0 PG y cura el doble con los dados de golpe.' },
  gauntlets_ogre_power: { name: 'Guanteletes de fuerza de ogro', kind: 'wondrous', img: 'guanteletes_fuerza_ogro', value: 500, desc: 'La Fuerza de quien los lleva pasa a ser 19.' },
  restorative_ointment: { name: 'Ungüento restaurador', kind: 'potion', img: 'unguento_restaurador', value: 150, desc: 'Tarro con 3 dosis. Cada dosis cura 2d8+2 PG. Aplicarla es una acción adicional.', heal: '2d8+2', charges: 3 },
  alchemists_fire: { name: 'Fuego de alquimista', kind: 'throw', img: 'fuego_alquimista', value: 35, desc: 'Se lanza a un enemigo: salvación de Destreza o 1d4 de fuego y arde (1d4 más en cada uno de sus turnos durante dos turnos).', thrown: { dice: '1d4', type: 'fuego', burn: true } },
  acid_vial: { name: 'Vial de ácido', kind: 'throw', img: 'vial_acido', value: 25, desc: 'Se lanza a un enemigo: salvación de Destreza o 2d6 de ácido.', thrown: { dice: '2d6', type: 'ácido' } },
  holy_water: { name: 'Agua bendita', kind: 'throw', img: 'agua_bendita', value: 25, desc: 'Se lanza a un no muerto: salvación de Destreza o 2d8 radiante.', thrown: { dice: '2d8', type: 'radiante', undeadOnly: true } },
  net: { name: 'Red', kind: 'throw', img: 'red', value: 10, desc: 'Se lanza a un enemigo: salvación de Destreza o queda apresado (ataca con desventaja y le atacan con ventaja) hasta que se libere.', thrown: { restrain: true } },
  potion_poison_resistance: { name: 'Poción de resistencia (veneno)', kind: 'potion', img: 'pocion_resistencia_veneno', value: 30, desc: 'Resistencia al daño de veneno durante el combate. Beberla es una acción adicional.', resistPoison: true },
  // Armas mejores de la tienda (+1): caras, pensadas para comprarlas con el oro de toda una aventura.
  longsword_plus1: { name: 'Espada larga +1', kind: 'weapon', img: 'espada_larga_mas1', value: 400, desc: 'Arma mágica: +1 a las tiradas de ataque y daño. 1d8 cortante.', weapon: { dice: '1d8', type: 'cortante', martial: true, bonus: 1 } },
  mace_plus1: { name: 'Maza +1', kind: 'weapon', img: 'maza_mas1', value: 350, desc: 'Arma mágica: +1 a las tiradas de ataque y daño. 1d6 contundente.', weapon: { dice: '1d6', type: 'contundente', bonus: 1 } },
  rapier_plus1: { name: 'Estoque +1', kind: 'weapon', img: 'estoque_mas1', value: 400, desc: 'Arma mágica sutil: +1 a las tiradas de ataque y daño. 1d8 perforante.', weapon: { dice: '1d8', type: 'perforante', finesse: true, martial: true, bonus: 1 } },
  wand_war_mage: { name: 'Varita del mago de guerra +1', kind: 'wondrous', img: 'varita_mago_guerra_mas1', value: 400, desc: 'Basta con llevarla: +1 a las tiradas de ataque de conjuro.', spellBonus: 1 },
  greataxe_plus1: { name: 'Gran hacha +1', kind: 'weapon', img: 'gran_hacha_mas1', value: 450, desc: 'Arma mágica a dos manos: +1 a las tiradas de ataque y daño. 1d12 cortante.', weapon: { dice: '1d12', type: 'cortante', martial: true, bonus: 1 } },
  crowbar: { name: 'Palanqueta', kind: 'gear', img: 'palanqueta', value: 2, desc: 'Barra de hierro para forzar puertas, arcones, losas y candados. Se rompe al usarla (un solo uso).' },
  rope: { name: 'Cuerda', kind: 'gear', img: 'cuerda', value: 10, desc: 'Cincuenta pies de cuerda de cáñamo. Da ventaja en la salvación contra trampas de foso o de lazo y sirve para bajar a pozos, cruzar puentes rotos o sacar cofres del agua. Se gasta al usarla para pasar un obstáculo.' },
  zone_key: { name: 'Llave de hierro', kind: 'gear', img: 'llave', value: 0, key: true, desc: 'Abre la salida cerrada de esta zona. Se queda en la cerradura al usarla.' },
  bark_amulet: { name: 'Amuleto de corteza', kind: 'gear', img: 'amuleto_corteza', value: 0, key: true, desc: 'Amuleto antiguo de la orden que protegía Umbría. Su runa aparta las raíces que cierran la salida de una zona. Se consume al usarlo.' },
  druid_relic: { name: 'Semilla de la promesa', kind: 'gear', img: 'semilla_juramento', value: 75, desc: 'Semilla fosilizada que recuerda la promesa original del Corazón Hueco. Tesoro: se puede vender.' },
  // El Invierno del Dragón
  battleaxe: { name: 'Hacha de guerra', kind: 'weapon', img: 'hacha_guerra_mas1', value: 10, desc: 'Arma marcial. 1d8 cortante.', weapon: { dice: '1d8', type: 'cortante', martial: true } },
  battleaxe_plus_one: { name: 'Hacha de guerra +1', kind: 'weapon', img: 'hacha_guerra_mas1', value: 400, desc: 'Arma mágica: +1 a las tiradas de ataque y daño. 1d8 cortante.', weapon: { dice: '1d8', type: 'cortante', martial: true, bonus: 1 } },
  spear: { name: 'Lanza', kind: 'weapon', img: 'lanza', value: 2, desc: 'Arma sencilla. 1d6 perforante.', weapon: { dice: '1d6', type: 'perforante' } },
  hide_armor: { name: 'Armadura de pieles', kind: 'armor', img: 'armadura_pieles', value: 15, desc: 'Armadura media. CA 12 + Destreza (máx. 2).', armor: { base: 12, type: 'medium', dexMax: 2 } },
  cold_resistance_potion: { name: 'Poción de resistencia (frío)', kind: 'potion', img: 'pocion_resistencia_frio', value: 60, desc: 'Resistencia al daño de frío durante el combate: el aliento del dragón hace la mitad. Beberla es una acción adicional.', resistCold: true },
  boots_winterlands: { name: 'Botas de las tierras invernales', kind: 'wondrous', img: 'botas_invernales', value: 400, desc: 'Quien las lleva tiene resistencia al daño de frío.', resistCold: true },
  ring_warmth: { name: 'Anillo de calor', kind: 'wondrous', img: 'anillo_calor', value: 500, desc: 'Quien lo lleva tiene resistencia al daño de frío.', resistCold: true },
  cloak_protection: { name: 'Capa de protección', kind: 'wondrous', img: 'capa_proteccion', value: 500, desc: 'Quien la lleva gana +1 a la CA y a las tiradas de salvación.' },
  relic_dwarf: { name: 'Sello del Deshielo', kind: 'gear', img: 'sello_deshielo', value: 250, desc: 'Medallón enano de hierro y ámbar, prueba del tributo y de la paz recuperada. Trofeo: se guarda en el baúl de la posada.' },
  silver_piece: { name: 'Broche del centinela', kind: 'gear', img: 'reliquia', value: 20, desc: 'Broche de plata de un vigía enano. Tesoro: se puede vender.' },
  old_map: { name: 'Plano de los túneles', kind: 'gear', img: 'pergamino_escudo', value: 15, desc: 'Plano deteriorado de las galerías de la fortaleza. Tesoro: se puede vender.' },
  gem_ice: { name: 'Cuarzo glaciar', kind: 'gear', img: 'cristal', value: 50, desc: 'Cristal helado que nunca se derrite. Tesoro: se puede vender.' },
  // La Tumba de los Reyes Serpiente
  serpent_key: { name: 'Llave serpiente', kind: 'gear', img: 'llave_serpiente', value: 0, key: true, desc: 'Llave de bronce con forma de serpiente. Abre la salida cerrada de esta zona de la tumba. Se queda en la cerradura al usarla.' },
  fang_ring: { name: 'Anillo del colmillo', kind: 'gear', img: 'anillo_colmillo', value: 150, desc: 'Anillo de oro con un colmillo de serpiente que aún gotea. Nadie quiere llevarlo puesto. Tesoro: se puede vender.' },
  dagger_plus1: { name: 'Daga +1', kind: 'weapon', img: 'dagas', value: 300, desc: 'La daga de Baltoplat. Arma mágica sutil: +1 a las tiradas de ataque y daño. 1d4 perforante.', weapon: { dice: '1d4', type: 'perforante', finesse: true, bonus: 1 } },
  steel_mirror: { name: 'Espejo de acero', kind: 'gear', img: 'espejo_acero', value: 5, desc: 'Espejo de mano de acero pulido. Quien lo lleva mira al basilisco por el reflejo: si falla la salvación contra su mirada, la repite.' },
  blue_cucumber: { name: 'Pepino azul', kind: 'potion', img: 'pepino_azul', value: 50, desc: 'Pepino del huerto de Xiximanter. Fresco y amargo. Comerlo es una acción adicional: recupera 2d4 + 2 PG.', heal: '2d4+2' },
  stone_egg: { name: 'Huevo de piedra cálido', kind: 'gear', img: 'huevo_piedra', value: 100, desc: 'Huevo de piedra que nunca se enfría. Tesoro: se puede vender.' },
  serpent_crown: { name: 'Corona de los Reyes Serpiente', kind: 'gear', img: 'corona_serpiente', value: 300, desc: 'Corona de oro y escamas del último imperio de los hombres serpiente. Trofeo: se guarda en el baúl de la posada.' },
  heart_fragment: { name: 'Astilla del Corazón', kind: 'gear', img: 'astilla_corazon', value: 150, desc: 'Astilla de madera petrificada del Corazón Hueco. Ya no tiene poder. Trofeo que se guarda en el baúl de la posada.' },
  // Consumibles variados del SRD 5.2.1 (pociones, aceites, polvos y pergaminos) para cofres y tiendas.
  potion_resistance_fire: { name: 'Poción de resistencia (fuego)', kind: 'potion', img: 'pocion_resistencia_frio', value: 50, desc: 'Resistencia al daño de fuego durante el combate. Beberla es una acción adicional.', resist: 'fuego' },
  potion_resistance_necrotic: { name: 'Poción de resistencia (necrótico)', kind: 'potion', img: 'pocion_resistencia_veneno', value: 50, desc: 'Resistencia al daño necrótico durante el combate. Beberla es una acción adicional.', resist: 'necrótico' },
  potion_resistance_acid: { name: 'Poción de resistencia (ácido)', kind: 'potion', img: 'pocion_resistencia_veneno', value: 50, desc: 'Resistencia al daño de ácido durante el combate. Beberla es una acción adicional.', resist: 'ácido' },
  potion_growth: { name: 'Poción de crecimiento', kind: 'potion', img: 'pocion_curacion_mayor', value: 150, desc: 'Quien la bebe se agranda durante el combate: sus ataques con armas hacen 1d4 de daño más. Beberla es una acción adicional.', effect: 'growth' },
  potion_giant_strength: { name: 'Poción de fuerza de gigante (colinas)', kind: 'potion', img: 'pocion_curacion_mayor', value: 150, desc: 'La Fuerza de quien la bebe pasa a ser 21 durante el combate (no hace nada si ya la tiene igual o mayor). Beberla es una acción adicional.', effect: 'giant' },
  potion_heroism: { name: 'Poción de heroísmo', kind: 'potion', img: 'pocion_curacion_mayor', value: 300, desc: 'Durante el combate, 10 PG temporales y +1d4 a las tiradas de ataque y de salvación (como Bendición). Beberla es una acción adicional.', effect: 'heroism' },
  potion_speed: { name: 'Poción de velocidad', kind: 'potion', img: 'pocion_curacion_mayor', value: 500, desc: 'Efecto de Acelerar durante el combate, sin somnolencia al acabar: +2 a la CA, ventaja en las salvaciones de Destreza y un ataque más en cada turno. Beberla es una acción adicional.', effect: 'haste' },
  elixir_health: { name: 'Elixir de salud', kind: 'potion', img: 'antidoto', value: 300, desc: 'Quita los estados de envenenado y paralizado. Beberlo es una acción adicional.', effect: 'elixir' },
  basic_poison: { name: 'Veneno básico', kind: 'potion', img: 'vial_acido', value: 100, desc: 'Se unta en el arma con una acción adicional: el siguiente golpe cortante o perforante hace 1d4 de daño de veneno más.', effect: 'poison' },
  dust_disappearance: { name: 'Polvo de desaparición', kind: 'potion', img: 'red', value: 150, desc: 'Se esparce con una acción: todo el grupo se vuelve invisible (ventaja al atacar y los enemigos atacan con desventaja). Para cada uno se acaba al atacar, hacer daño o lanzar un conjuro.', effect: 'vanish' },
  oil_flask: { name: 'Frasco de aceite', kind: 'throw', img: 'vial_acido', value: 1, desc: 'Se lanza a un enemigo: salvación de Destreza o queda empapado. La próxima vez que reciba daño de fuego, recibe 5 de fuego más.', thrown: { oil: true } },
  scroll_cure_wounds: { name: 'Pergamino de curar heridas', kind: 'scroll', img: 'pergamino_escudo', value: 25, desc: 'Un clérigo, paladín o explorador lo lee para lanzar Curar heridas sin gastar espacio de conjuro.', spell: 'cure', scrollFor: ['cleric', 'paladin', 'ranger'] },
  scroll_bless: { name: 'Pergamino de bendición', kind: 'scroll', img: 'pergamino_escudo', value: 25, desc: 'Un clérigo o paladín lo lee para lanzar Bendición sin gastar espacio de conjuro.', spell: 'bless', scrollFor: ['cleric', 'paladin'] },
  scroll_guiding_bolt: { name: 'Pergamino de saeta guía', kind: 'scroll', img: 'pergamino_escudo', value: 25, desc: 'Un clérigo lo lee para lanzar Saeta guía sin gastar espacio de conjuro.', spell: 'guiding_bolt', scrollFor: ['cleric'] },
  scroll_magic_missile: { name: 'Pergamino de proyectil mágico', kind: 'scroll', img: 'pergamino_escudo', value: 25, desc: 'Un mago lo lee para lanzar Proyectil mágico sin gastar espacio de conjuro.', spell: 'magic_missile', scrollFor: ['wizard'] },
  scroll_sleep: { name: 'Pergamino de dormir', kind: 'scroll', img: 'pergamino_escudo', value: 25, desc: 'Un mago lo lee para lanzar Dormir sin gastar espacio de conjuro.', spell: 'sleep', scrollFor: ['wizard'] },
  scroll_burning_hands: { name: 'Pergamino de manos ardientes', kind: 'scroll', img: 'pergamino_escudo', value: 25, desc: 'Un mago o un brujo lo lee para lanzar Manos ardientes sin gastar espacio de conjuro.', spell: 'burning_hands', scrollFor: ['wizard', 'warlock'] },
};

// Nombres del diseño (hondaroca.json) a objetos del juego.
export const ITEM_BY_NAME: Record<string, string> = {
  'Cota de escamas': 'scale_mail', 'Martillo de guerra': 'warhammer', Escudo: 'shield', Antorcha: 'torch',
  'Armadura de cuero': 'leather', 'Espada corta': 'shortsword', 'Arco corto': 'shortbow',
  'Herramientas de ladrón': 'thieves_tools', Maza: 'mace', 'Símbolo sagrado': 'holy_symbol',
  Túnica: 'robe', Daga: 'dagger', 'Foco arcano': 'arcane_focus', 'Libro de conjuros': 'spellbook',
  Cimitarra: 'scimitar', 'Pico de minero': 'pick', 'Ballesta ligera': 'light_crossbow',
  'Arco largo': 'longbow', 'Dos espadas cortas': 'shortsword', Farol: 'torch', 'Espada larga': 'longsword',
  'Cota de malla': 'chain_mail', Bastón: 'quarterstaff', 'Hacha de guerra': 'battleaxe', 'Armadura de pieles': 'hide_armor',
};
export const DESIGN_ITEM: Record<string, string> = {
  potion_healing_1: 'potion_healing', potion_healing_2: 'potion_healing', thieves_tools_1: 'thieves_tools',
  healing_3: 'potion_healing', healing_4: 'potion_healing', healing_5: 'potion_healing',
  potion_healing_greater: 'potion_greater_healing_1', healing_herbs: 'healers_kit_1',
};

export type Ai = 'goblin' | 'undead' | 'beast' | 'caster' | 'cultist';

export interface MonsterAttack {
  name: string;
  bonus: number;
  dice: string;
  type: DmgType;
  ranged?: boolean;
  extra?: { dice: string; type: DmgType };
  /** Salvación en vez de tirada de ataque (ataca a una fila entera). */
  save?: { abil: Ability; dc: number; half: boolean; area?: boolean; recharge?: number; /** Usos por combate (conjuros de X/día). */ uses?: number };
  paralyze?: { dc: number };
  /** Daño cuando el monstruo está maltrecho (la mitad de sus PG o menos), como el enjambre de murciélagos. */
  bloodied?: string;
}

export interface MonsterDef {
  name: string;
  img: ImgKey;
  ac: number;
  hp: number;
  dexMod: number;
  xp: number;
  ai: Ai;
  attacks: MonsterAttack[];
  multi?: number;
  resist?: DmgType[];
  vuln?: DmgType[];
  immune?: DmgType[];
  noSleep?: boolean;
  packTactics?: boolean;
  undeadFortitude?: boolean;
  saves: Partial<Record<Ability, number>>;
  shieldSlots?: number;
  /** Ataca a la vanguardia rival desde su retaguardia (raíces del Corazón Hueco). */
  reach?: boolean;
  /** Nudo de raíz: mientras viva alguno, el jefe resiste todo salvo psíquico y se regenera. */
  knot?: boolean;
}

const goblinSaves = { str: -1, dex: 2, con: 0, int: 0, wis: -1, cha: -1 };
export const MONSTERS: Record<string, MonsterDef> = {
  'Giant Rat': {
    name: 'Rata gigante', img: 'rata_gigante', ac: 13, hp: 7, dexMod: 3, xp: 25, ai: 'beast', packTactics: true,
    attacks: [{ name: 'Mordisco', bonus: 5, dice: '1d4+3', type: 'perforante' }],
    saves: { str: -2, dex: 5, con: 0, int: -4, wis: 0, cha: -3 },
  },
  // Criaturas de valor de desafío 0 del SRD 5.2.1 para la primera zona de Hondaroca (el autor 2026-11-16).
  Rat: {
    name: 'Rata', img: 'rata', ac: 10, hp: 1, dexMod: 0, xp: 10, ai: 'beast',
    attacks: [{ name: 'Mordisco', bonus: 2, dice: '1', type: 'perforante' }],
    saves: { str: -4, dex: 0, con: -1, int: -4, wis: 0, cha: -3 },
  },
  Bat: {
    name: 'Murciélago', img: 'murcielago', ac: 12, hp: 1, dexMod: 2, xp: 10, ai: 'beast',
    attacks: [{ name: 'Mordisco', bonus: 4, dice: '1', type: 'perforante' }],
    saves: { str: -4, dex: 2, con: -1, int: -4, wis: 1, cha: -3 },
  },
  Spider: {
    name: 'Araña', img: 'arana', ac: 12, hp: 1, dexMod: 2, xp: 10, ai: 'beast',
    attacks: [{ name: 'Mordisco', bonus: 4, dice: '1', type: 'perforante', extra: { dice: '1d4', type: 'veneno' } }],
    saves: { str: -4, dex: 2, con: -1, int: -5, wis: 0, cha: -4 },
  },
  'Giant Fire Beetle': {
    name: 'Escarabajo de fuego gigante', img: 'escarabajo_fuego', ac: 13, hp: 4, dexMod: 0, xp: 10, ai: 'beast', resist: ['fuego'],
    attacks: [{ name: 'Mordisco', bonus: 1, dice: '1', type: 'fuego' }],
    saves: { str: -1, dex: 0, con: 1, int: -5, wis: -2, cha: -4 },
  },
  Scorpion: {
    name: 'Escorpión', img: 'escorpion', ac: 11, hp: 1, dexMod: 0, xp: 10, ai: 'beast',
    attacks: [{ name: 'Aguijón', bonus: 2, dice: '1', type: 'perforante', extra: { dice: '1d6', type: 'veneno' } }],
    saves: { str: -4, dex: 0, con: -1, int: -5, wis: -1, cha: -4 },
  },
  Lizard: {
    name: 'Lagarto', img: 'lagarto', ac: 10, hp: 2, dexMod: 0, xp: 10, ai: 'beast',
    attacks: [{ name: 'Mordisco', bonus: 2, dice: '1', type: 'perforante' }],
    saves: { str: -4, dex: 0, con: 0, int: -5, wis: -1, cha: -4 },
  },
  // No ataca: solo chilla (en el SRD avisa a quien esté cerca). Su primer chillido atrae a otro enemigo (shriek en combat.ts).
  Shrieker: {
    name: 'Hongo chillón', img: 'hongo_chillon', ac: 5, hp: 13, dexMod: -5, xp: 0, ai: 'beast', noSleep: true,
    attacks: [], saves: { str: -5, dex: -5, con: 0, int: -5, wis: -4, cha: -5 },
  },
  Commoner: {
    name: 'Plebeyo', img: 'plebeyo', ac: 10, hp: 4, dexMod: 0, xp: 10, ai: 'goblin',
    attacks: [{ name: 'Garrote', bonus: 2, dice: '1d4', type: 'contundente' }],
    saves: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
  },
  'Goblin Warrior': {
    name: 'Goblin', img: 'goblin_espada', ac: 15, hp: 10, dexMod: 2, xp: 50, ai: 'goblin',
    attacks: [
      { name: 'Cimitarra', bonus: 4, dice: '1d6+2', type: 'cortante' },
      { name: 'Arco corto', bonus: 4, dice: '1d6+2', type: 'perforante', ranged: true },
    ],
    saves: goblinSaves,
  },
  // Goblin esbirro del SRD 2024 (VD 1/8): el que sale contra el héroe solo en la zona 1 (el autor 2026-11-06).
  'Goblin Minion': {
    name: 'Goblin esbirro', img: 'goblin_espada', ac: 12, hp: 7, dexMod: 2, xp: 25, ai: 'goblin',
    attacks: [
      { name: 'Daga', bonus: 4, dice: '1d4+2', type: 'perforante' },
      { name: 'Daga arrojadiza', bonus: 4, dice: '1d4+2', type: 'perforante', ranged: true },
    ],
    saves: goblinSaves,
  },
  'Goblin Boss': {
    name: 'Jefe goblin', img: 'jefe_goblin', ac: 17, hp: 21, dexMod: 2, xp: 200, ai: 'goblin', multi: 2,
    attacks: [
      { name: 'Cimitarra', bonus: 4, dice: '1d6+2', type: 'cortante' },
      { name: 'Arco corto', bonus: 4, dice: '1d6+2', type: 'perforante', ranged: true },
    ],
    saves: { ...goblinSaves, str: 0, cha: 0 },
  },
  'Giant Spider': {
    name: 'Araña gigante', img: 'arana_gigante', ac: 14, hp: 26, dexMod: 3, xp: 200, ai: 'beast',
    attacks: [{ name: 'Mordisco venenoso', bonus: 5, dice: '1d8+3', type: 'perforante', extra: { dice: '2d6', type: 'veneno' } }],
    saves: { str: 2, dex: 3, con: 1, int: -4, wis: 0, cha: -3 },
  },
  'Swarm of Bats': {
    name: 'Enjambre de murciélagos', img: 'enjambre_murcielagos', ac: 12, hp: 11, dexMod: 2, xp: 50, ai: 'beast',
    resist: ['contundente', 'perforante', 'cortante'],
    attacks: [{ name: 'Mordiscos', bonus: 4, dice: '2d4', type: 'perforante', bloodied: '1d4' }],
    saves: { str: -3, dex: 2, con: 0, int: -4, wis: 1, cha: -3 },
  },
  Skeleton: {
    name: 'Esqueleto', img: 'esqueleto', ac: 14, hp: 13, dexMod: 3, xp: 50, ai: 'undead', noSleep: true,
    vuln: ['contundente'], immune: ['veneno'],
    attacks: [
      { name: 'Espada corta', bonus: 5, dice: '1d6+3', type: 'perforante' },
      { name: 'Arco corto', bonus: 5, dice: '1d6+3', type: 'perforante', ranged: true },
    ],
    saves: { str: 0, dex: 3, con: 2, int: -2, wis: -1, cha: -3 },
  },
  Zombie: {
    name: 'Zombi', img: 'zombi', ac: 8, hp: 15, dexMod: -2, xp: 50, ai: 'undead', noSleep: true, undeadFortitude: true,
    immune: ['veneno'],
    attacks: [{ name: 'Golpe putrefacto', bonus: 3, dice: '1d8+1', type: 'contundente' }],
    saves: { str: 1, dex: -2, con: 3, int: -4, wis: 0, cha: -3 },
  },
  Ghoul: {
    // SRD 5.2.1: el ataque múltiple son dos mordiscos; la garra paralizante es otra acción que el juego no usa.
    name: 'Necrófago', img: 'necrofago', ac: 12, hp: 22, dexMod: 2, xp: 200, ai: 'undead', noSleep: true, multi: 2,
    immune: ['veneno'],
    attacks: [
      { name: 'Mordisco', bonus: 4, dice: '1d6+2', type: 'perforante', extra: { dice: '1d6', type: 'necrótico' } },
    ],
    saves: { str: 1, dex: 2, con: 0, int: -2, wis: 0, cha: -2 },
  },
  Cultist: {
    name: 'Cultista', img: 'cultista', ac: 12, hp: 9, dexMod: 1, xp: 25, ai: 'cultist',
    attacks: [
      // SRD 5.2.1: el sectario solo lleva la hoz ritual.
      { name: 'Hoz ritual', bonus: 3, dice: '1d4+1', type: 'cortante', extra: { dice: '1', type: 'necrótico' } },
    ],
    saves: { str: 0, dex: 1, con: 0, int: 0, wis: 2, cha: 0 },
  },
  'Steam Mephit': {
    name: 'Mefit de vapor', img: 'elemental', ac: 10, hp: 17, dexMod: 0, xp: 50, ai: 'beast', immune: ['fuego', 'veneno'],
    noSleep: true,
    attacks: [
      { name: 'Aliento de vapor', bonus: 0, dice: '2d4', type: 'fuego', save: { abil: 'con', dc: 10, half: true, area: true, recharge: 6 } },
      { name: 'Garras', bonus: 2, dice: '1d4', type: 'cortante', extra: { dice: '1d4', type: 'fuego' } },
    ],
    saves: { str: -3, dex: 0, con: 0, int: 0, wis: 0, cha: 1 },
  },
  Orvane: {
    name: 'Maese Orvane', img: 'orvane', ac: 13, hp: 45, dexMod: 2, xp: 700, ai: 'caster', shieldSlots: 3,
    attacks: [
      { name: 'Rayo abrasador', bonus: 5, dice: '2d6', type: 'fuego', ranged: true },
      { name: 'Onda atronadora', bonus: 0, dice: '2d8', type: 'trueno', save: { abil: 'con', dc: 13, half: true, area: true, recharge: 5 } },
      { name: 'Descarga arcana', bonus: 5, dice: '2d8', type: 'fuerza', ranged: true },
      { name: 'Bastón arcano', bonus: 3, dice: '1d6+1', type: 'contundente' },
    ],
    saves: { str: -1, dex: 2, con: 3, int: 5, wis: 3, cha: 0 },
  },
};

const beast = (str: number, dex: number, con: number) => ({ str, dex, con, int: -4, wis: 1, cha: -2 });
Object.assign(MONSTERS, {
  Wolf: {
    name: 'Lobo', img: 'lobo', ac: 12, hp: 11, dexMod: 2, xp: 50, ai: 'beast', packTactics: true,
    attacks: [{ name: 'Mordisco', bonus: 4, dice: '1d6+2', type: 'perforante' }], saves: beast(2, 2, 1),
  },
  'Dire Wolf': {
    name: 'Lobo terrible', img: 'huargo', ac: 14, hp: 22, dexMod: 2, xp: 200, ai: 'beast', packTactics: true,
    attacks: [{ name: 'Mordisco', bonus: 5, dice: '1d10+3', type: 'perforante' }], saves: beast(3, 2, 2),
  },
  Bandit: {
    name: 'Bandido', img: 'bandido', ac: 12, hp: 11, dexMod: 1, xp: 25, ai: 'goblin',
    attacks: [
      { name: 'Cimitarra', bonus: 3, dice: '1d6+1', type: 'cortante' },
      { name: 'Ballesta ligera', bonus: 3, dice: '1d8+1', type: 'perforante', ranged: true },
    ],
    saves: { str: 0, dex: 1, con: 1, int: 0, wis: 0, cha: 0 },
  },
  'Brown Bear': {
    name: 'Oso pardo', img: 'oso_pardo', ac: 11, hp: 22, dexMod: 1, xp: 200, ai: 'beast', multi: 2,
    attacks: [{ name: 'Mordisco', bonus: 5, dice: '1d8+3', type: 'perforante' }, { name: 'Zarpazo', bonus: 5, dice: '1d4+3', type: 'cortante' }],
    saves: beast(3, 1, 2),
  },
  'Awakened Shrub': {
    name: 'Arbusto despertado', img: 'arbusto_despertado', ac: 9, hp: 10, dexMod: -1, xp: 10, ai: 'beast', noSleep: true,
    vuln: ['fuego'], resist: ['perforante'],
    attacks: [{ name: 'Desgarrar', bonus: 1, dice: '1', type: 'cortante' }], saves: { str: -4, dex: -1, con: 0, int: 0, wis: 0, cha: -2 },
  },
  Owlbear: {
    // Rebajado (era 59 PG y 2d8+5): en la zona 2 del bosque el grupo solo tiene dos personajes.
    name: 'Oso lechuza', img: 'oso_lechuza', ac: 13, hp: 45, dexMod: 1, xp: 700, ai: 'beast', multi: 2,
    attacks: [{ name: 'Desgarrar', bonus: 6, dice: '1d10+4', type: 'cortante' }], saves: beast(5, 1, 3),
  },
  'Giant Boar': {
    name: 'Jabalí gigante', img: 'jabali_gigante', ac: 13, hp: 42, dexMod: 0, xp: 450, ai: 'beast',
    attacks: [{ name: 'Colmillos', bonus: 5, dice: '2d6+3', type: 'perforante' }], saves: { str: 5, dex: 0, con: 3, int: -4, wis: -2, cha: -3 },
  },
  "Will-o'-Wisp": {
    name: 'Fuego fatuo', img: 'fuego_fatuo', ac: 19, hp: 27, dexMod: 9, xp: 450, ai: 'undead', noSleep: true,
    resist: ['ácido', 'contundente', 'frío', 'fuego', 'necrótico', 'perforante', 'cortante'], immune: ['relámpago', 'veneno'],
    attacks: [{ name: 'Descarga', bonus: 4, dice: '2d8+2', type: 'relámpago' }], saves: { str: -5, dex: 9, con: 0, int: 1, wis: 2, cha: 0 },
  },
  Harpy: {
    name: 'Arpía', img: 'arpia', ac: 11, hp: 38, dexMod: 1, xp: 200, ai: 'beast',
    attacks: [{ name: 'Garra', bonus: 3, dice: '2d4+1', type: 'cortante' }], saves: { str: 1, dex: 1, con: 1, int: -2, wis: 0, cha: 1 },
  },
  Specter: {
    name: 'Espectro', img: 'espectro', ac: 12, hp: 22, dexMod: 2, xp: 200, ai: 'undead', noSleep: true,
    resist: ['ácido', 'frío', 'fuego', 'relámpago', 'trueno', 'contundente', 'perforante', 'cortante'], immune: ['necrótico', 'veneno'],
    attacks: [{ name: 'Consumir vida', bonus: 4, dice: '2d6', type: 'necrótico' }], saves: { str: -5, dex: 2, con: 0, int: 0, wis: 0, cha: 0 },
  },
  'Shambling Mound': {
    name: 'Montículo andante', img: 'monticulo_andante', ac: 15, hp: 110, dexMod: -1, xp: 1800, ai: 'beast', multi: 3, noSleep: true,
    resist: ['frío', 'fuego'], immune: ['relámpago'],
    attacks: [{ name: 'Zarcillo cargado', bonus: 7, dice: '1d6+4', type: 'contundente', extra: { dice: '2d4', type: 'relámpago' } }], saves: { str: 4, dex: -1, con: 3, int: -3, wis: 0, cha: -3 },
  },
  Dryad: {
    name: 'Dríade', img: 'driade', ac: 16, hp: 22, dexMod: 1, xp: 200, ai: 'cultist',
    attacks: [
      { name: 'Látigo de enredadera', bonus: 6, dice: '1d8+4', type: 'cortante' },
      { name: 'Ráfaga de espinas', bonus: 6, dice: '1d6+4', type: 'perforante', ranged: true },
    ],
    saves: { str: 0, dex: 1, con: 0, int: 2, wis: 2, cha: 4 },
  },
  'Green Hag': {
    name: 'Bruja verde', img: 'bruja_verde', ac: 17, hp: 82, dexMod: 1, xp: 700, ai: 'cultist', multi: 2,
    attacks: [
      { name: 'Garra', bonus: 6, dice: '1d8+4', type: 'cortante', extra: { dice: '1d6', type: 'veneno' } },
      // Rayo nauseabundo de nivel 3 (SRD 5.2.1).
      { name: 'Rayo nauseabundo', bonus: 4, dice: '4d8', type: 'veneno', ranged: true },
    ],
    saves: { str: 4, dex: 1, con: 3, int: 1, wis: 2, cha: 2 },
  },
  // Árbol despertado entero (SRD); 'Awakened Tree' se usa para los nudos de raíz del jefe.
  'Walking Tree': {
    name: 'Árbol despertado', img: 'arbol_despertado', ac: 13, hp: 59, dexMod: -2, xp: 450, ai: 'beast', noSleep: true,
    resist: ['contundente', 'perforante'], vuln: ['fuego'],
    attacks: [{ name: 'Golpe de rama', bonus: 6, dice: '3d6+4', type: 'contundente' }], saves: { str: 4, dex: -2, con: 2, int: 0, wis: 0, cha: -2 },
  },
  'Awakened Tree': {
    name: 'Nudo de raíz', img: 'nudo_de_raiz', ac: 12, hp: 12, dexMod: -2, xp: 0, ai: 'beast', noSleep: true, knot: true,
    attacks: [], saves: { str: 2, dex: -2, con: 2, int: -2, wis: 0, cha: -2 },
  },
  Treant: {
    name: 'El Corazón Hueco', img: 'corazon_hueco', ac: 15, hp: 80, dexMod: 0, xp: 0, ai: 'beast', multi: 2, noSleep: true, reach: true,
    attacks: [{ name: 'Raíz', bonus: 5, dice: '1d6+3', type: 'contundente' }], saves: { str: 6, dex: -1, con: 5, int: 1, wis: 3, cha: 1 },
  },
  // Criaturas del SRD 5.2.1 con el mismo VD que las de cada aventura, para dar variedad (el autor 2026-11-16).
  // Bosque.
  Owl: {
    name: 'Búho', img: 'buho', ac: 11, hp: 1, dexMod: 1, xp: 10, ai: 'beast',
    attacks: [{ name: 'Garras', bonus: 3, dice: '1', type: 'cortante' }], saves: { str: -4, dex: 1, con: -1, int: -4, wis: 1, cha: -2 },
  },
  'Venomous Snake': {
    name: 'Serpiente venenosa', img: 'serpiente_venenosa', ac: 12, hp: 5, dexMod: 2, xp: 25, ai: 'beast',
    attacks: [{ name: 'Mordisco', bonus: 4, dice: '1d4+2', type: 'perforante', extra: { dice: '1d6', type: 'veneno' } }],
    saves: { str: -4, dex: 2, con: 0, int: -5, wis: 0, cha: -4 },
  },
  Mastiff: {
    name: 'Mastín', img: 'mastin', ac: 12, hp: 5, dexMod: 2, xp: 25, ai: 'beast',
    attacks: [{ name: 'Mordisco', bonus: 3, dice: '1d6+1', type: 'perforante' }], saves: { str: 1, dex: 2, con: 1, int: -4, wis: 3, cha: -2 },
  },
  Sprite: {
    name: 'Duende', img: 'duende', ac: 15, hp: 10, dexMod: 4, xp: 50, ai: 'goblin',
    attacks: [
      { name: 'Espada aguja', bonus: 6, dice: '1d4+4', type: 'perforante' },
      { name: 'Arco encantador', bonus: 6, dice: '1', type: 'perforante', ranged: true },
    ],
    saves: { str: -4, dex: 4, con: 0, int: 2, wis: 1, cha: 0 },
  },
  Panther: {
    name: 'Pantera', img: 'pantera', ac: 13, hp: 13, dexMod: 3, xp: 50, ai: 'beast',
    attacks: [{ name: 'Desgarro', bonus: 5, dice: '1d6+3', type: 'cortante' }], saves: { str: 2, dex: 3, con: 0, int: -4, wis: 2, cha: -2 },
  },
  Boar: {
    name: 'Jabalí', img: 'jabali', ac: 11, hp: 13, dexMod: 0, xp: 50, ai: 'beast',
    attacks: [{ name: 'Colmillos', bonus: 3, dice: '1d6+1', type: 'perforante' }], saves: { str: 1, dex: 0, con: 2, int: -4, wis: -1, cha: -3 },
  },
  // Constreñir es una salvación de Fuerza CD 14 en el SRD; aquí va como segundo golpe para no atacar a toda la fila.
  'Giant Constrictor Snake': {
    name: 'Serpiente constrictora gigante', img: 'serpiente_constrictora', ac: 12, hp: 60, dexMod: 2, xp: 450, ai: 'beast', multi: 2,
    attacks: [
      { name: 'Mordisco', bonus: 6, dice: '2d6+4', type: 'perforante' },
      { name: 'Constreñir', bonus: 6, dice: '2d8+4', type: 'contundente' },
    ],
    saves: { str: 4, dex: 2, con: 1, int: -5, wis: 0, cha: -4 },
  },
  'Giant Eagle': {
    name: 'Águila gigante', img: 'aguila_gigante', ac: 13, hp: 26, dexMod: 3, xp: 200, ai: 'beast', multi: 2, resist: ['necrótico', 'radiante'],
    attacks: [{ name: 'Desgarro', bonus: 5, dice: '1d4+3', type: 'cortante', extra: { dice: '1d6', type: 'radiante' } }],
    saves: { str: 3, dex: 3, con: 1, int: -1, wis: 2, cha: 0 },
  },
  'Giant Elk': {
    name: 'Alce gigante', img: 'alce_gigante', ac: 14, hp: 42, dexMod: 4, xp: 450, ai: 'beast', resist: ['necrótico', 'radiante'],
    attacks: [{ name: 'Embestir', bonus: 6, dice: '2d6+4', type: 'contundente', extra: { dice: '2d4', type: 'radiante' } }],
    saves: { str: 6, dex: 6, con: 2, int: -2, wis: 2, cha: 0 },
  },
  Manticore: {
    name: 'Mantícora', img: 'manticora', ac: 14, hp: 68, dexMod: 3, xp: 700, ai: 'beast', multi: 3,
    attacks: [
      { name: 'Desgarro', bonus: 5, dice: '1d8+3', type: 'cortante' },
      { name: 'Púas de cola', bonus: 5, dice: '1d8+3', type: 'perforante', ranged: true },
    ],
    saves: { str: 3, dex: 3, con: 3, int: -2, wis: 1, cha: -1 },
  },
  // Montaña.
  Goat: {
    name: 'Cabra', img: 'cabra', ac: 10, hp: 4, dexMod: 0, xp: 10, ai: 'beast',
    attacks: [{ name: 'Embestir', bonus: 2, dice: '1', type: 'contundente' }], saves: { str: 2, dex: 0, con: 0, int: -4, wis: 0, cha: -3 },
  },
  Hawk: {
    name: 'Halcón', img: 'halcon', ac: 13, hp: 1, dexMod: 3, xp: 10, ai: 'beast',
    attacks: [{ name: 'Garras', bonus: 5, dice: '1', type: 'cortante' }], saves: { str: -3, dex: 3, con: -1, int: -4, wis: 2, cha: -2 },
  },
  'Giant Weasel': {
    name: 'Comadreja gigante', img: 'comadreja_gigante', ac: 13, hp: 9, dexMod: 3, xp: 25, ai: 'beast',
    attacks: [{ name: 'Mordisco', bonus: 5, dice: '1d4+3', type: 'perforante' }], saves: { str: 0, dex: 3, con: 0, int: -3, wis: 1, cha: -3 },
  },
  'Giant Bat': {
    name: 'Murciélago gigante', img: 'murcielago_gigante', ac: 13, hp: 22, dexMod: 3, xp: 50, ai: 'beast',
    attacks: [{ name: 'Mordisco', bonus: 5, dice: '1d6+3', type: 'perforante' }], saves: { str: 2, dex: 3, con: 0, int: -4, wis: 1, cha: -2 },
  },
  'Giant Goat': {
    name: 'Cabra gigante', img: 'cabra_gigante', ac: 11, hp: 19, dexMod: 1, xp: 100, ai: 'beast',
    attacks: [{ name: 'Embestir', bonus: 5, dice: '1d6+3', type: 'contundente' }], saves: { str: 5, dex: 1, con: 1, int: -4, wis: 1, cha: -2 },
  },
  Hippogriff: {
    name: 'Hipogrifo', img: 'hipogrifo', ac: 11, hp: 26, dexMod: 1, xp: 200, ai: 'beast', multi: 2,
    attacks: [{ name: 'Desgarro', bonus: 5, dice: '1d8+3', type: 'cortante' }], saves: { str: 3, dex: 1, con: 1, int: -4, wis: 1, cha: -1 },
  },
  'Polar Bear': {
    name: 'Oso polar', img: 'oso_polar', ac: 12, hp: 42, dexMod: 2, xp: 450, ai: 'beast', multi: 2, resist: ['frío'],
    attacks: [{ name: 'Desgarro', bonus: 7, dice: '1d8+5', type: 'cortante' }], saves: { str: 5, dex: 2, con: 3, int: -4, wis: 1, cha: -2 },
  },
  'Saber-Toothed Tiger': {
    name: 'Tigre dientes de sable', img: 'tigre_dientes_sable', ac: 13, hp: 52, dexMod: 3, xp: 450, ai: 'beast', multi: 2,
    attacks: [{ name: 'Desgarro', bonus: 6, dice: '2d6+4', type: 'cortante' }], saves: { str: 6, dex: 5, con: 2, int: -4, wis: 1, cha: -1 },
  },
  Gargoyle: {
    name: 'Gárgola', img: 'gargola', ac: 15, hp: 67, dexMod: 0, xp: 450, ai: 'beast', multi: 2, immune: ['veneno'],
    attacks: [{ name: 'Garra', bonus: 4, dice: '2d4+2', type: 'cortante' }], saves: { str: 2, dex: 0, con: 3, int: -2, wis: 0, cha: -2 },
  },
  Wight: {
    name: 'Tumulario', img: 'tumulario', ac: 14, hp: 82, dexMod: 2, xp: 700, ai: 'undead', noSleep: true, multi: 2,
    resist: ['necrótico'], immune: ['veneno'],
    attacks: [
      { name: 'Espada necrótica', bonus: 4, dice: '1d8+2', type: 'cortante', extra: { dice: '1d8', type: 'necrótico' } },
      { name: 'Arco necrótico', bonus: 4, dice: '1d8+2', type: 'perforante', ranged: true, extra: { dice: '1d8', type: 'necrótico' } },
    ],
    saves: { str: 2, dex: 2, con: 3, int: 0, wis: 1, cha: 2 },
  },
  // El Invierno del Dragón
  Kobold: {
    // Guerrero kobold del SRD 5.2.1: solo lleva dagas, que también lanza.
    name: 'Kobold', img: 'kobold', ac: 14, hp: 7, dexMod: 2, xp: 25, ai: 'goblin', packTactics: true,
    attacks: [
      { name: 'Daga', bonus: 4, dice: '1d4+2', type: 'perforante' },
      { name: 'Daga arrojadiza', bonus: 4, dice: '1d4+2', type: 'perforante', ranged: true },
    ],
    saves: { str: -2, dex: 2, con: -1, int: -1, wis: -2, cha: -1 },
  },
  'Ice Mephit': {
    name: 'Mefit de hielo', img: 'mefit_hielo', ac: 11, hp: 21, dexMod: 1, xp: 100, ai: 'beast', noSleep: true,
    immune: ['frío', 'veneno'], vuln: ['fuego'],
    attacks: [
      { name: 'Aliento de escarcha', bonus: 0, dice: '3d4', type: 'frío', save: { abil: 'con', dc: 10, half: true, area: true, recharge: 6 } },
      { name: 'Garras', bonus: 3, dice: '1d4+1', type: 'cortante', extra: { dice: '1d4', type: 'frío' } },
    ],
    saves: { str: -2, dex: 1, con: 0, int: -1, wis: 0, cha: 1 },
  },
  // Ogro del SRD con la imagen del antiguo yeti (el autor 2026-11-06: criaturas fieles al SRD).
  Ogre: {
    name: 'Ogro de las nieves', img: 'yeti', ac: 11, hp: 68, dexMod: -1, xp: 450, ai: 'beast',
    attacks: [{ name: 'Gran garrote', bonus: 6, dice: '2d8+4', type: 'contundente' }],
    saves: { str: 4, dex: -1, con: 3, int: -3, wis: -2, cha: -2 },
  },
  'Winter Wolf': {
    name: 'Lobo invernal', img: 'lobo_invernal', ac: 13, hp: 75, dexMod: 1, xp: 700, ai: 'beast', packTactics: true, immune: ['frío'],
    attacks: [
      { name: 'Aliento gélido', bonus: 0, dice: '4d8', type: 'frío', save: { abil: 'con', dc: 12, half: true, area: true, recharge: 5 } },
      { name: 'Mordisco', bonus: 6, dice: '2d6+4', type: 'perforante' },
    ],
    saves: { str: 4, dex: 1, con: 2, int: -2, wis: 1, cha: -1 },
  },
  'White Dragon Wyrmling': {
    name: 'Cría de dragón blanco', img: 'cria_dragon_blanco', ac: 16, hp: 32, dexMod: 0, xp: 450, ai: 'beast', multi: 2, immune: ['frío'],
    attacks: [
      { name: 'Aliento helado', bonus: 0, dice: '5d8', type: 'frío', save: { abil: 'con', dc: 12, half: true, area: true, recharge: 5 } },
      { name: 'Desgarro', bonus: 4, dice: '1d8+2', type: 'cortante', extra: { dice: '1d4', type: 'frío' } },
    ],
    saves: { str: 2, dex: 2, con: 2, int: -3, wis: 2, cha: 0 },
  },
  // Jefe adaptado (diseño de la aventura, no el bloque SRD entero): mordisco y garra; el aliento va en asaltos fijos (combat.ts).
  'Young White Dragon': {
    // Versión propia para cuatro personajes de nivel 4, sin la cría en su escolta (el autor 2026-11-17; antes 110 PG, +7 y aliento 6d8 CD 15 para nivel 5).
    name: 'Vharzûl', img: 'dragon_blanco_joven', ac: 16, hp: 75, dexMod: 0, xp: 0, ai: 'beast', multi: 2, noSleep: true, immune: ['frío'],
    attacks: [
      { name: 'Aliento helado', bonus: 0, dice: '5d8', type: 'frío', save: { abil: 'con', dc: 14, half: true, area: true } },
      { name: 'Mordisco', bonus: 6, dice: '2d10+3', type: 'perforante', extra: { dice: '1d6', type: 'frío' } },
      { name: 'Garra', bonus: 6, dice: '2d6+3', type: 'cortante' },
    ],
    saves: { str: 4, dex: 3, con: 7, int: -1, wis: 3, cha: 1 },
  },
  // La Tumba de los Reyes Serpiente. Goblins de hongo y guardián cobra con las estadísticas del goblin, el jefe goblin y la gárgola.
  'Fungus Goblin': {
    name: 'Goblin de hongo', img: 'goblin_hongo', ac: 15, hp: 10, dexMod: 2, xp: 50, ai: 'goblin',
    attacks: [
      { name: 'Cimitarra', bonus: 4, dice: '1d6+2', type: 'cortante' },
      { name: 'Arco corto', bonus: 4, dice: '1d6+2', type: 'perforante', ranged: true },
    ],
    saves: goblinSaves,
  },
  'Fungus Goblin Boss': {
    name: 'Jefe goblin de hongo', img: 'goblin_hongo', ac: 17, hp: 21, dexMod: 2, xp: 200, ai: 'goblin', multi: 2,
    attacks: [
      { name: 'Cimitarra', bonus: 4, dice: '1d6+2', type: 'cortante' },
      { name: 'Arco corto', bonus: 4, dice: '1d6+2', type: 'perforante', ranged: true },
    ],
    saves: { ...goblinSaves, str: 0, cha: 0 },
  },
  'Stone Cobra': {
    name: 'Guardián cobra de piedra', img: 'cobra_piedra', ac: 15, hp: 67, dexMod: 0, xp: 450, ai: 'beast', multi: 2, immune: ['veneno'], noSleep: true,
    attacks: [{ name: 'Mordisco de piedra', bonus: 4, dice: '2d4+2', type: 'cortante' }], saves: { str: 2, dex: 0, con: 3, int: -2, wis: 0, cha: -2 },
  },
  Mummy: {
    name: 'Momia', img: 'momia', ac: 11, hp: 58, dexMod: -1, xp: 700, ai: 'undead', noSleep: true, multi: 2, vuln: ['fuego'], immune: ['necrótico', 'veneno'],
    attacks: [{ name: 'Puño putrefacto', bonus: 5, dice: '1d10+3', type: 'contundente', extra: { dice: '3d6', type: 'necrótico' } }],
    saves: { str: 3, dex: -1, con: 2, int: -2, wis: 3, cha: 1 },
  },
  'Ochre Jelly': {
    name: 'Gelatina ocre', img: 'cieno_ocre', ac: 8, hp: 52, dexMod: -2, xp: 450, ai: 'beast', noSleep: true, resist: ['ácido'], immune: ['relámpago', 'cortante'],
    attacks: [{ name: 'Pseudópodo', bonus: 4, dice: '3d6+2', type: 'ácido' }],
    saves: { str: 2, dex: -2, con: 2, int: -4, wis: -2, cha: -5 },
  },
  'Black Pudding': {
    name: 'Pudin negro', img: 'pudin_negro', ac: 7, hp: 68, dexMod: -3, xp: 1100, ai: 'beast', noSleep: true, immune: ['ácido', 'frío', 'relámpago', 'cortante'],
    attacks: [{ name: 'Pseudópodo disolvente', bonus: 5, dice: '4d6+3', type: 'ácido' }],
    saves: { str: 3, dex: -3, con: 3, int: -5, wis: -2, cha: -5 },
  },
  // Simplificación de la mirada petrificadora (SRD: acción adicional, recarga 4–6, apresado y luego petrificado):
  // quien recibe el mordisco y falla la salvación de Constitución CD 12 queda paralizado.
  // Sin implementar del SRD: mirada espantosa de la momia, Dividirse de la gelatina ocre y Forma corrosiva del pudin negro.
  Basilisk: {
    name: 'Basilisco', img: 'basilisco', ac: 15, hp: 52, dexMod: -1, xp: 700, ai: 'beast',
    attacks: [{ name: 'Mordisco', bonus: 5, dice: '2d6+3', type: 'perforante', extra: { dice: '2d6', type: 'veneno' }, paralyze: { dc: 12 } }],
    saves: { str: 3, dex: -1, con: 2, int: -4, wis: -1, cha: -2 },
  },
  Incubus: {
    name: 'Baltoplat', img: 'baltoplat', ac: 15, hp: 66, dexMod: 3, xp: 1100, ai: 'cultist', multi: 2, resist: ['frío', 'fuego', 'veneno', 'psíquico'],
    attacks: [{ name: 'Toque inquietante', bonus: 7, dice: '3d6+5', type: 'psíquico' }],
    saves: { str: -1, dex: 3, con: 1, int: 2, wis: 1, cha: 5 },
  },
  // Mago del SRD 5.2.1 (CA 15, 81 PG, tres estallidos arcanos y bola de fuego de nivel 4 dos veces al día).
  // Como en los demás jefes, no se le puede dormir.
  Xiximanter: {
    name: 'Xiximanter', img: 'xiximanter', ac: 15, hp: 81, dexMod: 2, xp: 0, ai: 'caster', multi: 3, noSleep: true,
    attacks: [
      { name: 'Estallido arcano', bonus: 6, dice: '3d8+3', type: 'fuerza', ranged: true },
      { name: 'Bola de fuego', bonus: 0, dice: '9d6', type: 'fuego', save: { abil: 'dex', dc: 14, half: true, area: true, uses: 2 } },
      { name: 'Estallido arcano', bonus: 6, dice: '3d8+3', type: 'fuerza', ranged: true },
    ],
    saves: { str: -1, dex: 2, con: 0, int: 6, wis: 4, cha: 0 },
  },
} satisfies Record<string, MonsterDef>);

/** Arma con la que aparece cada enemigo según el diseño (nombre del arma → ataque preferido). */
export const WEAPON_DROP: Record<string, string> = {
  'Arco corto': 'shortbow', Cimitarra: 'scimitar', 'Pico de minero': 'pick', 'Espada corta': 'shortsword',
  Daga: 'dagger', 'Ballesta ligera': 'light_crossbow', Scimitar: 'scimitar', 'Light Crossbow': 'light_crossbow',
};
