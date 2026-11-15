// Cambios pedidos por el autor el 2026-11-16: compañeros según la zona, roca junto a la reja y personajes del mapa.
import { newGame } from './game';
import { allyCap } from './posada';
import { blockedCells, neighbors, npcSpots, plan } from './dungeon';

describe('compañeros según la zona', () => {
  it('sin aventura empezada caben tres; a mitad, uno por zona', () => {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    expect(allyCap(g, 'corazon_hueco')).toBe(3);
    g.backs = { corazon_hueco: { zone: 'b1', pos: [0, 0] } };
    expect(allyCap(g, 'corazon_hueco')).toBe(1);
    g.backs.corazon_hueco = { zone: 'b2', pos: [0, 0] };
    expect(allyCap(g, 'corazon_hueco')).toBe(2);
    g.backs.corazon_hueco = { zone: 'b4', pos: [0, 0] };
    expect(allyCap(g, 'corazon_hueco')).toBe(3);
  });
});

describe('rejas', () => {
  it('en el bosque profundo la roca ya no tapa la entrada del pasadizo de la reja', () => {
    const gate = plan('b2').marks.find(x => x.kind === 'gate')!;
    const blocked = blockedCells('b2');
    expect(neighbors([gate.q, gate.r]).some(n => blocked.has(`${n[0]},${n[1]}`))).toBe(false);
  });
});

describe('personajes del mapa', () => {
  it('el sabio de la montaña también espera en el mapa', () => {
    const g = newGame(1, 'Prueba', 'fighter', 'human');
    g.zone = 'm1';
    expect(npcSpots(g).some(s => s.img === 'ally_telmo')).toBe(true);
  });
});
