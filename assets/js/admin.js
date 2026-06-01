/* =============================================================
   ADMIN — Login + CRUD productos
   ============================================================= */

import {
  getCatalog, getCategories, getBaseProduct,
  editProduct, deleteProduct, addProduct, restoreProduct,
  readOverrides, resetOverrides, exportFullCatalog,
  Currency
} from './catalog.js';
import { productImage } from './ui.js';

const CREDS = { user: 'valkiria', pass: 'valkiria' };
const AUTH_KEY = 'valkiria.admin.auth.v1';

const state = {
  productos: [],
  base: [],          // versión original (para detectar modificados)
  categorias: [],
  view: 'productos',
  filters: { q: '', cat: '', marca: '', estado: '' },
  overrides: { edits:{}, added:[], deleted:[] }
};

/* ============== AUTH ============== */
function isAuthed() {
  return sessionStorage.getItem(AUTH_KEY) === '1';
}
function setAuthed(v) {
  if (v) sessionStorage.setItem(AUTH_KEY, '1');
  else sessionStorage.removeItem(AUTH_KEY);
}

const loginScreen = document.getElementById('login-screen');
const adminShell = document.getElementById('admin-shell');
const loginError = document.getElementById('login-error');

document.getElementById('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const u = document.getElementById('usuario').value.trim();
  const p = document.getElementById('contrasena').value;
  if (u === CREDS.user && p === CREDS.pass) {
    setAuthed(true);
    showShell();
  } else {
    loginError.classList.add('is-visible');
    loginError.textContent = 'Credenciales inválidas';
    setTimeout(() => loginError.classList.remove('is-visible'), 3000);
  }
});

function showShell() {
  loginScreen.style.display = 'none';
  adminShell.style.display = 'grid';
  init();
}

function logout() {
  setAuthed(false);
  adminShell.style.display = 'none';
  loginScreen.style.display = 'grid';
  document.getElementById('login-form').reset();
}

if (isAuthed()) showShell();

/* ============== BANNER ============== */
const banner = document.getElementById('banner');
function notify(msg, type = '') {
  banner.textContent = msg;
  banner.className = 'admin-banner is-visible' + (type ? ` is-${type}` : '');
  setTimeout(() => banner.classList.remove('is-visible'), 2400);
}

/* ============== INIT ============== */
async function init() {
  // Cargar base original (sin overrides)
  const baseRes = await fetch('assets/data/productos.json', { cache: 'no-store' });
  state.base = await baseRes.json();
  state.categorias = await getCategories();
  state.overrides = readOverrides();
  state.productos = await getCatalog();

  populateSelects();
  renderCurrentView();
  bindActions();
}

function populateSelects() {
  const cats = [...new Set(state.productos.map(p => p.categoria))].sort();
  const marcas = [...new Set(state.productos.map(p => p.marca))].sort();
  const filterCat = document.getElementById('filter-cat');
  const filterMarca = document.getElementById('filter-marca');
  const formCat = document.getElementById('f-categoria');

  filterCat.innerHTML = '<option value="">Todas las categorías</option>' +
    cats.map(c => `<option>${c}</option>`).join('');
  filterMarca.innerHTML = '<option value="">Todas las marcas</option>' +
    marcas.map(m => `<option>${m}</option>`).join('');
  formCat.innerHTML = cats.map(c => `<option>${c}</option>`).join('');
}

/* ============== VIEWS ============== */
document.querySelectorAll('[data-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    state.view = btn.dataset.view;
    document.querySelectorAll('[data-view-content]').forEach(el => {
      el.style.display = el.dataset.viewContent === state.view ? '' : 'none';
    });
    renderCurrentView();
  });
});

function renderCurrentView() {
  if (state.view === 'productos') renderProducts();
  else if (state.view === 'categorias') renderCategorias();
  else if (state.view === 'estadisticas') renderStats();
}

