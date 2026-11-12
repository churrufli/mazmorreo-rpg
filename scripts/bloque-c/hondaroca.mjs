// Bloque C de Hondaroca: salas nuevas, áreas secretas, pruebas, decisiones, regresos y pendientes.
// Textos de diseno/historia/recortada/1-hondaroca.md, recortados y arreglados para el juego.

const N = t => ({ speaker: 'narrator', text: t });
const H = t => ({ speaker: 'hero', text: t });
const S = (who, t) => ({ speaker: who, text: t });
const enc = (id, enemies, trigger = 'enter', gold = 0) => ({
  type: 'encounter', id, trigger, can_reinforce: [], new: true, gold_drop: gold,
  enemies: enemies.map(([srd_creature, name, count = 1, row = 'front', weapon]) => ({ srd_creature, name, count, row, weapon, drop_weapon: false })),
  ...(trigger === 'patrol' ? { xp_total: 0, gold_drop: 0 } : {}),
});
const patrol = (id, enemies) => enc(id, enemies, 'patrol');
const chest = (id, gold, item) => ({ type: 'chest', id, locked: false, lock_dc: null, gold, item: item ? { id: item } : null });
const dlg = (id, lines, only) => ({ type: 'dialogue', id, lines, ...(only ? { only } : {}) });
const scene = (o) => ({ type: 'scene', ...o });
const DMG = '1d4';

/** Pista de un secreto: dos vías (Sabiduría e Inteligencia); un fallo cierra solo la que se intentó. */
const clue = (id, secret, title, text, wis, int, wisLabel, intLabel) => scene({
  id, title, text, question: '¿Cómo lo buscáis?', reveals: secret,
  options: [
    { label: wisLabel, attr: 'wis', dc: wis, ok: { reveal: secret }, fail: { text: 'No dais con ello por ahí.' } },
    { label: intLabel, attr: 'int', dc: int, ok: { reveal: secret }, fail: { text: 'No dais con ello por ahí.' } },
  ],
});

/** Grupo de paso al volver: luchar, esquivarlo (Destreza) o espantarlo (Carisma). Fallar lleva al combate. */
const passing = (id, encId, title, text, dc, fight, dodge, scare, extra = {}) => scene({
  id, title, text, question: '¿Qué hacéis?', on_return: true, ...extra,
  options: [
    { label: 'Luchar', ok: { text: fight, fight: encId } },
    { label: 'Esquivarlos', attr: 'dex', dc, ok: { text: dodge, remove: encId }, fail: { text: 'Os descubren.', fight: encId } },
    { label: 'Espantarlos', attr: 'cha', dc, ok: { text: scare, remove: encId }, fail: { text: 'No se lo tragan.', fight: encId } },
  ],
});

