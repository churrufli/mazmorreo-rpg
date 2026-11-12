# El Corazón Hueco: documento para reescribir la narrativa con ChatGPT

Segunda aventura de Mazmorreo, «El Corazón Hueco», en el bosque de Umbría. Todos los textos están sacados del juego tal como está hoy (rama `master`, 10-11-2026): `src/data/corazon.json`, `src/data/charlas.json`, `src/data/srd.ts` y el código.

**Cómo usarlo:** abre un chat nuevo de ChatGPT, pega el prompt del apartado 0 y adjunta este archivo entero. Cuando conteste, pásame su bloque JSON y lo aplico al juego.

---

## 0. Prompt para ChatGPT (copiar tal cual)

```
Te adjunto el documento con toda la narrativa de «El Corazón Hueco», la segunda aventura de Mazmorreo: un juego de rol para móvil, para un jugador, de fantasía medieval sombría con reglas de D&D 2024 (SRD 5.2.1). El documento trae una biblia de la historia (apartado 1), una lista de problemas ya detectados (apartado 2), las normas del juego que limitan los textos (apartado 3), TODOS los textos de la aventura en orden de partida, cada uno con su clave (apartado 4), y los textos del código que también salen (apartado 5).

OBJETIVO PRINCIPAL: que la historia sea SENCILLA DE ENTENDER. Un jugador que lee frases sueltas en un móvil, entre combates, tiene que saber en todo momento qué pasa en el bosque, quién es el malo, qué quiere, qué les ha pasado a los desaparecidos y por qué se adentra cada vez más. Ahora mismo hay demasiados hilos (guardián, druida, espíritu, juramentos, palabras que faltan, voces, ecos, bandidos, no muertos) que no se cierran o que confunden.

TIENES LIBERTAD PARA:
- Reescribir cualquier texto: narrador, diálogos, títulos, preguntas, opciones, resultados, pendientes del diario, nombres de salas, de enemigos, de escenas y de objetos de decorado.
- Cambiar el argumento, quitar hilos, juntar conceptos, simplificar el trasfondo (el guardián, el druida, la orden de Ivelle, el juramento, la abuela Brezna) y cambiar términos o nombres si así se entiende mejor. Puedes cambiar nombres propios (Brezna, Maren, Ismerel, Ivelle, Corvalen, Umbría, Vegaumbría, el Corazón Hueco…) si mejora la claridad, pero dilo expresamente y aplícalo en TODOS los textos donde salga.
- Borrar líneas de diálogo o añadir alguna línea nueva corta.

LÍMITES (esto no se puede cambiar solo con texto):
1. Los identificadores (b1_r01, b1_e02, b1_q01…): no los renombres. Úsalos para decirme qué cambias.
2. La mecánica de cada opción: atributo, CD, coste, oro, daño, objeto, combate que provoca, enemigo de más o de menos, secreto que abre. Va entre corchetes [ ] detrás de cada resultado. El texto nuevo tiene que encajar con esa consecuencia. Ejemplo: si el resultado da +7 oro, el texto debe dar dinero; si dice «un enemigo más en b1_e04», el texto debe explicar por qué habrá un enemigo más allí.
3. El mapa, las salas, los combates y el tipo de criatura de cada enemigo (lobo, bandido, oso pardo, arbusto despertado, araña gigante, oso lechuza, lobo terrible, jabalí gigante, fuego fatuo, arpía, espectro, árbol despertado, montículo andante, esqueleto, zombi, dríade, bruja verde, ent). Sí puedes cambiar el NOMBRE que lleva cada enemigo.
4. Las ilustraciones ya existen (descritas en el apartado 1.5): el texto debe encajar con lo que muestran.
5. En qué sala se une cada aliado y su clase y especie.
6. La traidora y el final mecánico: la abuela Brezna (una bruja verde disfrazada de anciana) habla con el héroe en tres sitios y en la Máscara caída (b4_r05) se desenmascara y lucha; después, el jefe es un árbol gigante (ent) que lucha en la Cámara de los nudos (b4_r07) protegido por tres nudos de raíz, y al vencerle termina la aventura.
Si una idea tuya necesita cambiar algo de esta lista, NO la metas en los textos: ponla aparte en «Propuestas que requieren programar».

NORMAS DE ESTILO (apartado 3): español de España; el grupo, en segunda persona del plural («entráis», «veis»), salvo en la zona 1 (la linde), que va SIEMPRE en singular («entras», «ves»); frases cortas, como mucho unas 20 palabras por línea; diálogos de 2 a 4 líneas; sin cifras exactas de enemigos en la narración; el héroe no puede marcar género ni especie al hablar; nada imprescindible puede depender de un aliado que puede no venir (las líneas «SOLO SI VA…» y las presentaciones de aliados son extras).

QUÉ ME DEVUELVES, en este orden:
1. «La historia en 10 líneas»: el argumento nuevo, tan simple que se entienda a la primera.
2. «Cambios de argumento y de nombres»: lista corta, con el porqué de cada uno.
3. «Problemas resueltos»: para cada punto del apartado 2, una línea diciendo cómo queda.
4. «Propuestas que requieren programar» (si hay).
5. Un ÚNICO bloque de código JSON con TODOS los textos que cambian, con este formato exacto:

[
  {"clave": "b1_d03.lines[1]", "accion": "cambiar", "texto": "Texto nuevo."},
  {"clave": "b1_d03.lines[0]", "accion": "borrar"},
  {"clave": "b1_d03.lines[1]", "accion": "añadir_despues", "quien": "narrator", "texto": "Línea nueva."}
]

- «clave» es exactamente la que aparece en el documento entre `comillas invertidas`.
- «accion»: "cambiar", "borrar" o "añadir_despues" (esta última solo en diálogos; «quien» es narrator, hero, maren, anselmo (Ismerel), ivelle, telmo (Corvalen), ortiga (Brezna) o corazon).
- No incluyas los textos que no cambian. No me devuelvas el documento entero.
- Si el bloque es muy largo, divídelo por zonas en varios mensajes y avísame de cuándo has terminado.
```

---

## 1. Biblia de la historia (cómo está ahora)

### 1.1 Premisa

**Vegaumbría** es un pueblo de leñadores y cazadores en la vega que se extiende al pie del bosque de **Umbría** (de ahí su nombre). Allí el jugador compra en la tienda, se cura en el templo, descansa en la posada (el único sitio con descanso largo) y elige compañeros. Se abre después de terminar Hondaroca.

En Umbría desaparece gente: viajeros, cazadores, leñadores, vecinos. Dicen que siguieron una voz conocida y no volvieron. El héroe entra en el bosque, que tiene cuatro zonas, cada vez más hondas:
1. **La linde** (lobos y bandidos).
2. **El bosque profundo** (oso, arbustos despertados, arañas, oso lechuza, lobo terrible, jabalí).
3. **La ciénaga** (fuego fatuo, arpía, espectro, árbol ahogado, montículo andante).
4. **El claro maldito y el interior del Corazón** (arbustos, una dríade, la abuela Brezna y el jefe, el Corazón Hueco).

Cada zona está cerrada por un **muro de raíces** que solo se aparta con un **amuleto de corteza**, escondido en algún rincón de la zona. El amuleto se deshace al usarlo.

**Texto de introducción** (lo lee el narrador al empezar): `dungeon.summary` y después `b1.description`.
- `dungeon.name`: El Corazón Hueco
- `dungeon.summary`: En el bosque de Umbría desaparecen viajeros, cazadores y vecinos de las aldeas cercanas. Las sendas cambian bajo la niebla y las raíces parecen recordar cada paso. Lo que empieza como una búsqueda conduce a un guardián olvidado y a un corazón que late bajo la tierra, donde salvar a los perdidos exigirá comprender qué ha corrompido el bosque.

### 1.2 Lo que ha pasado, según los textos actuales

- Hace mucho, un **druida** unió su vida al bosque y juró protegerlo: es el **guardián** (también llamado «el espíritu»). Una **orden de caballeros** (la de Dama Ivelle) juró velar por él y recordarle cada cierto tiempo por qué protegía el bosque («Uno vigila. Muchos recuerdan. Nadie debe vigilar solo»).
- La orden dejó de visitarle cuando la ciénaga cubrió el camino. Solo, el guardián olvidó una parte de su juramento: debía proteger a la gente, no impedirle volver a casa.
- La **abuela Brezna**, en realidad una bruja verde, «enseñó al guardián a retener en vez de proteger». Los textos no dicen por qué ni qué gana con ello.
- El guardián se ha convertido en el **Corazón Hueco**, un árbol enorme bajo el claro maldito. Sus raíces cambian los senderos, imitan voces conocidas y atrapan a quienes entran: sus rostros quedan presos en la madera.
- Por el camino aparecen bandidos asustados («los caminos» les persiguen), ecos que aprenden las voces, luces del pantano que conocen nombres y un juramento al que «le falta una palabra».
- **Final:** el grupo desenmascara a Brezna y la vence, vence al Corazón y los perdidos despiertan entre las raíces y vuelven a Vegaumbría.

### 1.3 Personajes

**El héroe.** Lo crea el jugador: hombre o mujer; humano, elfo, enano o mediano; guerrero, clérigo, pícaro, mago, explorador o paladín. Sus frases no pueden marcar género, especie ni clase. Entra **solo** en la linde (o con un único compañero de Hondaroca, si lo elige en la posada) y suma un aliado del bosque por zona.

**Regla de los aliados.** Maren se une en la zona 2, el Hermano Ismerel en la 3 y Dama Ivelle en la 4. Si el héroe tiene la misma clase que uno de ellos (explorador, clérigo o paladín), ese aliado no aparece y entra **Maese Corvalen** en su lugar, con su propia presentación. Por eso Corvalen sale como mucho una vez por partida, y sus tres presentaciones nunca coinciden.

| Personaje | Quién es | Personalidad e historia (textos actuales) |
|---|---|---|
| **Maren Brezoscuro** (exploradora, elfa, zona 2; id `maren`) | Cazadora de Vegaumbría | Tenaz, protectora y desconfiada. Busca a su hermano, que entró a talar y no volvió. En la Raíz silenciosa lo encuentra vivo entre los rescatados. |
| **Hermano Ismerel** (clérigo, humano, zona 3; id `anselmo`) | Ermitaño de la ciénaga | Sereno y compasivo. Su farol mantiene lejos las luces del pantano. Una vez siguió una voz falsa hasta la ciénaga y solo encontró su reflejo. |
| **Dama Ivelle de la Encina** (paladina, humana, zona 4; id `ivelle`) | Caballera de la orden que velaba por el guardián | Leal, grave y resuelta. Su orden repetía el juramento cada amanecer pero dejó de visitar al guardián; carga con esa culpa. |
| **Maese Corvalen** (mago, humano, suplente; id `telmo`) | Erudito de Vegaumbría | Erudito, prudente y obstinado. De aprendiz halló un códice con un juramento antiguo al que le faltaba el final; su maestro le prohibió investigarlo. |
| **La abuela Brezna** (traidora; id `ortiga`) | Bruja verde disfrazada de anciana amable | Aparece en la linde, el bosque profundo y la ciénaga, siempre un paso por delante; da consejos y un antídoto. En el claro se desenmascara y lucha. |
| **El Corazón Hueco** (jefe; id `corazon`) | El guardián corrompido, convertido en árbol | «Quise protegerlos. Aprendí a retenerlos. Ahora nada volverá a marcharse». |

### 1.4 Enemigos (nombre de criatura fijo; el nombre que se muestra se puede cambiar)

Lobos y bandidos en la linde; oso pardo, arbustos despertados, arañas gigantes, oso lechuza, lobo terrible y jabalí gigante en el bosque profundo; fuego fatuo, arpía, espectro («Alma sin reposo»), árbol despertado («Árbol ahogado»), montículo andante, un esqueleto y un zombi (en salas secretas) y bandidos extraviados en la ciénaga; arbustos despertados, una dríade corrompida y la bruja verde (Brezna) en el claro; el Corazón Hueco (un ent) con tres nudos de raíz al final. Durante el combate final brotan arbustos despertados.

### 1.5 Ilustraciones que ya existen (el texto debe encajar con ellas)

- **Introducción:** sendero embarrado de noche, con luna, un poste indicador de madera y un carro abandonado con un farol encendido; al fondo, el bosque oscuro.
- **Vegaumbría:** aldea de casas de madera a los pies de un gran árbol, otoño, faroles cálidos y una empalizada con puerta.
- **Zonas:** la linde, robles viejos y retorcidos, sendero de tierra, hojas de otoño y niebla; el bosque profundo, troncos enormes con musgo, helechos, setas y luz azulada; la ciénaga, agua negra, juncos, árboles muertos y lucecitas azules; el claro maldito, un círculo de piedras erguidas con niebla de luz verde venenosa; el interior del Corazón, un túnel de raíces que se cierran como costillas, con un resplandor verde al fondo.
- **Personajes:** Maren, elfa pelirroja con trenza, arco largo, capa verde a jirones y armadura de cuero; Ismerel, humano calvo con barba, túnica roja y crema, rosario y un bastón con farol colgado; Ivelle, mujer humana morena con armadura de placas gastada, espada larga y escudo con un árbol dorado pintado; Corvalen, humano mayor de pelo gris largo y barba, túnica oscura con bordados, bastón con cristal azul y una llama azul mágica en la mano; Brezna, anciana sonriente de pelo blanco, pañuelo en la cabeza, chal de musgo, bastón y un cesto de hierbas; el Corazón Hueco, un árbol con cara barbuda de madera y un hueco en el pecho que brilla en verde, ramas como brazos y raíces como piernas.
- **Objetos:** el amuleto de corteza es un disco de madera con una runa verde luminosa colgado de una cuerda; la semilla del juramento es una semilla grande y fosilizada, con vetas verdes, sobre una hoja seca; la Astilla del Corazón es un trozo de corteza petrificada con vetas verdes.

| Escena | Qué muestra la ilustración |
|---|---|
| `b1_q01` El fugitivo entre los robles | Hombre de pelo castaño con capa verde raída, agachado entre raíces, con el brazo ensangrentado y una daga en la mano; mira con cansancio. |
| `b1_q02` La barricada cede | Hombre atrapado en el suelo bajo troncos que arden, con una antorcha encendida clavada a su lado. |
| `b2_n01` Nido de seda (aviso) | Telas de araña tupidas entre los árboles. |
| `b2_q01` La caja de los resineros | Cofre de madera sobre tablones podridos, chorreando resina amarilla brillante, con vapor amarillento alrededor. |
| `b2_q02` Las marcas altas | Leñador barbudo con hacha al hombro mirando hacia arriba unas muescas talladas en lo alto de un tronco enorme. |
| `b3_q01` La voz en el agua | Ciénaga de noche con luna; una lucecita azul flota sobre el agua y al fondo, entre la niebla, se adivina una figura encapuchada. |
| `b3_q02` La ofrenda del guardián | Una semilla dorada brillante sobre una losa de piedra cubierta de raíces, bajo un dolmen, en la ciénaga de noche. |
| `b4_q01` El altar herido | Mujer cubierta de hojas y musgo (una dríade) tendida en el suelo, herida, ante un altar de piedra partido por una grieta con savia luminosa dorada. |
| `b4_q02` La última palabra | Tres arcos de madera retorcida con una luz roja intensa detrás; delante, una losa de piedra con una inscripción, rota por una grieta y rodeada de raíces. |

