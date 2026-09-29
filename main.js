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
  let offCanvas, offCtx;
  let grid = []; // 2D array of { isTissue, x, y }
  let gridW, gridH;

  // State
  let highlights = []; // { c, r, alpha }
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
    if (!imgLoaded) return;

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
    const threshold = computeOtsu(data);

    // Block size 1 = per-pixel analysis on the downscaled canvas
    const blockSize = 1;
    gridW = Math.ceil(w / blockSize);
    gridH = Math.ceil(h / blockSize);
    grid = new Array(gridH).fill(0).map(() => new Array(gridW));

    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        const sx = Math.min(x * blockSize, w-1);
        const sy = Math.min(y * blockSize, h-1);
        const idx = (Math.floor(sy) * w + Math.floor(sx)) * 4;
        const lum = 0.299 * data[idx] + 0.587 * data[idx+1] + 0.114 * data[idx+2];
        grid[y][x] = {
          isTissue: lum < threshold,
          lum: lum
        };
      }
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
    mouse.x = nx;
    mouse.y = ny;
    scheduleRender();
  }
  function releasePointer() {
    mouse.x = -9999;
    dwellStart = 0;
  }
  hero.addEventListener('pointermove', updatePointer, { passive: true });
  hero.addEventListener('pointerdown', updatePointer, { passive: true });
  hero.addEventListener('pointerleave', releasePointer, { passive: true });
  hero.addEventListener('pointercancel', releasePointer, { passive: true });
  hero.addEventListener('pointerup', e => { if (e.pointerType === 'touch') releasePointer(); }, { passive: true });

  function triggerFloodFill(sx, sy) {
    const startNode = grid[sy][sx];
    const targetIsTissue = startNode.isTissue;
    const visited = new Set();
    const queue = [[sx, sy, 0]];

    // Grow the radius and throughput based on dwell time
    const dwellMs = dwellStart > 0 ? performance.now() - dwellStart : 0;
    const isDwelling = dwellMs > DWELL_THRESHOLD;
    const dwellGrowth = isDwelling ? Math.min((dwellMs - DWELL_THRESHOLD) / 75, 800) : 0;
    const maxDist = 120 + Math.floor(dwellGrowth);
    const limit = 600 + Math.floor(dwellGrowth * 16);

    visited.add(`${sx},${sy}`);
    let added = 0;
    const born = performance.now();

    let head = 0;
    while (head < queue.length && added < limit) {
      const [cx, cy, dist] = queue[head++];

      highlights.push({
        c: cx, r: cy, alpha: 0.85 + Math.random() * 0.15, born,
        color: palette[Math.round(63 * (1 - Math.min(1, dist / Math.max(12, Math.sqrt(limit)))))],
      });
      added++;

      if (dist >= maxDist) continue;

      const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
      for (let [dx, dy] of dirs) {
        const nx = cx + dx, ny = cy + dy;
        if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH) {
          const key = `${nx},${ny}`;
          if (!visited.has(key)) {
            const neighbor = grid[ny][nx];
            // Condition: Same class AND similar luminance (structure aware)
            const lumDiff = Math.abs(neighbor.lum - startNode.lum);

            if (neighbor.isTissue === targetIsTissue && lumDiff < 50) {
               visited.add(key);
               // Add organic randomness to edge growth
               if (Math.random() > 0.1) {
                 queue.push([nx, ny, dist + 1]);
               }
            }
          }
        }
      }
    }
  }

  function resize() {
    width = hero.clientWidth;
    height = hero.clientHeight;
    // Set canvas resolution to match screen
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
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

    // Draw background image
    if (imgLoaded && img.naturalWidth) {
      const { scale, offsetX, offsetY } = renderParams;
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;

      ctx.save();
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      // Increased visibility as requested
      ctx.globalAlpha = isDark ? 0.3 : 0.4;
      ctx.filter = isDark
        ? 'grayscale(10%) contrast(1.2)'
        : 'contrast(1.1)'; // Removed blur for clarity

      ctx.drawImage(img, offsetX, offsetY, dw, dh);
      ctx.restore();
    }

    // Continuous Wand Trigger
    if (imgLoaded && offCanvas && mouse.x > -9000) {
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
       }
    }

    if (highlights.length > 0) {
       highlights = highlights.filter(h => h.alpha > 0.01);

       if (imgLoaded && offCanvas) {
         const analysisScale = offCanvas.width / img.naturalWidth;
         const blockSize = 1; // matches initGrid
         const finalScale = (blockSize / analysisScale) * renderParams.scale;
         const startX = renderParams.offsetX;
         const startY = renderParams.offsetY;

         const now = performance.now();

         for (const h of highlights) {
           const screenX = startX + h.c * finalScale;
           const screenY = startY + h.r * finalScale;

           const progress = Math.min(1, (now - h.born) / 160);
           const fadeIn = progress * progress * (3 - 2 * progress);
           ctx.fillStyle = h.color;
           ctx.globalAlpha = h.alpha * 0.35 * fadeIn;
           ctx.fillRect(screenX, screenY, finalScale, finalScale);

           h.alpha *= 0.96; // Slower fade (approx 1.5s visual persistence)
         }
         ctx.globalAlpha = 1;
       }
    }
    if (!motion.matches && (mouse.x > -9000 || highlights.length)) scheduleRender();
  }

  window.addEventListener('resize', () => { resize(); scheduleRender(); });
  new ResizeObserver(() => { resize(); scheduleRender(); }).observe(hero);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) { mouse.x = -9999; highlights = []; }
    scheduleRender();
  }).observe(hero);
  document.addEventListener('visibilitychange', scheduleRender);
  new MutationObserver(scheduleRender).observe(document.documentElement, {
    attributes: true, attributeFilter: ['data-theme'],
  });
  motion.addEventListener('change', () => {
    mouse.x = -9999;
    highlights = [];
    scheduleRender();
  });
  img.onload = () => {
    imgLoaded = true;
    resize();
    scheduleRender();
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
