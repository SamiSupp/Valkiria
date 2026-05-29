/* =============================================================
   CARRITO — Listado + totales
   ============================================================= */

import { Cart, toast } from './cart.js';

const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
const SHIPPING_FREE_THRESHOLD = 1500;
const SHIPPING = 149;
const TAX_RATE = 0.16;

function render() {
  const items = Cart.read();
  const root = document.querySelector('[data-cart-root]');
  if (!root) return;

  if (!items.length) {
    root.innerHTML = `
      <div class="cart-empty">
        <h2>Tu carrito está vacío</h2>
        <p>Empieza a explorar nuestro catálogo y elige el equipo que te llevará más lejos.</p>
        <a class="btn btn--primary" href="/pages/productos.html"><span>Explorar catálogo</span></a>
      </div>`;
    return;
  }

  const subtotal = items.reduce((s, i) => s + i.precio * i.qty, 0);
  const envio = subtotal >= SHIPPING_FREE_THRESHOLD ? 0 : SHIPPING;
  const iva = subtotal * TAX_RATE;
  const total = subtotal + envio + iva;

  root.innerHTML = `
    <div class="container">
      <div class="cart-layout">
        <div class="cart-items">
          ${items.map(it => `
            <div class="cart-item" data-key="${it.id}|${it.option || ''}">
              <img src="${it.img}" alt="${it.nombre}">
              <div>
                <div class="cart-item__brand">${it.marca}</div>
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
              <div class="cart-item__price">${fmt.format(it.precio * it.qty)}</div>
            </div>
          `).join('')}
        </div>

        <aside class="cart-summary">
          <h3>Resumen</h3>
          <div class="cart-summary__row"><span>Subtotal</span><span>${fmt.format(subtotal)}</span></div>
          <div class="cart-summary__row"><span>Envío</span><span>${envio === 0 ? 'Gratis' : fmt.format(envio)}</span></div>
          <div class="cart-summary__row"><span>IVA (16%)</span><span>${fmt.format(iva)}</span></div>
          <div class="cart-summary__row total"><span>Total</span><span>${fmt.format(total)}</span></div>
          <button class="btn btn--primary btn--lg" style="width:100%; margin-top:1.4rem; justify-content:center" data-checkout>
            <span>Finalizar compra</span>
          </button>
          <a href="/pages/productos.html" class="link-arrow" style="margin-top:1rem; display:inline-flex">
            Seguir comprando
          </a>
        </aside>
      </div>
    </div>
  `;

  root.querySelectorAll('.cart-item').forEach((row) => {
    const [id, option] = row.dataset.key.split('|');
    const it = items.find(x => x.id === id && (x.option || '') === option);
    row.querySelector('[data-inc]').addEventListener('click', () => { Cart.setQty(id, option, it.qty + 1); render(); });
    row.querySelector('[data-dec]').addEventListener('click', () => { Cart.setQty(id, option, Math.max(1, it.qty - 1)); render(); });
    row.querySelector('[data-remove]').addEventListener('click', () => { Cart.remove(id, option); render(); toast('Producto eliminado'); });
  });

  root.querySelector('[data-checkout]').addEventListener('click', async () => {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, total })
      });
      const data = await res.json();
      toast(data.message || 'Pedido recibido');
      if (data.ok) { Cart.clear(); render(); }
    } catch {
      toast('No se pudo conectar con el servidor');
    }
  });
}

render();
