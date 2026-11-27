// Objetivos opcionales de algunos combates. Cumplirlos da un premio; fallarlos no impide ganar.
// No todos van contra el reloj: unos piden elegir bien a quién atacar primero y otros, proteger al grupo.
// Algunos dejan huella en la aventura (okFx / failFx): un refuerzo más adelante, un enemigo menos en el jefe
// o una vía nueva en una escena posterior. Los efectos son los mismos que los de las escenas.
// El premio suele ser un objeto que abre otra forma de luchar (red, fuego de alquimista, agua bendita…).
import type { Effect } from '../engine/escenas';
import type { ImgKey } from '../assets';
import type { Ability, DmgType } from './srd';

export interface Goal {
  enc: string;
  text: string;
  /**
   * kill: derribar a «who» antes del asalto «by»; win: ganar antes del asalto «by»; noflee: que no huya nadie;
   * spare: rendir a «who» sin matarlo; first: que el primer enemigo en caer sea «who»; nodown: que nadie del grupo caiga a 0 PG;
   * nosplit: que no se divida ningún cieno; noshriek: que el hongo chillón no llegue a chillar; nostone: que nadie quede petrificado;
   * guard: ganar antes de que «who» acabe con «ward» (le hace 1d4 al empezar cada asalto si nadie le retiene).
   */
  kind: 'kill' | 'win' | 'noflee' | 'spare' | 'first' | 'nodown' | 'nosplit' | 'noshriek' | 'nostone' | 'guard' | 'piece';
  /**
   * La pieza (kind 'piece', 2026-11-27): un objeto en el flanco izquierdo o derecho del campo, fuera de las filas.
   * No ataca ni tiene turno y no cuenta para ganar. Se activa al empezar el asalto «by» si sigue entero; con «runner»,
   * un enemigo corre a usarlo en el asalto anterior y lo activa en su turno del asalto «by» si nadie le para.
   * CA y PG de las tablas de objetos del SRD 5.2.1; los efectos, de sus trampas.
   */
  piece?: Piece;
  /** Proteged a: quién está indefenso, sus PG y lo que le hace «who» cada asalto. */
  ward?: { name: string; hp: number; hurt: string };
  /** Ilustración que se enseña con el objetivo al empezar el combate. */
  img?: ImgKey;
  who?: string;
  by?: number;
  /** Si se falla por tiempo, «who» se marcha con esta frase. */
  leave?: string;
  ok: string;
  gold: number;
  items: string[];
  /** Consecuencia para el resto de la aventura si se cumple o si se falla (se apunta al ganar el combate). */
  okFx?: Effect;
  failFx?: Effect;
}

export interface Piece {
  name: string;
  img: ImgKey;
  hp: number;
  ac: number;
  side: 'left' | 'right';
  /** Enemigo (nombre del grupo) que corre al objeto para usarlo. Si cae o no llega, no se activa. */
  runner?: string;
  /** Qué hace el runner con el objeto («toca el cuerno»). */
  use?: string;
  fx: PieceFx;
}

/** Lo que pasa cuando se activa la pieza. */
export interface PieceFx {
  text: string;
  /** Salvación contra la trampa: la vanguardia entera (y quien esté en el flanco) o, con «one», un personaje al azar. */
  save?: { abil: Ability; dc: number; dice: string; type: DmgType; half: boolean; one?: boolean };
  /** Se repite al empezar cada asalto hasta que se rompa (la catapulta). */
  repeat?: boolean;
  /** Llegan criaturas del SRD que ya están en el juego. */
  spawn?: { mon: string; name: string; count: number };
  /** Enemigos del combate que empiezan encerrados y salen al activarse (nombre del grupo). */
  cage?: string;
}

