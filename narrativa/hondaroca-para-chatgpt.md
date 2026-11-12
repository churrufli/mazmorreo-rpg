# Hondaroca: documento para reescribir la narrativa con ChatGPT

Primera aventura de Mazmorreo, «Las profundidades de Hondaroca». Todos los textos están sacados del juego tal como está hoy (rama `master`, 10-11-2026): `src/data/hondaroca.json`, `src/data/charlas.json` y el código.

**Cómo usarlo:** abre un chat nuevo de ChatGPT, pega el prompt del apartado 0 y adjunta este archivo entero. Cuando conteste, pásame su bloque JSON y lo aplico al juego.

---

## 0. Prompt para ChatGPT (copiar tal cual)

```
Te adjunto el documento con toda la narrativa de «Las profundidades de Hondaroca», la primera aventura de Mazmorreo: un juego de rol para móvil, para un jugador, de fantasía medieval sombría con reglas de D&D 2024 (SRD 5.2.1). El documento trae una biblia de la historia (apartado 1), una lista de problemas ya detectados (apartado 2), las normas del juego que limitan los textos (apartado 3) y TODOS los textos del juego en orden de partida, cada uno con su clave (apartado 4).

OBJETIVO PRINCIPAL: que la historia sea SENCILLA DE ENTENDER. Un jugador que lee frases sueltas en un móvil, entre combates, tiene que saber en todo momento quién es el malo, qué quiere, qué ha pasado con los mineros y por qué baja cada vez más hondo. Ahora mismo hay demasiados hilos (capataces, juramentos, sellos, fuentes, nombres borrados, voces) que no se cierran o que confunden.

TIENES LIBERTAD PARA:
- Reescribir cualquier texto: narrador, diálogos, títulos, preguntas, opciones, resultados, pendientes del diario, nombres de salas, de enemigos, de escenas y de objetos de decorado.
- Cambiar el argumento, quitar hilos, juntar personajes secundarios, simplificar el trasfondo (Aldric, los monjes, la fuente, el cristal) y cambiar términos o nombres si así se entiende mejor. Puedes cambiar nombres propios (Aldric, Orvane, Edmund, Liss, Tiko, Brunna, Valdescarcha, Hondaroca…) si mejora la claridad, pero dilo expresamente y aplícalo en TODOS los textos donde salga.
- Borrar líneas de diálogo o añadir alguna línea nueva corta.

LÍMITES (esto no se puede cambiar solo con texto):
1. Los identificadores (z1_r01, z1_e02, z1_q01…): no los renombres. Úsalos para decirme qué cambias.
2. La mecánica de cada opción: atributo, CD, coste, oro, daño, objeto, combate que provoca, enemigo de más o de menos, secreto que abre. Va entre corchetes [ ] detrás de cada resultado. El texto nuevo tiene que encajar con esa consecuencia. Ejemplo: si el resultado da +2 oro, el texto debe dar dinero; si dice «un enemigo más en z1_e05», el texto debe explicar por qué habrá un enemigo más allí.
3. El mapa, las salas, los combates y el tipo de criatura de cada enemigo (rata gigante, goblin, araña, esqueleto, zombi, necrófago, cultista, mefit de vapor). Sí puedes cambiar el NOMBRE que lleva cada enemigo.
4. Las ilustraciones ya existen (descritas en el apartado 1.5): el texto debe encajar con lo que muestran.
5. En qué sala se une cada aliado y su clase y especie.
6. El final mecánico: el jefe es un mago humano que lucha en la Cámara del poder prohibido (z4_r07) protegido por criaturas de vapor, y al vencerle termina la aventura.
Si una idea tuya necesita cambiar algo de esta lista, NO la metas en los textos: ponla aparte en «Propuestas que requieren programar».

NORMAS DE ESTILO (apartado 3): español de España; el grupo, en segunda persona del plural («entráis», «veis»), salvo en la zona 1, que va SIEMPRE en singular («entras», «ves»); frases cortas, como mucho unas 20 palabras por línea; diálogos de 2 a 4 líneas; sin cifras exactas de enemigos en la narración; el héroe no puede marcar género ni especie al hablar; nada imprescindible puede depender de un aliado opcional (las líneas «SOLO SI VA…» son extras).

QUÉ ME DEVUELVES, en este orden:
1. «La historia en 10 líneas»: el argumento nuevo, tan simple que se entienda a la primera.
2. «Cambios de argumento y de nombres»: lista corta, con el porqué de cada uno.
3. «Problemas resueltos»: para cada punto del apartado 2, una línea diciendo cómo queda.
4. «Propuestas que requieren programar» (si hay).
5. Un ÚNICO bloque de código JSON con TODOS los textos que cambian, con este formato exacto:

[
  {"clave": "z1_d02.lines[1]", "accion": "cambiar", "texto": "Texto nuevo."},
  {"clave": "z1_d02.lines[2]", "accion": "borrar"},
  {"clave": "z1_d02.lines[1]", "accion": "añadir_despues", "quien": "narrator", "texto": "Línea nueva."}
]

- «clave» es exactamente la que aparece en el documento entre `comillas invertidas`.
- «accion»: "cambiar", "borrar" o "añadir_despues" (esta última solo en diálogos; «quien» es narrator, hero, brunna, tiko, edmund, liss u orvane).
- No incluyas los textos que no cambian. No me devuelvas el documento entero.
- Si el bloque es muy largo, divídelo por zonas en varios mensajes y avísame de cuándo has terminado.
```

---

## 1. Biblia de la historia (cómo está ahora)

### 1.1 Premisa

**Valdescarcha** es un pueblo minero de montaña, pequeño y frío. Allí el jugador compra en la tienda, se cura en el templo, descansa en la posada (el único sitio con descanso largo) y elige compañeros.

Por encima del pueblo está la mina de **Hondaroca**. Debajo de la mina hay, de arriba abajo, cuatro zonas:
1. **La mina** (goblins y ratas).
2. **Las ruinas enanas**: una ciudad enana antigua, sepultada mucho antes de la mina (goblins, una araña, murciélagos).
3. **La cripta real de Aldric el Olvidado**: la necrópolis de un rey enano (esqueletos, zombis, necrófagos).
4. **El monasterio hundido**: un monasterio medio inundado, lleno de cristales de luz violeta (cultistas y criaturas de vapor). Al fondo espera el jefe.

**Texto de introducción** (lo lee el narrador al empezar): `dungeon.summary` y después `z1.description`.
- `dungeon.name`: Las profundidades de Hondaroca
- `dungeon.summary`: En Valdescarcha, la desaparición de los mineros de Hondaroca ha dejado hogares vacíos y preguntas sin respuesta. Bajo la mina, unas ruinas enanas y la cripta de Aldric el Olvidado guardan el rastro de Maese Orvane, empeñado en despertar el poder de un monasterio hundido. El héroe deberá seguir sus huellas antes de que aquello que duerme bajo la piedra alcance el valle.

### 1.2 Lo que ha pasado, según los textos actuales

- Los mineros de Valdescarcha han desaparecido. Los goblins ocupan la mina y trabajan para **Maese Orvane**, un mago. Usan a los mineros como mano de obra forzada para excavar hacia abajo (registros con sus nombres en las zonas 2 y 4).
- Hace siglos, el rey enano **Aldric** cerró el paso hacia lo más hondo porque bajo la montaña había un poder (una «fuente» del monasterio que antes curaba a los enfermos) que temía que se usara para dominar. Dejó guerreros vigilando y una orden: «Que lo enterrado permanezca bajo las aguas y la piedra». Con los siglos se olvidó el porqué.
- Los **monjes** del monasterio lo inundaron para enfriar el «foco arcano» y se hundieron con sus libros.
- **Orvane** encontró ese poder, alteró los sellos antiguos, usa el agua y los cristales para alimentarlo y se ha corrompido. Le sirven cultistas y criaturas de vapor.
- **Final:** el grupo vence a Orvane, el cristal oscuro se deshace, el agua baja y los mineros que siguen vivos quedan libres.

### 1.3 Personajes

**El héroe.** Lo crea el jugador: hombre o mujer; humano, elfo, enano o mediano; guerrero, clérigo, pícaro o mago. Sus frases no pueden marcar género, especie ni clase. Entra **solo** en la zona 1 y suma un aliado por zona.

**Regla de los aliados.** Tiko se une en la zona 2, el Hermano Edmund en la 3 y Liss en la 4. Si el héroe tiene la misma clase que uno de ellos, ese aliado no aparece y entra **Brunna** en su lugar, con su propia presentación. Por eso Brunna sale como mucho una vez por partida, y sus tres presentaciones nunca coinciden. Si el héroe es mago, Brunna sustituye a Liss y también cambia el diálogo previo al jefe.

| Personaje | Quién es | Personalidad e historia (textos actuales) |
|---|---|---|
| **Tiko Manosrápidas** (pícaro, mediano, zona 2) | Prisionero de los goblins | Ingenioso, hablador, buen corazón escondido tras bromas. Al presentarse dice que se coló buscando tesoros; en su charla, que robó una llave al capataz y volvió por un minero que pedía ayuda. |
| **Hermano Edmund** (clérigo, humano, zona 3) | Guardián de la cripta | Sereno y compasivo. Su orden heredó el juramento de velar la tumba de Aldric cuando murió el último guardián enano. Vio intrusos y no avisó al pueblo; eso dio tiempo a Orvane. |
| **Liss** (maga, elfa, zona 4) | Antigua aprendiz de Orvane | Inteligente y reservada. Activó la primera cámara de cristales y se quedó aunque vio las consecuencias. Quiere reparar el daño. |
| **Brunna Piedrahonda** (guerrera, enana, suplente) | Minera de Valdescarcha | Práctica, testaruda, protectora. «Escuchaba las grietas» antes de cada turno; un capataz no le hizo caso. Busca a un aprendiz desaparecido cuya ficha de cobre guarda. |
| **Maese Orvane** (jefe, mago humano) | El villano | Erudito corrompido por el poder del monasterio. Quiere ese poder y que su nombre perdure. Ojos con brillo violeta. |

### 1.4 Enemigos (nombre de criatura fijo; el nombre que se muestra se puede cambiar)

Ratas gigantes y goblins en la mina; goblins, jefes goblin («capataces»), una araña gigante y murciélagos en las ruinas; esqueletos, zombis y necrófagos en la cripta; cultistas de Orvane y mefits de vapor («elementales de vapor») en el monasterio; Orvane al final. Los goblins llevan como marca una huella de mano ocre. Los cultistas, túnica gris con capucha y un emblema de espiral.

### 1.5 Ilustraciones que ya existen (el texto debe encajar con ellas)

- **Zonas:** mina con vigas, raíles y vagonetas, luz cálida; ruinas enanas de piedra con columnas y relieves geométricos; cripta abovedada con sarcófagos y niebla, luz fría; monasterio inundado con agua negra y cristales que brillan en **violeta y cian**.
- **Personajes:** Tiko, mediano adulto con ganzúas y una moneda enana; Edmund, humano de unos 60 años, cabeza rapada, túnica gris verdosa, maza y farol; Liss, elfa joven de pelo rubio pálido, túnica de aprendiz con la espiral rayada, libro y bastón con cristal violeta apagado; Brunna, enana de unos 45 años con casco de minero, mandil y **pico** al hombro (en el juego lleva martillo); Orvane, humano alto y demacrado de unos 60 años, barba gris, ojos violeta y venas violeta y cian, túnica negra y violeta, bastón con un cristal dentado.

| Escena | Qué muestra la ilustración |
|---|---|
| `z1_q01` El vigía herido | Goblin flaco y herido, arrodillado junto a una vagoneta, deja su arco en el suelo con las manos abiertas. |
| `z2_q01` El registro del excavador | Goblin con delantal de cuero apretando un libro de registro contra el pecho, junto a grandes balanzas. |
| `z2_q02` La rendición en los hornos | Dos goblins sueltan sus armas y levantan las manos en un patio de hornos con una reja al fondo. |
| `z2_ev01` La mercader | Buhonera humana sonriente con sombrero ancho y un armazón cargado de cosas; ofrece una poción roja. |
| `z3_q01` El escriba de los nombres | Escriba fantasmal translúcido que señala una caja de pergaminos sobre lápidas sin nombre. |
| `z3_q02` La estatua sin rostro | Estatua de guardián con la cara borrada a cincel ante una puerta funeraria entreabierta con luz dorada; cuenco de bronce a sus pies. |
| `z4_q01` El escribiente cautivo | Escribiente humano delgado tras una reja oxidada, con agua por los tobillos, mostrando dos tablillas. |

---

## 2. Problemas ya detectados (para que los resuelvas)

**A. Las «voces» de la cripta y la mina no tienen sentido.** Decisión del autor: deben ser **inscripciones grabadas en las paredes** (o algo que se lee), no voces que se oyen. Excepción: la «voz invisible» de la entrada de la zona 4 (`z4.entry_dialogue[2]`), que es Orvane, se queda como voz. Textos afectados:
- `z1_d02.lines[0..2]`: golpes en el conducto y «Una voz lejana susurra: «No encendáis la luz… donde cae el agua»».
- `z3_r10.name` («Antesala de las voces») y `z3_r10.description`.
- `z3_d09.lines[0]`: «Una voz en la cámara: «Que lo enterrado permanezca…»».
- `z3_q02.options[0].ok.text` y `z3_q02.options[1].ok.text`: «Una voz susurra…», «Una voz agradece el tributo…».
- `z1_ev01.title` («La voz del entibador»): el entibador está allí en persona, el título confunde.
- `z4_j03.text`: «Un cristal apagado guarda un sonido en su interior».
- Ojo: «Una voz a lo lejos» (aviso del código cuando queda un aliado por rescatar) es una persona real pidiendo ayuda: está bien.

**B. Demasiados hilos sueltos para una aventura corta.** Varios misterios se abren y no se explican nunca. Simplifícalos, ciérralos o quítalos:
- ¿Quién cortó la cuerda de la campana de avisos (`z1_d06`, `z1_j06`) y qué es «la piedra del fondo»?
- «Nos han prohibido cerrar la bajada» (`z1_d04`): ¿quién lo prohibió?
- Las escudillas «de más personas de las que durmieron allí» (`z1_j02`) no se explican.
- El nombre de Aldric falta en los registros (`z3_d05`, `z3_j02`) y el pendiente se cierra sin explicación. ¿Por qué «el Olvidado»?
- La fuente que curaba (`z3_d07`), el foco arcano de los monjes (`z4_d06`), los sellos alterados (`z4_d09`), el cristal oscuro y el «poder de Hondaroca»: son cinco nombres para lo que podría ser una sola cosa.
- La orden de Edmund, los monjes del monasterio y los guardianes enanos: no queda claro quién es quién.
- El monje que viajó a un bosque lejano (`z4_d10`) y el «sello de Umbría» (`z4_s02_pista`, `z4_s02_abrir`, `z4_j05`) enlazan con la segunda aventura; pueden quedarse como guiño, pero deben entenderse sin ella.

**C. ¿Quién es Orvane y qué quiere?** El jugador solo sabe su nombre por la introducción. Nadie dice quién era para el pueblo ni para qué necesita a los mineros. Su motivación en el combate final es vaga («¡Mi nombre perdurará…!»). En `boss.pre_boss_dialogue[1]` el héroe dice «No sacrifiques más vidas», pero en ningún sitio se dice que haya muerto nadie. La frase «Hondaroca no será tu tumba de poder» suena rara.

