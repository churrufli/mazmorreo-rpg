// Hilo conductor entre aventuras (2026-11-27): al terminar una, llega al pueblo un rumor que la une con la siguiente.
// Algunos dependen de lo que decidisteis (marcas de escenas y objetivos). Son rumores: no cambian la historia.
import type { AdvId } from '../engine/aventuras';

export interface Rumor { text: string; flag?: string }

export const HILO: Partial<Record<AdvId, Rumor[]>> = {
  hondaroca: [
    { text: 'En la posada se comenta que los devotos de Orvane compraban resina y raíces a unos leñadores de Vegaumbría. Nadie sabe para qué.' },
    { text: 'Los mineros de Valdescarcha brindan por quien cerró las compuertas del templo de Orvane.', flag: 'z4_compuertas' },
  ],
  corazon_hueco: [
    { text: 'Los leñadores de Vegaumbría dicen que este año el frío baja de Cumbrenieve antes de tiempo, y que los lobos huyen hacia el valle.' },
    { text: 'La dríade a la que perdonasteis os deja en la puerta una hoja que no se marchita.', flag: 'b4_driade' },
  ],
  montana: [
    { text: 'Entre el tesoro de Vharzûl aparece una moneda con una serpiente enroscada. Un caravanero dice que es de Arenaroja, más allá del desierto.' },
    { text: 'Los enanos de Cumbrenieve cuentan que las válvulas que reparasteis siguen echando aire templado.', flag: 'm3_valvulas' },
  ],
};

/** Rumores que tocan al terminar esa aventura, según lo que se decidió. */
export const rumorsAfter = (adv: AdvId, flags: string[] = []) => (HILO[adv] ?? []).filter(r => !r.flag || flags.includes(r.flag)).map(r => r.text);
