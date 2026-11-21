# Las profundidades de Hondaroca: narrativa completa

Primera aventura de Mazmorreo. Todos los textos que ve el jugador, sacados del juego tal como está hoy en `master` (21-11-2026), en el orden en que aparecen durante la partida. Fuentes: `src/data/hondaroca.json`, `src/data/charlas.json`, `src/data/comentarios.ts`, `src/data/objetivos.ts` y el código del juego.

## Prompt para la otra IA (copiar tal cual)

```
Te adjunto toda la narrativa de «Las profundidades de Hondaroca», la primera aventura de Mazmorreo: un juego de rol de fantasía para móvil, en vertical, con reglas de D&D 2024 (SRD 5.2.1). Están todos los textos que ve el jugador, en el orden en que aparecen, con quién dice cada cosa.

QUIERO DOS COSAS:
1. MÁS PROFUNDIDAD: que el jugador entienda bien la historia y se empape de ella. Quién es Orvane y qué quiere, qué fue de los mineros, quiénes eran Aldric y los monjes, qué es el cristal, por qué cada zona lleva a la siguiente y qué papel tiene cada aliado. La historia se cuenta a trozos entre combates: cada trozo debe sumar.
2. NINGUNA INCONGRUENCIA: nada que se mencione y luego no aparezca, nada que aparezca sin explicar, ningún hilo que se quede sin cerrar, y ningún texto que contradiga a otro (por ejemplo, un objeto, un personaje o un lugar que se nombra pero nunca se ve, o algo que se descubre dos veces).

PUEDES: reescribir cualquier texto (narrador, diálogos, títulos, preguntas, opciones, resultados, avisos, pendientes del diario, charlas), añadir líneas de diálogo cortas o diálogos nuevos en una sala, y borrar lo que sobre.

NO PUEDES CAMBIAR (es mecánica del juego):
- Los códigos entre acentos graves (`z1_r01`, `z1_q01`…).
- Lo que va entre corchetes [ ]: oro, objetos, combates, enemigos de más o de menos, secretos que se abren. El texto nuevo debe encajar con esa consecuencia.
- El mapa, las salas, los enemigos (sí su nombre visible), los aliados y dónde se unen, las pruebas (característica y CD) y las ilustraciones que ya existen.

NORMAS DE ESTILO:
- Español de España. Al grupo se le habla en segunda persona del plural («entráis», «veis»).
- Frases cortas, legibles en un móvil. Ninguna línea de más de unas 25 palabras.
- Nunca digas cuántos enemigos hay: el juego cambia la cantidad según el grupo.
- El héroe lo crea el jugador: puede ser de cualquier especie, clase y género. Que sus líneas sirvan para todos.
- Respeta los nombres propios (Valdescarcha, Hondaroca, Maese Orvane, Aldric, Brunna, Tiko, Edmund, Liss), salvo que cambiar uno resuelva una incongruencia; si lo haces, dilo y cámbialo en todas partes.
- Las descripciones en cursiva no las ve el jugador: úsalas como contexto, y si algo importante solo está ahí, llévalo a un texto que sí se vea.

QUÉ ME DEVUELVES:
1. Una lista breve de las incongruencias y huecos que has encontrado y cómo los resuelves.
2. El documento completo corregido, con la misma estructura, los mismos encabezados y los mismos códigos, para poder meterlo en el juego.
```

---

## Cómo leer este documento

- Cada línea dice **quién habla**: Narrador, Héroe (el personaje que crea el jugador; puede ser de cualquier clase y especie) o un personaje con nombre.
- El mapa no es lineal: el jugador recorre las salas de cada zona en el orden que quiera. Las salas van en el orden habitual de una partida. Las escenas marcadas «tras…» solo salen cuando se ha hecho eso antes.
- Entre corchetes [ ] va la consecuencia de juego de cada opción (oro, objeto, combate, secreto…). Es mecánica: si se reescribe el texto, debe seguir encajando con ella.
- *Las descripciones de sala en cursiva son internas*: el jugador no las lee, pero dicen qué hay en cada lugar.
- Los códigos entre acentos graves (`z1_r01`, `z1_q01`…) identifican cada texto en el juego. No los cambies: sirven para volver a meter los textos corregidos.
- Los números exactos de enemigos no deben aparecer en la narración: el juego cambia cuántos salen según el grupo.

## 0. Personajes

- **Maese Orvane** (jefe final, mago humano).
- **Brunna Piedrahonda** (Enana, guerrera): Práctica, testaruda y protectora. Conoce las galerías mineras y no soporta a los capataces abusivos. Prefiere resolver los problemas con su martillo y proteger a sus compañeros.
- **Tiko Manosrápidas** (Mediano, pícaro): Ingenioso, hablador y oportunista. Siempre busca una salida y un tesoro. Tiene buen corazón, aunque intenta ocultarlo detrás de sus bromas.
- **Hermano Edmund** (Humano, clérigo): Sereno, compasivo y profundamente comprometido con su deber. Es el último guardián de la cripta y siente que ha fallado a los antepasados.
- **Liss** (Elfa, maga): Inteligente, reservada y atormentada por su participación en los experimentos de Orvane. Desea reparar el daño que ha causado y teme el poder que su antiguo maestro ha descubierto.
- Solo se unen tres de los cuatro aliados: Brunna sustituye al que coincida con la clase del héroe (si el héroe es guerrero, Brunna no aparece; si es pícaro, Brunna sustituye a Tiko, etc.). Por eso varias escenas tienen versión normal y versión con Brunna.

## 1. Introducción (al empezar la aventura)

Pantalla con la ilustración de la entrada. Después:

- **Narrador:** Los mineros de Valdescarcha han desaparecido. El mago Maese Orvane los obliga a excavar bajo Hondaroca para encontrar un cristal de gran poder. Hace siglos, el rey enano Aldric cerró el acceso para proteger el valle. Debes rescatar a los mineros y detener a Orvane antes de que libere la magia del cristal.
- **Narrador:** La mina de Hondaroca estaba en funcionamiento hasta hace pocos días. Ahora los goblins la ocupan y vigilan a los mineros capturados. Actúan por orden de Maese Orvane.

## 2. Zona 1: La mina de Hondaroca

### Al entrar en la zona

- **Narrador:** Hace días que los mineros de Hondaroca no regresan. Sus familias esperan noticias en Valdescarcha.
- **Narrador:** La entrada está desierta. Hay huellas recientes y señales de una lucha.
- **Héroe (personaje del jugador):** Encontraré a los mineros y averiguaré quién se los ha llevado.

- Consejo del tutorial (solo en esta aventura): «Toca una casilla iluminada para caminar hasta ella. Si tocas la oscuridad, avanzáis hacia allí hasta encontrar algo.»

### Diario: pendientes de esta zona

Aparecen en el diario del jugador como cosas por resolver, y se tachan al resolverlas.

- Las marcas de los mineros parecen indicar por dónde se llevaron a sus compañeros. *(aparece en «Boca de la mina»; se resuelve en «Pasadizo de las marcas»)*
- Alguien ha vuelto al campamento hace poco. Quizá quede algún minero con vida por aquí. *(aparece en «Campamento de los mineros»; se resuelve en la escena «El entibador superviviente» de «Campamento de los mineros»)*
- Una corriente de aire sale de un lugar donde no debería haber paso. *(aparece en «Almacén de herramientas»; se resuelve en el secreto de «Almacén de herramientas»)*
- Alguien escondió un pequeño botín cerca del cruce. Las marcas recientes podrían delatarlo. *(aparece en «Cruce de los raíles»; se resuelve en el secreto de «Cruce de los raíles»)*
- Una luz violeta llega desde el fondo de Hondaroca. Hay que averiguar de dónde procede. *(aparece en «Cámara del agua negra»; se resuelve en el combate de «Cámara del poder prohibido»)*
- La campana de alarma fue inutilizada por orden de Orvane. Hay que detener al responsable. *(aparece en «Sala de avisos»; se resuelve en el combate de «Cámara del poder prohibido»)*

### Elementos del mapa

- **Derrumbe de la galería**: (intactos) Un derrumbe tapa la galería. / (retirados) Pasáis entre las piedras que apartasteis.

### Boca de la mina `z1_r01`

*La entrada, utilizada hasta hace pocos días, está dañada. Una vagoneta yace volcada junto a las vías.*

**Combate:** Rata de la entrada (Rat). `z1_e01`

**Diálogo al entrar:** `z1_d01`

- **Narrador:** Bajo una rueda de la vagoneta hay un trozo de tela gris con una hebilla de minero.
- **Héroe (personaje del jugador):** La hebilla está limpia. Los mineros desaparecieron hace poco.

### Galería de extracción `z1_r02`

*Una galería estrecha sostenida por vigas de madera. Hay marcas recientes de picos y una lámpara goblin cuelga de una viga.*

**Combate:** Goblin de la galería (Goblin Warrior), Rata de la galería (Giant Rat). `z1_e02`

**Trampa: Viga debilitada.** Una cuerda oculta está conectada a unas piedras sueltas. Si no se detecta, el techo desprende fragmentos sobre quien avance primero. *(Efecto: 1d6 contundente; mitad del daño con salvación exitosa.)*

**Descanso (corto): Rincón resguardado.** Un hueco tranquilo donde recobrar el aliento; permite regresar a Valdescarcha.

**Escena: «La viga que cede»** `z1_p01`

- **Narrador:** Entre las vigas del túnel, unas piedras sueltas han atrapado una bolsa de suministros de los mineros. Asoman unas monedas y un rollo de cuerda. La madera cruje al acercarte.
- **Pregunta:** ¿Os arriesgáis a sacar la bolsa entera?
  - Opción «Coger solo lo que asoma»
    - Resultado: Sacas un par de monedas sin tocar la viga. La cuerda se queda bajo las piedras. [+2 oro]
  - Opción «Calzar la viga y sacar la bolsa entera» (prueba de Fuerza CD 11)
    - Éxito: Calzas la viga y sacas la bolsa entera: unas monedas y una cuerda de minero. Con ella se podría bajar a un pozo. [+2 oro; objeto: Cuerda]
    - Fallo: La viga cede sobre tu brazo y tienes que soltarla. [daño 1d4]
  - Opción «Buscar la piedra que sostiene el resto» (prueba de Inteligencia CD 13)
    - Éxito: Retiras la piedra justa y la bolsa sale entera: unas monedas y una cuerda de minero. Con ella se podría bajar a un pozo. [+2 oro; objeto: Cuerda]
    - Fallo: No das con la piedra buena. Mejor no tocar más.
  - Si se marcha sin elegir: La bolsa queda atrapada bajo los escombros. No merece la pena arriesgarse más.

### Almacén de herramientas `z1_r03`

*Un ensanchamiento de la galería contiene cajas, lámparas, picos y vagonetas. Bajo unos tablones hay un pequeño cofre.*

**Combate:** Rata del almacén (Giant Rat), Araña del almacén (Spider). `z1_e03`

**Cofre.** Contiene: Poción de curación.

**Secreto:** Un antiguo acceso de mantenimiento comunica dos galerías de la mina. *(abre «Campamento de los mineros»)*

**Cofre.** Contiene: Poción de curación.
  - Obstáculo «Puerta atascada» (se pasa con: Palanqueta): La puerta de un cuartucho del almacén está atascada.
  - Sin la herramienta: Con una palanqueta la abriríamos. En la tienda del pueblo venden.
  - Al usarla: [el personaje] mete la palanqueta en la rendija y la puerta cede.
  - Alternativa «Fuerza»: [el personaje] empuja la puerta con el hombro. / si sale mal: La puerta no cede y [el personaje] se hace daño