---

## 2. Problemas ya detectados (para que los resuelvas)

**A. Cinco nombres para lo mismo.** «El guardián», «el druida», «el espíritu», «el antiguo guardián» y «el Corazón Hueco» son la misma criatura, pero el jugador no lo sabe hasta el final (y solo si lo deduce). Lo mismo con el juramento: «el juramento», «el antiguo juramento», «el primer juramento», «un juramento incompleto», «la palabra que falta», «la última palabra», «la promesa». Elige un nombre para cada cosa y úsalo siempre. Textos afectados, entre otros: `dungeon.summary`, `b3_d02`, `b3_d04`, `b3_d04b`, `b3_d05` («espíritu»), `b3_d06`, `b3_j03`, `b3_q02`, `b4_r01.ally.default_scene`, `b4_d04`, `b4_d06`, `b4_j03`, `b4_q02`, `b4_d07`, `b4_d08`, `boss.visions[2]`, `boss.pre_boss_dialogue`, las charlas de Ivelle y Corvalen.

**B. ¿Quién es Brezna y qué gana?** Al desenmascararse (`b4_d02`) dice que enseñó al guardián a retener en vez de proteger, pero no por qué, ni qué saca de los perdidos, ni por qué el héroe le ha sido «muy útil» («cada paso tuyo ha despertado nuevas raíces»). Además regala un antídoto (`b2_d01.gift.text`), lo que choca con ser la villana si no se explica. El diseño original decía que «habla de hambre», pero ningún texto lo dice; en cambio, el texto de victoria (`codigo.victoryText`) dice que el bosque «ya no tendrá hambre» sin que antes se haya hablado de hambre. Dale un motivo claro y siémbralo antes.

**C. ¿Quién imita las voces?** La premisa es que la gente siguió una voz conocida (`b1.entry_dialogue[1]`). Luego hay un eco que aprende voces (`b1_d06`), luces del pantano que conocen voces (`b3_q01`, `b3_j01`), Brezna que reconoce voces bajo el agua (`b3_d01`) y una cámara que repite lo que habéis dicho (`b4_d05`). Los pendientes `b1_j05` y `b3_j01` se borran al desenmascarar a Brezna (`b4_r05`), pero ella no dice nada de voces. Decide quién lo hace (Brezna, el Corazón o las luces) y que se diga.

**D. Los bandidos.** ¿Qué hacen en el bosque? Son «fugitivos», «extraviados», huyen de «los caminos» (`b1_d02`) y uno dice que «la anciana sabía mi nombre» (`b3_ev01`). No queda claro si son enemigos, víctimas o ambas cosas. Una frase temprana debería explicarlo.

**E. Demasiados hilos sueltos para una aventura corta.** Simplifícalos, ciérralos o quítalos:
- «Vi huellas de varios hombres siguiendo a una sola persona» (`b2_ev01.options[2].ok.text`): no lleva a nada.
- «Alguien escucha desde los tocones» (`b1_d08`), «algo repetía los golpes de su corazón» (`b2_d07`), heridas de los árboles que se cierran y aparecen en otros (`b2_d08`), «el árbol me ha devuelto un nombre antes de oírlo» (`b1_d07`).
- Los no muertos de la ciénaga (el espectro «Alma sin reposo», el esqueleto «Vigilante del puesto», el zombi «Custodio olvidado»): ¿quiénes son? ¿Guardianes de la orden, perdidos?
- La llave ceremonial que nunca se usó (`charlas.ivelle.talks[0]`) y el códice con el final arrancado (`charlas.telmo.talks[0]`).
- ¿Quién dejó los amuletos de corteza colgados de las raíces y por qué abren el paso?
- El secreto de regreso del invierno (`b4_j04`, `b4_s02_pista`, `b4_s02_abrir`, `b4_d08`) enlaza con la tercera aventura (una escama del dragón blanco); puede quedarse como guiño, pero debe entenderse sin ella.

**F. Lo importante no puede depender de un aliado.** Quién es el guardián y qué juró lo explica casi solo Ivelle al presentarse (`b4_r01.ally.default_scene`); si el héroe es paladín, en su lugar llega Corvalen y esa explicación no sale. La trama principal tiene que entenderse con el narrador, el héroe y Brezna.

**G. Persona gramatical.** Desde la zona 2 el grupo va en plural, pero algunas preguntas y resultados siguen en singular: `b2_q01.question` y sus resultados («Alcanzas», «Resbalas», «descubres»), `b2_q02.question`, `b2_q02.options[0].ok.text` («te indica»), `b2_q02.options[2].label` («Apartarte»), `b3_q01.question` y sus resultados («descubres», «te desorienta», «Te alejas»), `b4_q01.question` y `b4_q01.options[0].ok.text` («Retiras… descubres»), `b4_q02.question` y sus resultados («Recuerdas… tus heridas», «Guardas silencio»), `b4_s02_pista.options[0].ok.text` y `b4_s02_pista.options[1].ok.text` («tienes»). Brezna puede hablarle al héroe en singular si se dirige a él. La linde va toda en singular (decisión tomada), aunque al volver ya haya aliados.

**H. El héroe marca género.** `b1.entry_dialogue[1]` empieza «Entraré solo»: un héroe mujer tendría que decir «sola». Ojo: si el héroe lleva un compañero de Hondaroca, el juego cambia esa línea entera por `codigo.escolta` (apartado 5); reescribe las dos.

**I. Referencias a cosas que el jugador no ha visto.** Las descripciones de sala (`*.description` de las salas `b*_r*`) **no se muestran** en el juego. Así que estos diálogos deben presentar el objeto en el propio diálogo:
- `b1_d05`: «Los cortes siguen frescos» (los tocones y el hacha no se han presentado).
- `b2_d02`: «Las raíces dejan de oponerse…» (no se sabe a qué raíces ni por qué).
- `b3_d04`: «Las piedras tienen la misma forma que las marcas del bosque profundo» (ni los monolitos ni esas marcas se han presentado).
- `b4_d01`: «La madera conserva la huella…».
- `b4_d06` y `b4_j03`: «A este juramento le falta una palabra» / «la última losa» (la losa no se ha presentado).
- `b3_q02.text` no dice que la ofrenda es una semilla, pero los resultados hablan de «la semilla».
- `b4_q01`: la figura cubierta de hojas es la dríade que acabáis de vencer, pero ni el texto ni las opciones la mencionan después.

**J. Nombres que se confunden con Hondaroca.** «Maese Corvalen» (mago, aliado) se parece mucho a «Maese Orvane» (mago, el villano de Hondaroca). El «Hermano Ismerel» (clérigo calvo con farol) repite la fórmula del «Hermano Edmund» de Hondaroca (clérigo calvo con farol). Valora cambiar los nombres o los tratamientos (la ilustración no cambia).

---

## 3. Normas del juego que limitan los textos

- **Lo que ve el jugador:** el diálogo de entrada de cada zona, los diálogos de sala (al entrar), las escenas (título, texto, pregunta, opciones y resultado), los pendientes del diario, los nombres de las salas, los textos de trampas (la descripción solo si no se detecta), descansos, secretos descubiertos, cofres con obstáculo, avisos, la palanca, las presentaciones de aliados, el regalo de Brezna, el diálogo con el jefe, sus visiones en combate, el texto de victoria, las charlas de la posada y las descripciones de los objetos.
- **Lo que NO ve:** la descripción de las salas y de las zonas 2 a 4 (sirven solo de contexto). Puedes cambiarlas igualmente para que queden coherentes.
- **El mapa es decorado genérico.** No digas que algo «se ve en el mapa» (una escalera, un tocón, un hueco) si no está garantizado. Correcto: «Habéis descubierto un secreto». Incorrecto: «Se abre el pasadizo junto al tocón que veis».
- **Descansos:** la frase «permite regresar a Vegaumbría» la quita y la pone el código solo donde toca. No hace falta que la escribas.
- **Marcadores `{who}` e `{item}`** en los cofres con obstáculo: el juego pone ahí el nombre del personaje y del objeto. Consérvalos.
- **Escenas:** en las de *Decisión* se elige una vez. En las *Pruebas* y *Pistas de secreto*, si una opción falla se cierra solo esa y se puede probar otra; «fallback» sale si fallan todas. «Solo al volver a la zona» = la segunda vez que se pasa por allí.
- **Pendientes del diario:** se apuntan al llegar a la sala «desde» y se borran al llegar a «hasta». Deben resolverse de verdad cuando se borran.
- **La abuela Brezna** espera en el mapa (con un aro plateado) en cada sala donde habla; el jugador la ve venir. Sus tres primeras apariciones son `b1_d01`, `b2_d01` y `b3_d01`; se desenmascara en `b4_d02`.
- **Nombres propios de las otras aventuras** (para no repetirlos): Valdescarcha, Hondaroca, Orvane, Aldric, Tiko, Edmund, Liss, Brunna, Cumbrenieve, Vharzûl, Vurka, Durnok, Syrael, Tavin Ventisca, Eldran Barbanieve. Hondaroca tiene un «sello de Umbría» que se abre con un amuleto de corteza; si cambias «Umbría» o el amuleto, dilo y lo ajusto allí también.

---

## 4. Todos los textos de El Corazón Hueco, en orden de partida

Formato: `clave`: texto. Entre corchetes [ ], lo que pasa en el juego (no se cambia). En cursiva, cuándo sale. Las salas van en el orden del archivo, que es más o menos el de la partida; «Conecta con» indica el mapa.

### Zona 1: Linde del bosque (`b1`)

- `b1.name`: Linde del bosque
- `b1.description`: Senderos fríos y leñadores desaparecidos. _(se lee en la introducción al empezar la partida)_

**Diálogo al entrar en la zona** (`b1.entry_dialogue`):
- `b1.entry_dialogue[0]` **Narrador:** La niebla de Umbría se enreda en las ramas y borra las huellas casi en cuanto aparecen. Ni los pájaros se atreven a cantar. Vegaumbría debe su nombre a este bosque: es la vega que se extiende a sus pies.
- `b1.entry_dialogue[1]` **Héroe:** Entraré solo. En Vegaumbría hablan de caminantes que siguieron una voz conocida y nunca regresaron. Averiguaré qué les ocurrió.

**Pendientes del diario** (se apuntan al llegar a «desde» y se borran al llegar a «hasta»):
- `b1_j01.text` _(desde b1_r02, hasta b1_r09)_: ¿Por qué las huellas de los leñadores terminan antes de llegar a los árboles?
- `b1_j03.text` _(desde b1_r06, hasta b1_s01)_: La corteza de un roble deja escapar aire de su interior.
- `b1_j04.text` _(desde b1_r11, hasta b1_s02)_: Las campanillas de hueso y madera señalan un escondite junto a las zarzas.
- `b1_j05.text` _(desde b1_r10, hasta b4_r05)_: Algo en el bosque aprende las voces de quienes pasan.

#### Hojas de la linde (`b1_r01`)

- `b1_r01.name`: Hojas de la linde
- `b1_r01.description` _(no se muestra al jugador; contexto)_: Robles viejos, niebla baja y huellas que se interrumpen.
- _Conecta con: Paso de los cazadores_

#### Paso de los cazadores (`b1_r02`)

- `b1_r02.name`: Paso de los cazadores
- `b1_r02.description` _(no se muestra al jugador; contexto)_: Un lazo oculto cruza el sendero.
- _Conecta con: Hojas de la linde, Carromato abandonado_

**Trampa `b1_t01`** _(si no se detecta, se lee la descripción)_
- `b1_t01.name`: Lazo de cazador
- `b1_t01.description`: Algo cruje bajo tus pies…
- _(efecto, no se cambia: 1d6 contundente y apresado hasta liberarse con acción y CD 12 de Fuerza.)_

