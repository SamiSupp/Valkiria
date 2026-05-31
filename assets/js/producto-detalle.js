/* =============================================================
   PRODUCTO DETALLE
   ============================================================= */

import { Cart, toast } from './cart.js';
import { getProduct, Currency } from './catalog.js';

const id = new URLSearchParams(location.search).get('id');

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
    <a href="index.html">Inicio</a> <span>/</span>
    <a href="productos.html">Catálogo</a> <span>/</span>
    <a href="productos.html?cat=${encodeURIComponent(p.categoria)}">${p.categoria}</a> <span>/</span>
    <span style="color:var(--bone-50)">${p.nombre}</span>`;

  const title = document.querySelector('[data-product-title]');
  if (title) title.textContent = p.nombre;

  const mainImage = p.img
    ? `<img src="${p.img}" alt="${p.nombre}" onerror="this.style.display='none'; this.parentElement.classList.add('no-img')">`
    : '';
  const placeholder = `
    <div class="product-detail__placeholder" style="background:linear-gradient(135deg, ${p.color || '#34466F'}, var(--navy-900))">
      <svg viewBox="0 0 120 120" width="100" height="100" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="1.5">
        <circle cx="30" cy="85" r="22"/><circle cx="90" cy="85" r="22"/>
        <path d="M30 85 L60 35 L90 85 M48 60 L78 60"/>
      </svg>
      <span class="placeholder-label">${p.categoria}</span>
    </div>`;

  const stockLine = p.disponible > 0
    ? `<span class="stock-pill stock-pill--ok"><span class="dot"></span> ${p.disponible} en stock</span>`
    : `<span class="stock-pill stock-pill--out">Agotado</span>`;

  document.querySelector('[data-product-root]').innerHTML = `
    <div class="container">
      <div class="product-detail">
        <div class="product-gallery" data-reveal="left">
          <div class="product-gallery__main">
            ${mainImage || placeholder}
            ${p.img ? '' : ''}
          </div>
        </div>

        <div class="product-info" data-reveal="right">
          <span class="brand">${p.marca || '—'}</span>
          <h1>${p.nombre}</h1>

          <div class="price">
            ${Currency.format(p.precio)}
            ${p.precioAnterior ? `<del>${Currency.format(p.precioAnterior)}</del>` : ''}
            ${p.precioAnterior ? `<span class="save">Ahorra ${p.descuento || Math.round((1 - p.precio / p.precioAnterior) * 100)}%</span>` : ''}
          </div>

          ${stockLine}

          <p class="desc">${p.descripcion}</p>

          <div class="option-row">
            <h4>Cantidad</h4>
            <div class="qty">
              <button data-qty-dec aria-label="Disminuir">−</button>
              <input type="text" value="1" data-qty-val readonly>
              <button data-qty-inc aria-label="Aumentar">+</button>
            </div>
          </div>

          <div class="cta-row">
            <button class="btn btn--primary btn--lg" data-add-to-cart ${p.disponible === 0 ? 'disabled' : ''}>
              <span>${p.disponible === 0 ? 'Sin stock' : 'Agregar al carrito'}</span>
              <svg class="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            ${p.urlOriginal ? `
            <a class="btn btn--ghost btn--lg" href="${p.urlOriginal}" target="_blank" rel="noopener">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M14 10l7-7M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Tienda Kyte</span>
            </a>` : ''}
          </div>

          <p class="shipping-note">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            Recojo en tienda · Calle Potosí N° 1779 · Horario 9:00–20:00
          </p>

          <dl class="specs">
            <dt>Categoría</dt><dd><a href="productos.html?cat=${encodeURIComponent(p.categoria)}">${p.categoria}</a></dd>
            <dt>Marca</dt><dd><a href="productos.html?marca=${encodeURIComponent(p.marca)}">${p.marca}</a></dd>
            <dt>Disponibilidad</dt><dd>${p.disponible} unidad${p.disponible === 1 ? '' : 'es'}</dd>
            <dt>Moneda</dt><dd>Boliviano (Bs)</dd>
          </dl>
        </div>
      </div>
    </div>
  `;

  const root = document.querySelector('[data-product-root]');
  let qty = 1;
  const qtyVal = root.querySelector('[data-qty-val]');
  root.querySelector('[data-qty-inc]').addEventListener('click', () => { qty++; qtyVal.value = qty; });
  root.querySelector('[data-qty-dec]').addEventListener('click', () => { qty = Math.max(1, qty - 1); qtyVal.value = qty; });

  const addBtn = root.querySelector('[data-add-to-cart]');
  if (!addBtn.disabled) {
    addBtn.addEventListener('click', () => {
      Cart.add({
        id: p.id, nombre: p.nombre, marca: p.marca, precio: p.precio, img: p.img, color: p.color, qty
      });
      toast('Agregado al carrito');
    });
  }
}

(async () => {
  const p = await getProduct(id);
  render(p);
})();
