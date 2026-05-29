/* =============================================================
   MAIN — Navegación móvil, año, link activo, transición page
   ============================================================= */

(() => {
  /* ---------- Drawer móvil ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const drawer = document.getElementById('nav-drawer');
  const closeBtn = document.querySelector('[data-close-drawer]');
  const openDrawer = () => { drawer?.classList.add('is-open'); document.body.style.overflow = 'hidden'; toggle?.setAttribute('aria-expanded', 'true'); };
  const closeDrawer = () => { drawer?.classList.remove('is-open'); document.body.style.overflow = ''; toggle?.setAttribute('aria-expanded', 'false'); };
  toggle?.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  drawer?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  /* ---------- Año dinámico ---------- */
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  /* ---------- Marcar link activo según ruta ---------- */
  const path = location.pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav-links a, .nav-drawer__links a').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href) return;
    const normalized = href.replace(/^\//, '').replace(/\.html$/, '');
    const cur = path.replace(/^\//, '').replace(/\.html$/, '');
    if ((normalized === '' && cur === '') || (normalized && cur.startsWith(normalized))) {
      a.setAttribute('aria-current', 'page');
    }
  });

  /* ---------- Transición al navegar ---------- */
  const overlay = document.createElement('div');
  overlay.className = 'page-transition';
  overlay.innerHTML = '<div class="page-transition__logo">VALKIRIA</div>';
  document.body.appendChild(overlay);

  // intro
  window.addEventListener('pageshow', () => {
    overlay.classList.add('is-out');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.remove('is-out');
        overlay.classList.add('is-in');
        setTimeout(() => overlay.classList.remove('is-in'), 750);
      });
    });
  });

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    const target = a.getAttribute('target');
    if (target === '_blank' || a.hasAttribute('download')) return;
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

    try {
      const url = new URL(href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;

      e.preventDefault();
      overlay.classList.remove('is-in');
      overlay.classList.add('is-out');
      setTimeout(() => { window.location.href = url.toString(); }, 650);
    } catch { /* noop */ }
  });
})();
