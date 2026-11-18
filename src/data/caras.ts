// Centro de la cara en cada ilustración de personaje (fracción del ancho y del alto, imágenes 2:3).
// Medido a ojo sobre el arte; sirve para recortar retratos, fichas del mapa y cartas hasta la cintura.
import type { ImgKey } from '../assets';
import type { SpeciesId } from './srd';

const px = (x: number, y: number): [number, number] => [x / 512, y / 768];

export const FACE: Partial<Record<ImgKey, [number, number]>> = {
  hero_cleric_dwarf: px(258, 162), hero_cleric_elf: px(256, 95), hero_cleric_halfling: px(258, 191), hero_cleric_human: px(253, 90),
  hero_fighter_dwarf: px(268, 166), hero_fighter_elf: px(253, 90), hero_fighter_halfling: px(253, 181), hero_fighter_human: px(243, 80),
  hero_rogue_dwarf: px(283, 190), hero_rogue_elf: px(258, 130), hero_rogue_halfling: px(243, 140), hero_rogue_human: px(278, 125),
  hero_wizard_dwarf: px(263, 140), hero_wizard_elf: px(258, 110), hero_wizard_halfling: px(268, 168), hero_wizard_human: px(258, 115),
  ally_brunna: px(242, 100), ally_tiko: px(252, 100), ally_edmund: px(250, 62), ally_liss: px(256, 70), orvane: px(250, 70),
  ally_anselmo: px(256, 60), ally_ivelle: px(256, 76), ally_maren: px(260, 80), ally_telmo: px(260, 64), abuela_ortiga: px(200, 138), corazon_hueco: px(256, 80),
  ally_vurka: px(256, 100), ally_durnok: px(256, 100), ally_syrael: px(256, 100), ally_aldric: px(256, 100), dragon_blanco_joven: px(256, 200),
  hero_paladin_dwarf: px(256, 60), hero_paladin_elf: px(256, 52), hero_paladin_halfling: px(256, 160), hero_paladin_human: px(256, 50),
  hero_ranger_dwarf: px(256, 100), hero_ranger_elf: px(256, 84), hero_ranger_halfling: px(264, 80), hero_ranger_human: px(256, 76),
  // Versiones del otro sexo (3.xb).
  hero_fighter_dwarf_b: px(250, 116), hero_fighter_elf_b: px(260, 70), hero_fighter_halfling_b: px(256, 116), hero_fighter_human_b: px(248, 80),
  hero_cleric_dwarf_b: px(256, 150), hero_cleric_elf_b: px(250, 100), hero_cleric_halfling_b: px(260, 144), hero_cleric_human_b: px(256, 104),
  hero_rogue_dwarf_b: px(244, 124), hero_rogue_elf_b: px(250, 96), hero_rogue_halfling_b: px(250, 124), hero_rogue_human_b: px(256, 100),
  hero_wizard_dwarf_b: px(260, 110), hero_wizard_elf_b: px(256, 80), hero_wizard_halfling_b: px(256, 116), hero_wizard_human_b: px(256, 84),
  hero_ranger_dwarf_b: px(256, 96), hero_ranger_elf_b: px(250, 90), hero_ranger_halfling_b: px(256, 96), hero_ranger_human_b: px(252, 80),
  hero_paladin_dwarf_b: px(260, 116), hero_paladin_elf_b: px(256, 84), hero_paladin_halfling_b: px(256, 104), hero_paladin_human_b: px(256, 90),
  hero_barbarian_dwarf: px(245, 110), hero_barbarian_elf: px(270, 125), hero_barbarian_halfling: px(276, 160), hero_barbarian_human: px(272, 75),
  hero_barbarian_dwarf_b: px(268, 110), hero_barbarian_elf_b: px(325, 185), hero_barbarian_halfling_b: px(340, 125), hero_barbarian_human_b: px(321, 125),
  // Dracónidos, tieflings y brujos (3.49-3.68).
  hero_fighter_dragonborn: px(305, 128), hero_cleric_dragonborn: px(277, 130), hero_rogue_dragonborn: px(300, 130), hero_wizard_dragonborn: px(272, 115),
  hero_ranger_dragonborn: px(222, 160), hero_paladin_dragonborn: px(276, 110), hero_barbarian_dragonborn: px(300, 158), hero_warlock_dragonborn: px(244, 110),
  hero_fighter_tiefling: px(237, 80), hero_cleric_tiefling: px(234, 130), hero_rogue_tiefling: px(277, 110), hero_wizard_tiefling: px(291, 70),
  hero_ranger_tiefling: px(228, 130), hero_paladin_tiefling: px(235, 110), hero_barbarian_tiefling: px(265, 100), hero_warlock_tiefling: px(265, 115),
  hero_warlock_human: px(330, 64), hero_warlock_elf: px(272, 75), hero_warlock_dwarf: px(295, 170), hero_warlock_halfling: px(235, 145),
};

