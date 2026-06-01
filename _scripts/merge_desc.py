#!/usr/bin/env python3
"""Mezcla DescripcionesValk.json en productos.json y elimina URLs falsas."""

import json, re, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def norm(s):
    """Normaliza string para matching (sin acentos, lowercase, sin signos)."""
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^\w]+', ' ', s.lower()).strip()

# Patrón de URL realista (UUID v4 con guiones)
REAL_IMG = re.compile(r'thumb_280_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.jpg', re.I)

def is_real_url(url):
    if not url: return False
    return bool(REAL_IMG.search(url))

# Cargar descripciones
desc_data = json.loads((ROOT / "DescripcionesValk.json").read_text(encoding='utf-8'))
desc_by_url = {}
desc_by_name = {}
for d in desc_data['productos']:
    if not d.get('descripcion', '').strip():
        continue
    desc_by_url[d['url']] = d['descripcion'].strip()
    desc_by_name[norm(d['nombre'])] = d['descripcion'].strip()

# Cargar productos
prods = json.loads((ROOT / "assets/data/productos.json").read_text(encoding='utf-8'))

matched_url = 0
matched_name = 0
cleaned_imgs = 0
real_imgs = 0

for p in prods:
    # Limpiar imágenes falsas
    if p.get('img'):
        if is_real_url(p['img']):
            real_imgs += 1
        else:
            # URL sintética: borrarla para que use placeholder
            p['img'] = ''
            cleaned_imgs += 1

    # Buscar descripción
    desc = None
    if p.get('urlOriginal') and p['urlOriginal'] in desc_by_url:
        desc = desc_by_url[p['urlOriginal']]
        matched_url += 1
    else:
        # Match por nombre normalizado
        n = norm(p['nombre'])
        if n in desc_by_name:
            desc = desc_by_name[n]
            matched_name += 1

    if desc:
        # Reemplazar la descripción genérica por la real
        p['descripcion'] = desc
        p['tieneDescripcionReal'] = True
    else:
        p['tieneDescripcionReal'] = False

# Guardar
out_path = ROOT / "assets/data/productos.json"
out_path.write_text(json.dumps(prods, ensure_ascii=False, indent=2), encoding='utf-8')

# También copiar a server/data
(ROOT / "server/data/productos.json").write_text(
    json.dumps(prods, ensure_ascii=False, indent=2), encoding='utf-8'
)

# Reporte
print(f'Total productos:         {len(prods)}')
print(f'Imágenes reales (UUID):  {real_imgs}')
print(f'URLs sintéticas borradas: {cleaned_imgs}')
print(f'Sin imagen tras limpieza: {sum(1 for p in prods if not p.get("img"))}')
print()
print(f'Descripciones por URL:    {matched_url}')
print(f'Descripciones por nombre: {matched_name}')
print(f'Total con descripción real: {sum(1 for p in prods if p.get("tieneDescripcionReal"))}')
print(f'Sin descripción real:     {sum(1 for p in prods if not p.get("tieneDescripcionReal"))}')
