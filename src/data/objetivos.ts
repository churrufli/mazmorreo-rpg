// Objetivos opcionales de algunos combates. Cumplirlos da un premio; fallarlos no impide ganar.
// No todos van contra el reloj: unos piden elegir bien a quién atacar primero y otros, proteger al grupo.
// Algunos dejan huella en la aventura (okFx / failFx): un refuerzo más adelante, un enemigo menos en el jefe
// o una vía nueva en una escena posterior. Los efectos son los mismos que los de las escenas.
// El premio suele ser un objeto que abre otra forma de luchar (red, fuego de alquimista, agua bendita…).
import type { Effect } from '../engine/escenas';
import type { ImgKey } from '../assets';

export interface Goal {
  enc: string;
  text: string;
  /**
   * kill: derribar a «who» antes del asalto «by»; win: ganar antes del asalto «by»; noflee: que no huya nadie;
   * spare: rendir a «who» sin matarlo; first: que el primer enemigo en caer sea «who»; nodown: que nadie del grupo caiga a 0 PG;
   * nosplit: que no se divida ningún cieno; noshriek: que el hongo chillón no llegue a chillar; nostone: que nadie quede petrificado;
   * guard: ganar antes de que «who» acabe con «ward» (le hace 1d4 al empezar cada asalto si nadie le retiene).
   */
  kind: 'kill' | 'win' | 'noflee' | 'spare' | 'first' | 'nodown' | 'nosplit' | 'noshriek' | 'nostone' | 'guard';
  /** La pieza: carta sin ataques en la retaguardia enemiga (con kind 'kill' y who = su nombre). No cuenta para ganar. */
  piece?: { name: string; img: ImgKey; hp: number; ac: number };
  /** Proteged a: quién está indefenso, sus PG y lo que le hace «who» cada asalto. */
  ward?: { name: string; hp: number; hurt: string };
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
  { enc: 'm2_e06', kind: 'kill', who: 'Torno de la trampa', by: 3, piece: { name: 'Torno de la trampa', img: 'trampa', hp: 8, ac: 12 },
    text: 'Los kobolds tensan una trampa de rocas: romped el torno antes del asalto 3.', ok: 'El torno se parte y las rocas se quedan donde estaban. Entre los cabos hay oro y una poción.', gold: 15, items: ['potion_healing'] },
  { enc: 's1_e04', kind: 'guard', who: 'Araña del pozo', ward: { name: 'el saqueador', hp: 9, hurt: 'aprieta la tela del saqueador' },
    text: 'Un saqueador cuelga envuelto en la tela: venced a la araña antes de que acabe con él. Agarrarla o tumbarla le da un respiro.', ok: 'Cortáis la tela y el saqueador cae al suelo, vivo. Os da lo que sacó de la tumba.', gold: 20, items: ['antidote'] },
  { enc: 's4_e01', kind: 'noshriek', text: 'Que el hongo chillón no llegue a chillar: acabad con él en cuanto podáis.', ok: 'Nadie ha oído nada. Los goblins llevaban un frasco robado.', gold: 10, items: ['potion_healing'] },
];
