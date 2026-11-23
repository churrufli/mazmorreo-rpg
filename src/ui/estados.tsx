import React from 'react';
import { Image, View } from 'react-native';
import { mdiBottleTonicSkull, mdiCreation, mdiEyeOff, mdiArrowCollapseDown, mdiFire, mdiHandshake, mdiLinkVariant, mdiShieldOff, mdiLock, mdiRunFast, mdiSkull, mdiSleep, mdiStarFourPoints, mdiTarget } from '@mdi/js';
import { ImgKey, IMG } from '../assets';
import type { Combat, Unit } from '../engine/combat';
import { Icon } from './kit';

/** Estados que se ven en las cartas: cada uno con su esfera de color, su icono y una explicación corta. */
export type StateKey = 'dodge' | 'bless' | 'asleep' | 'paralyzed' | 'guided' | 'hidden' | 'restrained' | 'burn' | 'poisoned' | 'mark' | 'death' | 'helped' | 'sapped' | 'prone';

export const STATES: Record<StateKey, { name: string; orb: ImgKey; icon: string; desc: string }> = {
  dodge: { name: 'Esquiva', orb: 'esfera_dorada', icon: mdiRunFast, desc: 'Los ataques contra él tienen desventaja hasta su siguiente turno.' },
  bless: { name: 'Bendito', orb: 'esfera_dorada', icon: mdiCreation, desc: 'Suma 1d4 a sus ataques y salvaciones.' },
  asleep: { name: 'Dormido', orb: 'esfera_celeste', icon: mdiSleep, desc: 'No actúa hasta que recibe daño.' },
  paralyzed: { name: 'Paralizado', orb: 'esfera_piedra', icon: mdiLock, desc: 'No puede moverse ni actuar; los golpes contra él aciertan con más facilidad.' },
  guided: { name: 'Marcado', orb: 'esfera_turquesa', icon: mdiStarFourPoints, desc: 'El siguiente ataque contra él tiene ventaja.' },
  hidden: { name: 'Oculto', orb: 'esfera_violeta', icon: mdiEyeOff, desc: 'Su siguiente ataque tiene ventaja. Quien quiera atacarle tiene que encontrarle con Percepción.' },
  restrained: { name: 'Apresado', orb: 'esfera_plata', icon: mdiLinkVariant, desc: 'Atrapado: ataca con desventaja y los ataques contra él tienen ventaja hasta que se libere.' },
  burn: { name: 'Ardiendo', orb: 'esfera_naranja', icon: mdiFire, desc: 'Recibe daño de fuego al empezar su turno.' },
  poisoned: { name: 'Envenenado', orb: 'esfera_verde', icon: mdiBottleTonicSkull, desc: 'Ataca con desventaja mientras dure el veneno.' },
  mark: { name: 'Marcado por', orb: 'esfera_roja', icon: mdiTarget, desc: 'Quien lo marcó le hace 1d6 de daño extra con cada golpe.' },
  helped: { name: 'Distraído', orb: 'esfera_turquesa', icon: mdiHandshake, desc: 'El próximo ataque de un aliado de quien le distrae tiene ventaja contra él.' },
  sapped: { name: 'Debilitado', orb: 'esfera_piedra', icon: mdiShieldOff, desc: 'Su próximo ataque tiene desventaja.' },
  prone: { name: 'Derribado', orb: 'esfera_plata', icon: mdiArrowCollapseDown, desc: 'En el suelo: ataca con desventaja; cuerpo a cuerpo contra él hay ventaja y a distancia, desventaja. Se levanta en su turno.' },
  death: { name: 'Muerte', orb: 'esfera_sombra', icon: mdiSkull, desc: 'Caído: tira salvaciones de muerte. Tres éxitos lo estabilizan; tres fallos, muere.' },
};

/** `ends`: cuánto le dura o cómo se le pasa, cuando depende de la partida. */
export interface StateTag { key: StateKey; label: string; ends?: string }

/** Estados de una unidad en combate, en el orden en que se muestran. */
export function statesOf(cb: Combat, u: Unit): StateTag[] {
  const out: StateTag[] = [];
  const add = (key: StateKey, label = STATES[key].name, ends?: string) => out.push({ key, label, ends });
  const first = (k?: string) => cb.units.find(x => x.key === k)?.name.split(' ')[0];
  const blesser = cb.units.find(x => x.side === u.side && x.concentration === 'bless' && !x.dead && x.hp > 0);
  if (u.hp <= 0 && u.side === 'party' && !u.dead) add('death', `Muerte ${u.deathS ?? 0}✓ ${u.deathF ?? 0}✗`);
  if (u.asleep) add('asleep');
  if (u.paralyzed) add('paralyzed', undefined, 'Al acabar cada turno suyo, salvación de Constitución CD 10 para librarse.');
  if (u.restrained) add('restrained', undefined, `En su turno intenta soltarse: Fuerza CD ${u.restrained}. Mientras, no hace nada más.`);
  if (u.poisoned) add('poisoned', undefined, 'Hasta que acabe el combate o se cure con un antídoto.');
  if (u.burn) add('burn', undefined, u.burn === 1 ? 'Le queda 1 turno ardiendo.' : `Le quedan ${u.burn} turnos ardiendo.`);
  const marker = cb.units.find(x => x.mark === u.key && !x.dead && !x.fled && x.hp > 0);
  if (marker) add('mark', `Marcado por ${marker.name.split(' ')[0]}`, marker.concentration === 'mark' ? `Mientras ${marker.name.split(' ')[0]} mantenga la concentración.` : undefined);
  if (u.prone) add('prone');
  if (u.sapped) add('sapped', undefined, first(u.sapped) ? `Hasta su próximo ataque o el turno de ${first(u.sapped)}.` : undefined);
  if (u.helped) add('helped', undefined, first(u.helped) ? `Hasta el próximo turno de ${first(u.helped)}.` : undefined);
  if (u.guided) add('guided');
  if (u.hidden) add('hidden');
  if (u.dodge) add('dodge');
  if (u.bless) add('bless', undefined, blesser ? `Mientras ${blesser.name.split(' ')[0]} mantenga la concentración.` : undefined);
  return out;
}

/** Esfera del estado con su icono encima. */
export function StateOrb({ k, size }: { k: StateKey; size: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Image source={IMG[STATES[k].orb]} style={{ position: 'absolute', width: size, height: size }} />
      <View style={{ position: 'absolute', zIndex: 1, left: size * 0.19, top: size * 0.19 }}>
        <Icon path={STATES[k].icon} size={size * 0.62} color="#fff4dc" outline />
      </View>
    </View>
  );
}
