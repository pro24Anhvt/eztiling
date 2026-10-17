/* EZTiling motion layer: tile curtain transitions, parallax, cursor, magnetic buttons. */
(function () {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const storage = {
    get(key) { try { return sessionStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { sessionStorage.setItem(key, value); } catch (e) {} },
    remove(key) { try { sessionStorage.removeItem(key); } catch (e) {} }
  };

  /* ---------- Tile curtain ---------- */
  const curtain = document.querySelector('[data-curtain]');
  const tiles = curtain ? Array.from(curtain.querySelectorAll('.tile-curtain-grid span')) : [];
  let maxDelay = 0;

  function setTileDelays(reverse) {
    if (!curtain) return;
    const cols = getComputedStyle(curtain.firstElementChild).gridTemplateColumns.split(' ').length || 6;
    const rows = Math.ceil(tiles.length / cols);
    maxDelay = 0;
    tiles.forEach((tile, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const step = reverse ? (cols - 1 - col) + (rows - 1 - row) : col + row;
      const delay = step * 45;
      maxDelay = Math.max(maxDelay, delay);
      tile.style.setProperty('--d', delay);
    });
  }

  function uncover() {
    if (!root.classList.contains('is-covered') || !curtain) { root.classList.remove('is-covered'); return; }
    const firstVisit = !storage.get('ez-visited');
    storage.set('ez-visited', '1');
    storage.remove('ez-transition');
    if (reduceMotion) { root.classList.remove('is-covered'); return; }
    const minWait = firstVisit ? 1150 : 120;
    const started = performance.now();
    const go = () => {
      setTileDelays(false);
      curtain.classList.add('is-active', 'is-leaving');
      root.classList.remove('is-covered');
      window.setTimeout(() => curtain.classList.remove('is-active', 'is-leaving'), 800 + maxDelay);
    };
    const ready = () => window.setTimeout(go, Math.max(0, minWait - (performance.now() - started)));
    if (document.readyState === 'complete') ready();
    else {
      window.addEventListener('load', ready, { once: true });
      window.setTimeout(() => { if (root.classList.contains('is-covered')) go(); }, 3000);
    }
  }

  function isTransitionLink(link, event) {
    if (!link || event.defaultPrevented || event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (link.target && link.target !== '_self') return false;
    if (link.hasAttribute('download') || link.dataset.noTransition !== undefined) return false;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    if (/\/wp-(admin|login)/.test(url.pathname)) return false;
    if (url.pathname === window.location.pathname && url.search === window.location.search) return false;
    return true;
  }

  if (curtain && !reduceMotion) {
    document.addEventListener('click', event => {
      const link = event.target.closest('a[href]');
      if (!isTransitionLink(link, event)) return;
      event.preventDefault();
      setTileDelays(true);
      curtain.classList.add('is-active', 'is-entering');
      void curtain.offsetWidth;
      curtain.classList.remove('is-entering');
      storage.set('ez-transition', '1');
      window.setTimeout(() => { window.location.href = link.href; }, 750 + maxDelay);
    });
    window.addEventListener('pageshow', event => {
      if (event.persisted) {
        curtain.classList.remove('is-active', 'is-entering', 'is-leaving');
        root.classList.remove('is-covered');
        storage.remove('ez-transition');
      }
    });
  }
  uncover();

  /* ---------- Reveal stagger + standalone headline reveals ---------- */
  const groups = new Map();
  document.querySelectorAll('.reveal').forEach(el => {
    const list = groups.get(el.parentElement) || [];
    list.push(el);
    groups.set(el.parentElement, list);
  });
  groups.forEach(list => list.forEach((el, i) => el.style.setProperty('--stagger', Math.min(i, 5))));
  document.querySelectorAll('[data-nav] li').forEach((li, i) => li.style.setProperty('--i', i));

  if ('IntersectionObserver' in window) {
    const lineObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); lineObserver.unobserve(entry.target); }
    }), { threshold: .2 });
    document.querySelectorAll('.split-lines').forEach(el => lineObserver.observe(el));
  } else {
    document.querySelectorAll('.split-lines').forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Count-up statistics ---------- */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduceMotion) {
    const countObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      countObserver.unobserve(entry.target);
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10) || 0;
      const start = performance.now();
      const tick = now => {
        const t = Math.min(1, (now - start) / 1600);
        el.textContent = Math.round(target * (1 - Math.pow(1 - t, 4)));
        if (t < 1) window.requestAnimationFrame(tick);
      };
      el.textContent = '0';
      window.requestAnimationFrame(tick);
    }), { threshold: .6 });
    counters.forEach(el => countObserver.observe(el));
  }

  /* ---------- Scroll: progress, header, parallax ---------- */
  const progress = document.querySelector('[data-progress]');
  const header = document.querySelector('[data-header]');
  const parallax = Array.from(document.querySelectorAll('[data-parallax]'));
  const timeline = document.querySelector('[data-timeline]');
  const steps = timeline ? Array.from(timeline.children) : [];
  let lastY = window.scrollY;
  let ticking = false;

  parallax.forEach(el => {
    const enable = () => el.classList.add('is-parallax');
    if (reduceMotion) return;
    el.addEventListener('animationend', enable, { once: true });
  });

  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);
    if (header && !document.body.classList.contains('menu-open')) {
      header.classList.toggle('is-hidden', y > lastY && y > 320);
    }
    if (!reduceMotion) {
      parallax.forEach(el => {
        if (!el.classList.contains('is-parallax')) return;
        const offset = Math.min(y, window.innerHeight * 1.2) * 0.28;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) scale(1.12)`;
      });
    }
    if (timeline) {
      const rect = timeline.getBoundingClientRect();
      const mid = window.innerHeight * 0.6;
      const fill = Math.max(0, Math.min(1, (mid - rect.top) / rect.height));
      timeline.style.setProperty('--fill', fill.toFixed(3));
      steps.forEach(step => step.classList.toggle('is-active', step.getBoundingClientRect().top + 40 < mid));
    }
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  if (reduceMotion || !finePointer) return;

  /* ---------- Cursor ---------- */
  const cursor = document.querySelector('[data-cursor]');
  const label = cursor ? cursor.querySelector('[data-cursor-label]') : null;
  if (cursor) {
    let tx = -100, ty = -100, cx = -100, cy = -100;
    const loop = () => {
      cx += (tx - cx) * 0.2;
      cy += (ty - cy) * 0.2;
      cursor.style.setProperty('--x', `${cx.toFixed(1)}px`);
      cursor.style.setProperty('--y', `${cy.toFixed(1)}px`);
      window.requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener('mousemove', event => { tx = event.clientX; ty = event.clientY; cursor.classList.remove('is-hidden'); }, { passive: true });
    document.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));
    document.addEventListener('mouseover', event => {
      const labelled = event.target.closest('[data-cursor-text]');
      const interactive = event.target.closest('a, button, input, select, textarea, label');
      if (labelled) {
        label.textContent = labelled.dataset.cursorText;
        cursor.classList.add('is-label');
        cursor.classList.remove('is-link');
      } else {
        cursor.classList.remove('is-label');
        cursor.classList.toggle('is-link', Boolean(interactive));
      }
    });
  }

  /* ---------- Magnetic buttons ---------- */
  document.querySelectorAll('[data-magnetic], .nav-quote, .service-arrow').forEach(el => {
    const target = el.classList.contains('service-arrow') ? el.closest('.service-row') : el;
    if (!target) return;
    target.addEventListener('mousemove', event => {
      const rect = el.getBoundingClientRect();
      const x = event.clientX - (rect.left + rect.width / 2);
      const y = event.clientY - (rect.top + rect.height / 2);
      const strength = el.classList.contains('service-arrow') ? 0.12 : 0.28;
      el.style.translate = `${(x * strength).toFixed(1)}px ${(y * strength).toFixed(1)}px`;
    });
    target.addEventListener('mouseleave', () => { el.style.translate = '0 0'; });
  });
})();
