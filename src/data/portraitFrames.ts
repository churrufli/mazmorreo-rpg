/** Centro del rostro (x, y) y altura de la ilustración por diámetro del retrato. */
import type { ImgKey } from '../assets';
import { FACE } from './caras';

export const PORTRAIT_FRAMES: Partial<Record<ImgKey, [number, number, number]>> = {
  hero_barbarian_dwarf: [0.5, 0.15, 4.2],
  hero_barbarian_elf: [0.5, 0.15, 4.6],
  hero_barbarian_halfling: [0.5, 0.19, 3.8],
  hero_barbarian_human: [0.5, 0.105, 5.6],
  hero_druid_dwarf: [0.5, 0.105, 5.4],
  hero_druid_elf: [0.5, 0.075, 6.2],
  hero_druid_halfling: [0.54, 0.165, 3.8],
  hero_druid_human: [0.51, 0.11, 5.6],
  ally_brunna: [0.473, 0.13, 4.8],
  ally_tiko: [0.492, 0.13, 4.6],
  ally_edmund: [0.488, 0.081, 6.2],
  ally_liss: [0.5, 0.091, 6.0],
  ally_anselmo: [0.5, 0.078, 6.2],
  ally_ivelle: [0.5, 0.099, 5.8],
  ally_maren: [0.508, 0.104, 5.4],
  ally_telmo: [0.508, 0.083, 6.2],
  ally_vurka: [0.5, 0.13, 4.8],
  ally_durnok: [0.5, 0.13, 4.6],
  ally_syrael: [0.5, 0.1, 5.2],
  ally_aldric: [0.5, 0.1, 5.2],
  pnj_buhonera: [0.54, 0.12, 4.8],
  pnj_lenador: [0.5, 0.085, 5.8],
  pnj_posadera: [0.5, 0.085, 5.8],
  pnj_posadero: [0.5, 0.085, 5.8],
  pnj_trampero: [0.5, 0.18, 4.2],
  abuela_ortiga: [0.391, 0.18, 4.0],
  orvane: [0.488, 0.091, 5.8],
  corazon_hueco: [0.5, 0.14, 3.2],
  dragon_blanco_joven: [0.6, 0.255, 2.6],
  arana_gigante: [0.5, 0.37, 2.4],
  arbol_despertado: [0.62, 0.27, 2.5],
  arbusto_despertado: [0.54, 0.38, 2.8],
  arpia: [0.61, 0.16, 3.5],
  bandido: [0.5, 0.105, 5.4],
  bruja_verde: [0.46, 0.21, 3.4],
  cria_dragon_blanco: [0.62, 0.28, 2.7],
  cultista: [0.5, 0.13, 5.0],
  driade: [0.49, 0.13, 4.4],
  elemental: [0.53, 0.3, 2.4],
  enjambre_murcielagos: [0.5, 0.35, 1.8],
  espectro: [0.53, 0.12, 3.8],
  esqueleto: [0.5, 0.13, 4.4],
  fuego_fatuo: [0.5, 0.32, 2.0],
  goblin_espada: [0.43, 0.24, 3.2],
  huargo: [0.67, 0.38, 2.4],
  jabali_gigante: [0.55, 0.46, 2.1],
  jefe_goblin: [0.5, 0.145, 3.4],
  kobold: [0.55, 0.28, 2.8],
  lobo: [0.68, 0.38, 2.4],
  lobo_invernal: [0.35, 0.47, 2.5],
  mefit_hielo: [0.5, 0.28, 3.0],
  monticulo_andante: [0.5, 0.24, 2.5],
  necrofago: [0.62, 0.21, 3.6],
  nudo_de_raiz: [0.5, 0.35, 2.1],
  oso_lechuza: [0.57, 0.25, 2.8],
  oso_pardo: [0.56, 0.23, 2.9],
  rata_gigante: [0.68, 0.33, 3.0],
  yeti: [0.55, 0.22, 3.0],
  zombi: [0.45, 0.11, 4.5],
  escena_altar_herido: [0.35, 0.39, 2.7],
  escena_baliza_apagada: [0.4, 0.26, 4.0],
  escena_barricada_cede: [0.41, 0.275, 3.3],
  escena_campanilla_hielo: [0.27, 0.44, 3.0],
  escena_kobold_estandarte: [0.6, 0.39, 4.0],
  escena_cultista_llave: [0.51, 0.19, 3.3],
  escena_escriba_nombres: [0.3, 0.2, 3.0],
  escena_escribiente_cautivo: [0.5, 0.16, 3.3],
  escena_fugitivo_robles: [0.6, 0.24, 3.2],
  escena_kobold_puente: [0.44, 0.22, 3.3],
  escena_marcas_altas: [0.37, 0.29, 4.0],
  escena_minero_agua_negra: [0.45, 0.24, 2.8],
  escena_registro_excavador: [0.48, 0.29, 3.0],
  escena_rendicion_hornos: [0.41, 0.39, 3.0],
  escena_vigia_herido: [0.48, 0.33, 3.0],
  escena_vigia_trampas: [0.46, 0.31, 4.0],
  hero_cleric_elf_b: [0.5, 0.095, 6.0],
  hero_cleric_human_b: [0.5, 0.11, 5.6],
  hero_fighter_elf: [0.494, 0.105, 6.0],
  hero_fighter_halfling_b: [0.5, 0.18, 3.8],
  hero_paladin_dwarf: [0.5, 0.13, 4.8],
  hero_paladin_elf: [0.5, 0.081, 6.3],
  hero_paladin_elf_b: [0.5, 0.095, 6.0],
  hero_paladin_halfling: [0.5, 0.25, 4.2],
  hero_paladin_halfling_b: [0.5, 0.19, 3.8],
  hero_ranger_elf: [0.5, 0.13, 6.0],
  hero_ranger_elf_b: [0.488, 0.105, 6.0],
  hero_ranger_halfling: [0.49, 0.14, 4.2],
  hero_ranger_halfling_b: [0.5, 0.15, 3.8],
  hero_ranger_human: [0.5, 0.115, 5.6],
  hero_rogue_halfling: [0.535, 0.225, 3.8],
  hero_rogue_human: [0.543, 0.19, 5.6],
  hero_wizard_dwarf_b: [0.508, 0.2, 4.2],
  hero_wizard_elf: [0.504, 0.1, 6.0],
  hero_wizard_human: [0.504, 0.1, 5.6],
};

/** Encuadre exclusivo de miniaturas: no modifica los recortes de las cartas completas. */
export function portraitFrame(img: ImgKey, size: number) {
  const key = img.replace(/^gris_/, '') as ImgKey;
  const measured = PORTRAIT_FRAMES[key];
  const face = measured ?? FACE[key];
  const [fx, fy] = face ?? [0.5, 0.5];
  const heroZoom = key.includes('_dwarf') ? 4.2 : key.includes('_halfling') ? 3.8 : key.includes('_elf') ? 6 : 5.6;
  const zoom = measured?.[2] ?? (face ? heroZoom : 1.5);
  // Si la cara está muy arriba, ampliar lo justo permite centrarla sin dejar huecos.
  const targetY = face ? 0.46 : 0.5;
  const height = size * Math.max(1.5, zoom, targetY / fy);
  const width = height * (2 / 3);
  return {
    x: Math.min(0, Math.max(size - width, size / 2 - fx * width)),
    y: Math.min(0, Math.max(size - height, size * targetY - fy * height)),
    width, height,
  };
}

export const hasPortraitFrame = (img: ImgKey) => {
  const key = img.replace(/^gris_/, '') as ImgKey;
  return !!(PORTRAIT_FRAMES[key] ?? FACE[key]);
};