/* ============== PRODUCTOS ============== */
function isModified(p) {
  const base = state.base.find(b => b.id === p.id);
  if (!base) return false;
  return state.overrides.edits && state.overrides.edits[p.id];
}
function isAdded(p) {
  return state.overrides.added && state.overrides.added.some(a => a.id === p.id);
}

function renderStats() {
  // Para el dashboard
  const total = state.productos.length;
  const ofertas = state.productos.filter(p => p.enOferta).length;
  const mods = Object.keys(state.overrides.edits || {}).length;
  const adds = (state.overrides.added || []).length;
  document.getElementById('stat-row').innerHTML = '';

  const stats = document.getElementById('stats-detail');
  const total2 = state.productos.length;
  const out = state.productos.filter(p => p.disponible === 0).length;
  const totalValor = state.productos.reduce((s, p) => s + p.precio * Math.max(1, p.disponible), 0);
  const promPrice = state.productos.reduce((s, p) => s + p.precio, 0) / Math.max(1, total2);

  stats.innerHTML = `
    <div class="stat-card"><div class="label">Total productos</div><div class="value">${total2}</div></div>
    <div class="stat-card"><div class="label">En oferta</div><div class="value">${ofertas} <em>productos</em></div></div>
    <div class="stat-card"><div class="label">Agotados</div><div class="value">${out}</div></div>
    <div class="stat-card"><div class="label">Precio promedio</div><div class="value">${Currency.formatShort(promPrice)}</div></div>
    <div class="stat-card"><div class="label">Valor inventario</div><div class="value" style="font-size:1.6rem">${Currency.formatShort(totalValor)}</div></div>
    <div class="stat-card"><div class="label">Editados (sesión)</div><div class="value">${mods}</div></div>
    <div class="stat-card"><div class="label">Agregados (sesión)</div><div class="value">${adds}</div></div>
    <div class="stat-card"><div class="label">Categorías</div><div class="value">${new Set(state.productos.map(p=>p.categoria)).size}</div></div>
  `;

  // Brand stats
  const byBrand = {};
  state.productos.forEach(p => {
    const b = p.marca || '—';
    if (!byBrand[b]) byBrand[b] = { count:0, total:0, oferta:0 };
    byBrand[b].count++;
    byBrand[b].total += p.precio;
    if (p.enOferta) byBrand[b].oferta++;
  });
  const rows = Object.entries(byBrand)
    .sort((a,b) => b[1].count - a[1].count)
    .map(([m, d]) => `
      <tr>
        <td>${m}</td>
        <td>${d.count}</td>
        <td class="price">${Currency.formatShort(d.total / d.count)}</td>
        <td>${d.oferta}</td>
      </tr>
    `).join('');
  document.getElementById('brand-stats').innerHTML = rows;
}

