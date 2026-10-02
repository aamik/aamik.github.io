/* ═══════════════════════════════════════════════════════
   Aapo Mikkola Portfolio - Main JS v3
   Illustrative tissue heatmap, scroll reveals and navigation
   ═══════════════════════════════════════════════════════ */

// ─── Magic Wand WSI Interaction ───
// Loads the big WSI image, computes an Otsu threshold for tissue detection,
// and implements a "magic wand" style flood-fill selection on mouse hover.
function initMagicWand() {
  const canvas = document.getElementById('bioCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const hero = document.getElementById('hero');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Colour and opacity affect presentation only; the original tissue mask stays intact.
  const stops = [[35, 75, 190], [20, 175, 210], [250, 215, 75], [215, 45, 45]];
  const palette = Array.from({ length: 64 }, (_, i) => {
    const position = i / 63 * 3;
    const low = Math.min(2, Math.floor(position));
    const rgb = stops[low].map((value, c) => Math.round(value + (stops[low + 1][c] - value) * (position - low)));
    return `rgb(${rgb.join(',')})`;
  });
  let frame = 0;
  let visible = true;
  function scheduleRender() {
    if (!frame && visible && !document.hidden && imgLoaded) frame = requestAnimationFrame(render);
  }
  const img = new Image();

  let width, height; // canvas dimensions
  let sizeKey = '';
  let offCanvas, offCtx;
  let grid; // Exact luminance values; tissue classification uses the same threshold.
  let threshold, visited, visitGeneration = 0;
  // Enough space for four neighbors per cell at the maximum 14,000-cell touch fill.
  const queue = new Int32Array(60001);
  const distances = new Uint16Array(60001);
  const background = document.createElement('canvas');
  let backgroundDirty = true;
  let lastFill = -Infinity;
  let touchUntil = 0;
  let touchActive = false;
  let gridW, gridH;

  // State
  let highlights = new Map(); // One fading highlight per analysis pixel.
  let mouse = { x: -9999, y: -9999 };
  let imgLoaded = false;
  let renderParams = { scale: 1, offsetX: 0, offsetY: 0 };

  // Dwell tracking: grow effect after 1s of staying still
  let dwellStart = 0;
  let dwellPos = { x: -9999, y: -9999 };
  const DWELL_THRESHOLD = 1000; // ms before growth kicks in
  const DWELL_MOVE_TOLERANCE = 30; // px

  // 1. Otsu Thresholding
  function computeOtsu(data) {
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      histogram[lum]++;
    }
    const total = data.length / 4;
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * histogram[i];
    let sumB = 0, wB = 0, wF = 0;
    let maxVar = 0, threshold = 0;
    for (let i = 0; i < 256; i++) {
      wB += histogram[i];
      if (wB === 0) continue;
      wF = total - wB;
      if (wF === 0) break;
      sumB += i * histogram[i];
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;
      const varBetween = wB * wF * (mB - mF) * (mB - mF);
      if (varBetween > maxVar) {
        maxVar = varBetween;
        threshold = i;
      }
    }
    // Bias threshold higher to capture more dark areas/stroma as tissue
    return threshold + 8;
  }

  // 2. Init Analysis Grid
  function initGrid() {
    if (!imgLoaded || offCanvas || motion.matches) return;

    // Ultra-high res analysis (1400px wide)
    const analysisScale = Math.min(1, 1400 / img.naturalWidth);
    const w = Math.floor(img.naturalWidth * analysisScale);
    const h = Math.floor(img.naturalHeight * analysisScale);

    offCanvas = document.createElement('canvas');
    offCanvas.width = w;
    offCanvas.height = h;
    offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    offCtx.drawImage(img, 0, 0, w, h);

    const imageData = offCtx.getImageData(0, 0, w, h);
    const data = imageData.data;
    threshold = computeOtsu(data);

    gridW = w;
    gridH = h;
    grid = new Float64Array(w * h);
    visited = new Uint32Array(w * h);
    for (let i = 0; i < grid.length; i++) {
      const idx = i * 4;
      grid[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    }
  }

  // Mouse interactivity
  function updatePointer(e) {
    if (!imgLoaded || motion.matches) return;
    if (e.type === 'pointermove' && e.pointerType === 'touch') return;
    if (!offCanvas) initGrid();
    const rect = hero.getBoundingClientRect();
    const nx = e.clientX - rect.left;
    const ny = e.clientY - rect.top;
    const dx = nx - dwellPos.x;
    const dy = ny - dwellPos.y;
    if (Math.sqrt(dx*dx + dy*dy) > DWELL_MOVE_TOLERANCE) {
      dwellStart = performance.now();
      dwellPos = { x: nx, y: ny };
    }
    touchActive = e.pointerType === 'touch';
    touchUntil = touchActive ? performance.now() + 1200 : 0;
    mouse.x = nx;
    mouse.y = ny;
    scheduleRender();
  }
  function releasePointer() {
    mouse.x = -9999;
    dwellStart = 0;
    touchUntil = 0;
    touchActive = false;
  }
  hero.addEventListener('pointermove', updatePointer, { passive: true });
  hero.addEventListener('pointerdown', updatePointer, { passive: true });
  hero.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch') releasePointer(); }, { passive: true });
  hero.addEventListener('pointercancel', releasePointer, { passive: true });
  hero.addEventListener('pointerup', e => {
    if (e.pointerType === 'touch') { touchUntil = performance.now() + 1200; scheduleRender(); }
  }, { passive: true });

  function triggerFloodFill(sx, sy) {
    const startLum = grid[sy * gridW + sx];
    const targetIsTissue = startLum < threshold;
    if (++visitGeneration === 0xffffffff) { visited.fill(0); visitGeneration = 1; }
    const dwellMs = dwellStart > 0 ? performance.now() - dwellStart : 0;
    const dwellGrowth = dwellMs > DWELL_THRESHOLD ? Math.min((dwellMs - DWELL_THRESHOLD) / 75, 800) : 0;
    const maxDist = 120 + Math.floor(dwellGrowth);
    const limit = (touchActive ? 1200 : 600) + Math.floor(dwellGrowth * 16);
    const born = performance.now();
    let head = 0, tail = 1, added = 0;
    queue[0] = sy * gridW + sx;
    distances[0] = 0;
    visited[queue[0]] = visitGeneration;
    while (head < tail && added < limit) {
      const id = queue[head];
      const dist = distances[head++];
      const cx = id % gridW, cy = Math.floor(id / gridW);
      const alpha = 0.85 + Math.random() * 0.15;
      const previous = highlights.get(id);
      highlights.set(id, {
        c: cx, r: cy, alpha, born: previous ? previous.born : born, refreshed: born,
        color: palette[Math.round(63 * (1 - Math.min(1, dist / Math.max(12, Math.sqrt(limit)))))],
      });
      added++;
      if (dist >= maxDist) continue;
      // Preserve right/left/down/up order and the original stochastic edge growth.
      for (let direction = 0; direction < 4; direction++) {
        const nx = cx + (direction === 0 ? 1 : direction === 1 ? -1 : 0);
        const ny = cy + (direction === 2 ? 1 : direction === 3 ? -1 : 0);
        if (nx < 0 || nx >= gridW || ny < 0 || ny >= gridH) continue;
        const next = ny * gridW + nx;
        if (visited[next] === visitGeneration) continue;
        const lum = grid[next];
        if ((lum < threshold) === targetIsTissue && Math.abs(lum - startLum) < 50) {
          visited[next] = visitGeneration;
          if (Math.random() > 0.1) {
            queue[tail] = next;
            distances[tail++] = dist + 1;
          }
        }
      }
    }
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const nextSizeKey = `${hero.clientWidth}:${hero.clientHeight}:${dpr}:${img.naturalWidth}`;
    if (nextSizeKey === sizeKey) return;
    sizeKey = nextSizeKey;
    backgroundDirty = true;
    width = hero.clientWidth;
    height = hero.clientHeight;
    // Set canvas resolution to match screen
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Calculate cover parameters with ZOOM
    const ZOOM = 1.25;
    if (img.naturalWidth) {
      const heroAspect = width / height;
      const imgAspect = img.naturalWidth / img.naturalHeight;
      let scale, offsetX, offsetY;

      if (heroAspect > imgAspect) {
        scale = (width / img.naturalWidth) * ZOOM;
        offsetX = (width - img.naturalWidth * scale) / 2;
        offsetY = (height - img.naturalHeight * scale) / 2;
      } else {
        scale = (height / img.naturalHeight) * ZOOM;
        offsetX = (width - img.naturalWidth * scale) / 2;
        offsetY = (height - img.naturalHeight * scale) / 2;
      }
      renderParams = { scale, offsetX, offsetY };
    }
  }

  function render() {
    frame = 0;
    ctx.clearRect(0, 0, width, height);

    // Filter the static image only on resize/theme changes, not every animation frame.
    if (backgroundDirty && imgLoaded && img.naturalWidth) {
      background.width = canvas.width;
      background.height = canvas.height;
      const base = background.getContext('2d');
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      base.setTransform(dpr, 0, 0, dpr, 0, 0);
      const { scale, offsetX, offsetY } = renderParams;
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      base.globalAlpha = isDark ? 0.3 : 0.4;
      base.filter = isDark ? 'grayscale(10%) contrast(1.2)' : 'contrast(1.1)';
      base.drawImage(img, offsetX, offsetY, img.naturalWidth * scale, img.naturalHeight * scale);
      backgroundDirty = false;
    }
    ctx.drawImage(background, 0, 0, width, height);
    const now = performance.now();
    if (touchActive && now > touchUntil) releasePointer();

    // Continuous Wand Trigger
    if (imgLoaded && offCanvas && mouse.x > -9000 && now - lastFill >= 50) {
       const { scale, offsetX, offsetY } = renderParams;
       const imgX = (mouse.x - offsetX) / scale;
       const imgY = (mouse.y - offsetY) / scale;
       const analysisScale = offCanvas.width / img.naturalWidth;
       const anaX = imgX * analysisScale;
       const anaY = imgY * analysisScale;
       const blockSize = 1;
       const gx = Math.floor(anaX / blockSize);
       const gy = Math.floor(anaY / blockSize);

       if (gx >= 0 && gx < gridW && gy >= 0 && gy < gridH) {
         triggerFloodFill(gx, gy);
         lastFill = now;
       }
    }

    if (highlights.size > 0) {

       if (imgLoaded && offCanvas) {
         const analysisScale = offCanvas.width / img.naturalWidth;
         const blockSize = 1; // matches initGrid
         const finalScale = (blockSize / analysisScale) * renderParams.scale;
         const startX = renderParams.offsetX;
         const startY = renderParams.offsetY;

         for (const [id, h] of highlights) {
           const age = now - h.refreshed;
           const decay = Math.pow(0.96, age / (1000 / 60));
           if (decay < 0.01) { highlights.delete(id); continue; }
           const screenX = startX + h.c * finalScale;
           const screenY = startY + h.r * finalScale;

           const progress = Math.min(1, (now - h.born) / 160);
           const fadeIn = progress * progress * (3 - 2 * progress);
           ctx.fillStyle = h.color;
           ctx.globalAlpha = h.alpha * 0.95 * fadeIn * decay;
           ctx.fillRect(screenX, screenY, finalScale, finalScale);

         }
         ctx.globalAlpha = 1;
       }
    }
    if (!motion.matches && (mouse.x > -9000 || highlights.size)) scheduleRender();
  }

  window.addEventListener('resize', () => { resize(); scheduleRender(); });
  new ResizeObserver(() => { resize(); scheduleRender(); }).observe(hero);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) { mouse.x = -9999; highlights.clear(); }
    scheduleRender();
  }).observe(hero);
  document.addEventListener('visibilitychange', scheduleRender);
  new MutationObserver(() => { backgroundDirty = true; scheduleRender(); }).observe(document.documentElement, {
    attributes: true, attributeFilter: ['data-theme'],
  });
  motion.addEventListener('change', () => {
    mouse.x = -9999;
    highlights.clear();
    scheduleRender();
  });
  img.onload = () => {
    imgLoaded = true;
    resize();
    scheduleRender();
    if ('requestIdleCallback' in window) requestIdleCallback(initGrid, { timeout: 2000 });
    else setTimeout(initGrid, 200);
  };
  img.src = '/images/wsi_big.webp';
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
  let pending = false;
  let activeId = null;
  const onScroll = () => {
    pending = false;
    const scrollY = window.scrollY + 90;
    let currentId = '';
    // Read all positions before updating classes, and write only when selection changes.
    sections.forEach(s => { if (s.offsetTop <= scrollY) currentId = s.id; });
    if (currentId === activeId) return;
    activeId = currentId;
    links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${currentId}`));
  };
  window.addEventListener('scroll', () => {
    if (!pending) { pending = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  requestAnimationFrame(onScroll);
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
