// Datos de reglas basados en el SRD 5.2.1 (D&D 2024), reducidos a lo que usan las aventuras.
// Los valores de criaturas son los del SRD; el equilibrio se ajustará jugando.
import type { ImgKey } from '../assets';

export type Ability = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
/** El bárbaro solo existe como aliado (Vurka, en la montaña): no se elige como héroe. */
export type ClassId = 'fighter' | 'cleric' | 'rogue' | 'wizard' | 'ranger' | 'paladin' | 'barbarian';
/** Clases que puede elegir el héroe; explorador y paladín solo son aliados. */
export const HERO_CLASSES: ClassId[] = ['fighter', 'cleric', 'rogue', 'wizard', 'ranger', 'paladin'];
export type SpeciesId = 'human' | 'elf' | 'dwarf' | 'halfling';

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
};

export interface SpeciesDef { name: string; blurb: string }
export const SPECIES: Record<SpeciesId, SpeciesDef> = {
  human: { name: 'Humano', blurb: 'Versátil: competencia en Percepción.' },
  elf: { name: 'Elfo', blurb: 'Sentidos agudos: competencia en Percepción. Inmune al sueño mágico.' },
  dwarf: { name: 'Enano', blurb: 'Dureza enana: +1 PG por nivel y resistencia al veneno.' },
  halfling: { name: 'Mediano', blurb: 'Suerte: repite los 1 naturales en el d20.' },
};

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
  thrown?: { dice?: string; type?: DmgType; undeadOnly?: boolean; restrain?: boolean; burn?: boolean };
  /** Varita que lanza Telaraña. */
  web?: boolean;
  resistPoison?: boolean;
  curePoison?: boolean;
  /** Resistencia al frío: la poción durante el combate; anillo y botas mientras se llevan. */
  resistCold?: boolean;
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
  arcane_focus: { name: 'Foco arcano', kind: 'gear', img: 'cristal', value: 10, desc: 'Foco para los conjuros del mago.' },
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
  heart_fragment: { name: 'Astilla del Corazón', kind: 'gear', img: 'astilla_corazon', value: 150, desc: 'Astilla de madera petrificada del Corazón Hueco. Ya no tiene poder. Trofeo que se guarda en el baúl de la posada.' },
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
  save?: { abil: Ability; dc: number; half: boolean; area?: boolean; recharge?: number };
  paralyze?: { dc: number };
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
    saves: { str: -2, dex: 3, con: 0, int: -4, wis: 0, cha: -3 },
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
    saves: { ...goblinSaves, str: 0 },
  },
  'Giant Spider': {
    name: 'Araña gigante', img: 'arana_gigante', ac: 14, hp: 26, dexMod: 3, xp: 200, ai: 'beast',
    attacks: [{ name: 'Mordisco venenoso', bonus: 5, dice: '1d8+3', type: 'perforante', extra: { dice: '2d6', type: 'veneno' } }],
    saves: { str: 2, dex: 3, con: 1, int: -4, wis: 0, cha: -3 },
  },
  'Swarm of Bats': {
    name: 'Enjambre de murciélagos', img: 'enjambre_murcielagos', ac: 12, hp: 11, dexMod: 2, xp: 50, ai: 'beast',
    resist: ['contundente', 'perforante', 'cortante'],
    attacks: [{ name: 'Mordiscos', bonus: 4, dice: '2d4', type: 'perforante' }],
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
    name: 'Necrófago', img: 'necrofago', ac: 12, hp: 22, dexMod: 2, xp: 200, ai: 'undead', noSleep: true, multi: 2,
    immune: ['veneno'],
    attacks: [
      { name: 'Mordisco', bonus: 4, dice: '1d6+2', type: 'perforante', extra: { dice: '1d6', type: 'necrótico' } },
      { name: 'Garras', bonus: 4, dice: '1d4+2', type: 'cortante', paralyze: { dc: 10 } },
    ],
    saves: { str: 1, dex: 2, con: 0, int: -2, wis: 0, cha: -2 },
  },
  Cultist: {
    name: 'Cultista', img: 'cultista', ac: 12, hp: 9, dexMod: 1, xp: 25, ai: 'cultist',
    attacks: [
      { name: 'Daga', bonus: 3, dice: '1d4+1', type: 'perforante', extra: { dice: '1', type: 'necrótico' } },
      { name: 'Ballesta ligera', bonus: 3, dice: '1d8+1', type: 'perforante', ranged: true },
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
    attacks: [{ name: 'Mordisco', bonus: 4, dice: '1d6+2', type: 'perforante' }], saves: beast(1, 2, 1),
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
    saves: beast(3, 1, 3),
  },
  'Awakened Shrub': {
    name: 'Arbusto despertado', img: 'arbusto_despertado', ac: 9, hp: 10, dexMod: -1, xp: 10, ai: 'beast', noSleep: true,
    vuln: ['fuego'], resist: ['perforante'],
    attacks: [{ name: 'Arañazo', bonus: 1, dice: '1d4-1', type: 'cortante' }], saves: { str: -3, dex: -1, con: 0, int: -2, wis: 0, cha: -2 },
  },
  Owlbear: {
    // Rebajado (era 59 PG y 2d8+5): en la zona 2 del bosque el grupo solo tiene dos personajes.
    name: 'Oso lechuza', img: 'oso_lechuza', ac: 13, hp: 45, dexMod: 1, xp: 700, ai: 'beast', multi: 2,
    attacks: [{ name: 'Desgarrar', bonus: 6, dice: '1d10+4', type: 'cortante' }], saves: beast(5, 1, 3),
  },
  'Giant Boar': {
    name: 'Jabalí gigante', img: 'jabali_gigante', ac: 13, hp: 42, dexMod: 0, xp: 450, ai: 'beast',
    attacks: [{ name: 'Colmillos', bonus: 5, dice: '2d6+3', type: 'cortante' }], saves: beast(3, 0, 3),
  },
  "Will-o'-Wisp": {
    name: 'Fuego fatuo', img: 'fuego_fatuo', ac: 19, hp: 27, dexMod: 9, xp: 450, ai: 'undead', noSleep: true,
    resist: ['ácido', 'contundente', 'frío', 'fuego', 'necrótico', 'perforante', 'cortante'], immune: ['relámpago', 'veneno'],
    attacks: [{ name: 'Descarga', bonus: 4, dice: '2d8', type: 'relámpago' }], saves: { str: -5, dex: 9, con: 0, int: 1, wis: 2, cha: 0 },
  },
  Harpy: {
    name: 'Arpía', img: 'arpia', ac: 11, hp: 38, dexMod: 1, xp: 200, ai: 'beast',
    attacks: [{ name: 'Garra', bonus: 3, dice: '2d4+1', type: 'cortante' }], saves: { str: 1, dex: 1, con: 1, int: -2, wis: 0, cha: 1 },
  },
  Specter: {
    name: 'Espectro', img: 'espectro', ac: 12, hp: 22, dexMod: 2, xp: 200, ai: 'undead', noSleep: true,
    resist: ['ácido', 'frío', 'fuego', 'relámpago', 'trueno', 'contundente', 'perforante', 'cortante'], immune: ['necrótico', 'veneno'],
    attacks: [{ name: 'Drenar vida', bonus: 4, dice: '3d6', type: 'necrótico' }], saves: { str: -5, dex: 2, con: 0, int: 0, wis: 0, cha: 0 },
  },
  'Shambling Mound': {
    name: 'Montículo andante', img: 'monticulo_andante', ac: 15, hp: 110, dexMod: -1, xp: 1800, ai: 'beast', multi: 2, noSleep: true,
    resist: ['frío', 'fuego'], immune: ['relámpago'],
    attacks: [{ name: 'Golpe', bonus: 7, dice: '1d8+4', type: 'contundente' }], saves: { str: 4, dex: -1, con: 3, int: -3, wis: 0, cha: -3 },
  },
  Dryad: {
    name: 'Dríade', img: 'driade', ac: 16, hp: 22, dexMod: 1, xp: 200, ai: 'cultist',
    attacks: [
      { name: 'Látigo de enredadera', bonus: 6, dice: '1d10+4', type: 'cortante' },
      { name: 'Ráfaga de espinas', bonus: 6, dice: '1d6+4', type: 'perforante', ranged: true },
    ],
    saves: { str: 0, dex: 1, con: 0, int: 2, wis: 4, cha: 3 },
  },
  'Green Hag': {
    name: 'Bruja verde', img: 'bruja_verde', ac: 17, hp: 82, dexMod: 1, xp: 700, ai: 'cultist', multi: 2,
    attacks: [
      { name: 'Garra', bonus: 6, dice: '2d8+4', type: 'cortante' },
      { name: 'Rayo de enfermedad', bonus: 5, dice: '2d8', type: 'veneno', ranged: true },
    ],
    saves: { str: 4, dex: 1, con: 3, int: 1, wis: 2, cha: 2 },
  },
  // Árbol despertado entero (SRD); 'Awakened Tree' se usa para los nudos de raíz del jefe.
  'Walking Tree': {
    name: 'Árbol despertado', img: 'arbol_despertado', ac: 13, hp: 59, dexMod: -2, xp: 450, ai: 'beast', noSleep: true,
    resist: ['contundente', 'perforante'], vuln: ['fuego'],
    attacks: [{ name: 'Golpe de rama', bonus: 6, dice: '3d6+4', type: 'contundente' }], saves: { str: 4, dex: -2, con: 2, int: -2, wis: 0, cha: -2 },
  },
  'Awakened Tree': {
    name: 'Nudo de raíz', img: 'nudo_de_raiz', ac: 12, hp: 12, dexMod: -2, xp: 0, ai: 'beast', noSleep: true, knot: true,
    attacks: [], saves: { str: 2, dex: -2, con: 2, int: -2, wis: 0, cha: -2 },
  },
  Treant: {
    name: 'El Corazón Hueco', img: 'corazon_hueco', ac: 15, hp: 80, dexMod: 0, xp: 0, ai: 'beast', multi: 2, noSleep: true, reach: true,
    attacks: [{ name: 'Raíz', bonus: 5, dice: '1d6+3', type: 'contundente' }], saves: { str: 6, dex: -1, con: 5, int: 1, wis: 3, cha: 1 },
  },
  // El Invierno del Dragón
  Kobold: {
    name: 'Kobold', img: 'kobold', ac: 12, hp: 5, dexMod: 2, xp: 25, ai: 'goblin', packTactics: true,
    attacks: [
      { name: 'Daga', bonus: 4, dice: '1d4+2', type: 'perforante' },
      { name: 'Honda', bonus: 4, dice: '1d4+2', type: 'contundente', ranged: true },
    ],
    saves: { str: -2, dex: 2, con: -1, int: -1, wis: -2, cha: -1 },
  },
  'Ice Mephit': {
    name: 'Mefit de hielo', img: 'mefit_hielo', ac: 11, hp: 21, dexMod: 1, xp: 100, ai: 'beast', noSleep: true,
    immune: ['frío', 'veneno'], vuln: ['contundente', 'fuego'],
    attacks: [
      { name: 'Aliento helado', bonus: 0, dice: '2d4', type: 'frío', save: { abil: 'dex', dc: 10, half: true, area: true, recharge: 6 } },
      { name: 'Garras', bonus: 3, dice: '1d4+1', type: 'cortante', extra: { dice: '1d4', type: 'frío' } },
    ],
    saves: { str: -2, dex: 1, con: 0, int: -1, wis: 0, cha: 0 },
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
      { name: 'Aliento gélido', bonus: 0, dice: '4d8', type: 'frío', save: { abil: 'dex', dc: 12, half: true, area: true, recharge: 5 } },
      { name: 'Mordisco', bonus: 6, dice: '2d6+4', type: 'perforante' },
    ],
    saves: beast(4, 1, 2),
  },
  'White Dragon Wyrmling': {
    name: 'Cría de dragón blanco', img: 'cria_dragon_blanco', ac: 16, hp: 32, dexMod: 0, xp: 450, ai: 'beast', immune: ['frío'],
    attacks: [
      { name: 'Aliento helado', bonus: 0, dice: '5d8', type: 'frío', save: { abil: 'con', dc: 12, half: true, area: true, recharge: 5 } },
      { name: 'Mordisco', bonus: 4, dice: '1d10+2', type: 'perforante', extra: { dice: '1d4', type: 'frío' } },
    ],
    saves: { str: 2, dex: 2, con: 2, int: -3, wis: 2, cha: 0 },
  },
  // Jefe adaptado (diseño de la aventura, no el bloque SRD entero): mordisco y garra; el aliento va en asaltos fijos (combat.ts).
  'Young White Dragon': {
    name: 'Vharzûl', img: 'dragon_blanco_joven', ac: 16, hp: 110, dexMod: 0, xp: 0, ai: 'beast', multi: 2, noSleep: true, immune: ['frío'],
    attacks: [
      { name: 'Aliento helado', bonus: 0, dice: '6d8', type: 'frío', save: { abil: 'con', dc: 15, half: true, area: true } },
      { name: 'Mordisco', bonus: 7, dice: '2d10+4', type: 'perforante', extra: { dice: '1d6', type: 'frío' } },
      { name: 'Garra', bonus: 7, dice: '2d6+4', type: 'cortante' },
    ],
    saves: { str: 4, dex: 3, con: 7, int: -1, wis: 3, cha: 1 },
  },
} satisfies Record<string, MonsterDef>);

/** Arma con la que aparece cada enemigo según el diseño (nombre del arma → ataque preferido). */
export const WEAPON_DROP: Record<string, string> = {
  'Arco corto': 'shortbow', Cimitarra: 'scimitar', 'Pico de minero': 'pick', 'Espada corta': 'shortsword',
  Daga: 'dagger', 'Ballesta ligera': 'light_crossbow', Scimitar: 'scimitar', 'Light Crossbow': 'light_crossbow',
};
