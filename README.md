# Valkiria Bikes

Sitio web para Valkiria Bikes — distribuidor multimarca de productos premium de ciclismo en México. Catálogo curado de Canyon, Fox Racing, Specialized, Shimano, Trek, Garmin, Maxxis, 100%, Pearl Izumi, Castelli y Wahoo.

Inspiración visual: foxracing.com (intensidad editorial) + canyon.com (precisión técnica), con un sistema de marca propio basado en la paleta del logo (navy profundo + bronce).

## Stack

- **Frontend:** HTML5 + CSS3 (sistema propio) + JavaScript (ES modules), sin frameworks.
- **Tipografía:** Cormorant Garamond (display) + Inter (texto) + JetBrains Mono (acentos técnicos), vía Google Fonts.
- **Animaciones:** IntersectionObserver, CSS transforms, custom cursor desktop, parallax sutil, magnetic buttons, transición de página tipo curtain.
- **Backend:** Node.js + Express, datos en JSON (productos, marcas, inbox de contacto/newsletter/pedidos).
- **Responsive:** Mobile-first con breakpoints en 640/1024/1100/1440.
- **Accesibilidad:** Focus visible, prefers-reduced-motion, aria-labels, contraste AA+.

## Estructura

```
Valkiria/
├── index.html                # Home
├── pages/
│   ├── productos.html        # Catálogo con filtros
│   ├── producto.html         # Detalle (?id=...)
│   ├── marcas.html           # Listado de marcas
│   ├── nosotros.html         # About
│   ├── contacto.html         # Form de contacto
│   └── carrito.html          # Cart + checkout
├── assets/
│   ├── css/
│   │   ├── main.css          # Variables, base, componentes, nav, footer
│   │   ├── animations.css    # Reveals, cursor, transitions
│   │   ├── home.css          # Hero, marquee, categorías, manifiesto, belt
│   │   └── pages.css         # Productos, detalle, marcas, nosotros, contacto, carrito
│   ├── js/
│   │   ├── main.js           # Nav móvil, link activo, page transition
│   │   ├── animations.js     # Observers, split text, cursor, magnet, counters
│   │   ├── cart.js           # LocalStorage cart + toast
│   │   ├── productos.js      # Render + filtros
│   │   ├── producto-detalle.js
│   │   ├── carrito.js
│   │   └── contacto.js
│   ├── img/                  # Logos Valkiria
│   └── data/                 # Espejo de JSON para fallback offline
└── server/
    ├── server.js             # Express
    ├── routes/api.js         # /api/productos, /api/marcas, /api/contacto, /api/newsletter, /api/checkout
    └── data/                 # productos.json, marcas.json, inbox.json (runtime)
```

## Cómo correrlo

```bash
npm install
npm run dev          # con --watch
# o
npm start
```

Servidor en `http://localhost:4173`.

## Endpoints API

| Método | Ruta | Descripción |
|---|---|---|
| GET  | `/api/productos`        | Lista de productos |
| GET  | `/api/productos/:id`    | Detalle por ID |
| GET  | `/api/marcas`           | Lista de marcas |
| POST | `/api/contacto`         | Mensaje del formulario |
| POST | `/api/newsletter`       | Alta de email |
| POST | `/api/checkout`         | Registro de pedido (sin pago real) |

Los mensajes/pedidos se guardan en `server/data/inbox.json` (ignorado por git).

## Paleta

| Token | Hex | Uso |
|---|---|---|
| `--navy-950` | `#060B1C` | Fondo dark más profundo |
| `--navy-900` | `#0A1126` | Tinta principal / dark surface |
| `--navy-700` | `#1A2747` | Navy del logo |
| `--bronze-500` | `#B89160` | Acento metálico / CTA secundarios |
| `--bone-50`  | `#FAF7F0` | Fondo claro |
| `--bone-100` | `#F4EFE6` | Surface secundario |

## Licencia

MIT — Valkiria Bikes 2025.