**D. «Capataz» significa dos cosas.** Los jefes goblin se llaman «Capataz goblin» y «Capataz de la salida», pero Brunna y Tiko hablan de un capataz humano de la mina (`charlas.brunna.talks[0]`, `charlas.tiko.talks[1]`). Hay que distinguirlos o unificarlos.

**E. ¿La mina estaba abandonada o en uso?** `z1.description` dice «mina abandonada», `z1_d02b` habla de «después de que abandonaran la mina», pero los mineros desaparecieron hace poco (`z1_d01`: tela sin polvo) y la entrada de la zona habla de una «caravana» que no ha vuelto. Hay que dejar clara la cronología.

**F. Presentaciones de aliados que chocan con su historia.**
- Tiko: «Me colé aquí buscando tesoros» (`z2_r02.ally.default_scene[2]`) frente a su charla, donde volvió por un minero.
- Brunna en la zona 3 dice «¡Terminemos lo que empezamos!», pero acaba de conocer al héroe.
- Brunna busca «al muchacho» en la zona 2 (`z2_d06b`) sin haber hablado antes de él.

**G. Persona gramatical.** Desde la zona 2 el grupo va en plural, pero algunas preguntas y resultados siguen en singular: `z2_q01.question` y `z2_q01.options[0].fail.text` («te arranca»), `z2_q02.question`, `z2_ev01.question`, `z3_q01.question`, `z3_q02.question`, `z4_ev01.question`, `z4_q02.question`, `z4_q02.options[1].ok.text` («Te entrega»). La zona 1 va toda en singular (decisión tomada), aunque al volver ya haya aliados.

**H. Resultados que no dicen lo que pasa.** `z1_p02.fallback.text` quita 5 de oro sin decirlo. `z2_q01.options[0].fail.text` dice «diez monedas»: está bien, pero comprueba que todos los textos con dinero cuadren con el número entre corchetes.

**I. Referencias a cosas que el jugador no ha visto.** Las descripciones de sala (`*.description` de las salas `z*_r*`) **no se muestran** en el juego. Así que los diálogos que hablan de «el atril» (`z3_d03`), «un parte» (`z1_d06`) o «esa palanca» (`z2_d01`) deben presentar el objeto en el propio diálogo.

---

## 3. Normas del juego que limitan los textos

- **Lo que ve el jugador:** el diálogo de entrada de cada zona, los diálogos de sala (al entrar), las escenas (título, texto, pregunta, opciones y resultado), los pendientes del diario, los nombres de las salas, los textos de trampas (la descripción solo si no se detecta), descansos, secretos descubiertos, cofres con obstáculo, la palanca, las presentaciones de aliados, el diálogo con el jefe, el texto de victoria y las charlas de la posada.
- **Lo que NO ve:** la descripción de las salas y de las zonas 2 a 4 (sirven solo de contexto). Puedes cambiarlas igualmente para que queden coherentes.
- **El mapa es decorado genérico.** No digas que algo «se ve en el mapa» (una escalera, un saco, un hueco) si no está garantizado. Correcto: «Habéis descubierto un secreto». Incorrecto: «Se abre el pasadizo junto a la columna que veis».
- **Descansos:** la frase «permite regresar a Valdescarcha» la quita y la pone el código solo donde toca. No hace falta que la escribas.
- **Marcadores `{who}` e `{item}`** en los cofres con obstáculo: el juego pone ahí el nombre del personaje y del objeto. Consérvalos.
- **Escenas:** en las de *Decisión* se elige una vez. En las *Pruebas* y *Pistas de secreto*, si una opción falla se cierra solo esa y se puede probar otra; «fallback» sale si fallan todas. «Solo al volver a la zona» = la segunda vez que se pasa por allí.
- **Pendientes del diario:** se apuntan al llegar a la sala «desde» y se borran al llegar a «hasta». Deben resolverse de verdad cuando se borran.
- **Nombres propios de las otras aventuras** (para no repetirlos): Vegaumbría, Umbría, Corazón Hueco, Cumbrenieve, Vharzûl, Maren, Anselmo, Ivelle, Telmo, Vurka, Durnok, Syrael, Tavin Ventisca.

---

## 4. Todos los textos de Hondaroca, en orden de partida

Formato: `clave`: texto. Entre corchetes [ ], lo que pasa en el juego (no se cambia). En cursiva, cuándo sale. Las salas van en el orden del archivo, que es más o menos el de la partida; «Conecta con» indica el mapa.

### Zona 1: La mina de Hondaroca (`z1`)

- `z1.name`: La mina de Hondaroca
- `z1.description`: Una mina de montaña abandonada. Los goblins trabajan para Orvane y han convertido las galerías en su campamento. _(se lee en la introducción al empezar la partida)_

**Diálogo al entrar en la zona** (`z1.entry_dialogue`):
- `z1.entry_dialogue[0]` **Narrador:** La última caravana de Hondaroca no ha regresado. En Valdescarcha, cada día de silencio hace temer lo peor.
- `z1.entry_dialogue[1]` **Narrador:** La entrada de la mina permanece abierta. El viento arrastra polvo de carbón y un olor extraño desde las profundidades.
- `z1.entry_dialogue[2]` **Héroe:** Encontraré a los desaparecidos. Y averiguaré qué hay detrás de este silencio.

**Pendientes del diario** (se apuntan al llegar a «desde» y se borran al llegar a «hasta»):
- `z1_j01.text` _(desde z1_r01, hasta z1_r08)_: Las marcas de una viga parecen un mensaje interrumpido.
- `z1_j02.text` _(desde z1_r05, hasta z1_ev01)_: Las escudillas del campamento son de más personas de las que durmieron allí.
- `z1_j03.text` _(desde z1_r03, hasta z1_s01)_: Una corriente de aire sale de un lugar donde no debería haber paso.
- `z1_j04.text` _(desde z1_r04, hasta z1_s02)_: En el cruce, un saco de mineral pesa demasiado poco y la pared tiene raspaduras.
- `z1_j05.text` _(desde z1_r09, hasta z4_e05)_: El agua de una cámara refleja una luz violeta cuyo origen no se ve.
- `z1_j06.text` _(desde z1_s02_r01, hasta z4_e05)_: Alguien cortó la cuerda de la campana de avisos. ¿Qué «piedra del fondo» temían los mineros?

#### Boca de la mina (`z1_r01`)

- `z1_r01.name`: Boca de la mina
- `z1_r01.description` _(no se muestra al jugador; contexto)_: La entrada está parcialmente derrumbada. Una vagoneta permanece volcada junto a los raíles. Desde el interior llegan voces agudas.
- _Conecta con: Galería de extracción_

**Combate `z1_e01`** _(empieza al verlo)_: Rata de la entrada (Giant Rat, vanguardia, Mordisco). _(Nombres de enemigos editables como `z1_e01.enemies[n].name`)_

**Diálogo `z1_d01`**
- `z1_d01.lines[0]` **Narrador:** Bajo una rueda de la vagoneta hay un trozo de tela gris con una hebilla de minero.
- `z1_d01.lines[1]` **Héroe:** No tiene polvo. Quien lo llevaba pasó por aquí hace poco.

#### Galería de extracción (`z1_r02`)

- `z1_r02.name`: Galería de extracción
- `z1_r02.description` _(no se muestra al jugador; contexto)_: Una galería estrecha sostenida por vigas de madera. Hay marcas recientes de picos y una lámpara goblin cuelga de una viga.
- _Conecta con: Boca de la mina, Almacén de herramientas, Cámara de las poleas_

**Combate `z1_e02`** _(empieza al verlo)_: Goblin de la galería (Goblin Warrior, retaguardia, Arco corto), Rata de la galería (Giant Rat, vanguardia, Mordisco). _(Nombres de enemigos editables como `z1_e02.enemies[n].name`)_

**Trampa `z1_t01`** _(si no se detecta, se lee la descripción)_
- `z1_t01.name`: Viga debilitada
- `z1_t01.description`: Una cuerda oculta está conectada a unas piedras sueltas. Si no se detecta, el techo desprende fragmentos sobre quien avance primero.

**Descanso `z1_rest2`** _(corto)_
- `z1_rest2.name`: Rincón resguardado
- `z1_rest2.description`: Un hueco tranquilo donde recobrar el aliento; permite regresar a Valdescarcha.

**Escena `z1_p01` (Prueba)**
- `z1_p01.title`: La viga que cede
- `z1_p01.text`: Entre las vigas del túnel, unas piedras sueltas han atrapado una bolsa de suministros. La madera cruje al acercarte.
- `z1_p01.question`: ¿Cómo recuperas la bolsa sin provocar un derrumbe?
- `z1_p01.options[0].label`: Apartar las piedras y calzar la viga _(Fuerza CD 11)_
  - `z1_p01.options[0].ok.text`: Aseguras la viga y rescatas la bolsa: dentro hay un par de monedas. [+2 oro]
  - `z1_p01.options[0].fail.text`: La madera cae sobre tu brazo cuando intentas moverla. [daño 1d4]
- `z1_p01.options[1].label`: Deslizarse entre las vigas _(Destreza CD 12)_
  - `z1_p01.options[1].ok.text`: Alcanzas la bolsa sin tocar la viga. Entre sus pliegues hay unas monedas. [+2 oro]
  - `z1_p01.options[1].fail.text`: Los cascotes se desplazan y te obligan a retirarte.
- `z1_p01.options[2].label`: Examinar los apoyos de madera _(Inteligencia CD 11)_
  - `z1_p01.options[2].ok.text`: Afianzas la cuña y extraes la bolsa. Conserva unas monedas. [+2 oro]
  - `z1_p01.options[2].fail.text`: La cuña se parte y los escombros quedan inestables.
- `z1_p01.fallback.text` (si fallan todas): La bolsa queda atrapada bajo los escombros. No merece la pena arriesgarse más.

#### Almacén de herramientas (`z1_r03`)

- `z1_r03.name`: Almacén de herramientas
- `z1_r03.description` _(no se muestra al jugador; contexto)_: Un ensanchamiento de la galería contiene cajas, lámparas, picos y vagonetas. Bajo unos tablones hay un pequeño cofre.
- _Conecta con: Galería de extracción, Cruce de los raíles (puerta), Pasadizo de las marcas, Caseta del entibador (paso secreto)_

**Combate `z1_e03`**: Rata del almacén (Giant Rat, vanguardia, Mordisco). _(Nombres de enemigos editables como `z1_e03.enemies[n].name`)_

**Cofre `z1_c01`** _(2 oro; Poción de curación)_

**Secreto `z1_s01`** _(abre exit:z1_r05; se lee al descubrirlo)_
- `z1_s01.description`: Tras unas cajas hay un hueco entre los tablones que permite alcanzar una galería de mantenimiento que conduce al campamento.

**Cofre con obstáculo `z1_o02`** _(4 oro; Poción de curación; necesita Palanqueta)_
- `z1_o02.obstacle.title`: Puerta atascada
- `z1_o02.obstacle.text`: La puerta de un cuartucho del almacén está atascada.
- `z1_o02.obstacle.use`: {who} mete la palanqueta en la rendija y la puerta cede.
- `z1_o02.obstacle.missing`: Con una palanqueta la abriríamos. En la tienda del pueblo venden.
- `z1_o02.obstacle.alt.try` _(sin objeto, Fuerza CD 12)_: {who} empuja la puerta con el hombro.
- `z1_o02.obstacle.alt.hurt`: La puerta no cede y {who} se hace daño

**Escena `z1_s01_pista` (Pista de secreto)** — _abre el secreto z1_s01_
- `z1_s01_pista.title`: Corriente de aire
- `z1_s01_pista.text`: Una corriente fría pasa entre las vigas del túnel y levanta el polvo. Podría señalar un hueco oculto.
- `z1_s01_pista.question`: ¿Cómo lo buscas?
- `z1_s01_pista.options[0].label`: Seguir el aire entre las vigas _(Sabiduría CD 11)_
  - `z1_s01_pista.options[0].ok.text`: La corriente señala un paso de mantenimiento que comunica con otra galería. [descubre secreto z1_s01 → exit:z1_r05]
  - `z1_s01_pista.options[0].fail.text`: No das con ello por ahí.
- `z1_s01_pista.options[1].label`: Examinar los apoyos de madera _(Inteligencia CD 11)_
  - `z1_s01_pista.options[1].ok.text`: La corriente señala un paso de mantenimiento que comunica con otra galería. [descubre secreto z1_s01 → exit:z1_r05]
  - `z1_s01_pista.options[1].fail.text`: No das con ello por ahí.

#### Cruce de los raíles (`z1_r04`)

- `z1_r04.name`: Cruce de los raíles
- `z1_r04.description` _(no se muestra al jugador; contexto)_: Tres galerías convergen en una cámara de roca. Una vagoneta bloquea parcialmente el paso. Los goblins han colocado allí un puesto de vigilancia.
- _Conecta con: Almacén de herramientas (puerta), Campamento abandonado, Sala de avisos (paso secreto)_

**Combate `z1_e04`**: Arquero del cruce (Goblin Warrior, retaguardia, Arco corto). _(Nombres de enemigos editables como `z1_e04.enemies[n].name`)_

**Secreto `z1_s02`** _(abre chest:z1_c02; se lee al descubrirlo)_
- `z1_s02.description`: Un saco de mineral esconde una caja de herramientas que los goblins no han encontrado.

**Escena `z1_s02_pista` (Pista de secreto)** — _abre el secreto z1_s02_
- `z1_s02_pista.title`: El rastro del botín
- `z1_s02_pista.text`: Las raspaduras del suelo se desvían hacia las vigas laterales. Parecen el rastro de un botín arrastrado fuera del paso.
- `z1_s02_pista.question`: ¿Cómo lo buscas?
- `z1_s02_pista.options[0].label`: Seguir las raspaduras del suelo _(Sabiduría CD 12)_
  - `z1_s02_pista.options[0].ok.text`: Las marcas te guían hasta un cofre oculto tras las vigas. [descubre secreto z1_s02 (cofre oculto)]
  - `z1_s02_pista.options[0].fail.text`: No consigues seguir el rastro.
- `z1_s02_pista.options[1].label`: Examinar el polvo junto a las vigas _(Inteligencia CD 11)_
  - `z1_s02_pista.options[1].ok.text`: Las marcas te guían hasta un cofre oculto tras las vigas. [descubre secreto z1_s02 (cofre oculto)]
  - `z1_s02_pista.options[1].fail.text`: No consigues seguir el rastro.

**Escena `z1_q01` (Decisión)** — _después de z1_e04, ilustración: escena_vigia_herido_
- `z1_q01.title`: El vigía herido
- `z1_q01.text`: Tras el combate, un goblin herido suelta el arco, se arrodilla y extiende las manos. Está dispuesto a hablar.
- `z1_q01.question`: ¿Qué haces con él?
- `z1_q01.options[0].label`: Perdonarle y pedirle una ruta _(Carisma CD 11)_
  - `z1_q01.options[0].ok.text`: El vigía te habla de un pequeño botín que los goblins escondieron cerca del campamento. Te indica cómo encontrarlo antes de alejarse. [descubre secreto z1_s02 (cofre oculto)]
  - `z1_q01.options[0].fail.text`: Aprovecha un descuido y huye sin decir nada.
- `z1_q01.options[1].label`: Quitarle las monedas
  - `z1_q01.options[1].ok.text`: Le quitas la bolsa. Se va corriendo hacia el campamento a avisar. [+2 oro; un enemigo más en z1_e05]
- `z1_q01.options[2].label`: Dejarle huir
  - `z1_q01.options[2].ok.text`: Se marcha cojeando. Uno menos que te espere más adelante. [un enemigo menos en z1_e05]