function renderProducts() {
  // Stat cards top
  const total = state.productos.length;
  const ofertas = state.productos.filter(p => p.enOferta).length;
  const mods = Object.keys(state.overrides.edits || {}).length;
  const adds = (state.overrides.added || []).length;
  document.getElementById('stat-row').innerHTML = `
    <div class="stat-card"><div class="label">Total productos</div><div class="value">${total}</div></div>
    <div class="stat-card"><div class="label">En oferta</div><div class="value">${ofertas}</div></div>
    <div class="stat-card"><div class="label">Editados</div><div class="value">${mods}</div></div>
    <div class="stat-card"><div class="label">Agregados</div><div class="value">${adds}</div></div>
  `;

  const { q, cat, marca, estado } = state.filters;
  let items = state.productos.slice();
  if (cat) items = items.filter(p => p.categoria === cat);
  if (marca) items = items.filter(p => p.marca === marca);
  if (q) {
    const Q = q.toLowerCase();
    items = items.filter(p => p.nombre.toLowerCase().includes(Q) || p.marca.toLowerCase().includes(Q));
  }
  if (estado === 'oferta') items = items.filter(p => p.enOferta);
  if (estado === 'modificados') items = items.filter(p => isModified(p));
  if (estado === 'agregados') items = items.filter(p => isAdded(p));

  document.getElementById('topbar-meta').textContent = `${items.length} de ${total} productos`;

  const tbody = document.getElementById('tbody');
  tbody.innerHTML = items.map(p => {
    const mod = isModified(p);
    const added = isAdded(p);
    const thumb = productImage(p, { size: 'thumb' });

    let pills = '';
    if (p.enOferta) pills += `<span class="pill pill--sale">Oferta ${p.descuento ? '-' + p.descuento + '%' : ''}</span> `;
    if (added) pills += `<span class="pill pill--new">Nuevo</span> `;
    else if (mod) pills += `<span class="pill pill--mod">Modificado</span> `;

    return `
      <tr data-id="${p.id}">
        <td><div class="thumb">${thumb}</div></td>
        <td>
          <div class="name-cell"><div class="text">
            <strong>${p.nombre}</strong>
            <small>${p.id}</small>
          </div></div>
        </td>
        <td><span style="font-size:.85rem; color:var(--ink-soft)">${p.categoria}</span></td>
        <td>${p.marca}</td>
        <td class="price">${Currency.formatShort(p.precio)}</td>
        <td class="old-price">${p.precioAnterior ? Currency.formatShort(p.precioAnterior) : ''}</td>
        <td>${p.disponible}</td>
        <td>${pills}</td>
        <td>
          <div class="actions">
            <button class="icon-action" title="Editar" data-edit="${p.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20h4l10-10-4-4L4 16v4z" stroke-linejoin="round"/></svg>
            </button>
            ${mod ? `
              <button class="icon-action" title="Restaurar original" data-restore="${p.id}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            ` : ''}
            <button class="icon-action danger" title="Eliminar" data-del="${p.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('') || '<tr><td colspan="9" style="text-align:center; padding:3rem; color:var(--ink-muted)">No hay productos con esos filtros.</td></tr>';

  // Bind actions
  tbody.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openEdit(b.dataset.edit)));
  tbody.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => askDelete(b.dataset.del)));
  tbody.querySelectorAll('[data-restore]').forEach(b => b.addEventListener('click', () => {
    restoreProduct(b.dataset.restore);
    state.overrides = readOverrides();
    refreshCatalog().then(renderProducts).then(() => notify('Producto restaurado', 'success'));
  }));
}

function renderCategorias() {
  const grid = document.getElementById('cat-grid');
  const counts = {};
  state.productos.forEach(p => counts[p.categoria] = (counts[p.categoria] || 0) + 1);
  const cells = state.categorias.map(c => `
    <a class="cat-cell" href="?cat=${encodeURIComponent(c.nombre)}#productos" data-jump-cat="${c.nombre}">
      <div class="head">
        <span class="color" style="background:${c.color}"></span>
        <span style="font-family:var(--font-mono); font-size:.7rem; letter-spacing:.18em; text-transform:uppercase; color:var(--ink-muted)">${counts[c.nombre] || 0}</span>
      </div>
      <div>
        <h3>${c.nombre}</h3>
        <div class="count">${counts[c.nombre] || 0} productos activos</div>
      </div>
    </a>
  `).join('');
  grid.innerHTML = cells;
  grid.querySelectorAll('[data-jump-cat]').forEach(a => a.addEventListener('click', (e) => {
    e.preventDefault();
    state.filters.cat = a.dataset.jumpCat;
    document.getElementById('filter-cat').value = state.filters.cat;
    document.querySelector('[data-view="productos"]').click();
  }));
}

/* ============== MODAL ============== */
const overlay = document.getElementById('modal-overlay');
const form = document.getElementById('product-form');

function openEdit(id) {
  const p = state.productos.find(x => x.id === id);
  if (!p) return;
  document.getElementById('modal-title').textContent = 'Editar producto';
  document.getElementById('modal-sub').textContent = p.id;
  form.id.value = p.id;
  form.mode.value = 'edit';
  form.nombre.value = p.nombre || '';
  form.categoria.value = p.categoria || '';
  form.marca.value = p.marca || '';
  form.precio.value = p.precio || 0;
  form.disponible.value = p.disponible || 0;
  form.descuento.value = p.descuento || '';
  form.enOferta.checked = !!p.enOferta;
  form.precioAnterior.value = p.precioAnterior || '';
  form.img.value = p.img || '';
  form.descripcion.value = p.descripcion || '';
  form.destacado.checked = !!p.destacado;
  overlay.classList.add('is-open');
}

