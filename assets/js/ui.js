/* =============================================================
   UI helpers — Imágenes con fallback robusto, íconos categoría
   ============================================================= */

const CATEGORY_ICONS = {
  'Ciclocomputadores':  `<circle cx="50" cy="50" r="30"/><circle cx="50" cy="50" r="14"/><path d="M50 30v6M50 64v6M30 50h6M64 50h6"/>`,
  'Infladores':         `<rect x="40" y="20" width="20" height="50" rx="3"/><path d="M50 70v15M40 85h20M44 35h12M44 45h12"/>`,
  'Aros':               `<circle cx="50" cy="50" r="32"/><circle cx="50" cy="50" r="22"/><path d="M50 18l0 64M18 50l64 0M28 28l44 44M28 72l44-44"/>`,
  'Horquilla':          `<path d="M50 18v25l-12 30M50 43l12 30M50 18l-3 -3M50 18l3 -3"/><circle cx="38" cy="78" r="6"/><circle cx="62" cy="78" r="6"/>`,
  'Linternas':          `<rect x="32" y="38" width="36" height="22" rx="3"/><path d="M68 49h14M50 22l0 12M65 30l-10 8M35 30l10 8"/>`,
  'Tubeles':            `<circle cx="50" cy="50" r="30" stroke-dasharray="3 3"/><circle cx="50" cy="50" r="20"/>`,
  'Cascos':             `<path d="M20 60c0-20 14-32 30-32s30 12 30 32v10H20z"/><path d="M30 55v-12M50 55v-22M70 55v-12"/>`,
  'Indumentaria':       `<path d="M35 22l-8 8-12 4 3 26 4 38h36l4-38 3-26-12-4-8-8M35 22l15 6 15-6"/>`,
  'Cubierta/Neumático': `<circle cx="50" cy="50" r="35"/><circle cx="50" cy="50" r="22"/><path d="M50 15v8M50 77v8M15 50h8M77 50h8M27 27l5 5M68 68l5 5M27 73l5-5M68 32l5-5"/>`,
  'Lubricantes':        `<path d="M40 18h20l2 8h6v50h-36v-50h6z"/><path d="M44 40h12v8h-12z"/>`,
  'Pedales/Calas':      `<rect x="20" y="36" width="60" height="28" rx="4"/><path d="M20 50h60M30 36v28M70 36v28"/>`,
  'Herramientas':       `<path d="M35 65l-15 15 5 5 15-15M30 60l25-25M55 35l-5-5 15-15 10 10-15 15z"/>`,
  'Manillar/Stem/Puños':`<path d="M15 50h70M22 38v24M78 38v24M30 44h8v12h-8zM62 44h8v12h-8z"/>`,
  'Cadena/Piñón':       `<circle cx="50" cy="50" r="30"/><circle cx="50" cy="50" r="10"/><g><circle cx="50" cy="20" r="4"/><circle cx="80" cy="50" r="4"/><circle cx="50" cy="80" r="4"/><circle cx="20" cy="50" r="4"/></g>`,
  'Shifter/Desviador':  `<rect x="20" y="35" width="35" height="20" rx="3"/><path d="M55 45l25-12v24z"/>`,
  'Tija/Sillín':        `<path d="M50 18v40M28 60c0 5 10 8 22 8s22-3 22-8c0-3-10-5-22-5s-22 2-22 5z"/>`,
  'Freno/Pastilla/Disco':`<circle cx="50" cy="50" r="32"/><circle cx="50" cy="50" r="10"/><g stroke-width="2"><line x1="50" y1="22" x2="50" y2="30"/><line x1="50" y1="70" x2="50" y2="78"/><line x1="22" y1="50" x2="30" y2="50"/><line x1="70" y1="50" x2="78" y2="50"/></g>`,
  'Accesorios':         `<rect x="22" y="22" width="56" height="56" rx="6"/><path d="M35 38l30 24M65 38l-30 24"/>`,
  'Nutrición':          `<path d="M35 18h30v15h-30zM40 33h20v50h-20z"/><path d="M44 45h12v6h-12zM44 60h12v6h-12z"/>`,
  'Biela/Platos':       `<circle cx="50" cy="50" r="22"/><path d="M50 28l25 12M50 28l-25 12M50 72l25-12M50 72l-25-12"/>`,
  'Grupos Completos':   `<circle cx="35" cy="55" r="18"/><circle cx="65" cy="55" r="18"/><path d="M35 55l15-25 15 25M42 40h18"/>`,
  'Gafas/Lentes':       `<circle cx="32" cy="55" r="12"/><circle cx="68" cy="55" r="12"/><path d="M44 50h12M20 50l-6-4M80 50l6-4"/>`,
  'Botellones':         `<path d="M40 18l-4 10v50c0 3 3 6 14 6s14-3 14-6v-50l-4-10M40 18h20"/><path d="M36 35h28"/>`,
  'Portabotellón/Accesorios':`<path d="M30 25v50c0 5 8 8 20 8s20-3 20-8v-50M30 25c0-3 8-5 20-5s20 2 20 5"/>`,
  'Bicicletas':         `<circle cx="25" cy="65" r="18"/><circle cx="75" cy="65" r="18"/><path d="M25 65L50 30l25 35M40 50h22M50 30l8 0"/>`,
  'Estuches':           `<rect x="18" y="32" width="64" height="40" rx="4"/><path d="M18 45h64M40 32v-8h20v8"/>`,
  'Soportes y Parqueos':`<path d="M20 80h60M30 80v-30l20-20 20 20v30M40 80v-20h20v20"/>`,
  'Others':             `<circle cx="50" cy="50" r="25"/><path d="M40 42c2-6 10-6 12 0 1 4-6 6-6 12M50 64v.5"/>`,
};