**Combate `z1_pat01`**: Merodeador goblin (Goblin Warrior, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `z1_pat01.enemies[n].name`)_

**Escena `z1_pat01_paso` (Prueba)** — _solo al volver a la zona, después de z1_e04_
- `z1_pat01_paso.title`: Merodeadores del retorno
- `z1_pat01_paso.text`: Un grupo de goblins distraídos discute por el botín. Todavía no han reparado en tu presencia.
- `z1_pat01_paso.question`: ¿Qué haces?
- `z1_pat01_paso.options[0].label`: Luchar
  - `z1_pat01_paso.options[0].ok.text`: Sacan las armas al verte. [empieza el combate z1_pat01]
- `z1_pat01_paso.options[1].label`: Esquivarlos _(Destreza CD 12)_
  - `z1_pat01_paso.options[1].ok.text`: Esperas tras la roca hasta que se alejan. [elimina el combate z1_pat01]
  - `z1_pat01_paso.options[1].fail.text`: Te descubren. [empieza el combate z1_pat01]
- `z1_pat01_paso.options[2].label`: Espantarlos _(Carisma CD 12)_
  - `z1_pat01_paso.options[2].ok.text`: Les haces creer que vienen refuerzos. Huyen por el túnel. [elimina el combate z1_pat01]
  - `z1_pat01_paso.options[2].fail.text`: No se lo tragan. [empieza el combate z1_pat01]

#### Campamento abandonado (`z1_r05`)

- `z1_r05.name`: Campamento abandonado
- `z1_r05.description` _(no se muestra al jugador; contexto)_: Un pequeño campamento de mineros permanece intacto. Hay mantas, utensilios y una hoguera apagada. Es un lugar protegido para recuperar fuerzas.
- _Conecta con: Cruce de los raíles, Pozo de las profundidades (escalera abajo), Cámara del agua negra_

**Descanso `z1_rest1`** _(corto)_
- `z1_rest1.name`: Campamento de los mineros
- `z1_rest1.description`: La hoguera conserva brasas bajo la ceniza. El lugar está protegido y permite realizar un descanso corto.

**Combate `z1_e05`**: Saqueador goblin (Goblin Warrior, vanguardia, Cimitarra). _(Nombres de enemigos editables como `z1_e05.enemies[n].name`)_

**Cofre `z1_c02`** _(3 oro; Poción de curación)_

**Escena `z1_ev01` (Decisión)** — _solo al volver a la zona, después de z2_r02, ilustración: escena_minero_agua_negra_
- `z1_ev01.title`: La voz del entibador
- `z1_ev01.text`: El entibador de la mina ha llegado hasta el campamento, empapado y herido. El agua negra lo arrastró mientras huía de los goblins.
- `z1_ev01.question`: ¿Cómo le ayudas?
- `z1_ev01.options[0].label`: Darle una poción de curación _(requiere Poción de curación)_
  - `z1_ev01.options[0].ok.text`: Se recupera y te entrega sus ahorros: «Para el camino. Yo vuelvo a casa». [+5 oro; entrega: Poción de curación]
- `z1_ev01.options[1].label`: Vendarle y estabilizarle _(Sabiduría CD 11)_
  - `z1_ev01.options[1].ok.text`: Le vendas la herida y te entrega sus ahorros antes de dirigirse a la salida. [+5 oro]
  - `z1_ev01.options[1].fail.text`: No consigues vendarle bien la herida. Le acompañas hasta la boca de la mina.

#### Pozo de las profundidades (`z1_r06`)

- `z1_r06.name`: Pozo de las profundidades
- `z1_r06.description` _(no se muestra al jugador; contexto)_: Una enorme cavidad natural desciende hacia el interior de la montaña. Una escalera conduce a construcciones antiguas cubiertas de símbolos enanos.
- _Conecta con: Campamento abandonado (escalera abajo), Vestíbulo de los canteros (escalera abajo)_

**Combate `z1_e06`** _(empieza al verlo)_: Vigía goblin (Goblin Warrior, retaguardia, Arco corto), Rata de las profundidades (Giant Rat, vanguardia, Mordisco). _(Nombres de enemigos editables como `z1_e06.enemies[n].name`)_

**Cofre con obstáculo `z1_o01`** _(3 oro; Poción de curación; necesita Cuerda)_
- `z1_o01.obstacle.title`: El pozo
- `z1_o01.obstacle.text`: Un pozo vertical baja a la oscuridad. A media altura se ve un saliente con un arcón.
- `z1_o01.obstacle.use`: {who} ata la cuerda al torno y baja hasta el saliente.
- `z1_o01.obstacle.missing`: Necesitaremos una cuerda para bajar. En la tienda del pueblo venden.

#### Cámara de las poleas (`z1_r07`)

- `z1_r07.name`: Cámara de las poleas
- `z1_r07.description` _(no se muestra al jugador; contexto)_: Las cadenas de un montacargas desaparecen en el techo. Una plataforma de mineral se balancea sola sobre el suelo.
- _Conecta con: Galería de extracción_

**Diálogo `z1_d02`**
- `z1_d02.lines[0]` **Narrador:** Tres golpes secos llegan del conducto de ventilación.
- `z1_d02.lines[1]` **Narrador:** Una voz lejana susurra: «No encendáis la luz… donde cae el agua».
- `z1_d02.lines[2]` **Narrador:** Luego, silencio.

**Diálogo `z1_d02b`** — _SOLO SI VA TIKO_
- `z1_d02b.lines[0]` **Tiko:** Hay marcas recientes en el torno. Alguien utilizó el montacargas después de que abandonaran la mina.

**Escena `z1_p02` (Prueba)**
- `z1_p02.title`: Las maderas en tensión
- `z1_p02.text`: La plataforma del montacargas ha quedado atrapada entre maderas caídas. Sobre ella cuelga una bolsa de suministros, y el peso amenaza con hundir los apoyos.
- `z1_p02.question`: ¿Cómo recuperas la bolsa?
- `z1_p02.options[0].label`: Levantar la madera más pesada _(Fuerza CD 12)_
  - `z1_p02.options[0].ok.text`: Levantas la madera y liberas la bolsa de suministros. [objeto: Poción de curación]
  - `z1_p02.options[0].fail.text`: La madera cede y te obliga a retroceder. [daño 1d4]
- `z1_p02.options[1].label`: Calcular cómo liberar los apoyos _(Inteligencia CD 11)_
  - `z1_p02.options[1].ok.text`: Repartes el peso entre los apoyos y liberas la bolsa. [objeto: Poción de curación]
  - `z1_p02.options[1].fail.text`: La madera cede y te obliga a retroceder.
- `z1_p02.options[2].label`: Alcanzar la bolsa entre las vigas _(Constitución CD 12)_
  - `z1_p02.options[2].ok.text`: Alcanzas la bolsa sin mover las vigas. [objeto: Poción de curación]
  - `z1_p02.options[2].fail.text`: La madera cede y te obliga a retroceder. [daño 1d4]
- `z1_p02.fallback.text` (si fallan todas): No consigues recuperar lo que buscabas y te retiras. [-5 oro]

#### Pasadizo de las marcas (`z1_r08`)

- `z1_r08.name`: Pasadizo de las marcas
- `z1_r08.description` _(no se muestra al jugador; contexto)_: En las paredes, la tiza de los mineros se mezcla con flechas goblins que apuntan en sentido contrario.
- _Conecta con: Almacén de herramientas_

**Diálogo `z1_d05`**
- `z1_d05.lines[0]` **Narrador:** Las marcas de los mineros señalan la salida; las de los goblins, el pozo.
- `z1_d05.lines[1]` **Narrador:** Una mano temblorosa escribió con tiza: «Abajo no cantan los hombres».

**Cofre `z1_c04`** _(2 oro; —)_

#### Cámara del agua negra (`z1_r09`)

- `z1_r09.name`: Cámara del agua negra
- `z1_r09.description` _(no se muestra al jugador; contexto)_: Un manantial brota entre las rocas y desaparece por una fisura. Bajo la costra oscura del agua brilla un destello violeta.
- _Conecta con: Campamento abandonado_

**Diálogo `z1_d08`**
- `z1_d08.lines[0]` **Narrador:** El agua devuelve un reflejo violáceo, aunque no hay ninguna luz sobre tu cabeza.
- `z1_d08.lines[1]` **Héroe:** Ese brillo viene de las profundidades. Quizá explique lo que ocurre en la mina.

**Combate `z1_e09`**: Rata del agua negra (Giant Rat, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `z1_e09.enemies[n].name`)_

**Escena `z1_q02` (Decisión)** — _después de z1_e09, ilustración: escena_minero_agua_negra_
- `z1_q02.title`: El minero en el agua negra
- `z1_q02.text`: Un minero enano exhausto, empapado por el agua negra, te tiende la mano y pide ayuda.
- `z1_q02.question`: ¿Cómo le ayudas?
- `z1_q02.options[0].label`: Darle una poción de curación _(requiere Poción de curación)_
  - `z1_q02.options[0].ok.text`: Recupera el aliento. «Los goblins conocen una ruta de mantenimiento que los mineros habían olvidado». [entrega: Poción de curación; descubre secreto z1_s01 → exit:z1_r05]
- `z1_q02.options[1].label`: Guiarle entre las piedras _(Sabiduría CD 12)_
  - `z1_q02.options[1].ok.text`: Le ayudas a ponerse a salvo. Agradecido, te cuenta lo que sabe de una ruta de mantenimiento. [descubre secreto z1_s01 → exit:z1_r05]
  - `z1_q02.options[1].fail.text`: Intentas guiarle, pero resbala. Consigue salir del agua, exhausto, y se aleja sin poder hablar.

#### Caseta del entibador (`z1_s01_r01`) — ÁREA SECRETA

- `z1_s01_r01.name`: Caseta del entibador
- `z1_s01_r01.description` _(no se muestra al jugador; contexto)_: Un banco de trabajo junto a una pared con cinco marcas de altura infantil, hechas en años distintos.
- _Conecta con: Almacén de herramientas (paso secreto)_

**Diálogo `z1_d04`**
- `z1_d04.lines[0]` **Narrador:** Una nota del entibador: reforzó los pasos para que los aprendices volvieran sanos.
- `z1_d04.lines[1]` **Narrador:** La última línea está tachada: «Nos han prohibido cerrar la bajada».

**Combate `z1_e07`**: Rata del banco (Giant Rat, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `z1_e07.enemies[n].name`)_

**Cofre `z1_c03`** _(5 oro; Poción de curación)_

#### Sala de avisos (`z1_s02_r01`) — ÁREA SECRETA

- `z1_s02_r01.name`: Sala de avisos
- `z1_s02_r01.description` _(no se muestra al jugador; contexto)_: Un tablero con fichas de turnos y una campana rota que nadie llegó a tocar.
- _Conecta con: Cruce de los raíles (paso secreto)_

**Diálogo `z1_d06`**
- `z1_d06.lines[0]` **Narrador:** Un parte ordena tocar la campana cuando «la piedra del fondo vuelva a brillar».
- `z1_d06.lines[1]` **Narrador:** La cuerda de la campana está cortada con una hoja afilada.

**Combate `z1_e08`**: Goblin rebuscador (Goblin Warrior, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `z1_e08.enemies[n].name`)_

**Cofre `z1_c05`** _(7 oro; Poción de curación)_

### Zona 2: Las ruinas enanas (`z2`)

- `z2.name`: Las ruinas enanas
- `z2.description`: Un antiguo complejo enano construido alrededor de una ciudad minera olvidada. Las columnas talladas y las puertas monumentales contrastan con los campamentos goblins. Los excavadores han despertado criaturas que llevaban siglos ocultas. Aquí se incorpora el primer aliado. _(no se muestra al jugador)_

**Diálogo al entrar en la zona** (`z2.entry_dialogue`):
- `z2.entry_dialogue[0]` **Narrador:** Bajo la mina se extienden los restos de una ciudad enana, sepultada mucho antes de que empezaran las excavaciones.
- `z2.entry_dialogue[1]` **Narrador:** Entre pilares agrietados y antiguos emblemas, los goblins han improvisado sus refugios. Algo se mueve al otro lado de las piedras.
- `z2.entry_dialogue[2]` **Héroe:** Orvane no vino solo por los mineros. Algo de este lugar le interesa.

**Pendientes del diario** (se apuntan al llegar a «desde» y se borran al llegar a «hasta»):
- `z2_j01.text` _(desde z2_r01, hasta z2_b01)_: Una reja deja ver un corredor al que todavía no se puede llegar.
- `z2_j02.text` _(desde z2_r09, hasta z4_r09)_: Los nombres de los mineros aparecen en un registro de trabajos forzados.
- `z2_j03.text` _(desde z2_r04, hasta z2_s01)_: Un respiradero parece llevar a una estancia olvidada.
- `z2_j04.text` _(desde z2_r07, hasta z2_s02)_: Una piedra con el emblema de los canteros tiene un desgaste extraño.

#### Vestíbulo de los canteros (`z2_r01`)

- `z2_r01.name`: Vestíbulo de los canteros
- `z2_r01.description` _(no se muestra al jugador; contexto)_: Un vestíbulo enano con columnas robustas y relieves de antiguos mineros. Las marcas de los picos goblins destrozan parte de las inscripciones.
- _Conecta con: Pozo de las profundidades (escalera abajo), Prisión de los excavadores, Patio de los hornos (reja)_

**Diálogo `z2_d01`**
- `z2_d01.lines[0]` **Narrador:** Una antigua defensa enana sigue activa. Alguien tendrá que encontrar cómo desactivarla.
- `z2_d01.lines[1]` **Héroe:** No podré mover esa palanca desde aquí.

**Escena `z2_ev01` (Decisión)** — _solo al volver a la zona, después de z2_b01, ilustración: pnj_buhonera_
- `z2_ev01.title`: La mercader del umbral
- `z2_ev01.text`: Una mercader ambulante os ofrece remedios para las heridas y los venenos de las profundidades.
- `z2_ev01.question`: ¿Qué quieres comprar?
- `z2_ev01.options[0].label`: Una poción de curación _(cuesta 20 oro)_
  - `z2_ev01.options[0].ok.text`: «Que os dure.» [objeto: Poción de curación]
- `z2_ev01.options[1].label`: Un antídoto _(cuesta 15 oro)_
  - `z2_ev01.options[1].ok.text`: «Para las arañas de abajo.» [objeto: Antídoto]
- `z2_ev01.options[2].label`: Nada, gracias
  - `z2_ev01.options[2].ok.text`: «Volveré a Valdescarcha. Suerte ahí abajo.»

#### Prisión de los excavadores (`z2_r02`)

- `z2_r02.name`: Prisión de los excavadores
- `z2_r02.description` _(no se muestra al jugador; contexto)_: Una antigua cámara de almacenamiento ha sido transformada en prisión. Una figura pequeña permanece encadenada a una columna. La liberación del prisionero permite incorporar al primer aliado antes de cualquier combate de la zona.
- _Conecta con: Vestíbulo de los canteros, Galería de las arañas (puerta), Corredor de las balanzas_

