/* =============================================================
   PRODUCTOS — Fetch + render + filtros (con catalog loader)
   ============================================================= */

import { Cart, toast } from './cart.js';
import { getCatalog, getCategories, Currency } from './catalog.js';

const state = {
  all: [],
  categorias: [],
  filters: {
    categoria: new Set(),
    marca: new Set(),
    precio: { min: 0, max: 999999 },
    oferta: false,
    busqueda: ''
  },
  sort: 'destacados'
};

function productCard(p) {
  const badge = p.badge ? `<span class="product-card__badge ${p.badgeStyle === 'accent' ? 'product-card__badge--accent' : ''}">${p.badge}</span>` : '';
  const oldPrice = p.precioAnterior ? `<del class="product-card__old">${Currency.formatShort(p.precioAnterior)}</del>` : '';
  const imgHTML = p.img
    ? `<img loading="lazy" src="${p.img}" alt="${p.nombre}" onerror="this.style.display='none'">`
    : `<div class="product-card__placeholder" style="background:linear-gradient(135deg, ${p.color || '#34466F'}, var(--navy-900))">
         <svg viewBox="0 0 100 100" width="60" height="60" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="1.5">
           <circle cx="25" cy="70" r="18"/><circle cx="75" cy="70" r="18"/>
           <path d="M25 70 L50 30 L75 70 M40 50 L65 50"/>
         </svg>
       </div>`;
  return `
    <article class="product-card" data-magnet="0.04">
      <a href="producto.html?id=${p.id}" class="product-card__media" aria-label="${p.nombre}">
        ${badge}
        ${imgHTML}
      </a>
      <div class="product-card__body">
        <span class="product-card__brand">${p.marca || '—'}</span>
        <h3 class="product-card__name"><a href="producto.html?id=${p.id}">${p.nombre}</a></h3>
        <div class="product-card__foot">
          <div class="product-card__pricing">
            <span class="product-card__price">${Currency.formatShort(p.precio)}</span>
            ${oldPrice}
          </div>
          <button class="add-to-cart" data-add="${p.id}" aria-label="Agregar al carrito">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>
    </article>`;
}

function applyFilters() {
  const { categoria, marca, precio, oferta, busqueda } = state.filters;
  let out = state.all.filter(p => {
    if (categoria.size && !categoria.has(p.categoria)) return false;
    if (marca.size && !marca.has(p.marca)) return false;
    if (p.precio < precio.min || p.precio > precio.max) return false;
    if (oferta && !p.enOferta) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      if (!p.nombre.toLowerCase().includes(q) && !p.marca.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  switch (state.sort) {
    case 'precio-asc':  out.sort((a, b) => a.precio - b.precio); break;
    case 'precio-desc': out.sort((a, b) => b.precio - a.precio); break;
    case 'nombre':      out.sort((a, b) => a.nombre.localeCompare(b.nombre)); break;
    case 'descuento':   out.sort((a, b) => (b.descuento || 0) - (a.descuento || 0)); break;
    default:            out.sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0));
  }
  return out;
}

function render() {
  const grid = document.querySelector('[data-shop-grid]');
  const count = document.querySelector('[data-shop-count]');
  if (!grid) return;

  const items = applyFilters();
  count && (count.textContent = `${items.length} producto${items.length === 1 ? '' : 's'}`);
  grid.innerHTML = items.length
    ? items.map(productCard).join('')
    : '<div class="shop-empty">No hay productos para esos filtros.</div>';

  grid.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.dataset.add;
      const p = state.all.find(x => x.id === id);
      if (!p) return;
      Cart.add({ id: p.id, nombre: p.nombre, marca: p.marca, precio: p.precio, img: p.img, color: p.color, qty: 1 });
      toast('Agregado al carrito');
    });
  });
}