**Escena: «Corriente de aire»** `z1_s01_pista`

- **Narrador:** Una corriente fría pasa entre las vigas del túnel y levanta el polvo. Podría señalar un hueco oculto.
- **Pregunta:** ¿Cómo lo buscas?
  - Opción «Seguir el aire entre las vigas» (prueba de Sabiduría CD 11)
    - Éxito: Descubres una antigua ruta de mantenimiento que comunica con otra galería. [descubre el secreto de «Almacén de herramientas»]
    - Fallo: No das con ello por ahí.
  - Opción «Examinar los apoyos de madera» (prueba de Inteligencia CD 11)
    - Éxito: Encuentras el acceso a una ruta de mantenimiento olvidada. [descubre el secreto de «Almacén de herramientas»]
    - Fallo: No das con ello por ahí.

### Cruce de los raíles `z1_r04`

*Tres galerías convergen en una cámara de roca. Una vagoneta bloquea parcialmente el paso. Los goblins han colocado allí un puesto de vigilancia.*

**Combate:** Arquero del cruce (Goblin Warrior). `z1_e04`

**Secreto:** Un pequeño cofre contiene parte del botín que los goblins escondieron durante la ocupación. *(abre el cofre de «Campamento de los mineros»)*

**Escena: «El rastro del botín»** `z1_s02_pista`

- **Narrador:** Unas huellas recientes se apartan del camino habitual. Alguien ha escondido algo por aquí.
- **Pregunta:** ¿Cómo lo buscas?
  - Opción «Seguir las raspaduras del suelo» (prueba de Sabiduría CD 12)
    - Éxito: Sigues las marcas y descubres un cofre escondido por los goblins. [descubre el secreto de «Cruce de los raíles»]
    - Fallo: No consigues seguir el rastro.
  - Opción «Examinar el polvo junto a las vigas» (prueba de Inteligencia CD 11)
    - Éxito: El polvo removido te permite localizar un cofre oculto. [descubre el secreto de «Cruce de los raíles»]
    - Fallo: No consigues seguir el rastro.

**Escena: «El vigía herido»** `z1_q01` (tras el combate de «Cruce de los raíles») — ilustración `escena_vigia_herido`

- **Narrador:** Tras el combate, un goblin herido suelta el arco, se arrodilla y extiende las manos. Está dispuesto a hablar.
- **Pregunta:** ¿Qué haces con él?
  - Opción «Perdonarle y preguntar por el botín» (prueba de Carisma CD 11, decisión de piedad)
    - Éxito: Agradecido, el goblin te cuenta dónde escondieron un cofre con suministros. Después se marcha. [descubre el secreto de «Cruce de los raíles»]
    - Fallo: Aprovecha un descuido y huye sin decir nada.
  - Opción «Quitarle las monedas» (decisión de codicia)
    - Resultado: Le quitas dos monedas. Huye hacia el campamento y alerta a otro goblin, que se prepara para luchar. [+2 oro; un enemigo más en el combate de «Campamento de los mineros»]
  - Opción «Dejarle huir»
    - Resultado: Dejas que escape. El goblin abandona la mina, así que tendrás un adversario menos más adelante. [un enemigo menos en el combate de «Campamento de los mineros»]

**Combate:** Merodeador goblin (Goblin Warrior). `z1_pat01`

**Escena: «Merodeadores del retorno»** `z1_pat01_paso` (tras el combate de «Cruce de los raíles»; puede salir al volver)

- **Narrador:** Un grupo de goblins distraídos discute por el botín. Todavía no han reparado en tu presencia.
- **Pregunta:** ¿Qué haces?
  - Opción «Luchar»
    - Resultado: Sacan las armas al verte. [combate: el combate de «Cruce de los raíles»]
  - Opción «Esquivarlos» (prueba de Destreza CD 12)
    - Éxito: Esperas tras la roca hasta que se alejan. [se evita el combate de «Cruce de los raíles»]
    - Fallo: Te descubren. [combate: el combate de «Cruce de los raíles»]
  - Opción «Espantarlos» (prueba de Carisma CD 12)
    - Éxito: Les haces creer que vienen refuerzos. Huyen por el túnel. [se evita el combate de «Cruce de los raíles»]
    - Fallo: No se lo tragan. [combate: el combate de «Cruce de los raíles»]

### Campamento de los mineros `z1_r05`

*Un campamento de trabajo ha quedado desierto tras la captura de los mineros. Todavía hay mantas y utensilios.*

**Descanso (largo): Campamento de los mineros.** La hoguera conserva brasas bajo la ceniza. El lugar está protegido y permite pasar aquí la noche.

**Combate:** Saqueador goblin (Goblin Warrior). `z1_e05`

**Cofre.** Contiene: Poción de curación.

**Escena: «El entibador superviviente»** `z1_ev01` (tras «Prisión de los excavadores»; puede salir al volver) — ilustración `escena_minero_agua_negra`

- **Narrador:** Un entibador de la mina llega herido al campamento. Ha escapado de los goblins y apenas puede caminar.
- **Pregunta:** ¿Cómo le ayudas?
  - Opción «Darle una poción de curación» (necesita Poción de curación)
    - Resultado: La poción le devuelve las fuerzas. Te entrega cinco monedas de sus ahorros antes de regresar al pueblo. [+5 oro; gasta: Poción de curación]
  - Opción «Vendarle y estabilizarle» (prueba de Sabiduría CD 11)
    - Éxito: Le vendes la herida. Agradecido, te da cinco monedas y emprende el regreso a Valdescarcha. [+5 oro]
    - Fallo: No consigues vendarle bien la herida, pero le ayudas a ponerse a salvo.

### Pozo de las profundidades `z1_r06`

*Una enorme cavidad natural desciende hacia el interior de la montaña. Una escalera conduce a construcciones antiguas cubiertas de símbolos enanos.*

**Combate:** Vigía goblin (Goblin Warrior), Rata de las profundidades (Giant Rat). `z1_e06`
  - Objetivo opcional: Que el vigía no baje al pozo a avisar: derribadlo antes del asalto 3.
  - Si falla: el enemigo «baja por el pozo a dar la alarma».
  - Si se cumple: El vigía no ha podido avisar a nadie. En su zurrón hay oro y una poción.
  - Consecuencia si se falla: El vigía ha dado la alarma: en la prisión de abajo os esperan con refuerzos.

**Cofre.** Contiene: Poción de curación.
  - Obstáculo «El pozo» (se pasa con: Cuerda): Un pozo vertical baja a la oscuridad. A media altura se ve un saliente con un arcón.
  - Sin la herramienta: Necesitaremos una cuerda para bajar. En la tienda del pueblo venden.
  - Al usarla: [el personaje] ata la cuerda al torno y baja hasta el saliente.

### Cámara de las poleas `z1_r07`

*Las cadenas de un montacargas desaparecen en el techo. Una plataforma de mineral se balancea sola sobre el suelo.*

**Diálogo al entrar:** `z1_d02`

- **Narrador:** Encuentras una advertencia grabada en la madera del montacargas.
- **Narrador:** Dice: «No os acerquéis al agua que brilla. Los goblins nos obligan a bajar».
- **Narrador:** Las últimas palabras están arañadas, como si alguien hubiera escrito con prisa.

**Diálogo al entrar (solo si Tiko va en el grupo):** `z1_d02b`

- **Tiko:** El montacargas se usó después del secuestro. Por aquí bajaron a los mineros.

**Escena: «Las maderas en tensión»** `z1_p02`

- **Narrador:** La plataforma del montacargas ha quedado atrapada entre maderas caídas. Sobre ella cuelga una bolsa de suministros, y el peso amenaza con hundir los apoyos.
- **Pregunta:** ¿Cómo recuperas la bolsa?
  - Opción «Levantar la madera y mirar debajo» (prueba de Fuerza CD 12)
    - Éxito: Levantas la madera y liberas la bolsa. Debajo había caído también el monedero de un minero. [+4 oro; objeto: Poción de curación]
    - Fallo: La madera cede y te obliga a retroceder. [daño 1d4]
  - Opción «Calcular cómo liberar los apoyos» (prueba de Inteligencia CD 11)
    - Éxito: Repartes el peso entre los apoyos y liberas la bolsa. [objeto: Poción de curación]
    - Fallo: La madera cede y te obliga a retroceder.
  - Opción «Alcanzar la bolsa entre las vigas» (prueba de Constitución CD 12)
    - Éxito: Alcanzas la bolsa sin mover las vigas. [objeto: Poción de curación]
    - Fallo: La madera cede y te obliga a retroceder. [daño 1d4]
  - Opción «Dejar que Brunna calce las vigas» (solo con Brunna)
    - Resultado: Brunna calza las vigas como en las galerías de su cuadrilla y saca la bolsa sin que cruja nada. [objeto: Poción de curación]
  - Si se marcha sin elegir: Al intentar retirar los escombros, se rompe tu bolsa. Pierdes cinco monedas y abandonas los suministros.

**Escena: «La galería derrumbada»** `z1_x01_p`

- **Narrador:** Un derrumbe reciente tapa la galería que lleva a la cámara de las poleas. Entre las piedras se cuela una corriente de aire: al otro lado hay espacio.
- **Pregunta:** ¿Cómo despejáis el paso?
  - Opción «Apartar las piedras grandes a pulso» (prueba de Fuerza CD 12)
    - Éxito: Las piedras ceden y ruedan a un lado. El paso queda libre. [cambia un elemento del mapa: z1_x01 → retirados]
    - Fallo: Las piedras no se mueven y os duelen los brazos.
  - Opción «Hacer palanca con la palanqueta» (necesita Palanqueta)
    - Resultado: La palanqueta suelta la piedra que sujetaba el resto. El derrumbe se viene abajo y deja libre el paso. [cambia un elemento del mapa: z1_x01 → retirados]
  - Opción «Retirar los cascotes uno a uno»
    - Resultado: Tras un buen rato de trabajo, el paso queda libre. Las piedras os dejan las manos en carne viva. [daño 1d4; cambia un elemento del mapa: z1_x01 → retirados]

### Pasadizo de las marcas `z1_r08`

*En las paredes, la tiza de los mineros se mezcla con flechas goblins que apuntan en sentido contrario.*

**Diálogo al entrar:** `z1_d05`

- **Narrador:** Unas flechas de tiza señalan la salida. Otras marcas recientes indican por dónde llevaron a los cautivos.
- **Narrador:** Una inscripción apresurada dice: «Nos llevan bajo la ciudad antigua. Avisad a Valdescarcha».

**Cofre.**

### Cámara del agua negra `z1_r09`

*Un manantial brota entre las rocas y desaparece por una fisura. Bajo la costra oscura del agua brilla un destello violeta.*

**Diálogo al entrar:** `z1_d08`

- **Narrador:** El agua devuelve un reflejo violáceo, aunque no hay ninguna luz sobre tu cabeza.
- **Héroe (personaje del jugador):** Esa luz violeta llega desde abajo. Quizá sea lo que busca Orvane.

**Combate:** Rata del agua negra (Giant Rat), Escorpión del agua negra (Scorpion). `z1_e09`

**Escena: «El minero en el agua negra»** `z1_q02` (tras el combate de «Cámara del agua negra») — ilustración `escena_minero_agua_negra`

