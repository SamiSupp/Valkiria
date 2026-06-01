/* =============================================================
   CART — Persistencia en localStorage + UI badge
   ============================================================= */

const STORAGE_KEY = 'valkiria.cart.v1';

export const Cart = {
  read() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  },
  write(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    this._broadcast(items);
  },
  count() { return this.read().reduce((n, it) => n + it.qty, 0); },
  total() { return this.read().reduce((s, it) => s + it.price * it.qty, 0); },
  add(item) {
    const opt = item.option || '';
    const items = this.read();
    const idx = items.findIndex(i => i.id === item.id && (i.option || '') === opt);
    if (idx >= 0) items[idx].qty += item.qty || 1;
    else items.push({ ...item, option: opt, qty: item.qty || 1 });
    this.write(items);
  },
  remove(id, option) {
    const opt = option || '';
    const items = this.read().filter(i => !(i.id === id && (i.option || '') === opt));
    this.write(items);
  },
  setQty(id, option, qty) {
    const opt = option || '';
    const items = this.read().map(i =>
      (i.id === id && (i.option || '') === opt) ? { ...i, qty: Math.max(1, qty) } : i
    );
    this.write(items);
  },
  clear() { this.write([]); },
  _listeners: [],
  onChange(fn) { this._listeners.push(fn); fn(this.read()); },
  _broadcast(items) { this._listeners.forEach(fn => fn(items)); }
};

/* ---------- UI badge ---------- */
function syncBadge() {
  const badges = document.querySelectorAll('[data-cart-count]');
  const n = Cart.count();
  badges.forEach(b => {
    b.textContent = n;
    b.classList.toggle('is-visible', n > 0);
  });
}
window.addEventListener('storage', (e) => { if (e.key === STORAGE_KEY) syncBadge(); });
document.addEventListener('DOMContentLoaded', syncBadge);
Cart.onChange(syncBadge);

/* Toast minimalista */
export function toast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  Object.assign(t.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    background: 'var(--navy-950)',
    color: 'var(--bone-50)',
    padding: '14px 18px',
    borderRadius: '999px',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    letterSpacing: '.16em',
    textTransform: 'uppercase',
    boxShadow: 'var(--shadow-lg)',
    zIndex: 9999,
    opacity: '0',
    transform: 'translateY(20px)',
    transition: 'opacity 280ms, transform 280ms cubic-bezier(.34,1.56,.64,1)'
  });
  document.body.appendChild(t);
  requestAnimationFrame(() => {
    t.style.opacity = '1'; t.style.transform = 'translateY(0)';
  });
  setTimeout(() => {
    t.style.opacity = '0'; t.style.transform = 'translateY(20px)';
    setTimeout(() => t.remove(), 320);
  }, 2400);
}