/** Sexo de la ilustración principal de cada héroe (la versión _b es la del otro sexo). */
const MAN = new Set(['fighter_dwarf', 'fighter_human', 'cleric_elf', 'cleric_halfling', 'rogue_dwarf', 'rogue_elf', 'wizard_halfling', 'wizard_human',
  'ranger_halfling', 'ranger_human', 'paladin_elf', 'paladin_human', 'barbarian_dwarf', 'barbarian_halfling',
  'barbarian_tiefling', 'cleric_tiefling', 'ranger_tiefling', 'wizard_tiefling', 'warlock_human', 'warlock_halfling']);
export type Sex = 'man' | 'woman';
export const baseSex = (cls: string, sp: string): Sex => (MAN.has(`${cls}_${sp}`) ? 'man' : 'woman');
/** Ilustración del héroe según clase, especie y sexo elegido. */
export const heroImg = (cls: string, sp: string, sex?: Sex): ImgKey =>
  (!sex || sex === baseSex(cls, sp) || !(`hero_${cls}_${sp}_b` in FACE) ? `hero_${cls}_${sp}` : `hero_${cls}_${sp}_b`) as ImgKey;

// Nombres de fantasía épica que valen para hombre o mujer (el autor 2026-11-01), por especie.
const NAMES: Record<SpeciesId, string[]> = {
  human: ['Aldren', 'Corwyn', 'Daeryn', 'Kaelor', 'Maelis', 'Ravenna', 'Seren', 'Tamsyn', 'Varek', 'Wrenly', 'Ysolde', 'Zarek'],
  elf: ['Aeris', 'Caelith', 'Elarin', 'Faelyn', 'Ilyndra', 'Lirael', 'Nimrae', 'Sariel', 'Sylvaris', 'Thalior', 'Vaelin', 'Yllar'],
  dwarf: ['Brakka', 'Dunrae', 'Grimna', 'Hrothi', 'Kardun', 'Morrik', 'Orsa', 'Rundra', 'Skarri', 'Thoryn', 'Vulka', 'Ymir'],
  halfling: ['Alby', 'Brindle', 'Corrin', 'Fenny', 'Jessamy', 'Kip', 'Merrow', 'Pip', 'Rosco', 'Tansy', 'Wyll', 'Quill'],
  dragonborn: ['Arkhes', 'Brasvor', 'Drakkis', 'Ghaldra', 'Iskarra', 'Khorvan', 'Mezzar', 'Nyxara', 'Rhazul', 'Sothrak', 'Tyrrha', 'Vorrash'],
  tiefling: ['Azhrel', 'Belyth', 'Caelzar', 'Damaris', 'Ephyra', 'Kallux', 'Lilthra', 'Nephis', 'Orzhia', 'Seraxis', 'Vexra', 'Ysmer'],
};

/** Nombre al azar según la especie, distinto del actual. */
export function randomName(sp: SpeciesId, current = ''): string {
  const list = NAMES[sp].filter(n => n !== current);
  return list[Math.floor(Math.random() * list.length)];
}