**Combate `b1_e01`**: Lobo famélico (Wolf, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b1_e01.enemies[n].name`)_

**Escena `b1_p01` (Prueba)** — _antes de b1_t01_
- `b1_p01.title`: El lazo tendido
- `b1_p01.text`: Entre las raíces y las hojas del sendero hay un lazo de cazador. Desactivarlo permitirá pasar sin sufrir la trampa.
- `b1_p01.question`: ¿Cómo desactivas el lazo?
- `b1_p01.options[0].label`: Buscar la cuerda entre las raíces _(Sabiduría CD 11)_
  - `b1_p01.options[0].ok.text`: Localizas la cuerda y desmontas el lazo. La trampa del camino queda desactivada. [desactiva la trampa b1_t01]
  - `b1_p01.options[0].fail.text`: La cuerda se pierde entre las hojas.
- `b1_p01.options[1].label`: Soltar el lazo entre las hojas _(Destreza CD 12)_
  - `b1_p01.options[1].ok.text`: Sueltas el lazo sin tensarlo. La trampa del camino queda desactivada. [desactiva la trampa b1_t01]
  - `b1_p01.options[1].fail.text`: El lazo se tensa de golpe y te hiere. [daño 1d4]
- `b1_p01.options[2].label`: Estudiar los nudos junto a las raíces _(Inteligencia CD 12)_
  - `b1_p01.options[2].ok.text`: Aflojas el nudo que mantiene tenso el lazo. La trampa del camino queda desactivada. [desactiva la trampa b1_t01]
  - `b1_p01.options[2].fail.text`: El nudo queda trabado entre las raíces.
- `b1_p01.fallback.text` (si fallan todas): El lazo sigue armado. Te alejas de la trampa sin tocarla.

**Diálogo `b1_d03`**
- `b1_d03.lines[0]` **Héroe:** Estas huellas van hacia el bosque. Las otras vuelven corriendo.
- `b1_d03.lines[1]` **Narrador:** Bajo un helecho hay un guante de cuero lleno de tierra, y en el barro, la marca larga de una raíz arrastrada.

#### Carromato abandonado (`b1_r03`)

- `b1_r03.name`: Carromato abandonado
- `b1_r03.description` _(no se muestra al jugador; contexto)_: Un carro volcado oculta provisiones.
- _Conecta con: Paso de los cazadores, Refugio de carboneros (espesura), Claro de las hachas_

**Cofre `b1_c01`** _(4 oro; Poción de curación)_

**Cofre `b1_c03`** _(3 oro; Poción de curación)_

**Cofre con obstáculo `b1_o01`** _(5 oro; Fuego de alquimista; necesita Palanqueta)_
- `b1_o01.obstacle.title`: Arcón clavado
- `b1_o01.obstacle.text`: Un arcón clavado al suelo del carromato.
- `b1_o01.obstacle.use`: {who} arranca los clavos con la palanqueta.
- `b1_o01.obstacle.missing`: Con una palanqueta lo soltaríamos. En la tienda del pueblo venden.
- `b1_o01.obstacle.alt.try` _(sin objeto, Fuerza CD 12)_: {who} tira del arcón con todas sus fuerzas.
- `b1_o01.obstacle.alt.hurt`: Un clavo suelto le hace un corte a {who}

#### Refugio de carboneros (`b1_r04`)

- `b1_r04.name`: Refugio de carboneros
- `b1_r04.description` _(no se muestra al jugador; contexto)_: Una hoguera fría, a salvo entre rocas.
- _Conecta con: Carromato abandonado (espesura), Vereda del miedo_

**Descanso `b1_rest1`** _(corto)_
- `b1_rest1.name`: Refugio de carboneros
- `b1_rest1.description`: Lugar protegido; permite regresar a Vegaumbría.

**Diálogo `b1_d01`**
- `b1_d01.lines[0]` **Narrador:** Entre los robles aparece una anciana encorvada, con un cesto de setas y un chal de musgo.
- `b1_d01.lines[1]` **La abuela Brezna:** No te preocupes, que no muerdo. Me llaman abuela Brezna. Llevo aquí más años que muchos de estos robles.
- `b1_d01.lines[2]` **Héroe:** Busco a las personas que han desaparecido en Umbría. ¿Has visto algo extraño?
- `b1_d01.lines[3]` **La abuela Brezna:** En Vegaumbría me cuentan sus penas. Te daré un consejo: si oyes que alguien te llama desde un sendero vacío, no respondas.

**Escena `b1_ev01` (Decisión)** — _solo al volver a la zona, después de b2_r01_
- `b1_ev01.title`: El leñador del refugio
- `b1_ev01.text`: Un leñador herido suplica ayuda. «No me dejes dormirme. Cuando cierro los ojos, vuelvo al mismo árbol».
- `b1_ev01.question`: ¿Qué haces?
- `b1_ev01.options[0].label`: Darle una poción de curación _(requiere Poción de curación)_
  - `b1_ev01.options[0].ok.text`: Se pone en pie. «Solo vi que el camino se cerraba como una mano». Te da su paga antes de irse a Vegaumbría. [+7 oro; entrega: Poción de curación]
- `b1_ev01.options[1].label`: Vendarle y acompañarle _(Sabiduría CD 11)_
  - `b1_ev01.options[1].ok.text`: Le vendas la herida y le indicas la salida. Te deja su paga. [+7 oro]
  - `b1_ev01.options[1].fail.text`: No consigues cerrar la herida, pero le ayudas a caminar hasta la linde.
- `b1_ev01.options[2].label`: Indicarle la salida
  - `b1_ev01.options[2].ok.text`: Se aleja despacio hacia Vegaumbría.

#### Vereda del miedo (`b1_r05`)

- `b1_r05.name`: Vereda del miedo
- `b1_r05.description` _(no se muestra al jugador; contexto)_: Dos fugitivos empuñan armas temblorosas.
- _Conecta con: Refugio de carboneros, Hueco del roble, Barranco del eco_

**Combate `b1_e02`**: Bandido extraviado (Bandit, vanguardia, Scimitar). _(Nombres de enemigos editables como `b1_e02.enemies[n].name`)_

**Diálogo `b1_d04`**
- `b1_d04.lines[0]` **Narrador:** Entre las zarzas, dos bandidos te apuntan con las armas. Les tiemblan las manos.
- `b1_d04.lines[1]` **Héroe:** Bajad eso. No he venido a por vosotros.

**Escena `b1_q01` (Decisión)** — _después de b1_e02, ilustración: escena_fugitivo_robles_
- `b1_q01.title`: El fugitivo entre los robles
- `b1_q01.text`: Un bandido herido descansa contra las raíces de un roble. Se sujeta el brazo y te mira, agotado.
- `b1_q01.question`: ¿Qué haces con él?
- `b1_q01.options[0].label`: Vendarle el brazo y dejarle ir
  - `b1_q01.options[0].ok.text`: «Gracias. Junto a las zarzas del sendero de las campanillas hay un paso oculto que usaban los leñadores», dice antes de marcharse. [descubre secreto b1_s02 → área secreta b1_s02_r01]
- `b1_q01.options[1].label`: Pedirle información sobre el bosque _(Carisma CD 12)_
  - `b1_q01.options[1].ok.text`: Te señala una barricada próxima y te deja sus monedas antes de marcharse. [+7 oro]
  - `b1_q01.options[1].fail.text`: No se fía de ti y escapa. Sus gritos atraen a un lobo hacia la barricada. [un enemigo más en b1_e04]
- `b1_q01.options[2].label`: Dejarle marchar
  - `b1_q01.options[2].ok.text`: Se aleja cojeando entre los helechos.

#### Hueco del roble (`b1_r06`)

- `b1_r06.name`: Hueco del roble
- `b1_r06.description` _(no se muestra al jugador; contexto)_: Una señal de cazadores está oculta bajo corteza.
- _Conecta con: Vereda del miedo, Barricada de ramas, Cubil del vigía (paso secreto)_

**Secreto `b1_s01`** _(abre chest:b1_c02; se lee al descubrirlo)_
- `b1_s01.description`: La corteza suelta revela un pequeño escondite.

**Cofre `b1_c02`** _(2 oro; Ungüento restaurador)_

**Escena `b1_s01_pista` (Pista de secreto)** — _abre el secreto b1_s01_
- `b1_s01_pista.title`: La memoria del roble
- `b1_s01_pista.text`: El tronco de un roble devuelve un eco extraño. El aire se filtra entre sus raíces, como si ocultasen un hueco.
- `b1_s01_pista.question`: ¿Cómo investigas el hueco?
- `b1_s01_pista.options[0].label`: Seguir el aire entre las raíces _(Sabiduría CD 12)_
  - `b1_s01_pista.options[0].ok.text`: El aire y el eco te permiten localizar un cofre escondido entre las raíces. [descubre secreto b1_s01 → chest:b1_c02]
  - `b1_s01_pista.options[0].fail.text`: No das con ello por ahí.
- `b1_s01_pista.options[1].label`: Escuchar el eco junto al tronco _(Inteligencia CD 12)_
  - `b1_s01_pista.options[1].ok.text`: El aire y el eco te permiten localizar un cofre escondido entre las raíces. [descubre secreto b1_s01 → chest:b1_c02]
  - `b1_s01_pista.options[1].fail.text`: No das con ello por ahí.

#### Barricada de ramas (`b1_r07`)

- `b1_r07.name`: Barricada de ramas
- `b1_r07.description` _(no se muestra al jugador; contexto)_: Los últimos bandidos defienden una salida.
- _Conecta con: Hueco del roble, Umbral oscuro, Sendero de las campanillas_

**Combate `b1_e03`**: Bandido acorralado (Bandit, vanguardia, Scimitar), Vigía de la barricada (Bandit, retaguardia, Light Crossbow). _(Nombres de enemigos editables como `b1_e03.enemies[n].name`)_

**Diálogo `b1_d02`**
- `b1_d02.lines[0]` **Narrador:** Los bandidos miran al bosque, no a tu espada.
- `b1_d02.lines[1]` **Héroe:** ¿Qué os persigue?
- `b1_d02.lines[2]` **Narrador:** «Los caminos», murmura uno mientras alza su cimitarra.

**Combate `b1_e04`** _(empieza al verlo)_: Lobo atraído por el alboroto (Wolf, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b1_e04.enemies[n].name`)_

**Descanso `b1_rest2`** _(corto)_
- `b1_rest2.name`: Rincón resguardado
- `b1_rest2.description`: Un hueco tranquilo donde recobrar el aliento; permite regresar a Vegaumbría.

**Cofre con obstáculo `b1_o02`** _(7 oro; Poción de curación; necesita Antorcha, Fuego de alquimista)_
- `b1_o02.obstacle.title`: Barricada de ramas
- `b1_o02.obstacle.text`: Una barricada de ramas secas cierra un rincón del camino.
- `b1_o02.obstacle.use`: {who} prende las ramas con {item}; cuando se apagan, el paso queda libre.
- `b1_o02.obstacle.missing`: Las ramas están atadas con fuerza: habría que quemarlas con una antorcha o con fuego de alquimista.

**Escena `b1_q02` (Decisión)** — _después de b1_e03, ilustración: escena_barricada_cede_
- `b1_q02.title`: La barricada cede
- `b1_q02.text`: Tras la pelea, una antorcha caída prende la barricada y un bandido queda atrapado entre los restos.
- `b1_q02.question`: ¿Qué haces?
- `b1_q02.options[0].label`: Apagar la antorcha y sacarle
  - `b1_q02.options[0].ok.text`: Apagas las llamas y liberas al bandido. «Conozco un rastro de lobo; me ocuparé de alejarlo», promete. [elimina el combate b1_e04]
- `b1_q02.options[1].label`: Levantar los troncos a pulso _(Fuerza CD 12)_
  - `b1_q02.options[1].ok.text`: Apartas los troncos y lo liberas. Agradecido, te entrega una poción que guardaba. [recibe: Poción de curación]
  - `b1_q02.options[1].fail.text`: Los troncos caen con estrépito. Logras liberarlo, pero el ruido atrae a un lobo. [un enemigo más en b1_e04]

#### Umbral oscuro (`b1_r08`)

- `b1_r08.name`: Umbral oscuro
- `b1_r08.description` _(no se muestra al jugador; contexto)_: El bosque se cierra detrás del último roble.
- _Conecta con: Barricada de ramas, Raíces de bienvenida (sendero)_

#### Claro de las hachas (`b1_r09`)

- `b1_r09.name`: Claro de las hachas
- `b1_r09.description` _(no se muestra al jugador; contexto)_: Tres tocones recién cortados rodean un hacha oxidada, clavada en una raíz que aún sangra savia oscura.
- _Conecta con: Carromato abandonado_

**Diálogo `b1_d05`**
- `b1_d05.lines[0]` **Narrador:** Los cortes siguen frescos. Las raíces nuevas se han cerrado sobre el mango del hacha.
- `b1_d05.lines[1]` **Héroe:** Parece que el bosque se defendió de quien talaba aquí.

**Cofre `b1_c06`** _(4 oro)_

#### Barranco del eco (`b1_r10`)

- `b1_r10.name`: Barranco del eco
- `b1_r10.description` _(no se muestra al jugador; contexto)_: Un barranco estrecho repite las palabras con una voz apenas distinta. En la pared quedan restos de una cuerda rota.
- _Conecta con: Vereda del miedo_

**Diálogo `b1_d06`**
- `b1_d06.lines[0]` **Narrador:** Pronuncias el nombre de un leñador. Al repetirlo, el eco se adelanta a tu voz.
- `b1_d06.lines[1]` **Héroe:** Algo aquí aprende las voces.

**Escena `b1_p04` (Prueba)**
- `b1_p04.title`: El zurrón entre las raíces
- `b1_p04.text`: Un zurrón de provisiones se ha enganchado en las raíces junto al sendero. Una correa sobresale entre las hojas.
- `b1_p04.question`: ¿Cómo intentas recuperarlo?
- `b1_p04.options[0].label`: Tirar de la correa entre las raíces _(Fuerza CD 12)_
  - `b1_p04.options[0].ok.text`: Tiras de la correa hasta liberar el zurrón y sus provisiones. [+4 oro; recibe: Poción de curación]
  - `b1_p04.options[0].fail.text`: Las raíces ceden y te hacen perder el equilibrio. [daño 1d4]
- `b1_p04.options[1].label`: Apartar las hojas con una rama _(Destreza CD 12)_
  - `b1_p04.options[1].ok.text`: Apartas las hojas y desenganchas el zurrón con la rama. [+4 oro; recibe: Poción de curación]
  - `b1_p04.options[1].fail.text`: Las raíces ceden y te hacen perder el equilibrio.
- `b1_p04.fallback.text` (si fallan todas): No consigues recuperar lo que buscabas y te retiras.

**Combate `b1_pat01`** _(patrulla)_: Bandido de la linde (Bandit, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b1_pat01.enemies[n].name`)_

**Escena `b1_pat01_paso` (Prueba)** — _solo al volver a la zona, después de b2_r01_
- `b1_pat01_paso.title`: Patrulla de la linde
- `b1_pat01_paso.text`: Unos bandidos hambrientos te salen al encuentro y exigen un tributo.
- `b1_pat01_paso.question`: ¿Qué haces?
- `b1_pat01_paso.options[0].label`: Luchar
  - `b1_pat01_paso.options[0].ok.text`: Desenvainan las armas. [empieza el combate b1_pat01]
- `b1_pat01_paso.options[1].label`: Esquivarlos _(Destreza CD 12)_
  - `b1_pat01_paso.options[1].ok.text`: Cruzas tras los helechos mientras ellos discuten. [elimina el combate b1_pat01]
  - `b1_pat01_paso.options[1].fail.text`: Te descubren. [empieza el combate b1_pat01]
- `b1_pat01_paso.options[2].label`: Espantarlos _(Carisma CD 12)_
  - `b1_pat01_paso.options[2].ok.text`: Les haces creer que vienen refuerzos por el sendero. Retroceden y desaparecen. [elimina el combate b1_pat01]
  - `b1_pat01_paso.options[2].fail.text`: No se lo tragan. [empieza el combate b1_pat01]

#### Sendero de las campanillas (`b1_r11`)

- `b1_r11.name`: Sendero de las campanillas
- `b1_r11.description` _(no se muestra al jugador; contexto)_: Campanillas de hueso y madera cuelgan entre dos árboles, pero ninguna suena al rozarla.
- _Conecta con: Barricada de ramas, Garita de las cintas (paso secreto)_

**Escena `b1_s02_pista` (Pista de secreto)** — _abre el secreto b1_s02_
- `b1_s02_pista.title`: Las marcas del sendero
- `b1_s02_pista.text`: Junto a las raíces del sendero hay huellas casi borradas. Unas muescas en el tronco cercano podrían señalar un escondite.
- `b1_s02_pista.question`: ¿Cómo buscas el escondite?
- `b1_s02_pista.options[0].label`: Seguir las huellas entre las raíces _(Sabiduría CD 12)_
  - `b1_s02_pista.options[0].ok.text`: Las señales de los leñadores revelan la entrada a un paso oculto. [descubre secreto b1_s02 → área secreta b1_s02_r01]
  - `b1_s02_pista.options[0].fail.text`: No das con ello por ahí.
- `b1_s02_pista.options[1].label`: Examinar las muescas del tronco _(Inteligencia CD 13)_
  - `b1_s02_pista.options[1].ok.text`: Las señales de los leñadores revelan la entrada a un paso oculto. [descubre secreto b1_s02 → área secreta b1_s02_r01]
  - `b1_s02_pista.options[1].fail.text`: No das con ello por ahí.

#### Cubil del vigía (`b1_s01_r01`) — ÁREA SECRETA

- `b1_s01_r01.name`: Cubil del vigía
- `b1_s01_r01.description` _(no se muestra al jugador; contexto)_: Un escondite dentro de un tronco muerto: una manta podrida, un cuenco de barro y un zurrón colgado.
- _Conecta con: Hueco del roble (paso secreto)_

**Diálogo `b1_d07`**
- `b1_d07.lines[0]` **Narrador:** Una hoja de diario, casi borrada, anota los nombres de quienes entraban al bosque.
- `b1_d07.lines[1]` **Héroe:** «Hoy el árbol me ha devuelto un nombre antes de oírlo».

**Combate `b1_e05`**: Lobo del cubil (Wolf, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b1_e05.enemies[n].name`)_

