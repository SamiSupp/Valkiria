/* =============================================================
   PRODUCTO DETALLE — galería + descripción rica + relacionados
   ============================================================= */

import { Cart, toast } from './cart.js';
import { getProduct, getCatalog, Currency } from './catalog.js';
import { productImage, placeholderSVG } from './ui.js';

const id = new URLSearchParams(location.search).get('id');

function descParagraphs(p) {
  if (!p.descripcion) return '';
  // El texto viene con saltos de línea; separa en párrafos.
  const lines = p.descripcion.split(/\n+/).map(l => l.trim()).filter(Boolean);

  const html = [];
  let listOpen = false;
  for (const line of lines) {
    // Líneas que parecen títulos de sección (terminan con ":" y son cortas)
    if (/^[^.]{2,40}:$/.test(line)) {
      if (listOpen) { html.push('</ul>'); listOpen = false; }
      html.push(`<h4 class="desc-section">${line.replace(/:$/,'')}</h4>`);
    } else if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
      if (!listOpen) { html.push('<ul class="desc-list">'); listOpen = true; }
      html.push(`<li>${line.replace(/^[•\-*]\s*/, '')}</li>`);
    } else {
      if (listOpen) { html.push('</ul>'); listOpen = false; }
      html.push(`<p>${line}</p>`);
    }
  }
  if (listOpen) html.push('</ul>');
  return html.join('');
}

function relatedProductsHTML(p, all) {
  const related = all
    .filter(x => x.id !== p.id && x.categoria === p.categoria)
    .slice(0, 4);
  if (!related.length) return '';
  return `
    <section class="related-section section">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="kicker">— También en ${p.categoria}</span>
            <h2 class="title-md" style="margin-top:.6rem">Productos relacionados</h2>
          </div>
          <a class="link-arrow" href="productos.html?cat=${encodeURIComponent(p.categoria)}">Ver todos →</a>
        </div>
        <div class="related-grid">
          ${related.map(r => `
            <a class="product-card" href="producto.html?id=${r.id}">
              <div class="product-card__media">
                ${productImage(r, { size: 'full' })}
              </div>
              <div class="product-card__body">
                <span class="product-card__brand">${r.marca}</span>
                <h3 class="product-card__name">${r.nombre}</h3>
                <div class="product-card__foot">
                  <span class="product-card__price">${Currency.formatShort(r.precio)}</span>
                </div>
              </div>
            </a>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

function render(p, all) {
  if (!p) {
    document.querySelector('[data-product-root]').innerHTML = `
      <div class="container" style="padding-block:8rem; text-align:center">
        <h1 class="title-lg">Producto no encontrado</h1>
        <p class="lead" style="margin:1rem auto">El producto que buscas no está disponible.</p>
        <a class="btn btn--primary" href="productos.html"><span>Ver catálogo</span></a>
      </div>`;
    return;
  }

  document.title = `${p.nombre} — Valkiria Bikes`;

  const crumbs = document.querySelector('[data-crumbs]');
  if (crumbs) crumbs.innerHTML = `
    <a href="index.html">Inicio</a> <span>/</span>
    <a href="productos.html">Catálogo</a> <span>/</span>
    <a href="productos.html?cat=${encodeURIComponent(p.categoria)}">${p.categoria}</a> <span>/</span>
    <span style="color:var(--bone-50)">${p.nombre}</span>`;

  const stockLine = p.disponible > 0
    ? `<span class="stock-pill stock-pill--ok"><span class="dot"></span> ${p.disponible} en stock</span>`
    : `<span class="stock-pill stock-pill--out">Agotado · Consultar</span>`;

  const descripcionHTML = p.tieneDescripcionReal
    ? descParagraphs(p)
    : `<p class="desc-fallback">
        Producto de la categoría <strong>${p.categoria}</strong>, marca <strong>${p.marca}</strong>.
        Para más detalles técnicos, especificaciones o consultas sobre este producto,
        escríbenos directamente por WhatsApp y un asesor te responderá en minutos.
      </p>`;

  const oferta = p.enOferta && p.precioAnterior
    ? `<span class="save">Ahorra ${p.descuento || Math.round((1 - p.precio / p.precioAnterior) * 100)}%</span>`
    : '';

  document.querySelector('[data-product-root]').innerHTML = `
    <div class="container product-detail-container">
      <div class="product-detail">
        <div class="product-gallery" data-reveal="left">
          <div class="product-gallery__main" id="main-image">
            ${productImage(p, { size: 'full' })}
          </div>
          ${p.enOferta ? `<div class="gallery-flag">Oferta · ${p.descuento ? '-' + p.descuento + '%' : 'Promo'}</div>` : ''}
        </div>

        <div class="product-info" data-reveal="right">
          <div class="info-head">
            <a class="brand-tag" href="productos.html?marca=${encodeURIComponent(p.marca)}">${p.marca}</a>
            <span class="cat-tag">${p.categoria}</span>
          </div>
          <h1>${p.nombre}</h1>

          <div class="price">
            <span class="price-main">${Currency.format(p.precio)}</span>
            ${p.precioAnterior ? `<del class="price-old">${Currency.format(p.precioAnterior)}</del>` : ''}
            ${oferta}
          </div>

          ${stockLine}

          <div class="desc-block">
            ${descripcionHTML}
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
            <button class="btn btn--primary btn--lg" data-add-to-cart ${p.disponible === 0 ? 'disabled' : ''}>
              <span>${p.disponible === 0 ? 'Sin stock — consultar' : 'Agregar al carrito'}</span>
              <svg class="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <a class="btn btn--ghost btn--lg" href="https://wa.me/59177410154?text=${encodeURIComponent('Hola Valkiria Bikes, me interesa el producto: ' + p.nombre)}" target="_blank" rel="noopener">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Preguntar por WhatsApp</span>
            </a>
          </div>

          <div class="info-grid">
            <div class="info-cell">
              <span class="label">Recojo en tienda</span>
              <strong>Calle Potosí 1779<br>Cochabamba</strong>
              <small>Horario 9:00–20:00</small>
            </div>
            <div class="info-cell">
              <span class="label">Disponibilidad</span>
              <strong>${p.disponible} unidad${p.disponible === 1 ? '' : 'es'}</strong>
              <small>Stock en tiempo real</small>
            </div>
            <div class="info-cell">
              <span class="label">Pago</span>
              <strong>QR · Efectivo</strong>
              <small>Coordinas al finalizar</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    ${relatedProductsHTML(p, all)}
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
        id: p.id, nombre: p.nombre, marca: p.marca, precio: p.precio,
        img: p.img, color: p.color, categoria: p.categoria, qty
      });
      toast('Agregado al carrito');
    });
  }
}

(async () => {
  const all = await getCatalog();
  const p = await getProduct(id);
  render(p, all);
})();
