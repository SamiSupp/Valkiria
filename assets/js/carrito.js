/* =============================================================
   CARRITO + CHECKOUT MULTI-PASO
   Bolivia / Cochabamba — WhatsApp +591 77410154
   ============================================================= */

import { Cart, toast } from './cart.js';
import { Currency } from './catalog.js';
import { placeholderSVG } from './ui.js';

const VENDOR_WA = '59177410154';

const DEPARTAMENTOS_BO = [
  'Cochabamba', 'La Paz', 'Santa Cruz', 'Oruro', 'Potosí',
  'Chuquisaca', 'Tarija', 'Beni', 'Pando'
];

/* Estado del checkout */
const checkout = {
  step: 0,                  // 0=cart, 1=departamento, 2=metodo, 3=detalles-metodo, 4=cliente, 5=pago, 6=resumen
  departamento: '',
  metodo: '',               // 'envio' | 'recojo'
  direccion: '',
  geo: null,                // { lat, lng }
  fechaRecojo: '',
  horaRecojo: '',
  nombre: '',
  telefono: '',
  pago: '',                 // 'qr' | 'efectivo'
};

/* ============ Helpers ============ */
function escapeText(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function thumb(item) {
  if (item.img) {
    const ph = encodeURIComponent(placeholderSVG(item.categoria, item.color, 'thumb'));
    return `<img src="${item.img}" alt="" onerror="this.outerHTML=decodeURIComponent('${ph}')">`;
  }
  return placeholderSVG(item.categoria, item.color, 'thumb');
}

function calcTotals(items, metodo) {
  const subtotal = items.reduce((s, i) => s + i.precio * i.qty, 0);
  // Envío base 25 Bs (Cochabamba), gratis sobre 500 Bs. Recojo siempre gratis.
  let envio = 0;
  if (metodo === 'envio') {
    envio = subtotal >= 500 ? 0 : 25;
  }
  const total = subtotal + envio;
  return { subtotal, envio, total };
}

/* ============ STEP 0 — Lista de items ============ */
function renderCart() {
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

  const { subtotal, envio, total } = calcTotals(items, checkout.metodo || 'envio');

  root.innerHTML = `
    <div class="container">
      <div class="cart-layout">
        <div class="cart-items">
          ${items.map(it => `
            <div class="cart-item" data-key="${it.id}|${it.option || ''}">
              <div class="cart-item__thumb">${thumb(it)}</div>
              <div class="cart-item__info">
                <div class="cart-item__brand">${it.marca || ''}</div>
                <h3 class="cart-item__title">${it.nombre}</h3>
                ${it.option ? `<span class="cart-item__opt">${it.option}</span>` : ''}
                <div class="cart-item__controls">
                  <div class="qty">
                    <button type="button" data-dec aria-label="Disminuir">−</button>
                    <input type="text" value="${it.qty}" readonly aria-label="Cantidad">
                    <button type="button" data-inc aria-label="Aumentar">+</button>
                  </div>
                  <button type="button" class="remove" data-remove>Eliminar</button>
                </div>
              </div>
              <div class="cart-item__price">${Currency.formatShort(it.precio * it.qty)}</div>
            </div>
          `).join('')}
        </div>

        <aside class="cart-summary">
          <h3>Resumen</h3>
          <div class="cart-summary__row"><span>Subtotal</span><span>${Currency.formatShort(subtotal)}</span></div>
          ${envio > 0 ? `<div class="cart-summary__row"><span>Envío estimado</span><span>${Currency.formatShort(envio)}</span></div>` : ''}
          <div class="cart-summary__hint">Envío gratis en pedidos sobre Bs 500 · Recojo siempre gratis</div>
          <div class="cart-summary__row total"><span>Total</span><span>${Currency.formatShort(total)}</span></div>

          <button type="button" class="btn btn--primary btn--lg" style="width:100%; margin-top:1.4rem; justify-content:center" data-start-checkout>
            <span>Finalizar compra</span>
            <svg class="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <a href="productos.html" class="link-arrow" style="margin-top:1rem; display:inline-flex">
            Seguir comprando
          </a>
        </aside>
      </div>
    </div>
  `;

  bindCartActions();
}

function bindCartActions() {
  const items = Cart.read();
  document.querySelectorAll('.cart-item').forEach(row => {
    const [id, option] = row.dataset.key.split('|');
    const it = items.find(x => x.id === id && (x.option || '') === option);
    if (!it) return;

    row.querySelector('[data-inc]').addEventListener('click', (e) => {
      e.preventDefault();
      Cart.setQty(id, option, it.qty + 1);
      renderCart();
    });
    row.querySelector('[data-dec]').addEventListener('click', (e) => {
      e.preventDefault();
      Cart.setQty(id, option, Math.max(1, it.qty - 1));
      renderCart();
    });
    row.querySelector('[data-remove]').addEventListener('click', (e) => {
      e.preventDefault();
      Cart.remove(id, option);
      renderCart();
      toast('Producto eliminado');
    });
  });

  const startBtn = document.querySelector('[data-start-checkout]');
  startBtn?.addEventListener('click', () => {
    checkout.step = 1;
    openCheckout();
  });
}

/* ============ CHECKOUT MODAL ============ */
function openCheckout() {
  let modal = document.getElementById('checkout-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'checkout-modal';
    modal.className = 'checkout-overlay';
    document.body.appendChild(modal);
  }
  modal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  renderCheckoutStep();
}

function closeCheckout() {
  const modal = document.getElementById('checkout-modal');
  modal?.classList.remove('is-open');
  document.body.style.overflow = '';
}

function progressBar(step, total = 5) {
  const dots = [];
  for (let i = 1; i <= total; i++) {
    dots.push(`<span class="step-dot ${i < step ? 'is-done' : ''} ${i === step ? 'is-current' : ''}"><span>${i}</span></span>`);
  }
  return `<div class="checkout-steps">${dots.join('')}</div>`;
}

function renderCheckoutStep() {
  const modal = document.getElementById('checkout-modal');
  const items = Cart.read();
  const { subtotal, envio, total } = calcTotals(items, checkout.metodo || 'envio');

  let body = '';
  let title = '';
  let subtitle = '';

  switch (checkout.step) {
    case 1: // Departamento
      title = '¿En qué departamento estás?';
      subtitle = 'Lo necesitamos para coordinar el envío o recojo correctamente.';
      body = `
        <div class="dept-grid">
          ${DEPARTAMENTOS_BO.map(d => `
            <button type="button" class="dept-card ${checkout.departamento === d ? 'is-selected' : ''}" data-dept="${d}">
              <span class="dept-name">${d}</span>
              ${d === 'Cochabamba' ? '<span class="dept-note">Sede</span>' : ''}
            </button>
          `).join('')}
        </div>
      `;
      break;

    case 2: // Método
      title = '¿Envío o recojo en tienda?';
      subtitle = 'Elige cómo prefieres recibir tu pedido.';
      body = `
        <div class="method-grid">
          <button type="button" class="method-card ${checkout.metodo === 'envio' ? 'is-selected' : ''}" data-metodo="envio">
            <div class="method-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            </div>
            <h4>Envío a domicilio</h4>
            <p>Te llevamos el pedido a tu dirección.<br>Gratis en compras &gt; Bs 500.</p>
          </button>
          <button type="button" class="method-card ${checkout.metodo === 'recojo' ? 'is-selected' : ''}" data-metodo="recojo">
            <div class="method-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-6 9 6v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>
            </div>
            <h4>Recojo en tienda</h4>
            <p>Pasas por nuestro local en Cochabamba.<br>Sin costo, sin esperas.</p>
          </button>
        </div>
      `;
      break;

    case 3:
      if (checkout.metodo === 'envio') {
        title = '¿Dónde te enviamos el pedido?';
        subtitle = 'Detecta tu ubicación automáticamente o pega un link de Google Maps.';
        const mapEmbed = checkout.geo
          ? `<iframe src="https://www.google.com/maps?q=${checkout.geo.lat},${checkout.geo.lng}&z=16&output=embed" loading="lazy" allowfullscreen></iframe>`
          : `<div class="map-empty">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>Sin ubicación detectada</span>
            </div>`;
        body = `
          <div class="addr-block">
            <button type="button" class="admin-btn admin-btn--primary" data-geolocate>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3v3M12 18v3M21 12h-3M6 12H3"/><circle cx="12" cy="12" r="3"/></svg>
              Detectar mi ubicación
            </button>
            ${checkout.geo ? `
              <span class="geo-confirm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 7" stroke-linecap="round"/></svg>
                Ubicación detectada
              </span>
            ` : ''}

            <div class="map-frame">${mapEmbed}</div>

            <div class="field">
              <label for="addr">Dirección textual (calle, número, referencia)</label>
              <textarea class="textarea" id="addr" rows="3" placeholder="Ej: Av. América Este 1234, esquina con calle Beni, casa esquinera azul...">${escapeText(checkout.direccion)}</textarea>
            </div>
          </div>
        `;
      } else {
        title = 'Elige fecha y hora de recojo';
        subtitle = 'Atendemos lunes a sábado de 9:00 a 20:00 en Calle Potosí 1779.';
        const today = new Date();
        const minDate = today.toISOString().split('T')[0];
        const maxDate = new Date(today.getTime() + 14 * 86400000).toISOString().split('T')[0];

        const hours = [];
        for (let h = 9; h <= 19; h++) {
          hours.push(`${String(h).padStart(2,'0')}:00`);
          if (h < 19) hours.push(`${String(h).padStart(2,'0')}:30`);
        }

        body = `
          <div class="pickup-block">
            <div class="field">
              <label for="pickup-date">Fecha de recojo</label>
              <input class="input" id="pickup-date" type="date" min="${minDate}" max="${maxDate}" value="${checkout.fechaRecojo || minDate}">
            </div>
            <div class="field">
              <label>Hora aproximada</label>
              <div class="hour-grid">
                ${hours.map(h => `
                  <button type="button" class="hour-chip ${checkout.horaRecojo === h ? 'is-selected' : ''}" data-hora="${h}">${h}</button>
                `).join('')}
              </div>
            </div>
            <div class="pickup-info">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <div>
                <strong>Calle Potosí N° 1779</strong>
                <small>Entre Ciclovía y Juan Capriles, Cochabamba</small>
              </div>
              <a href="https://maps.app.goo.gl/vdd24m9f89wUxiL46" target="_blank" rel="noopener" class="link-arrow" style="font-size:.72rem">Ver mapa →</a>
            </div>
          </div>
        `;
      }
      break;

    case 4: // Datos del cliente
      title = 'Tus datos de contacto';
      subtitle = 'Para coordinar la entrega y enviarte la confirmación por WhatsApp.';
      body = `
        <div class="field">
          <label for="full-name">Nombre completo</label>
          <input class="input" id="full-name" type="text" autocomplete="name" required value="${escapeText(checkout.nombre)}">
        </div>
        <div class="field">
          <label for="phone">Número de WhatsApp</label>
          <div class="phone-input">
            <span class="phone-prefix">+591</span>
            <input class="input" id="phone" type="tel" inputmode="numeric" pattern="[0-9]{8}" placeholder="7XXXXXXX" autocomplete="tel" required value="${escapeText(checkout.telefono)}" maxlength="8">
          </div>
          <small class="hint">8 dígitos, sin espacios ni guiones</small>
        </div>
      `;
      break;

    case 5: // Pago
      title = '¿Cómo prefieres pagar?';
      subtitle = 'Coordinamos el método contigo cuando confirmes el pedido.';
      body = `
        <div class="pay-grid">
          <button type="button" class="pay-card ${checkout.pago === 'qr' ? 'is-selected' : ''}" data-pago="qr">
            <div class="pay-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M19 19v.01M14 19h3M19 14v3"/></svg>
            </div>
            <h4>Pago por QR</h4>
            <p>Tigo Money, Yape, transferencia bancaria.<br>Te enviamos el QR al confirmar.</p>
          </button>
          <button type="button" class="pay-card ${checkout.pago === 'efectivo' ? 'is-selected' : ''}" data-pago="efectivo">
            <div class="pay-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 10v4M18 10v4"/></svg>
            </div>
            <h4>Pago en efectivo</h4>
            <p>${checkout.metodo === 'envio' ? 'Pagas al recibir el pedido en tu casa.' : 'Pagas al recoger en tienda.'}</p>
          </button>
        </div>
      `;
      break;
  }

  modal.innerHTML = `
    <div class="checkout-modal">
      <button class="checkout-close" data-close-checkout aria-label="Cerrar">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m6 6 12 12M18 6 6 18" stroke-linecap="round"/></svg>
      </button>

      ${progressBar(checkout.step, 5)}

      <div class="checkout-content">
        <span class="kicker">Paso ${checkout.step} de 5</span>
        <h2>${title}</h2>
        <p class="checkout-sub">${subtitle}</p>

        <div class="checkout-body">
          ${body}
        </div>

        <div class="checkout-actions">
          <button type="button" class="admin-btn admin-btn--ghost" data-back ${checkout.step === 1 ? 'disabled' : ''}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M11 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Atrás
          </button>
          <button type="button" class="admin-btn admin-btn--primary" data-next>
            ${checkout.step === 5 ? 'Enviar pedido por WhatsApp' : 'Continuar'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>

        <div class="checkout-mini-summary">
          <span>${items.length} producto${items.length === 1 ? '' : 's'}</span>
          <strong>${Currency.formatShort(total)}</strong>
        </div>
      </div>
    </div>
  `;

  bindCheckoutStep();
}

function bindCheckoutStep() {
  // Close
  document.querySelector('[data-close-checkout]')?.addEventListener('click', closeCheckout);

  // Step-specific
  if (checkout.step === 1) {
    document.querySelectorAll('[data-dept]').forEach(b => b.addEventListener('click', () => {
      checkout.departamento = b.dataset.dept;
      document.querySelectorAll('[data-dept]').forEach(x => x.classList.remove('is-selected'));
      b.classList.add('is-selected');
    }));
  }
  if (checkout.step === 2) {
    document.querySelectorAll('[data-metodo]').forEach(b => b.addEventListener('click', () => {
      checkout.metodo = b.dataset.metodo;
      document.querySelectorAll('[data-metodo]').forEach(x => x.classList.remove('is-selected'));
      b.classList.add('is-selected');
    }));
  }
  if (checkout.step === 3 && checkout.metodo === 'envio') {
    document.querySelector('[data-geolocate]')?.addEventListener('click', requestGeo);
    document.querySelector('#addr')?.addEventListener('input', (e) => {
      checkout.direccion = e.target.value;
    });
  }
  if (checkout.step === 3 && checkout.metodo === 'recojo') {
    document.querySelector('#pickup-date')?.addEventListener('change', (e) => {
      checkout.fechaRecojo = e.target.value;
    });
    document.querySelectorAll('[data-hora]').forEach(b => b.addEventListener('click', () => {
      checkout.horaRecojo = b.dataset.hora;
      document.querySelectorAll('[data-hora]').forEach(x => x.classList.remove('is-selected'));
      b.classList.add('is-selected');
    }));
  }
  if (checkout.step === 4) {
    document.querySelector('#full-name')?.addEventListener('input', (e) => {
      checkout.nombre = e.target.value;
    });
    const phoneInput = document.querySelector('#phone');
    phoneInput?.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8);
      checkout.telefono = e.target.value;
    });
  }
  if (checkout.step === 5) {
    document.querySelectorAll('[data-pago]').forEach(b => b.addEventListener('click', () => {
      checkout.pago = b.dataset.pago;
      document.querySelectorAll('[data-pago]').forEach(x => x.classList.remove('is-selected'));
      b.classList.add('is-selected');
    }));
  }

  // Atrás
  document.querySelector('[data-back]')?.addEventListener('click', () => {
    if (checkout.step > 1) {
      checkout.step--;
      renderCheckoutStep();
    }
  });

  // Continuar / Enviar
  document.querySelector('[data-next]')?.addEventListener('click', advance);
}

