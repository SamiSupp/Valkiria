/* =============================================================
   ANIMATIONS — IntersectionObserver, split text, custom cursor
   ============================================================= */

(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Scroll reveals ---------- */
  const revealEls = document.querySelectorAll('[data-reveal], [data-stagger]');
  if ('IntersectionObserver' in window && !prefersReduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-revealed'));
  }

  /* ---------- Split text en líneas (data-split) ---------- */
  document.querySelectorAll('[data-split]').forEach((el) => {
    const text = el.textContent.trim();
    el.innerHTML = '';
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      const wrap = document.createElement('span');
      wrap.className = 'split-line';
      const inner = document.createElement('span');
      inner.style.setProperty('--delay', `${i * 90}ms`);
      inner.textContent = line.trim();
      wrap.appendChild(inner);
      el.appendChild(wrap);
    });
  });

  /* ---------- Header on-scroll ---------- */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 24) header.classList.add('is-scrolled');
      else header.classList.remove('is-scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Custom cursor (desktop, sin touch) ---------- */
  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (hasFinePointer && !prefersReduced) {
    const dot = document.createElement('div');
    const ring = document.createElement('div');
    dot.className = 'cursor';
    ring.className = 'cursor-ring';
    document.body.append(dot, ring);

    let mx = 0, my = 0, rx = 0, ry = 0;
    const move = (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      dot.classList.add('is-active');
      ring.classList.add('is-active');
    };
    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    window.addEventListener('mousemove', move);
    document.addEventListener('mouseleave', () => {
      dot.classList.remove('is-active');
      ring.classList.remove('is-active');
    });
    loop();

    const hovers = 'a, button, [role="button"], input, textarea, select, .product-card, .cat-card, .brand-card';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hovers)) {
        dot.classList.add('is-hover');
        ring.classList.add('is-hover');
      }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hovers)) {
        dot.classList.remove('is-hover');
        ring.classList.remove('is-hover');
      }
    });
  }

  /* ---------- Magnetic buttons ---------- */
  document.querySelectorAll('[data-magnet]').forEach((el) => {
    if (!hasFinePointer || prefersReduced) return;
    const strength = parseFloat(el.dataset.magnet) || 0.25;
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * strength;
      const y = (e.clientY - (r.top + r.height / 2)) * strength;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });

  /* ---------- Parallax sutil para [data-parallax] ---------- */
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  if (parallaxEls.length && !prefersReduced) {
    const onScrollPx = () => {
      const sy = window.scrollY;
      parallaxEls.forEach((el) => {
        const speed = parseFloat(el.dataset.parallax) || 0.15;
        const r = el.getBoundingClientRect();
        const offset = (sy + r.top - window.innerHeight) * -speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
      });
    };
    window.addEventListener('scroll', onScrollPx, { passive: true });
    onScrollPx();
  }

  /* ---------- Counters ---------- */
  const counters = document.querySelectorAll('[data-counter]');
  if (counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.dataset.counter);
        const suffix = el.dataset.suffix || '';
        const decimals = parseInt(el.dataset.decimals || '0', 10);
        const duration = parseInt(el.dataset.duration || '1600', 10);
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          const value = (target * eased);
          el.textContent = value.toFixed(decimals) + suffix;
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        cio.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(c => cio.observe(c));
  }
})();