**Aliado de la zona 2** (por defecto Tiko):
_Presentación de Tiko:_
- `z2_r02.ally.default_scene[0]` **Narrador:** Un mediano encadenado levanta la cabeza al oírte.
- `z2_r02.ally.default_scene[1]` **Tiko:** ¡Por fin! Soy Tiko Manosrápidas. Estos pieles verdes no saben con quién se han metido.
- `z2_r02.ally.default_scene[2]` **Tiko:** Me colé aquí buscando tesoros. Necesito salir y tú necesitas a alguien con mis habilidades.
_Presentación de Brunna si sustituye a Tiko:_
- `z2_r02.ally.brunna_scene[0]` **Narrador:** Una enana herida está encerrada en una jaula de hierro.
- `z2_r02.ally.brunna_scene[1]` **Brunna:** ¡Brunna Piedrahonda! Los goblins me capturaron al huir de la mina.
- `z2_r02.ally.brunna_scene[2]` **Brunna:** Me negué a revelar los accesos inferiores. Si me liberas, lucharé a tu lado.

**Combate `z2_e01`**: Capataz goblin (Goblin Boss, vanguardia, Cimitarra), Carcelero goblin (Goblin Warrior, vanguardia, Cimitarra). _(Nombres de enemigos editables como `z2_e01.enemies[n].name`)_

**Descanso `z2_rest2`** _(corto)_
- `z2_rest2.name`: Rincón resguardado
- `z2_rest2.description`: Un hueco tranquilo donde recobrar el aliento; permite regresar a Valdescarcha.

**Cofre con obstáculo `z2_o02`** _(4 oro; Poción de curación; necesita Herramientas de ladrón o Palanqueta)_
- `z2_o02.obstacle.title`: Celda cerrada
- `z2_o02.obstacle.text`: Una celda cerrada con un candado oxidado. Dentro hay un fardo.
- `z2_o02.obstacle.use`: {who} fuerza el candado con {item}.
- `z2_o02.obstacle.missing`: El candado no cede a mano: harían falta herramientas de ladrón o una palanqueta.

#### Galería de las arañas (`z2_r03`)

- `z2_r03.name`: Galería de las arañas
- `z2_r03.description` _(no se muestra al jugador; contexto)_: Una galería cubierta de telarañas atraviesa antiguas estatuas enanas. Los cuerpos de varios goblins cuelgan del techo. La oscuridad oculta una criatura peligrosa.
- _Conecta con: Prisión de los excavadores (puerta), Sala de los murciélagos_

**Combate `z2_e02`** _(empieza al verlo)_: Tejedora de las ruinas (Giant Spider, vanguardia, Mordisco venenoso). _(Nombres de enemigos editables como `z2_e02.enemies[n].name`)_

**Trampa `z2_t01`** _(si no se detecta, se lee la descripción)_
- `z2_t01.name`: Red de captura
- `z2_t01.description`: Una red de seda oculta entre las piedras se desprende del techo y atrapa al primero que pisa el pasillo.

**Cofre con obstáculo `z2_o01`** _(7 oro; Antídoto; necesita Antorcha o Fuego de alquimista)_
- `z2_o01.obstacle.title`: Telaraña
- `z2_o01.obstacle.text`: Una telaraña gruesa tapa un hueco lateral. Detrás se adivinan los restos de un minero.
- `z2_o01.obstacle.use`: {who} prende la telaraña con {item} y arde en un momento.
- `z2_o01.obstacle.missing`: Esta telaraña no se corta: habría que quemarla con una antorcha o con fuego de alquimista.

#### Sala de los murciélagos (`z2_r04`)

- `z2_r04.name`: Sala de los murciélagos
- `z2_r04.description` _(no se muestra al jugador; contexto)_: Una sala abovedada contiene antiguos respiraderos. El techo está cubierto de murciélagos que reaccionan al ruido y a la luz.
- _Conecta con: Galería de las arañas, Cámara del capataz, Puerta de la ciudad hundida (paso secreto), Archivo de las cuadrillas, Puesto del vigía (paso secreto)_

**Combate `z2_e03`**: Enjambre de murciélagos (Swarm of Bats, vanguardia, Mordiscos), Cazador goblin (Goblin Warrior, retaguardia, Arco corto). _(Nombres de enemigos editables como `z2_e03.enemies[n].name`)_

**Trampa `z2_t02`** _(si no se detecta, se lee la descripción)_
- `z2_t02.name`: Placa de presión enana
- `z2_t02.description`: Una placa de piedra activa dardos ocultos en las paredes.

**Descanso `z2_rest1`** _(corto)_
- `z2_rest1.name`: Alcoba de los canteros
- `z2_rest1.description`: Una alcoba protegida por una puerta de piedra permite realizar un descanso corto una vez despejada la sala.

**Secreto `z2_s01`** _(abre exit:z2_r06; se lee al descubrirlo)_
- `z2_s01.description`: Un respiradero enano conecta con un pasadizo que evita la cámara del capataz.

**Escena `z2_s01_pista` (Pista de secreto)** — _abre el secreto z2_s01_
- `z2_s01_pista.title`: La grieta de los murciélagos
- `z2_s01_pista.text`: Entre los arcos derruidos, los murciélagos esquivan una grieta de la escalinata. Quizá haya algo detrás.
- `z2_s01_pista.question`: ¿Cómo lo buscáis?
- `z2_s01_pista.options[0].label`: Observar su vuelo junto a los arcos _(Sabiduría CD 12)_
  - `z2_s01_pista.options[0].ok.text`: El vuelo de los murciélagos os permite localizar un conducto hacia otra sala. [descubre secreto z2_s01 → exit:z2_r06]
  - `z2_s01_pista.options[0].fail.text`: No localizáis el origen de la corriente.
- `z2_s01_pista.options[1].label`: Examinar las juntas de la escalinata _(Inteligencia CD 13)_
  - `z2_s01_pista.options[1].ok.text`: Las juntas de la escalinata delatan un conducto hacia otra sala. [descubre secreto z2_s01 → exit:z2_r06]
  - `z2_s01_pista.options[1].fail.text`: No localizáis el origen de la corriente.

#### Cámara del capataz (`z2_r05`)

- `z2_r05.name`: Cámara del capataz
- `z2_r05.description` _(no se muestra al jugador; contexto)_: Una cámara de mando enana ha sido ocupada por los últimos goblins. Hay mapas de excavación, herramientas y una mesa con piezas de oro.
- _Conecta con: Sala de los murciélagos, Puerta de la ciudad hundida (puerta), Patio de los hornos (puerta)_

**Combate `z2_e04`**: Guardia del capataz (Goblin Warrior, vanguardia, Cimitarra). _(Nombres de enemigos editables como `z2_e04.enemies[n].name`)_

**Cofre `z2_c01`** _(9 oro; Martillo de guerra +1)_

**Diálogo `z2_d07b`** — _SOLO SI VA TIKO_
- `z2_d07b.lines[0]` **Tiko:** El capataz guardaba más mapas que oro. Hay rutas que no quería que nadie conociera.

#### Puerta de la ciudad hundida (`z2_r06`)

- `z2_r06.name`: Puerta de la ciudad hundida
- `z2_r06.description` _(no se muestra al jugador; contexto)_: Una puerta monumental enana permanece abierta. Más allá se extienden corredores silenciosos que conducen a una región funeraria.
- _Conecta con: Cámara del capataz (puerta), Galería de los tributos_

**Combate `z2_e05`**: Excavadores goblin (Goblin Warrior, vanguardia, Pico de minero), Arquero excavador (Goblin Warrior, retaguardia, Arco corto). _(Nombres de enemigos editables como `z2_e05.enemies[n].name`)_

**Trampa `z2_t03`** _(si no se detecta, se lee la descripción)_
- `z2_t03.name`: Martillo basculante
- `z2_t03.description`: Un mecanismo enano oculto acciona un enorme martillo de piedra al cruzar una losa.

**Escena `z2_p03` (Prueba)**
- `z2_p03.title`: El umbral de los muertos
- `z2_p03.text`: Entre los arcos derruidos y la escalinata, unas monedas brillan junto a un brasero. Las losas agrietadas amenazan con ceder.
- `z2_p03.question`: ¿Cómo alcanzáis las monedas sin hundir las losas?
- `z2_p03.options[0].label`: Buscar un paso firme entre las grietas _(Sabiduría CD 13)_
  - `z2_p03.options[0].ok.text`: Avanzáis sobre las losas firmes y recogéis las monedas sin mover los escombros. [+4 oro]
  - `z2_p03.options[0].fail.text`: Una losa se hunde y os golpeáis al retroceder. [daño 1d4]
- `z2_p03.options[1].label`: Examinar los apoyos de los arcos _(Inteligencia CD 12)_
  - `z2_p03.options[1].ok.text`: Identificáis las piedras que soportan la bóveda y recuperáis las monedas. [+4 oro]
  - `z2_p03.options[1].fail.text`: Un cascote cae cerca y os obliga a retroceder.
- `z2_p03.fallback.text` (si fallan todas): Los escombros cubren las monedas. Decidís no arriesgaros más.

#### Galería de los tributos (`z2_r07`)

- `z2_r07.name`: Galería de los tributos
- `z2_r07.description` _(no se muestra al jugador; contexto)_: Una galería de salida conserva un cofre de tributos enanos. Un último capataz goblin protege el paso hacia la cripta.
- _Conecta con: Puerta de la ciudad hundida, Umbral de los reyes (escalera abajo), Sala de los juramentos (paso secreto)_

**Combate `z2_e06`** _(empieza al verlo)_: Capataz de la salida (Goblin Boss, vanguardia, Cimitarra). _(Nombres de enemigos editables como `z2_e06.enemies[n].name`)_

**Secreto `z2_s02`** _(abre chest:z2_c02; se lee al descubrirlo)_
- `z2_s02.description`: Una piedra con el emblema de los antiguos canteros oculta un pequeño cofre de tributos.

**Cofre `z2_c02`** _(13 oro; Estuche de curandero)_

**Escena `z2_s02_pista` (Pista de secreto)** — _abre el secreto z2_s02_
- `z2_s02_pista.title`: El emblema gastado
- `z2_s02_pista.text`: Entre los pilares y la escalinata, una hilera de bloques tiene juntas distintas a las del resto de la sala. Quizá los canteros ocultaron algo en la mampostería.
- `z2_s02_pista.question`: ¿Cómo examináis las piedras?
- `z2_s02_pista.options[0].label`: Buscar juntas menos erosionadas _(Sabiduría CD 13)_
  - `z2_s02_pista.options[0].ok.text`: Las juntas de los bloques revelan dónde se oculta un cofre entre las ruinas. [descubre secreto z2_s02 (cofre oculto)]
  - `z2_s02_pista.options[0].fail.text`: No dais con ello por ahí.
- `z2_s02_pista.options[1].label`: Comparar el ensamblaje de los bloques _(Inteligencia CD 12)_
  - `z2_s02_pista.options[1].ok.text`: Las juntas de los bloques revelan dónde se oculta un cofre entre las ruinas. [descubre secreto z2_s02 (cofre oculto)]
  - `z2_s02_pista.options[1].fail.text`: No dais con ello por ahí.

#### Corredor de las balanzas (`z2_r08`)

- `z2_r08.name`: Corredor de las balanzas
- `z2_r08.description` _(no se muestra al jugador; contexto)_: Dos balanzas gigantes vigilan un pasillo donde se pesaba el mineral.
- _Conecta con: Prisión de los excavadores_

**Diálogo `z2_d03`**
- `z2_d03.lines[0]` **Narrador:** Unas cifras talladas relacionan el mineral extraído con los nombres de las cuadrillas.
- `z2_d03.lines[1]` **Héroe:** Han borrado el final del registro.

**Escena `z2_q01` (Decisión)** — _ilustración: escena_registro_excavador_
- `z2_q01.title`: El registro del excavador
- `z2_q01.text`: Un excavador goblin aprieta un libro contra el pecho y os mira con desconfianza. Parece dispuesto a negociar.
- `z2_q01.question`: ¿Cómo consigues el registro?
- `z2_q01.options[0].label`: Negociar su entrega _(Carisma CD 12)_
  - `z2_q01.options[0].ok.text`: Os entrega el registro. Una anotación menciona una ruta de ventilación que los excavadores intentaban ocultar. [descubre secreto z2_s01 → exit:z2_r06]
  - `z2_q01.options[0].fail.text`: El goblin te arranca diez monedas a cambio de enseñarte el libro y huye con él. [-10 oro]
- `z2_q01.options[1].label`: Arrebatárselo _(Destreza CD 13)_
  - `z2_q01.options[1].ok.text`: Se lo quitáis antes de que reaccione. Señala un respiradero escondido. [descubre secreto z2_s01 → exit:z2_r06]
  - `z2_q01.options[1].fail.text`: El goblin escapa dando voces. Sus compañeros estarán prevenidos. [un enemigo más en z2_e04]
- `z2_q01.options[2].label`: Dejarle y seguir
  - `z2_q01.options[2].ok.text`: El goblin desaparece entre las balanzas.

**Combate `z2_pat01`**: Vigilante goblin (Goblin Warrior, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `z2_pat01.enemies[n].name`)_

**Escena `z2_pat01_paso` (Prueba)** — _solo al volver a la zona, después de z2_r07_
- `z2_pat01_paso.title`: Vigilantes de la ciudad
- `z2_pat01_paso.text`: Unos vigilantes goblins inspeccionan su botín, distraídos por una discusión.
- `z2_pat01_paso.question`: ¿Qué hacéis?
- `z2_pat01_paso.options[0].label`: Luchar
  - `z2_pat01_paso.options[0].ok.text`: Se interponen y llaman a gritos a sus compañeros. [empieza el combate z2_pat01]
- `z2_pat01_paso.options[1].label`: Esquivarlos _(Destreza CD 13)_
  - `z2_pat01_paso.options[1].ok.text`: Os ocultáis tras los contrapesos hasta que se van. [elimina el combate z2_pat01]
  - `z2_pat01_paso.options[1].fail.text`: Os descubren. [empieza el combate z2_pat01]
- `z2_pat01_paso.options[2].label`: Espantarlos _(Carisma CD 13)_
  - `z2_pat01_paso.options[2].ok.text`: Les decís que el capataz ya no puede protegerles. Huyen. [elimina el combate z2_pat01]
  - `z2_pat01_paso.options[2].fail.text`: No se lo tragan. [empieza el combate z2_pat01]

#### Archivo de las cuadrillas (`z2_r09`)

- `z2_r09.name`: Archivo de las cuadrillas
- `z2_r09.description` _(no se muestra al jugador; contexto)_: Hileras de tablillas de piedra con nombres y turnos. Varias han sido arrancadas con violencia.
- _Conecta con: Sala de los murciélagos_

**Diálogo `z2_d06`**
- `z2_d06.lines[0]` **Narrador:** Una tablilla reciente tiene nombres escritos con carbón sobre las inscripciones antiguas.
- `z2_d06.lines[1]` **Héroe:** Son nombres de mineros de Valdescarcha. Alguien registró sus turnos de trabajo forzado.

**Diálogo `z2_d06b`** — _SOLO SI VA BRUNNA_
- `z2_d06b.lines[0]` **Brunna:** Aquí guardaban las fichas de las cuadrillas. La del muchacho que busco debería estar entre ellas.

**Cofre `z2_c06`** _(5 oro; —)_

#### Patio de los hornos (`z2_r10`)

- `z2_r10.name`: Patio de los hornos
- `z2_r10.description` _(no se muestra al jugador; contexto)_: Un patio con tres hornos de fundición, dos apagados y uno aún encendido. Tras uno de ellos está la palanca de la reja del vestíbulo.
- _Conecta con: Cámara del capataz (puerta), Vestíbulo de los canteros (reja)_

**Combate `z2_e08`**: Goblin de los hornos (Goblin Warrior, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `z2_e08.enemies[n].name`)_

