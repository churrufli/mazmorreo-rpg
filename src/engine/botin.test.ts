import { ADV_LIST, TOWNS, TownId } from './aventuras';
import { COUNTERS, shopStock, threats, usefulIn } from './botin';

describe('botín según los enemigos de cada aventura', () => {
  it('la montaña no tiene veneno: Cumbrenieve no vende antídotos', () => {
    expect(threats('montana').has('veneno')).toBe(false);
    expect(shopStock('cumbrenieve')).not.toContain('antidote');
    expect(shopStock('cumbrenieve')).toContain('cold_resistance_potion');
  });
  it('el espejo de acero solo se vende donde está el basilisco', () => {
    expect(shopStock('arenaroja')).toContain('steel_mirror');
    for (const t of ['valdescarcha', 'vegahumbria', 'cumbrenieve'] as TownId[]) expect(shopStock(t)).not.toContain('steel_mirror');
  });
  it('cada tienda ofrece los remedios de lo que hay en su aventura y nada que no sirva allí', () => {
    for (const t of Object.keys(TOWNS) as TownId[]) {
      const adv = TOWNS[t].adv;
      const stock = shopStock(t);
      for (const id of Object.keys(COUNTERS)) expect([id, stock.includes(id)]).toEqual([id, usefulIn(id, adv)]);
      expect(new Set(stock).size).toBe(stock.length);
    }
  });
  it('ningún cofre guarda un remedio contra algo que no aparece en su aventura', () => {
    for (const a of ADV_LIST) {
      const chests = a.data.zones.flatMap(z => z.rooms.flatMap(r => (r.contents as any[]).filter(c => c.type === 'chest')));
      for (const c of chests) {
        const ids = [c.item?.id, ...(c.items ?? []).map((x: any) => (typeof x === 'string' ? x : x.id))].filter(Boolean);
        for (const id of ids) expect([a.id, c.id, id, usefulIn(id, a.id)]).toEqual([a.id, c.id, id, true]);
      }
    }
  });
});
