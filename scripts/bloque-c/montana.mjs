// Bloque C de El Invierno del Dragón: salas nuevas, áreas secretas, pruebas, decisiones, regresos y pendientes.
// Textos de diseno/historia/recortada/3-invierno-del-dragon.md, recortados y arreglados para el juego.
// El aliado apresado al entrar en m2 está en src/engine/dungeon.ts (CAPTURE).
import { N, H, S, enc, patrol, chest, dlg, scene, clue, passing } from './comun.mjs';

const COLD = '1d4';

export default {
  zones: [
    // ---------------------------------------------------------------- Zona 1
    {
      id: 'm1',
      add: {
        m1_r01: [dlg('m1_d03', [S('aldric', 'Ese corte en el hito lo hice el último otoño. La piedra estaba limpia entonces.'), S('aldric', 'La nieve cambia los caminos. No cambia a quienes necesitan encontrarlos.')], 'aldric')],
        m1_r02: [dlg('m1_d04', [H('El lobo no cazaba solo. Algo pequeño cruzó antes que él.'), N('Una hebra de tela se agita en una rama helada, demasiado alta para el animal.')])],
        m1_r03: [
          scene({
            id: 'm1_ev01', title: 'El hombre de la manta', decision: true, on_return: true, after: 'm1_r07',
            text: 'Un trampero llega malherido al refugio. «Una cornisa cayó tras nosotros. Solo quiero que alguien sepa dónde nos alcanzó la tormenta».', question: '¿Qué hacéis?',
            options: [
              { label: 'Curarle con el estuche', needs: 'healers_kit_1', ok: { lose: 'healers_kit_1', text: 'Se recupera y os dice dónde escondió su bolsa en el almacén.', gold: 10 } },
              { label: 'Improvisar una cura', attr: 'wis', dc: 11, ok: { text: 'Le estabilizáis. Agradecido, os indica dónde escondió su bolsa.', gold: 10 }, fail: { text: 'Hacéis lo que podéis y le dejáis abrigado junto al fuego.' } },
              { label: 'Marcar el lugar y seguir', ok: { text: 'Le prometéis avisar a Cumbrenieve.' } },
            ],
          }),
        ],
        m1_r04: [
          scene({
            id: 'm1_q02', title: 'El kobold del puente', img: 'escena_kobold_puente', decision: true, after: 'm1_e02',
            text: 'Un kobold herido se arrastra sobre el hielo y deja caer su arma.', question: '¿Qué decides?',
            options: [
              { label: 'Dejarle marchar', ok: { text: 'Huye ladera abajo. Al pasar suelta la bolsa del tributo.', gold: 8 } },
              { label: 'Exigirle información', attr: 'cha', dc: 12, ok: { text: '«Bajo la roca de la cornisa sopla aire de la vieja guardia», chilla antes de huir.', reveal: 'm1_s01' }, fail: { text: 'Se escabulle sin decir nada.' } },
              { label: 'Dejarle donde está', ok: { text: 'Seguís adelante sin tocar la ofrenda.' } },
            ],
          }),
          dlg('m1_d06', [S('narrator', 'Un kobold del tributo: «La senda tiene dueño. El oro sube; los forasteros no».'), H('Entonces ya conozco el precio de obedecerle.')]),
        ],
        m1_r05: [clue('m1_s01_pista', 'm1_s01', 'La guardia enterrada', 'Una fina corriente de aire sale por una grieta bajo una roca. Las piedras encajan demasiado bien.', 12, 12, 'Seguir la corriente', 'Reconocer el ensamblaje enano')],
        m1_r08: [
          dlg('m1_d10', [S('aldric', 'La última vez que ignoré una grieta, perdí a mi hermano.'), H('Aquí no iremos más deprisa de lo que el suelo permita.')], 'aldric'),
          patrol('m1_pat01', [['Dire Wolf', 'Huargo rastreador', 1], ['Wolf', 'Lobo rastreador', 1]]),
          passing('m1_pat01_paso', 'm1_pat01', 'Rastreadores del collado', 'Un huargo y un lobo rastrean el camino detrás de un hito.', 12,
            'Cortan la retirada y embisten.', 'Os deslizáis tras los pinos sin quebrar las ramas.', 'Vuestra voz retumba contra el collado. Los animales se pierden en la ventisca.', { after: 'm2_r01' }),
        ],
      },
      rooms: [
        {
          id: 'm1_r09', name: 'Bosquecillo de los hitos', attach: 'm1_r02', size: 10, seed: 1,
          description: 'Tres piedras enanas asoman entre abetos torcidos. Solo una apunta al terreno firme.',
          props: ['milestone', 'milestone', 'pine'],
          contents: [
            dlg('m1_d05', [H('Dos piedras señalan direcciones distintas.'), N('Los enanos nunca dejaban un solo hito para los viajeros.')]),
            scene({
              id: 'm1_p01', title: 'La senda enterrada', text: 'La nieve ha tapado la senda. Junto a un hito asoma una bolsa medio enterrada.', question: '¿Cómo encontráis el paso?',
              options: [
                { label: 'Leer las huellas y el hielo', attr: 'wis', dc: 12, ok: { text: 'Dais con el paso seguro y con la bolsa.', gold: 8 }, fail: { text: 'El frío os cala.', damage: COLD } },
                { label: 'Comparar las marcas enanas', attr: 'int', dc: 12, ok: { text: 'Las marcas llevan al paso seguro y a la bolsa.', gold: 8 }, fail: { text: 'Las marcas no coinciden.' } },
                { label: 'Tantear la nieve profunda', attr: 'con', dc: 11, ok: { text: 'Cruzáis, aunque la bolsa se queda enterrada.' }, fail: { text: 'La ventisca os agota.', damage: COLD } },
              ],
              fallback: { text: 'Rodeáis el bosquecillo sin encontrar nada.' },
            }),
          ],
        },
        {
          id: 'm1_r10', name: 'Trinchera del vendaval', attach: 'm1_r04', size: 10, seed: 2,
          description: 'El sendero se estrecha entre paredes de nieve. Un tronco caído lo cierra a medias.',
          props: ['fallen_pine', 'snow_rock'],
          contents: [
            enc('m1_e05', [['Wolf', 'Lobo alertado', 1]], 'scene'),
            scene({
              id: 'm1_p02', title: 'El tronco de la tormenta', text: 'Bajo el tronco asoma una mochila con vendas.', question: '¿Cómo lo movéis?',
              options: [
                { label: 'Empujar el tronco contra la ladera', attr: 'str', dc: 13, ok: { text: 'El camino queda libre. La mochila guarda un estuche de curandero.', item: 'healers_kit_1' }, fail: { text: 'Caen piedras y un lobo acude al ruido.', fight: 'm1_e05' } },
                { label: 'Aflojar las piedras que lo sujetan', attr: 'int', dc: 12, ok: { text: 'El tronco gira y deja la mochila a la vista: un estuche de curandero.', item: 'healers_kit_1' }, fail: { text: 'Las piedras ruedan y suenan.' } },
                { label: 'Pasar por encima en silencio', attr: 'dex', dc: 12, ok: { text: 'Cruzáis sin desprender nieve, pero la mochila se queda.' }, fail: { text: 'Resbaláis sobre el tronco.', damage: COLD } },
              ],
              fallback: { text: 'Rodeáis el tronco. La mochila se queda bajo la nieve.' },
            }),
          ],
        },
        {
          id: 'm1_r11', name: 'Puesto de señales', attach: 'm1_r07', size: 10, seed: 3,
          description: 'Una plataforma de piedra con una baliza apagada domina el camino.',
          props: ['barrels', 'snow_rock'],
          contents: [
            scene({
              id: 'm1_q01', title: 'La baliza apagada', img: 'escena_baliza_apagada', decision: true,
              text: 'Junto a la baliza apagada, un viejo trampero tiembla de frío. «Se me apagó el fuego y con esta nieve no encuentro el camino de vuelta».', question: '¿Qué hacéis?',
              options: [
                { label: 'Darle una poción de curación', needs: 'potion_healing', ok: { lose: 'potion_healing', text: 'Recupera el color. «Gracias. Bajo la roca de la cornisa hay una puerta enana: por ahí os libraréis de la tormenta».', reveal: 'm1_s01' } },
                { label: 'Ayudarle a encender la baliza', attr: 'wis', dc: 12, ok: { text: 'La llama prende y el trampero entra en calor. Os cuenta que bajo la roca de la cornisa hay un paso enano.', reveal: 'm1_s01' }, fail: { text: 'El viento apaga las chispas una y otra vez.' } },
                { label: 'Dejarle comida y una manta', cost: 5, ok: { text: 'Os lo agradece con una marca de ruta: «La cornisa, bajo la roca».', reveal: 'm1_s01' } },
              ],
            }),
          ],
        },
        {
          id: 'm1_s01_r01', name: 'Puesto de la última guardia', secret: 'm1_s01', via: 'm1_r05', size: 9, seed: 4,
          description: 'Dos esqueletos de señalero y una hornacina con una nota petrificada por la escarcha.',
          props: ['barrels', 'gravestone'],
          contents: [
            dlg('m1_d07', [N('La nota conserva una despedida: «Cerramos el paso para que los niños llegaran al valle».'), H('Su último trabajo fue cerrar el paso.')]),
            enc('m1_e06', [['Wolf', 'Lobo de la guarida', 2]]),
            chest('m1_c06', 15, 'potion_greater_healing_1'),
          ],
        },
      ],
      pending: [
        { id: 'm1_j01', from: 'm1_r02', until: 'm1_r11', text: 'Algo pequeño cruzó el paso antes que el lobo, cargando peso.' },
        { id: 'm1_j02', from: 'm1_r05', until: 'm1_s01', text: 'Bajo una roca de la cornisa sopla aire de ninguna parte.' },
      ],
    },

    // ---------------------------------------------------------------- Zona 2
    {
      id: 'm2',
      add: {
        m2_r01: [dlg('m2_d03', [H('Esa criatura surgió del frío como si la nieve le hubiera dado forma.'), N('La escarcha vuelve a crecer sobre el suelo que acabáis de pisar.')])],
        m2_r03: [
          dlg('m2_d08', [H('El oso buscó refugio aquí. El cepo lo pusieron después.'), H('Hay manos detrás de estas trampas.')]),
          patrol('m2_pat01', [['Kobold', 'Kobold del tributo', 2]]),
          passing('m2_pat01_paso', 'm2_pat01', 'Vigías del tributo', 'Unos kobolds revisan los árboles y las trampas.', 13,
            'Salen de detrás de los pinos, convencidos de que la ruta es suya.', 'Cruzáis entre dos hileras de troncos sin mover las ramas.', 'Les enseñáis una marca del tributo rota. Se miran y retroceden.', { after: 'm3_r01' }),
        ],
        m2_r05: [dlg('m2_d10', [S('vurka', 'Encontré esas mismas marcas cerca de mi campamento cuando todo terminó.'), S('vurka', 'Llegar al dragón también significa romper el miedo que deja atrás.')], 'vurka')],
        m2_r06: [clue('m2_s01_pista', 'm2_s01', 'El refugio de los porteadores', 'Las agujas del pino se mueven sin viento. Una cuña de madera sostiene una raíz.', 13, 12, 'Notar las agujas', 'Buscar la cuña')],
        m2_r07: [
          scene({
            id: 'm2_ev01', title: 'El mercader de la campana', decision: true, on_return: true, after: 'm3_r01',
            text: 'Un comerciante anciano se ha refugiado en la cabaña con su mula. «Quienes siguen arriba necesitan una venda antes que un sermón».', question: '¿Le compráis algo?',
            options: [
              { label: 'Una poción de curación', cost: 20, ok: { text: '«Que os dure hasta el glaciar.»', item: 'potion_healing' } },
              { label: 'Un estuche de curandero', cost: 10, ok: { text: '«Vendas limpias. Arriba no hay.»', item: 'healers_kit_1' } },
              { label: 'Nada, gracias', ok: { text: '«Cuidado con el hielo del glaciar: nunca es tan grueso como parece.»' } },
            ],
          }),
        ],
      },
      rooms: [
        {
          id: 'm2_r09', name: 'Vado del cristal', attach: 'm2_r01', size: 10, seed: 1,
          description: 'Un arroyo corre bajo una lámina de hielo verdoso. Al otro lado, un puente de raíces que solo parece firme desde lejos.',
          props: ['frozen_pool', 'root_arch'],
          contents: [
            scene({
              id: 'm2_p01', title: 'El puente de raíces', text: 'Entre las raíces del puente se ve una bolsa enganchada.', question: '¿Cómo cruzáis?',
              options: [
                { label: 'Avanzar por las raíces estrechas', attr: 'dex', dc: 12, ok: { text: 'Cruzáis en silencio y recogéis la bolsa.', gold: 12 }, fail: { text: 'Caéis al agua helada.', damage: COLD } },
                { label: 'Sujetar el tronco central', attr: 'str', dc: 13, ok: { text: 'Todos pasan. La bolsa cae al otro lado y la recogéis.', gold: 12 }, fail: { text: 'El tronco se suelta.' } },
                { label: 'Vadear y tender una cuerda', attr: 'con', dc: 13, ok: { text: 'Cruzáis seguros, aunque la bolsa se la lleva la corriente.' }, fail: { text: 'El agua helada os corta la respiración.', damage: COLD } },
              ],
              fallback: { text: 'Rodeáis el arroyo por un camino más largo.' },
            }),
          ],
        },
        {
          id: 'm2_r10', name: 'Círculo de las trampas', attach: 'm2_r04', size: 11, seed: 2,
          description: 'Cuerdas entre las ramas bajas, estacas y pequeñas jaulas. Un campamento kobold abandonado a medias.',
          props: ['cell_bars', 'pine', 'barrels'],
          contents: [
            enc('m2_e06', [['Kobold', 'Kobold de las trampas', 2]], 'scene'),
            scene({
              id: 'm2_q01', title: 'El vigía de las trampas', img: 'escena_vigia_trampas', decision: true,
              text: 'Un vigía kobold: «No toquéis las cuerdas. Yo solo guardo este árbol. No quiero morir por un árbol».', question: '¿Cómo lo tratas?',
              options: [
                { label: 'Ofrecerle 8 monedas por su mapa', cost: 8, ok: { text: 'El mapa marca un escondite de porteadores bajo el gran pino del nido.', reveal: 'm2_s01' } },
                { label: 'Persuadirle de que se retire', attr: 'cha', dc: 13, ok: { text: 'Se va y no avisa a nadie. Antes os habla del escondite bajo el gran pino.', remove: 'm2_e06', reveal: 'm2_s01' }, fail: { text: 'Silba, y salen más kobolds de entre las cuerdas.', fight: 'm2_e06' } },
                { label: 'Desarmar las trampas', attr: 'int', dc: 13, ok: { text: 'Soltáis el mecanismo. Entre las cuerdas hay una nota sobre un escondite bajo el gran pino.', reveal: 'm2_s01' }, fail: { text: 'Una cuerda salta y el vigía llama a los suyos.', fight: 'm2_e06' } },
              ],
            }),
          ],
        },
        {
          id: 'm2_r11', name: 'Pinos de luto', attach: 'm2_r06', size: 10, seed: 3,
          description: 'Tres árboles con cortes rectos en la corteza. Del central cuelga una correa de cuero rígida como el metal.',
          props: ['pine', 'fallen_pine'],
          contents: [
            dlg('m2_d12', [H('¿Quién lo dejó?'), N('Los cortes de la corteza continúan hacia la ladera, casi ocultos por la nieve.')]),
            scene({
              id: 'm2_q02', title: 'La correa del pino', img: 'escena_correa_pino', decision: true,
              text: 'Una correa antigua cuelga de un pino ennegrecido, junto a señales talladas de encuentro.', question: '¿Qué conservarás?',
              options: [
                { label: 'Recuperar la correa', attr: 'dex', dc: 12, ok: { text: 'Dentro hay un mensaje y unas monedas de los porteadores.', gold: 12 }, fail: { text: 'La correa se rompe.' } },
                { label: 'Dejar una señal para otros', ok: { text: 'Al volver a pasar, un leñador os ha dejado una poción junto al árbol.', item: 'potion_healing' } },
                { label: 'Examinar los cortes', attr: 'int', dc: 12, ok: { text: 'Los cortes indican un escondite bajo el gran pino del nido.', reveal: 'm2_s01' }, fail: { text: 'No sacáis nada en claro.' } },
              ],
            }),
          ],
        },
        {
          id: 'm2_s01_r01', name: 'Bodega de los ausentes', secret: 'm2_s01', via: 'm2_r06', size: 9, seed: 4,
          description: 'Mochilas colgadas sobre el barro, cajas abiertas y una página de un libro de cargas.',
          props: ['barrels', 'desk'],
          contents: [
            dlg('m2_d11', [N('El libro enumera cargas para la fortaleza. Otra mano escribió al final: «Faltan dos; esperamos al amanecer».'), H('Que esta página llegue al valle.')]),
            enc('m2_e07', [['Kobold', 'Kobold saqueador', 2]]),
            chest('m2_c03', 20, 'potion_greater_healing_1'),
          ],
        },
      ],
      pending: [
        { id: 'm2_j01', from: 'm2_r03', until: 'm2_r10', text: 'Alguien pone cepos para quienes bajan sin pagar el tributo.' },
        { id: 'm2_j02', from: 'm2_r06', until: 'm2_s01', text: 'Las agujas de un pino gigante se mueven sin viento.' },
      ],
    },

    // ---------------------------------------------------------------- Zona 3
    {
      id: 'm3',
      gates: [{ id: 'm3_g01', from: 'm3_r06', to: 'm3_r02' }],
      add: {
        m3_r01: [dlg('m3_d03', [H('Atacaron las figuras de los porteadores, no las de los guerreros.'), H('Un señor que presume de su tesoro teme que recuerden de dónde salió.')])],
        m3_r02: [dlg('m3_d08', [N('Al fondo, una reja de contrapesos deja ver un pasillo iluminado hacia el patio.'), H('Podemos verlo, pero desde este lado no hay con qué abrir la reja.')])],
        m3_r05: [
          dlg('m3_d13', [S('vurka', 'Mi gente se negó a pagar con sus hijos. Ahora entiendo qué escondían estos libros.')], 'vurka'),
          dlg('m3_d21', [N('Una tablilla suelta habla de una puerta sellada en el depósito: «Solo se abrirá con una luz traída de muy lejos».')]),
        ],
        m3_r06: [
          { type: 'lever', id: 'm3_g01_open', gate: 'm3_g01', name: 'Reja de contrapesos', text: 'La reja queda abierta: hay un atajo entre el patio y la galería del guardián.',
            lines: [H('Esta es la palanca de la reja que vimos junto al farol.'), N('La cadena asciende por el muro y el corredor queda abierto.'), H('Ahora servirá para regresar con vida.')] },
          scene({
            id: 'm3_ev01', title: 'El que deja el arma', decision: true, on_return: true, after: 'm3_r08',
            text: 'Un kobold rezagado sale de entre las cajas y arroja su daga. «No quiero volver a cargar oro. Conozco una escalera hacia el valle».', question: '¿Qué le dices?',
            options: [
              { label: 'Que se lleve a los demás', ok: { text: 'Se marcha corriendo. Los porteadores que aún vagan por aquí serán uno menos.', sub: 'm3_pat01' } },
              { label: 'Ignorarle', ok: { text: 'Desaparece entre las cajas.' } },
            ],
          }),
          patrol('m3_pat01', [['Kobold', 'Porteador kobold', 3]]),
          passing('m3_pat01_paso', 'm3_pat01', 'Porteadores del carro', 'Unos kobolds arrastran un carro vacío por la galería.', 13,
            'Arrojan la carga a un lado y se preparan.', 'Os ocultáis tras los pilares hasta que el carro pasa.', 'Les señaláis la reja abierta: la fortaleza ya no es suya. Huyen.', { after: 'm3_r08' }),
        ],
        m3_r07: [
          clue('m3_s01_pista', 'm3_s01', 'El legado de la forja', 'Un ladrillo del muro está ligeramente hundido. Al golpearlo suena hueco.', 13, 13, 'Escuchar el sonido hueco', 'Reconocer el ladrillo de cierre'),
          scene({
            id: 'm3_s02_pista', title: 'La puerta de escarcha', text: 'Junto a la forja apagada, la escarcha dibuja en el muro el contorno de una puerta, sin cerradura ni bisagras.', question: '¿Qué hacéis?',
            options: [
              { label: 'Mirar la escarcha de cerca', attr: 'wis', dc: 14, ok: { text: 'Es una puerta enana sellada y no se mueve. La tablilla del archivo decía que hace falta una luz traída de lejos.', flag: 'm3_s02_visto' }, fail: { text: 'Solo veis hielo.' } },
              { label: 'Buscar una marca enana', attr: 'int', dc: 13, ok: { text: 'Encontráis la marca de las tablillas: un ojo y un sol naciente. Esta puerta se abrirá algún día con una luz traída de lejos.', flag: 'm3_s02_visto' }, fail: { text: 'No encontráis ninguna marca.' } },
            ],
            fallback: { text: 'La escarcha no os dice nada más.' },
          }),
        ],
        m3_r08: [dlg('m3_d19', [H('Más allá del portón, el glaciar conserva una luz que no pertenece al amanecer.'), N('El portón vibra y la luz azul llena la garganta.')])],
      },
      rooms: [
        {
          id: 'm3_r09', name: 'Atrio de los contrapesos', attach: 'm3_r01', size: 10, seed: 1,
          description: 'Un reloj de agua petrificado por el frío. Una losa inclinada oculta el mecanismo del suelo.',
          props: ['column', 'pedestal'],
          contents: [
            dlg('m3_d04', [H('Hasta la piedra estaba pensada para obedecer a una medida exacta.')]),
            scene({
              id: 'm3_p01', title: 'El peso de la puerta', text: 'Bajo la losa inclinada hay un hueco con algo envuelto en tela.', question: '¿Cómo la levantáis?',
              options: [
                { label: 'Recomponer la secuencia del contrapeso', attr: 'int', dc: 13, ok: { text: 'La losa se alza sola. Debajo, una poción envuelta en tela.', item: 'potion_healing' }, fail: { text: 'El mecanismo os golpea.', damage: COLD } },
                { label: 'Sentir la vibración de la cadena', attr: 'wis', dc: 12, ok: { text: 'Evitáis la losa y alcanzáis el hueco: una poción.', item: 'potion_healing' }, fail: { text: 'La cadena no vibra.' } },
                { label: 'Sujetar el bloque a pulso', attr: 'str', dc: 14, ok: { text: 'Aguantáis el bloque mientras otro saca la poción.', item: 'potion_healing' }, fail: { text: 'El bloque cae.', damage: COLD } },
              ],
              fallback: { text: 'Entráis por una junta del muro y la losa se queda cerrada.' },
            }),
          ],
        },
        {
          id: 'm3_r10', name: 'Cámara de las válvulas', attach: 'm3_r03', size: 10, seed: 2,
          description: 'Dos tuberías cruzan una estancia circular. Una válvula está tibia; la otra, sellada por el hielo.',
          props: ['forge', 'barrels'],
          contents: [
            dlg('m3_d10', [N('Un leve murmullo circula por la tubería, el primero que se oye en muchos años.')]),
            scene({
              id: 'm3_q02', title: 'Las dos válvulas', img: 'escena_dos_valvulas', decision: true,
              text: 'Entre vapor y hielo, dos válvulas de hierro y un cajón medio abierto.', question: '¿Qué priorizas?',
              options: [
                { label: 'Reparar la válvula', attr: 'dex', dc: 13, ok: { text: 'El aire templado llega a la forja y el cajón se abre: monedas.', gold: 15 }, fail: { text: 'La rueda no cede.' } },
                { label: 'Forzarla de inmediato', attr: 'str', dc: 14, ok: { text: 'La forja se templa, pero el cajón se parte y su contenido cae por la rejilla.' }, fail: { text: 'La válvula sigue helada.' } },
                { label: 'No tocar el mecanismo', ok: { text: 'Lo dejáis como está.' } },
              ],
            }),
          ],
        },
        {
          id: 'm3_r11', name: 'Sala de los juramentos', attach: 'm3_r05', size: 11, seed: 3,
          description: 'Bancos de piedra alrededor de una mesa rota. Un kobold desarmado se esconde tras un estandarte.',
          props: ['column', 'desk'],
          contents: [
            scene({
              id: 'm3_q01', title: 'El kobold del estandarte', img: 'escena_kobold_estandarte', decision: true,
              text: '«No soy guardia. Me mandaron contar sacos y me dejaron encerrado». Aprieta una bolsa con sellos de la fortaleza.', question: '¿Qué harás con él?',
              options: [
                { label: 'Prometerle una salida', attr: 'cha', dc: 12, ok: { text: 'Os da los sellos y se va. Con ellos, los porteadores os tomarán por capataces: uno menos.', sub: 'm3_pat01', gold: 5 }, fail: { text: 'Huye con la bolsa.' } },
                { label: 'Comprarle los sellos', cost: 40, ok: { text: 'Con los sellos, los porteadores os dejarán en paz: uno menos.', sub: 'm3_pat01' } },
                { label: 'Dejarle marchar', ok: { text: 'Se escabulle. Avisará a los suyos de que os dejen en paz: uno menos.', sub: 'm3_pat01' } },
              ],
            }),
          ],
        },
        {
          id: 'm3_s01_r01', name: 'Inspección de los maestros', secret: 'm3_s01', via: 'm3_r07', size: 9, seed: 4,
          description: 'Una mesa de piedra, dos bancos y herramientas guardadas con cuidado antes de abandonar el lugar.',
          props: ['desk', 'forge'],
          contents: [
            dlg('m3_d16', [N('Una nota habla de «la última pieza que jamás debió fundirse para pagar el invierno».'), H('Dejaron una nota para quien pudiera soportar leerla.')]),
            enc('m3_e06', [['Skeleton', 'Maestro de forja', 2]]),
            chest('m3_c04', 25, 'potion_greater_healing_1'),
          ],
        },
      ],
      pending: [
        { id: 'm3_j01', from: 'm3_r02', until: 'm3_g01', text: 'Una reja de contrapesos cierra un pasillo hacia el patio.' },
        { id: 'm3_j02', from: 'm3_r07', until: 'm3_s01', text: 'Un ladrillo del depósito suena hueco.' },
        { id: 'm3_j03', from: 'm3_r05', until: 'm3_s02', text: 'La puerta de escarcha responde a una luz nacida lejos de esta montaña. Habrá que volver algún día.' },
      ],
    },

    // ---------------------------------------------------------------- Zona 4
    {
      id: 'm4',
      add: {
        m4_r01: [dlg('m4_d03', [H('Estas monedas no llegaron en un solo viaje.'), N('El hielo conserva una columna de monedas doblada bajo su propio peso.')])],
        m4_r02: [dlg('m4_d07', [S('syrael', 'Mi maestra decía que ningún hechizo es pequeño para quien debe soportarlo cada día.'), S('syrael', 'No basta con sobrevivir a sus ráfagas. Debemos alcanzar a quien las provoca.')], 'syrael')],
        m4_r04: [
          patrol('m4_pat01', [['Ice Mephit', 'Mefit de la fisura', 2]]),
          passing('m4_pat01_paso', 'm4_pat01', 'Mefits de la fisura', 'Dos mefits de hielo emergen de una fisura y levantan una nube helada.', 14,
            'Os cierran el paso.', 'Esperáis tras un pilar de hielo hasta que la bruma os oculta.', 'Una orden enérgica y la amenaza del fuego los hacen retroceder.', { after: 'm4_r06', before: 'm4_e05' }),
        ],
        m4_r05: [
          clue('m4_s01_pista', 'm4_s01', 'La ofrenda que nunca llegó', 'Un reflejo distinto se repite bajo un bloque de hielo. Por una rendija sale aire menos frío.', 14, 13, 'Observar el reflejo', 'Buscar la unión con el muro'),
          scene({
            id: 'm4_q02', title: 'La carta de los emisarios', img: 'escena_carta_emisarios', decision: true,
            text: 'Junto a unos mantos doblados hay una carta sellada que nunca llegó a su destino.', question: '¿Qué hacéis?',
            options: [
              { label: 'Llevar la carta a Cumbrenieve', ok: { text: 'Guardáis la carta. Entre los mantos hay unas monedas para el viaje.', gold: 10 } },
              { label: 'Buscar entre las cajas', attr: 'wis', dc: 14, ok: { text: 'Tras las cajas, una rendija lleva a una cámara escondida.', reveal: 'm4_s01' }, fail: { text: 'Solo hay hielo.' } },
              { label: 'Dejar el testimonio intacto', ok: { text: 'Lo dejáis donde lo encontrasteis.' } },
            ],
          }),
        ],
        m4_r06: [dlg('m4_d13', [H('La barricada no protege un hogar. Protege un tesoro que no les pertenece.'), N('Tras las cajas retumba el aliento del dragón.')])],
        m4_r07: [
          dlg('m4_d15', [S('durnok', 'Descansad. Los antiguos colocaron esta cámara para quien llegara al final del camino.')], 'durnok'),
          dlg('m4_d16', [S('aldric', 'Durante años creí que una ruta segura era aquella de la que todos regresaban.')], 'aldric'),
        ],
      },
      rooms: [
        {
          id: 'm4_r09', name: 'Canal de las fisuras', attach: 'm4_r02', size: 10, seed: 1,
          description: 'Un cauce de hielo se pierde bajo una arcada azul. Por las grietas sube una corriente helada.',
          props: ['crevasse', 'ice_pillar'],
          contents: [
            scene({
              id: 'm4_p01', title: 'La corriente ascendente', text: 'Al otro lado del canal hay un alijo abandonado por exploradores.', question: '¿Cómo cruzáis?',
              options: [
                { label: 'Cruzar entre dos ráfagas', attr: 'dex', dc: 13, ok: { text: 'Llegáis al alijo: monedas.', gold: 15 }, fail: { text: 'La ráfaga os alcanza.', damage: COLD } },
                { label: 'Seguir el ritmo del aire', attr: 'wis', dc: 12, ok: { text: 'Encontráis la secuencia segura y recuperáis el alijo.', gold: 15 }, fail: { text: 'El ritmo cambia sin aviso.' } },
                { label: 'Resistir y tender una cuerda', attr: 'con', dc: 13, ok: { text: 'Cruzáis seguros, sin tiempo para el alijo.' }, fail: { text: 'El frío os muerde.', damage: COLD } },
              ],
              fallback: { text: 'Avanzáis por la orilla y el alijo se queda allí.' },
            }),
          ],
        },
        {
          id: 'm4_r10', name: 'Cámara de los ecos', attach: 'm4_r04', size: 10, seed: 2,
          description: 'Una bóveda de hielo devuelve cada palabra con segundos de retraso. Junto a la puerta cuelga una campanilla.',
          props: ['ice_pillar', 'ice_pillar'],
          contents: [
            enc('m4_e06', [['Kobold', 'Kobold de la campanilla', 1]], 'scene'),
            scene({
              id: 'm4_q01', title: 'La campanilla de hielo', img: 'escena_campanilla_hielo', decision: true,
              text: 'Un kobold agotado guarda la campanilla. «Si la toco, vendrán los demás. Si no, él sabrá que fallé».', question: '¿Qué le propones?',
              options: [
                { label: 'Ofrecerle una salida', attr: 'cha', dc: 13, ok: { text: 'Deja la campanilla y se va. «En la barricada son tres».', remove: 'm4_e06' }, fail: { text: 'Toca la campanilla.', fight: 'm4_e06' } },
                { label: 'Pagar por su silencio', cost: 60, ok: { text: 'Se guarda las monedas y desaparece.', remove: 'm4_e06' } },
                { label: 'Apartar la puerta por la fuerza', attr: 'str', dc: 15, ok: { text: 'La puerta cede antes de que pueda tocar la campanilla. Huye.', remove: 'm4_e06' }, fail: { text: 'La campanilla suena.', fight: 'm4_e06' } },
              ],
            }),
          ],
        },
        {
          id: 'm4_r11', name: 'Umbral del aliento', attach: 'm4_r06', size: 10, seed: 3,
          description: 'Un arco de hielo vibra ante la corriente que llega de la cámara del dragón.',
          props: ['ice_pillar', 'snow_rock'],
          contents: [
            dlg('m4_d14', [H('Podemos usar su propio aliento para acercarnos.'), N('El eco anuncia otra ráfaga.')]),
            scene({
              id: 'm4_p03', title: 'La respiración de la montaña', text: 'En un nicho del arco hay vendas y un frasco olvidados.', question: '¿Cómo pasáis el umbral?',
              options: [
                { label: 'Esperar la calma entre ráfagas', attr: 'wis', dc: 14, ok: { text: 'Pasáis todos sin daño y recogéis el frasco del nicho: una poción.', item: 'potion_healing' }, fail: { text: 'La ráfaga os alcanza.', damage: COLD } },
                { label: 'Calcular el intervalo por los destellos', attr: 'int', dc: 14, ok: { text: 'Cruzáis en el intervalo calculado. En el nicho, una poción.', item: 'potion_healing' }, fail: { text: 'Los destellos os engañan.', damage: COLD } },
              ],
              fallback: { text: 'Cruzáis al amparo de la roca, sin tiempo para el nicho.' },
            }),
          ],
        },
        {
          id: 'm4_s01_r01', name: 'Cámara de los últimos emisarios', secret: 'm4_s01', via: 'm4_r05', size: 9, seed: 4,
          description: 'Un cofre de ofrendas, dos mantos doblados y una carta sellada sin entregar.',
          props: ['barrels', 'ice_pillar'],
          contents: [
            dlg('m4_d12', [N('«No traemos el tributo pedido. Traemos una última solicitud: que el valle pueda pasar sin inclinar la cabeza».'), H('Llevaremos su petición al valle, aunque llegue tarde para ellos.')]),
            enc('m4_e07', [['Ice Mephit', 'Mefit del calor', 2]]),
            chest('m4_c04', 35, 'potion_greater_healing_1'),
          ],
        },
      ],
      pending: [
        { id: 'm4_j01', from: 'm4_r05', until: 'm4_s01', text: 'Un reflejo bajo el hielo de la galería no coincide con los demás.' },
      ],
    },
  ],
};