**Escena `z2_q02` (Decisión)** — _ilustración: escena_rendicion_hornos_
- `z2_q02.title`: La rendición en los hornos
- `z2_q02.text`: Dos goblins abandonan sus armas y se arrodillan. Aseguran que no quieren seguir luchando.
- `z2_q02.question`: ¿Les dejas marchar?
- `z2_q02.options[0].label`: Aceptar su rendición
  - `z2_q02.options[0].ok.text`: Se van sin mirar atrás. [elimina el combate z2_e08]
- `z2_q02.options[1].label`: Exigirles el botín _(Carisma CD 12)_
  - `z2_q02.options[1].ok.text`: Os dan una bolsa y se marchan. [+5 oro; elimina el combate z2_e08]
  - `z2_q02.options[1].fail.text`: Se miran, recogen las armas y atacan. [empieza el combate z2_e08]
- `z2_q02.options[2].label`: Cerrarles el paso
  - `z2_q02.options[2].ok.text`: Un tercero sale de detrás del horno. Pelean. [un enemigo más en z2_e08; empieza el combate z2_e08]

**Palanca `z2_b01_open`**
- `z2_b01_open.name`: Reja de los turnos
- `z2_b01_open.lines[0]` **Narrador:** Bajáis la palanca. La reja asciende con un gemido de hierro antiguo.
- `z2_b01_open.lines[1]` **Héroe:** Es el corredor que vimos al entrar en la ciudad. Ya tenemos camino de vuelta.
- `z2_b01_open.text`: La reja del vestíbulo queda abierta: ahora hay un atajo entre este patio y la entrada de las ruinas.

#### Puesto del vigía (`z2_s01_r01`) — ÁREA SECRETA

- `z2_s01_r01.name`: Puesto del vigía
- `z2_s01_r01.description` _(no se muestra al jugador; contexto)_: Una mesa orientada hacia el conducto y un cuaderno abierto por su última página.
- _Conecta con: Sala de los murciélagos (paso secreto)_

**Diálogo `z2_d05`**
- `z2_d05.lines[0]` **Narrador:** El cuaderno recoge turnos de vigilancia enanos.
- `z2_d05.lines[1]` **Narrador:** La última frase avisa de un sonido en la cripta, «como una oración dicha al revés».

**Diálogo `z2_d05b`** — _SOLO SI VA BRUNNA_
- `z2_d05b.lines[0]` **Brunna:** Los canteros no dejaban un puesto sin entregar el relevo. Algo interrumpió aquel turno.

**Combate `z2_e07`**: Goblin escondido (Goblin Warrior, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `z2_e07.enemies[n].name`)_

**Cofre `z2_c03`** _(13 oro; Poción de curación)_

#### Sala de los juramentos (`z2_s02_r01`) — ÁREA SECRETA

- `z2_s02_r01.name`: Sala de los juramentos
- `z2_s02_r01.description` _(no se muestra al jugador; contexto)_: Un círculo de taburetes rodea un pedestal con juramentos de canteros escritos en tablillas.
- _Conecta con: Galería de los tributos (paso secreto)_

**Diálogo `z2_d10`**
- `z2_d10.lines[0]` **Narrador:** Juraron cerrar las minas si veían «luces sin fuego» bajo el sepulcro.
- `z2_d10.lines[1]` **Narrador:** Una tablilla rota conserva dos palabras: «No descendáis».

**Combate `z2_e09`**: Centinela de los juramentos (Skeleton, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `z2_e09.enemies[n].name`)_

**Cofre `z2_c05`** _(16 oro; Poción de curación)_

### Zona 3: La cripta real de Aldric el Olvidado (`z3`)

- `z3.name`: La cripta real de Aldric el Olvidado
- `z3.description`: Una necrópolis enana construida bajo la ciudad. Las cámaras funerarias están cubiertas de polvo, las tumbas han sido profanadas y una niebla sobrenatural recorre los pasillos. En esta zona se incorpora el segundo aliado. _(no se muestra al jugador)_

**Diálogo al entrar en la zona** (`z3.entry_dialogue`):
- `z3.entry_dialogue[0]` **Narrador:** Las ruinas dan paso a una cripta donde sobreviven los nombres de antiguos reyes enanos.
- `z3.entry_dialogue[1]` **Narrador:** El aire está inmóvil. Una claridad pálida recorre las tumbas y algo roza una losa desde dentro.
- `z3.entry_dialogue[2]` **Héroe:** Si Orvane ha perturbado este lugar, descubriré por qué.

**Pendientes del diario** (se apuntan al llegar a «desde» y se borran al llegar a «hasta»):
- `z3_j01.text` _(desde z3_r01, hasta z3_r10)_: Un relieve muestra a Aldric cerrando una puerta, sin explicar por qué.
- `z3_j02.text` _(desde z3_r09, hasta z3_r07)_: El nombre de Aldric falta en algunos registros de su propia cripta.
- `z3_j03.text` _(desde z3_r05, hasta z3_s01)_: Una lápida parece ocultar algo más que una inscripción.
- `z3_j04.text` _(desde z3_r07, hasta z3_s02)_: El pedestal del sepulcro tiene señales de una apertura reciente.

#### Umbral de los reyes (`z3_r01`)

- `z3_r01.name`: Umbral de los reyes
- `z3_r01.description` _(no se muestra al jugador; contexto)_: Una escalera conduce a una cámara funeraria cubierta de niebla. Dos estatuas de guerreros enanos custodian una inscripción que prohíbe perturbar el descanso real.
- _Conecta con: Galería de los tributos (escalera abajo), Capilla de los antepasados (puerta)_

**Diálogo `z3_d01`**
- `z3_d01.lines[0]` **Narrador:** Un relieve recuerda al rey enano Aldric y a los guerreros que defendieron su último juramento.
- `z3_d01.lines[1]` **Héroe:** No es una coronación: alguien decidió quedarse atrás.

#### Capilla de los antepasados (`z3_r02`)

- `z3_r02.name`: Capilla de los antepasados
- `z3_r02.description` _(no se muestra al jugador; contexto)_: Una pequeña capilla conserva un altar enano y restos de velas. Un superviviente protege la entrada a las cámaras interiores. El aliado se incorpora antes de que el grupo encuentre enemigos.
- _Conecta con: Umbral de los reyes (puerta), Sala de los guardianes (puerta), Cámara de las cenizas_

**Aliado de la zona 3** (por defecto Hermano Edmund):
_Presentación de Hermano Edmund:_
- `z3_r02.ally.default_scene[0]` **Narrador:** Un clérigo sostiene un símbolo sagrado mientras contiene a los muertos.
- `z3_r02.ally.default_scene[1]` **Hermano Edmund:** Soy el hermano Edmund. Cuando murió el último guardián enano, mi orden heredó su juramento: velar la tumba del rey Aldric.
- `z3_r02.ally.default_scene[2]` **Hermano Edmund:** Aldric debe descansar. Orvane ha profanado su tumba. Os acompañaré hasta el final.
_Presentación de Brunna si sustituye a Hermano Edmund:_
- `z3_r02.ally.brunna_scene[0]` **Narrador:** Brunna emerge de una cámara lateral, cubierta de polvo y heridas.
- `z3_r02.ally.brunna_scene[1]` **Brunna:** Los muertos me cerraron el paso en la cripta. Me refugié aquí, pero quedé atrapada.
- `z3_r02.ally.brunna_scene[2]` **Brunna:** He seguido las marcas de los excavadores. ¡Terminemos lo que empezamos!

**Descanso `z3_rest2`** _(corto)_
- `z3_rest2.name`: Rincón resguardado
- `z3_rest2.description`: Un hueco tranquilo donde recobrar el aliento; permite regresar a Valdescarcha.

**Cofre con obstáculo `z3_o02`** _(7 oro; Poción de curación; necesita Agua bendita)_
- `z3_o02.obstacle.title`: Espíritu inquieto
- `z3_o02.obstacle.text`: Un espíritu inquieto vela el altar y no os deja acercaros a las ofrendas.
- `z3_o02.obstacle.use`: {who} rocía el altar con agua bendita y el espíritu descansa por fin.
- `z3_o02.obstacle.missing`: Con agua bendita podríamos darle descanso. En la tienda del pueblo venden.

#### Sala de los guardianes (`z3_r03`)

- `z3_r03.name`: Sala de los guardianes
- `z3_r03.description` _(no se muestra al jugador; contexto)_: Una cámara de piedra contiene sarcófagos abiertos. Los esqueletos de antiguos soldados se levantan cuando el grupo se acerca.
- _Conecta con: Capilla de los antepasados (puerta), Galería de las tumbas_

**Combate `z3_e01`**: Guardianes esqueléticos (Skeleton, vanguardia, Espada corta). _(Nombres de enemigos editables como `z3_e01.enemies[n].name`)_

#### Galería de las tumbas (`z3_r04`)

- `z3_r04.name`: Galería de las tumbas
- `z3_r04.description` _(no se muestra al jugador; contexto)_: Un largo corredor contiene nichos funerarios a ambos lados. La niebla oculta parcialmente los cuerpos que yacen entre las tumbas.
- _Conecta con: Sala de los guardianes, Cámara de las ofrendas, Cámara de los nombres perdidos_

**Combate `z3_e02`**: Antiguos sepultureros (Zombie, vanguardia, Golpe putrefacto). _(Nombres de enemigos editables como `z3_e02.enemies[n].name`)_

**Trampa `z3_t01`** _(si no se detecta, se lee la descripción)_
- `z3_t01.name`: Losa funeraria
- `z3_t01.description`: Una losa oculta activa un mecanismo que lanza fragmentos de piedra desde las paredes.

**Diálogo `z3_d04b`** — _SOLO SI VA HERMANO EDMUND_
- `z3_d04b.lines[0]` **Hermano Edmund:** No todos estos muertos eligieron levantarse. Hay que devolverles el silencio.

**Escena `z3_p02` (Prueba)**
- `z3_p02.title`: La losa de los nombres
- `z3_p02.text`: Bajo una losa con nombres grabados hay una ofrenda olvidada. Recuperarla sin dañarla requiere paciencia.
- `z3_p02.question`: ¿Cómo recuperáis lo que hay debajo?
- `z3_p02.options[0].label`: Apartar las piedras más pesadas _(Fuerza CD 14)_
  - `z3_p02.options[0].ok.text`: Liberáis la ofrenda: contiene pequeñas piezas funerarias de oro. [+7 oro]
  - `z3_p02.options[0].fail.text`: Las piedras se os vienen encima. [daño 1d4]
- `z3_p02.options[1].label`: Alcanzar la ofrenda entre las grietas _(Destreza CD 14)_
  - `z3_p02.options[1].ok.text`: Recuperáis las piezas funerarias sin mover toda la piedra. [+7 oro]
  - `z3_p02.options[1].fail.text`: Los escombros se desplazan y ocultan la ofrenda.
- `z3_p02.options[2].label`: Buscar las piedras inestables _(Sabiduría CD 13)_
  - `z3_p02.options[2].ok.text`: Apartáis con cuidado las piedras inestables y recuperáis las piezas de oro. [+7 oro]
  - `z3_p02.options[2].fail.text`: Una piedra rueda y la ofrenda se pierde entre las grietas.
- `z3_p02.fallback.text` (si fallan todas): La ofrenda se pierde. El camino principal sigue libre.

#### Cámara de las ofrendas (`z3_r05`)

- `z3_r05.name`: Cámara de las ofrendas
- `z3_r05.description` _(no se muestra al jugador; contexto)_: Las paredes están decoradas con escenas de la coronación de Aldric. Un sarcófago secundario contiene ofrendas de oro. Los muertos protegen el lugar.
- _Conecta con: Galería de las tumbas, Galería de los centinelas (puerta), Sepulcro de Aldric (paso secreto), Escribanía sellada (paso secreto)_

**Combate `z3_e03`**: Necrófago de las ofrendas (Ghoul, vanguardia, Garras y mordisco), Guardianes de las ofrendas (Skeleton, retaguardia, Arco corto). _(Nombres de enemigos editables como `z3_e03.enemies[n].name`)_

**Secreto `z3_s01`** _(abre exit:z3_r07; se lee al descubrirlo)_
- `z3_s01.description`: Una lápida giratoria oculta una entrada lateral hacia el sepulcro.

**Cofre con obstáculo `z3_o01`** _(13 oro; Pergamino de escudo; necesita Palanqueta)_
- `z3_o01.obstacle.title`: Sarcófago sellado
- `z3_o01.obstacle.text`: Un sarcófago sellado con una losa pesada.
- `z3_o01.obstacle.use`: {who} apalanca la losa y la desliza a un lado.
- `z3_o01.obstacle.missing`: Con una palanqueta moveríamos la losa. En la tienda del pueblo venden.
- `z3_o01.obstacle.alt.try` _(sin objeto, Fuerza CD 14)_: {who} intenta mover la losa a pulso.
- `z3_o01.obstacle.alt.hurt`: La losa resbala y aplasta la mano de {who}

**Diálogo `z3_d06b`** — _SOLO SI VA HERMANO EDMUND_
- `z3_d06b.lines[0]` **Hermano Edmund:** Estas ofrendas no son un botín abandonado. Alguien las dejó para que una historia no se perdiera.

**Escena `z3_s01_pista` (Pista de secreto)** — _abre el secreto z3_s01_
- `z3_s01_pista.title`: Los trazos funerarios
- `z3_s01_pista.text`: La luz de las velas revela trazos repetidos en la piedra de los arcos funerarios. Algunos parecen señalar una dirección.
- `z3_s01_pista.question`: ¿Cómo lo buscáis?
- `z3_s01_pista.options[0].label`: Buscar aire bajo los arcos _(Sabiduría CD 13)_
  - `z3_s01_pista.options[0].ok.text`: La corriente bajo los arcos señala una abertura hacia otra cámara de la cripta. [descubre secreto z3_s01 → exit:z3_r07]
  - `z3_s01_pista.options[0].fail.text`: No lográis seguir la pista.
- `z3_s01_pista.options[1].label`: Comparar los trazos de la piedra _(Inteligencia CD 14)_
  - `z3_s01_pista.options[1].ok.text`: Los trazos de la piedra señalan una abertura hacia otra cámara de la cripta. [descubre secreto z3_s01 → exit:z3_r07]
  - `z3_s01_pista.options[1].fail.text`: No lográis seguir la pista.

#### Galería de los centinelas (`z3_r06`)

- `z3_r06.name`: Galería de los centinelas
- `z3_r06.description` _(no se muestra al jugador; contexto)_: Tres figuras esqueléticas custodian el último corredor antes del sepulcro real. Las paredes muestran escenas de antiguas batallas.
- _Conecta con: Cámara de las ofrendas (puerta), Sepulcro de Aldric, Antesala de las voces_

**Combate `z3_e04`**: Centinelas de Aldric (Skeleton, vanguardia, Espada corta). _(Nombres de enemigos editables como `z3_e04.enemies[n].name`)_

**Trampa `z3_t02`** _(si no se detecta, se lee la descripción)_
- `z3_t02.name`: Lanza del sepulcro
- `z3_t02.description`: Un mecanismo funerario dispara una lanza desde una estatua cuando se pisa una baldosa marcada.

#### Sepulcro de Aldric (`z3_r07`)

