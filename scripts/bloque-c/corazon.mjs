// Bloque C de El Corazón Hueco: salas nuevas, áreas secretas, pruebas, decisiones, regresos y pendientes.
// Textos de diseno/historia/recortada/2-corazon-hueco.md, recortados y arreglados para el juego.
import { N, H, S, enc, patrol, chest, dlg, scene, clue, passing, DMG } from './comun.mjs';

export default {
  zones: [
    // ---------------------------------------------------------------- Zona 1
    {
      id: 'b1',
      add: {
        b1_r02: [
          scene({
            id: 'b1_p01', title: 'El lazo tendido', near: 'b1_t01', before: 'b1_t01', text: 'Bajo las hojas húmedas asoma una cuerda tensa. Alguien ha dejado un lazo de cazador en mitad del sendero.', question: '¿Cómo lo desmontáis?',
            options: [
              { label: 'Buscar la cuerda entre las hojas', attr: 'wis', dc: 11, ok: { text: 'Encontráis la cuerda y desmontáis el lazo.', open: 'b1_t01' }, fail: { text: 'La cuerda se pierde bajo las hojas.' } },
              { label: 'Soltar la anilla sin tensarla', attr: 'dex', dc: 12, ok: { text: 'La anilla cede sin ruido. El paso queda libre.', open: 'b1_t01' }, fail: { text: 'El mecanismo salta.', damage: DMG } },
              { label: 'Estudiar la tensión de los nudos', attr: 'int', dc: 12, ok: { text: 'Aflojáis el nudo que sostiene el peso. El lazo ya no sirve.', open: 'b1_t01' }, fail: { text: 'Se rompe una clavija y el nudo queda trabado.' } },
            ],
            fallback: { text: 'No hay forma de desmontarlo. Tendréis que pasar con cuidado.' },
          }),
          dlg('b1_d03', [H('Estas huellas van hacia el bosque. Las otras vuelven corriendo.'), N('Bajo un helecho hay un guante de cuero lleno de tierra, y en el barro, la marca larga de una raíz arrastrada.')]),
        ],
        b1_r05: [
          dlg('b1_d04', [N('Entre las zarzas, dos bandidos os apuntan con las armas. Les tiemblan las manos.'), H('Bajad eso. No venimos a por vosotros.')]),
          scene({
            id: 'b1_q01', title: 'El fugitivo entre los robles', img: 'escena_fugitivo_robles', decision: true, after: 'b1_e02',
            text: 'Uno de los bandidos ha caído de rodillas junto a un roble, con el brazo herido. Ya no quiere pelear.', question: '¿Qué hacéis con él?',
            options: [
              { label: 'Vendarle el brazo y dejarle ir', ok: { text: '«Gracias. En el sendero de las campanillas, los leñadores tenían un escondite; buscadlo junto a las zarzas», os dice antes de marcharse.', reveal: 'b1_s02' } },
              { label: 'Pedirle que os guíe un trecho', attr: 'cha', dc: 12, ok: { text: 'Os acompaña hasta la barricada y os deja las monedas que llevaba: «Para la posada, si salís de aquí».', gold: 15 }, fail: { text: 'No se fía de vosotros y echa a correr. Sus gritos atraen a un lobo hacia la barricada.', add: 'b1_e04' } },
              { label: 'Dejarle marchar', ok: { text: 'Se aleja cojeando entre los helechos.' } },
            ],
          }),
        ],
        b1_r04: [
          scene({
            id: 'b1_ev01', title: 'El leñador del refugio', decision: true, on_return: true, after: 'b2_r01',
            text: 'Bajo la roca del refugio yace un leñador herido. «No me dejéis dormirme. Cuando cierro los ojos, vuelvo al mismo árbol».', question: '¿Qué hacéis?',
            options: [
              { label: 'Darle una poción de curación', needs: 'potion_healing', ok: { lose: 'potion_healing', text: 'Se pone en pie. «Solo vi que el camino se cerraba como una mano». Os da su paga antes de irse a Vegaumbría.', gold: 15 } },
              { label: 'Vendarle y acompañarle', attr: 'wis', dc: 11, ok: { text: 'Le cerráis la herida y le indicáis la salida. Os deja su paga.', gold: 15 }, fail: { text: 'No sabéis cerrar la herida, pero le ayudáis a caminar hasta la linde.' } },
              { label: 'Indicarle la salida', ok: { text: 'Se aleja despacio hacia Vegaumbría.' } },
            ],
          }),
        ],
        b1_r06: [clue('b1_s01_pista', 'b1_s01', 'La memoria del roble', 'Tres cortes verticales en la corteza. Del tronco sale una corriente de aire que no mueve las hojas.', 12, 12, 'Seguir la corriente', 'Escuchar cómo devuelve el sonido')],
        b1_r07: [
          scene({
            id: 'b1_q02', title: 'La barricada cede', img: 'escena_barricada_cede', decision: true, after: 'b1_e03',
            text: 'Al acabar la pelea, la barricada se viene abajo y atrapa a uno de los bandidos bajo los troncos. Una antorcha caída empieza a prender las ramas.', question: '¿Qué hacéis?',
            options: [
              { label: 'Apagar la antorcha y sacarle', ok: { text: 'Le sacáis antes de que prenda el fuego. «Por aquí ronda un lobo; me lo llevo lejos con la antorcha», dice, y se marcha con ella en alto.', remove: 'b1_e04' } },
              { label: 'Levantar los troncos a pulso', attr: 'str', dc: 12, ok: { text: 'Entre todos apartáis los troncos. Agradecido, os da una poción que guardaba.', item: 'potion_healing' }, fail: { text: 'Los troncos ruedan con estrépito; al final le sacáis, pero el ruido atrae a un lobo.', add: 'b1_e04' } },
            ],
          }),
        ],
      },
      rooms: [
        {
          id: 'b1_r09', name: 'Claro de las hachas', attach: 'b1_r03', size: 10, seed: 1,
          description: 'Tres tocones recién cortados rodean un hacha oxidada, clavada en una raíz que aún sangra savia oscura.',
          props: ['stump', 'stump', 'mossy_rock'],
          contents: [
            dlg('b1_d05', [N('Los cortes siguen frescos. Las raíces nuevas se han cerrado sobre el mango del hacha.'), H('El bosque no solo retiene lo que entra. También recuerda quién lo hirió.')]),
            chest('b1_c06', 8, null),
          ],
        },
        {
          id: 'b1_r10', name: 'Barranco del eco', attach: 'b1_r05', size: 10, seed: 2,
          description: 'Un barranco estrecho repite las palabras con una voz apenas distinta. En la pared quedan restos de una cuerda rota.',
          props: ['fallen_tree', 'mossy_rock'],
          contents: [
            dlg('b1_d06', [N('Pronunciáis el nombre de un leñador. A la segunda, el eco lo devuelve un instante antes de que acabéis de decirlo.'), H('Algo aquí aprende las voces.')]),
            scene({
              id: 'b1_p04', title: 'La cuerda rota', text: 'Al fondo del barranco cuelga el zurrón de alguien que intentó bajar con una cuerda.', question: '¿Cómo lo alcanzáis?',
              options: [
                { label: 'Descolgarse por la pared', attr: 'str', dc: 12, ok: { text: 'Subís el zurrón: una poción y unas monedas.', item: 'potion_healing', gold: 8 }, fail: { text: 'La piedra cede bajo la mano.', damage: DMG } },
                { label: 'Bajar por el árbol inclinado', attr: 'dex', dc: 12, ok: { text: 'Llegáis al zurrón por las ramas: una poción y unas monedas.', item: 'potion_healing', gold: 8 }, fail: { text: 'La rama cruje y no aguanta.' } },
              ],
              fallback: { text: 'El zurrón se queda en el fondo del barranco.' },
            }),
            patrol('b1_pat01', [['Bandit', 'Bandido de la linde', 2]]),
            passing('b1_pat01_paso', 'b1_pat01', 'Patrulla de la linde', 'Unos bandidos cierran el sendero, más hambrientos que valientes.', 12,
            'Desenvainan las armas.', 'Cruzáis tras los helechos mientras ellos discuten.', 'Ya habéis cruzado el bosque del que huyeron. Retroceden y desaparecen.', { after: 'b2_r01' }),
          ],
        },
        {
          id: 'b1_r11', name: 'Sendero de las campanillas', attach: 'b1_r07', size: 10, seed: 3,
          description: 'Campanillas de hueso y madera cuelgan entre dos árboles, pero ninguna suena al rozarla.',
          props: ['big_tree', 'mossy_rock'],
          contents: [
            clue('b1_s02_pista', 'b1_s02', 'Las campanillas de barro', 'Entre dos árboles cuelgan campanillas de madera que no suenan: alguien las rellenó de barro para no hacer ruido al pasar.', 12, 13, 'Buscar huellas junto a las zarzas', 'Mirar el tronco del árbol grande'),
          ],
        },
        {
          id: 'b1_s01_r01', name: 'Cubil del vigía', secret: 'b1_s01', via: 'b1_r06', size: 9, seed: 4,
          description: 'Un escondite dentro de un tronco muerto: una manta podrida, un cuenco de barro y un zurrón colgado.',
          props: ['root_arch', 'mushrooms'],
          contents: [
            dlg('b1_d07', [N('Una hoja de diario, casi borrada, anota los nombres de quienes entraban al bosque.'), H('«Hoy el árbol me ha devuelto un nombre antes de oírlo».')]),
            enc('b1_e05', [['Wolf', 'Lobo del cubil', 2]]),
            chest('b1_c04', 20, 'potion_healing'),
          ],
        },
        {
          id: 'b1_s02_r01', name: 'Garita de las cintas', secret: 'b1_s02', attach: 'b1_r11', size: 9, seed: 5,
          description: 'Un escondite abandonado donde cuelgan cintas de tela de las cuadrillas de leñadores.',
          props: ['stump', 'barrels'],
          contents: [
            dlg('b1_d08', [N('Una nota pide que nadie toque las marcas nuevas, «porque alguien escucha desde los tocones».')]),
            enc('b1_e06', [['Bandit', 'Bandido escondido', 2]]),
            chest('b1_c05', 25, 'potion_healing'),
          ],
        },
      ],
      pending: [
        { id: 'b1_j01', from: 'b1_r02', until: 'b1_r09', text: '¿Por qué las huellas de los leñadores terminan antes de llegar a los árboles?' },
        { id: 'b1_j03', from: 'b1_r06', until: 'b1_s01', text: 'La corteza de un roble deja escapar aire de su interior.' },
        { id: 'b1_j04', from: 'b1_r11', until: 'b1_s02', text: 'Las campanillas de barro parecen señalar algo fuera del sendero.' },
        { id: 'b1_j05', from: 'b1_r10', until: 'b4_r05', text: 'Algo en el bosque aprende las voces de quienes pasan.' },
      ],
    },

    // ---------------------------------------------------------------- Zona 2
    {
      id: 'b2',
      add: {
        b2_r02: [dlg('b2_d05', [N('Tras el tronco se ve un pasillo recto que cruza el bosque. Cinco raíces tensas lo cierran como barrotes.'), H('No ceden. Desde este lado no hay nada con que abrirlas.')])],
        b2_r03: [
          patrol('b2_pat01', [['Wolf', 'Lobo de la maleza', 2]]),
          passing('b2_pat01_paso', 'b2_pat01', 'Lobos en la maleza', 'Los lobos surgen de la maleza y muestran los dientes.', 13,
            'Os rodean entre gruñidos.', 'El viento os favorece: siguen otro rastro sin oleros.', '¡Atrás! Los lobos se retiran ante la firmeza del grupo.', { after: 'b3_r01' }),
        ],
        b2_r04: [
          scene({
            id: 'b2_ev01', title: 'La viajera de los antídotos', decision: true, on_return: true, after: 'b2_g01',
            text: 'Una mercader ha llegado a la cabaña por el atajo de las raíces. «Hoy el bosque dejó pasar a mi mula». Vende remedios.', question: '¿Le compráis algo?',
            options: [
              { label: 'Una poción de curación', cost: 20, ok: { text: '«Que no os haga falta.»', item: 'potion_healing' } },
              { label: 'Un antídoto', cost: 15, ok: { text: '«Para las arañas del nido.»', item: 'antidote' } },
              { label: 'Nada, gracias', ok: { text: '«Vi huellas de varios hombres siguiendo a una sola persona. Id con cuidado.»' } },
            ],
          }),
        ],
        b2_r06: [clue('b2_s01_pista', 'b2_s01', 'Huellas hacia la charca', 'Las huellas de lobo acaban ante un matorral que huele a agua estancada.', 12, 13, 'Interpretar las huellas', 'Buscar una piedra de paso')],
        b2_r05: [dlg('b2_d06', [N('Una bolsa de cazador cuelga sobre el nido. Dentro hay un dibujo de la verja de raíces, hecho por alguien que buscaba cómo abrirla.')])],
      },
      rooms: [
        {
          id: 'b2_r09', name: 'Anillo de resina', attach: 'b2_r04', size: 11, seed: 1,
          description: 'Un círculo de troncos heridos rodea una poza de resina endurecida. Unas tablas llevan hasta una caja abandonada.',
          props: ['stump', 'mossy_rock', 'stump'],
          contents: [
            dlg('b2_d03', [N('La resina ha llenado desde dentro las incisiones de cada tronco.'), H('Aquí las heridas parecen responderse unas a otras.')]),
            scene({
              id: 'b2_q01', title: 'La caja de los resineros', img: 'escena_caja_resineros', decision: true,
              text: 'La caja de los resineros flota sobre la resina, entre vapores que pican en los ojos.', question: '¿Qué intentas?',
              options: [
                { label: 'Arriesgarte a cruzar', attr: 'dex', dc: 13, ok: { text: 'Llegáis a la caja por las tablas: monedas.', gold: 15 }, fail: { text: 'Resbaláis. Una poción se rompe en la resina.', lose: 'potion_healing' } },
                { label: 'Buscar un paso lateral', attr: 'wis', dc: 12, ok: { text: 'Bordeando la poza notáis una corriente cálida entre dos troncos.', reveal: 'b2_s02' }, fail: { text: 'No encontráis otro camino.' } },
                { label: 'Dejarla intacta', ok: { text: 'La caja se queda donde está.' } },
              ],
            }),
            chest('b2_c04', 15, 'potion_healing'),
          ],
        },
        {
          id: 'b2_s02_r01', name: 'Archivo de savia', secret: 'b2_s02', attach: 'b2_r09', size: 9, seed: 5,
          description: 'Una estancia de trabajo cerrada durante años: una mesa, raspadores y frascos vacíos.',
          props: ['desk', 'barrels'],
          contents: [
            dlg('b2_d08', [N('Una carta cuenta que las heridas del bosque se cerraban de noche y aparecían en otros árboles.')]),
            enc('b2_e09', [['Giant Spider', 'Araña de la mesa', 1]]),
            chest('b2_c05', 30, 'antidote'),
          ],
        },
        {
          id: 'b2_r10', name: 'Pasaje de las raíces tensas', attach: 'b2_r06', size: 11, seed: 2,
          description: 'Un corredor de tierra atraviesa el vientre de un árbol caído. Al fondo cruje la verja de raíces del principio.',
          props: ['fallen_tree', 'root_arch'],
          gate: { id: 'b2_g01', to: 'b2_r02' },
          contents: [
            { type: 'lever', id: 'b2_g01_open', gate: 'b2_g01', name: 'La reja que crece', text: 'Las raíces se recogen con un crujido profundo. Ahora hay un atajo entre este pasaje y el tronco partido.',
              lines: [H('Esta es la otra cara de la verja de raíces.'), N('Una palanca de piedra asoma del suelo, gastada por muchas manos. Al moverla, las raíces retroceden.'), H('Ahora podremos volver sin repetir todo el camino.')] },
          ],
        },
        {
          id: 'b2_r11', name: 'Claro de las marcas', attach: 'b2_r07', size: 11, seed: 3,
          description: 'Árboles con señales de herramientas a distintas alturas. La más reciente está por encima de la cabeza de cualquier leñador.',
          props: ['big_tree', 'fallen_tree'],
          contents: [
            scene({
              id: 'b2_q02', title: 'Las marcas altas', img: 'escena_marcas_altas', decision: true,
              text: 'Un leñador perdido mira las marcas antiguas sin atreverse a seguirlas.', question: '¿Qué le aconsejas?',
              options: [
                { label: 'Ayudarle a orientarse', attr: 'wis', dc: 12, ok: { text: 'Agradecido, os cuenta que unas huellas grandes de la barrera de colmillos llevan a una charca escondida.', reveal: 'b2_s01' }, fail: { text: 'No sacáis nada en claro.' } },
                { label: 'Pagarle 10 monedas por su mapa', cost: 10, ok: { text: 'El mapa marca una charca escondida tras la barrera de colmillos.', reveal: 'b2_s01' } },
                { label: 'Apartarte', ok: { text: 'El leñador sigue su camino.' } },
              ],
            }),
          ],
        },
        {
          id: 'b2_s01_r01', name: 'Orilla olvidada', secret: 'b2_s01', via: 'b2_r07', size: 9, seed: 4,
          description: 'Una charca pequeña donde se acumulan objetos perdidos: un morral hundido y una caja metálica.',
          props: ['swamp_water', 'standing_stone'],
          contents: [
            dlg('b2_d07', [N('La nota de un aprendiz de resinero: bajo sus pies, algo repetía los golpes de su corazón.')]),
            enc('b2_e10', [['Wolf', 'Lobo de la orilla', 2]]),
            chest('b2_c06', 25, 'potion_poison_resistance'),
          ],
        },
      ],
      pending: [
        { id: 'b2_j01', from: 'b2_r02', until: 'b2_g01', text: 'Una verja de raíces impide cruzar un pasillo visible.' },
        { id: 'b2_j02', from: 'b2_r09', until: 'b2_s02', text: 'La resina esconde una marca que se repite en los troncos.' },
        { id: 'b2_j03', from: 'b2_r06', until: 'b2_s01', text: 'Unas huellas grandes conducen fuera de la senda principal.' },
      ],
    },

    // ---------------------------------------------------------------- Zona 3
    {
      id: 'b3',
      add: {
        b3_r02: [
          scene({
            id: 'b3_p01', title: 'Los tablones podridos', near: 'b3_t01', before: 'b3_t01', text: 'Las tablas de la pasarela están podridas. Bajo el agua se ven los postes de la antigua.', question: '¿Cómo cruzáis?',
            options: [
              { label: 'Avanzar por las tablas firmes', attr: 'dex', dc: 13, ok: { text: 'Cruzáis y marcáis las tablas buenas.', open: 'b3_t01' }, fail: { text: 'Una tabla cede.', damage: DMG } },
              { label: 'Llevar un madero hasta los postes', attr: 'str', dc: 12, ok: { text: 'El madero hace de apoyo estable.', open: 'b3_t01' }, fail: { text: 'El madero cae al agua.' } },
              { label: 'Buscar el patrón de los postes', attr: 'int', dc: 12, ok: { text: 'Los postes indican por dónde pisar.', open: 'b3_t01' }, fail: { text: 'La corriente mueve los restos.' } },
            ],
            fallback: { text: 'Tendréis que cruzar por las tablas que hay.' },
          }),
        ],
        b3_r03: [
          scene({
            id: 'b3_q01', title: 'La voz en el agua', img: 'escena_voz_agua', decision: true, after: 'b3_e01',
            text: 'Una voz conocida suplica ayuda desde el agua inmóvil.', question: '¿La sigues?',
            options: [
              { label: 'Seguirla con cautela', attr: 'wis', dc: 13, ok: { text: 'La voz se apaga junto a un árbol muerto. Bajo sus raíces escapan burbujas.', reveal: 'b3_s02' }, fail: { text: 'Os alejáis del camino y algo más despierta en la isla.', add: 'b3_e05' } },
              { label: 'Apagar la luz con una piedra', attr: 'dex', dc: 12, ok: { text: 'La luz se apaga. Un alma menos os espera en la isla.', sub: 'b3_e05' }, fail: { text: 'La piedra se hunde sin tocarla.' } },
              { label: 'Ignorarla', ok: { text: 'Seguís adelante sin mirar atrás.' } },
            ],
          }),
        ],
        b3_r05: [
          scene({
            id: 'b3_ev01', title: 'La rendición junto al agua', decision: true, on_return: true, after: 'b4_r05',
            text: 'Un bandido de la linde espera en la caseta con las manos a la vista. «La anciana sabía mi nombre antes de que yo se lo dijera».', question: '¿Qué le decís?',
            options: [
              { label: 'Que vuelva por las marcas del sendero', ok: { text: '«Si alguien espera en Vegaumbría, decidle que no todos los perdidos murieron.» Os deja lo que llevaba.', gold: 10 } },
              { label: 'Que siga su camino', ok: { text: 'Se marcha hacia la linde sin decir nada más.' } },
            ],
          }),
        ],
        b3_r06: [clue('b3_s02_pista', 'b3_s02', 'El paso entre las raíces', 'Junto al árbol caído, el agua de la ciénaga corre hacia un lado, como si se colara por debajo de las raíces.', 13, 12, 'Seguir la corriente', 'Buscar el hueco entre las raíces')],
        b3_r07: [
          clue('b3_s01_pista', 'b3_s01', 'La ofrenda olvidada', 'Un resplandor suave escapa por la junta de una losa. Dos hojas secas vibran a la vez.', 13, 12, 'Notar las hojas', 'Buscar la bisagra'),
          scene({
            id: 'b3_q02', title: 'La ofrenda del guardián', img: 'escena_ofrenda_guardian', decision: true,
            text: 'Bajo un arco de piedras, una semilla dorada brilla sobre una roca cubierta de raíces. Es una ofrenda antigua al guardián del túmulo.', question: '¿Qué hacéis?',
            options: [
              { label: 'Prometer cuidar el bosque', attr: 'cha', dc: 13, ok: { text: 'La semilla brilla con más fuerza y su luz señala una losa suelta junto al túmulo.', reveal: 'b3_s01' }, fail: { text: 'La luz de la semilla no cambia.' } },
              { label: 'Dejar una poción como ofrenda', needs: 'potion_healing', ok: { lose: 'potion_healing', text: 'La semilla se calienta y su calor os reconforta.', heal: 5 } },
              { label: 'Dejarla como está', ok: { text: 'Seguís adelante sin tocar la ofrenda.' } },
            ],
          }),
        ],
      },
      rooms: [
        {
          id: 'b3_r09', name: 'Orilla de los juncos blancos', attach: 'b3_r02', size: 10, seed: 1,
          description: 'Juncos casi blancos bordean una charca sin insectos. Unas estacas señalan un camino desaparecido.',
          props: ['swamp_water', 'mossy_rock'],
          contents: [
            dlg('b3_d03', [N('El barro conserva huellas que llegan a la orilla. Ninguna sale del agua.'), H('Entonces las luces no necesitan perseguir a nadie.')]),
            chest('b3_c06', 10, 'antidote'),
            patrol('b3_pat01', [['Bandit', 'Bandido extraviado', 2]]),
            passing('b3_pat01_paso', 'b3_pat01', 'Extraviados de la ciénaga', 'Dos hombres armados salen de los juncos y exigen comida para dejaros pasar.', 13,
            'No os dejan otra salida.', 'Bordeáis las estacas por una franja de barro firme.', '«El camino a Vegaumbría está abierto. Marchaos». Bajan las armas.', { after: 'b4_r01' }),
          ],
        },
        {
          id: 'b3_r10', name: 'Puente del antiguo juramento', attach: 'b3_r04', size: 11, seed: 2,
          description: 'Dos monolitos sostienen un arco de madera petrificada sobre agua poco profunda.',
          props: ['standing_stone', 'walkway', 'standing_stone'],
          contents: [
            dlg('b3_d04', [H('Las piedras tienen la misma forma que las marcas del bosque profundo.'), N('Bajo el arco, el agua murmura una palabra que nadie alcanza a reconocer.')]),
            dlg('b3_d04b', [S('anselmo', 'Un juramento puede torcerse cuando nadie recuerda por qué se pronunció.')], 'anselmo'),
            scene({
              id: 'b3_p02', title: 'El saquito bajo el puente', text: 'Bajo la pasarela, entre dos piedras, algo brilla en el agua poco profunda: un saquito atado a una raíz.', question: '¿Cómo lo sacáis?',
              options: [
                { label: 'Meterse en el agua fría', attr: 'con', dc: 12, ok: { text: 'Sacáis el saquito: dentro hay una poción y unas monedas.', item: 'potion_healing', gold: 10 }, fail: { text: 'El agua está helada y tenéis que salir.', damage: DMG } },
                { label: 'Buscar piedras firmes para llegar', attr: 'wis', dc: 13, ok: { text: 'Llegáis sin mojaros: una poción y unas monedas.', item: 'potion_healing', gold: 10 }, fail: { text: 'Una piedra se hunde y no llegáis.' } },
              ],
              fallback: { text: 'El saquito se queda bajo el agua.' },
            }),
          ],
        },
        {
          id: 'b3_r11', name: 'Fosa de la marea lenta', attach: 'b3_r05', size: 10, seed: 3,
          description: 'Una depresión retiene agua oscura que sube y baja sin relación con la corriente.',
          props: ['swamp_water', 'mossy_rock'],
          contents: [chest('b3_c05', 20, 'antidote')],
        },
        {
          id: 'b3_s02_r01', name: 'Puesto del testigo', secret: 'b3_s02', via: 'b3_r06', size: 9, seed: 4,
          description: 'Una pequeña cripta con un asiento de piedra, una mesa rota y un estandarte sin emblema.',
          props: ['pedestal', 'gravestone'],
          contents: [
            dlg('b3_d05', [N('Un testimonio en piedra: los guardianes debían recordar al espíritu por qué protegía el bosque.'), N('Dejaron de acudir cuando la ciénaga cubrió el camino.')]),
            enc('b3_e06', [['Skeleton', 'Vigilante del puesto', 2]]),
            chest('b3_c03', 35, 'potion_healing'),
          ],
        },
        {
          id: 'b3_s01_r01', name: 'Cámara de la promesa', secret: 'b3_s01', attach: 'b3_r07', size: 9, seed: 5,
          description: 'Un santuario pequeño detrás de la ofrenda: un cuenco de piedra, dos relieves y una raíz en el centro.',
          props: ['pedestal', 'root_arch'],
          contents: [
            dlg('b3_d06', [N('Tres frases talladas: «Uno vigila». «Muchos recuerdan». «Nadie debe vigilar solo».'), N('La última está dañada desde dentro por las raíces.')]),
            enc('b3_e07', [['Zombie', 'Custodio olvidado', 2]]),
            chest('b3_c04', 40, 'potion_healing'),
          ],
        },
      ],
      pending: [
        { id: 'b3_j01', from: 'b3_r03', until: 'b4_r05', text: 'Las luces del pantano conocen voces que no deberían conocer.' },
        { id: 'b3_j02', from: 'b3_r06', until: 'b3_s02', text: 'El agua de la ciénaga se cuela bajo las raíces del árbol caído.' },
        { id: 'b3_j03', from: 'b3_r07', until: 'b3_s01', text: 'La piedra del túmulo guarda un juramento incompleto.' },
      ],
    },

    // ---------------------------------------------------------------- Zona 4
    {
      id: 'b4',
      add: {
        b4_r03: [
          clue('b4_s01_pista', 'b4_s01', 'El voto enterrado', 'Una grieta detrás del altar exhala aire tibio. Bajo la savia nueva asoma un círculo de marcas antiguas.', 14, 13, 'Notar la corriente', 'Seguir la línea de las marcas'),
          scene({
            id: 'b4_q01', title: 'El altar herido', img: 'escena_altar_herido', decision: true, after: 'b4_e02',
            text: 'Una inscripción incompleta asoma bajo la savia del altar: «Que el bosque viva…».', question: '¿Cómo la descubres?',
            options: [
              { label: 'Retirar la savia', attr: 'int', dc: 13, ok: { text: 'Bajo la savia, las marcas señalan una grieta tras el altar.', reveal: 'b4_s01' }, fail: { text: 'La savia se endurece. Algo se mueve detrás del altar.', add: 'b4_e06' } },
              { label: 'Dejar 10 monedas de ofrenda', cost: 10, ok: { text: 'La savia se retira sola y deja ver una grieta tras el altar.', reveal: 'b4_s01' } },
              { label: 'No tocar el altar', ok: { text: 'Lo dejáis como está.' } },
            ],
          }),
        ],
        b4_r04: [
          patrol('b4_pat01', [['Awakened Shrub', 'Arbusto rezagado', 2]]),
          passing('b4_pat01_paso', 'b4_pat01', 'Las raíces quietas', 'Dos arbustos se alzan al oír pasos donde antes latía el Corazón.', 12,
            'Se lanzan contra vosotros.', 'Pasáis sobre piedra seca mientras rastrean el olor de la savia.', '¡Se acabó la orden! Vacilan y se repliegan a las grietas.', { after: 'b4_e04' }),
        ],
        b4_r08: [
          scene({
            id: 'b4_s02_pista', title: 'La raíz del invierno', before: 'm4_e05',
            text: 'Una raíz blanca, cubierta por una escarcha que no se derrite. Tiene una hendidura con forma de escama.', question: '¿Qué hacéis?',
            options: [
              { label: 'Examinar la escarcha', attr: 'wis', dc: 13, ok: { text: 'Hay una oquedad detrás del hielo. La hendidura espera algo que aún no conocemos.', flag: 'b4_s02_visto' }, fail: { text: 'El hielo no deja ver nada.' } },
              { label: 'Estudiar el sello', attr: 'int', dc: 13, ok: { text: 'No es magia del bosque. La hendidura espera una escama de hielo que aún no tenéis.', flag: 'b4_s02_visto' }, fail: { text: 'No reconocéis el sello.' } },
            ],
            fallback: { text: 'La raíz sigue helada. Quizá haya que volver más adelante.' },
          }),
          scene({
            id: 'b4_s02_abrir', title: 'La raíz del invierno', after: 'm4_e05', reveals: 'b4_s02',
            text: 'La raíz blanca sigue cubierta de escarcha. En vuestras manos, la escama que arrancasteis al dragón brilla con el mismo frío.', question: '¿La usáis?',
            options: [{ label: 'Encajar la escama del dragón', ok: { text: 'La escama encaja sin resistencia. El hielo se vuelve agua y la raíz se aparta por primera vez.', reveal: 'b4_s02' } }],
          }),
        ],
      },
      rooms: [
        {
          id: 'b4_r09', name: 'Cripta de la savia seca', attach: 'b4_r02', size: 10, seed: 1,
          description: 'Raíces petrificadas por fuera y polvo por dentro. Varias manos esculpidas señalan una puerta que ya no existe.',
          props: ['root_arch', 'pedestal'],
          contents: [
            dlg('b4_d04', [N('Una pared muestra a varias personas en círculo alrededor de un solo árbol.'), H('Una vigilia sin compañía puede convertirse en una condena.')]),
            chest('b4_c05', 25, 'potion_healing'),
          ],
        },
        {
          id: 'b4_r10', name: 'Cámara de los ecos cautivos', attach: 'b4_r04', size: 10, seed: 2,
          description: 'Cavidades con forma de rostro reproducen murmullos de lugares por los que habéis pasado.',
          props: ['mossy_rock', 'root_arch'],
          contents: [
            dlg('b4_d05', [N('Una cavidad repite la voz de un bandido; otra, el susurro de los juncos.'), H('Son palabras que escuchamos. Este lugar nos ha seguido desde la linde.')]),
            chest('b4_c07', 20, 'antidote'),
          ],
        },
        {
          id: 'b4_r11', name: 'Antes del último latido', attach: 'b4_r06', size: 11, seed: 3,
          description: 'Tres arcos de madera fosilizada conducen hacia una cámara donde la tierra palpita.',
          props: ['root_arch', 'standing_stone'],
          contents: [
            dlg('b4_d06', [H('El juramento de este lugar perdió el final.'), H('Entonces será aquí donde termine su condena.')]),
            scene({
              id: 'b4_q02', title: 'La última palabra', img: 'escena_ultima_palabra', decision: true,
              text: 'La inscripción de los arcos termina antes de nombrar el descanso.', question: '¿Qué pronuncias?',
              options: [
                { label: '«Descansa, guardián»', attr: 'cha', dc: 14, ok: { text: 'Uno de los nudos de raíz de la cámara se queda quieto.', sub: 'b4_e04' }, fail: { text: 'No hay respuesta.' } },
                { label: 'Recordar el juramento', attr: 'int', dc: 13, ok: { text: 'Entendéis el juramento: el guardián debía proteger a la gente, no retenerla. Una savia tibia os cierra las heridas.', heal: 5 }, fail: { text: 'Las palabras no vuelven.' } },
                { label: 'Guardar silencio', ok: { text: 'Cruzáis los arcos sin decir nada.' } },
              ],
            }),
          ],
        },
        {
          id: 'b4_s01_r01', name: 'Sala de las manos', secret: 'b4_s01', attach: 'b4_r03', size: 9, seed: 4,
          description: 'Tres manos talladas se apoyan en un pedestal en el centro del recinto.',
          props: ['pedestal', 'root_arch'],
          contents: [
            dlg('b4_d07', [N('Un pergamino recuerda el juramento original: escuchar a las personas y apartar el peligro, no impedirles volver a casa.')]),
            enc('b4_e06', [['Awakened Shrub', 'Arbusto del pedestal', 2]]),
            chest('b4_c06', 45, 'potion_healing'),
          ],
        },
        {
          id: 'b4_s02_r01', name: 'Recuerdo de dos estaciones', secret: 'b4_s02', attach: 'b4_r08', size: 9, seed: 5,
          description: 'Una cavidad donde conviven la corteza verde y el hielo cristalino.',
          props: ['root_arch', 'mossy_rock'],
          contents: [
            dlg('b4_d08', [N('Un trozo de cerámica cuenta que el viejo guardián temía un invierno excepcional y guardó memoria del hielo en una raíz.')]),
            enc('b4_e07', [['Awakened Shrub', 'Guardia helada', 2]]),
            chest('b4_c08', 50, 'potion_greater_healing_1'),
          ],
        },
      ],
      pending: [
        { id: 'b4_j01', from: 'b4_r03', until: 'b4_s01', text: 'Una grieta detrás del altar guarda algo oculto.' },
        { id: 'b4_j03', from: 'b4_r11', until: 'b4_e04', text: 'Las palabras de la última losa parecen incompletas.' },
        { id: 'b4_j04', from: 'b4_r08', until: 'b4_s02', text: 'Tras la raíz silenciosa, un hielo imposible guarda un paso. Hace falta algo del invierno.' },
      ],
    },
  ],
};