const DEFAULT_ICON = `<circle cx="25" cy="65" r="15"/><circle cx="75" cy="65" r="15"/><path d="M25 65L50 35l25 30M40 52h22"/>`;

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/* Devuelve markup HTML para una "imagen" de producto con fallback automático.
   - Si hay URL: <img> que ante onerror se reemplaza por placeholder SVG categorizado.
   - Si no hay URL: directamente placeholder. */
export function productImage(product, opts = {}) {
  const size = opts.size || 'full';            // full | thumb
  const cat  = product.categoria || 'Others';
  const color = product.color || '#34466F';
  const iconPath = CATEGORY_ICONS[cat] || DEFAULT_ICON;
  const iconSize = size === 'thumb' ? 24 : 64;

  const placeholderInner = `
    <div class="img-placeholder" style="--ph-color:${color}">
      <svg viewBox="0 0 100 100" width="${iconSize}" height="${iconSize}" fill="none" stroke="rgba(255,255,255,.72)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${iconPath}
      </svg>
      ${size === 'full' ? `<span class="img-placeholder__label">${cat}</span>` : ''}
    </div>`;

  if (!product.img) return placeholderInner;

  // Usa data-attr para que el onerror sustituya por placeholder
  const phEncoded = encodeURIComponent(placeholderInner);
  return `<img class="product-img" loading="lazy" src="${escapeAttr(product.img)}" alt="${escapeAttr(product.nombre)}"
    onerror="this.outerHTML=decodeURIComponent('${phEncoded}')">`;
}

/* Wrap manual: para casos donde el HTML es preconstruido y no usa productImage. */
export function placeholderSVG(categoria, color = '#34466F', size = 'full') {
  const cat = categoria || 'Others';
  const iconPath = CATEGORY_ICONS[cat] || DEFAULT_ICON;
  const iconSize = size === 'thumb' ? 24 : 64;
  return `
    <div class="img-placeholder" style="--ph-color:${color}">
      <svg viewBox="0 0 100 100" width="${iconSize}" height="${iconSize}" fill="none" stroke="rgba(255,255,255,.72)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${iconPath}
      </svg>
      ${size === 'full' ? `<span class="img-placeholder__label">${cat}</span>` : ''}
    </div>`;
}

/* Promueve la URL de https://maps.app.goo.gl/... corta a embed. Como las URLs
   cortas requieren resolución, dejamos un link clickeable y un embed genérico
   apuntando a la dirección textual. */
export const TIENDA = {
  nombre: 'Valkiria Bikes',
  ciudad: 'Cochabamba',
  pais: 'Bolivia',
  direccion: 'Calle Potosí N° 1779, Entre Ciclovía y Juan Capriles, Acera Oeste',
  telefono: '+591 7 7741 0154',
  whatsapp: '59177410154',
  horario: 'Lun–Sáb: 9:00 a 20:00',
  mapsUrl: 'https://maps.app.goo.gl/vdd24m9f89wUxiL46',
  mapsEmbed: 'https://www.google.com/maps?q=Calle%20Potos%C3%AD%201779%2C%20Cochabamba%2C%20Bolivia&output=embed',
};
