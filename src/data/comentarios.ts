// Comentarios breves de los compañeros (2026-11-19): reaccionan a algunas decisiones y a lugares de su propia aventura.
// Salen poco y nunca dan ventajas en combate: solo dan personalidad.

/** Cómo se puede leer una decisión: perdonar o ayudar, ser duro, o quedarse con el dinero. */
export type Tone = 'piedad' | 'dureza' | 'codicia';

export const TONE_LINES: Record<string, Record<Tone, string>> = {
  tiko: {
    piedad: 'Bien hecho. Una puerta abierta a tiempo salva más vidas que una espada.',
    dureza: 'Uf. Recordadme que nunca os deba nada.',
    codicia: 'No diré que no me gusta el tintineo. Pero pesa más de lo que parece.',
  },
  edmund: {
    piedad: 'La misericordia también es una forma de custodia. Me alegra verla.',
    dureza: 'Que los dioses nos perdonen si hoy nos hemos equivocado.',
    codicia: 'El oro no compra el descanso de nadie. Tenedlo presente.',
  },
  liss: {
    piedad: 'Orvane no habría dado esa oportunidad. Por eso no somos como él.',
    dureza: 'Así empezó Orvane: con decisiones que parecían necesarias.',
    codicia: 'Monedas. Orvane también decía que todo tenía un precio.',
  },
  brunna: {
    piedad: 'En la mina nos cuidábamos así. Me gusta que sigáis la costumbre.',
    dureza: 'Duro, pero claro. En la roca no hay sitio para dudas.',
    codicia: 'Si es para la cuadrilla, vale. Si es para el bolsillo, ya hablaremos.',
  },
  maren: {
    piedad: 'Cada vez que alguien ayuda a otro, recuerdo por qué busqué a mi hermano.',
    dureza: 'El bosque no olvida. Espero que nosotros tampoco.',
    codicia: 'Las raíces no se compran. Pero bueno, el pan sí.',
  },
  anselmo: {
    piedad: 'Una segunda oportunidad. Sé lo que vale eso.',
    dureza: 'Así se hacen los pactos que luego pesan. Lo digo por experiencia.',
    codicia: 'Cuidado con lo que se cobra. A veces la deuda la paga otro.',
  },
  ivelle: {
    piedad: 'Mi orden habría hecho lo mismo. El juramento no es solo luchar.',
    dureza: 'La justicia sin compasión se parece demasiado a la venganza.',
    codicia: 'No es eso lo que juré proteger, pero no os juzgaré.',
  },
  telmo: {
    piedad: 'Como decía aquella vieja orden: hay que dejar salir a quien se protege.',
    dureza: 'Lo anotaré, aunque preferiría no tener que recordarlo.',
    codicia: 'Interesante. Un mapa habría valido más que esas monedas.',
  },
  vurka: {
    piedad: 'Mi clan dejaba pasar al que no tenía nada. Bien.',
    dureza: '¡Así se hace! En la montaña no se discute dos veces.',
    codicia: 'Tributos. Mi clan murió por negarse a pagarlos.',
  },
  durnok: {
    piedad: 'Un acuerdo honorable de verdad. Ojalá mis antepasados hubieran hecho igual.',
    dureza: 'La piedra recuerda lo que hacemos. Espero que no nos pese.',
    codicia: 'Así empiezan los acuerdos de los que nadie quiere hablar después.',
  },
  syrael: {
    piedad: 'Proteger a quien no puede hacerlo solo. Eso juramos los míos.',
    dureza: 'Firme. Lo entiendo, aunque no me guste.',
    codicia: 'Mi linaje no juró por oro. Pero no voy a quitároslo.',
  },
  aldric: {
    piedad: 'Bien. Marcaré este sitio como seguro para él.',
    dureza: 'En la nieve, el que se queda atrás no vuelve. Ojalá lo hayáis pensado.',
    codicia: 'Monedas no te sacan de una grieta. Una cuerda sí.',
  },
  zeyna: {
    piedad: 'Sacar a gente viva. Para eso vine, no por el oro.',
    dureza: 'Mi abuela habría hecho lo mismo. No es un cumplido.',
    codicia: 'Ya. En Arenaroja eso paga el agua. No os culpo.',
  },
  hassim: {
    piedad: 'Un juramento pregunta qué vas a hacer ahora. Habéis respondido bien.',
    dureza: 'Que el sol juzgue si era necesario.',
    codicia: 'No es lo que harían los guardianes de caravanas. Pero sigamos.',
  },
  yara: {
    piedad: 'Las dunas no perdonan. Nosotros sí podemos.',
    dureza: 'Bien. A quien amenaza a los míos no le doy dos ocasiones.',
    codicia: 'El oro no trae de vuelta a nadie. Ni a la caravana.',
  },
  teodor: {
    piedad: 'Los reyes serpiente no conocían esa palabra. Por eso cayeron.',
    dureza: 'Así se ahogó un imperio entero: decisión dura tras decisión dura.',
    codicia: 'Las tablillas hablan de reyes que lo querían todo. Acabaron bajo la arena.',
  },
};

/** Una frase de un compañero la primera vez que el grupo entra en una zona de su propia aventura. */
export const PLACE_LINES: Record<string, Record<string, string>> = {
  tiko: { z3: 'Una cripta. Aquí no se roba, ¿eh? Por si acaso me quedo con las manos en los bolsillos.', z4: 'Esa luz violeta… Es la misma que vi desde la prisión. Estamos cerca.' },
  edmund: { z4: 'Aldric mandó cerrar el camino, y los monjes mantuvieron el cristal bajo el agua.' },
  maren: { b3: 'Mi hermano nunca pasaba de la ciénaga. Si lo trajeron hasta aquí, alguien lo atrajo.', b4: 'Oigo las hojas como me enseñó mi hermano. Pero aquí suenan como si el bosque respirara.' },
  anselmo: { b4: 'Mi pacto es una cadena. Aquí sucede lo mismo: el Corazón no deja marchar a quienes retiene.' },
  vurka: { m3: 'Los muros de los enanos. Mi clan comerciaba con ellos antes del dragón.', m4: 'Huele a hielo viejo y a escamas. Vharzûl está ahí abajo.' },
  durnok: { m4: 'La carta de mi familia hablaba de esta cueva. Ahora sabré la verdad.' },
  zeyna: { s3: 'Mi abuela nunca bajó tanto. Decía que aquí ya no había tesoro, solo dientes.', s4: 'Oigo voces. Son de gente viva. ¡Rápido!' },
  hassim: { s4: 'Si la caravana de mi hermano llegó hasta aquí, sus huellas estarán en estas madrigueras.' },
};
