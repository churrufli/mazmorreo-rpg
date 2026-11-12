# Copia el diseño del bosque (diseno/bosque/corazon-hueco.json) a src/data/corazon.json.
# Los ids de zona pasan de z1..z4 a b1..b4 para no chocar con Hondaroca, y la escena del
# aliado suplente (Corvalen) se guarda como brunna_scene, igual que en Hondaroca.
import json, re, sys
src = sys.argv[1] if len(sys.argv) > 1 else '/mnt/project-files/diseno/bosque/corazon-hueco.json'
d = json.load(open(src))
ID = re.compile(r'^(chest:|exit:)?z([1-4])(_[A-Za-z0-9]+)?$')
def walk(x):
    if isinstance(x, dict):
        if 'telmo_scene' in x: x['brunna_scene'] = x.pop('telmo_scene')
        return {k: walk(v) for k, v in x.items()}
    if isinstance(x, list): return [walk(v) for v in x]
    if isinstance(x, str):
        m = ID.match(x)
        return f"{m.group(1) or ''}b{m.group(2)}{m.group(3) or ''}" if m else x
    return x
d = walk(d)
json.dump(d, open('src/data/corazon.json', 'w'), ensure_ascii=False, indent=1)
# Después de importar se añadieron a mano (ya están en src/data/corazon.json): un segundo
# descanso por zona (bN_rest2), 700 PX al jefe (b4_e04) y la salida de cada zona a la siguiente.