**Cofre `b1_c04`** _(9 oro; Poción de curación)_

#### Garita de las cintas (`b1_s02_r01`) — ÁREA SECRETA

- `b1_s02_r01.name`: Garita de las cintas
- `b1_s02_r01.description` _(no se muestra al jugador; contexto)_: Un escondite abandonado donde cuelgan cintas de tela de las cuadrillas de leñadores.
- _Conecta con: Sendero de las campanillas (paso secreto)_

**Diálogo `b1_d08`**
- `b1_d08.lines[0]` **Narrador:** Una nota pide que nadie toque las marcas nuevas, «porque alguien escucha desde los tocones».

**Combate `b1_e06`**: Bandido escondido (Bandit, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b1_e06.enemies[n].name`)_

**Cofre `b1_c05`** _(11 oro; Poción de curación)_

### Zona 2: Bosque profundo (`b2`)

- `b2.name`: Bosque profundo
- `b2.description`: Troncos colosales y raíces que parecen escuchar. _(no se muestra al jugador; contexto)_

**Diálogo al entrar en la zona** (`b2.entry_dialogue`):
- `b2.entry_dialogue[0]` **Narrador:** Los árboles crecen tan juntos que apenas dejan pasar la luz. Entre sus raíces hay restos de antiguas hogueras.
- `b2.entry_dialogue[1]` **Héroe:** Cada crujido llega de un lugar distinto, como si alguien escuchara desde los troncos.

**Pendientes del diario** (se apuntan al llegar a «desde» y se borran al llegar a «hasta»):
- `b2_j01.text` _(desde b2_r02, hasta b2_g01)_: Una verja de raíces impide cruzar un pasillo visible.
- `b2_j02.text` _(desde b2_r09, hasta b2_s02)_: La resina esconde una marca que se repite en los troncos.
- `b2_j03.text` _(desde b2_r06, hasta b2_s01)_: Unas huellas grandes conducen fuera de la senda principal.

#### Raíces de bienvenida (`b2_r01`)

- `b2_r01.name`: Raíces de bienvenida
- `b2_r01.description` _(no se muestra al jugador; contexto)_: Una cazadora herida vigila el único paso.
- _Conecta con: Tronco partido, Umbral oscuro (sendero)_

**Aliado de la zona 2** (por defecto Maren Brezoscuro):
_Presentación de Maren Brezoscuro:_
- `b2_r01.ally.default_scene[0]` **Maren Brezoscuro:** Soy Maren. Busco a mi hermano, que vino a talar aquí. No pienso volver sin él.
- `b2_r01.ally.default_scene[1]` **Héroe:** Entonces avancemos juntos.
_Presentación de Maese Corvalen si sustituye a Maren Brezoscuro:_
- `b2_r01.ally.brunna_scene[0]` **Maese Corvalen:** Soy Corvalen. Seguí las marcas de savia desde Vegaumbría; una raíz me cerró el regreso.
- `b2_r01.ally.brunna_scene[1]` **Héroe:** Necesitaré tus conocimientos. Ven conmigo.

#### Tronco partido (`b2_r02`)

- `b2_r02.name`: Tronco partido
- `b2_r02.description` _(no se muestra al jugador; contexto)_: Una bestia olfatea una mochila abandonada.
- _Conecta con: Raíces de bienvenida, Paso de zarzas (espesura), Pasaje de las raíces tensas (verja de raíces, se abre con palanca)_

**Combate `b2_e01`**: Oso pardo (Brown Bear, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b2_e01.enemies[n].name`)_

**Cofre `b2_c01`** _(5 oro; Arco largo +1)_

**Diálogo `b2_d05`**
- `b2_d05.lines[0]` **Narrador:** Entre los troncos se distinguen raíces tensas, dispuestas como una verja natural.
- `b2_d05.lines[1]` **Héroe:** Por aquí no se puede apartarlas. Tendrá que haber otra forma de aflojarlas.

#### Paso de zarzas (`b2_r03`)

- `b2_r03.name`: Paso de zarzas
- `b2_r03.description` _(no se muestra al jugador; contexto)_: La maleza vibra al rozarla.
- _Conecta con: Tronco partido (espesura), Cabaña de resineros_

**Trampa `b2_t01`** _(si no se detecta, se lee la descripción)_
- `b2_t01.name`: Raíces que aprietan
- `b2_t01.description`: Algo cruje bajo tus pies…
- _(efecto, no se cambia: 2d6 contundente; velocidad 0 hasta superar CD 13 Fuerza.)_

**Combate `b2_e02`**: Arbusto despertado (Awakened Shrub, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b2_e02.enemies[n].name`)_

**Combate `b2_e07`**: Zarza despertada (Awakened Shrub, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b2_e07.enemies[n].name`)_

**Cofre con obstáculo `b2_o01`** _(6 oro; Poción de curación; necesita Antorcha, Fuego de alquimista)_
- `b2_o01.obstacle.title`: Zarzas
- `b2_o01.obstacle.text`: Unas zarzas tapan un rincón donde brilla algo.
- `b2_o01.obstacle.use`: {who} quema las zarzas con {item}.
- `b2_o01.obstacle.missing`: Con fuego despejaríamos las zarzas.
- `b2_o01.obstacle.alt.try` _(sin objeto, Destreza CD 12)_: {who} intenta colarse entre las espinas.
- `b2_o01.obstacle.alt.hurt`: Las espinas le hacen cortes a {who}

**Combate `b2_pat01`** _(patrulla)_: Lobo de la maleza (Wolf, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b2_pat01.enemies[n].name`)_

**Escena `b2_pat01_paso` (Prueba)** — _solo al volver a la zona, después de b3_r01_
- `b2_pat01_paso.title`: Lobos en la maleza
- `b2_pat01_paso.text`: Unos lobos aparecen entre la vegetación y muestran los dientes.
- `b2_pat01_paso.question`: ¿Qué hacéis?
- `b2_pat01_paso.options[0].label`: Luchar
  - `b2_pat01_paso.options[0].ok.text`: Os rodean entre gruñidos. [empieza el combate b2_pat01]
- `b2_pat01_paso.options[1].label`: Esquivarlos _(Destreza CD 13)_
  - `b2_pat01_paso.options[1].ok.text`: El viento os favorece: siguen otro rastro sin oleros. [elimina el combate b2_pat01]
  - `b2_pat01_paso.options[1].fail.text`: Os descubren. [empieza el combate b2_pat01]
- `b2_pat01_paso.options[2].label`: Espantarlos _(Carisma CD 13)_
  - `b2_pat01_paso.options[2].ok.text`: ¡Atrás! Los lobos se retiran ante la firmeza del grupo. [elimina el combate b2_pat01]
  - `b2_pat01_paso.options[2].fail.text`: No se lo tragan. [empieza el combate b2_pat01]

#### Cabaña de resineros (`b2_r04`)

- `b2_r04.name`: Cabaña de resineros
- `b2_r04.description` _(no se muestra al jugador; contexto)_: La puerta aguanta contra las raíces.
- _Conecta con: Paso de zarzas, Nido de seda, Anillo de resina_

**Descanso `b2_rest1`** _(corto)_
- `b2_rest1.name`: Cabaña de resineros
- `b2_rest1.description`: Lugar protegido; permite regresar a Vegaumbría.

**Diálogo `b2_d01`**
- `b2_d01.lines[0]` **La abuela Brezna:** Veo que has llegado hasta aquí. Mejor: así no te perderé de vista.
- `b2_d01.lines[1]` **Héroe:** ¿Cómo sabías dónde encontrarme?
- `b2_d01.lines[2]` **La abuela Brezna:** Conozco los atajos. Todos, incluso los que no recuerdas haber tomado.
- `b2_d01.gift.text` _(regala Antídoto si no lleváis Antídoto ni Poción de resistencia (veneno))_: Y toma esto: un antídoto. Más adelante hay un nido de arañas y su veneno no perdona.

**Escena `b2_ev01` (Decisión)** — _solo al volver a la zona, después de b2_g01_
- `b2_ev01.title`: La viajera de los antídotos
- `b2_ev01.text`: Una mercader que ha sobrevivido al bosque os ofrece remedios. «No pienso tentar dos veces a la suerte».
- `b2_ev01.question`: ¿Le compráis algo?
- `b2_ev01.options[0].label`: Una poción de curación _(cuesta 20 oro)_
  - `b2_ev01.options[0].ok.text`: «Que no os haga falta.» [recibe: Poción de curación]
- `b2_ev01.options[1].label`: Un antídoto _(cuesta 15 oro)_
  - `b2_ev01.options[1].ok.text`: «Para las arañas del nido.» [recibe: Antídoto]
- `b2_ev01.options[2].label`: Nada, gracias
  - `b2_ev01.options[2].ok.text`: «Vi huellas de varios hombres siguiendo a una sola persona. Id con cuidado.»

#### Nido de seda (`b2_r05`)

- `b2_r05.name`: Nido de seda
- `b2_r05.description` _(no se muestra al jugador; contexto)_: La luz se pierde en telarañas densas.
- _Conecta con: Cabaña de resineros, Barrera de colmillos_

**Combate `b2_e03`**: Araña gigante (Giant Spider, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b2_e03.enemies[n].name`)_

**Combate `b2_e06`**: Oso lechuza territorial (Owlbear, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b2_e06.enemies[n].name`)_

**Combate `b2_e08`**: Araña del ramaje (Giant Spider, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b2_e08.enemies[n].name`)_

**Cofre `b2_c03`** _(Varita de telarañas)_

**Aviso `b2_n01`** _(sale al llegar; «text» si no lleváis Antídoto ni Poción de resistencia (veneno), «text_ok» si lo lleváis)_
- `b2_n01.title`: Nido de seda
- `b2_n01.text`: Cuidado: las arañas de este nido envenenan. Sin antídoto lo pasaremos mal. En la tienda del pueblo venden.
- `b2_n01.text_ok`: Cuidado: las arañas de este nido envenenan. Tened el antídoto a mano.

**Diálogo `b2_d06`**
- `b2_d06.lines[0]` **Narrador:** Una bolsa de cazador cuelga sobre el nido. Dentro hay un dibujo de la verja de raíces, hecho por alguien que buscaba cómo abrirla.

#### Barrera de colmillos (`b2_r06`)

- `b2_r06.name`: Barrera de colmillos
- `b2_r06.description` _(no se muestra al jugador; contexto)_: Un gran lobo defiende un paso estrecho.
- _Conecta con: Nido de seda, Umbral de aguas negras (espesura), Charca de barro (paso secreto), Pasaje de las raíces tensas_

**Combate `b2_e04`**: Lobo terrible (Dire Wolf, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b2_e04.enemies[n].name`)_

**Cofre `b2_c02`** _(6 oro; Daga de plata)_

**Secreto `b2_s01`** _(abre exit:b2_r07; se lee al descubrirlo)_
- `b2_s01.description`: Huellas grandes conducen a una charca escondida.

**Escena `b2_s01_pista` (Pista de secreto)** — _abre el secreto b2_s01_
- `b2_s01_pista.title`: Huellas entre las raíces
- `b2_s01_pista.text`: Las huellas de un lobo abandonan el sendero y se pierden entre las grandes raíces. Quizá oculten una ruta.
- `b2_s01_pista.question`: ¿Cómo lo buscáis?
- `b2_s01_pista.options[0].label`: Seguir las huellas junto a las raíces _(Sabiduría CD 12)_
  - `b2_s01_pista.options[0].ok.text`: El rastro interrumpido permite localizar un paso hacia otra parte del bosque. [descubre secreto b2_s01 → exit:b2_r07]
  - `b2_s01_pista.options[0].fail.text`: No dais con ello por ahí.
- `b2_s01_pista.options[1].label`: Examinar los huecos entre las raíces _(Inteligencia CD 13)_
  - `b2_s01_pista.options[1].ok.text`: El rastro interrumpido permite localizar un paso hacia otra parte del bosque. [descubre secreto b2_s01 → exit:b2_r07]
  - `b2_s01_pista.options[1].fail.text`: No dais con ello por ahí.

#### Charca de barro (`b2_r07`)

- `b2_r07.name`: Charca de barro
- `b2_r07.description` _(no se muestra al jugador; contexto)_: Un jabalí enorme levanta tierra con los colmillos.
- _Conecta con: Barrera de colmillos (paso secreto), Umbral de aguas negras, Claro de las marcas, Orilla olvidada (paso secreto)_

**Combate `b2_e05`** _(empieza al verlo)_: Jabalí gigante (Giant Boar, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b2_e05.enemies[n].name`)_

**Descanso `b2_rest2`** _(corto)_
- `b2_rest2.name`: Rincón resguardado
- `b2_rest2.description`: Un hueco tranquilo donde recobrar el aliento; permite regresar a Vegaumbría.

**Cofre con obstáculo `b2_o02`** _(6 oro; Poción de resistencia (veneno); necesita Cuerda)_
- `b2_o02.obstacle.title`: Cofre en el barro
- `b2_o02.obstacle.text`: Un cofre asoma hundido en el barro de la charca.
- `b2_o02.obstacle.use`: {who} ata la cuerda al asa y lo sacáis entre todos.
- `b2_o02.obstacle.missing`: Con una cuerda lo sacaríamos del barro. En la tienda del pueblo venden.
- `b2_o02.obstacle.alt.try` _(sin objeto, Fuerza CD 13)_: {who} se mete en el barro para sacarlo.
- `b2_o02.obstacle.alt.hurt`: El barro atrapa a {who}, que sale magullado