- `z3_r07.name`: Sepulcro de Aldric
- `z3_r07.description` _(no se muestra al jugador; contexto)_: Una enorme cámara contiene el sarcófago real. La niebla gira alrededor de la tumba, donde una presencia maligna custodia el acceso al monasterio.
- _Conecta con: Cámara de las ofrendas (paso secreto), Galería de los centinelas (puerta), Atrio de las aguas (escalera abajo), Guardia sin relevo (paso secreto)_

**Combate `z3_e05`**: Necrófago custodio (Ghoul, vanguardia, Garras y mordisco), Muertos del sarcófago (Zombie, vanguardia, Golpe putrefacto). _(Nombres de enemigos editables como `z3_e05.enemies[n].name`)_

**Descanso `z3_rest1`** _(corto)_
- `z3_rest1.name`: Vigilia del rey
- `z3_rest1.description`: La presencia sagrada del sepulcro permite un descanso corto cuando la cámara está despejada.

**Secreto `z3_s02`** _(abre chest:z3_c02; se lee al descubrirlo)_
- `z3_s02.description`: Tras el pedestal real se encuentra una cavidad con un último tributo funerario.

**Cofre `z3_c02`** _(24 oro; Poción de curación mayor)_

**Diálogo `z3_d10b`** — _SOLO SI VA HERMANO EDMUND_
- `z3_d10b.lines[0]` **Hermano Edmund:** Aldric no pidió veneración. Pidió que nadie volviera a usar lo que había condenado.

**Escena `z3_s02_pista` (Pista de secreto)** — _abre el secreto z3_s02_
- `z3_s02_pista.title`: Las losas removidas
- `z3_s02_pista.text`: Bajo un arco funerario, el polvo de las losas está removido. Una corriente fría cruza el suelo.
- `z3_s02_pista.question`: ¿Cómo lo buscáis?
- `z3_s02_pista.options[0].label`: Seguir el aire bajo el arco _(Sabiduría CD 14)_
  - `z3_s02_pista.options[0].ok.text`: Las juntas removidas delatan dónde se oculta un cofre funerario bajo el arco. [descubre secreto z3_s02 (cofre oculto)]
  - `z3_s02_pista.options[0].fail.text`: El frío y el polvo os impiden localizarlo.
- `z3_s02_pista.options[1].label`: Examinar las juntas de las losas _(Inteligencia CD 14)_
  - `z3_s02_pista.options[1].ok.text`: Las juntas removidas delatan dónde se oculta un cofre funerario bajo el arco. [descubre secreto z3_s02 (cofre oculto)]
  - `z3_s02_pista.options[1].fail.text`: El frío y el polvo os impiden localizarlo.

#### Cámara de las cenizas (`z3_r08`)

- `z3_r08.name`: Cámara de las cenizas
- `z3_r08.description` _(no se muestra al jugador; contexto)_: Urnas de piedra apiladas bajo nichos vacíos. La ceniza del suelo se mueve hacia una rendija.
- _Conecta con: Capilla de los antepasados_

**Diálogo `z3_d03`**
- `z3_d03.lines[0]` **Narrador:** En el atril, los nombres aparecen en un orden distinto al de las inscripciones del umbral.
- `z3_d03.lines[1]` **Héroe:** Es una advertencia, no un homenaje. Intentaron impedir que alguien llegara más abajo.

**Escena `z3_p01` (Prueba)**
- `z3_p01.title`: El aire de los antiguos
- `z3_p01.text`: Entre los arcos de la cripta circula aire gélido. Una ofrenda ha quedado en una grieta al pie del muro.
- `z3_p01.question`: ¿Cómo examináis el escondrijo?
- `z3_p01.options[0].label`: Contener el aliento junto al muro _(Constitución CD 13)_
  - `z3_p01.options[0].ok.text`: Al abrigo del arco recuperáis la ofrenda de la grieta. [+5 oro; objeto: Agua bendita]
  - `z3_p01.options[0].fail.text`: El aire helado os obliga a retroceder. [daño 1d4]
- `z3_p01.options[1].label`: Esperar al abrigo de un arco _(Sabiduría CD 13)_
  - `z3_p01.options[1].ok.text`: Al abrigo del arco recuperáis la ofrenda de la grieta. [+5 oro; objeto: Agua bendita]
  - `z3_p01.options[1].fail.text`: El aire helado os obliga a retroceder.
- `z3_p01.options[2].label`: Estudiar las grietas de la piedra _(Inteligencia CD 14)_
  - `z3_p01.options[2].ok.text`: Al abrigo del arco recuperáis la ofrenda de la grieta. [+5 oro; objeto: Agua bendita]
  - `z3_p01.options[2].fail.text`: El aire helado os obliga a retroceder.
- `z3_p01.fallback.text` (si fallan todas): No conseguís recuperar lo que buscabais y os retiráis.

#### Cámara de los nombres perdidos (`z3_r09`)

- `z3_r09.name`: Cámara de los nombres perdidos
- `z3_r09.description` _(no se muestra al jugador; contexto)_: Lápidas sin sarcófago. Sus nombres se guardaron en cajas; una de ellas está abierta y vacía.
- _Conecta con: Galería de las tumbas_

**Diálogo `z3_d05`**
- `z3_d05.lines[0]` **Narrador:** Un documento enumera a los guardianes, pero no al rey.
- `z3_d05.lines[1]` **Héroe:** Aquí falta Aldric. Alguien apartó su nombre de los demás.

**Combate `z3_e06`**: Guardián de los nombres (Skeleton, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `z3_e06.enemies[n].name`)_

**Escena `z3_q01` (Decisión)** — _ilustración: escena_escriba_nombres_
- `z3_q01.title`: El escriba de los nombres
- `z3_q01.text`: Un escriba espectral reclama respeto por los nombres de los muertos. Espera vuestra respuesta.
- `z3_q01.question`: ¿Cómo respondes?
- `z3_q01.options[0].label`: Prometer conservar los nombres _(Carisma CD 13)_
  - `z3_q01.options[0].ok.text`: El escriba asiente y os explica que una lápida giratoria oculta un paso hacia otra cámara de la cripta. [descubre secreto z3_s01 → exit:z3_r07]
  - `z3_q01.options[0].fail.text`: El escriba se desvanece sin creeros.
- `z3_q01.options[1].label`: Dejar 15 monedas de tributo _(cuesta 15 oro)_
  - `z3_q01.options[1].ok.text`: Acepta el tributo y os muestra una lápida giratoria que oculta un paso hacia otra cámara. [descubre secreto z3_s01 → exit:z3_r07]
- `z3_q01.options[2].label`: Despreciar los pergaminos
  - `z3_q01.options[2].ok.text`: El escriba se retira. Unos guardianes surgen entre las lápidas. [un enemigo más en z3_e06; empieza el combate z3_e06]

#### Antesala de las voces (`z3_r10`)

- `z3_r10.name`: Antesala de las voces
- `z3_r10.description` _(no se muestra al jugador; contexto)_: Hornacinas con estatuas sin rostro. Una voz repite palabras de hace siglos cuando alguien pisa el centro.
- _Conecta con: Galería de los centinelas_

**Diálogo `z3_d09`**
- `z3_d09.lines[0]` **Narrador:** Una voz en la cámara: «Que lo enterrado permanezca bajo las aguas y la piedra».
- `z3_d09.lines[1]` **Héroe:** Orvane va a hacer justo lo que ese rey prohibió.

**Escena `z3_q02` (Decisión)** — _ilustración: escena_estatua_sin_rostro_
- `z3_q02.title`: La estatua sin rostro
- `z3_q02.text`: El recuerdo de un guardián sin rostro os impone una prueba de respeto hacia los muertos.
- `z3_q02.question`: ¿Qué juramento pronuncias?
- `z3_q02.options[0].label`: Jurar proteger el sello _(Carisma CD 14)_
  - `z3_q02.options[0].ok.text`: Una voz susurra que Aldric ocultó un secreto a quienes profanasen su memoria. [descubre secreto z3_s02 (cofre oculto)]
  - `z3_q02.options[0].fail.text`: La estatua permanece inmóvil y nadie responde.
- `z3_q02.options[1].label`: Dejar 10 monedas en el cuenco _(cuesta 10 oro)_
  - `z3_q02.options[1].ok.text`: Una voz agradece el tributo y os confía un antiguo secreto de la cripta. [descubre secreto z3_s02 (cofre oculto)]
- `z3_q02.options[2].label`: Guardar silencio
  - `z3_q02.options[2].ok.text`: Seguís adelante sin decir nada.

**Cofre `z3_c06`** _(7 oro; Poción de curación)_

#### Escribanía sellada (`z3_s01_r01`) — ÁREA SECRETA

- `z3_s01_r01.name`: Escribanía sellada
- `z3_s01_r01.description` _(no se muestra al jugador; contexto)_: Un escritorio guarda el borrador de una declaración real que nunca se hizo pública.
- _Conecta con: Cámara de las ofrendas (paso secreto)_

**Diálogo `z3_d07`**
- `z3_d07.lines[0]` **Narrador:** Los escritos cuentan que la fuente del monasterio se utilizó antaño para curar a los enfermos. Aldric temió que aquel poder sirviera después para dominarlos.
- `z3_d07.lines[1]` **Narrador:** El escrito acaba justo antes de la firma del rey.

**Combate `z3_e07`**: Copista muerto (Zombie, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `z3_e07.enemies[n].name`)_

**Cofre `z3_c05`** _(11 oro; Poción de curación mayor)_

#### Guardia sin relevo (`z3_s02_r01`) — ÁREA SECRETA

- `z3_s02_r01.name`: Guardia sin relevo
- `z3_s02_r01.description` _(no se muestra al jugador; contexto)_: Un casco y un escudo ante un asiento de piedra. Bajo el asiento, la lista de las guardias tras la muerte de Aldric.
- _Conecta con: Sepulcro de Aldric (paso secreto)_

**Diálogo `z3_d11`**
- `z3_d11.lines[0]` **Narrador:** Los relevos fueron cada vez menos. La última anotación: «La puerta sigue cerrada; el mundo ya no sabe por qué».
- `z3_d11.lines[1]` **Héroe:** Siguieron velando aunque el reino había olvidado su juramento.

**Combate `z3_e08`**: Último custodio (Skeleton, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `z3_e08.enemies[n].name`)_

**Cofre `z3_c07`** _(15 oro; Poción de curación mayor)_

### Zona 4: El monasterio hundido (`z4`)

- `z4.name`: El monasterio hundido
- `z4.description`: Un monasterio construido en las profundidades de la montaña, parcialmente inundado por aguas subterráneas. Las paredes están cubiertas de símbolos arcanos y cristales luminosos. Maese Orvane ha encontrado el poder que buscaba, pero su cuerpo y su mente han quedado corrompidos. Aquí se incorpora el tercer aliado y se prepara el enfrentamiento final. _(no se muestra al jugador)_

**Diálogo al entrar en la zona** (`z4.entry_dialogue`):
- `z4.entry_dialogue[0]` **Narrador:** Más abajo, el monasterio hundido resiste entre aguas oscuras y columnas recorridas por destellos arcanos.
- `z4.entry_dialogue[1]` **Narrador:** El murmullo del agua se mezcla con un pulso profundo, como si toda la piedra respondiera a una voluntad ajena.
- `z4.entry_dialogue[2]` **Narrador:** Una voz invisible resuena en la estancia: «Habéis llegado demasiado lejos. El poder de Hondaroca será mío».

**Pendientes del diario** (se apuntan al llegar a «desde» y se borran al llegar a «hasta»):
- `z4_j01.text` _(desde z4_r05, hasta z4_e05)_: Los registros señalan un encierro tras la cámara de estudio. Habrá que buscar a los cautivos cuando el paso sea seguro.
- `z4_j03.text` _(desde z4_r03, hasta z4_s01)_: Un cristal apagado guarda un sonido en su interior.
- `z4_j04.text` _(desde z4_r03, hasta z4_r10)_: Las notas del laboratorio hablan de sellos arcanos alterados.
- `z4_j05.text` _(desde z4_r06, hasta z4_s02)_: Los símbolos violetas de la sala de la fuente esperan un amuleto de corteza.

#### Atrio de las aguas (`z4_r01`)

- `z4_r01.name`: Atrio de las aguas
- `z4_r01.description` _(no se muestra al jugador; contexto)_: El atrio está cubierto por una fina capa de agua. Columnas rotas emergen del suelo y una luz violácea se filtra desde las cámaras interiores.
- _Conecta con: Sepulcro de Aldric (escalera abajo), Claustro de los iniciados_

**Cofre con obstáculo `z4_o01`** _(11 oro; Poción de curación; necesita Cuerda)_
- `z4_o01.obstacle.title`: El islote
- `z4_o01.obstacle.text`: Un islote en medio del agua profunda, con un cofre medio hundido.
- `z4_o01.obstacle.use`: {who} lanza la cuerda a una columna y cruzáis agarrados a ella.
- `z4_o01.obstacle.missing`: Con una cuerda cruzaríamos sin mojarnos. En la tienda del pueblo venden.
- `z4_o01.obstacle.alt.try` _(sin objeto, Atletismo CD 13)_: {who} intenta cruzar a nado.
- `z4_o01.obstacle.alt.hurt`: La corriente arrastra a {who} contra las piedras

#### Claustro de los iniciados (`z4_r02`)

- `z4_r02.name`: Claustro de los iniciados
- `z4_r02.description` _(no se muestra al jugador; contexto)_: Un claustro inundado conserva restos de bancos y atriles. Una figura permanece oculta entre los restos de una estancia lateral. El aliado se incorpora antes de cualquier combate de la zona.
- _Conecta con: Atrio de las aguas, Laboratorio de los cristales (puerta), Pasarela de las compuertas_

**Aliado de la zona 4** (por defecto Liss):
_Presentación de Liss:_
- `z4_r02.ally.default_scene[0]` **Narrador:** Una joven elfa sale de su escondite con un libro entre las manos.
- `z4_r02.ally.default_scene[1]` **Liss:** Soy Liss. Fui aprendiz de Orvane, pero su obsesión lo ha convertido en algo monstruoso.
- `z4_r02.ally.default_scene[2]` **Liss:** Conozco sus defensas y sus secretos. Dejadme ayudaros a detenerlo.
_Presentación de Brunna si sustituye a Liss:_
- `z4_r02.ally.brunna_scene[0]` **Narrador:** Brunna aparece desde un conducto lateral, con las ropas empapadas.
- `z4_r02.ally.brunna_scene[1]` **Brunna:** Los cultistas me capturaron al explorar las cámaras inferiores. Escapé por los canales de agua.
- `z4_r02.ally.brunna_scene[2]` **Brunna:** He llegado hasta aquí siguiendo las excavaciones. Ahora acabaremos con ese mago.

#### Laboratorio de los cristales (`z4_r03`)

- `z4_r03.name`: Laboratorio de los cristales
- `z4_r03.description` _(no se muestra al jugador; contexto)_: Una cámara de investigación contiene mesas de piedra, recipientes rotos y cristales que flotan sobre pedestales. Los cultistas vigilan la estancia.
- _Conecta con: Claustro de los iniciados (puerta), Galería de los penitentes, Celda de los escribas (paso secreto)_

**Combate `z4_e01`** _(empieza al verlo)_: Acólitos de Orvane (Cultist, vanguardia, Daga), Acólito arquero (Cultist, retaguardia, Ballesta ligera). _(Nombres de enemigos editables como `z4_e01.enemies[n].name`)_

**Trampa `z4_t01`** _(si no se detecta, se lee la descripción)_
- `z4_t01.name`: Runa de descarga
- `z4_t01.description`: Una runa bajo el agua libera una descarga eléctrica cuando alguien pisa su centro.

