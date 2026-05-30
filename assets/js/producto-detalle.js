/* =============================================================
   PRODUCTO DETALLE
   ============================================================= */

import { Cart, toast } from './cart.js';

const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

const id = new URLSearchParams(location.search).get('id');

async function fetchProducto() {
  try {
    const res = await fetch(`api/productos/${id}`);
    if (res.ok) return await res.json();
  } catch {}
  const all = await (await fetch('assets/data/productos.json')).json();
  return all.find(p => p.id === id);
}

function render(p) {
  if (!p) {
    document.querySelector('[data-product-root]').innerHTML = `
      <div class="container" style="padding-block:8rem; text-align:center">
        <h1 class="title-lg">Producto no encontrado</h1>
        <p class="lead" style="margin:1rem auto">El producto que buscas no está disponible.</p>
        <a class="btn btn--primary" href="productos.html"><span>Ver catálogo</span></a>
      </div>`;
    return;
  }

  const crumbs = document.querySelector('[data-crumbs]');
  if (crumbs) crumbs.innerHTML = `
    <a href="/">Inicio</a> <span>/</span>
    <a href="productos.html">Catálogo</a> <span>/</span>
    <span style="color:var(--bone-50)">${p.nombre}</span>`;

  const title = document.querySelector('[data-product-title]');
  if (title) title.textContent = p.nombre;

  const sizes = p.tallas || ['S', 'M', 'L', 'XL'];
  const colores = p.colores || ['Negro', 'Navy'];

  document.querySelector('[data-product-root]').innerHTML = `
    <div class="container">
      <div class="product-detail">
        <div class="product-gallery" data-reveal="left">
          <div class="product-gallery__main"><img src="${p.img}" alt="${p.nombre}"></div>
          <div class="product-gallery__thumbs">
            ${[p.img, p.img, p.img, p.img].map((src, i) => `
              <button class="${i === 0 ? 'is-active' : ''}" data-thumb="${i}"><img src="${src}" alt=""></button>
            `).join('')}
          </div>
        </div>

        <div class="product-info" data-reveal="right">
          <span class="brand">${p.marca}</span>
          <h1>${p.nombre}</h1>
          <div class="price">
            ${fmt.format(p.precio)}
            ${p.precioAnterior ? `<del>${fmt.format(p.precioAnterior)}</del>` : ''}
            ${p.precioAnterior ? `<span class="save">Ahorra ${Math.round((1 - p.precio / p.precioAnterior) * 100)}%</span>` : ''}
          </div>
          <p class="desc">${p.descripcion}</p>

          <div class="option-row">
            <h4>Color</h4>
            <div class="option-chips" data-color-group>
              ${colores.map((c, i) => `<button class="chip ${i === 0 ? 'is-active' : ''}" data-color="${c}">${c}</button>`).join('')}
            </div>
          </div>

          <div class="option-row">
            <h4>Talla</h4>
            <div class="option-chips" data-size-group>
              ${sizes.map((s, i) => `<button class="chip ${i === 1 ? 'is-active' : ''}" data-size="${s}">${s}</button>`).join('')}
            </div>
          </div>

          <div class="option-row">
            <h4>Cantidad</h4>
            <div class="qty">
              <button data-qty-dec aria-label="Disminuir">−</button>
              <input type="text" value="1" data-qty-val readonly>
              <button data-qty-inc aria-label="Aumentar">+</button>
            </div>
          </div>

          <div class="cta-row">
            <button class="btn btn--primary btn--lg" data-add-to-cart>
              <span>Agregar al carrito</span>
              <svg class="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button class="btn btn--ghost btn--lg" data-fav>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span>Guardar</span>
            </button>
          </div>

          <p class="shipping-note">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            Envío gratis en pedidos mayores a $1,500 — entrega 3-5 días hábiles
          </p>

          ${p.specs ? `
          <dl class="specs">
            ${Object.entries(p.specs).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}
          </dl>` : ''}
        </div>
      </div>
    </div>
  `;

  // Eventos
  const root = document.querySelector('[data-product-root]');
  let qty = 1;
  let color = colores[0];
  let size = sizes[1] || sizes[0];

  root.querySelectorAll('[data-color-group] button').forEach(b => b.addEventListener('click', () => {
    root.querySelectorAll('[data-color-group] button').forEach(x => x.classList.remove('is-active'));
    b.classList.add('is-active'); color = b.dataset.color;
  }));
  root.querySelectorAll('[data-size-group] button').forEach(b => b.addEventListener('click', () => {
    root.querySelectorAll('[data-size-group] button').forEach(x => x.classList.remove('is-active'));
    b.classList.add('is-active'); size = b.dataset.size;
  }));
  const qtyVal = root.querySelector('[data-qty-val]');
  root.querySelector('[data-qty-inc]').addEventListener('click', () => { qty++; qtyVal.value = qty; });
  root.querySelector('[data-qty-dec]').addEventListener('click', () => { qty = Math.max(1, qty - 1); qtyVal.value = qty; });

  root.querySelector('[data-add-to-cart]').addEventListener('click', () => {
    Cart.add({
      id: p.id, nombre: p.nombre, marca: p.marca, precio: p.precio, img: p.img,
      option: `${color} · ${size}`, qty
    });
    toast('Agregado al carrito');
  });

  root.querySelectorAll('[data-thumb]').forEach((t) => {
    t.addEventListener('click', () => {
      root.querySelectorAll('[data-thumb]').forEach(x => x.classList.remove('is-active'));
      t.classList.add('is-active');
    });
  });
}

(async () => {
  const p = await fetchProducto();
  render(p);
})();