#### Umbral de aguas negras (`b2_r08`)

- `b2_r08.name`: Umbral de aguas negras
- `b2_r08.description` _(no se muestra al jugador; contexto)_: El suelo se vuelve esponjoso bajo los pies.
- _Conecta con: Barrera de colmillos (espesura), Charca de barro, Ermita del farol (sendero)_

**Diálogo `b2_d02`**
- `b2_d02.lines[0]` **Narrador:** Las raíces dejan de oponerse. La tensión de los troncos cambia con un crujido prolongado.
- `b2_d02.lines[1]` **Héroe:** No parece casualidad.

#### Anillo de resina (`b2_r09`)

- `b2_r09.name`: Anillo de resina
- `b2_r09.description` _(no se muestra al jugador; contexto)_: Un círculo de troncos heridos rodea una poza de resina endurecida. Unas tablas llevan hasta una caja abandonada.
- _Conecta con: Cabaña de resineros, Archivo de savia (paso secreto)_

**Diálogo `b2_d03`**
- `b2_d03.lines[0]` **Narrador:** La resina ha llenado desde dentro las incisiones de cada tronco.
- `b2_d03.lines[1]` **Héroe:** Aquí las heridas parecen responderse unas a otras.

**Escena `b2_q01` (Decisión)** — _ilustración: escena_caja_resineros_
- `b2_q01.title`: La caja de los resineros
- `b2_q01.text`: Un cofre descansa sobre tablones entre los árboles. Una resina amarillenta cubre la madera y desprende vapores irritantes.
- `b2_q01.question`: ¿Qué intentas?
- `b2_q01.options[0].label`: Equilibrarte sobre los troncos _(Destreza CD 13)_
  - `b2_q01.options[0].ok.text`: Alcanzas el cofre y encuentras unas monedas. [+6 oro]
  - `b2_q01.options[0].fail.text`: Resbalas en la resina caliente y debes abandonar el intento. [entrega: Poción de curación]
- `b2_q01.options[1].label`: Examinar la resina de los troncos _(Sabiduría CD 12)_
  - `b2_q01.options[1].ok.text`: Bajo una capa de resina descubres la marca de los resineros, que indica un refugio cercano. [descubre secreto b2_s02 → área secreta b2_s02_r01]
  - `b2_q01.options[1].fail.text`: La resina cubre cualquier señal.
- `b2_q01.options[2].label`: Dejarla intacta
  - `b2_q01.options[2].ok.text`: La caja se queda donde está.

**Cofre `b2_c04`** _(6 oro; Poción de curación)_

#### Archivo de savia (`b2_s02_r01`) — ÁREA SECRETA

- `b2_s02_r01.name`: Archivo de savia
- `b2_s02_r01.description` _(no se muestra al jugador; contexto)_: Una estancia de trabajo cerrada durante años: una mesa, raspadores y frascos vacíos.
- _Conecta con: Anillo de resina (paso secreto)_

**Diálogo `b2_d08`**
- `b2_d08.lines[0]` **Narrador:** Una carta cuenta que las heridas del bosque se cerraban de noche y aparecían en otros árboles.

**Combate `b2_e09`**: Araña de la mesa (Giant Spider, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b2_e09.enemies[n].name`)_

**Cofre `b2_c05`** _(12 oro; Antídoto)_

#### Pasaje de las raíces tensas (`b2_r10`)

- `b2_r10.name`: Pasaje de las raíces tensas
- `b2_r10.description` _(no se muestra al jugador; contexto)_: Un corredor de tierra atraviesa el vientre de un árbol caído. Al fondo cruje la verja de raíces del principio.
- _Conecta con: Barrera de colmillos, Tronco partido (verja de raíces, se abre con palanca)_

**Palanca `b2_g01_open`** _(abre la verja b2_g01, un atajo)_
- `b2_g01_open.name`: La reja que crece
- `b2_g01_open.lines[0]` **Héroe:** Esta es la otra cara de la verja de raíces.
- `b2_g01_open.lines[1]` **Narrador:** Una palanca de piedra asoma del suelo, gastada por muchas manos. Al moverla, las raíces retroceden.
- `b2_g01_open.lines[2]` **Héroe:** Ahora podremos volver sin repetir todo el camino.
- `b2_g01_open.text`: Las raíces se recogen con un crujido profundo. Ahora hay un atajo entre este pasaje y el tronco partido.

#### Claro de las marcas (`b2_r11`)

- `b2_r11.name`: Claro de las marcas
- `b2_r11.description` _(no se muestra al jugador; contexto)_: Árboles con señales de herramientas a distintas alturas. La más reciente está por encima de la cabeza de cualquier leñador.
- _Conecta con: Charca de barro_

**Escena `b2_q02` (Decisión)** — _ilustración: escena_marcas_altas_
- `b2_q02.title`: Las marcas altas
- `b2_q02.text`: Un leñador señala las marcas talladas en el tronco de un árbol. Teme perderse si el bosque cambia de nuevo.
- `b2_q02.question`: ¿Qué le aconsejas?
- `b2_q02.options[0].label`: Ayudarle a orientarse _(Sabiduría CD 12)_
  - `b2_q02.options[0].ok.text`: Al orientarlo por las marcas, el leñador te indica dónde buscar una charca oculta tras la barrera de colmillos. [descubre secreto b2_s01 → exit:b2_r07]
  - `b2_q02.options[0].fail.text`: Las marcas no bastan para encontrar un punto de referencia seguro.
- `b2_q02.options[1].label`: Pagarle 10 monedas por su mapa _(cuesta 10 oro)_
  - `b2_q02.options[1].ok.text`: El mapa marca una charca escondida tras la barrera de colmillos. [descubre secreto b2_s01 → exit:b2_r07]
- `b2_q02.options[2].label`: Apartarte
  - `b2_q02.options[2].ok.text`: El leñador sigue su camino.

#### Orilla olvidada (`b2_s01_r01`) — ÁREA SECRETA

- `b2_s01_r01.name`: Orilla olvidada
- `b2_s01_r01.description` _(no se muestra al jugador; contexto)_: Una charca pequeña donde se acumulan objetos perdidos: un morral hundido y una caja metálica.
- _Conecta con: Charca de barro (paso secreto)_

**Diálogo `b2_d07`**
- `b2_d07.lines[0]` **Narrador:** La nota de un aprendiz de resinero: bajo sus pies, algo repetía los golpes de su corazón.

**Combate `b2_e10`**: Lobo de la orilla (Wolf, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b2_e10.enemies[n].name`)_

**Cofre `b2_c06`** _(10 oro; Poción de resistencia (veneno))_

### Zona 3: Ciénaga (`b3`)

- `b3.name`: Ciénaga
- `b3.description`: Agua negra, niebla y vestigios de un juramento. _(no se muestra al jugador; contexto)_

**Diálogo al entrar en la zona** (`b3.entry_dialogue`):
- `b3.entry_dialogue[0]` **Narrador:** La tierra firme cede ante aguas oscuras y raíces sumergidas. Sobre la ciénaga flota un olor dulce que no oculta la podredumbre.
- `b3.entry_dialogue[1]` **Héroe:** Aquí las voces viajan más lejos que los pasos. Mejor desconfiar hasta de aquello que suena familiar.

**Pendientes del diario** (se apuntan al llegar a «desde» y se borran al llegar a «hasta»):
- `b3_j01.text` _(desde b3_r03, hasta b4_r05)_: Las luces del pantano conocen voces que no deberían conocer.
- `b3_j02.text` _(desde b3_r06, hasta b3_s02)_: El agua de la ciénaga se cuela bajo las raíces del árbol caído.
- `b3_j03.text` _(desde b3_r07, hasta b3_s01)_: La piedra del túmulo guarda un juramento incompleto.

#### Ermita del farol (`b3_r01`)

- `b3_r01.name`: Ermita del farol
- `b3_r01.description` _(no se muestra al jugador; contexto)_: Un ermitaño protege una pasarela con su lámpara.
- _Conecta con: Pasarela hundida, Umbral de aguas negras (sendero)_

**Aliado de la zona 3** (por defecto Hermano Ismerel):
_Presentación de Hermano Ismerel:_
- `b3_r01.ally.default_scene[0]` **Hermano Ismerel:** Soy Ismerel. Mi farol mantiene lejos a esas luces; he visto cómo nos observan.
- `b3_r01.ally.default_scene[1]` **Héroe:** Acompáñanos. No cruzaremos esta ciénaga a ciegas.
_Presentación de Maese Corvalen si sustituye a Hermano Ismerel:_
- `b3_r01.ally.brunna_scene[0]` **Maese Corvalen:** Llegué por un cauce seco siguiendo símbolos antiguos. Mi lámpara ha mantenido lejos las luces.
- `b3_r01.ally.brunna_scene[1]` **Héroe:** Quédate con nosotros, Corvalen.

#### Pasarela hundida (`b3_r02`)

- `b3_r02.name`: Pasarela hundida
- `b3_r02.description` _(no se muestra al jugador; contexto)_: Tablas podridas cruzan agua negra.
- _Conecta con: Ermita del farol, Luces errantes, Orilla de los juncos blancos_

**Trampa `b3_t01`** _(si no se detecta, se lee la descripción)_
- `b3_t01.name`: Tablones podridos
- `b3_t01.description`: Algo cruje bajo tus pies…
- _(efecto, no se cambia: 2d6 contundente y caída al agua; salir requiere una acción.)_

**Descanso `b3_rest2`** _(corto)_
- `b3_rest2.name`: Rincón resguardado
- `b3_rest2.description`: Un hueco tranquilo donde recobrar el aliento; permite regresar a Vegaumbría.

**Escena `b3_p01` (Prueba)** — _antes de b3_t01_
- `b3_p01.title`: Los tablones podridos
- `b3_p01.text`: Entre el agua y las raíces de la ciénaga, unos tablones podridos forman un paso inestable. Cruzarlo sin hundirse exige encontrar apoyos firmes.
- `b3_p01.question`: ¿Cómo aseguráis el paso?
- `b3_p01.options[0].label`: Pisar la madera junto a las raíces _(Destreza CD 13)_
  - `b3_p01.options[0].ok.text`: Evitáis las tablas podridas y dejáis señalado un paso seguro. [desactiva la trampa b3_t01]
  - `b3_p01.options[0].fail.text`: El apoyo cede sobre el agua y el barro. [daño 1d4]
- `b3_p01.options[1].label`: Apoyar un madero entre las raíces _(Fuerza CD 12)_
  - `b3_p01.options[1].ok.text`: Apoyáis el madero entre las raíces. El paso queda asegurado. [desactiva la trampa b3_t01]
  - `b3_p01.options[1].fail.text`: El apoyo cede sobre el agua y el barro.
- `b3_p01.options[2].label`: Buscar apoyos en las raíces _(Inteligencia CD 12)_
  - `b3_p01.options[2].ok.text`: Reconocéis las raíces firmes y señaláis cómo cruzar sin pisar las tablas podridas. [desactiva la trampa b3_t01]
  - `b3_p01.options[2].fail.text`: El apoyo cede sobre el agua y el barro.
- `b3_p01.fallback.text` (si fallan todas): El paso sigue siendo peligroso. Tendréis que afrontar las tablas podridas.

#### Luces errantes (`b3_r03`)

- `b3_r03.name`: Luces errantes
- `b3_r03.description` _(no se muestra al jugador; contexto)_: Una luz azul oscila entre los juncos.
- _Conecta con: Pasarela hundida, Isla de huesos_