- **Narrador:** Un minero enano exhausto, empapado por el agua negra, te tiende la mano y pide ayuda.
- **Pregunta:** ¿Cómo le ayudas?
  - Opción «Darle una poción de curación» (necesita Poción de curación)
    - Resultado: La poción le devuelve las fuerzas. Te explica dónde encontrar una antigua ruta de mantenimiento. [gasta: Poción de curación; descubre el secreto de «Almacén de herramientas»]
  - Opción «Guiarle entre las piedras» (prueba de Sabiduría CD 12)
    - Éxito: Ayudas al minero a salir del agua. Agradecido, te indica una antigua ruta de mantenimiento. [descubre el secreto de «Almacén de herramientas»]
    - Fallo: Intentas guiarle, pero resbala. Consigue salir del agua, exhausto, y se aleja sin poder hablar.

### Caseta del entibador (zona secreta) `z1_s01_r01`

*Un banco de trabajo junto a una pared con cinco marcas de altura infantil, hechas en años distintos.*

**Diálogo al entrar:** `z1_d04`

- **Narrador:** El entibador dejó una nota: «Orvane exige que sigamos excavando. No le importa que las galerías cedan».
- **Narrador:** La última línea advierte: «Sus goblins vigilan la bajada. No nos dejan cerrar el paso».

**Combate:** Escarabajo del banco (Giant Fire Beetle). `z1_e07`

**Cofre.** Contiene: Poción de curación.

### Sala de avisos (zona secreta) `z1_s02_r01`

*Un tablero con fichas de turnos y una campana rota que nadie llegó a tocar.*

**Diálogo al entrar:** `z1_d06`

- **Narrador:** Encuentras el tablero de avisos. Una orden exige tocar la campana si aparece una luz violeta bajo la mina.
- **Narrador:** La cuerda está cortada. Una nota goblin añade: «Orvane prohíbe dar la alarma».

**Combate:** Goblin rebuscador (Goblin Warrior), Murciélago del pozo (Bat). `z1_e08`

**Cofre.** Contiene: Poción de curación.

**Al salir de la zona por primera vez:** pantalla «La mina de Hondaroca superada» con el resumen (salas, enemigos, oro…).

## 3. Zona 2: Las ruinas enanas

*Descripción interna de la zona: Ruinas de una antigua ciudad enana bajo la mina. Los goblins han ocupado sus galerías para abrir camino a Orvane. Aquí se encuentra al primer aliado.*

### Al entrar en la zona

- **Narrador:** Bajo la mina encuentras una ciudad enana sepultada. Los goblins han abierto nuevos túneles entre sus ruinas.
- **Narrador:** Herramientas recientes y cadenas rotas demuestran que los mineros han pasado por aquí.
- **Héroe (personaje del jugador):** Orvane los está obligando a excavar cada vez más hondo. Tengo que seguirlos.


### Diario: pendientes de esta zona

Aparecen en el diario del jugador como cosas por resolver, y se tachan al resolverlas.

- El vigía del pozo dio la alarma: en la prisión os esperan con refuerzos. *(aparece en el combate del «Pozo de las profundidades», si el vigía escapa y da la alarma; se resuelve en el combate de «Prisión de los excavadores»)*
- Una reja bloquea el atajo de vuelta. Debe de haber un mecanismo para levantarla. *(aparece en «Vestíbulo de los canteros»; se resuelve en la palanca del «Patio de los hornos», que levanta la reja)*
- Los registros confirman que los mineros trabajan como prisioneros. Falta saber adónde los han trasladado. *(aparece en «Archivo de las cuadrillas»; se resuelve en «Registro de los cautivos»)*
- Las corrientes de aire podrían conducir a un puesto de vigilancia oculto. *(aparece en «Sala de los murciélagos»; se resuelve en el secreto de «Sala de los murciélagos»)*
- Los canteros enanos dejaron señales de un pequeño cofre escondido entre las ruinas. *(aparece en «Galería de los tributos»; se resuelve en el secreto de «Galería de los tributos»)*

### Vestíbulo de los canteros `z2_r01`

*Un vestíbulo enano con columnas robustas y relieves de antiguos mineros. Las marcas de los picos goblins destrozan parte de las inscripciones.*

**Diálogo al entrar:** `z2_d01`

- **Narrador:** Una reja antigua bloquea un corredor. Más allá hay una palanca que parece controlar el mecanismo.
- **Héroe (personaje del jugador):** No puedo alcanzarla desde aquí. Tendré que buscar otro camino.

**Escena: «La mercader del umbral»** `z2_ev01` (tras la palanca del «Patio de los hornos», que levanta la reja; puede salir al volver) — ilustración `pnj_buhonera`

- **Narrador:** Una mercader ambulante os ofrece pociones y antídotos. Asegura que aún regresa a Valdescarcha con sus mercancías.
- **Pregunta:** ¿Qué compráis?
  - Opción «Una poción de curación» (cuesta 20 oro)
    - Resultado: Pagáis veinte monedas. La mercader os entrega una poción de curación. [objeto: Poción de curación]
  - Opción «Un antídoto» (cuesta 15 oro)
    - Resultado: Pagáis quince monedas. La mercader os entrega un antídoto. [objeto: Antídoto]
  - Opción «Nada, gracias»
    - Resultado: La mercader os desea suerte y sigue preparando sus mercancías.

### Prisión de los excavadores `z2_r02`

*Una antigua cámara de almacenamiento ha sido transformada en prisión. Una figura pequeña permanece encadenada a una columna. La liberación del prisionero permite incorporar al primer aliado antes de cualquier combate de la zona.*

**Aliado que se une (versión normal):**

- **Narrador:** Un mediano encadenado os llama desde una antigua prisión.
- **Tiko:** ¡Soy Tiko Manosrápidas! Intenté sacar a un minero de aquí y los goblins me atraparon.
- **Tiko:** Entré buscando tesoros, pero no pienso abandonar a los cautivos. Liberadme y os ayudaré.

**Versión cuando Brunna ocupa su lugar:**

- **Narrador:** Una enana con casco de minero y un pico al hombro os llama desde una jaula.
- **Brunna:** Soy Brunna Piedrahonda, minera de Valdescarcha. Los goblins me apresaron mientras buscaba a mi cuadrilla.
- **Brunna:** Busco a un aprendiz desaparecido. Si me liberáis, os ayudaré a encontrar a los demás.

**Combate:** Jefe goblin de la prisión (Goblin Boss), Carcelero goblin (Goblin Warrior). `z2_e01`
  - Objetivo opcional: Salvad al preso: venced antes del asalto 4.
  - Si se cumple: Llegáis a tiempo: el preso os da una poción que escondía en la celda.

**Descanso (corto): Rincón resguardado.** Un hueco tranquilo donde recobrar el aliento; permite regresar a Valdescarcha.

**Cofre.** Contiene: Poción de curación.
  - Obstáculo «Celda cerrada» (se pasa con: Herramientas de ladrón, Palanqueta): Una celda cerrada con un candado oxidado. Dentro hay un fardo.
  - Sin la herramienta: El candado no cede a mano: harían falta herramientas de ladrón o una palanqueta.
  - Al usarla: [el personaje] fuerza el candado con [el objeto].

### Galería de las arañas `z2_r03`

*Una galería cubierta de telarañas atraviesa antiguas estatuas enanas. Los cuerpos de varios goblins cuelgan del techo. La oscuridad oculta una criatura peligrosa.*

**Aviso antes del combate:** Un hilo pegajoso os roza la cara. Más adelante, algo grande se mueve despacio entre las sombras del techo.

**Combate:** Tejedora de las ruinas (Giant Spider). `z2_e02`

**Trampa: Red de captura.** Una red de seda oculta entre las piedras se desprende del techo y atrapa al primero que pisa el pasillo. *(Efecto: El objetivo queda Restrained hasta escapar con una prueba de Fuerza o Destreza CD 12.)*

**Cofre.** Contiene: Antídoto.
  - Obstáculo «Telaraña» (se pasa con: Antorcha, Fuego de alquimista): Una telaraña gruesa tapa un hueco lateral. Detrás se adivinan los restos de un minero.
  - Sin la herramienta: Esta telaraña no se corta: habría que quemarla con una antorcha o con fuego de alquimista.
  - Al usarla: [el personaje] prende la telaraña con [el objeto] y arde en un momento.

### Sala de los murciélagos `z2_r04`

*Una sala abovedada contiene antiguos respiraderos. El techo está cubierto de murciélagos que reaccionan al ruido y a la luz.*

**Combate:** Enjambre de murciélagos (Swarm of Bats), Cazador goblin (Goblin Warrior). `z2_e03`
  - Objetivo opcional: Los cazadores disparan desde detrás del enjambre: que el primero en caer sea uno de ellos.
  - Si se cumple: Sin el primer tirador, los demás pierden el aplomo. Entre sus cosas hay una red de caza.

**Trampa: Placa de presión enana.** Una placa de piedra activa dardos ocultos en las paredes. *(Efecto: 1d6 perforante; mitad del daño con salvación exitosa.)*

**Descanso (corto): Alcoba de los canteros.** Una alcoba protegida por una puerta de piedra permite realizar un descanso corto una vez despejada la sala.

**Secreto:** Un respiradero enano conecta con un pasadizo que evita la cámara del capataz. *(abre «Puerta de la ciudad hundida»)*

**Escena: «La grieta de los murciélagos»** `z2_s01_pista`

- **Narrador:** Entre los arcos derruidos, los murciélagos esquivan una grieta de la escalinata. Quizá haya algo detrás.
- **Pregunta:** ¿Cómo lo buscáis?
  - Opción «Observar su vuelo junto a los arcos» (prueba de Sabiduría CD 12)
    - Éxito: El vuelo de los murciélagos os permite localizar un conducto hacia otra sala. [descubre el secreto de «Sala de los murciélagos»]
    - Fallo: No localizáis el origen de la corriente.
  - Opción «Examinar las juntas de la escalinata» (prueba de Inteligencia CD 13)
    - Éxito: Las juntas de la escalinata delatan un conducto hacia otra sala. [descubre el secreto de «Sala de los murciélagos»]
    - Fallo: No localizáis el origen de la corriente.

### Cámara del jefe goblin `z2_r05`

*La sala de mando de los goblins contiene listas de prisioneros y planos de excavación.*

**Combate:** Guardia del jefe goblin (Goblin Warrior). `z2_e04`

**Cofre.** Contiene: Martillo de guerra +1.

**Diálogo al entrar (solo si Tiko va en el grupo):** `z2_d07b`

- **Tiko:** El jefe goblin guardaba planos de las excavaciones. Orvane quería llegar todavía más abajo.

### Puerta de la ciudad hundida `z2_r06`

*Una puerta monumental enana permanece abierta. Más allá se extienden corredores silenciosos que conducen a una región funeraria.*

**Combate:** Excavadores goblin (Goblin Warrior), Arquero excavador (Goblin Warrior). `z2_e05`
  - Objetivo opcional: Que nadie del grupo caiga a 0 PG.
  - Si se cumple: Nadie ha caído: registráis la puerta con calma y encontráis una poción.

**Trampa: Martillo basculante.** Un mecanismo enano oculto acciona un enorme martillo de piedra al cruzar una losa. *(Efecto: 2d6 contundente; mitad del daño con salvación exitosa.)*

**Escena: «El brasero de las ruinas»** `z2_p03`

