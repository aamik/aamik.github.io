# Aapo Mikkola — Personal CV / Portfolio

Single-page portfolio site for a medical AI engineer & molecular biologist.

## Tech Stack

- **Vite** — build tool, dev server, asset optimization
- **Vanilla HTML/CSS/JS** — no frameworks, no dependencies beyond Vite
- **Google Fonts** — Inter, Spectral, JetBrains Mono, Caveat

## Architecture

```
.
├── index.html          # Single-page structure and metadata
├── style.css           # Full design system
├── main.js             # Canvas animation, typewriter, scroll reveals, theme toggle
├── public/
│   ├── images/         # Optimized assets
│   ├── robots.txt      # Crawler policy
│   └── _headers        # Host-specific header hints; not enforced by GitHub Pages
├── .github/workflows/
│   └── deploy.yml      # GitHub Pages deployment via Actions
└── .env                # Optional local contact config; never commit
```

## Key Implementations

### Visual Design
- **4-color domain system**: Teal (AI/ML), Forest Green (Biomedical), Gold (Infrastructure), Purple (Analytical)
- **Notebook texture**: Ruled lines, margin lines, H&E stain colors, handwritten dates
- **WSI canvas animation**: Interactive whole-slide image with flood-fill tissue detection
- **Shimmer divider**: Animated 4-color gradient bar between hero and content

### Performance
- **WebP hero image**: 1.6 MB vs 11 MB PNG original (quality 95, lossless-equivalent)
- **Gallery JPGs**: All resized to ≤600px, 44–128 KB each
- **Total dist: ~3.9 MB** including all images
- **Lazy loading** on all gallery images

### Accessibility
- Skip-to-content link
- `prefers-reduced-motion` respects user settings
- `:focus-visible` keyboard-only focus rings
- Semantic HTML, ARIA labels on interactive elements

### Security & Privacy
- **No backend, no cookies, no forms, no analytics**
- **Email obfuscation**: Base64-encoded in env, decoded at runtime (`atob()`)
- **Frontend env is not secret**: `VITE_*` values are embedded into the built site if used
- **Browser-enforced CSP**: Locks scripts to self, limits fonts to Google Fonts, disables plugin objects
- **Referrer policy**: `strict-origin-when-cross-origin`
- **Permissions-Policy intent**: Camera, microphone, geolocation denied via `_headers` on hosts that support it
- **robots.txt**: Blocks GPTBot, CCBot, anthropic-ai, Google-Extended

### SEO
- Open Graph + Twitter Card meta tags
- JSON-LD structured data (`Person` schema)
- Semantic heading hierarchy

## Development

```bash
npm install
npm run dev          # Local dev server
npm run dev -- --host  # Expose to LAN (mobile testing)
npm run build        # Production build → dist/
```

## Deployment

Built for **GitHub Pages** at the site root (`https://aamik.github.io/`) when deployed from the
`aamik.github.io` repository or an equivalent custom-domain Pages site.

```bash
npm run build
# Deploy dist/ via GitHub Actions
```

### Optional Build Variables
- `VITE_EMAIL_B64` — Base64-encoded email address
- `VITE_TELEGRAM` — Telegram URL

If omitted, the corresponding contact links are removed from the rendered page.

## License

© 2026 Aapo Mikkola. All rights reserved.
