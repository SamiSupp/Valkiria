/* =============================================================
   CARRITO — Listado + totales (moneda BOB)
   ============================================================= */

import { Cart, toast } from './cart.js';
import { Currency } from './catalog.js';

const SHIPPING_FREE_THRESHOLD = 500;
const SHIPPING = 25;

function placeholderImg(color) {
  return `<div style="background:linear-gradient(135deg, ${color || '#34466F'}, var(--navy-900)); width:100%; aspect-ratio:1/1; border-radius:var(--radius-sm); display:grid; place-items:center;">
    <svg viewBox="0 0 100 100" width="40" height="40" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="1.5"><circle cx="30" cy="70" r="18"/><circle cx="70" cy="70" r="18"/><path d="M30 70 L50 35 L70 70 M42 50 L62 50"/></svg>
  </div>`;
}

function render() {
  const items = Cart.read();
  const root = document.querySelector('[data-cart-root]');
  if (!root) return;

  if (!items.length) {
    root.innerHTML = `
      <div class="container">
        <div class="cart-empty">
          <h2>Tu carrito está vacío</h2>
          <p>Empieza a explorar nuestro catálogo y elige el equipo que te llevará más lejos.</p>
          <a class="btn btn--primary" href="productos.html"><span>Explorar catálogo</span></a>
        </div>
      </div>`;
    return;
  }

  const subtotal = items.reduce((s, i) => s + i.precio * i.qty, 0);
  const envio = subtotal >= SHIPPING_FREE_THRESHOLD ? 0 : SHIPPING;
  const total = subtotal + envio;

  root.innerHTML = `
    <div class="container">
      <div class="cart-layout">
        <div class="cart-items">
          ${items.map(it => `
            <div class="cart-item" data-key="${it.id}|${it.option || ''}">
              ${it.img ? `<img src="${it.img}" alt="${it.nombre}" onerror="this.replaceWith(this.nextElementSibling)">` : ''}
              <div class="cart-item__media">${placeholderImg(it.color)}</div>
              <div>
                <div class="cart-item__brand">${it.marca || ''}</div>
                <h3 class="cart-item__title">${it.nombre}</h3>
                ${it.option ? `<span class="cart-item__brand" style="color:var(--ink-muted)">${it.option}</span>` : ''}
                <div class="cart-item__controls">
                  <div class="qty">
                    <button data-dec aria-label="Disminuir">−</button>
                    <input type="text" value="${it.qty}" readonly>
                    <button data-inc aria-label="Aumentar">+</button>
                  </div>
                  <button class="remove" data-remove>Eliminar</button>
                </div>
              </div>
              <div class="cart-item__price">${Currency.formatShort(it.precio * it.qty)}</div>
            </div>
          `).join('')}
        </div>

        <aside class="cart-summary">
          <h3>Resumen</h3>
          <div class="cart-summary__row"><span>Subtotal</span><span>${Currency.formatShort(subtotal)}</span></div>
          <div class="cart-summary__row"><span>Envío</span><span>${envio === 0 ? 'Gratis' : Currency.formatShort(envio)}</span></div>
          ${envio > 0 ? `<div style="font-family:var(--font-mono); font-size:.7rem; color:var(--ink-muted); margin-bottom:.6rem">Envío gratis sobre Bs ${SHIPPING_FREE_THRESHOLD}</div>` : ''}
          <div class="cart-summary__row total"><span>Total</span><span>${Currency.formatShort(total)}</span></div>
          <button class="btn btn--primary btn--lg" style="width:100%; margin-top:1.4rem; justify-content:center" data-checkout>
            <span>Coordinar por WhatsApp</span>
          </button>
          <a href="productos.html" class="link-arrow" style="margin-top:1rem; display:inline-flex">
            Seguir comprando
          </a>
        </aside>
      </div>
    </div>
  `;

  // Hide placeholder when image is present
  root.querySelectorAll('.cart-item').forEach(row => {
    const img = row.querySelector('img');
    const ph = row.querySelector('.cart-item__media');
    if (img && ph) {
      // si la imagen carga correctamente, ocultamos el placeholder
      img.addEventListener('load', () => { ph.style.display = 'none'; });
      if (img.complete && img.naturalWidth > 0) ph.style.display = 'none';
    }
  });

  root.querySelectorAll('.cart-item').forEach((row) => {
    const [id, option] = row.dataset.key.split('|');
    const it = items.find(x => x.id === id && (x.option || '') === option);
    row.querySelector('[data-inc]').addEventListener('click', () => { Cart.setQty(id, option, it.qty + 1); render(); });
    row.querySelector('[data-dec]').addEventListener('click', () => { Cart.setQty(id, option, Math.max(1, it.qty - 1)); render(); });
    row.querySelector('[data-remove]').addEventListener('click', () => { Cart.remove(id, option); render(); toast('Producto eliminado'); });
  });

  root.querySelector('[data-checkout]').addEventListener('click', () => {
    // Construye mensaje de WhatsApp con el pedido
    const lines = items.map(i => `• ${i.qty}× ${i.nombre} (${i.marca}) — ${Currency.formatShort(i.precio * i.qty)}`).join('\n');
    const msg = `Hola Valkiria Bikes, quiero coordinar la compra del siguiente pedido:\n\n${lines}\n\nSubtotal: ${Currency.formatShort(subtotal)}\nEnvío: ${envio === 0 ? 'Gratis' : Currency.formatShort(envio)}\nTotal: ${Currency.formatShort(total)}\n\nGracias.`;
    const url = `https://wa.me/59177410154?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    toast('Abriendo WhatsApp…');
  });
}

window.addEventListener('catalog:updated', render);
render();
