/* =============================================================
   CATALOG LOADER — Base JSON + overrides admin (localStorage)
   ============================================================= */

const OVERRIDE_KEY = 'valkiria.admin.overrides.v1';
const CACHE_KEY = 'valkiria.catalog.cache.v1';

let _base = null;
let _categorias = null;

/* ---------- Helpers ---------- */
export const Currency = {
  format(amount) {
    if (amount == null || isNaN(amount)) return '—';
    return 'Bs ' + Number(amount).toLocaleString('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  },
  formatShort(amount) {
    if (amount == null || isNaN(amount)) return '—';
    const n = Math.round(amount);
    return 'Bs ' + n.toLocaleString('es-BO');
  }
};

export function readOverrides() {
  try { return JSON.parse(localStorage.getItem(OVERRIDE_KEY)) || { edits:{}, added:[], deleted:[] }; }
  catch { return { edits:{}, added:[], deleted:[] }; }
}

export function writeOverrides(ov) {
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify(ov));
  // Notify other tabs/pages
  window.dispatchEvent(new CustomEvent('catalog:updated'));
}

export function resetOverrides() {
  localStorage.removeItem(OVERRIDE_KEY);
  window.dispatchEvent(new CustomEvent('catalog:updated'));
}

/* ---------- Fetch base ---------- */
async function fetchBase() {
  if (_base) return _base;
  try {
    const r = await fetch('assets/data/productos.json', { cache: 'no-store' });
    if (!r.ok) throw 0;
    _base = await r.json();
  } catch {
    // Try relative one level up (in case loaded from a subpath)
    try {
      const r = await fetch('../assets/data/productos.json', { cache: 'no-store' });
      _base = await r.json();
    } catch {
      _base = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    }
  }
  // Cache for offline
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(_base)); } catch {}
  return _base;
}

async function fetchCategorias() {
  if (_categorias) return _categorias;
  try {
    const r = await fetch('assets/data/categorias.json');
    if (r.ok) _categorias = await r.json();
  } catch {}
  if (!_categorias) _categorias = [];
  return _categorias;
}

/* ---------- Merge base + overrides ---------- */
function applyOverrides(base, ov) {
  const deleted = new Set(ov.deleted || []);
  const edits = ov.edits || {};
  const out = base
    .filter(p => !deleted.has(p.id))
    .map(p => edits[p.id] ? { ...p, ...edits[p.id] } : p);

  // Append added items (avoiding ID collisions)
  const ids = new Set(out.map(p => p.id));
  for (const a of (ov.added || [])) {
    if (!ids.has(a.id)) out.push(a);
  }
  return out;
}

/* ---------- API pública ---------- */
export async function getCatalog() {
  const base = await fetchBase();
  const ov = readOverrides();
  return applyOverrides(base, ov);
}

export async function getProduct(id) {
  const all = await getCatalog();
  return all.find(p => p.id === id);
}

export async function getCategories() {
  return await fetchCategorias();
}

export async function getBaseProduct(id) {
  const base = await fetchBase();
  return base.find(p => p.id === id);
}

/* ---------- Admin mutations ---------- */
export function editProduct(id, partial) {
  const ov = readOverrides();
  ov.edits = ov.edits || {};
  ov.edits[id] = { ...(ov.edits[id] || {}), ...partial };
  writeOverrides(ov);
}

export function deleteProduct(id) {
  const ov = readOverrides();
  ov.deleted = ov.deleted || [];
  if (!ov.deleted.includes(id)) ov.deleted.push(id);
  // Remove from added if present
  if (ov.added) ov.added = ov.added.filter(p => p.id !== id);
  writeOverrides(ov);
}

export function addProduct(product) {
  const ov = readOverrides();
  ov.added = ov.added || [];
  // Ensure unique id
  let pid = product.id;
  let n = 1;
  const all = new Set([
    ...(ov.added.map(p => p.id)),
    ...((_base || []).map(p => p.id))
  ]);
  while (all.has(pid)) {
    n++;
    pid = `${product.id}-${n}`;
  }
  ov.added.push({ ...product, id: pid });
  writeOverrides(ov);
  return pid;
}

export function restoreProduct(id) {
  const ov = readOverrides();
  if (ov.edits) delete ov.edits[id];
  if (ov.deleted) ov.deleted = ov.deleted.filter(x => x !== id);
  writeOverrides(ov);
}

export function exportOverrides() {
  return readOverrides();
}

export async function exportFullCatalog() {
  return await getCatalog();
}
