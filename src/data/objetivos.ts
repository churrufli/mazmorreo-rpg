// Objetivos opcionales de algunos combates (uno por zona). Cumplirlos da un premio; fallarlos no impide ganar.
export interface Goal {
  enc: string;
  text: string;
  /** kill: derribar a «who» antes del asalto «by»; win: ganar antes del asalto «by»; noflee: que no huya nadie; spare: rendir a «who» sin matarlo. */
  kind: 'kill' | 'win' | 'noflee' | 'spare';
  who?: string;
  by?: number;
  /** Si se falla por tiempo, «who» se marcha con esta frase. */
  leave?: string;
  ok: string;
  gold: number;
  items: string[];
}

export const GOALS: Goal[] = [
  { enc: 'z1_e06', kind: 'kill', who: 'Vigía goblin', by: 3, text: 'Que el vigía no baje al pozo a avisar: derribadlo antes del asalto 3.', leave: 'baja por el pozo a dar la alarma', ok: 'El vigía no ha podido avisar a nadie. En su zurrón hay oro y una poción.', gold: 10, items: ['potion_healing'] },
  { enc: 'z2_e01', kind: 'win', by: 4, text: 'Salvad al preso: venced antes del asalto 4.', ok: 'Llegáis a tiempo: el preso os da una poción que escondía en la celda.', gold: 15, items: ['potion_healing'] },
  { enc: 'z3_e04', kind: 'win', by: 4, text: 'Venced antes del asalto 4, antes de que se cierre la losa de la cámara sellada.', ok: 'La losa sigue abierta: dentro hay oro y un frasco de agua bendita.', gold: 30, items: ['holy_water'] },
  { enc: 'z4_e03', kind: 'kill', who: 'Devoto de retaguardia', by: 3, text: 'Cortad el ritual: derribad al devoto de retaguardia antes del asalto 3.', ok: 'El ritual queda a medias: Orvane tendrá un rayo abrasador menos.', gold: 0, items: ['potion_healing'] },
  { enc: 'b1_e03', kind: 'noflee', text: 'Que no huya ningún bandido.', ok: 'Los bandidos no escapan: uno de ellos os entrega su bolsa y un frasco de fuego de alquimista.', gold: 25, items: ['alchemists_fire'] },
  { enc: 'b2_e08', kind: 'win', by: 4, text: 'Venced a la araña antes del asalto 4, antes de que se cierre el capullo del resinero.', ok: 'Sacáis al resinero del capullo: os regala fuego de alquimista y un antídoto.', gold: 0, items: ['alchemists_fire', 'antidote'] },
  { enc: 'b3_e01', kind: 'kill', who: 'Fuego fatuo', by: 3, text: 'Venced al fuego fatuo antes de que se desvanezca en el asalto 3.', leave: 'se desvanece en la niebla', ok: 'Donde se apagó la luz brilla algo entre el barro: oro y una poción.', gold: 20, items: ['potion_healing'] },
  { enc: 'b4_e02', kind: 'spare', who: 'Dríade corrompida', text: 'No matéis a la dríade: bajadla de la mitad de sus PG y se rendirá.', ok: 'La dríade, libre de la corrupción, os da las gracias con una poción de curación mayor.', gold: 0, items: ['potion_greater_healing_1'] },
];