- **Narrador:** En una sala de arcos derruidos, varias monedas brillan junto a un brasero. El suelo agrietado amenaza con ceder.
- **Pregunta:** ¿Cómo recuperáis las monedas sin hundir el suelo?
  - Opción «Buscar un paso firme entre las grietas» (prueba de Sabiduría CD 13)
    - Éxito: Avanzáis sobre las losas firmes y recogéis las monedas sin mover los escombros. [+4 oro]
    - Fallo: Una losa se hunde y os golpeáis al retroceder. [daño 1d4]
  - Opción «Examinar los apoyos de los arcos» (prueba de Inteligencia CD 12)
    - Éxito: Identificáis las piedras que soportan la bóveda y recuperáis las monedas. [+4 oro]
    - Fallo: Un cascote cae cerca y os obliga a retroceder.
  - Si se marcha sin elegir: Los escombros cubren las monedas. Decidís no arriesgaros más.

### Galería de los tributos `z2_r07`

*Una galería enana conduce a la cripta. Un jefe goblin vigila el paso y un cofre permanece oculto.*

**Aviso antes del combate:** Más adelante oís una voz ronca que da órdenes en lengua goblin y el roce de una cimitarra contra la piedra.

**Combate:** Jefe goblin de la salida (Goblin Boss). `z2_e06`

**Secreto:** Un pequeño cofre de tributos permanece escondido entre las antiguas piedras de la ciudad. *(abre el cofre de «Galería de los tributos»)*

**Cofre.** Contiene: Estuche de curandero.

**Escena: «El tesoro de los canteros»** `z2_s02_pista`

- **Narrador:** Una inscripción entre los arcos indica que los canteros guardaban aquí una pequeña reserva para tiempos difíciles.
- **Pregunta:** ¿Cómo buscáis el escondite?
  - Opción «Seguir las marcas de los canteros» (prueba de Sabiduría CD 13)
    - Éxito: Las marcas os llevan hasta el escondite de un cofre antiguo. [descubre el secreto de «Galería de los tributos»]
    - Fallo: No dais con ello por ahí.
  - Opción «Comparar las piedras de los arcos» (prueba de Inteligencia CD 12)
    - Éxito: Descubrís una pequeña cavidad donde se oculta el cofre de los canteros. [descubre el secreto de «Galería de los tributos»]
    - Fallo: No dais con ello por ahí.

### Corredor de las balanzas `z2_r08`

*Dos balanzas gigantes vigilan un pasillo donde se pesaba el mineral.*

**Diálogo al entrar:** `z2_d03`

- **Narrador:** Las balanzas aún tienen las cuentas de las cuadrillas. Alguien ha añadido nombres de mineros de Valdescarcha.
- **Héroe (personaje del jugador):** Orvane ha convertido esta ciudad en una prisión y una zona de trabajos forzados.

**Escena: «El registro del excavador»** `z2_q01` — ilustración `escena_registro_excavador`

- **Narrador:** Un excavador goblin aprieta un libro contra el pecho y os mira con desconfianza. Parece dispuesto a negociar.
- **Pregunta:** ¿Cómo conseguís el registro?
  - Opción «Negociar su entrega» (prueba de Carisma CD 12)
    - Éxito: El goblin os entrega el libro. Contiene la ubicación de un conducto que permite avanzar entre las ruinas. [descubre el secreto de «Sala de los murciélagos»]
    - Fallo: El goblin os cobra diez monedas por mostrar una página. Después huye con el libro. [+-10 oro]
  - Opción «Arrebatarle el libro y la bolsa» (prueba de Destreza CD 13, decisión de dureza)
    - Éxito: Le quitáis el libro y la bolsa del cinto. El registro marca un conducto oculto. [+8 oro; descubre el secreto de «Sala de los murciélagos»]
    - Fallo: El goblin escapa dando voces. Sus compañeros estarán prevenidos. [un enemigo más en el combate de «Cámara del jefe goblin»]
  - Opción «Dejarle y seguir»
    - Resultado: El goblin desaparece entre las balanzas.
  - Opción «Dejar que Tiko le hable en su idioma» (solo con Tiko)
    - Resultado: Tiko regatea con el goblin entre risas y le cambia el libro por una baratija. El registro marca un conducto oculto. [descubre el secreto de «Sala de los murciélagos»]

**Combate:** Vigilante goblin (Goblin Warrior). `z2_pat01`

**Escena: «Vigilantes de la ciudad»** `z2_pat01_paso` (tras «Galería de los tributos»; puede salir al volver)

- **Narrador:** Unos vigilantes goblins inspeccionan su botín, distraídos por una discusión.
- **Pregunta:** ¿Qué hacéis?
  - Opción «Luchar»
    - Resultado: Se interponen y llaman a gritos a sus compañeros. [combate: el combate de «Corredor de las balanzas»]
  - Opción «Esquivarlos» (prueba de Destreza CD 13)
    - Éxito: Os ocultáis tras los contrapesos hasta que se van. [se evita el combate de «Corredor de las balanzas»]
    - Fallo: Os descubren. [combate: el combate de «Corredor de las balanzas»]
  - Opción «Espantarlos» (prueba de Carisma CD 13)
    - Éxito: Les decís que el capataz ya no puede protegerles. Huyen. [se evita el combate de «Corredor de las balanzas»]
    - Fallo: No se lo tragan. [combate: el combate de «Corredor de las balanzas»]

### Archivo de las cuadrillas `z2_r09`

*Hileras de tablillas de piedra con nombres y turnos. Varias han sido arrancadas con violencia.*

**Diálogo al entrar:** `z2_d06`

- **Narrador:** En las tablillas aparecen nombres recientes, escritos sobre los registros enanos.
- **Héroe (personaje del jugador):** Son los mineros de Valdescarcha. Los han separado en grupos para excavar hacia la cripta.

**Diálogo al entrar (solo si Brunna va en el grupo):** `z2_d06b`

- **Brunna:** Aquí hay nombres de mi cuadrilla. Busco a un aprendiz cuya ficha de cobre aún conservo.

**Cofre.**

### Patio de los hornos `z2_r10`

*Un patio con tres hornos de fundición, dos apagados y uno aún encendido. Tras uno de ellos está la palanca de la reja del vestíbulo.*

**Combate:** Goblin de los hornos (Goblin Warrior). `z2_e08`

**Escena: «La rendición en los hornos»** `z2_q02` — ilustración `escena_rendicion_hornos`

- **Narrador:** Unos goblins sueltan las armas y levantan las manos ante vosotros. Aseguran que no quieren seguir luchando.
- **Pregunta:** ¿Qué hacéis con los goblins rendidos?
  - Opción «Aceptar su rendición» (decisión de piedad)
    - Resultado: Se van sin mirar atrás. [se evita el combate de «Patio de los hornos»]
  - Opción «Exigirles el botín» (prueba de Carisma CD 12, decisión de codicia)
    - Éxito: Os dan una bolsa y se marchan. [+5 oro; se evita el combate de «Patio de los hornos»]
    - Fallo: Se miran, recogen las armas y atacan. [combate: el combate de «Patio de los hornos»]
  - Opción «Cerrarles el paso» (decisión de dureza)
    - Resultado: Les cerráis la salida. Piden auxilio y otro goblin acude; todos se disponen a luchar. [combate: el combate de «Patio de los hornos»; un enemigo más en el combate de «Patio de los hornos»]

**Palanca: Reja de los turnos.**

- **Narrador:** Accionáis la palanca del patio. La vieja reja comienza a subir.
- **Héroe (personaje del jugador):** Es la reja que vimos al entrar. Ahora tenemos un atajo de regreso.
- La reja del vestíbulo queda abierta: ahora hay un atajo entre este patio y la entrada de las ruinas.

### Puesto del vigía (zona secreta) `z2_s01_r01`

*Una mesa orientada hacia el conducto y un cuaderno abierto por su última página.*

**Diálogo al entrar:** `z2_d05`

- **Narrador:** Un cuaderno recoge los últimos turnos de los vigilantes enanos.
- **Narrador:** Su última orden dice: «El rey Aldric ha cerrado el camino a la cripta. Nadie debe llegar al cristal».

**Diálogo al entrar (solo si Brunna va en el grupo):** `z2_d05b`

- **Brunna:** Los canteros no dejaban un puesto sin entregar el relevo. Algo interrumpió aquel turno.

**Combate:** Goblin escondido (Goblin Warrior). `z2_e07`

**Cofre.** Contiene: Poción de curación.

### Sala de los juramentos (zona secreta) `z2_s02_r01`

*Un círculo de taburetes rodea un pedestal con juramentos de canteros escritos en tablillas.*

**Diálogo al entrar:** `z2_d10`

- **Narrador:** Las tablillas explican que los canteros obedecieron al rey Aldric y sellaron los accesos más profundos.
- **Narrador:** La última advertencia dice: «Bajo la cripta hay un cristal peligroso. No rompáis los cierres».

**Combate:** Centinela de los juramentos (Skeleton). `z2_e09`

**Cofre.** Contiene: Veneno básico.

**Al salir de la zona por primera vez:** pantalla «Las ruinas enanas superada» con el resumen (salas, enemigos, oro…).

## 4. Zona 3: La cripta real de Aldric el Olvidado

*Descripción interna de la zona: Una antigua cripta enana custodia el camino hacia el monasterio. Orvane ha profanado las tumbas para franquear el cierre de Aldric. Aquí se incorpora el segundo aliado.*

### Al entrar en la zona

- **Narrador:** Descendéis hasta la cripta del rey Aldric. Los enanos la construyeron para vigilar el acceso al monasterio.
- **Narrador:** Hay sarcófagos abiertos y huellas recientes. Orvane ha perturbado a los muertos durante sus excavaciones.
- **Héroe (personaje del jugador):** Aldric encerró algo peligroso bajo estas tumbas. Tenemos que impedir que Orvane lo libere.

- **Tiko** (comentario al llegar, si va en el grupo): Una cripta. Aquí no se roba, ¿eh? Por si acaso me quedo con las manos en los bolsillos.

### Diario: pendientes de esta zona

Aparecen en el diario del jugador como cosas por resolver, y se tachan al resolverlas.

- Un relieve muestra a Aldric cerrando el paso hacia las profundidades. Falta descubrir qué quería proteger. *(aparece en «Umbral de los reyes»; se resuelve en «Antesala de las inscripciones»)*
- Un documento explica que Aldric ocultó su nombre. Hay que comprobar si su sepulcro sigue intacto. *(aparece en «Cámara de los nombres perdidos»; se resuelve en «Sepulcro de Aldric»)*
- Una lápida parece ocultar una antigua estancia de escribas. *(aparece en «Cámara de las ofrendas»; se resuelve en el secreto de «Cámara de las ofrendas»)*
- Un hueco en el pedestal del sepulcro podría guardar el último tributo del rey. *(aparece en «Sepulcro de Aldric»; se resuelve en el secreto de «Sepulcro de Aldric»)*

### Elementos del mapa

- **Puerta de las cenizas**: (bloqueada) La puerta de bronce sigue cerrada con cerrojo. / (abierta) Cruzáis la puerta de bronce.
  - Al cambiar: Empujáis la puerta de bronce, que se abre chirriando.

### Umbral de los reyes `z3_r01`

*Una escalera conduce a una cámara funeraria cubierta de niebla. Dos estatuas de guerreros enanos custodian una inscripción que prohíbe perturbar el descanso real.*

**Diálogo al entrar:** `z3_d01`

- **Narrador:** Una inscripción cuenta que Aldric ordenó cerrar el acceso al monasterio para proteger su reino.
- **Héroe (personaje del jugador):** El rey no guardaba un tesoro. Intentaba que nadie encontrase algo peligroso.

### Capilla de los antepasados `z3_r02`

*Una pequeña capilla conserva un altar enano y restos de velas. Un superviviente protege la entrada a las cámaras interiores. El aliado se incorpora antes de que el grupo encuentre enemigos.*

