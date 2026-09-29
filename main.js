/* ═══════════════════════════════════════════════════════
   Aapo Mikkola Portfolio - Main JS v3
   Illustrative tissue heatmap, scroll reveals and navigation
   ═══════════════════════════════════════════════════════ */

// Illustrative tissue selection: a bounded flood fill, not model inference.
function initMagicWand() {
  const canvas = document.getElementById('bioCanvas');
  const ctx = canvas?.getContext('2d');
  if (!ctx) return;
  const hero = document.getElementById('hero');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const image = new Image();
  const background = document.createElement('canvas');
  const backgroundCtx = background.getContext('2d');
  const overlay = document.createElement('canvas');
  const overlayCtx = overlay.getContext('2d');
  const previous = document.createElement('canvas');
  const previousCtx = previous.getContext('2d');
  let pixels, luminance, threshold, gridW, gridH;
  let width = 0, height = 0, scale = 1, offsetX = 0, offsetY = 0;
  let frame = 0, lastFrame = 0, visible = true, selection = null;
  let previousAt = -Infinity, releasedAt = null;
  const GROW_MS = 3000;
  const FADE_MS = 600;
  const palette = [[35, 75, 190], [20, 175, 210], [250, 215, 75], [215, 45, 45]];
  const colors = Array.from({ length: 256 }, (_, i) => {
    const position = i / 255 * (palette.length - 1);
    const low = Math.min(palette.length - 2, Math.floor(position));
    return palette[low].map((value, c) => Math.round(value + (palette[low + 1][c] - value) * (position - low)));
  });

  function schedule() {
    if (!frame && visible && !document.hidden && image.naturalWidth) frame = requestAnimationFrame(render);
  }

  function initGrid() {
    gridW = Math.min(640, image.naturalWidth);
    gridH = Math.round(gridW * image.naturalHeight / image.naturalWidth);
    overlay.width = previous.width = gridW;
    overlay.height = previous.height = gridH;
    // Smooth the analysis mask, while preserving the sharp displayed tissue.
    overlayCtx.filter = 'blur(2px)';
    overlayCtx.drawImage(image, 0, 0, gridW, gridH);
    overlayCtx.filter = 'none';
    const data = overlayCtx.getImageData(0, 0, gridW, gridH).data;
    luminance = new Uint8Array(gridW * gridH);
    const histogram = new Uint32Array(256);
    let total = 0;
    for (let i = 0; i < luminance.length; i++) {
      const value = Math.round(data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114);
      luminance[i] = value;
      histogram[value]++;
      total += value;
    }
    let count = 0, sum = 0, best = 0;
    threshold = 128;
    for (let i = 0; i < 256; i++) {
      count += histogram[i];
      sum += histogram[i] * i;
      const remaining = luminance.length - count;
      if (!count || !remaining) continue;
      const difference = sum / count - (total - sum) / remaining;
      const variance = count * remaining * difference * difference;
      if (variance > best) { best = variance; threshold = i + 18; }
    }
    pixels = overlayCtx.createImageData(gridW, gridH);
    overlayCtx.clearRect(0, 0, gridW, gridH);
  }

  function select(event) {
    if (motion.matches || !image.naturalWidth) return;
    if (event.target.closest('a, button, .hero__content')) { release(); return; }
    if (event.type === 'pointermove' && event.pointerType === 'touch') return;
    const rect = hero.getBoundingClientRect();
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    if (selection && releasedAt === null && Math.hypot(x - selection.x, y - selection.y) < 24) return;
    if (!luminance) initGrid();
    const gx = Math.floor((x - offsetX) / scale * gridW / image.naturalWidth);
    const gy = Math.floor((y - offsetY) / scale * gridW / image.naturalWidth);
    if (gx < 0 || gy < 0 || gx >= gridW || gy >= gridH) return;
    const start = gy * gridW + gx;
    // Keep empty slide background clear; only grow through tissue.
    if (luminance[start] >= threshold) { release(); return; }
    previousCtx.clearRect(0, 0, gridW, gridH);
    previousCtx.drawImage(overlay, 0, 0);
    previousAt = performance.now();
    pixels.data.fill(0);
    const visited = new Uint8Array(luminance.length);
    const queue = [start];
    const distances = [0];
    visited[start] = 1;
    const radius = 78;
    // Circular reach and feathered edges avoid a square/diamond flood-fill outline.
    // Fixed upper bound on work and storage per pointer selection.
    for (let head = 0; head < queue.length && queue.length < 24000; head++) {
      const index = queue[head], col = index % gridW;
      const neighbors = [index - gridW, index + gridW];
      if (col > 0) neighbors.push(index - 1, index - gridW - 1, index + gridW - 1);
      if (col < gridW - 1) neighbors.push(index + 1, index - gridW + 1, index + gridW + 1);
      for (const next of neighbors) {
        if (next < 0 || next >= luminance.length || visited[next]) continue;
        visited[next] = 1;
        const distance = Math.hypot(next % gridW - gx, Math.floor(next / gridW) - gy);
        if (distance <= radius && luminance[next] < threshold && Math.abs(luminance[next] - luminance[start]) < 85) {
          queue.push(next);
          distances.push(distance);
        }
      }
    }
    selection = { x, y, queue, distances, radius, startedAt: performance.now() };
    releasedAt = null;
    schedule();
  }

  function release() {
    if (selection && releasedAt === null) { releasedAt = performance.now(); schedule(); }
  }

  function resize() {
    width = hero.clientWidth;
    height = hero.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = background.width = Math.round(width * dpr);
    canvas.height = background.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    backgroundCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!image.naturalWidth) return;
    scale = Math.max(width / image.naturalWidth, height / image.naturalHeight) * 1.25;
    offsetX = (width - image.naturalWidth * scale) / 2;
    offsetY = (height - image.naturalHeight * scale) / 2;
    const dark = document.documentElement.dataset.theme === 'dark';
    backgroundCtx.globalAlpha = dark ? 0.3 : 0.4;
    backgroundCtx.filter = dark ? 'grayscale(10%) contrast(1.2)' : 'contrast(1.1)';
    backgroundCtx.drawImage(image, offsetX, offsetY, image.naturalWidth * scale, image.naturalHeight * scale);
    schedule();
  }

  function render(now) {
    frame = 0;
    if (!visible || document.hidden) return;
    if (now - lastFrame < 1000 / 30) { schedule(); return; }
    lastFrame = now;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(background, 0, 0, width, height);
    if (!selection || motion.matches) return;
    const age = now - selection.startedAt;
    const opacity = releasedAt === null ? 1 : Math.max(0, 1 - (now - releasedAt) / FADE_MS);
    if (!opacity) { selection = null; overlayCtx.clearRect(0, 0, gridW, gridH); return; }
    const { queue, distances } = selection;
    const maxDistance = selection.radius;
    for (let i = 0; i < queue.length; i++) {
      const arrival = distances[i] / maxDistance * GROW_MS;
      const fade = Math.max(0, Math.min(1, (age - arrival) / 220));
      const heat = Math.round(255 * (1 - distances[i] / maxDistance));
      const [r, g, b] = colors[heat];
      const offset = queue[i] * 4;
      pixels.data[offset] = r;
      pixels.data[offset + 1] = g;
      pixels.data[offset + 2] = b;
      const edge = Math.max(0, Math.min(1, (1 - distances[i] / maxDistance) / 0.25));
      const feather = edge * edge * (3 - 2 * edge);
      pixels.data[offset + 3] = Math.round(135 * fade * feather);
    }
    overlayCtx.putImageData(pixels, 0, 0);
    const dw = image.naturalWidth * scale, dh = image.naturalHeight * scale;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = opacity * Math.max(0, 1 - (now - previousAt) / 250);
    if (ctx.globalAlpha > 0) ctx.drawImage(previous, offsetX, offsetY, dw, dh);
    ctx.globalAlpha = opacity;
    ctx.drawImage(overlay, offsetX, offsetY, dw, dh);
    ctx.restore();
    if (age < GROW_MS + 250 || releasedAt !== null) schedule();
  }

  hero.addEventListener('pointermove', select, { passive: true });
  hero.addEventListener('pointerdown', select, { passive: true });
  hero.addEventListener('pointerleave', release, { passive: true });
  hero.addEventListener('pointerup', event => { if (event.pointerType === 'touch') release(); }, { passive: true });
  hero.addEventListener('pointercancel', release, { passive: true });
  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) { selection = null; if (overlay.width) overlayCtx.clearRect(0, 0, overlay.width, overlay.height); }
    schedule();
  }).observe(hero);
  document.addEventListener('visibilitychange', () => { if (document.hidden) release(); else schedule(); });
  new MutationObserver(resize).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  motion.addEventListener('change', () => {
    selection = null;
    overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
    schedule();
  });
  image.onload = resize;
  image.src = '/images/wsi_big.webp';
}

