#!/usr/bin/env python3
"""Transforma 'Productos Valkiria.json' al esquema interno del sitio."""

import json, re, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC  = ROOT / "Productos Valkiria.json"

# Marcas conocidas (orden importa: detecta la más específica primero)
BRANDS = [
    "IGPSPORT", "Igsport", "Rockbros", "ROCKBROS",
    "Abus", "Giyo", "GIYO", "Stans", "STANS", "Tessa", "ZTTO",
    "Tosek", "TOSEK", "Light & Motion", "Seemeer", "Seemee",
    "Cube", "Neco", "Specialized", "Shimano", "SRAM", "Trek", "Canyon",
    "Continental", "Maxxis", "Vittoria", "Schwalbe", "Kenda",
    "Bontrager", "Garmin", "Wahoo", "Fox", "Castelli",
    "Pearl Izumi", "100%", "Smith", "POC", "Giro", "Bell",
    "Selle Italia", "Brooks", "Fizik", "WTB",
    "Park Tool", "Pedro's", "Topeak", "Lezyne", "Crank Brothers",
    "Look", "Time", "TIME", "Garneau", "Camelbak",
    "Finish Line", "Muc-Off", "Squirt", "Pedro",
    "Truvativ", "Race Face", "RaceFace", "FSA", "Easton",
    "Spank", "Industry Nine", "DT Swiss", "Mavic", "Reynolds",
    "Zipp", "ENVE", "Hunt", "Roval", "Hed", "Ksyrium",
    "Magura", "Hope", "Hayes", "Tektro", "TRP",
    "Manitou", "Marzocchi", "RockShox", "Fox Racing Shox",
    "Chris King", "White Industries", "Cane Creek",
    "Renthal", "Spank", "Funn", "Nukeproof",
    "Ergon", "ESI", "Lizard Skins", "ODI", "Supacaz",
    "Selle Royal", "SQlab", "ISM", "Prologo",
    "Cycliq", "Cateye", "Sigma", "Bryton",
]

# Normalizar marca a forma canónica
BRAND_CANONICAL = {
    "IGPSPORT": "IGPSPORT", "Igsport": "iGS Sport", "igsport": "iGS Sport",
    "ROCKBROS": "Rockbros", "Rockbros": "Rockbros",
    "STANS": "Stan's NoTubes", "Stans": "Stan's NoTubes",
    "GIYO": "Giyo", "Giyo": "Giyo",
    "TOSEK": "Tosek", "Tosek": "Tosek",
    "Light & Motion": "Light & Motion",
    "Seemee": "Seemee", "Seemeer": "Seemee",
}

def slugify(text):
    text = unicodedata.normalize('NFD', text)
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text.strip('-')

def parse_price(p):
    if not p: return None
    # "Bs 1.320,00" -> 1320.00
    s = re.sub(r'[^\d,.-]', '', str(p))
    s = s.replace('.', '').replace(',', '.')
    try: return float(s)
    except: return None

PRODUCT_TYPE_WORDS = {
    # Generic product types — never use as brand
    "Casco","Cascos","Cinta","Inflador","Linterna","Sensor","Soporte","Juego",
    "Pedales","Pedal","Kit","Bocina","Set","Repuesto","Cámara","Camara",
    "Cadena","Cadenciómetro","Ciclocomputador","Sillín","Sillin","Sill",
    "Chicotillo","Lentes","Lente","Gafas","Estuche","Estuches","Bolsa","Funda",
    "Guardabarro","Gel","Geles","Radios","Extensor","Aceite","Grasa","Adaptador",
    "Caja","Creatina","Porta","Portabotellón","Portabotellon","Botella","Botellón",
    "Botellones","Botellón","Calza","Calzado","Pata","Zapatillas","Manillar",
    "Disco","Boquilla","Espaciadores","Barras","Dextrosa","Pastillas","Pastilla",
    "Extractor","Desmonta","Guiador","Lubricante","Líquido","Liquido","ÍQUIDO",
    "Audífonos","Buff","Essencial","FLY","Stem","Tija","Manopla","Cala",
    "Tubo","Tubeless","Tubeles","Tornillo","Tornillos","Mosquetón","Cubre",
    "Cabezal","Plato","Platos","Biela","Bielas","Eje","Tornillería","Pomada",
    "Cuello","Cono","Cubeta","Cubetas","Cubierta","Neumático","Llanta","Llantas",
    "Aro","Aros","Buje","Bujes","Maneta","Manetas","Cinta","Cintas",
    "Casquillo","Casquillos","Cierre","Hidratante","Multiherramienta","Herramienta",
    "Llave","Llaves","Bomba","Bombas","Cargador","Cargadores","Bateria","Batería",
    "Cable","Cables","Funda","Fundas","Reflector","Reflectores","Banda","Bandas",
    "Grip","Grips","Manopla","Manoplas","Pegamento","Spray",
}

def detect_brand(nombre, categoria):
    lo = nombre.lower()
    for b in BRANDS:
        if b.lower() in lo:
            return BRAND_CANONICAL.get(b, b)
    # Heurística: primera palabra capitalizada que NO sea un product-type
    words = re.findall(r"[A-ZÁÉÍÓÚÑ][A-Za-záéíóúñ]+", nombre)
    for w in words:
        if len(w) > 2 and w not in PRODUCT_TYPE_WORDS:
            return w
    return "Valkiria"