**Aliado que se une (versión normal):**

- **Narrador:** Un clérigo anciano, con un farol y una maza, protege la entrada a las tumbas.
- **Hermano Edmund:** Soy el hermano Edmund. Mi orden recibió el encargo de custodiar esta cripta cuando murieron sus guardianes enanos.
- **Hermano Edmund:** Orvane ha despertado a los muertos para llegar al monasterio. Os acompañaré para detenerlo.

**Versión cuando Brunna ocupa su lugar:**

- **Narrador:** Una enana con casco de minero aparece herida entre los sarcófagos.
- **Brunna:** Soy Brunna Piedrahonda. He seguido a los goblins hasta aquí, pero los muertos me impidieron avanzar.
- **Brunna:** Busco a los mineros desaparecidos. Si me ayudáis a salir de la cripta, lucharé a vuestro lado.

**Descanso (corto): Rincón resguardado.** Un hueco tranquilo donde recobrar el aliento; permite regresar a Valdescarcha.

**Cofre.** Contiene: Frasco de aceite.
  - Obstáculo «Espíritu inquieto» (se pasa con: Agua bendita): Un espíritu inquieto vela el altar y no os deja acercaros a las ofrendas.
  - Sin la herramienta: Con agua bendita podríamos darle descanso. En la tienda del pueblo venden.
  - Al usarla: [el personaje] rocía el altar con agua bendita y el espíritu descansa por fin.

### Sala de los guardianes `z3_r03`

*Una cámara de piedra contiene sarcófagos abiertos. Los esqueletos de antiguos soldados se levantan cuando el grupo se acerca.*

**Combate:** Guardianes esqueléticos (Skeleton). `z3_e01`

### Galería de las tumbas `z3_r04`

*Un largo corredor contiene nichos funerarios a ambos lados. La niebla oculta parcialmente los cuerpos que yacen entre las tumbas.*

**Combate:** Antiguos sepultureros (Zombie). `z3_e02`

**Trampa: Losa funeraria.** Una losa oculta activa un mecanismo que lanza fragmentos de piedra desde las paredes. *(Efecto: 2d6 contundente; mitad del daño con salvación exitosa.)*

**Diálogo al entrar (solo si Hermano Edmund va en el grupo):** `z3_d04b`

- **Hermano Edmund:** No todos estos muertos eligieron levantarse. Hay que devolverles el silencio.

**Escena: «La losa de los nombres»** `z3_p02`

- **Narrador:** Bajo una losa con nombres grabados hay una ofrenda olvidada. Recuperarla sin dañarla requiere paciencia.
- **Pregunta:** ¿Cómo recuperáis lo que hay debajo?
  - Opción «Apartar todas las piedras» (prueba de Fuerza CD 14)
    - Éxito: Apartáis toda la losa: además de la ofrenda aparece un segundo cofrecillo funerario. [+14 oro]
    - Fallo: Las piedras se os vienen encima. [daño 1d4]
  - Opción «Alcanzar la ofrenda entre las grietas» (prueba de Destreza CD 14)
    - Éxito: Recuperáis las piezas funerarias sin mover toda la piedra. [+7 oro]
    - Fallo: Los escombros se desplazan y ocultan la ofrenda.
  - Opción «Buscar las piedras inestables» (prueba de Sabiduría CD 13)
    - Éxito: Apartáis con cuidado las piedras inestables y recuperáis las piezas de oro. [+7 oro]
    - Fallo: Una piedra rueda y la ofrenda se pierde entre las grietas.
  - Opción «Dejar que Brunna lea la piedra» (solo con Brunna)
    - Resultado: Brunna golpea las losas con el mango del pico y aparta la que cede sin derrumbar las demás. Recuperáis las piezas de oro. [+7 oro]
  - Si se marcha sin elegir: La ofrenda se pierde. El camino principal sigue libre.

### Cámara de las ofrendas `z3_r05`

*Las paredes están decoradas con escenas de la coronación de Aldric. Un sarcófago secundario contiene ofrendas de oro. Los muertos protegen el lugar.*

**Combate:** Necrófago de las ofrendas (Ghoul), Guardianes de las ofrendas (Skeleton). `z3_e03`
  - Objetivo opcional: Las garras del necrófago paralizan: que sea el primero en caer.
  - Si se cumple: El necrófago cae antes de paralizar a nadie más. Junto a las ofrendas queda un frasco de agua bendita.

**Secreto:** Un acceso lateral, disimulado entre las tumbas, comunica con el antiguo sepulcro del rey. *(abre «Sepulcro de Aldric»)*

**Cofre.** Contiene: Pergamino de escudo.
  - Obstáculo «Sarcófago sellado» (se pasa con: Palanqueta): Un sarcófago sellado con una losa pesada.
  - Sin la herramienta: Con una palanqueta moveríamos la losa. En la tienda del pueblo venden.
  - Al usarla: [el personaje] apalanca la losa y la desliza a un lado.
  - Alternativa «Fuerza»: [el personaje] intenta mover la losa a pulso. / si sale mal: La losa resbala y aplasta la mano de [el personaje]

**Diálogo al entrar (solo si Hermano Edmund va en el grupo):** `z3_d06b`

- **Hermano Edmund:** Estas ofrendas no son un botín abandonado. Alguien las dejó para que una historia no se perdiera.

**Escena: «Los trazos funerarios»** `z3_s01_pista`

- **Narrador:** Unas marcas de los canteros parecen señalar una antigua entrada secundaria a la cámara real.
- **Pregunta:** ¿Cómo lo buscáis?
  - Opción «Buscar aire bajo los arcos» (prueba de Sabiduría CD 13)
    - Éxito: Encontráis una antigua entrada lateral que comunica con otra cámara de la cripta. [descubre el secreto de «Cámara de las ofrendas»]
    - Fallo: No lográis seguir la pista.
  - Opción «Comparar los trazos de la piedra» (prueba de Inteligencia CD 14)
    - Éxito: Descifráis las marcas y descubrís una entrada secundaria a la cámara real. [descubre el secreto de «Cámara de las ofrendas»]
    - Fallo: No lográis seguir la pista.

### Galería de los centinelas `z3_r06`

*Tres figuras esqueléticas custodian el último corredor antes del sepulcro real. Las paredes muestran escenas de antiguas batallas.*

**Combate:** Centinelas de Aldric (Skeleton). `z3_e04`
  - Objetivo opcional: Venced antes del asalto 4, antes de que se cierre la losa de la cámara sellada.
  - Si se cumple: La losa sigue abierta: dentro hay oro y un frasco de agua bendita.

**Trampa: Lanza del sepulcro.** Un mecanismo funerario dispara una lanza desde una estatua cuando se pisa una baldosa marcada. *(Efecto: 2d6 perforante; mitad del daño con salvación exitosa.)*

### Sepulcro de Aldric `z3_r07`

*Una enorme cámara contiene el sarcófago real. La niebla gira alrededor de la tumba, donde una presencia maligna custodia el acceso al monasterio.*

**Combate:** Necrófago custodio (Ghoul), Muertos del sarcófago (Zombie). `z3_e05`
  - Objetivo opcional: Que nadie del grupo caiga a 0 PG ante el sepulcro.
  - Si se cumple: Seguís todos en pie. Bajo el sarcófago hay oro y una poción.

**Descanso (corto): Vigilia del rey.** La presencia sagrada del sepulcro permite un descanso corto cuando la cámara está despejada.

**Secreto:** Tras el pedestal real se encuentra una cavidad con un último tributo funerario. *(abre el cofre de «Sepulcro de Aldric»)*

**Cofre.** Contiene: Poción de curación mayor.

**Diálogo al entrar (solo si Hermano Edmund va en el grupo):** `z3_d10b`

- **Hermano Edmund:** Aldric no quería que lo recordaran como un gran rey. Quería impedir que usaran el cristal.

**Escena: «Las losas removidas»** `z3_s02_pista`

- **Narrador:** Bajo un arco funerario, el polvo de las losas está removido. Una corriente fría cruza el suelo.
- **Pregunta:** ¿Cómo lo buscáis?
  - Opción «Seguir el aire bajo el arco» (prueba de Sabiduría CD 14)
    - Éxito: Las juntas removidas delatan dónde se oculta un cofre funerario bajo el arco. [descubre el secreto de «Sepulcro de Aldric»]
    - Fallo: El frío y el polvo os impiden localizarlo.
  - Opción «Examinar las juntas de las losas» (prueba de Inteligencia CD 14)
    - Éxito: Las juntas removidas delatan dónde se oculta un cofre funerario bajo el arco. [descubre el secreto de «Sepulcro de Aldric»]
    - Fallo: El frío y el polvo os impiden localizarlo.

### Cámara de las cenizas `z3_r08`

*Urnas de piedra apiladas bajo nichos vacíos. La ceniza del suelo se mueve hacia una rendija.*

**Diálogo al entrar:** `z3_d03`

- **Narrador:** Sobre un atril de piedra hay una lista de los guardianes que sellaron el acceso al monasterio.
- **Héroe (personaje del jugador):** Todos juraron impedir que alguien alcanzara el cristal. Por eso custodian este lugar.

**Escena: «El aire de los antiguos»** `z3_p01`

- **Narrador:** Entre los arcos de la cripta circula aire gélido. Una ofrenda ha quedado en una grieta al pie del muro.
- **Pregunta:** ¿Cómo examináis el escondrijo?
  - Opción «Contener el aliento junto al muro» (prueba de Constitución CD 13)
    - Éxito: Al abrigo del arco recuperáis la ofrenda de la grieta. [+5 oro; objeto: Agua bendita]
    - Fallo: El aire helado os obliga a retroceder. [daño 1d4]
  - Opción «Esperar al abrigo de un arco» (prueba de Sabiduría CD 13)
    - Éxito: Al abrigo del arco recuperáis la ofrenda de la grieta. [+5 oro; objeto: Agua bendita]
    - Fallo: El aire helado os obliga a retroceder.
  - Opción «Estudiar las grietas de la piedra» (prueba de Inteligencia CD 14)
    - Éxito: Al abrigo del arco recuperáis la ofrenda de la grieta. [+5 oro; objeto: Agua bendita]
    - Fallo: El aire helado os obliga a retroceder.
  - Si se marcha sin elegir: No conseguís recuperar lo que buscabais y os retiráis.

**Escena: «La puerta de las cenizas»** `z3_x01_p`

- **Narrador:** Una puerta de bronce cierra la cámara de las cenizas. El cerrojo está verde de óxido, pero aún aguanta.
- **Pregunta:** ¿Cómo la abrís?
  - Opción «Forzar el cerrojo» (prueba de Destreza CD 13)
    - Éxito: El cerrojo salta con un chasquido. Ya solo queda empujar la puerta. [cambia un elemento del mapa: z3_x01 → desbloqueada]
    - Fallo: El cerrojo no cede.
  - Opción «Abrir el cerrojo con las herramientas de ladrón» (necesita Herramientas de ladrón)
    - Resultado: Las herramientas encuentran el mecanismo y el cerrojo se suelta. Ya solo queda empujar la puerta. [cambia un elemento del mapa: z3_x01 → desbloqueada]
  - Opción «Embestir la puerta con el hombro» (prueba de Fuerza CD 14)
    - Éxito: La puerta cede de golpe y se abre de par en par. [cambia un elemento del mapa: z3_x01 → abierta]
    - Fallo: La puerta resiste y el golpe os deja dolorido el hombro. [daño 1d4]

### Cámara de los nombres perdidos `z3_r09`

*Lápidas sin sarcófago. Sus nombres se guardaron en cajas; una de ellas está abierta y vacía.*