// ─── Scroll Reveal ───
function initScrollReveal() {
  document.documentElement.classList.add('reveal-ready');
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;
  const observer = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        observer.unobserve(e.target);
      }
    }),
    { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
  );
  els.forEach(el => observer.observe(el));
}

// ─── Scrollspy ───
function initScrollspy() {
  const sections = document.querySelectorAll('section[id]');
  const links = document.querySelectorAll('.nav__link');
  if (!sections.length || !links.length) return;
  const onScroll = () => {
    const scrollY = window.scrollY + 90;
    let currentId = '';
    sections.forEach(s => { if (s.offsetTop <= scrollY) currentId = s.id; });
    links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${currentId}`));
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ─── Hamburger ───
function initHamburger() {
  const btn = document.querySelector('.nav__hamburger');
  const menu = document.querySelector('.nav__links');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    menu.classList.toggle('open');
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
      btn.setAttribute('aria-expanded', 'false');
      menu.classList.remove('open');
      btn.focus();
    }
  });
  document.querySelectorAll('.nav__link').forEach(l => {
    l.addEventListener('click', () => {
      btn.setAttribute('aria-expanded', 'false');
      menu.classList.remove('open');
    });
  });
}

// ─── Theme Toggle ───
function initThemeToggle() {
  const btn = document.querySelector('.nav__theme-toggle');
  if (!btn) return;
  let stored;
  try { stored = localStorage.getItem('theme'); } catch { /* Storage may be disabled. */ }
  if (stored === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  btn.setAttribute('aria-pressed', String(stored === 'dark'));
  btn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    btn.setAttribute('aria-pressed', String(!isDark));
    try { localStorage.setItem('theme', next); } catch { /* Theme still works for this visit. */ }
  });
}

function hideIfMissing(selector, value) {
  if (value) return;
  document.querySelectorAll(selector).forEach(el => {
    el.remove();
  });
}

function initClickableCards() {
  document.querySelectorAll('.card--link').forEach(card => {
    const link = card.querySelector('.card__link');
    if (!link) return;

    card.addEventListener('click', e => {
      const target = e.target.nodeType === Node.TEXT_NODE ? e.target.parentElement : e.target;
      if (target && target.closest('a, button')) return;
      window.open(link.href, link.target || '_self', 'noopener,noreferrer');
    });
  });
}

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => {
  initMagicWand();
  initScrollReveal();
  initScrollspy();
  initHamburger();
  initThemeToggle();
  initClickableCards();

  // Handwritten notebook date, auto-set to today
  const dateEl = document.querySelector('.section__date');
  if (dateEl) {
    const d = new Date();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    dateEl.textContent = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  // Inject contact links from env. Email is base64-encoded to deter scrapers.
  const emailB64 = import.meta.env.VITE_EMAIL_B64;
  if (emailB64) {
    const email = atob(emailB64);
    document.querySelectorAll('[data-email-link]').forEach(el => {
      el.href = `mailto:${email}`;
    });
  }
  hideIfMissing('[data-email-link]', emailB64);

  const telegram = import.meta.env.VITE_TELEGRAM;
  if (telegram) {
    document.querySelectorAll('[data-telegram-link]').forEach(el => {
      el.href = telegram;
    });
  }
  hideIfMissing('[data-telegram-link]', telegram);
});