function openCreate() {
  document.getElementById('modal-title').textContent = 'Nuevo producto';
  document.getElementById('modal-sub').textContent = 'Se agregará al catálogo';
  form.reset();
  form.mode.value = 'create';
  form.id.value = '';
  form.disponible.value = 1;
  overlay.classList.add('is-open');
}

function closeModal() {
  overlay.classList.remove('is-open');
}

document.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', closeModal));
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = Object.fromEntries(new FormData(form).entries());
  const payload = {
    nombre: fd.nombre.trim(),
    categoria: fd.categoria,
    marca: fd.marca.trim() || 'Valkiria',
    precio: parseFloat(fd.precio) || 0,
    disponible: parseInt(fd.disponible) || 0,
    descuento: fd.descuento ? parseInt(fd.descuento) : null,
    enOferta: form.enOferta.checked,
    precioAnterior: fd.precioAnterior ? parseFloat(fd.precioAnterior) : null,
    img: fd.img.trim() || '',
    descripcion: fd.descripcion.trim() || '',
    destacado: form.destacado.checked,
    moneda: 'BOB',
  };
  payload.badge = payload.enOferta ? 'Oferta' : null;
  payload.badgeStyle = payload.enOferta ? 'accent' : null;

  if (fd.mode === 'edit') {
    editProduct(fd.id, payload);
    notify('Producto actualizado', 'success');
  } else {
    const slug = payload.nombre.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 50);
    addProduct({
      id: slug || ('producto-' + Date.now()),
      categoriaSlug: payload.categoria.toLowerCase().replace(/\s+/g, '-'),
      color: '#34466F',
      urlOriginal: '',
      ...payload,
    });
    notify('Producto agregado', 'success');
  }
  state.overrides = readOverrides();
  await refreshCatalog();
  renderCurrentView();
  closeModal();
});

function askDelete(id) {
  const p = state.productos.find(x => x.id === id);
  if (!p) return;
  if (confirm(`¿Eliminar "${p.nombre}"?\n\nEsto lo oculta del catálogo público.`)) {
    deleteProduct(id);
    state.overrides = readOverrides();
    refreshCatalog().then(() => {
      renderCurrentView();
      notify('Producto eliminado', 'success');
    });
  }
}

async function refreshCatalog() {
  state.productos = await getCatalog();
  populateSelects();
}

/* ============== TOOLBAR ============== */
function bindActions() {
  document.getElementById('search').addEventListener('input', (e) => {
    state.filters.q = e.target.value;
    renderProducts();
  });
  document.getElementById('filter-cat').addEventListener('change', (e) => { state.filters.cat = e.target.value; renderProducts(); });
  document.getElementById('filter-marca').addEventListener('change', (e) => { state.filters.marca = e.target.value; renderProducts(); });
  document.getElementById('filter-estado').addEventListener('change', (e) => { state.filters.estado = e.target.value; renderProducts(); });

  document.querySelector('[data-add-product]').addEventListener('click', openCreate);

  document.querySelectorAll('[data-action]').forEach(b => {
    b.addEventListener('click', async () => {
      const action = b.dataset.action;
      if (action === 'logout') logout();
      if (action === 'export') {
        const data = await exportFullCatalog();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `valkiria-productos-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        notify(`Exportados ${data.length} productos`, 'success');
      }
      if (action === 'reset') {
        if (confirm('Restaurar todo el catálogo a los valores originales?\n\nSe perderán todas las ediciones, agregados y eliminaciones de esta sesión.')) {
          resetOverrides();
          state.overrides = readOverrides();
          await refreshCatalog();
          renderCurrentView();
          notify('Catálogo restaurado', 'success');
        }
      }
    });
  });
}