**Diálogo al entrar:** `z3_d05`

- **Narrador:** Un registro nombra a los guardianes, pero omite al rey que dio la orden.
- **Héroe (personaje del jugador):** Aldric quiso borrar su nombre de los documentos. Tal vez así evitara que buscaran su tumba.

**Combate:** Guardián de los nombres (Skeleton). `z3_e06`

**Escena: «El escriba de los nombres»** `z3_q01` — ilustración `escena_escriba_nombres`

- **Narrador:** Un escriba fantasmal señala una caja de pergaminos junto a unas lápidas sin nombre. Parece pedir que los respetéis.
- **Pregunta:** ¿Cómo respondéis al escriba?
  - Opción «Prometer conservar los nombres» (prueba de Carisma CD 13, decisión de piedad)
    - Éxito: El escriba acepta vuestra promesa y os bendice. Os muestra una antigua entrada lateral hacia el sepulcro real. [descubre el secreto de «Cámara de las ofrendas»]
    - Fallo: El escriba se desvanece sin creeros.
  - Opción «Dejar 15 monedas de tributo» (cuesta 15 oro)
    - Resultado: Dejáis quince monedas de tributo. El escriba os muestra una entrada secundaria hacia el sepulcro real. [descubre el secreto de «Cámara de las ofrendas»]
  - Opción «Despreciar los pergaminos» (decisión de dureza)
    - Resultado: El escriba se retira. Unos guardianes surgen entre las lápidas. [combate: el combate de «Cámara de los nombres perdidos»; un enemigo más en el combate de «Cámara de los nombres perdidos»]
  - Opción «Dejar que Edmund rece por los nombres» (solo con Hermano Edmund)
    - Resultado: El hermano Edmund recita la oración de su orden. El escriba inclina la cabeza y os muestra una entrada lateral hacia el sepulcro real. [descubre el secreto de «Cámara de las ofrendas»]

### Antesala de las inscripciones `z3_r10`

*Estatuas de guardianes sin rostro flanquean las paredes. En la piedra se conserva la última orden de Aldric.*

**Diálogo al entrar:** `z3_d09`

- **Narrador:** Una inscripción dice: «Encerrad el cristal bajo el agua y la piedra. Que nadie vuelva a utilizar su poder».
- **Héroe (personaje del jugador):** Orvane ha venido precisamente a romper la prohibición de Aldric.

**Escena: «La estatua sin rostro»** `z3_q02` — ilustración `escena_estatua_sin_rostro`

- **Narrador:** Una estatua de guardián tiene el rostro borrado a cincel. Frente a ella hay una puerta entreabierta y un cuenco de bronce.
- **Pregunta:** ¿Cómo mostráis respeto ante la estatua?
  - Opción «Jurar que protegeréis el cristal» (prueba de Carisma CD 14)
    - Éxito: Al pronunciar el juramento, descubrís una inscripción que señala un tributo funerario escondido. [descubre el secreto de «Sepulcro de Aldric»]
    - Fallo: La estatua permanece inmóvil. No encontráis ninguna pista.
  - Opción «Dejar 10 monedas en el cuenco» (cuesta 10 oro)
    - Resultado: Dejáis diez monedas en el cuenco. Bajo su base aparece una pista sobre un cofre funerario oculto. [descubre el secreto de «Sepulcro de Aldric»]
  - Opción «Guardar silencio»
    - Resultado: Seguís adelante sin decir nada.

**Cofre.** Contiene: Poción de crecimiento.

### Escribanía sellada (zona secreta) `z3_s01_r01`

*Un escritorio guarda el borrador de una declaración real que nunca se hizo pública.*

**Diálogo al entrar:** `z3_d07`

- **Narrador:** Un documento explica que los monjes del monasterio encerraron un cristal capaz de liberar una enorme fuerza mágica.
- **Narrador:** Aldric ordenó sellar el camino. Quería impedir que alguien usara el cristal para dominar el valle.

**Combate:** Copista muerto (Zombie). `z3_e07`

**Cofre.** Contiene: Poción de curación mayor.

### Guardia sin relevo (zona secreta) `z3_s02_r01`

*Un casco y un escudo ante un asiento de piedra. Bajo el asiento, la lista de las guardias tras la muerte de Aldric.*

**Diálogo al entrar:** `z3_d11`

- **Narrador:** El libro de guardias confirma que Aldric ordenó ocultar incluso su nombre. Así nadie buscaría el camino al cristal.
- **Héroe (personaje del jugador):** Con el tiempo olvidaron el motivo del cierre. Solo los guardianes siguieron cumpliendo su deber.

**Combate:** Último custodio (Skeleton). `z3_e08`

**Cofre.** Contiene: Poción de curación mayor.

**Al salir de la zona por primera vez:** pantalla «La cripta real de Aldric el Olvidado superada» con el resumen (salas, enemigos, oro…).

## 5. Zona 4: El monasterio hundido

*Descripción interna de la zona: El monasterio inundado oculta el cristal que Aldric mandó encerrar. Los monjes lo mantuvieron bajo el agua para contener su energía. Ahora Orvane intenta controlarlo con ayuda de sus cultistas.*

### Al entrar en la zona

- **Narrador:** Llegáis a un monasterio medio sumergido. Los cristales violetas iluminan las aguas oscuras.
- **Narrador:** Los monjes inundaron este lugar para contener el poder de un cristal. Orvane ha comenzado a romper sus protecciones.
- **Narrador:** La voz de Orvane resuena desde las profundidades: «No podréis detenerme. El cristal será mío».

- **Tiko** (comentario al llegar, si va en el grupo): Esa luz violeta… Es la misma que vi desde la prisión. Estamos cerca.
- **Hermano Edmund** (comentario al llegar, si va en el grupo): El monasterio de los monjes. Aldric dio su nombre para que nadie llegara hasta aquí.

### Diario: pendientes de esta zona

Aparecen en el diario del jugador como cosas por resolver, y se tachan al resolverlas.

- Un registro revela que algunos mineros siguen encerrados tras la cámara de estudio. Debéis liberarlos cuando sea seguro. *(aparece en «Cámara de estudio»; se resuelve en el combate de «Cámara del poder prohibido»)*
- En el laboratorio hay pistas sobre un escondite de los monjes. Quizá contenga sus últimas instrucciones. *(aparece en «Laboratorio de los cristales»; se resuelve en el secreto de «Laboratorio de los cristales»)*
- Orvane está rompiendo las protecciones que mantienen controlada la energía del cristal. *(aparece en «Laboratorio de los cristales»; se resuelve en «Sala de los sellos rotos»)*
- Un antiguo símbolo de Umbría responde a la magia de un amuleto de corteza. *(aparece en «Santuario de la fuente»; se resuelve en la zona secreta «Depósito del vínculo»)*

### Elementos del mapa

- **Sello de la sala de los sellos**: (activa) Una barrera de luz violeta cierra el paso. Late al ritmo de los cánticos de la cámara de estudio.
  - Al cambiar: Al caer los devotos de la cámara de estudio, la barrera violeta que cerraba la sala de los sellos se apaga.

### Atrio de las aguas `z4_r01`

*El atrio está cubierto por una fina capa de agua. Columnas rotas emergen del suelo y una luz violácea se filtra desde las cámaras interiores.*

**Cofre.** Contiene: Poción de resistencia (fuego).
  - Obstáculo «El islote» (se pasa con: Cuerda): Un islote en medio del agua profunda, con un cofre medio hundido.
  - Sin la herramienta: Con una cuerda cruzaríamos sin mojarnos. En la tienda del pueblo venden.
  - Al usarla: [el personaje] lanza la cuerda a una columna y cruzáis agarrados a ella.
  - Alternativa «Atletismo»: [el personaje] intenta cruzar a nado. / si sale mal: La corriente arrastra a [el personaje] contra las piedras

### Claustro de los iniciados `z4_r02`

*Un claustro inundado conserva restos de bancos y atriles. Una figura permanece oculta entre los restos de una estancia lateral. El aliado se incorpora antes de cualquier combate de la zona.*

**Aliado que se une (versión normal):**

- **Narrador:** Una elfa joven, con un libro y un bastón de cristal apagado, sale de su escondite.
- **Liss:** Soy Liss. Fui aprendiz de Orvane y le ayudé a estudiar estos cristales. No sabía lo que pretendía.
- **Liss:** Tardé demasiado en actuar. Ahora conozco sus defensas y quiero ayudaros a liberar a los mineros.

**Versión cuando Brunna ocupa su lugar:**

- **Narrador:** Una enana empapada sale de un conducto. Lleva un casco de minero y un pico al hombro.
- **Brunna:** Soy Brunna Piedrahonda. Escapé de los cultistas mientras buscaba a los mineros desaparecidos.
- **Brunna:** Orvane los tiene encerrados aquí abajo. Quiero liberarlos y acabar con sus planes.

### Laboratorio de los cristales `z4_r03`

*Una cámara de investigación contiene mesas de piedra, recipientes rotos y cristales que flotan sobre pedestales. Los cultistas vigilan la estancia.*

**Aviso antes del combate:** Tras el paso llega un murmullo de cánticos y un olor a aceite quemado. Alguien vigila esa cámara.

**Combate:** Acólitos de Orvane (Cultist), Acólito arquero (Cultist). `z4_e01`
  - Objetivo opcional: El arquero apunta a los vuestros desde atrás: que sea el primero en caer.
  - Si se cumple: El arquero cae el primero. En su bandolera hay un frasco de fuego de alquimista.

**Trampa: Runa de descarga.** Una runa bajo el agua libera una descarga eléctrica cuando alguien pisa su centro. *(Efecto: 2d6 de daño de relámpago; mitad del daño con salvación exitosa.)*

**Secreto:** Un pequeño cofre de los monjes permanece oculto entre cristales sin luz. *(abre el cofre de «Laboratorio de los cristales»)*

**Cofre.** Contiene: Pergamino de escudo.

**Descanso (corto): Cámara de los cristales.** Una barrera arcana mantiene a raya a las criaturas del monasterio. Permite realizar un descanso corto cuando la sala está despejada.

**Cofre.** Contiene: Poción de curación mayor.
  - Obstáculo «Vapores venenosos» (se pasa con: Antídoto, Poción de resistencia (veneno)): Unos vapores venenosos salen de una grieta junto a una vitrina de cristales.
  - Sin la herramienta: Sin un antídoto o una poción de resistencia al veneno no podemos acercarnos.
  - Al usarla: [el personaje] bebe [el objeto] y se acerca a la vitrina entre los vapores.

**Diálogo al entrar (solo si Liss va en el grupo):** `z4_d05b`

- **Liss:** Esas placas son mías. Orvane las cambió para extraer energía del cristal. Debemos detenerlo.

**Escena: «El cristal opaco»** `z4_s01_pista`

- **Narrador:** Entre los destellos violetas destaca un cristal apagado. Parece ocultar algo bajo una capa de polvo.
- **Pregunta:** ¿Cómo seguís la pista?
  - Opción «Escuchar junto al cristal apagado» (prueba de Sabiduría CD 14)
    - Éxito: Un eco hueco os ayuda a encontrar un cofre escondido entre las ruinas. [descubre el secreto de «Laboratorio de los cristales»]
    - Fallo: El chapoteo os impide distinguir el eco.
  - Opción «Comparar los reflejos de los cristales» (prueba de Inteligencia CD 14)
    - Éxito: Los reflejos delatan el lugar donde los monjes escondieron un cofre. [descubre el secreto de «Laboratorio de los cristales»]
    - Fallo: Los reflejos se confunden en el agua.
  - Opción «Dejar que Liss lea el cristal» (solo con Liss)
    - Resultado: Liss reconoce el cristal: Orvane escondía aquí sus reservas. Sabe dónde está el cofre. [descubre el secreto de «Laboratorio de los cristales»]