function buildFilters() {
  const aside = document.querySelector('[data-shop-aside]');
  if (!aside) return;

  const categorias = [...new Set(state.all.map(p => p.categoria))].sort();
  const marcas = [...new Set(state.all.map(p => p.marca))].sort();
  const max = Math.max(...state.all.map(p => p.precio), 1000);

  aside.innerHTML = `
    <div class="filter-group">
      <h3>Búsqueda</h3>
      <input type="search" class="input" placeholder="Buscar producto…" data-search>
    </div>
    <div class="filter-group">
      <h3>Ofertas</h3>
      <ul>
        <li>
          <input type="checkbox" id="solo-oferta" data-only-sale>
          <label for="solo-oferta" style="flex:1; cursor:pointer">Solo productos en oferta</label>
        </li>
      </ul>
    </div>
    <div class="filter-group">
      <h3>Categoría</h3>
      <ul style="max-height:260px; overflow-y:auto">
        ${categorias.map(c => `
          <li>
            <input type="checkbox" id="cat-${c.replace(/\//g,'-')}" data-cat="${c}">
            <label for="cat-${c.replace(/\//g,'-')}" style="flex:1;cursor:pointer">${c}</label>
            <span class="count">${state.all.filter(p => p.categoria === c).length}</span>
          </li>`).join('')}
      </ul>
    </div>
    <div class="filter-group">
      <h3>Marca</h3>
      <ul style="max-height:260px; overflow-y:auto">
        ${marcas.map(m => `
          <li>
            <input type="checkbox" id="m-${m.replace(/[^\w]/g,'-')}" data-marca="${m}">
            <label for="m-${m.replace(/[^\w]/g,'-')}" style="flex:1;cursor:pointer">${m}</label>
            <span class="count">${state.all.filter(p => p.marca === m).length}</span>
          </li>`).join('')}
      </ul>
    </div>
    <div class="filter-group">
      <h3>Precio máximo</h3>
      <input type="range" class="range-slider" min="0" max="${max}" value="${max}" data-price-max>
      <div class="range-display">
        <span>Bs 0</span>
        <span data-price-out>${Currency.formatShort(max)}</span>
      </div>
    </div>
  `;

  aside.querySelector('[data-search]').addEventListener('input', (e) => {
    state.filters.busqueda = e.target.value;
    render();
  });
  aside.querySelector('[data-only-sale]').addEventListener('change', (e) => {
    state.filters.oferta = e.target.checked;
    render();
  });
  aside.querySelectorAll('[data-cat]').forEach(cb => cb.addEventListener('change', (e) => {
    const v = e.target.dataset.cat;
    e.target.checked ? state.filters.categoria.add(v) : state.filters.categoria.delete(v);
    render();
  }));
  aside.querySelectorAll('[data-marca]').forEach(cb => cb.addEventListener('change', (e) => {
    const v = e.target.dataset.marca;
    e.target.checked ? state.filters.marca.add(v) : state.filters.marca.delete(v);
    render();
  }));
  const rng = aside.querySelector('[data-price-max]');
  const rngOut = aside.querySelector('[data-price-out]');
  rng?.addEventListener('input', (e) => {
    state.filters.precio.max = parseInt(e.target.value, 10);
    rngOut.textContent = Currency.formatShort(parseInt(e.target.value, 10));
    render();
  });
}

function setupToolbar() {
  const sortSel = document.querySelector('[data-sort]');
  sortSel?.addEventListener('change', (e) => { state.sort = e.target.value; render(); });

  const mobileBtn = document.querySelector('[data-mobile-filter]');
  const aside = document.querySelector('[data-shop-aside]');
  mobileBtn?.addEventListener('click', () => aside?.classList.toggle('is-open'));

  // Pre-filtrar por query string ?cat=... / ?marca=... / ?oferta=1
  const params = new URLSearchParams(location.search);
  const cat = params.get('cat');
  const marca = params.get('marca');
  if (cat) state.filters.categoria.add(decodeURIComponent(cat));
  if (marca) state.filters.marca.add(decodeURIComponent(marca));
  if (params.get('oferta') === '1') state.filters.oferta = true;
}

async function init() {
  state.all = await getCatalog();
  state.categorias = await getCategories();
  buildFilters();
  setupToolbar();
  state.filters.categoria.forEach(c => {
    const cb = document.querySelector(`[data-cat="${c}"]`);
    if (cb) cb.checked = true;
  });
  state.filters.marca.forEach(m => {
    const cb = document.querySelector(`[data-marca="${m}"]`);
    if (cb) cb.checked = true;
  });
  if (state.filters.oferta) {
    const cb = document.querySelector('[data-only-sale]');
    if (cb) cb.checked = true;
  }
  render();
}

window.addEventListener('catalog:updated', init);
init();