**Combate `b3_e01`**: Fuego fatuo (Will-o'-Wisp, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b3_e01.enemies[n].name`)_

**Escena `b3_q01` (Decisión)** — _después de b3_e01, ilustración: escena_voz_agua_
- `b3_q01.title`: La voz en el agua
- `b3_q01.text`: Una luz azul flota entre la niebla. Una voz extrañamente familiar pide ayuda.
- `b3_q01.question`: ¿Respondes a la voz?
- `b3_q01.options[0].label`: Seguirla con cautela _(Sabiduría CD 13)_
  - `b3_q01.options[0].ok.text`: La voz desaparece entre las raíces de un árbol muerto. En su base descubres un paso oculto hacia otra parte de la ciénaga. [descubre secreto b3_s02 → exit:b3_r07]
  - `b3_q01.options[0].fail.text`: La niebla te desorienta y una criatura despierta cerca de la isla. [un enemigo más en b3_e05]
- `b3_q01.options[1].label`: Apagar la luz con una piedra _(Destreza CD 12)_
  - `b3_q01.options[1].ok.text`: La luz azul se apaga y el aire parece menos hostil. [un enemigo menos en b3_e05]
  - `b3_q01.options[1].fail.text`: La piedra se hunde sin alcanzar la luz.
- `b3_q01.options[2].label`: Ignorarla
  - `b3_q01.options[2].ok.text`: Te alejas sin responder a la voz.

#### Isla de huesos (`b3_r04`)

- `b3_r04.name`: Isla de huesos
- `b3_r04.description` _(no se muestra al jugador; contexto)_: Plumas húmedas cuelgan de los árboles.
- _Conecta con: Luces errantes, Caseta de vigilancia (espesura), Puente del antiguo juramento_

**Combate `b3_e02`**: Arpía (Harpy, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b3_e02.enemies[n].name`)_

**Cofre con obstáculo `b3_c01`** _(6 oro; Periapto de cierre de heridas; necesita Cuerda)_
- `b3_c01.obstacle.title`: Puente roto
- `b3_c01.obstacle.text`: El cofre está en un islote de huesos, al otro lado de un puente de tablas roto sobre el agua negra.
- `b3_c01.obstacle.use`: {who} ata la cuerda a un tronco y cruzáis agarrados a ella.
- `b3_c01.obstacle.missing`: Con una cuerda podríais cruzar. En la tienda del pueblo venden.

**Combate `b3_e05`**: Alma sin reposo (Specter, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b3_e05.enemies[n].name`)_

#### Caseta de vigilancia (`b3_r05`)

- `b3_r05.name`: Caseta de vigilancia
- `b3_r05.description` _(no se muestra al jugador; contexto)_: Un refugio elevado aún conserva su puerta.
- _Conecta con: Isla de huesos (espesura), Bosque sumergido, Fosa de la marea lenta_

**Descanso `b3_rest1`** _(corto)_
- `b3_rest1.name`: Caseta sobre pilotes
- `b3_rest1.description`: Lugar protegido; permite regresar a Vegaumbría.

**Diálogo `b3_d01`**
- `b3_d01.lines[0]` **La abuela Brezna:** Ya casi has llegado. Bajo el agua se oyen voces que conozco muy bien.
- `b3_d01.lines[1]` **Héroe:** ¿De quién son?
- `b3_d01.lines[2]` **La abuela Brezna:** Algunas voces llevan tanto tiempo aquí que han olvidado quiénes eran.

**Escena `b3_ev01` (Decisión)** — _solo al volver a la zona, después de b4_r05_
- `b3_ev01.title`: La rendición junto al agua
- `b3_ev01.text`: Un bandido se rinde. «La anciana sabía mi nombre antes de que yo se lo dijera».
- `b3_ev01.question`: ¿Qué le decís?
- `b3_ev01.options[0].label`: Que vuelva por las marcas del sendero
  - `b3_ev01.options[0].ok.text`: «Si alguien espera en Vegaumbría, decidle que no todos los perdidos murieron.» Os deja lo que llevaba. [+4 oro]
- `b3_ev01.options[1].label`: Que siga su camino
  - `b3_ev01.options[1].ok.text`: Se marcha hacia la linde sin decir nada más.

**Aviso `b3_n_peligro`** _(sale al llegar)_
- `b3_n_peligro.title`: Algo se mueve en el túmulo
- `b3_n_peligro.text`: Desde el túmulo llega un crujido profundo. El barro se levanta como si algo enorme respirase bajo las raíces. No es necesario acercarse: podéis continuar por otro tramo de la ciénaga.

#### Bosque sumergido (`b3_r06`)

- `b3_r06.name`: Bosque sumergido
- `b3_r06.description` _(no se muestra al jugador; contexto)_: Un tronco muerto se endereza sin viento.
- _Conecta con: Caseta de vigilancia, Salida de la niebla (espesura), Túmulo del guardián (paso secreto), Puesto del testigo (paso secreto)_

**Combate `b3_e03`** _(empieza al verlo)_: Árbol ahogado (Walking Tree, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b3_e03.enemies[n].name`)_

**Secreto `b3_s02`** _(abre exit:b3_r07; se lee al descubrirlo)_
- `b3_s02.description`: Un pasaje de raíces conduce al túmulo oculto.

**Escena `b3_s02_pista` (Pista de secreto)** — _abre el secreto b3_s02_
- `b3_s02_pista.title`: El paso entre las raíces
- `b3_s02_pista.text`: El agua de la ciénaga fluye de manera inexplicable. Podría señalar un secreto.
- `b3_s02_pista.question`: ¿Cómo lo buscáis?
- `b3_s02_pista.options[0].label`: Seguir la corriente _(Sabiduría CD 13)_
  - `b3_s02_pista.options[0].ok.text`: La corriente señala un paso entre las raíces que comunica con otra zona de la ciénaga. [descubre secreto b3_s02 → exit:b3_r07]
  - `b3_s02_pista.options[0].fail.text`: No dais con ello por ahí.
- `b3_s02_pista.options[1].label`: Buscar el hueco entre las raíces _(Inteligencia CD 12)_
  - `b3_s02_pista.options[1].ok.text`: La corriente señala un paso entre las raíces que comunica con otra zona de la ciénaga. [descubre secreto b3_s02 → exit:b3_r07]
  - `b3_s02_pista.options[1].fail.text`: No dais con ello por ahí.

#### Túmulo del guardián (`b3_r07`)

- `b3_r07.name`: Túmulo del guardián
- `b3_r07.description` _(no se muestra al jugador; contexto)_: Piedras cubiertas de raíces conservan una ofrenda.
- _Conecta con: Bosque sumergido (paso secreto), Salida de la niebla, Cámara de la promesa (paso secreto)_

**Secreto `b3_s01`** _(abre chest:b3_c02; se lee al descubrirlo)_
- `b3_s01.description`: Una losa floja descubre la ofrenda olvidada.

**Cofre `b3_c02`** _(7 oro; Semilla del primer juramento)_

**Diálogo `b3_d02`**
- `b3_d02.lines[0]` **Narrador:** Una inscripción habla de un guardián que prometió no abandonar jamás estos árboles.
- `b3_d02.lines[1]` **Héroe:** La piedra está caliente, como si respirase.

**Combate `b3_e04`**: Montículo andante del pantano (Shambling Mound, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b3_e04.enemies[n].name`)_

**Cofre con obstáculo `b3_o01`** _(11 oro; Agua bendita; necesita Palanqueta)_
- `b3_o01.obstacle.title`: Túmulo
- `b3_o01.obstacle.text`: La losa de un túmulo antiguo, cubierta de musgo.
- `b3_o01.obstacle.use`: {who} apalanca la losa y la aparta.
- `b3_o01.obstacle.missing`: Con una palanqueta moveríamos la losa. En la tienda del pueblo venden.
- `b3_o01.obstacle.alt.try` _(sin objeto, Fuerza CD 14)_: {who} intenta mover la losa a pulso.
- `b3_o01.obstacle.alt.hurt`: La losa cae sobre el pie de {who}

**Escena `b3_s01_pista` (Pista de secreto)** — _abre el secreto b3_s01_
- `b3_s01_pista.title`: La ofrenda olvidada
- `b3_s01_pista.text`: Una luz tenue se refleja bajo las raíces de la ciénaga. Las hojas se mueven aunque el aire está quieto.
- `b3_s01_pista.question`: ¿Cómo lo buscáis?
- `b3_s01_pista.options[0].label`: Observar las hojas sobre el agua _(Sabiduría CD 13)_
  - `b3_s01_pista.options[0].ok.text`: Las hojas y el reflejo os guían hasta un cofre oculto bajo las raíces. [descubre secreto b3_s01 → chest:b3_c02]
  - `b3_s01_pista.options[0].fail.text`: No conseguís localizar el origen del brillo.
- `b3_s01_pista.options[1].label`: Examinar el hueco bajo las raíces _(Inteligencia CD 12)_
  - `b3_s01_pista.options[1].ok.text`: Las hojas y el reflejo os guían hasta un cofre oculto bajo las raíces. [descubre secreto b3_s01 → chest:b3_c02]
  - `b3_s01_pista.options[1].fail.text`: No conseguís localizar el origen del brillo.

**Escena `b3_q02` (Decisión)** — _ilustración: escena_ofrenda_guardian_
- `b3_q02.title`: La ofrenda del guardián
- `b3_q02.text`: Una antigua ofrenda al guardián del bosque conserva su brillo. Decidís cómo mostrar respeto.
- `b3_q02.question`: ¿Qué hacéis?
- `b3_q02.options[0].label`: Prometer cuidar el bosque _(Carisma CD 13)_
  - `b3_q02.options[0].ok.text`: La semilla emite un destello que señala el lugar donde el antiguo guardián ocultó un cofre. [descubre secreto b3_s01 → chest:b3_c02]
  - `b3_q02.options[0].fail.text`: La luz de la semilla no cambia.
- `b3_q02.options[1].label`: Dejar una poción como ofrenda _(requiere Poción de curación)_
  - `b3_q02.options[1].ok.text`: La semilla se calienta y su calor os reconforta. [entrega: Poción de curación; todo el grupo recupera 5 PG]
- `b3_q02.options[2].label`: Dejarla como está
  - `b3_q02.options[2].ok.text`: Seguís adelante sin tocar la ofrenda.

#### Salida de la niebla (`b3_r08`)

- `b3_r08.name`: Salida de la niebla
- `b3_r08.description` _(no se muestra al jugador; contexto)_: El agua cede ante una escalinata de piedra.
- _Conecta con: Bosque sumergido (espesura), Túmulo del guardián, Círculo de las encinas (sendero)_

#### Orilla de los juncos blancos (`b3_r09`)

- `b3_r09.name`: Orilla de los juncos blancos
- `b3_r09.description` _(no se muestra al jugador; contexto)_: Juncos casi blancos bordean una charca sin insectos. Unas estacas señalan un camino desaparecido.
- _Conecta con: Pasarela hundida_

**Diálogo `b3_d03`**
- `b3_d03.lines[0]` **Narrador:** El barro conserva huellas que llegan a la orilla. Ninguna sale del agua.
- `b3_d03.lines[1]` **Héroe:** No son huellas de quien haya logrado salir por su propio pie.

**Cofre `b3_c06`** _(4 oro; Antídoto)_

**Combate `b3_pat01`** _(patrulla)_: Bandido extraviado (Bandit, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b3_pat01.enemies[n].name`)_

**Escena `b3_pat01_paso` (Prueba)** — _solo al volver a la zona, después de b4_r01_
- `b3_pat01_paso.title`: Extraviados de la ciénaga
- `b3_pat01_paso.text`: Dos hombres armados exigen comida a cambio de dejaros continuar.
- `b3_pat01_paso.question`: ¿Qué hacéis?
- `b3_pat01_paso.options[0].label`: Luchar
  - `b3_pat01_paso.options[0].ok.text`: No os dejan otra salida. [empieza el combate b3_pat01]
- `b3_pat01_paso.options[1].label`: Esquivarlos _(Destreza CD 13)_
  - `b3_pat01_paso.options[1].ok.text`: Bordeáis las estacas por una franja de barro firme. [elimina el combate b3_pat01]
  - `b3_pat01_paso.options[1].fail.text`: Os descubren. [empieza el combate b3_pat01]
- `b3_pat01_paso.options[2].label`: Espantarlos _(Carisma CD 13)_
  - `b3_pat01_paso.options[2].ok.text`: «El camino a Vegaumbría está abierto. Marchaos». Bajan las armas. [elimina el combate b3_pat01]
  - `b3_pat01_paso.options[2].fail.text`: No se lo tragan. [empieza el combate b3_pat01]

#### Puente del antiguo juramento (`b3_r10`)

- `b3_r10.name`: Puente del antiguo juramento
- `b3_r10.description` _(no se muestra al jugador; contexto)_: Dos monolitos sostienen un arco de madera petrificada sobre agua poco profunda.
- _Conecta con: Isla de huesos_

**Diálogo `b3_d04`**
- `b3_d04.lines[0]` **Héroe:** Las piedras tienen la misma forma que las marcas del bosque profundo.
- `b3_d04.lines[1]` **Narrador:** Bajo el arco, el agua murmura una palabra que nadie alcanza a reconocer.

**Diálogo `b3_d04b`** — _SOLO SI VA HERMANO ISMEREL_
- `b3_d04b.lines[0]` **Hermano Ismerel:** Un juramento puede torcerse cuando nadie recuerda por qué se pronunció.

**Escena `b3_p02` (Prueba)**
- `b3_p02.title`: El saquito sumergido
- `b3_p02.text`: Un saquito asoma bajo el agua fría junto a las raíces. El barro amenaza con hundirse al acercaros.
- `b3_p02.question`: ¿Cómo lo sacáis?
- `b3_p02.options[0].label`: Entrar en el agua junto a las raíces _(Constitución CD 12)_
  - `b3_p02.options[0].ok.text`: Recuperáis el saquito junto a las raíces. [+4 oro; recibe: Poción de curación]
  - `b3_p02.options[0].fail.text`: El agua fría os entumece y os obliga a retroceder. [daño 1d4]
- `b3_p02.options[1].label`: Buscar apoyo en las raíces _(Sabiduría CD 13)_
  - `b3_p02.options[1].ok.text`: Recuperáis el saquito junto a las raíces. [+4 oro; recibe: Poción de curación]
  - `b3_p02.options[1].fail.text`: El agua fría os entumece y os obliga a retroceder.
- `b3_p02.fallback.text` (si fallan todas): No conseguís recuperar lo que buscabais y os retiráis.

#### Fosa de la marea lenta (`b3_r11`)

- `b3_r11.name`: Fosa de la marea lenta
- `b3_r11.description` _(no se muestra al jugador; contexto)_: Una depresión retiene agua oscura que sube y baja sin relación con la corriente.
- _Conecta con: Caseta de vigilancia_

**Cofre `b3_c05`** _(7 oro; Antídoto)_

#### Puesto del testigo (`b3_s02_r01`) — ÁREA SECRETA

- `b3_s02_r01.name`: Puesto del testigo
- `b3_s02_r01.description` _(no se muestra al jugador; contexto)_: Una pequeña cripta con un asiento de piedra, una mesa rota y un estandarte sin emblema.
- _Conecta con: Bosque sumergido (paso secreto)_

**Diálogo `b3_d05`**
- `b3_d05.lines[0]` **Narrador:** Un testimonio en piedra: los guardianes debían recordar al espíritu por qué protegía el bosque.
- `b3_d05.lines[1]` **Narrador:** Dejaron de acudir cuando la ciénaga cubrió el camino.

**Combate `b3_e06`**: Vigilante del puesto (Skeleton, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b3_e06.enemies[n].name`)_

**Cofre `b3_c03`** _(12 oro; Poción de curación)_

#### Cámara de la promesa (`b3_s01_r01`) — ÁREA SECRETA

- `b3_s01_r01.name`: Cámara de la promesa
- `b3_s01_r01.description` _(no se muestra al jugador; contexto)_: Un santuario pequeño detrás de la ofrenda: un cuenco de piedra, dos relieves y una raíz en el centro.
- _Conecta con: Túmulo del guardián (paso secreto)_

**Diálogo `b3_d06`**
- `b3_d06.lines[0]` **Narrador:** Tres frases talladas: «Uno vigila». «Muchos recuerdan». «Nadie debe vigilar solo».
- `b3_d06.lines[1]` **Narrador:** La última está dañada desde dentro por las raíces.

**Combate `b3_e07`**: Custodio olvidado (Zombie, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b3_e07.enemies[n].name`)_

**Cofre `b3_c04`** _(14 oro; Poción de curación)_

### Zona 4: Claro maldito e interior del Corazón (`b4`)

- `b4.name`: Claro maldito e interior del Corazón
- `b4.description`: Piedras rituales y cámaras de savia palpitante. _(no se muestra al jugador; contexto)_

**Diálogo al entrar en la zona** (`b4.entry_dialogue`):
- `b4.entry_dialogue[0]` **Narrador:** Las raíces confluyen alrededor de un claro donde la tierra late con un ritmo lento y profundo.
- `b4.entry_dialogue[1]` **Héroe:** Bajo las piedras se percibe un pulso que atraviesa todo Umbría. Si el bosque guarda una respuesta, está aquí.

**Pendientes del diario** (se apuntan al llegar a «desde» y se borran al llegar a «hasta»):
- `b4_j01.text` _(desde b4_r03, hasta b4_s01)_: Una grieta detrás del altar guarda algo oculto.
- `b4_j03.text` _(desde b4_r11, hasta b4_e04)_: Las palabras de la última losa parecen incompletas.
- `b4_j04.text` _(desde b4_r08, hasta b4_s02)_: Tras la raíz silenciosa, un hielo imposible guarda un paso. Hace falta algo del invierno.

#### Círculo de las encinas (`b4_r01`)

- `b4_r01.name`: Círculo de las encinas
- `b4_r01.description` _(no se muestra al jugador; contexto)_: Un círculo de piedras marca la última entrada.
- _Conecta con: Galería de espinas, Salida de la niebla (sendero)_

**Aliado de la zona 4** (por defecto Dama Ivelle de la Encina):
_Presentación de Dama Ivelle de la Encina:_
- `b4_r01.ally.default_scene[0]` **Dama Ivelle de la Encina:** Soy Ivelle. Mi orden juró velar por el druida que unió su vida a este bosque.
- `b4_r01.ally.default_scene[1]` **Dama Ivelle de la Encina:** El juramento debió protegerlo. Algo lo ha torcido.
_Presentación de Maese Corvalen si sustituye a Dama Ivelle de la Encina:_
- `b4_r01.ally.brunna_scene[0]` **Maese Corvalen:** Encontré este círculo descifrando las marcas del túmulo. El antiguo guardián sigue aquí, de algún modo.
- `b4_r01.ally.brunna_scene[1]` **Maese Corvalen:** No os dejaré entrar solos.

#### Galería de espinas (`b4_r02`)

- `b4_r02.name`: Galería de espinas
- `b4_r02.description` _(no se muestra al jugador; contexto)_: La vegetación protege un túnel de tierra.
- _Conecta con: Círculo de las encinas, Altar de savia (espesura), Cripta de la savia seca_

**Combate `b4_e01`**: Arbusto despertado (Awakened Shrub, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b4_e01.enemies[n].name`)_

**Trampa `b4_t01`** _(si no se detecta, se lee la descripción)_
- `b4_t01.name`: Nube de esporas
- `b4_t01.description`: Algo cruje bajo tus pies…
- _(efecto, no se cambia: 2d6 veneno; mitad con salvación superada.)_

**Combate `b4_e05`**: Raíz espinosa (Awakened Shrub, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b4_e05.enemies[n].name`)_

**Descanso `b4_rest2`** _(corto)_
- `b4_rest2.name`: Rincón resguardado
- `b4_rest2.description`: Un hueco tranquilo donde recobrar el aliento; permite regresar a Vegaumbría.

#### Altar de savia (`b4_r03`)

- `b4_r03.name`: Altar de savia
- `b4_r03.description` _(no se muestra al jugador; contexto)_: Una figura feérica vigila el altar.
- _Conecta con: Galería de espinas (espesura), Garganta de raíces, Sala de las manos (paso secreto)_

**Combate `b4_e02`**: Dríade corrompida (Dryad, retaguardia, sin arma indicada), Arbusto despertado (Awakened Shrub, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b4_e02.enemies[n].name`)_

**Escena `b4_s01_pista` (Pista de secreto)** — _abre el secreto b4_s01_
- `b4_s01_pista.title`: El voto enterrado
- `b4_s01_pista.text`: En el interior del árbol, unas marcas brillan entre las raíces retorcidas. Un soplo frío sale de uno de sus huecos.
- `b4_s01_pista.question`: ¿Cómo lo buscáis?
- `b4_s01_pista.options[0].label`: Seguir el aire entre las raíces _(Sabiduría CD 14)_
  - `b4_s01_pista.options[0].ok.text`: Las marcas luminosas dibujan la entrada a un pasadizo oculto entre las raíces. [descubre secreto b4_s01 → área secreta b4_s01_r01]
  - `b4_s01_pista.options[0].fail.text`: No dais con ello por ahí.
- `b4_s01_pista.options[1].label`: Seguir las marcas sobre la madera _(Inteligencia CD 13)_
  - `b4_s01_pista.options[1].ok.text`: Las marcas luminosas dibujan la entrada a un pasadizo oculto entre las raíces. [descubre secreto b4_s01 → área secreta b4_s01_r01]
  - `b4_s01_pista.options[1].fail.text`: No dais con ello por ahí.

**Escena `b4_q01` (Decisión)** — _después de b4_e02, ilustración: escena_altar_herido_
- `b4_q01.title`: El altar herido
- `b4_q01.text`: Una figura cubierta de hojas yace al pie de un altar entre raíces. La savia se extiende por la piedra y amenaza con borrar un juramento.
- `b4_q01.question`: ¿Cómo interpretas las marcas?
- `b4_q01.options[0].label`: Retirar la savia _(Inteligencia CD 13)_
  - `b4_q01.options[0].ok.text`: Retiras la savia y descubres una grieta oculta entre las raíces del altar. [descubre secreto b4_s01 → área secreta b4_s01_r01]
  - `b4_q01.options[0].fail.text`: La savia se endurece. Algo despierta al percibir vuestra presencia. [un enemigo más en b4_e06]
- `b4_q01.options[1].label`: Dejar 10 monedas de ofrenda _(cuesta 10 oro)_
  - `b4_q01.options[1].ok.text`: La savia se aparta de las marcas y deja al descubierto una grieta. [descubre secreto b4_s01 → área secreta b4_s01_r01]
- `b4_q01.options[2].label`: No tocar el altar
  - `b4_q01.options[2].ok.text`: Lo dejáis como está.

#### Garganta de raíces (`b4_r04`)

- `b4_r04.name`: Garganta de raíces
- `b4_r04.description` _(no se muestra al jugador; contexto)_: La piedra palpita bajo una película de savia.
- _Conecta con: Altar de savia, Máscara caída, Cámara de los ecos cautivos_

**Cofre `b4_c01`** _(13 oro; Poción de curación)_

**Diálogo `b4_d01`**
- `b4_d01.lines[0]` **Narrador:** La madera conserva la huella de alguien que intentó escapar del hechizo.
- `b4_d01.lines[1]` **Héroe:** Esto no parece un árbol normal.

**Cofre con obstáculo `b4_o01`** _(13 oro; Poción de curación mayor; necesita Fuego de alquimista)_
- `b4_o01.obstacle.title`: Espinos vivos
- `b4_o01.obstacle.text`: Unos espinos vivos cierran un hueco entre las raíces; se apartan del fuego.
- `b4_o01.obstacle.use`: {who} lanza fuego de alquimista y los espinos se retuercen y se apartan.
- `b4_o01.obstacle.missing`: Solo el fuego de alquimista los haría apartarse.

**Combate `b4_pat01`** _(patrulla)_: Arbusto rezagado (Awakened Shrub, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b4_pat01.enemies[n].name`)_

**Escena `b4_pat01_paso` (Prueba)** — _solo al volver a la zona, después de b4_e04_
- `b4_pat01_paso.title`: Las raíces quietas
- `b4_pat01_paso.text`: Dos arbustos cobran vida y os amenazan mientras el bosque guarda silencio.
- `b4_pat01_paso.question`: ¿Qué hacéis?
- `b4_pat01_paso.options[0].label`: Luchar
  - `b4_pat01_paso.options[0].ok.text`: Se lanzan contra vosotros. [empieza el combate b4_pat01]
- `b4_pat01_paso.options[1].label`: Esquivarlos _(Destreza CD 12)_
  - `b4_pat01_paso.options[1].ok.text`: Pasáis sin hacer ruido mientras las criaturas rastrean el olor de la savia. [elimina el combate b4_pat01]
  - `b4_pat01_paso.options[1].fail.text`: Os descubren. [empieza el combate b4_pat01]
- `b4_pat01_paso.options[2].label`: Espantarlos _(Carisma CD 12)_
  - `b4_pat01_paso.options[2].ok.text`: ¡Se acabó la orden! Vacilan y se repliegan a las grietas. [elimina el combate b4_pat01]
  - `b4_pat01_paso.options[2].fail.text`: No se lo tragan. [empieza el combate b4_pat01]

#### Máscara caída (`b4_r05`)

- `b4_r05.name`: Máscara caída
- `b4_r05.description` _(no se muestra al jugador; contexto)_: Una anciana espera junto a una puerta orgánica.
- _Conecta con: Garganta de raíces, Cámara del descanso_

**Diálogo `b4_d02`**
- `b4_d02.lines[0]` **La abuela Brezna:** Has sido muy útil. Cada paso tuyo ha despertado nuevas raíces.
- `b4_d02.lines[1]` **Héroe:** Tú me condujiste hasta aquí.
- `b4_d02.lines[2]` **La abuela Brezna:** Brezna era una cara prestada. Fui yo quien enseñó al guardián a retener en vez de proteger. Ahora verás la mía.

**Combate `b4_e03`**: La abuela Brezna (Green Hag, retaguardia, sin arma indicada), Arbusto despertado (Awakened Shrub, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b4_e03.enemies[n].name`)_

#### Cámara del descanso (`b4_r06`)

- `b4_r06.name`: Cámara del descanso
- `b4_r06.description` _(no se muestra al jugador; contexto)_: Un círculo de piedra aislado de la savia.
- _Conecta con: Máscara caída, Cámara de los nudos, Antes del último latido_

**Descanso `b4_rest1`** _(corto)_
- `b4_rest1.name`: Santuario de la última vigilia
- `b4_rest1.description`: Lugar protegido; permite regresar a Vegaumbría.

**Cofre `b4_c02`** _(5 oro; Poción de curación)_

**Cofre `b4_c04`** _(Guanteletes de fuerza de ogro; cerradura CD 13)_

#### Cámara de los nudos (`b4_r07`)

- `b4_r07.name`: Cámara de los nudos
- `b4_r07.description` _(no se muestra al jugador; contexto)_: Tres pilares de raíz sostienen una masa de madera petrificada.
- _Conecta con: Cámara del descanso, Raíz silenciosa_

**Combate `b4_e04`**: Nudo de raíz (Awakened Tree, vanguardia, sin arma indicada), El Corazón Hueco (Treant, retaguardia, sin arma indicada). _(Nombres de enemigos editables como `b4_e04.enemies[n].name`)_

#### Raíz silenciosa (`b4_r08`)

- `b4_r08.name`: Raíz silenciosa
- `b4_r08.description` _(no se muestra al jugador; contexto)_: Tras la victoria, las paredes dejan de latir.
- _Conecta con: Cámara de los nudos, Recuerdo de dos estaciones (paso secreto)_

**Cofre `b4_c03`** _(39 oro; Astilla del Corazón)_

**Diálogo `b4_d03`**
- `b4_d03.lines[0]` **Narrador:** El bosque recupera poco a poco su silencio. La tierra deja de estremecerse.
- `b4_d03.lines[1]` **Héroe:** El Corazón ya no puede retener a quienes quieran marcharse.

**Diálogo `b4_d03b`** — _SOLO SI VA MAREN BREZOSCURO_
- `b4_d03b.lines[0]` **Maren Brezoscuro:** Ahí está mi hermano, entre ellos. Respira. Volvemos a casa.

**Escena `b4_s02_pista` (Pista de secreto)** — _antes de m4_e05_
- `b4_s02_pista.title`: La raíz del invierno
- `b4_s02_pista.text`: Dentro del árbol, una raíz está cubierta de escarcha. Sus trazos parecen formar un sello que responde al frío.
- `b4_s02_pista.question`: ¿Qué hacéis?
- `b4_s02_pista.options[0].label`: Examinar la escarcha de la raíz _(Sabiduría CD 13)_
  - `b4_s02_pista.options[0].ok.text`: La hendidura espera algo del mismo frío, pero aún no tienes nada que encaje. [marca «b4_s02_visto» (abre la escena de regreso)]
  - `b4_s02_pista.options[0].fail.text`: El hielo no deja ver nada.
- `b4_s02_pista.options[1].label`: Estudiar los trazos de la madera _(Inteligencia CD 13)_
  - `b4_s02_pista.options[1].ok.text`: La escarcha no procede del bosque. La forma del cierre recuerda a una escama, pero aún no la tienes. [marca «b4_s02_visto» (abre la escena de regreso)]
  - `b4_s02_pista.options[1].fail.text`: No reconocéis el sello.
- `b4_s02_pista.fallback.text` (si fallan todas): La raíz sigue helada. Quizá haya que volver más adelante.

**Escena `b4_s02_abrir` (Pista de secreto)** — _abre el secreto b4_s02, después de m4_e05_
- `b4_s02_abrir.title`: La raíz del invierno
- `b4_s02_abrir.text`: La escama del dragón desprende el mismo frío que la raíz escarchada del interior del árbol.
- `b4_s02_abrir.question`: ¿La usáis?
- `b4_s02_abrir.options[0].label`: Acercar la escama a la raíz
  - `b4_s02_abrir.options[0].ok.text`: La escama responde al sello. La magia del invierno cede y deja al descubierto un pasadizo oculto entre las raíces. [descubre secreto b4_s02 → área secreta b4_s02_r01]

#### Cripta de la savia seca (`b4_r09`)

- `b4_r09.name`: Cripta de la savia seca
- `b4_r09.description` _(no se muestra al jugador; contexto)_: Raíces petrificadas por fuera y polvo por dentro. Varias manos esculpidas señalan una puerta que ya no existe.
- _Conecta con: Galería de espinas_

**Diálogo `b4_d04`**
- `b4_d04.lines[0]` **Narrador:** Una pared muestra a varias personas en círculo alrededor de un solo árbol.
- `b4_d04.lines[1]` **Héroe:** Una vigilia sin compañía puede convertirse en una condena.

**Cofre `b4_c05`** _(13 oro; Poción de curación)_

#### Cámara de los ecos cautivos (`b4_r10`)

- `b4_r10.name`: Cámara de los ecos cautivos
- `b4_r10.description` _(no se muestra al jugador; contexto)_: Cavidades con forma de rostro reproducen murmullos de lugares por los que habéis pasado.
- _Conecta con: Garganta de raíces_

**Diálogo `b4_d05`**
- `b4_d05.lines[0]` **Narrador:** Una cavidad repite la voz de un bandido; otra, el susurro de los juncos.
- `b4_d05.lines[1]` **Héroe:** Son palabras que escuchamos. Este lugar nos ha seguido desde la linde.

**Cofre `b4_c07`** _(10 oro; Antídoto)_

#### Antes del último latido (`b4_r11`)

- `b4_r11.name`: Antes del último latido
- `b4_r11.description` _(no se muestra al jugador; contexto)_: Tres arcos de madera fosilizada conducen hacia una cámara donde la tierra palpita.
- _Conecta con: Cámara del descanso_

**Diálogo `b4_d06`**
- `b4_d06.lines[0]` **Héroe:** A este juramento le falta una palabra. Tal vez aún quede una forma de recordar al guardián lo que prometió.
- `b4_d06.lines[1]` **Héroe:** Si el bosque escucha, intentaré que recuerde.

**Escena `b4_q02` (Decisión)** — _ilustración: escena_ultima_palabra_
- `b4_q02.title`: La última palabra
- `b4_q02.text`: Entre las raíces del árbol, una luz roja ilumina un antiguo altar. Un juramento incompleto resuena en vuestra mente.
- `b4_q02.question`: ¿Cómo respondes al juramento?
- `b4_q02.options[0].label`: «Descansa, guardián» _(Carisma CD 14)_
  - `b4_q02.options[0].ok.text`: La raíz que custodia el juramento deja de agitarse. Su fuerza parece debilitarse. [un enemigo menos en b4_e04]
  - `b4_q02.options[0].fail.text`: No hay respuesta.
- `b4_q02.options[1].label`: Recordar el juramento _(Inteligencia CD 13)_
  - `b4_q02.options[1].ok.text`: Recuerdas que el guardián prometió proteger, no retener. Una savia tibia alivia tus heridas. [todo el grupo recupera 5 PG]
  - `b4_q02.options[1].fail.text`: El eco no completa el juramento.
- `b4_q02.options[2].label`: Guardar silencio
  - `b4_q02.options[2].ok.text`: Guardas silencio. La luz rojiza continúa palpitando.

#### Sala de las manos (`b4_s01_r01`) — ÁREA SECRETA

- `b4_s01_r01.name`: Sala de las manos
- `b4_s01_r01.description` _(no se muestra al jugador; contexto)_: Tres manos talladas se apoyan en un pedestal en el centro del recinto.
- _Conecta con: Altar de savia (paso secreto)_

**Diálogo `b4_d07`**
- `b4_d07.lines[0]` **Narrador:** Un pergamino recuerda el juramento original: escuchar a las personas y apartar el peligro, no impedirles volver a casa.

**Combate `b4_e06`**: Arbusto del pedestal (Awakened Shrub, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b4_e06.enemies[n].name`)_

**Cofre `b4_c06`** _(23 oro; Poción de curación)_

#### Recuerdo de dos estaciones (`b4_s02_r01`) — ÁREA SECRETA

- `b4_s02_r01.name`: Recuerdo de dos estaciones
- `b4_s02_r01.description` _(no se muestra al jugador; contexto)_: Una cavidad donde conviven la corteza verde y el hielo cristalino.
- _Conecta con: Raíz silenciosa (paso secreto)_

**Diálogo `b4_d08`**
- `b4_d08.lines[0]` **Narrador:** Un trozo de cerámica cuenta que el viejo guardián temía un invierno excepcional y guardó memoria del hielo en una raíz.

**Combate `b4_e07`**: Guardia helada (Awakened Shrub, vanguardia, sin arma indicada). _(Nombres de enemigos editables como `b4_e07.enemies[n].name`)_

**Cofre `b4_c08`** _(26 oro; Poción de curación mayor)_

### El jefe y el final

El jefe es **El Corazón Hueco** (criatura Treant) en `b4_r07`, con tres nudos de raíz que lo protegen y arbustos despertados que brotan durante el combate.

**Antes del combate** (`boss.pre_boss_dialogue`):
- `boss.pre_boss_dialogue[0]` **Narrador:** La madera se abre y revela rostros atrapados entre las raíces.
- `boss.pre_boss_dialogue[1]` **El Corazón Hueco:** Quise protegerlos. Aprendí a retenerlos. Ahora nada volverá a marcharse.
- `boss.pre_boss_dialogue[2]` **Héroe:** Los dejarás ir.

**Visiones** (sale una al azar cada vez que el Corazón golpea):
- `boss.visions[0]`: Un leñador deja caer su hacha mientras una raíz le cubre la boca.
- `boss.visions[1]`: Una niña oye la voz de su padre al otro lado de un árbol hueco.
- `boss.visions[2]`: Un druida jura que ningún ser volverá a sufrir bajo sus ramas.
- `boss.visions[3]`: Un cazador mira un sendero que se pliega sobre sí mismo.

- `codigo.victoryText` _(texto de victoria, al vencer al jefe)_: El silencio se extiende por Umbría. Los caminos vuelven a estar donde deben. El bosque seguirá vivo, pero ya no tendrá hambre. Entre las raíces, los perdidos despiertan y emprenden el regreso a Vegaumbría. Encontráis 75 monedas de oro y la Astilla del Corazón. [da 75 oro y la Astilla del Corazón: el final debe nombrarlos]
- `codigo.defeatText` _(texto de derrota)_: Todo el grupo ha caído entre las raíces del Corazón Hueco.

### Charlas en la posada

Se desbloquean una a una en la posada al terminar zonas con ese aliado. `insp` es la frase que dice al inspirar al grupo en combate.

#### Maren Brezoscuro

_Charla 1:_
- `charlas.maren.talks[0][0]` **Maren Brezoscuro:** Mi hermano me enseñó a distinguir los árboles por el sonido de sus hojas.
- `charlas.maren.talks[0][1]` **Héroe:** ¿Lo hacíais a menudo?
- `charlas.maren.talks[0][2]` **Maren Brezoscuro:** Cuando éramos pequeños. Él nunca temía internarse demasiado.
- `charlas.maren.talks[0][3]` **Maren Brezoscuro:** Ahora temo que su valor lo haya llevado donde no puedo seguirlo.

_Charla 2:_
- `charlas.maren.talks[1][0]` **Maren Brezoscuro:** Encontré uno de sus nudos en una cuerda abandonada.
- `charlas.maren.talks[1][1]` **Héroe:** ¿Estás segura de que era suyo?
- `charlas.maren.talks[1][2]` **Maren Brezoscuro:** Lo hacía al revés para burlarse de nuestro padre.
- `charlas.maren.talks[1][3]` **Maren Brezoscuro:** Esa pequeña torpeza me ha dado fuerzas para continuar.

_Charla 3:_
- `charlas.maren.talks[2][0]` **Maren Brezoscuro:** Antes solo quería recuperar a mi hermano.
- `charlas.maren.talks[2][1]` **Héroe:** ¿Y ahora?
- `charlas.maren.talks[2][2]` **Maren Brezoscuro:** Quiero que ningún otro nombre se pierda entre los árboles.
- `charlas.maren.talks[2][3]` **Maren Brezoscuro:** Caminaré a tu lado, incluso cuando el rastro se borre.

- `charlas.maren.insp`: El bosque no borrará otro nombre.

#### Hermano Ismerel

_Charla 1:_
- `charlas.anselmo.talks[0][0]` **Hermano Ismerel:** Una noche seguí una voz hasta la ciénaga con el farol apagado.
- `charlas.anselmo.talks[0][1]` **Héroe:** ¿Encontraste a alguien?
- `charlas.anselmo.talks[0][2]` **Hermano Ismerel:** Solo mi propio reflejo. Confundí la compasión con la imprudencia.
- `charlas.anselmo.talks[0][3]` **Hermano Ismerel:** Desde entonces enciendo la luz antes de dar un paso.

_Charla 2:_
- `charlas.anselmo.talks[1][0]` **Hermano Ismerel:** Mi maestro decía que la fe no debe imponer caminos.
- `charlas.anselmo.talks[1][1]` **Héroe:** ¿Qué debe hacer entonces?
- `charlas.anselmo.talks[1][2]` **Hermano Ismerel:** Iluminar el suelo para que otro decida dónde pisar.
- `charlas.anselmo.talks[1][3]` **Hermano Ismerel:** Me costó muchos años comprenderlo.

_Charla 3:_
- `charlas.anselmo.talks[2][0]` **Hermano Ismerel:** Temía volver a escuchar una súplica falsa.
- `charlas.anselmo.talks[2][1]` **Héroe:** Aun así seguiste ayudando.
- `charlas.anselmo.talks[2][2]` **Hermano Ismerel:** Porque una voz verdadera también puede esperar en la oscuridad.
- `charlas.anselmo.talks[2][3]` **Hermano Ismerel:** Ya no dejaré que el miedo apague mi farol.

- `charlas.anselmo.insp`: Mi farol seguirá encendido por quien lo necesite.

#### Dama Ivelle de la Encina

_Charla 1:_
- `charlas.ivelle.talks[0][0]` **Dama Ivelle de la Encina:** Mi maestra guardaba una llave ceremonial que nunca utilizó.
- `charlas.ivelle.talks[0][1]` **Héroe:** ¿Qué abría?
- `charlas.ivelle.talks[0][2]` **Dama Ivelle de la Encina:** Nunca me atreví a preguntarlo. Murió antes de responder.
- `charlas.ivelle.talks[0][3]` **Dama Ivelle de la Encina:** Aprendí demasiado tarde que obedecer no siempre es comprender.

_Charla 2:_
- `charlas.ivelle.talks[1][0]` **Dama Ivelle de la Encina:** En mi orden repetíamos el juramento cada amanecer.
- `charlas.ivelle.talks[1][1]` **Héroe:** ¿Y visitabais al guardián?
- `charlas.ivelle.talks[1][2]` **Dama Ivelle de la Encina:** No. Honrábamos al guardián sin volver a escuchar su voz.
- `charlas.ivelle.talks[1][3]` **Dama Ivelle de la Encina:** Esa omisión pesa más que cualquier derrota.

_Charla 3:_
- `charlas.ivelle.talks[2][0]` **Dama Ivelle de la Encina:** He dejado de buscar absolución por nuestra antigua falta.
- `charlas.ivelle.talks[2][1]` **Héroe:** ¿Qué buscas ahora?
- `charlas.ivelle.talks[2][2]` **Dama Ivelle de la Encina:** Cumplir una promesa que permita vivir a quienes protegemos.
- `charlas.ivelle.talks[2][3]` **Dama Ivelle de la Encina:** Mi espada estará al servicio de esa causa.

- `charlas.ivelle.insp`: Mi juramento protege vidas, no cadenas.

#### Maese Corvalen

_Charla 1:_
- `charlas.telmo.talks[0][0]` **Maese Corvalen:** De aprendiz hallé un códice con el final arrancado.
- `charlas.telmo.talks[0][1]` **Héroe:** ¿Qué contenía?
- `charlas.telmo.talks[0][2]` **Maese Corvalen:** Un juramento antiguo. Mi maestro me prohibió investigarlo.
- `charlas.telmo.talks[0][3]` **Maese Corvalen:** Obedecí, y aún lamento aquel silencio.

_Charla 2:_
- `charlas.telmo.talks[1][0]` **Maese Corvalen:** Pasé años buscando una palabra que faltaba en aquel texto.
- `charlas.telmo.talks[1][1]` **Héroe:** ¿Llegaste a encontrarla?
- `charlas.telmo.talks[1][2]` **Maese Corvalen:** Encontré varias. Ninguna explicaba quién sufría el juramento.
- `charlas.telmo.talks[1][3]` **Maese Corvalen:** La erudición también puede convertirse en una forma de ceguera.

_Charla 3:_
- `charlas.telmo.talks[2][0]` **Maese Corvalen:** Ya no quiero coleccionar respuestas en libros cerrados.
- `charlas.telmo.talks[2][1]` **Héroe:** ¿Qué harás con lo aprendido?
- `charlas.telmo.talks[2][2]` **Maese Corvalen:** Escucharé antes de interpretar y actuaré antes de que sea tarde.
- `charlas.telmo.talks[2][3]` **Maese Corvalen:** Esta vez no dejaré una promesa incompleta.

- `charlas.telmo.insp`: Esta vez escucharé antes de dar respuestas.


---

## 5. Textos del código que también salen en el bosque

**Propios del bosque:**
- `codigo.escolta` _(sustituye entera a `b1.entry_dialogue[1]` cuando el héroe lleva un compañero de Hondaroca; {nombre} es ese compañero)_: {nombre} viene conmigo por la linde. Los demás nos esperan en Vegaumbría.
- `codigo.amuleto.recoger` _(al encontrar el amuleto de la zona)_: Recogéis el amuleto de corteza, colgado de una raíz. Ante él se apartarán las raíces que cierran el paso a la siguiente zona.
- `codigo.amuleto.cerrado` _(al llegar a la salida sin amuleto)_: Un muro de raíces cierra el paso. Quizá algo escondido en esta zona os deje abrirlo.
- `codigo.amuleto.abrir` _({who} es quien lo lleva)_: {who} alza el amuleto de corteza: las raíces se retiran y el amuleto se deshace en polvo.
- `srd.bark_amulet.desc` _(descripción del objeto Amuleto de corteza)_: Amuleto con una runa grabada. Abre el paso cerrado por las raíces hacia la siguiente zona del bosque; se gasta al usarlo.
- `srd.druid_relic.desc` _(Semilla del primer juramento)_: Semilla fosilizada que conserva el primer juramento del druida. Tesoro: se puede vender.
- `srd.heart_fragment.desc` _(Astilla del Corazón)_: Madera petrificada, ya sin poder. Trofeo: se guarda en el baúl de la posada.

**Comunes a las tres aventuras** (si los cambias, cambian en todas; cámbialos solo si chocan con la historia):
- `codigo.aviso_aliado.titulo`: Una voz a lo lejos
- `codigo.aviso_aliado.texto`: Antes de seguir, oís a alguien pedir ayuda en algún rincón de esta zona que aún no habéis recorrido. Podéis volver a buscarle o seguir adelante pisando otra vez la salida.
- `codigo.secreto`: (descripción del secreto) + «Se abre un pasadizo secreto: ya aparece en el mapa.» o «Dentro hay un cofre escondido: ya lo veis en el mapa.»
- `codigo.trampa.intro`: Algo cruje bajo vuestros pies…
- `codigo.reaccion.heridos`: «Vamos hechos polvo. Si vemos un sitio tranquilo, deberíamos descansar antes de seguir.» / «Así no llegamos muy lejos. Curémonos en cuanto podamos.» / «Me tiemblan las piernas. Despacio y con cuidado a partir de aquí.»
- `codigo.reaccion.zona_limpia`: «Qué silencio. Lo que dejamos atrás ya no se levantará.» / «Esto está tranquilo ahora. Al menos aquí nadie nos espera.»
- `codigo.reaccion.por_poco`: «Por poco. Otro golpe así y no lo contamos.» / «Eso ha estado demasiado cerca. Hay que cuidarse más.» / «Seguimos vivos, que no es poco. Respirad un momento.»
- `codigo.reaccion.con_muerto`: «No todos hemos salido de esta. Sigamos, pero con cuidado.» / «Ha caído uno de los nuestros. No dejemos que caiga nadie más.»