**Combate:** Recolector del cristal (Cultist). `z4_pat01`

**Escena: «Recolectores del cristal»** `z4_pat01_paso` (tras el combate de «Laboratorio de los cristales»; antes de el combate de «Cámara del poder prohibido»; puede salir al volver)

- **Narrador:** Unos cultistas recogen energía de los cristales para Orvane. Todavía no han dado la alarma.
- **Pregunta:** ¿Qué hacéis?
  - Opción «Luchar»
    - Resultado: Sueltan los recipientes y os cierran el paso. [combate: el combate de «Laboratorio de los cristales»]
  - Opción «Esquivarlos» (prueba de Destreza CD 14)
    - Éxito: Aprovecháis su distracción para evitar que os descubran. [se evita el combate de «Laboratorio de los cristales»]
    - Fallo: Os descubren. [combate: el combate de «Laboratorio de los cristales»]
  - Opción «Espantarlos» (prueba de Carisma CD 14)
    - Éxito: Les advertís de que los cierres de Orvane se desmoronan. Huyen. [se evita el combate de «Laboratorio de los cristales»]
    - Fallo: No se lo tragan. [combate: el combate de «Laboratorio de los cristales»]

### Galería de los penitentes `z4_r04`

*Una galería parcialmente inundada contiene estatuas de monjes arrodillados. Los cultistas han colocado símbolos arcanos sobre sus rostros.*

**Combate:** Elementales de vapor (Steam Mephit). `z4_e02`

**Trampa: Estatua de presión.** Una estatua enana adaptada por los cultistas libera una descarga de energía al presionar una losa oculta. *(Efecto: 2d6 de daño de fuerza; mitad del daño con salvación exitosa.)*

**Escena: «El voto de silencio»** `z4_p02`

- **Narrador:** Junto a los cristales violetas, unas monedas y una poción han quedado entre piedras sumergidas. Remover las ruinas podría hacer ruido y atraer atención.
- **Pregunta:** ¿Cómo recuperáis la ofrenda sin hacer ruido?
  - Opción «Apartar las piedras bajo el agua» (prueba de Fuerza CD 15)
    - Éxito: Apartáis las piedras sin hacer ruido y recuperáis la poción y las monedas. [+9 oro; objeto: Poción de curación]
    - Fallo: Una piedra se desliza y os golpea la mano. [daño 1d4]
  - Opción «Buscar un hueco seguro entre los cristales» (prueba de Sabiduría CD 14)
    - Éxito: Distinguís un hueco entre los reflejos y recuperáis la poción y las monedas. [+9 oro; objeto: Poción de curación]
    - Fallo: El agua turbia os impide encontrar un acceso seguro.
  - Si se marcha sin elegir: La ofrenda sigue entre las piedras sumergidas.

**Combate:** Devoto rendido (Cultist). `z4_e08`

**Escena: «El devoto que suelta el arma»** `z4_ev01` (tras el combate de «Cámara de estudio»; antes de el combate de «Cámara del poder prohibido»; puede salir al volver) — ilustración `escena_cultista_llave`

- **Narrador:** Un devoto de Orvane, con la túnica empapada, deja caer su daga al agua y se arrodilla ante vosotros.
- **Pregunta:** ¿Qué hacéis?
  - Opción «Aceptar su rendición» (decisión de piedad)
    - Resultado: El cultista confirma que Orvane mantiene cautivos. Os entrega una poción antes de escapar. [objeto: Poción de curación]
  - Opción «Atacarle» (decisión de dureza)
    - Resultado: Recoge la daga del agua y se defiende. [combate: el combate de «Galería de los penitentes»]

### Cámara de estudio `z4_r05`

*Una cámara de estudio contiene libros mojados, instrumentos arcanos y una mesa de alquimia. Los cultistas protegen los últimos recursos del monasterio.*

**Combate:** Devotos de Orvane (Cultist), Devoto de retaguardia (Cultist). `z4_e03`
  - Objetivo opcional: Cortad el ritual: derribad al devoto de retaguardia antes del asalto 3.
  - Si se cumple: El ritual queda a medias: Orvane tendrá un rayo abrasador menos.

**Cofre.** Contiene: Varita de proyectiles mágicos.

### Santuario de la fuente `z4_r06`

*Una fuente circular ocupa el centro de una gran sala. El agua flota en pequeñas esferas y la energía arcana se concentra en el techo. Es el último lugar seguro antes de Orvane.*

**Descanso (corto): Fuente de la serenidad.** La fuente conserva una energía purificadora. Es el último rincón seguro antes de Orvane.

**Diálogo al entrar:** `z4_d01`

- **Narrador:** El brillo violeta se vuelve más intenso. Orvane está en la siguiente cámara, junto al cristal.
- **Héroe (personaje del jugador):** Tenemos que detenerlo antes de que rompa las últimas protecciones.

**Diálogo al entrar (solo si Hermano Edmund va en el grupo):** `z4_d01b`

- **Hermano Edmund:** Descansad mientras podáis. Después tendremos que enfrentar a Orvane y salvar a los mineros.

**Escena: «El vínculo de Umbría»** `z4_s02_pista` (antes de haber jugado El Corazón Hueco (segunda aventura, donde se consigue el amuleto de corteza))

- **Narrador:** Un sello de piedra lleva símbolos de Umbría, un bosque lejano. Parece una antigua señal de los monjes viajeros.
- **Pregunta:** ¿Qué hacéis?
  - Opción «Observar las ondas bajo los símbolos» (prueba de Sabiduría CD 14)
    - Éxito: Descubrís una marca con forma de amuleto de corteza. Hará falta uno para activar el antiguo vínculo. [deja una pista para más adelante]
    - Fallo: El agua se agita y perdéis el rastro de las ondas.
  - Opción «Interpretar los símbolos violetas» (prueba de Inteligencia CD 15)
    - Éxito: Interpretáis el símbolo: un monje trajo esta magia de Umbría. Se necesita un amuleto de corteza. [deja una pista para más adelante]
    - Fallo: No conseguís interpretar los trazos.
  - Si se marcha sin elegir: Los símbolos siguen brillando sin revelar su secreto.

**Escena: «El vínculo de Umbría»** `z4_s02_abrir` (tras haber jugado El Corazón Hueco (segunda aventura, donde se consigue el amuleto de corteza))

- **Narrador:** El amuleto de corteza responde al sello de Umbría. Una luz violeta recorre la piedra.
- **Pregunta:** ¿Probáis?
  - Opción «Acercar el amuleto a los símbolos»
    - Resultado: El amuleto activa un antiguo acceso de los monjes. Habéis descubierto el secreto del vínculo. [descubre la zona secreta «Depósito del vínculo»]

### Cámara del poder prohibido `z4_r07`

*En una gran cámara medio inundada flota el cristal oscuro. Orvane lo rodea de magia, protegido por criaturas de vapor.*

**Diálogo al entrar (solo si Brunna va en el grupo):** `z4_d12a`

- **Brunna:** Orvane, esos mineros son gente de mi pueblo. Voy a liberarlos, aunque tenga que derribar esta montaña.

**Diálogo al entrar (solo si Tiko va en el grupo):** `z4_d12b`

- **Tiko:** Vinimos a rescatar a los mineros, no a conseguir tesoros. Orvane, se acabaron tus trampas.

**Antes del combate final (versión normal):**

- **Maese Orvane:** ¡Apartaos! ¡Este cristal me dará un poder que ningún mago ha conocido jamás!
- **Héroe (personaje del jugador):** Has esclavizado a los mineros y puesto en peligro Valdescarcha. Libéralos y detente.
- **Maese Orvane:** ¡Cuando domine su energía, nadie volverá a darme órdenes! ¡El valle entero obedecerá mi voluntad!
- **Héroe (personaje del jugador):** No dejaré que conviertas a esta gente en esclavos. Se acabó, Orvane.

**Versión si Brunna está en el grupo en lugar de Liss:**

- **Maese Orvane:** ¡Apartaos! ¡Este cristal me dará un poder que ningún mago ha conocido jamás!
- **Brunna:** Soy minera de Valdescarcha. ¡Has utilizado a nuestra gente y voy a sacarla de aquí!
- **Maese Orvane:** ¡Cuando domine su energía, nadie volverá a darme órdenes! ¡El valle entero obedecerá mi voluntad!
- **Héroe (personaje del jugador):** No vas a esclavizar a nadie más, Orvane. Esto termina ahora.

**Aviso antes del combate:** El aire se vuelve húmedo y caliente. De la cámara siguiente llega un silbido de vapor y la voz de Maese Orvane, que recita sin descanso.

**Combate:** Guardianes de vapor (Steam Mephit). `z4_e04`

**Combate:** Maese Orvane (Orvane). `z4_e05`

### Pasarela de las compuertas `z4_r08`

*Una pasarela de losas cruza un canal rápido sobre tres compuertas de piedra.*

**Diálogo al entrar:** `z4_d04`

- **Narrador:** Las compuertas conservan marcas antiguas de inundación. Los monjes las usaban para mantener el cristal bajo el agua.
- **Héroe (personaje del jugador):** Orvane ha cambiado el caudal para extraer energía del cristal. Por eso está fallando la protección.

**Escena: «El caudal contenido»** `z4_p01`

- **Narrador:** Entre las ruinas inundadas, la luz violeta permite distinguir unas monedas bajo el agua. La corriente dificulta alcanzarlas.
- **Pregunta:** ¿Cómo recuperáis las monedas?
  - Opción «Cerrar las compuertas, como mandaba Aldric» (solo si se encontró la pista)
    - Resultado: Recordáis la inscripción de la cripta: «encerrad el cristal bajo el agua». Movéis las compuertas y el agua vuelve a cubrir el cristal. En el canal vaciado brillan las monedas. [+9 oro; deja una pista para más adelante]
  - Opción «Alcanzarlas desde el borde de piedra» (prueba de Destreza CD 14)
    - Éxito: Recogéis las monedas sin perder el equilibrio. [+9 oro]
    - Fallo: Resbaláis y la corriente os golpea contra la piedra. [daño 1d4]
  - Opción «Buscar un remanso entre las columnas» (prueba de Inteligencia CD 14)
    - Éxito: Localizáis un remanso y recuperáis las monedas. [+9 oro]
    - Fallo: Los reflejos os impiden calcular la profundidad.
  - Opción «Soportar el agua helada para recogerlas» (prueba de Constitución CD 15)
    - Éxito: Resistís el frío hasta recuperar las monedas. [+9 oro]
    - Fallo: El frío os entumece y el agua os derriba. [daño 1d4]
  - Si se marcha sin elegir: La corriente dispersa las monedas. Al intentar recogerlas, perdéis parte de las vuestras.

### Registro de los cautivos `z4_r09`

*Una cámara de escribas sobre el agua. Sus tablillas recientes tienen nombres de Valdescarcha.*

**Diálogo al entrar:** `z4_d07`

- **Narrador:** Un registro enumera a los mineros que Orvane mantiene prisioneros. Varios figuran como «trasladados detrás de la cámara de estudio».
- **Héroe (personaje del jugador):** Ya sabemos dónde están los supervivientes. Primero tenemos que detener a Orvane para liberarlos.

**Diálogo al entrar (solo si Liss va en el grupo):** `z4_d07b`