def category_emoji_color(name):
    """Asigna un color/ícono a cada categoría como fallback visual."""
    pal = {
        "Ciclocomputadores":"#3A5BA8", "Infladores":"#7A9E5B", "Aros":"#5B6B7A",
        "Horquilla":"#A06A3B", "Linternas":"#B89160", "Tubeles":"#4A5B7C",
        "Cascos":"#0F1B3D", "Indumentaria":"#8A4F4F", "Cubierta/Neumático":"#2A2A2A",
        "Lubricantes":"#C97F4A", "Pedales/Calas":"#5C5C5C", "Herramientas":"#5B7A8A",
        "Manillar/Stem/Puños":"#6B5B95", "Cadena/Piñón":"#3F3F3F", "Shifter/Desviador":"#4A5B7C",
        "Tija/Sillín":"#7A5C3B", "Freno/Pastilla/Disco":"#9C2B2B", "Accesorios":"#34466F",
        "Nutrición":"#7A5C2B", "Biela/Platos":"#5B5B5B", "Grupos Completos":"#1A2747",
        "Gafas/Lentes":"#2A3450", "Botellones":"#4A6FA5",
        "Portabotellón/Accesorios":"#3F5B7A", "Bicicletas":"#0A1126",
        "Estuches":"#3F3F3F", "Soportes y Parqueos":"#5B5B5B", "Others":"#6B7B95",
    }
    return pal.get(name, "#34466F")

def main():
    raw = json.loads(SRC.read_text(encoding='utf-8'))

    productos = []
    seen_ids = set()
    categorias = []

    for cat in raw['categorias']:
        cat_name = cat['nombre']
        categorias.append({
            "nombre": cat_name,
            "slug": slugify(cat_name),
            "color": category_emoji_color(cat_name),
            "total": len(cat['productos'])
        })

        for p in cat['productos']:
            nombre = (p.get('nombre') or 'Producto sin nombre').strip()
            precio = parse_price(p.get('precio'))
            if precio is None:
                # Productos sin precio quedan como "consultar" pero los excluimos del catálogo público
                continue

            precio_anterior = parse_price(p.get('precio_original'))
            descuento_str = p.get('descuento') or None
            descuento = None
            if descuento_str:
                m = re.search(r'-?(\d+)', descuento_str)
                if m: descuento = int(m.group(1))

            disponible_raw = p.get('disponible') or "0"
            try: disponible = int(disponible_raw)
            except: disponible = 0

            base_id = slugify(nombre)[:50] or 'producto'
            pid = base_id
            n = 1
            while pid in seen_ids:
                n += 1
                pid = f"{base_id}-{n}"
            seen_ids.add(pid)

            marca = detect_brand(nombre, cat_name)
            en_oferta = bool(precio_anterior and precio_anterior > precio)

            productos.append({
                "id": pid,
                "nombre": nombre,
                "marca": marca,
                "categoria": cat_name,
                "categoriaSlug": slugify(cat_name),
                "precio": precio,
                "precioAnterior": precio_anterior,
                "descuento": descuento,
                "enOferta": en_oferta,
                "moneda": "BOB",
                "disponible": disponible,
                "img": p.get('imagen') or "",
                "color": category_emoji_color(cat_name),
                "urlOriginal": p.get('url') or "",
                "destacado": en_oferta and (descuento or 0) >= 20,
                "badge": "Oferta" if en_oferta else (None if disponible > 5 else ("Últimas" if disponible > 0 else None)),
                "badgeStyle": "accent" if en_oferta else None,
                "descripcion": f"{nombre}. Producto de la categoría {cat_name}, marca {marca}. Disponibilidad: {disponible} unidades.",
            })

    # Asegurar al menos 4 destacados
    if sum(1 for p in productos if p['destacado']) < 4:
        for p in sorted(productos, key=lambda x: -(x.get('descuento') or 0))[:6]:
            p['destacado'] = True

    output = {
        "actualizado": "2026-05-31",
        "tienda": raw.get('tienda', 'Valkiria Bikes'),
        "contacto": raw.get('contacto', {}),
        "total": len(productos),
        "productos": productos,
        "categorias": categorias,
    }

    # Salidas
    out_assets = ROOT / "assets" / "data" / "productos.json"
    out_server = ROOT / "server" / "data" / "productos.json"
    out_cats   = ROOT / "assets" / "data" / "categorias.json"
    out_cats_s = ROOT / "server" / "data" / "categorias.json"

    # Mantengo el formato plano (array) para compat con código existente,
    # pero a la vez expongo metadatos por separado.
    out_assets.write_text(json.dumps(productos, ensure_ascii=False, indent=2), encoding='utf-8')
    out_server.write_text(json.dumps(productos, ensure_ascii=False, indent=2), encoding='utf-8')
    out_cats.write_text(json.dumps(categorias, ensure_ascii=False, indent=2), encoding='utf-8')
    out_cats_s.write_text(json.dumps(categorias, ensure_ascii=False, indent=2), encoding='utf-8')

    # Catalog meta
    meta_path = ROOT / "assets" / "data" / "catalog-meta.json"
    meta_path.write_text(json.dumps({
        "actualizado": output['actualizado'],
        "tienda": output['tienda'],
        "contacto": output['contacto'],
        "total": output['total']
    }, ensure_ascii=False, indent=2), encoding='utf-8')

    # Sumario
    by_cat = {}
    for p in productos:
        by_cat[p['categoria']] = by_cat.get(p['categoria'], 0) + 1

    print(f"Total productos exportados: {len(productos)}")
    print(f"Categorías: {len(categorias)}")
    print(f"En oferta: {sum(1 for p in productos if p['enOferta'])}")
    print(f"Destacados: {sum(1 for p in productos if p['destacado'])}")
    for c in sorted(by_cat.keys()):
        print(f"  {c}: {by_cat[c]}")

if __name__ == "__main__":
    main()