**Secreto `z4_s01`** _(abre chest:z4_c01; se lee al descubrirlo)_
- `z4_s01.description`: Un cristal opaco oculta un compartimento con un objeto perteneciente a los antiguos monjes.

**Cofre `z4_c01`** _(22 oro; Pergamino de escudo)_

**Descanso `z4_rest1`** _(corto)_
- `z4_rest1.name`: Cámara de los cristales
- `z4_rest1.description`: Una barrera arcana mantiene a raya a las criaturas del monasterio. Permite realizar un descanso corto cuando la sala está despejada.

**Cofre con obstáculo `z4_o02`** _(16 oro; Poción de curación mayor; necesita Antídoto o Poción de resistencia al veneno)_
- `z4_o02.obstacle.title`: Vapores venenosos
- `z4_o02.obstacle.text`: Unos vapores venenosos salen de una grieta junto a una vitrina de cristales.
- `z4_o02.obstacle.use`: {who} bebe {item} y se acerca a la vitrina entre los vapores.
- `z4_o02.obstacle.missing`: Sin un antídoto o una poción de resistencia al veneno no podemos acercarnos.

**Diálogo `z4_d05b`** — _SOLO SI VA LISS_
- `z4_d05b.lines[0]` **Liss:** Reconozco mi letra en esas placas. Servían para contener la energía, no para liberarla.

**Escena `z4_s01_pista` (Pista de secreto)** — _abre el secreto z4_s01_
- `z4_s01_pista.title`: El cristal opaco
- `z4_s01_pista.text`: Los cristales violetas se reflejan en el agua. Junto a las ruinas, un reflejo se interrumpe y el agua resuena de forma distinta.
- `z4_s01_pista.question`: ¿Cómo seguís la pista?
- `z4_s01_pista.options[0].label`: Escuchar el agua junto a las ruinas _(Sabiduría CD 14)_
  - `z4_s01_pista.options[0].ok.text`: El eco del agua os permite localizar un cofre oculto entre las ruinas. [descubre secreto z4_s01 (cofre oculto)]
  - `z4_s01_pista.options[0].fail.text`: El chapoteo os impide distinguir el eco.
- `z4_s01_pista.options[1].label`: Comparar los reflejos de los cristales _(Inteligencia CD 14)_
  - `z4_s01_pista.options[1].ok.text`: La interrupción del reflejo delata dónde se oculta un cofre. [descubre secreto z4_s01 (cofre oculto)]
  - `z4_s01_pista.options[1].fail.text`: Los reflejos se confunden en el agua.

**Combate `z4_pat01`**: Recolector del cristal (Cultist, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `z4_pat01.enemies[n].name`)_

**Escena `z4_pat01_paso` (Prueba)** — _solo al volver a la zona, después de z4_e01, antes de z4_e05_
- `z4_pat01_paso.title`: Recolectores del cristal
- `z4_pat01_paso.text`: Unos cultistas recogen energía de los cristales para Orvane. Todavía no han dado la alarma.
- `z4_pat01_paso.question`: ¿Qué hacéis?
- `z4_pat01_paso.options[0].label`: Luchar
  - `z4_pat01_paso.options[0].ok.text`: Sueltan los recipientes y os cierran el paso. [empieza el combate z4_pat01]
- `z4_pat01_paso.options[1].label`: Esquivarlos _(Destreza CD 14)_
  - `z4_pat01_paso.options[1].ok.text`: Aprovecháis su distracción para evitar que os descubran. [elimina el combate z4_pat01]
  - `z4_pat01_paso.options[1].fail.text`: Os descubren. [empieza el combate z4_pat01]
- `z4_pat01_paso.options[2].label`: Espantarlos _(Carisma CD 14)_
  - `z4_pat01_paso.options[2].ok.text`: Les advertís de que los cierres de Orvane se desmoronan. Huyen. [elimina el combate z4_pat01]
  - `z4_pat01_paso.options[2].fail.text`: No se lo tragan. [empieza el combate z4_pat01]

#### Galería de los penitentes (`z4_r04`)

- `z4_r04.name`: Galería de los penitentes
- `z4_r04.description` _(no se muestra al jugador; contexto)_: Una galería parcialmente inundada contiene estatuas de monjes arrodillados. Los cultistas han colocado símbolos arcanos sobre sus rostros.
- _Conecta con: Laboratorio de los cristales, Cámara de estudio (puerta), Registro de los cautivos_

**Combate `z4_e02`**: Elementales de vapor (Steam Mephit, vanguardia, Garras y aliento de vapor). _(Nombres de enemigos editables como `z4_e02.enemies[n].name`)_

**Trampa `z4_t02`** _(si no se detecta, se lee la descripción)_
- `z4_t02.name`: Estatua de presión
- `z4_t02.description`: Una estatua enana adaptada por los cultistas libera una descarga de energía al presionar una losa oculta.

**Escena `z4_p02` (Prueba)**
- `z4_p02.title`: El voto de silencio
- `z4_p02.text`: Junto a los cristales violetas, unas monedas y una poción han quedado entre piedras sumergidas. Remover las ruinas podría hacer ruido y atraer atención.
- `z4_p02.question`: ¿Cómo recuperáis la ofrenda sin hacer ruido?
- `z4_p02.options[0].label`: Apartar las piedras bajo el agua _(Fuerza CD 15)_
  - `z4_p02.options[0].ok.text`: Apartáis las piedras sin hacer ruido y recuperáis la poción y las monedas. [+9 oro; objeto: Poción de curación]
  - `z4_p02.options[0].fail.text`: Una piedra se desliza y os golpea la mano. [daño 1d4]
- `z4_p02.options[1].label`: Buscar un hueco seguro entre los cristales _(Sabiduría CD 14)_
  - `z4_p02.options[1].ok.text`: Distinguís un hueco entre los reflejos y recuperáis la poción y las monedas. [+9 oro; objeto: Poción de curación]
  - `z4_p02.options[1].fail.text`: El agua turbia os impide encontrar un acceso seguro.
- `z4_p02.fallback.text` (si fallan todas): La ofrenda sigue entre las piedras sumergidas.

**Combate `z4_e08`**: Devoto rendido (Cultist, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `z4_e08.enemies[n].name`)_

**Escena `z4_ev01` (Decisión)** — _solo al volver a la zona, después de z4_e03, antes de z4_e05, ilustración: escena_cultista_llave_
- `z4_ev01.title`: El devoto que suelta el arma
- `z4_ev01.text`: Un devoto de Orvane, con la túnica empapada, deja caer su daga al agua y se arrodilla ante vosotros.
- `z4_ev01.question`: ¿Qué haces?
- `z4_ev01.options[0].label`: Aceptar su rendición
  - `z4_ev01.options[0].ok.text`: «Orvane mantiene cautivos», confiesa. Os entrega una poción robada antes de huir. [objeto: Poción de curación]
- `z4_ev01.options[1].label`: Atacarle
  - `z4_ev01.options[1].ok.text`: Recoge la daga del agua y se defiende. [empieza el combate z4_e08]

#### Cámara de estudio (`z4_r05`)

- `z4_r05.name`: Cámara de estudio
- `z4_r05.description` _(no se muestra al jugador; contexto)_: Una cámara de estudio contiene libros mojados, instrumentos arcanos y una mesa de alquimia. Los cultistas protegen los últimos recursos del monasterio.
- _Conecta con: Galería de los penitentes (puerta), Santuario de la fuente, Sala de los sellos rotos_

**Combate `z4_e03`**: Devotos de Orvane (Cultist, vanguardia, Daga), Devoto de retaguardia (Cultist, retaguardia, Ballesta ligera). _(Nombres de enemigos editables como `z4_e03.enemies[n].name`)_

**Cofre `z4_c02`** _(16 oro; Varita de proyectiles mágicos)_

#### Santuario de la fuente (`z4_r06`)

- `z4_r06.name`: Santuario de la fuente
- `z4_r06.description` _(no se muestra al jugador; contexto)_: Una fuente circular ocupa el centro de una gran sala. El agua flota en pequeñas esferas y la energía arcana se concentra en el techo. Es el último lugar seguro antes de Orvane.
- _Conecta con: Cámara de estudio, Cámara del poder prohibido (puerta), Depósito del vínculo (paso secreto)_

**Descanso `z4_rest2`** _(corto)_
- `z4_rest2.name`: Fuente de la serenidad
- `z4_rest2.description`: La fuente conserva una energía purificadora. Es el último rincón seguro antes de Orvane.

**Diálogo `z4_d01`**
- `z4_d01.lines[0]` **Narrador:** La energía del monasterio se concentra en una cámara próxima. Allí se encuentra Orvane.
- `z4_d01.lines[1]` **Héroe:** No dejaré que Orvane se lleve ese poder.

**Diálogo `z4_d01b`** — _SOLO SI VA HERMANO EDMUND_
- `z4_d01b.lines[0]` **Hermano Edmund:** Descansad mientras aún podáis. Lo que viene será más difícil.

**Escena `z4_s02_pista` (Pista de secreto)** — _antes de b2_r01_
- `z4_s02_pista.title`: El sello de Umbría
- `z4_s02_pista.text`: Los símbolos violetas de los muros parecen responder a una magia ajena al monasterio. El agua a sus pies vibra suavemente.
- `z4_s02_pista.question`: ¿Qué hacéis?
- `z4_s02_pista.options[0].label`: Observar las ondas bajo los símbolos _(Sabiduría CD 14)_
  - `z4_s02_pista.options[0].ok.text`: Las ondas convergen junto a un pequeño hueco con forma de amuleto de corteza. Aún no tenéis uno que encaje. [marca z4_s02_visto]
  - `z4_s02_pista.options[0].fail.text`: El agua se agita y perdéis el rastro de las ondas.
- `z4_s02_pista.options[1].label`: Interpretar los símbolos violetas _(Inteligencia CD 15)_
  - `z4_s02_pista.options[1].ok.text`: Los trazos evocan la magia de Umbría. Un amuleto de corteza podría activar el sello, pero aún no tenéis uno. [marca z4_s02_visto]
  - `z4_s02_pista.options[1].fail.text`: No conseguís interpretar los trazos.
- `z4_s02_pista.fallback.text` (si fallan todas): Los símbolos siguen brillando sin revelar su secreto.

**Escena `z4_s02_abrir` (Pista de secreto)** — _después de b2_r01, abre el secreto z4_s02_
- `z4_s02_abrir.title`: El sello de Umbría
- `z4_s02_abrir.text`: Al acercar el amuleto de corteza, los símbolos violetas de los muros brillan con más fuerza y las ondas del agua convergen bajo ellos.
- `z4_s02_abrir.question`: ¿Probáis?
- `z4_s02_abrir.options[0].label`: Acercar el amuleto a los símbolos
  - `z4_s02_abrir.options[0].ok.text`: La luz recorre el muro y revela un pasadizo oculto. Habéis encontrado su acceso, pero aún debéis llegar hasta él. [descubre secreto z4_s02]

#### Cámara del poder prohibido (`z4_r07`)

- `z4_r07.name`: Cámara del poder prohibido
- `z4_r07.description` _(no se muestra al jugador; contexto)_: Una enorme sala circular parcialmente sumergida. En el centro flota un cristal oscuro rodeado de símbolos arcanos. Maese Orvane espera sobre una plataforma de piedra. Su cuerpo está deformado por la magia y sus ojos brillan con una luz violeta antinatural.
- _Conecta con: Santuario de la fuente (puerta)_

**Combate `z4_e04`** _(empieza al verlo)_: Guardianes de vapor (Steam Mephit, vanguardia, Garras y aliento de vapor). _(Nombres de enemigos editables como `z4_e04.enemies[n].name`)_

**Combate `z4_e05`**: Maese Orvane (Orvane, retaguardia, Bastón arcano). _(Nombres de enemigos editables como `z4_e05.enemies[n].name`)_

**Diálogo `z4_d12a`** — _SOLO SI VA BRUNNA_
- `z4_d12a.lines[0]` **Brunna:** Orvane, puedes llenar de magia esta montaña. No borrarás los nombres de quienes enterraste en ella.

**Diálogo `z4_d12b`** — _SOLO SI VA TIKO_
- `z4_d12b.lines[0]` **Tiko:** He encontrado puertas peores, pero ninguna que merezca cerrarse tanto como esta.

#### Pasarela de las compuertas (`z4_r08`)

- `z4_r08.name`: Pasarela de las compuertas
- `z4_r08.description` _(no se muestra al jugador; contexto)_: Una pasarela de losas cruza un canal rápido sobre tres compuertas de piedra.
- _Conecta con: Claustro de los iniciados_

**Diálogo `z4_d04`**
- `z4_d04.lines[0]` **Narrador:** Las marcas de las compuertas indican niveles de agua muy por encima del actual.
- `z4_d04.lines[1]` **Héroe:** Las compuertas parecen conducir algo más que agua. Tal vez Orvane las esté usando.

**Escena `z4_p01` (Prueba)**
- `z4_p01.title`: El caudal contenido
- `z4_p01.text`: Entre las ruinas inundadas, la luz violeta permite distinguir unas monedas bajo el agua. La corriente dificulta alcanzarlas.
- `z4_p01.question`: ¿Cómo recuperáis las monedas?
- `z4_p01.options[0].label`: Alcanzarlas desde el borde de piedra _(Destreza CD 14)_
  - `z4_p01.options[0].ok.text`: Recogéis las monedas sin perder el equilibrio. [+9 oro]
  - `z4_p01.options[0].fail.text`: Resbaláis y la corriente os golpea contra la piedra. [daño 1d4]
- `z4_p01.options[1].label`: Buscar un remanso entre las columnas _(Inteligencia CD 14)_
  - `z4_p01.options[1].ok.text`: Localizáis un remanso y recuperáis las monedas. [+9 oro]
  - `z4_p01.options[1].fail.text`: Los reflejos os impiden calcular la profundidad.
- `z4_p01.options[2].label`: Soportar el agua helada para recogerlas _(Constitución CD 15)_
  - `z4_p01.options[2].ok.text`: Resistís el frío hasta recuperar las monedas. [+9 oro]
  - `z4_p01.options[2].fail.text`: El frío os entumece y el agua os derriba. [daño 1d4]
- `z4_p01.fallback.text` (si fallan todas): La corriente dispersa las monedas. Al intentar recogerlas, perdéis parte de las vuestras. [-10 oro]

#### Registro de los cautivos (`z4_r09`)

- `z4_r09.name`: Registro de los cautivos
- `z4_r09.description` _(no se muestra al jugador; contexto)_: Una cámara de escribas sobre el agua. Sus tablillas recientes tienen nombres de Valdescarcha.
- _Conecta con: Galería de los penitentes_

**Diálogo `z4_d07`**
- `z4_d07.lines[0]` **Narrador:** Junto a algunos nombres hay una marca nueva: «trasladados a una cámara segura».
- `z4_d07.lines[1]` **Héroe:** Los trasladaron a otra cámara. Buscaré su rastro antes de dar a nadie por perdido.

**Diálogo `z4_d07b`** — _SOLO SI VA LISS_
- `z4_d07b.lines[0]` **Liss:** Aquí se guardaba el registro de los prisioneros. Me negué a leerlo cuando aún podía hacer algo.

**Diálogo `z4_d07c`** — _SOLO SI VA BRUNNA_
- `z4_d07c.lines[0]` **Brunna:** Aquí está su nombre, entre los trasladados. Sigue vivo. Le devolveré su ficha en persona.