- **Liss:** Conocía este registro. Debí denunciarlo antes. Ahora ayudaré a sacar a los mineros de aquí.

**Diálogo al entrar (solo si Brunna va en el grupo):** `z4_d07c`

- **Brunna:** ¡Aquí está el nombre del aprendiz! Lo trasladaron con los supervivientes. Aún puedo encontrarlo.

**Escena: «El escribiente cautivo»** `z4_q01` — ilustración `escena_escribiente_cautivo`

- **Narrador:** Tras una reja oxidada, un escribiente cautivo os muestra dos tablillas: una con los turnos de guardia y otra con provisiones.
- **Pregunta:** ¿Qué le pedís que os explique?
  - Opción «Consultar los turnos de guardia»
    - Resultado: El escribiente os señala una ruta que permite esquivar a uno de los guardias de la cámara de estudio. [un enemigo menos en el combate de «Cámara de estudio»]
  - Opción «Consultar la tablilla de provisiones»
    - Resultado: El escribiente os entrega una poción de curación que guardaba entre sus provisiones. [objeto: Poción de curación]
  - Opción «Comparar las dos tablillas» (prueba de Inteligencia CD 14)
    - Éxito: Descifráis ambas tablillas. Evitáis a un guardia y el escribiente os entrega una poción de curación. [objeto: Poción de curación; un enemigo menos en el combate de «Cámara de estudio»]
    - Fallo: Solo comprendéis los turnos de guardia. El escribiente os explica cómo evitar a uno de ellos. [un enemigo menos en el combate de «Cámara de estudio»]

### Sala de los sellos rotos `z4_r10`

*Una cámara octogonal con sellos arcanos quebrados y trazos recientes que los deforman.*

**Diálogo al entrar:** `z4_d09`

- **Narrador:** Los sellos de piedra están dañados. Las marcas más recientes fueron hechas por Orvane.
- **Héroe (personaje del jugador):** Está rompiendo las protecciones de los monjes para absorber la energía del cristal.

**Escena: «El cultista rendido»** `z4_q02` — ilustración `escena_cultista_llave`

- **Narrador:** Un joven cultista se arrodilla entre las ruinas inundadas y levanta las manos. Ofrece información a cambio de su libertad.
- **Pregunta:** ¿Qué hacéis con el cultista?
  - Opción «Perdonarle a cambio de información» (decisión de piedad)
    - Resultado: El cultista os revela dónde ocultaron un cofre y cómo evitar a uno de los guardianes de vapor. Después huye. [un enemigo menos en el combate de «Cámara del poder prohibido»; descubre el secreto de «Laboratorio de los cristales»]
  - Opción «Exigirle sus monedas» (prueba de Carisma CD 13, decisión de codicia)
    - Éxito: El cultista os entrega siete monedas y se marcha. [+7 oro]
    - Fallo: El cultista huye y da la alarma. Un guardián de vapor más se prepara para combatir. [un enemigo más en el combate de «Cámara del poder prohibido»]
  - Opción «Rechazar el trato»
    - Resultado: El cultista se pierde por los pasillos inundados.

**Cofre.** Contiene: Poción de curación mayor.

### Celda de los escribas (zona secreta) `z4_s01_r01`

*Un atril seco en medio del agua guarda un diario sobre el cierre del monasterio.*

**Diálogo al entrar:** `z4_d06`

- **Narrador:** Un diario explica que los monjes inundaron el monasterio para enfriar el cristal y mantener su magia contenida.
- **Héroe (personaje del jugador):** Orvane está deshaciendo su trabajo. Si controla el cristal, pondrá en peligro todo el valle.

**Combate:** Mefit del cristal (Steam Mephit). `z4_e06`

**Cofre.** Contiene: Poción de heroísmo.

### Depósito del vínculo (zona secreta) `z4_s02_r01`

*Una habitación seca con un estante de tablillas y un arcón de piedra. Las raíces fosilizadas no son de ningún árbol de la montaña.*

**Diálogo al entrar:** `z4_d10`

- **Narrador:** Un cuaderno cuenta que un monje viajó a Umbría y aprendió a crear vínculos mágicos con madera y piedra.
- **Héroe (personaje del jugador):** Este vínculo recuerda sus viajes a Umbría. No necesitamos entenderlo para detener a Orvane.

**Combate:** Guardia del depósito (Skeleton). `z4_e07`

**Cofre.** Contiene: Poción de curación mayor.

**Al salir de la zona por primera vez:** pantalla «El monasterio hundido superada» con el resumen (salas, enemigos, oro…).

## 6. Final

- **Victoria (Narrador):** Orvane cae derrotado. El cristal oscuro se agrieta y se deshace. Sin su energía, las aguas del monasterio empiezan a descender. Los cultistas supervivientes huyen. Tras la cámara de estudio encontráis a los mineros que siguen vivos, encerrados y agotados. Los liberáis y regresáis con ellos a Valdescarcha. Los documentos recuperados confirman la verdad: Aldric cerró el camino y los monjes sumergieron el cristal para proteger el valle. Las familias vuelven a reunirse. Hondaroca ya no está en peligro.
- **Recompensa:** 150 monedas de oro.
- **Derrota (Narrador):** Todo el grupo ha caído en la oscuridad de Hondaroca.

## 7. Charlas de los aliados en la posada de Valdescarcha

Entre aventuras, en la posada, se puede charlar con cada aliado. Cada charla nueva se desbloquea al hacer otra aventura juntos. La «frase de inspiración» la dicen en combate al animar al grupo.

### Brunna

**Charla 1:**

- **Brunna:** Mi cuadrilla estaba formada por familias enteras de Valdescarcha.
- **Héroe (personaje del jugador):** ¿Eras su jefa?
- **Brunna:** Era quien escuchaba las grietas antes de cada turno.
- **Brunna:** El antiguo capataz humano no quiso escucharme. Orvane aprovechó el riesgo para obligarnos a seguir excavando.

**Charla 2:**

- **Brunna:** Guardo la ficha de cobre de un aprendiz de mi cuadrilla. Lo capturaron con los demás.
- **Héroe (personaje del jugador):** ¿Por qué no la has devuelto?
- **Brunna:** Porque todavía espero encontrarlo entre los supervivientes y devolvérsela.
- **Brunna:** No he aprendido a despedirme de quienes quizá sigan vivos.

**Charla 3:**

- **Brunna:** Durante años pensé que mi deber era resistir sin pedir ayuda.
- **Héroe (personaje del jugador):** Nadie puede sostener solo una montaña.
- **Brunna:** Lo sé. Esta vez confiaré en quienes caminan a mi lado.
- **Brunna:** Y si el techo vuelve a caer, encontraremos juntos una salida.

- **Frase de inspiración:** No abandonaré a nadie bajo la piedra.

### Tiko

**Charla 1:**

- **Tiko:** Aprendí a abrir cerraduras antes de aprender a leer.
- **Héroe (personaje del jugador):** ¿Quién te enseñó?
- **Tiko:** Un cerrajero que nunca preguntó de dónde venían las monedas.
- **Tiko:** Cuando murió, comprendí que una puerta abierta también puede salvar una vida.

**Charla 2:**

- **Tiko:** Robé una llave al jefe goblin de la prisión. Podría haber escapado entonces.
- **Héroe (personaje del jugador):** ¿Por qué regresaste?
- **Tiko:** Oí a un minero pedir auxilio al otro lado de una puerta cerrada.
- **Tiko:** No me gusta admitirlo, pero su voz pesó más que el oro. Así acabé encadenado.

**Charla 3:**

- **Tiko:** Siempre he temido que alguien descubra que también tengo miedo.
- **Héroe (personaje del jugador):** Has vuelto a luchar junto a nosotros.
- **Tiko:** Porque ahora sé que no necesito esconderme para ser valiente.
- **Tiko:** Si una cerradura nos separa de alguien, volveré a abrirla.

- **Frase de inspiración:** Si hay una salida, encontraré la cerradura.

### Hermano Edmund

**Charla 1:**

- **Hermano Edmund:** Mi orden heredó la custodia de Aldric cuando murió el último guardián enano.
- **Héroe (personaje del jugador):** ¿Estabas preparado?
- **Hermano Edmund:** Pensaba que proteger la cripta bastaba. No vi que Orvane también amenazaba a los vivos.
- **Hermano Edmund:** Ahora sé que los vivos también necesitan una voz.

**Charla 2:**

- **Hermano Edmund:** Vi las primeras huellas de intrusos y no alerté a Valdescarcha.
- **Héroe (personaje del jugador):** ¿Por qué?
- **Hermano Edmund:** Temía provocar el pánico. Mi prudencia dio tiempo a Orvane.
- **Hermano Edmund:** No volveré a confundir cautela con abandono.

**Charla 3:**

- **Hermano Edmund:** Pensé que mi deber terminaba en el altar.
- **Héroe (personaje del jugador):** ¿Y ahora?
- **Hermano Edmund:** Está donde alguien necesite amparo, incluso lejos de la cripta.
- **Hermano Edmund:** Caminaré sin esperar a que otro me conceda permiso.

- **Frase de inspiración:** Que ningún vivo quede sin amparo.

### Liss

**Charla 1:**

- **Liss:** Orvane me enseñó a leer los signos de la piedra. Admiraba su paciencia.
- **Héroe (personaje del jugador):** ¿Cuándo empezaste a desconfiar?
- **Liss:** Cuando dejó de estudiar el cristal y empezó a hablar de someter a todo el valle.
- **Liss:** Tardé demasiado en reconocer la diferencia.

**Charla 2:**

- **Liss:** Ayudé a Orvane a activar sus primeros cristales. Creí que investigábamos cómo proteger el monasterio.
- **Héroe (personaje del jugador):** No sabías lo que sucedería.
- **Liss:** Pero vi las consecuencias y seguí allí. Eso también fue una elección.
- **Liss:** Ahora quiero usar lo aprendido para reparar cuanto pueda.

**Charla 3:**

- **Liss:** Temo volver a seguir a alguien solo porque parece conocer todas las respuestas.
- **Héroe (personaje del jugador):** Puedes decidir por ti misma.
- **Liss:** Entonces elegiré proteger a quienes no tienen voz.
- **Liss:** El conocimiento no vale nada si exige abandonar a los demás.

- **Frase de inspiración:** El conocimiento también puede reparar el daño.

## 8. Reacciones de los aliados a las decisiones

Cuando el jugador elige una opción marcada como piedad, dureza o codicia, a veces un aliado comenta:

- **Brunna**
  - (piedad) En la mina nos cuidábamos así. Me gusta que sigáis la costumbre.
  - (dureza) Duro, pero claro. En la roca no hay sitio para dudas.
  - (codicia) Si es para la cuadrilla, vale. Si es para el bolsillo, ya hablaremos.
- **Tiko**
  - (piedad) Bien hecho. Una puerta abierta a tiempo salva más vidas que una espada.
  - (dureza) Uf. Recordadme que nunca os deba nada.
  - (codicia) No diré que no me gusta el tintineo. Pero pesa más de lo que parece.
- **Hermano Edmund**
  - (piedad) La misericordia también es una forma de custodia. Me alegra verla.
  - (dureza) Que los dioses nos perdonen si hoy nos hemos equivocado.
  - (codicia) El oro no compra el descanso de nadie. Tenedlo presente.
- **Liss**
  - (piedad) Orvane no habría dado esa oportunidad. Por eso no somos como él.
  - (dureza) Así empezó Orvane: con decisiones que parecían necesarias.
  - (codicia) Monedas. Orvane también decía que todo tenía un precio.

