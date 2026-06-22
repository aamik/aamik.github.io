/* ═══════════════════════════════════════════════════════
   Aapo Mikkola Portfolio — Main JS v3
   Biology-themed: organic cell shapes on canvas,
   gentle mouse-proximity response, professional polish
   ═══════════════════════════════════════════════════════ */

// ─── Typewriter ───
class Typewriter {
  constructor(el, text, speed = 20) {
    this.el = el;
    this.text = text;
    this.speed = speed;
    this.i = 0;
  }
  start() {
    const tick = () => {
      if (this.i <= this.text.length) {
        this.el.textContent = this.text.slice(0, this.i++);
        setTimeout(tick, this.speed);
      }
    };
    setTimeout(tick, 900);
  }
}

// ─── Magic Wand WSI Interaction ───
// Loads the big WSI image, computes an Otsu threshold for tissue detection,
// and implements a "magic wand" style flood-fill selection on mouse hover.
function initMagicWand() {
  const canvas = document.getElementById('bioCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const hero = document.getElementById('hero');
  const img = new Image();
  img.src = '/images/wsi_big.webp';

  let width, height; // canvas dimensions
  let offCanvas, offCtx;
  let grid = []; // 2D array of { isTissue, x, y }
  let gridW, gridH;
  let scaleRatio = 1; // offscreen image / real image
  const CELL_SIZE = 12; // Size of grid cells in screen pixels (approx)
  
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
  hero.addEventListener('mousemove', e => {
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
  }, { passive: true });
  
  hero.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    dwellStart = 0;
  });

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

    while (queue.length > 0 && added < limit) {
      const [cx, cy, dist] = queue.shift();
      
      highlights.push({ c: cx, r: cy, alpha: 0.85 + Math.random() * 0.15 });
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
         
         ctx.fillStyle = 'rgba(210, 40, 60, 1)'; 
         
         for (const h of highlights) {
           const screenX = startX + h.c * finalScale;
           const screenY = startY + h.r * finalScale;
           
           ctx.globalAlpha = h.alpha * 0.35;
           ctx.fillRect(screenX, screenY, finalScale, finalScale);
           
           h.alpha *= 0.96; // Slower fade (approx 1.5s visual persistence)
         }
         ctx.globalAlpha = 1;
       }
    }
    requestAnimationFrame(render);
  }

  window.addEventListener('resize', resize);
  
  img.onload = () => {
    imgLoaded = true;
    initGrid();
    resize();
  };
  
  if (img.complete) {
    imgLoaded = true;
    initGrid();
    resize();
  } else {
    // If not cached, it might take a moment.
    // We rely on onload.
  }

  requestAnimationFrame(render);
}

// ─── Scroll Reveal ───
function initScrollReveal() {
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
  const stored = localStorage.getItem('theme');
  if (stored === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  btn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
}

function hideIfMissing(selector, value) {
  if (value) return;
  document.querySelectorAll(selector).forEach(el => {
    el.remove();
  });
}

// ─── Smooth Scroll ───
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
  });
}

function initClickableCards() {
  document.querySelectorAll('.card--link').forEach(card => {
    const link = card.querySelector('.card__link');
    if (!link) return;

    card.addEventListener('click', e => {
      if (e.target.closest('a, button')) return;
      window.open(link.href, link.target || '_self', 'noopener,noreferrer');
    });
  });
}

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => {
  const twEl = document.getElementById('typewriter');
  if (twEl) {
    new Typewriter(
      twEl,
      "Two master's degrees: one from the life science lab, one in deep learning. I build ML systems for medical imaging - and understand the biology they're reasoning about.", 
      24
    ).start();
  }

  initMagicWand();
  initScrollReveal();
  initScrollspy();
  initHamburger();
  initThemeToggle();
  initSmoothScroll();
  initClickableCards();

  // Handwritten notebook date — auto-set to today
  const dateEl = document.querySelector('.section__date');
  if (dateEl) {
    const d = new Date();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    dateEl.textContent = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  // Inject contact links from env — email is base64-encoded to deter scrapers
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