export default {
  zones: [
    // ---------------------------------------------------------------- Zona 1
    {
      id: 'z1',
      add: {
        z1_r02: [
          scene({
            id: 'z1_p01', title: 'La viga que cede', text: 'Una viga inclinada cierra el paso a una galería lateral. Al fondo brilla algo entre las piedras.', question: '¿Cómo pasáis?',
            options: [
              { label: 'Levantar la viga y calzarla', attr: 'str', dc: 11, ok: { text: 'La viga queda firme. Detrás, una bolsa de minero olvidada.', gold: 10 }, fail: { text: 'La madera se os viene encima.', damage: DMG } },
              { label: 'Deslizarse por debajo', attr: 'dex', dc: 12, ok: { text: 'Pasáis por debajo y encontráis una bolsa de minero olvidada.', gold: 10 }, fail: { text: 'La cuerda se desgarra y no hay forma de pasar así.' } },
              { label: 'Buscar la cuña que aguanta el peso', attr: 'int', dc: 11, ok: { text: 'Recolocáis la cuña y el paso queda seguro. Detrás hay una bolsa de minero.', gold: 10 }, fail: { text: 'La cuña se parte.' } },
            ],
            fallback: { text: 'No hay manera de pasar. La galería lateral se queda sin explorar.' },
          }),
        ],
        z1_r03: [clue('z1_s01_pista', 'z1_s01', 'Corriente de aire', 'Una corriente de aire sale de entre las cajas. Bajo el polvo asoma una bisagra.', 11, 11, 'Seguir la corriente de aire', 'Examinar los tablones')],
        z1_r04: [
          clue('z1_s02_pista', 'z1_s02', 'Un saco demasiado ligero', 'Junto a los tablones hay un saco de mineral que pesa poco para su tamaño. Hay raspaduras en la pared.', 12, 11, 'Seguir las raspaduras', 'Examinar el saco'),
          scene({
            id: 'z1_q01', title: 'El vigía herido', img: 'escena_vigia_herido', decision: true, after: 'z1_e04',
            text: 'Tras el combate, un goblin herido sale de detrás de la vagoneta y deja su arco en el suelo.', question: '¿Qué haces con él?',
            options: [
              { label: 'Perdonarle y pedirle una ruta', attr: 'cha', dc: 11, ok: { text: 'Señala la pared: «Detrás del saco, hay un hueco». Luego huye.', reveal: 'z1_s02' }, fail: { text: 'Aprovecha un descuido y huye sin decir nada.' } },
              { label: 'Quitarle las monedas', ok: { text: 'Le quitáis la bolsa. Se va corriendo hacia el campamento a avisar.', gold: 10, add: 'z1_e05' } },
              { label: 'Dejarle huir', ok: { text: 'Se marcha cojeando. Uno menos que os espere más adelante.', sub: 'z1_e05' } },
            ],
          }),
          patrol('z1_pat01', [['Goblin Warrior', 'Merodeador goblin', 2]]),
          passing('z1_pat01_paso', 'z1_pat01', 'Merodeadores del retorno', 'Hay goblins rebuscando junto a la vagoneta. Aún no os han visto.', 12,
            'Sacan las armas al veros.', 'Esperáis tras la roca hasta que se alejan.', 'Huyen por el túnel antes de que llegue «el resto del grupo».', { after: 'z1_e04' }),
        ],
        z1_r05: [
          scene({
            id: 'z1_ev01', title: 'La voz del entibador', img: 'escena_minero_agua_negra', decision: true, on_return: true, after: 'z2_r02',
            text: 'Un minero enano herido ha llegado hasta el campamento y trata de reavivar el fuego con una mano temblorosa.', question: '¿Cómo le ayudas?',
            options: [
              { label: 'Darle una poción de curación', needs: 'potion_healing', ok: { lose: 'potion_healing', text: 'Se recupera y os da la paga que guardaba: «Para el camino. Yo vuelvo a casa».', gold: 20 } },
              { label: 'Vendarle y estabilizarle', attr: 'wis', dc: 11, ok: { text: 'Le cerráis la herida. Os da la paga que guardaba y se marcha hacia la salida.', gold: 20 }, fail: { text: 'No sabéis cerrar la herida. Le acompañáis hasta la boca de la mina.' } },
            ],
          }),
        ],
        z1_r01: [dlg('z1_d01', [N('Bajo una rueda de la vagoneta hay un trozo de tela gris con una hebilla de minero.'), H('No tiene polvo. Quien lo llevaba pasó por aquí hace poco.')])],
      },
      rooms: [
        {
          id: 'z1_r07', name: 'Cámara de las poleas', attach: 'z1_r02', size: 11, seed: 1,
          description: 'Las cadenas de un montacargas desaparecen en el techo. Una plataforma de mineral se balancea sola sobre el suelo.',
          props: ['ore_sacks', 'mine_cart', 'barrels'],
          contents: [
            dlg('z1_d02', [N('Tres golpes secos llegan del conducto de ventilación.'), S('narrator', 'Una voz lejana: «No encendáis… la luz… donde cae el agua».'), N('Luego, silencio.')]),
            dlg('z1_d02b', [S('tiko', 'Esa madera no está vencida por los años. Alguien la serró para tapar lo que había detrás.')], 'tiko'),
            scene({
              id: 'z1_p02', title: 'El montacargas inmóvil', text: 'La plataforma cuelga sobre un hueco. Debajo se ve un arcón de suministros.', question: '¿Cómo llegáis?',
              options: [
                { label: 'Mover el contrapeso a mano', attr: 'str', dc: 12, ok: { text: 'La plataforma sube. El arcón tiene una poción.', item: 'potion_healing' }, fail: { text: 'El contrapeso cae.', damage: DMG } },
                { label: 'Recolocar los dientes del torno', attr: 'int', dc: 11, ok: { text: 'El torno recoge la plataforma. El arcón tiene una poción.', item: 'potion_healing' }, fail: { text: 'El engranaje se traba.' } },
                { label: 'Pasar agachado por debajo', attr: 'con', dc: 12, ok: { text: 'Aguantáis el frío y sacáis la poción del arcón.', item: 'potion_healing' }, fail: { text: 'El frío os agota.', damage: DMG } },
              ],
              fallback: { text: 'Cruzáis por una cornisa estrecha. Una piedra se desprende y se lleva parte de vuestras monedas.', gold: -5 },
            }),
          ],
        },
        {
          id: 'z1_r08', name: 'Pasadizo de las marcas', attach: 'z1_r03', size: 9, seed: 2,
          description: 'En las paredes, la tiza de los mineros se mezcla con flechas goblins que apuntan en sentido contrario.',
          props: ['mine_cart', 'rubble'],
          contents: [
            dlg('z1_d05', [N('Las marcas de los mineros señalan la salida; las de los goblins, el pozo.'), N('Una mano temblorosa escribió con tiza: «Abajo no cantan los hombres».')]),
            chest('z1_c04', 8, null),
          ],
        },
        {
          id: 'z1_r09', name: 'Cámara del agua negra', attach: 'z1_r05', size: 11, seed: 3,
          description: 'Un manantial brota entre las rocas y desaparece por una fisura. Bajo la costra oscura del agua brilla un destello azul.',
          props: ['water', 'mossy_rock'],
          contents: [
            dlg('z1_d08', [N('El agua devuelve un reflejo azulado, aunque no hay luz sobre vuestras cabezas.'), H('Lo que busca Orvane está más abajo de lo que imaginaba.')]),
            enc('z1_e09', [['Giant Rat', 'Rata del agua negra', 2]]),
            scene({
              id: 'z1_q02', title: 'El minero en el agua negra', img: 'escena_minero_agua_negra', decision: true, after: 'z1_e09',
              text: 'Un minero enano exhausto se aferra a una roca sobre el agua negra y os tiende la mano.', question: '¿Cómo le ayudas?',
              options: [
                { label: 'Darle una poción de curación', needs: 'potion_healing', ok: { lose: 'potion_healing', text: 'Recupera el aliento: «En el almacén, tras las cajas, hay un paso de mantenimiento».', reveal: 'z1_s01' } },
                { label: 'Guiarle entre las piedras', attr: 'wis', dc: 12, ok: { text: 'Le sacáis del agua. Agradecido, os habla de un paso tras las cajas del almacén.', reveal: 'z1_s01' }, fail: { text: 'Intentas guiarle, pero resbala. Consigue salir del agua, exhausto, y se aleja sin poder hablar.' } },
              ],
            }),
          ],
        },
        {
          id: 'z1_s01_r01', name: 'Caseta del entibador', secret: 'z1_s01', via: 'z1_r03', size: 9, seed: 4,
          description: 'Un banco de trabajo junto a una pared con cinco marcas de altura infantil, hechas en años distintos.',
          props: ['desk', 'barrels'],
          contents: [
            dlg('z1_d04', [N('Una nota del entibador: reforzó los pasos para que los aprendices volvieran sanos.'), N('La última línea está tachada: «Nos han prohibido cerrar la bajada».')]),
            enc('z1_e07', [['Giant Rat', 'Rata del banco', 1]]),
            chest('z1_c03', 20, 'potion_healing'),
          ],
        },
        {
          id: 'z1_s02_r01', name: 'Sala de avisos', secret: 'z1_s02', attach: 'z1_r04', size: 9, seed: 5,
          description: 'Un tablero con fichas de turnos y una campana rota que nadie llegó a tocar.',
          props: ['barrels', 'desk'],
          contents: [
            dlg('z1_d06', [N('Un parte ordena tocar la campana cuando «la piedra del fondo vuelva a brillar».'), N('La cuerda de la campana está cortada con una hoja afilada.')]),
            enc('z1_e08', [['Goblin Warrior', 'Goblin rebuscador', 1]]),
            chest('z1_c05', 25, 'potion_healing'),
          ],
        },
      ],
      pending: [
        { id: 'z1_j01', from: 'z1_r01', until: 'z1_r08', text: 'Las marcas de una viga parecen un mensaje interrumpido.' },
        { id: 'z1_j02', from: 'z1_r05', until: 'z1_ev01', text: 'Las escudillas del campamento son de más personas de las que durmieron allí.' },
        { id: 'z1_j03', from: 'z1_r03', until: 'z1_s01', text: 'Una corriente de aire sale de un lugar donde no debería haber paso.' },
        { id: 'z1_j04', from: 'z1_r04', until: 'z1_s02', text: 'En el cruce, un saco de mineral pesa demasiado poco y la pared tiene raspaduras.' },
        { id: 'z1_j05', from: 'z1_r09', until: 'z4_e05', text: 'El agua de una cámara refleja una luz azul cuyo origen no se ve.' },
        { id: 'z1_j06', from: 'z1_s02_r01', until: 'z4_e05', text: 'Alguien cortó la cuerda de la campana de avisos. ¿Qué «piedra del fondo» temían los mineros?' },
      ],
    },

    // ---------------------------------------------------------------- Zona 2
    {
      id: 'z2',
      add: {
        z2_r01: [
          dlg('z2_d01', [N('Al otro extremo, una reja enorme. Al otro lado cuelga una palanca de hierro, fuera de vuestro alcance.'), H('La palanca está al otro lado.')]),
          scene({
            id: 'z2_ev01', title: 'La buhonera del umbral', img: 'pnj_buhonera', decision: true, on_return: true, after: 'z2_b01',
            text: 'Una buhonera ha subido su carro hasta el vestíbulo, ahora que la reja está abierta. «Remedios para el camino».', question: '¿Le compráis algo?',
            options: [
              { label: 'Una poción de curación', cost: 20, ok: { text: '«Que os dure.»', item: 'potion_healing' } },
              { label: 'Un antídoto', cost: 15, ok: { text: '«Para las arañas de abajo.»', item: 'antidote' } },
              { label: 'Nada, gracias', ok: { text: '«Volveré a Valdescarcha. Suerte ahí abajo.»' } },
            ],
          }),
        ],
        z2_r04: [clue('z2_s01_pista', 'z2_s01', 'El respiradero', 'Los murciélagos se apartan siempre del mismo respiradero. Tras la rejilla corre el aire.', 12, 13, 'Fijarse en los murciélagos', 'Examinar la rejilla')],
        z2_r05: [dlg('z2_d07b', [S('tiko', 'El capataz guardaba más mapas que oro. Hay rutas que no quería que nadie conociera.')], 'tiko')],
        z2_r06: [
          scene({
            id: 'z2_p03', title: 'El umbral de los muertos', text: 'Junto al camino, una puerta lateral guarda una ofrenda pequeña. La losa de delante está marcada.', question: '¿Cómo llegáis a ella?',
            options: [
              { label: 'Seguir el desgaste de las pisadas', attr: 'wis', dc: 13, ok: { text: 'Evitáis la losa. La ofrenda: monedas y un trozo de inscripción funeraria.', gold: 12 }, fail: { text: 'La losa cede bajo el pie.', damage: DMG } },
              { label: 'Leer las marcas del mecanismo', attr: 'int', dc: 12, ok: { text: 'Las marcas indican el paso seguro. Recogéis la ofrenda.', gold: 12 }, fail: { text: 'El puntero del mecanismo se rompe.' } },
            ],
            fallback: { text: 'La puerta lateral queda cerrada para siempre.' },
          }),
        ],
        z2_r07: [clue('z2_s02_pista', 'z2_s02', 'El emblema gastado', 'Un emblema de canteros está gastado solo por el borde izquierdo. Del otro lado llega aire frío.', 13, 12, 'Fijarse en el desgaste', 'Estudiar el mecanismo')],
      },
      rooms: [
        {
          id: 'z2_r08', name: 'Corredor de las balanzas', attach: 'z2_r02', size: 11, seed: 1,
          description: 'Dos balanzas gigantes vigilan un pasillo donde se pesaba el mineral.',
          props: ['ore_sacks', 'column', 'milestone'],
          contents: [
            dlg('z2_d03', [N('Unas cifras talladas relacionan el mineral extraído con los nombres de las cuadrillas.'), H('Han borrado el final del registro.')]),
            scene({
              id: 'z2_q01', title: 'El registro del excavador', img: 'escena_registro_excavador', decision: true,
              text: 'Un excavador goblin aprieta contra el pecho un libro de registro y os mira con desconfianza.', question: '¿Qué haces con el registro?',
              options: [
                { label: 'Negociar su entrega', attr: 'cha', dc: 12, ok: { text: 'Os lo da. Una página señala un respiradero en la sala de los murciélagos.', reveal: 'z2_s01' }, fail: { text: 'Os saca diez monedas y se larga con el libro.', gold: -10 } },
                { label: 'Arrebatárselo', attr: 'dex', dc: 13, ok: { text: 'Se lo quitáis antes de que reaccione. Señala un respiradero escondido.', reveal: 'z2_s01' }, fail: { text: 'Se escapa gritando: los guardias del capataz os esperarán.', add: 'z2_e04' } },
                { label: 'Dejarle y seguir', ok: { text: 'El goblin desaparece entre las balanzas.' } },
              ],
            }),
            patrol('z2_pat01', [['Goblin Warrior', 'Vigilante goblin', 2]]),
            passing('z2_pat01_paso', 'z2_pat01', 'Vigilantes de la ciudad', 'Junto a las balanzas, unos goblins inspeccionan los sacos.', 13,
              'Se interponen y llaman a gritos a sus compañeros.', 'Os ocultáis tras los contrapesos hasta que se van.', 'Les decís que el capataz ya no puede protegerles. Huyen.', { after: 'z2_r07' }),
          ],
        },
        {
          id: 'z2_r09', name: 'Archivo de las cuadrillas', attach: 'z2_r04', size: 10, seed: 2,
          description: 'Hileras de tablillas de piedra con nombres y turnos. Varias han sido arrancadas con violencia.',
          props: ['lectern', 'column'],
          contents: [
            dlg('z2_d06', [N('Una tablilla reciente tiene nombres escritos con carbón sobre las inscripciones antiguas.'), H('Son mineros de Valdescarcha. Alguien apuntó sus turnos de trabajo forzado.')]),
            dlg('z2_d06b', [S('brunna', 'Aquí guardaban las fichas de las cuadrillas. La del muchacho que busco debería estar entre ellas.')], 'brunna'),
            chest('z2_c06', 15, null),
          ],
        },
        {
          id: 'z2_r10', name: 'Patio de los hornos apagados', attach: 'z2_r05', door: 'door', size: 12, seed: 3,
          description: 'Un patio con la boca de tres hornos de fundición. Tras uno de ellos, la palanca de la reja del vestíbulo.',
          props: ['forge', 'column'],
          gate: { id: 'z2_b01', to: 'z2_r01' },
          contents: [
            enc('z2_e08', [['Goblin Warrior', 'Goblin de los hornos', 2]], 'scene'),
            scene({
              id: 'z2_q02', title: 'La rendición en los hornos', img: 'escena_rendicion_hornos', decision: true,
              text: 'Dos goblins que vigilaban el hierro dejan caer sus armas y levantan las manos.', question: '¿Les dejas marchar?',
              options: [
                { label: 'Aceptar su rendición', ok: { text: 'Se van sin mirar atrás.', remove: 'z2_e08' } },
                { label: 'Exigirles el botín', attr: 'cha', dc: 12, ok: { text: 'Os dan una bolsa y se marchan.', gold: 15, remove: 'z2_e08' }, fail: { text: 'Se miran, recogen las armas y atacan.', fight: 'z2_e08' } },
                { label: 'Cerrarles el paso', ok: { text: 'Un tercero sale de detrás del horno. Pelean.', add: 'z2_e08', fight: 'z2_e08' } },
              ],
            }),
            { type: 'lever', id: 'z2_b01_open', gate: 'z2_b01', name: 'Reja de los turnos', text: 'La reja del vestíbulo queda abierta: ahora hay un atajo entre este patio y la entrada de las ruinas.',
              lines: [N('Bajáis la palanca. La reja asciende con un gemido de hierro antiguo.'), H('Es el corredor que vimos al entrar en la ciudad. Ya tenemos camino de vuelta.')] },
          ],
        },
        {
          id: 'z2_s01_r01', name: 'Puesto del vigía', secret: 'z2_s01', via: 'z2_r04', size: 9, seed: 4,
          description: 'Una mesa orientada hacia el conducto y un cuaderno abierto por su última página.',
          props: ['desk', 'barrels'],
          contents: [
            dlg('z2_d05', [N('El cuaderno recoge turnos de vigilancia enanos.'), N('La última frase avisa de un sonido en la cripta, «como una oración dicha al revés».')]),
            dlg('z2_d05b', [S('brunna', 'Los canteros no dejaban un puesto sin entregar el relevo. Algo interrumpió aquel turno.')], 'brunna'),
            enc('z2_e07', [['Goblin Warrior', 'Goblin escondido', 2]]),
            chest('z2_c03', 35, 'potion_healing'),
          ],
        },
        {
          id: 'z2_s02_r01', name: 'Sala de los juramentos', secret: 'z2_s02', attach: 'z2_r07', size: 9, seed: 5,
          description: 'Un círculo de taburetes rodea un pedestal con juramentos de canteros escritos en tablillas.',
          props: ['pedestal', 'gravestone'],
          contents: [
            dlg('z2_d10', [N('Juraron cerrar las minas si veían «luces sin fuego» bajo el sepulcro.'), N('Una tablilla rota conserva dos palabras: «No descendáis».')]),
            enc('z2_e09', [['Skeleton', 'Centinela de los juramentos', 1]]),
            chest('z2_c05', 45, 'potion_healing'),
          ],
        },
      ],
      pending: [
        { id: 'z2_j01', from: 'z2_r01', until: 'z2_b01', text: 'Una reja deja ver un corredor al que todavía no se puede llegar.' },
        { id: 'z2_j02', from: 'z2_r09', until: 'z4_r09', text: 'Los nombres de los mineros aparecen en un registro de trabajos forzados.' },
        { id: 'z2_j03', from: 'z2_r04', until: 'z2_s01', text: 'Un respiradero parece llevar a una estancia olvidada.' },
        { id: 'z2_j04', from: 'z2_r07', until: 'z2_s02', text: 'Una piedra con el emblema de los canteros tiene un desgaste extraño.' },
      ],
    },

    // ---------------------------------------------------------------- Zona 3
    {
      id: 'z3',
      add: {
        z3_r01: [dlg('z3_d01', [N('Un relieve muestra a Aldric cerrando una puerta mientras sus guerreros quedan a este lado.'), H('No parece una coronación. Parece una despedida.')])],
        z3_r04: [
          dlg('z3_d04b', [S('edmund', 'No todos estos muertos eligieron levantarse. Hay que devolverles el silencio.')], 'edmund'),
          scene({
            id: 'z3_p02', title: 'La losa de los nombres', text: 'Un paso secundario hacia una ofrenda está cubierto de piedras caídas.', question: '¿Cómo pasáis?',
            options: [
              { label: 'Empujar el bloque que lo sujeta', attr: 'str', dc: 14, ok: { text: 'El paso se abre. La ofrenda: piezas funerarias de oro.', gold: 20 }, fail: { text: 'Las piedras se os vienen encima.', damage: DMG } },
              { label: 'Pasar por debajo de los escombros', attr: 'dex', dc: 14, ok: { text: 'Llegáis a la ofrenda: piezas funerarias de oro.', gold: 20 }, fail: { text: 'El portillo cae y cierra ese hueco.' } },
              { label: 'Buscar las piedras inestables', attr: 'wis', dc: 13, ok: { text: 'Movéis solo las seguras y recogéis la ofrenda.', gold: 20 }, fail: { text: 'Una piedra rueda y la ofrenda se pierde entre las grietas.' } },
            ],
            fallback: { text: 'La ofrenda se pierde. El camino principal sigue libre.' },
          }),
        ],
        z3_r05: [
          dlg('z3_d06b', [S('edmund', 'Estas ofrendas no son un botín abandonado. Alguien las dejó para que una historia no se perdiera.')], 'edmund'),
          clue('z3_s01_pista', 'z3_s01', 'La lápida de los versos', 'Una lápida repite su inscripción al otro lado del marco. Se nota una leve corriente de aire.', 13, 14, 'Notar el aire', 'Leer el orden de los versos'),
        ],
        z3_r07: [
          dlg('z3_d10b', [S('edmund', 'Aldric no pidió veneración. Pidió que nadie volviera a usar lo que había condenado.')], 'edmund'),
          clue('z3_s02_pista', 'z3_s02', 'El pedestal limpio', 'Una piedra del pedestal está más limpia que el resto. La niebla se arremolina detrás sin tocarla.', 14, 14, 'Notar la corriente', 'Reconocer el cierre mortuorio'),
        ],
      },
      rooms: [
        {
          id: 'z3_r08', name: 'Cámara de las cenizas', attach: 'z3_r02', size: 10, seed: 1,
          description: 'Urnas de piedra apiladas bajo nichos vacíos. La ceniza del suelo se mueve hacia una rendija.',
          props: ['lectern', 'sarcophagus'],
          contents: [
            dlg('z3_d03', [N('En un atril, nombres grabados en orden inverso al de las inscripciones del umbral.'), H('No murieron defendiendo riquezas, sino una prohibición.')]),
            scene({
              id: 'z3_p01', title: 'El aire de los antiguos', text: 'Una nube fría cubre la puerta de una pequeña cámara de ofrendas.', question: '¿Cómo cruzáis?',
              options: [
                { label: 'Contener el aliento y cruzar', attr: 'con', dc: 13, ok: { text: 'Dentro hay una ampolla de agua bendita y unas monedas.', item: 'holy_water', gold: 15 }, fail: { text: 'El frío os muerde.', damage: DMG } },
                { label: 'Esperar el pulso de la niebla', attr: 'wis', dc: 13, ok: { text: 'Cruzáis cuando se retira. Agua bendita y unas monedas.', item: 'holy_water', gold: 15 }, fail: { text: 'La niebla os oculta la senda.' } },
                { label: 'Leer el relieve de ventilación', attr: 'int', dc: 14, ok: { text: 'Abrís el respiradero correcto. Agua bendita y unas monedas.', item: 'holy_water', gold: 15 }, fail: { text: 'La losa se bloquea.' } },
              ],
              fallback: { text: 'Salís por el lateral de las urnas, sin la ofrenda.' },
            }),
          ],
        },
        {
          id: 'z3_r09', name: 'Cámara de los nombres perdidos', attach: 'z3_r04', size: 11, seed: 2,
          description: 'Lápidas sin sarcófago. Sus nombres se guardaron en cajas; una de ellas está abierta y vacía.',
          props: ['gravestone', 'gravestone', 'desk'],
          contents: [
            dlg('z3_d05', [N('Un documento enumera a los guardianes, pero no al rey.'), H('Aquí falta Aldric. Alguien apartó su nombre de los demás.')]),
            enc('z3_e06', [['Skeleton', 'Guardián de los nombres', 1]], 'scene'),
            scene({
              id: 'z3_q01', title: 'El escriba de los nombres', img: 'escena_escriba_nombres', decision: true,
              text: 'Un escriba espectral señala una caja abierta llena de pergaminos. Una llama fría recorre las letras.', question: '¿Cómo respondes?',
              options: [
                { label: 'Prometer conservar los nombres', attr: 'cha', dc: 13, ok: { text: 'El escriba asiente y señala una lápida giratoria en la cámara de las ofrendas.', reveal: 'z3_s01' }, fail: { text: 'El escriba se desvanece sin creeros.' } },
                { label: 'Dejar 15 monedas de tributo', cost: 15, ok: { text: 'Acepta el tributo y os muestra una lápida que gira en la cámara de las ofrendas.', reveal: 'z3_s01' } },
                { label: 'Romper la caja', ok: { text: 'Los guardianes se levantan de entre las lápidas.', add: 'z3_e06', fight: 'z3_e06' } },
              ],
            }),
          ],
        },
        {
          id: 'z3_r10', name: 'Antesala de las voces', attach: 'z3_r06', size: 11, seed: 3,
          description: 'Hornacinas con estatuas sin rostro. Una voz repite palabras de hace siglos cuando alguien pisa el centro.',
          props: ['dwarf_statue', 'dwarf_statue', 'altar'],
          contents: [
            dlg('z3_d09', [S('narrator', 'Una voz en la cámara: «Que lo enterrado permanezca bajo las aguas y la piedra».'), H('Orvane va a hacer justo lo que ese rey prohibió.')]),
            scene({
              id: 'z3_q02', title: 'La estatua sin rostro', img: 'escena_estatua_sin_rostro', decision: true,
              text: 'La sombra de una estatua sin rostro cae sobre una puerta funeraria entreabierta. A sus pies, un cuenco de bronce.', question: '¿Qué juramento pronuncias?',
              options: [
                { label: 'Jurar proteger el sello', attr: 'cha', dc: 14, ok: { text: 'La puerta se abre un poco más y deja ver una piedra suelta en el pedestal de Aldric.', reveal: 'z3_s02' }, fail: { text: 'La voz calla. La puerta no se mueve.' } },
                { label: 'Dejar 10 monedas en el cuenco', cost: 10, ok: { text: 'Las monedas tintinean y la voz os habla de una cavidad tras el pedestal real.', reveal: 'z3_s02' } },
                { label: 'Guardar silencio', ok: { text: 'Seguís adelante sin decir nada.' } },
              ],
            }),
            chest('z3_c06', 20, 'potion_healing'),
          ],
        },
        {
          id: 'z3_s01_r01', name: 'Escribanía sellada', secret: 'z3_s01', via: 'z3_r05', size: 9, seed: 4,
          description: 'Un escritorio guarda el borrador de una declaración real que nunca se hizo pública.',
          props: ['desk', 'lectern'],
          contents: [
            dlg('z3_d07', [N('Aldric temía que la fuente que salvó vidas acabara usándose para dominar.'), N('El escrito acaba justo antes de la firma del rey.')]),
            enc('z3_e07', [['Zombie', 'Copista muerto', 1]]),
            chest('z3_c05', 30, 'potion_greater_healing_1'),
          ],
        },
        {
          id: 'z3_s02_r01', name: 'Guardia sin relevo', secret: 'z3_s02', attach: 'z3_r07', size: 9, seed: 5,
          description: 'Un casco y un escudo ante un asiento de piedra. Bajo el asiento, la lista de las guardias tras la muerte de Aldric.',
          props: ['pedestal', 'gravestone'],
          contents: [
            dlg('z3_d11', [N('Los relevos fueron cada vez menos. La última anotación: «La puerta sigue cerrada; el mundo ya no sabe por qué».'), H('Siguieron velando aunque el reino había olvidado su juramento.')]),
            enc('z3_e08', [['Skeleton', 'Último custodio', 1]]),
            chest('z3_c07', 40, 'potion_greater_healing_1'),
          ],
        },
      ],
      pending: [
        { id: 'z3_j01', from: 'z3_r01', until: 'z3_r10', text: 'Un relieve muestra a Aldric cerrando una puerta, sin explicar por qué.' },
        { id: 'z3_j02', from: 'z3_r09', until: 'z3_r07', text: 'El nombre de Aldric falta en algunos registros de su propia cripta.' },
        { id: 'z3_j03', from: 'z3_r05', until: 'z3_s01', text: 'Una lápida parece ocultar algo más que una inscripción.' },
        { id: 'z3_j04', from: 'z3_r07', until: 'z3_s02', text: 'El pedestal del sepulcro tiene señales de una apertura reciente.' },
      ],
    },

    // ---------------------------------------------------------------- Zona 4
    {
      id: 'z4',
      add: {
        z4_r03: [
          dlg('z4_d05b', [S('liss', 'Reconozco mi letra en esas placas. Servían para contener la energía, no para liberarla.')], 'liss'),
          clue('z4_s01_pista', 'z4_s01', 'El cristal opaco', 'Uno de los cristales no da luz y tiene gotas por dentro. Al acercaros suena apagado.', 14, 14, 'Escuchar el sonido', 'Estudiar los soportes'),
          patrol('z4_pat01', [['Cultist', 'Recolector del cristal', 2]]),
          passing('z4_pat01_paso', 'z4_pat01', 'Recolectores del cristal', 'Unos cultistas llenan recipientes con el brillo de los cristales.', 14,
            'Sueltan los recipientes y os cierran el paso.', 'Aprovecháis un destello para pasar tras las mesas.', 'Les advertís de que los cierres de Orvane se desmoronan. Huyen.', { after: 'z4_e01', before: 'z4_e05' }),
        ],
        z4_r04: [
          scene({
            id: 'z4_p02', title: 'El voto de silencio', text: 'Un relicario lateral está protegido por una estatua que se mueve con una losa de presión.', question: '¿Cómo lo abrís?',
            options: [
              { label: 'Sujetar la estatua', attr: 'str', dc: 15, ok: { text: 'El relicario guarda una poción envuelta en paño seco y monedas.', item: 'potion_healing', gold: 25 }, fail: { text: 'La estatua os golpea al volver.', damage: DMG } },
              { label: 'Buscar la losa de presión', attr: 'wis', dc: 14, ok: { text: 'Evitáis la losa y abrís el relicario: una poción y monedas.', item: 'potion_healing', gold: 25 }, fail: { text: 'La estatua se enclava.' } },
            ],
            fallback: { text: 'El relicario no se abre.' },
          }),
          enc('z4_e08', [['Cultist', 'Devoto rendido', 1]], 'scene'),
          scene({
            id: 'z4_ev01', title: 'El devoto que suelta el arma', img: 'escena_cultista_llave', decision: true, on_return: true, after: 'z4_e03', before: 'z4_e05',
            text: 'Un devoto de Orvane sale de detrás de una estatua y deja su bastón en el suelo.', question: '¿Qué haces?',
            options: [
              { label: 'Aceptar su rendición', ok: { text: '«Los mineros siguen tras la pared de la cámara de estudio». Os da una poción robada y huye.', item: 'potion_healing' } },
              { label: 'Atacarle', ok: { text: 'Recoge el bastón y se defiende.', fight: 'z4_e08' } },
            ],
          }),
        ],
        z4_r06: [
          dlg('z4_d01b', [S('edmund', 'Descansad mientras la fuente siga limpia. Al otro lado será más difícil.')], 'edmund'),
          // Secreto de regreso: se abre con el amuleto de corteza de El Corazón Hueco (b2_r01 pide haberlo usado).
          scene({
            id: 'z4_s02_pista', title: 'El mosaico de raíces', before: 'b2_r01',
            text: 'Un mosaico sin inscripciones muestra ramas entrelazadas alrededor de una gota de piedra. Bajo la última rama sale aire templado.', question: '¿Qué hacéis?',
            options: [
              { label: 'Notar el aire', attr: 'wis', dc: 14, ok: { text: 'El mosaico es una puerta. En el centro hay un hueco del tamaño de un amuleto de corteza. Habrá que volver con uno.', flag: 'z4_s02_visto' }, fail: { text: 'No notáis nada.' } },
              { label: 'Estudiar el mosaico', attr: 'int', dc: 15, ok: { text: 'Es una puerta sellada. El hueco del centro espera un amuleto de corteza, como los de un bosque lejano.', flag: 'z4_s02_visto' }, fail: { text: 'Solo veis piedra tallada.' } },
            ],
            fallback: { text: 'El mosaico no os dice nada más.' },
          }),
          scene({
            id: 'z4_s02_abrir', title: 'El mosaico de raíces', after: 'b2_r01', reveals: 'z4_s02',
            text: 'El mosaico de ramas talladas tiene en el centro un hueco con la forma exacta de los amuletos de corteza de Umbría.', question: '¿Probáis?',
            options: [{ label: 'Apoyar un amuleto de corteza', ok: { text: 'Las raíces talladas se separan sin romper la piedra. Este símbolo aguardaba algo que no conocíais cuando llegasteis a Hondaroca.', reveal: 'z4_s02' } }],
          }),
        ],
        z4_r07: [
          dlg('z4_d12a', [S('brunna', 'Orvane, puedes llenar de magia esta montaña. No borrarás los nombres de quienes enterraste en ella.')], 'brunna'),
          dlg('z4_d12b', [S('tiko', 'He encontrado puertas peores, pero ninguna que merezca cerrarse tanto como esta.')], 'tiko'),
        ],
      },
      rooms: [
        {
          id: 'z4_r08', name: 'Pasarela de las compuertas', attach: 'z4_r02', size: 11, seed: 1,
          description: 'Una pasarela de losas cruza un canal rápido sobre tres compuertas de piedra.',
          props: ['water', 'walkway', 'column'],
          contents: [
            dlg('z4_d04', [N('Las marcas de las compuertas indican niveles de agua muy por encima del actual.'), H('Orvane ha convertido el agua en un conducto para su magia.')]),
            scene({
              id: 'z4_p01', title: 'El caudal contenido', text: 'La última compuerta retiene algo que la corriente ha dejado atascado: un cofre pequeño.', question: '¿Cómo lo sacáis?',
              options: [
                { label: 'Alcanzar el cierre desde el borde', attr: 'dex', dc: 14, ok: { text: 'Abrís la compuerta y sacáis el cofre: monedas.', gold: 25 }, fail: { text: 'La corriente os golpea contra la piedra.', damage: DMG } },
                { label: 'Ordenar los reguladores', attr: 'int', dc: 14, ok: { text: 'El agua baja y el cofre queda a mano: monedas.', gold: 25 }, fail: { text: 'Un regulador se atasca.' } },
                { label: 'Liberar la cadena bajo el chorro', attr: 'con', dc: 15, ok: { text: 'Aguantáis el agua helada y sacáis el cofre: monedas.', gold: 25 }, fail: { text: 'El agua os derriba.', damage: DMG } },
              ],
              fallback: { text: 'El cofre se lo lleva la corriente, y con él parte de vuestras monedas al cruzar por arriba.', gold: -10 },
            }),
          ],
        },
        {
          id: 'z4_r09', name: 'Registro de los cautivos', attach: 'z4_r04', size: 10, seed: 2,
          description: 'Una cámara de escribas sobre el agua. Sus tablillas recientes tienen nombres de Valdescarcha.',
          props: ['desk', 'lectern', 'cell_bars'],
          contents: [
            dlg('z4_d07', [N('Junto a algunos nombres hay una marca nueva: «trasladados a una cámara segura».'), H('Siguen vivos. Aguantad un poco más.')]),
            dlg('z4_d07b', [S('liss', 'Aquí se guardaba el registro de los prisioneros. Me negué a leerlo cuando aún podía hacer algo.')], 'liss'),
            scene({
              id: 'z4_q01', title: 'El escribiente cautivo', img: 'escena_escribiente_cautivo', decision: true,
              text: 'Tras una reja, un escribiente cautivo os muestra dos tablillas: una con los nombres de los presos, otra con el inventario.', question: '¿Qué registro rescatas?',
              options: [
                { label: 'Los nombres de los presos', ok: { text: 'Con los nombres, el escribiente os dice dónde duermen los guardias de la cámara de estudio: uno menos que os espere.', sub: 'z4_e03' } },
                { label: 'El inventario de provisiones', ok: { text: 'El inventario lleva a un escondrijo: una poción.', item: 'potion_healing' } },
                { label: 'Examinar ambas con cuidado', attr: 'int', dc: 14, ok: { text: 'Sacáis lo mejor de las dos: un guardia menos y una poción.', sub: 'z4_e03', item: 'potion_healing' }, fail: { text: 'Solo os da tiempo a los nombres: un guardia menos en la cámara de estudio.', sub: 'z4_e03' } },
              ],
            }),
          ],
        },
        {
          id: 'z4_r10', name: 'Sala de los sellos rotos', attach: 'z4_r05', size: 11, seed: 3,
          description: 'Una cámara octogonal con sellos arcanos quebrados y trazos recientes que los deforman.',
          props: ['crystal', 'pedestal', 'crystal'],
          contents: [
            dlg('z4_d09', [N('Las marcas nuevas cruzan los sellos antiguos como heridas sobre una cicatriz.'), H('Han invertido los mecanismos de contención.')]),
            scene({
              id: 'z4_q02', title: 'El cultista de la llave', img: 'escena_cultista_llave', decision: true,
              text: 'Un cultista joven, tembloroso, os ofrece una llave de hierro con la otra mano en alto.', question: '¿Aceptas su ayuda?',
              options: [
                { label: 'Dejarle marchar por la llave', ok: { text: 'La llave abre el cristal opaco del laboratorio. Antes de irse, desactiva uno de los guardianes de Orvane.', reveal: 'z4_s01', sub: 'z4_e04' } },
                { label: 'Exigirle 20 monedas', attr: 'cha', dc: 13, ok: { text: 'Os da la bolsa y huye.', gold: 20 }, fail: { text: 'Huye a avisar: Orvane tendrá un guardián más.', add: 'z4_e04' } },
                { label: 'Rechazar el trato', ok: { text: 'El cultista se pierde por los pasillos inundados.' } },
              ],
            }),
            chest('z4_c05', 30, 'potion_greater_healing_1'),
          ],
        },
        {
          id: 'z4_s02_r01', name: 'Depósito del vínculo', secret: 'z4_s02', attach: 'z4_r06', size: 9, seed: 5,
          description: 'Una habitación seca con un estante de tablillas y un arcón de piedra. Las raíces fosilizadas no son de ningún árbol de la montaña.',
          props: ['root_arch', 'column'],
          contents: [
            dlg('z4_d10', [N('El cuaderno de un monje que viajó a un bosque lejano para estudiar la tierra y el cristal.'), H('Los monjes investigaron más allá de estas montañas.')]),
            enc('z4_e07', [['Skeleton', 'Guardia del depósito', 2]]),
            chest('z4_c06', 75, 'potion_greater_healing_1'),
          ],
        },
        {
          id: 'z4_s01_r01', name: 'Celda de los escribas', secret: 'z4_s01', attach: 'z4_r03', size: 9, seed: 4,
          description: 'Un atril seco en medio del agua guarda un diario sobre el cierre del monasterio.',
          props: ['lectern', 'barrels'],
          contents: [
            dlg('z4_d06', [N('Los monjes inundaron sus salas para enfriar el foco arcano, no para alimentarlo.'), H('Se hundieron con sus libros para no entregar lo que custodiaban.')]),
            enc('z4_e06', [['Steam Mephit', 'Mefit del cristal', 1]]),
            chest('z4_c03', 60, 'potion_greater_healing_1'),
          ],
        },
      ],
      pending: [
        { id: 'z4_j01', from: 'z4_r05', until: 'z4_e05', text: 'Algunos mineros siguen cautivos tras una pared de la cámara de estudio.' },
        { id: 'z4_j03', from: 'z4_r03', until: 'z4_s01', text: 'Un cristal apagado guarda un sonido en su interior.' },
        { id: 'z4_j04', from: 'z4_r03', until: 'z4_r10', text: 'Las notas del laboratorio hablan de sellos arcanos alterados.' },
        { id: 'z4_j05', from: 'z4_r06', until: 'z4_s02', text: 'Un mosaico de raíces en la sala de la fuente espera un amuleto de corteza.' },
      ],
    },
  ],
};