export const GOALS: Goal[] = [
  { enc: 'z1_e06', kind: 'kill', who: 'Vigía goblin', by: 3, text: 'Que el vigía no baje al pozo a avisar: derribadlo antes del asalto 3.', leave: 'baja por el pozo a dar la alarma', ok: 'El vigía no ha podido avisar a nadie. En su zurrón hay oro y una poción.', gold: 10, items: ['potion_healing'],
    failFx: { text: 'El vigía ha dado la alarma: en la prisión de abajo os esperan con refuerzos.', add: 'z2_e01', flag: 'z1_alarma' } },
  { enc: 'z2_e01', kind: 'win', by: 4, text: 'Salvad al preso: venced antes del asalto 4.', ok: 'Llegáis a tiempo: el preso os da una poción que escondía en la celda.', gold: 15, items: ['potion_healing'] },
  { enc: 'z3_e04', kind: 'win', by: 4, text: 'Venced antes del asalto 4, antes de que se cierre la losa de la cámara sellada.', ok: 'La losa sigue abierta: dentro hay oro y un frasco de agua bendita.', gold: 30, items: ['holy_water'] },
  { enc: 'z4_e03', kind: 'kill', who: 'Devoto de retaguardia', by: 3, text: 'Cortad el ritual: derribad al devoto de retaguardia antes del asalto 3.', ok: 'El ritual queda a medias: Orvane tendrá un rayo abrasador menos.', gold: 0, items: ['potion_healing'] },
  { enc: 'b1_e03', kind: 'noflee', text: 'Que no huya ningún bandido.', ok: 'Los bandidos no escapan: uno de ellos os entrega su bolsa y un frasco de fuego de alquimista.', gold: 25, items: ['alchemists_fire'] },
  { enc: 'b2_e08', kind: 'win', by: 4, text: 'Venced a la araña antes del asalto 4, antes de que se cierre el capullo del resinero.', ok: 'Sacáis al resinero del capullo: os regala fuego de alquimista y un antídoto.', gold: 0, items: ['alchemists_fire', 'antidote'],
    okFx: { text: 'El resinero conoce el anillo de resina: si pasáis por allí, os enseñará a abrir su caja.', flag: 'b2_resinero' } },
  { enc: 'b3_e01', kind: 'kill', who: 'Fuego fatuo', by: 3, text: 'Venced al fuego fatuo antes de que se desvanezca en el asalto 3.', leave: 'se desvanece en la niebla', ok: 'Donde se apagó la luz brilla algo entre el barro: oro y una poción.', gold: 20, items: ['potion_healing'] },
  { enc: 'b4_e02', kind: 'spare', who: 'Dríade corrompida', text: 'No matéis a la dríade: bajadla a la mitad de sus PG o menos y se rendirá.', ok: 'La dríade, libre de la corrupción, os da las gracias con una poción de curación mayor y se desvanece entre las hojas.', gold: 0, items: ['potion_greater_healing_1'],
    okFx: { text: 'La dríade promete retener a uno de los árboles del Corazón cuando lleguéis a él.', sub: 'b4_e04', flag: 'b4_driade' } },
  // Elegir a quién se ataca primero (sin reloj).
  { enc: 'z2_e03', kind: 'first', who: 'Cazador goblin', text: 'Los cazadores disparan desde detrás del enjambre: que el primero en caer sea uno de ellos.', ok: 'Sin el primer tirador, los demás pierden el aplomo. Entre sus cosas hay una red de caza.', gold: 10, items: ['net'] },
  { enc: 'z3_e03', kind: 'first', who: 'Necrófago de las ofrendas', text: 'Las garras del necrófago paralizan: que sea el primero en caer.', ok: 'El necrófago cae antes de paralizar a nadie más. Junto a las ofrendas queda un frasco de agua bendita.', gold: 15, items: ['holy_water'] },
  { enc: 'z4_e01', kind: 'first', who: 'Acólito arquero', text: 'El arquero apunta a los vuestros desde atrás: que sea el primero en caer.', ok: 'El arquero cae el primero. En su bandolera hay un frasco de fuego de alquimista.', gold: 0, items: ['alchemists_fire'] },
  { enc: 'b4_e03', kind: 'first', who: 'Brezna, la bruja del bosque', text: 'Brezna se escuda tras sus arbustos: que sea la primera en caer.', ok: 'Sin Brezna, los arbustos se quedan sin voz que los guíe. Entre sus frascos hay un vial de ácido.', gold: 30, items: ['acid_vial'] },
  { enc: 'm2_e03', kind: 'first', who: 'Mefit de hielo', text: 'El mefit hostiga desde atrás mientras el huargo os retiene: que sea el primero en caer.', ok: 'El mefit estalla en esquirlas antes de que el huargo caiga. Entre el hielo queda un frasco de fuego de alquimista.', gold: 15, items: ['alchemists_fire'] },
  { enc: 'm4_e03', kind: 'first', who: 'Kobold del tributo', text: 'Que el kobold no llegue a avisar a su amo: que sea el primero en caer.', ok: 'El kobold no llega a dar la voz. Llevaba una poción de resistencia al frío para acercarse al trono.', gold: 0, items: ['cold_resistance_potion'],
    failFx: { text: 'El kobold del tributo ha tenido tiempo de dar la voz: Vharzûl os esperará con más kobolds.', add: 'm4_e05', flag: 'm4_aviso' } },
  // Proteger al grupo (sin reloj): pide usar las filas, Esquivar y las curaciones a tiempo.
  { enc: 'z2_e05', kind: 'nodown', text: 'Que nadie del grupo caiga a 0 PG.', ok: 'Nadie ha caído: registráis la puerta con calma y encontráis una poción.', gold: 15, items: ['potion_healing'] },
  { enc: 'z3_e05', kind: 'nodown', text: 'Que nadie del grupo caiga a 0 PG ante el sepulcro.', ok: 'Seguís todos en pie. Bajo el sarcófago hay oro y una poción.', gold: 20, items: ['potion_healing'] },
  { enc: 'b3_e06', kind: 'nodown', text: 'Que nadie del grupo caiga a 0 PG.', ok: 'Nadie ha caído. En el puesto de la antigua orden queda un frasco de agua bendita.', gold: 15, items: ['holy_water'] },
  { enc: 'm1_e03', kind: 'nodown', text: 'Que la manada no derribe a nadie del grupo.', ok: 'La manada no ha derribado a nadie. En la cornisa hay un zurrón con una poción.', gold: 10, items: ['potion_healing'] },
  { enc: 'm3_e02', kind: 'nodown', text: 'Que nadie del grupo caiga a 0 PG.', ok: 'Seguís todos en pie. Entre las cadenas hay un frasco de agua bendita.', gold: 20, items: ['holy_water'] },
  { enc: 'm4_e02', kind: 'nodown', text: 'Que nadie del grupo caiga a 0 PG junto al lago.', ok: 'Nadie ha caído. En la orilla hay oro y una poción.', gold: 25, items: ['potion_healing'] },
  // La Tumba de los Reyes Serpiente (2026-11-27): sus criaturas tienen reglas propias del SRD.
  { enc: 's2_e06', kind: 'nosplit', text: 'Que el pudin negro no se divida: nada de armas cortantes ni relámpagos contra él.', ok: 'El pudin se deshace entero. Entre sus restos brilla algo que no ha podido disolver.', gold: 25, items: ['alchemists_fire'] },
  { enc: 's3_e05', kind: 'nostone', text: 'Que el basilisco no petrifique a nadie.', ok: 'Nadie ha quedado de piedra. Junto al basilisco hay restos de otros que no tuvieron tanta suerte.', gold: 20, items: ['potion_healing'] },
  // La pieza y Proteged a (2026-11-27): como mucho una por zona.
  { enc: 'm2_e06', kind: 'piece', who: 'Torno de la trampa', by: 3,
    piece: { name: 'Torno de la trampa', img: 'pieza_torno', hp: 10, ac: 15, side: 'right',
      fx: { text: 'El torno se suelta y las rocas caen sobre la vanguardia.', save: { abil: 'dex', dc: 13, dice: '2d10', type: 'contundente', half: true } } },
    text: 'Los kobolds tensan una trampa de rocas: romped el torno del flanco antes del asalto 3.', ok: 'El torno se parte y las rocas se quedan donde estaban. Entre los cabos hay oro y una poción.', gold: 15, items: ['potion_healing'] },
  { enc: 's1_e04', kind: 'guard', img: 'escena_saqueador_tela', who: 'Araña del pozo', ward: { name: 'el saqueador', hp: 9, hurt: 'aprieta la tela del saqueador' },
    text: 'Un saqueador cuelga envuelto en la tela: venced a la araña antes de que acabe con él. Agarrarla o tumbarla le da un respiro.', ok: 'Cortáis la tela y el saqueador cae al suelo, vivo. Os da lo que sacó de la tumba.', gold: 20, items: ['antidote'] },
  { enc: 's4_e01', kind: 'noshriek', text: 'Que el hongo chillón no llegue a chillar: acabad con él en cuanto podáis.', ok: 'Nadie ha oído nada. Los goblins llevaban un frasco robado.', gold: 10, items: ['potion_healing'] },
  // Elementos rompibles del flanco (2026-11-27): uno cada dos zonas.
  { enc: 'z2_e04', kind: 'piece', who: 'Cuerno de alarma', by: 3,
    piece: { name: 'Cuerno de alarma', img: 'pieza_cuerno', hp: 10, ac: 15, side: 'right', runner: 'Guardia del jefe goblin', use: 'toca el cuerno',
      fx: { text: '¡Suena el cuerno! Acuden más goblins.', spawn: { mon: 'Goblin Warrior', name: 'Goblin del cuerno', count: 2 } } },
    text: 'Un goblin corre a tocar el cuerno de alarma: rompedlo o tumbad al goblin antes del asalto 3.', ok: 'El cuerno no ha sonado. Junto a su soporte hay oro y una poción.', gold: 15, items: ['potion_healing'] },
  { enc: 'z4_e02', kind: 'piece', who: 'Fuelle de la forja', by: 3,
    piece: { name: 'Fuelle de la forja', img: 'pieza_fuelle', hp: 18, ac: 11, side: 'left',
      fx: { text: 'El fuelle revienta y un chorro de vapor ardiente barre la vanguardia.', save: { abil: 'dex', dc: 13, dice: '2d10', type: 'fuego', half: true } } },
    text: 'El fuelle de la forja se hincha de vapor: rajadlo antes del asalto 3.', ok: 'El fuelle se desinfla sin daño. Entre las herramientas de la forja hay oro y un frasco de fuego de alquimista.', gold: 15, items: ['alchemists_fire'] },
  { enc: 'b1_e06', kind: 'piece', who: 'Cuerda de la catapulta', by: 2,
    piece: { name: 'Cuerda de la catapulta', img: 'pieza_catapulta', hp: 10, ac: 11, side: 'right',
      fx: { text: 'La catapulta de los bandidos dispara una piedra.', repeat: true, save: { abil: 'dex', dc: 13, dice: '1d10', type: 'contundente', half: false, one: true } } },
    text: 'Desde el asalto 2, la catapulta lanza una piedra cada asalto: cortad su cuerda.', ok: 'La catapulta se queda sin cuerda. Entre las piedras de munición hay oro y una poción.', gold: 15, items: ['potion_healing'] },
  { enc: 'b4_e01', kind: 'piece', who: 'Vaina de esporas', by: 3,
    piece: { name: 'Vaina de esporas', img: 'pieza_vaina', hp: 10, ac: 11, side: 'left',
      fx: { text: 'La vaina revienta y una nube de esporas cae sobre la vanguardia.', save: { abil: 'con', dc: 11, dice: '1d10', type: 'veneno', half: false } } },
    text: 'Una vaina de esporas está a punto de reventar: rompedla antes del asalto 3.', ok: 'La vaina se seca sin soltar las esporas. Entre sus raíces hay un antídoto.', gold: 10, items: ['antidote'] },
  { enc: 'm4_e04', kind: 'piece', who: 'Hoguera de aviso', by: 3,
    piece: { name: 'Hoguera de aviso', img: 'pieza_hoguera', hp: 10, ac: 15, side: 'left', runner: 'Kobold del tributo', use: 'prende la hoguera',
      fx: { text: '¡La hoguera de aviso arde! Llegan más kobolds.', spawn: { mon: 'Kobold', name: 'Kobold de la hoguera', count: 2 } } },
    text: 'Un kobold corre a prender la hoguera de aviso: deshacedla o tumbad al kobold antes del asalto 3.', ok: 'La hoguera no ha llegado a arder. Entre la leña hay oro y una poción.', gold: 20, items: ['potion_healing'] },
  { enc: 's1_e01', kind: 'piece', who: 'Brasero de almas', by: 3,
    piece: { name: 'Brasero de almas', img: 'pieza_brasero', hp: 10, ac: 17, side: 'right',
      fx: { text: 'La llama verde del brasero se aviva y alza a otro guardián de hueso.', spawn: { mon: 'Skeleton', name: 'Guardián alzado', count: 1 } } },
    text: 'El brasero de almas llama a los muertos: volcadlo antes del asalto 3.', ok: 'La llama verde se apaga. Entre la ceniza hay oro y un frasco de agua bendita.', gold: 15, items: ['holy_water'] },
  { enc: 's4_e04', kind: 'piece', who: 'Palanca de la jaula', by: 3,
    piece: { name: 'Palanca de la jaula', img: 'pieza_palanca', hp: 5, ac: 19, side: 'left', runner: 'Carcelero', use: 'tira de la palanca',
      fx: { text: '¡La jaula se abre y el cieno guardián sale reptando!', cage: 'Cieno guardián' } },
    text: 'El cieno espera enjaulado: romped la palanca o tumbad al carcelero que corre hacia ella antes del asalto 3.', ok: 'La jaula sigue cerrada. Los carceleros llevaban un frasco robado.', gold: 15, items: ['potion_healing'] },
];