function advance() {
  // Validación por paso
  if (checkout.step === 1 && !checkout.departamento) {
    toast('Selecciona un departamento'); return;
  }
  if (checkout.step === 2 && !checkout.metodo) {
    toast('Selecciona envío o recojo'); return;
  }
  if (checkout.step === 3) {
    if (checkout.metodo === 'envio') {
      if (!checkout.direccion.trim() && !checkout.geo) {
        toast('Indica la dirección o detecta tu ubicación'); return;
      }
    } else {
      if (!checkout.fechaRecojo || !checkout.horaRecojo) {
        toast('Elige fecha y hora de recojo'); return;
      }
    }
  }
  if (checkout.step === 4) {
    if (!checkout.nombre.trim()) { toast('Ingresa tu nombre'); return; }
    if (!/^[67]\d{7}$/.test(checkout.telefono)) {
      toast('Ingresa un celular boliviano válido (8 dígitos)'); return;
    }
  }
  if (checkout.step === 5) {
    if (!checkout.pago) { toast('Selecciona método de pago'); return; }
    sendWhatsApp();
    return;
  }
  checkout.step++;
  renderCheckoutStep();
}

function requestGeo() {
  if (!navigator.geolocation) {
    toast('Tu navegador no soporta geolocalización');
    return;
  }
  toast('Detectando ubicación…');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      checkout.geo = { lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) };
      renderCheckoutStep();
      toast('Ubicación detectada');
    },
    (err) => {
      const msg = err.code === 1 ? 'Permiso denegado · Ingresa la dirección manualmente'
                : err.code === 2 ? 'No se pudo detectar la ubicación'
                : 'Tiempo agotado';
      toast(msg);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

/* ============ Envío a WhatsApp ============ */
function sendWhatsApp() {
  const items = Cart.read();
  const { subtotal, envio, total } = calcTotals(items, checkout.metodo);

  const lines = [];
  lines.push('*🚴 NUEVO PEDIDO — VALKIRIA BIKES*');
  lines.push('');
  lines.push(`*Cliente:* ${checkout.nombre}`);
  lines.push(`*WhatsApp:* +591 ${checkout.telefono}`);
  lines.push(`*Departamento:* ${checkout.departamento}`);
  lines.push('');
  lines.push('*🛒 Productos:*');
  items.forEach(it => {
    lines.push(`• ${it.qty}× ${it.nombre}${it.marca ? ' (' + it.marca + ')' : ''} — ${Currency.formatShort(it.precio * it.qty)}`);
  });
  lines.push('');
  lines.push(`*Subtotal:* ${Currency.formatShort(subtotal)}`);
  if (envio > 0) lines.push(`*Envío:* ${Currency.formatShort(envio)}`);
  else if (checkout.metodo === 'envio') lines.push(`*Envío:* Gratis`);
  lines.push(`*TOTAL:* ${Currency.formatShort(total)}`);
  lines.push('');

  lines.push('*📦 Modalidad:*');
  if (checkout.metodo === 'envio') {
    lines.push('Envío a domicilio');
    if (checkout.direccion) lines.push(`Dirección: ${checkout.direccion}`);
    if (checkout.geo) {
      const mapsLink = `https://maps.google.com/?q=${checkout.geo.lat},${checkout.geo.lng}`;
      lines.push(`Ubicación: ${mapsLink}`);
    }
  } else {
    const fecha = new Date(checkout.fechaRecojo + 'T12:00:00').toLocaleDateString('es-BO', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    lines.push('Recojo en tienda');
    lines.push(`Fecha: ${fecha}`);
    lines.push(`Hora: ${checkout.horaRecojo}`);
    lines.push('Local: Calle Potosí N° 1779, Cochabamba');
  }
  lines.push('');
  lines.push(`*💳 Método de pago:* ${checkout.pago === 'qr' ? 'Pago por QR (Tigo Money / Transferencia)' : 'Pago en efectivo'}`);
  lines.push('');
  lines.push('_Pedido generado desde valkiriabikes.com_');

  const msg = lines.join('\n');
  const url = `https://wa.me/${VENDOR_WA}?text=${encodeURIComponent(msg)}`;

  // Abrir WhatsApp
  window.open(url, '_blank');

  // Reset y feedback
  toast('Abriendo WhatsApp con tu pedido…');
  setTimeout(() => {
    closeCheckout();
    // No vacía el carrito automáticamente — el usuario puede querer ajustar.
  }, 800);
}

/* ============ Init ============ */
window.addEventListener('catalog:updated', renderCart);
renderCart();