**Escena `z4_q01` (Decisión)** — _ilustración: escena_escribiente_cautivo_
- `z4_q01.title`: El escribiente cautivo
- `z4_q01.text`: Tras los barrotes, un escribiente sostiene dos tablillas selladas sobre el agua: una registra guardias y cautivos; la otra, provisiones. Os ofrece explicar una antes de que lo descubran.
- `z4_q01.question`: ¿Qué le pedís que os explique?
- `z4_q01.options[0].label`: Consultar los turnos de guardia
  - `z4_q01.options[0].ok.text`: El escribiente os indica cómo evitar a uno de los guardias: habrá un enemigo menos en la cámara de estudio. [un enemigo menos en z4_e03]
- `z4_q01.options[1].label`: Consultar la tablilla de provisiones
  - `z4_q01.options[1].ok.text`: Tras los barrotes, señala dónde guarda una poción y os ayuda a recuperarla. [objeto: Poción de curación]
- `z4_q01.options[2].label`: Comparar las dos tablillas _(Inteligencia CD 14)_
  - `z4_q01.options[2].ok.text`: Comparáis las tablillas: aprendéis a evitar a un guardia y el escribiente os entrega una poción. [objeto: Poción de curación; un enemigo menos en z4_e03]
  - `z4_q01.options[2].fail.text`: Solo descifráis los turnos: el escribiente os indica cómo evitar a un guardia de la cámara de estudio. [un enemigo menos en z4_e03]

#### Sala de los sellos rotos (`z4_r10`)

- `z4_r10.name`: Sala de los sellos rotos
- `z4_r10.description` _(no se muestra al jugador; contexto)_: Una cámara octogonal con sellos arcanos quebrados y trazos recientes que los deforman.
- _Conecta con: Cámara de estudio_

**Diálogo `z4_d09`**
- `z4_d09.lines[0]` **Narrador:** Las marcas nuevas cruzan los sellos antiguos como heridas sobre una cicatriz.
- `z4_d09.lines[1]` **Héroe:** Orvane ha alterado los sellos. Tal vez use las corrientes del monasterio para alimentar los cristales.

**Escena `z4_q02` (Decisión)** — _ilustración: escena_cultista_llave_
- `z4_q02.title`: El cultista rendido
- `z4_q02.text`: Un joven cultista se arrodilla entre las ruinas inundadas y levanta las manos. Ofrece información a cambio de su libertad.
- `z4_q02.question`: ¿Qué haces con el cultista?
- `z4_q02.options[0].label`: Perdonarle a cambio de información
  - `z4_q02.options[0].ok.text`: Os indica dónde se oculta un cofre entre las ruinas y cómo desactivar un sello de guardia antes de huir. [descubre secreto z4_s01 (cofre oculto); un enemigo menos en z4_e04]
- `z4_q02.options[1].label`: Exigirle sus monedas _(Carisma CD 13)_
  - `z4_q02.options[1].ok.text`: Te entrega siete monedas y desaparece. [+7 oro]
  - `z4_q02.options[1].fail.text`: Huye dando la alarma: un guardián más defenderá a Orvane. [un enemigo más en z4_e04]
- `z4_q02.options[2].label`: Rechazar el trato
  - `z4_q02.options[2].ok.text`: El cultista se pierde por los pasillos inundados.

**Cofre `z4_c05`** _(11 oro; Poción de curación mayor)_

#### Celda de los escribas (`z4_s01_r01`) — ÁREA SECRETA

- `z4_s01_r01.name`: Celda de los escribas
- `z4_s01_r01.description` _(no se muestra al jugador; contexto)_: Un atril seco en medio del agua guarda un diario sobre el cierre del monasterio.
- _Conecta con: Laboratorio de los cristales (paso secreto)_

**Diálogo `z4_d06`**
- `z4_d06.lines[0]` **Narrador:** Los monjes inundaron sus salas para enfriar el foco arcano, no para alimentarlo.
- `z4_d06.lines[1]` **Héroe:** Se hundieron con sus libros para no entregar lo que custodiaban.

**Combate `z4_e06`**: Mefit del cristal (Steam Mephit, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `z4_e06.enemies[n].name`)_

**Cofre `z4_c03`** _(22 oro; Poción de curación mayor)_

#### Depósito del vínculo (`z4_s02_r01`) — ÁREA SECRETA

- `z4_s02_r01.name`: Depósito del vínculo
- `z4_s02_r01.description` _(no se muestra al jugador; contexto)_: Una habitación seca con un estante de tablillas y un arcón de piedra. Las raíces fosilizadas no son de ningún árbol de la montaña.
- _Conecta con: Santuario de la fuente (paso secreto)_

**Diálogo `z4_d10`**
- `z4_d10.lines[0]` **Narrador:** Un cuaderno cuenta el viaje de un monje a un bosque lejano, donde estudió los vínculos entre tierra y cristal.
- `z4_d10.lines[1]` **Héroe:** Los monjes investigaron más allá de estas montañas.

**Combate `z4_e07`**: Guardia del depósito (Skeleton, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `z4_e07.enemies[n].name`)_

**Cofre `z4_c06`** _(45 oro; Poción de curación mayor)_

### El jefe y el final

**Antes del combate (versión normal)** (`boss.pre_boss_dialogue`):
- `boss.pre_boss_dialogue[0]` **Maese Orvane:** ¡Insensatos! Este poder estaba oculto por una razón. No comprendéis lo que habéis venido a interrumpir.
- `boss.pre_boss_dialogue[1]` **Héroe:** Todavía puedes detenerte, Orvane. No sacrifiques más vidas por ese cristal.
- `boss.pre_boss_dialogue[2]` **Maese Orvane:** ¡Mi nombre perdurará cuando todos vosotros seáis polvo!
- `boss.pre_boss_dialogue[3]` **Héroe:** Se acabó, Orvane. Hondaroca no será tu tumba de poder.

**Antes del combate (versión con Brunna en lugar de Liss)** (`boss.pre_boss_dialogue_brunna`):
- `boss.pre_boss_dialogue_brunna[0]` **Maese Orvane:** ¡Insensatos! Este poder estaba oculto por una razón. No comprendéis lo que habéis venido a interrumpir.
- `boss.pre_boss_dialogue_brunna[1]` **Brunna:** He cruzado media montaña para llegar hasta aquí. No dejaré que conviertas este lugar en una tumba.
- `boss.pre_boss_dialogue_brunna[2]` **Maese Orvane:** ¡Mi nombre perdurará cuando todos vosotros seáis polvo!
- `boss.pre_boss_dialogue_brunna[3]` **Héroe:** Se acabó, Orvane. Hondaroca no será tu tumba de poder.

- `boss.victory_reward` _(texto de victoria)_: El cristal oscuro pierde su luz y se desintegra. Los cultistas supervivientes huyen y las aguas del monasterio comienzan a descender. Tras la cámara de estudio, los pasos antes inundados quedan accesibles: allí esperan los mineros que siguen vivos, por fin libres del encierro. El grupo recupera los documentos de Orvane, que revelan la historia de Aldric y el origen del poder prohibido. Los tesoros recuperados se entregan en Valdescarcha.
- `codigo.defeatText` _(texto de derrota)_: Todo el grupo ha caído en la oscuridad de Hondaroca.

### Charlas en la posada de Valdescarcha

Se desbloquean una a una en la posada al terminar zonas con ese aliado. `insp` es la frase que dice al inspirar al grupo en combate.

#### Brunna

_Charla 1:_
- `charlas.brunna.talks[0][0]` **Brunna:** Mi cuadrilla estaba formada por familias enteras de Valdescarcha.
- `charlas.brunna.talks[0][1]` **Héroe:** ¿Eras su jefa?
- `charlas.brunna.talks[0][2]` **Brunna:** Era quien escuchaba las grietas antes de cada turno.
- `charlas.brunna.talks[0][3]` **Brunna:** Un día el capataz decidió no escucharme.

_Charla 2:_
- `charlas.brunna.talks[1][0]` **Brunna:** Guardo una ficha de cobre de un aprendiz desaparecido.
- `charlas.brunna.talks[1][1]` **Héroe:** ¿Por qué no la has devuelto?
- `charlas.brunna.talks[1][2]` **Brunna:** Porque aún espero poder entregársela a él.
- `charlas.brunna.talks[1][3]` **Brunna:** No he aprendido a despedirme de quienes quizá sigan vivos.

_Charla 3:_
- `charlas.brunna.talks[2][0]` **Brunna:** Durante años pensé que mi deber era resistir sin pedir ayuda.
- `charlas.brunna.talks[2][1]` **Héroe:** Nadie puede sostener solo una montaña.
- `charlas.brunna.talks[2][2]` **Brunna:** Lo sé. Esta vez confiaré en quienes caminan a mi lado.
- `charlas.brunna.talks[2][3]` **Brunna:** Y si el techo vuelve a caer, encontraremos juntos una salida.

- `charlas.brunna.insp`: No abandonaré a nadie bajo la piedra.

#### Tiko

_Charla 1:_
- `charlas.tiko.talks[0][0]` **Tiko:** Aprendí a abrir cerraduras antes de aprender a leer.
- `charlas.tiko.talks[0][1]` **Héroe:** ¿Quién te enseñó?
- `charlas.tiko.talks[0][2]` **Tiko:** Un cerrajero que nunca preguntó de dónde venían las monedas.
- `charlas.tiko.talks[0][3]` **Tiko:** Cuando murió, comprendí que una puerta abierta también puede salvar una vida.

_Charla 2:_
- `charlas.tiko.talks[1][0]` **Tiko:** Robé una llave al capataz de Hondaroca. Podría haber escapado entonces.
- `charlas.tiko.talks[1][1]` **Héroe:** ¿Por qué regresaste?
- `charlas.tiko.talks[1][2]` **Tiko:** Oí a un minero pedir auxilio tras un muro.
- `charlas.tiko.talks[1][3]` **Tiko:** No me gusta admitirlo, pero su voz pesó más que el oro. Así acabé encadenado.

_Charla 3:_
- `charlas.tiko.talks[2][0]` **Tiko:** Siempre he temido que alguien descubra que también tengo miedo.
- `charlas.tiko.talks[2][1]` **Héroe:** Has vuelto a luchar junto a nosotros.
- `charlas.tiko.talks[2][2]` **Tiko:** Porque ahora sé que no necesito esconderme para ser valiente.
- `charlas.tiko.talks[2][3]` **Tiko:** Si una cerradura nos separa de alguien, volveré a abrirla.

- `charlas.tiko.insp`: Si hay una salida, encontraré la cerradura.

#### Hermano Edmund

_Charla 1:_
- `charlas.edmund.talks[0][0]` **Hermano Edmund:** Mi maestro me confió las llaves de la cripta cuando apenas era un novicio.
- `charlas.edmund.talks[0][1]` **Héroe:** ¿Estabas preparado?
- `charlas.edmund.talks[0][2]` **Hermano Edmund:** Creía que guardar silencio era suficiente para proteger a los muertos.
- `charlas.edmund.talks[0][3]` **Hermano Edmund:** Ahora sé que los vivos también necesitan una voz.

_Charla 2:_
- `charlas.edmund.talks[1][0]` **Hermano Edmund:** Vi las primeras huellas de intrusos y no alerté a Valdescarcha.
- `charlas.edmund.talks[1][1]` **Héroe:** ¿Por qué?
- `charlas.edmund.talks[1][2]` **Hermano Edmund:** Temía provocar el pánico. Mi prudencia dio tiempo a Orvane.
- `charlas.edmund.talks[1][3]` **Hermano Edmund:** No volveré a confundir cautela con abandono.

_Charla 3:_
- `charlas.edmund.talks[2][0]` **Hermano Edmund:** Pensé que mi deber terminaba en el altar.
- `charlas.edmund.talks[2][1]` **Héroe:** ¿Y ahora?
- `charlas.edmund.talks[2][2]` **Hermano Edmund:** Está donde alguien necesite amparo, incluso lejos de la cripta.
- `charlas.edmund.talks[2][3]` **Hermano Edmund:** Caminaré sin esperar a que otro me conceda permiso.

- `charlas.edmund.insp`: Que ningún vivo quede sin amparo.

#### Liss

_Charla 1:_
- `charlas.liss.talks[0][0]` **Liss:** Orvane me enseñó a leer los signos de la piedra. Admiraba su paciencia.
- `charlas.liss.talks[0][1]` **Héroe:** ¿Cuándo empezaste a desconfiar?
- `charlas.liss.talks[0][2]` **Liss:** Cuando dejó de preguntar qué podía aprender y empezó a exigir poder.
- `charlas.liss.talks[0][3]` **Liss:** Tardé demasiado en reconocer la diferencia.

_Charla 2:_
- `charlas.liss.talks[1][0]` **Liss:** Activé la primera cámara de cristales. Aún recuerdo su luz.
- `charlas.liss.talks[1][1]` **Héroe:** No sabías lo que sucedería.
- `charlas.liss.talks[1][2]` **Liss:** Pero vi las consecuencias y seguí allí. Eso también fue una elección.
- `charlas.liss.talks[1][3]` **Liss:** Ahora quiero usar lo aprendido para reparar cuanto pueda.

_Charla 3:_
- `charlas.liss.talks[2][0]` **Liss:** Temo volver a seguir a alguien solo porque parece conocer todas las respuestas.
- `charlas.liss.talks[2][1]` **Héroe:** Puedes decidir por ti misma.
- `charlas.liss.talks[2][2]` **Liss:** Entonces elegiré proteger a quienes no tienen voz.
- `charlas.liss.talks[2][3]` **Liss:** El conocimiento no vale nada si exige abandonar a los demás.

- `charlas.liss.insp`: El conocimiento también puede reparar el daño.

---

## 5. Textos del código que también salen en Hondaroca

Son comunes a las tres aventuras: si los cambias, cambian en todas. Cámbialos solo si chocan con la historia.

- `codigo.aviso_aliado.titulo`: Una voz a lo lejos
- `codigo.aviso_aliado.texto`: Antes de seguir, oís a alguien pedir ayuda en algún rincón de esta zona que aún no habéis recorrido. Podéis volver a buscarle o seguir adelante pisando otra vez la salida.
- `codigo.secreto`: (descripción del secreto) + «Se abre un pasadizo secreto: ya aparece en el mapa.» o «Dentro hay un cofre escondido: ya lo veis en el mapa.»
- `codigo.trampa.intro`: Algo cruje bajo vuestros pies…
- `codigo.reja_cerrada`: Una reja de hierro cierra la salida. Buscad la llave en algún rincón de esta zona.
- `codigo.reja_abierta`: {who} abre la reja con la llave de hierro, que se queda en la cerradura.
- `codigo.reaccion.heridos`: «Vamos hechos polvo. Si vemos un sitio tranquilo, deberíamos descansar antes de seguir.» / «Así no llegamos muy lejos. Curémonos en cuanto podamos.» / «Me tiemblan las piernas. Despacio y con cuidado a partir de aquí.»
- `codigo.reaccion.zona_limpia`: «Qué silencio. Lo que dejamos atrás ya no se levantará.» / «Esto está tranquilo ahora. Al menos aquí nadie nos espera.»
- `codigo.reaccion.por_poco`: «Por poco. Otro golpe así y no lo contamos.» / «Eso ha estado demasiado cerca. Hay que cuidarse más.» / «Seguimos vivos, que no es poco. Respirad un momento.»
- `codigo.reaccion.con_muerto`: «No todos hemos salido de esta. Sigamos, pero con cuidado.» / «Ha caído uno de los nuestros. No dejemos que caiga nadie más.»
