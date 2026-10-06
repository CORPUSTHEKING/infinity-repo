#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

mkdir -p assets/css

cat <<'EOF_CSS' > assets/css/tokens.css
:root {
  color-scheme: dark;

  --bg: #06101c;
  --bg2: #0b1728;
  --card: rgba(11, 22, 39, 0.78);
  --line: rgba(255, 255, 255, 0.09);
  --text: #eef4ff;
  --muted: #a9b7d0;
  --soft: #d6dff0;
  --accent: #c9a227;
  --accent2: #8fd3ff;
  --good: #65d6a7;
  --shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
  --radius: 24px;
  --max: 1180px;

  --header-height: 72px;
  --dock-height: 72px;
  --content-gap: clamp(18px, 3vw, 32px);
  --section-gap: clamp(28px, 5vw, 52px);
  --page-bottom-space: 7.75rem;
  --sidebar-width: min(86vw, 340px);
  --sidebar-bg: rgba(5, 12, 21, 0.97);
  --sidebar-border: rgba(255, 255, 255, 0.08);
  --sidebar-overlay: rgba(0, 0, 0, 0.52);

  /* Compatibility aliases for existing Infinity components/pages. */
  --bg-2: var(--bg2);
  --panel: var(--card);
  --panel-strong: rgba(18, 32, 55, 0.94);
  --accent-2: var(--accent2);
  --accent-3: var(--accent2);
}
EOF_CSS

cat <<'EOF_CSS' > assets/css/base.css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  min-height: 100%;
  scroll-behavior: smooth;
  background: var(--bg);
}

body {
  min-height: 100%;
  margin: 0;
  color: var(--text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.6;
  background:
    radial-gradient(circle at top left, rgba(201, 162, 39, 0.12), transparent 26%),
    radial-gradient(circle at top right, rgba(143, 211, 255, 0.12), transparent 24%),
    linear-gradient(180deg, #050b14 0%, var(--bg) 35%, #09111d 100%);
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

body.sidebar-open {
  overflow: hidden;
}

a {
  color: inherit;
  text-decoration: none;
}

a:focus-visible,
button:focus-visible,
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: 2px solid rgba(143, 211, 255, 0.8);
  outline-offset: 3px;
}

button,
input,
textarea,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

button,
input,
textarea,
select {
  color: var(--text);
}

img,
svg,
video {
  max-width: 100%;
}

img,
video {
  display: block;
}

#app {
  min-height: 100vh;
}

::selection {
  background: rgba(201, 162, 39, 0.28);
  color: #fff;
}
EOF_CSS

cat <<'EOF_CSS' > assets/css/text.css
body {
  font-size: 16px;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  color: var(--text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.025em;
}

h1 {
  font-size: clamp(2.2rem, 6vw, 4.6rem);
  margin: 0 0 14px;
}

h2 {
  font-size: clamp(1.45rem, 3vw, 2rem);
  margin: 0 0 10px;
}

h3 {
  font-size: 1.16rem;
  margin: 0 0 8px;
}

h4,
h5,
h6 {
  font-size: 1rem;
  margin: 0 0 8px;
}

p {
  margin: 0 0 1rem;
}

strong {
  color: #fff;
  font-weight: 800;
}

small,
.inf-mini,
.inf-card-author,
.inf-card-meta {
  color: var(--muted);
}

.inf-eyebrow,
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #d8e4f9;
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.inf-eyebrow .dot,
.eyebrow .dot {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  border-radius: 999px;
  background: var(--good);
  box-shadow: 0 0 0 6px rgba(101, 214, 167, 0.13);
}
EOF_CSS

cat <<'EOF_CSS' > assets/css/layout.css
.inf-shell {
  width: min(calc(100% - 32px), var(--max));
  min-height: 100vh;
  margin: 0 auto;
  padding-top: calc(var(--header-height) + 18px);
  padding-bottom: var(--page-bottom-space);
}

.inf-main {
  width: 100%;
  max-width: var(--max);
  margin: 0 auto;
}

.inf-page {
  display: grid;
  gap: var(--content-gap);
  width: 100%;
  margin: 0 0 var(--section-gap);
}

.inf-section {
  width: 100%;
  margin: 0;
  padding: 18px 0;
}

.inf-panel,
.inf-card-shell,
.inf-search-card,
.inf-stat-card,
.inf-tile,
.inf-result,
.inf-download-item {
  border: 1px solid var(--line);
  background: linear-gradient(180deg, rgba(18, 32, 55, 0.84), rgba(7, 16, 29, 0.9));
  box-shadow: var(--shadow);
  border-radius: var(--radius);
  overflow: hidden;
}

.inf-panel {
  padding: 28px;
}

.inf-section-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.inf-section-head h2 {
  margin: 0;
}

.inf-section-head p {
  max-width: 70ch;
  margin: 0;
  color: var(--muted);
}

.inf-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.inf-card {
  padding: 20px;
  background: linear-gradient(180deg, rgba(18, 32, 55, 0.84), rgba(7, 16, 29, 0.9));
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
}

.inf-card:hover {
  transform: translateY(-2px);
  border-color: rgba(201, 162, 39, 0.35);
  background: linear-gradient(180deg, rgba(19, 36, 61, 0.94), rgba(7, 16, 29, 0.94));
}

.inf-card-top {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.inf-name,
.inf-card-title {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 800;
}

.inf-role {
  margin: 4px 0 0;
  color: var(--soft);
  font-size: 0.95rem;
}

.inf-avatar {
  width: 56px;
  height: 56px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(201, 162, 39, 0.95), rgba(143, 211, 255, 0.9));
  color: #07111f;
  font-weight: 900;
}

.inf-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.inf-pill {
  padding: 6px 10px;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 999px;
  background: rgba(255,255,255,0.05);
  color: var(--soft);
  font-size: 0.82rem;
}

.inf-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 4px;
}

.inf-btn,
.inf-btn-primary,
.inf-btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 11px 14px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.92rem;
  border: 1px solid transparent;
  transition: transform 180ms ease, opacity 180ms ease, border-color 180ms ease, background 180ms ease;
}

.inf-btn-primary {
  background: linear-gradient(135deg, #d2b45c, #b78c16);
  color: #08111c;
}

.inf-btn-secondary,
.inf-btn {
  background: rgba(255,255,255,0.04);
  color: var(--text);
  border-color: rgba(255,255,255,0.08);
}

.inf-btn:hover,
.inf-btn-primary:hover,
.inf-btn-secondary:hover {
  transform: translateY(-1px);
}

.inf-empty,
.inf-loading,
.inf-error {
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: rgba(255,255,255,0.04);
  color: var(--soft);
}

.inf-footer-cta {
  margin: 24px 0 56px;
  padding: 28px;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 28px;
  background:
    linear-gradient(135deg, rgba(201, 162, 39, 0.16), rgba(143, 211, 255, 0.1)),
    linear-gradient(180deg, rgba(15, 30, 52, 0.96), rgba(7, 15, 26, 0.96));
  box-shadow: var(--shadow);
  text-align: center;
}

.inf-footer-cta h2 {
  margin: 0 0 10px;
}

.inf-footer-cta p {
  max-width: 70ch;
  margin: 0 auto 18px;
  color: var(--soft);
}

@media (max-width: 980px) {
  .inf-grid {
    grid-template-columns: 1fr;
  }

  .inf-section-head {
    align-items: start;
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .inf-shell {
    width: min(calc(100% - 20px), var(--max));
    padding-top: calc(var(--header-height) + 12px);
  }

  .inf-panel,
  .inf-card,
  .inf-footer-cta {
    padding: 18px;
  }
}
EOF_CSS

cat <<'EOF_CSS' > assets/css/topbar.css
.inf-brandbar {
  position: fixed;
  top: 12px;
  left: 50%;
  width: min(calc(100% - 32px), var(--max));
  min-height: var(--header-height);
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 12px;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 22px;
  background: rgba(4, 10, 19, 0.76);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  box-shadow: 0 18px 44px rgba(0,0,0,0.26);
}

.inf-logo-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 0;
}

.inf-symbol {
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(201, 162, 39, 0.95), rgba(143, 211, 255, 0.9));
  color: #07111f;
  font-size: 1.75rem;
  font-weight: 900;
  line-height: 1;
}

.inf-brand-name {
  min-width: 0;
  color: var(--text);
  font-size: 0.98rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.inf-menu-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 15px;
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 999px;
  background: rgba(255,255,255,0.04);
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: lowercase;
  transition: background 180ms ease, border-color 180ms ease, transform 180ms ease;
}

.inf-menu-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(201,162,39,0.35);
  background: rgba(201,162,39,0.08);
}

@media (max-width: 640px) {
  .inf-brandbar {
    top: 8px;
    width: min(calc(100% - 20px), var(--max));
    min-height: 60px;
    border-radius: 20px;
  }

  .inf-brand-name {
    display: none;
  }
}
EOF_CSS

cat <<'EOF_CSS' > assets/css/hero.css
.inf-hero {
  width: 100%;
  margin: 0 0 var(--section-gap);
}

.inf-hero-panoramic {
  --hero-height: clamp(260px, 32vw, 430px);
  position: relative;
  width: 100%;
  height: var(--hero-height);
  overflow: hidden;
  isolation: isolate;
  border: 1px solid var(--line);
  border-radius: 30px;
  background: #070b12;
  box-shadow: var(--shadow);
  contain: layout paint;
}

.inf-hero-layer {
  position: absolute;
  inset: -6% -18%;
  background-repeat: repeat-x;
  background-position: 0 50%;
  background-size: auto 112%;
  pointer-events: none;
  backface-visibility: hidden;
  transform: translateZ(0);
}

.inf-hero-layer-back {
  background-image: url('../img/panoramic-bg.jpg');
  opacity: 0.95;
  filter: saturate(1.02) contrast(1.03);
  z-index: 1;
}

.inf-hero-layer-mid {
  background-image: url('../img/panoramic-bg.jpg');
  opacity: 0.28;
  filter: blur(0.8px) saturate(1.08);
  mix-blend-mode: screen;
  z-index: 2;
}

.inf-hero-layer-front {
  background-image: url('../img/panoramic-bg.jpg');
  opacity: 0.45;
  filter: brightness(1.06) saturate(1.08);
  z-index: 3;
}

.inf-hero-vignette {
  position: absolute;
  inset: 0;
  z-index: 4;
  background:
    linear-gradient(to right, rgba(7, 11, 18, 1) 0%, rgba(7, 11, 18, 0.28) 15%, rgba(7, 11, 18, 0.28) 85%, rgba(7, 11, 18, 1) 100%),
    linear-gradient(180deg, rgba(5,11,20,0.2), rgba(5,11,20,0.58));
  pointer-events: none;
}

.inf-hero-panoramic .pan-text-floating {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 10%;
  z-index: 5;
  max-width: 72ch;
  margin: 0 auto;
  padding: 0 20px;
  color: var(--accent2);
  text-align: center;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  text-shadow: 0 0 12px rgba(0,0,0,0.85);
  pointer-events: none;
}

.inf-hero-panoramic .pan-text-floating small {
  display: block;
  margin-top: 8px;
  color: var(--soft);
  opacity: 0.78;
}

.inf-hero-main {
  position: relative;
  overflow: hidden;
  padding: 34px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background:
    radial-gradient(circle at 15% 15%, rgba(201, 162, 39, 0.17), transparent 24%),
    radial-gradient(circle at 82% 12%, rgba(143, 211, 255, 0.16), transparent 18%),
    linear-gradient(135deg, rgba(255,255,255,0.04), transparent 35%),
    linear-gradient(180deg, rgba(18, 32, 55, 0.84), rgba(7, 16, 29, 0.92));
  box-shadow: var(--shadow);
}

.inf-hero-main::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.04), transparent 38%);
  pointer-events: none;
}

@media (max-width: 640px) {
  .inf-hero-panoramic {
    --hero-height: 280px;
    border-radius: 24px;
  }

  .inf-hero-main {
    padding: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .inf-hero-layer {
    transform: none;
  }
}
EOF_CSS

cat <<'EOF_CSS' > assets/css/hero-overlay.css
.pan-text-floating {
  position: absolute;
  z-index: 10;
  color: var(--accent2, #8fd3ff);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  text-shadow: 0 0 12px rgba(0, 0, 0, 0.82);
  pointer-events: none;
}

.pan-text-floating small {
  display: block;
  margin-top: 8px;
  color: var(--soft);
  opacity: 0.78;
}
EOF_CSS

cat <<'EOF_CSS' > assets/css/categories.css
.inf-summary {
  width: 100%;
  margin: 0 0 var(--section-gap);
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.inf-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.inf-summary-card {
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(18, 32, 55, 0.84), rgba(7, 16, 29, 0.9));
  box-shadow: var(--shadow);
}

.inf-summary-card strong {
  display: block;
  margin-bottom: 4px;
  font-size: 1.6rem;
}

.inf-summary-card span {
  color: var(--muted);
  font-size: 0.9rem;
}

.inf-categories {
  display: grid;
  gap: 18px;
}

.inf-category {
  display: grid;
  gap: 10px;
  width: 100%;
}

.inf-category-head {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 10px 14px;
}

.inf-category-head h2 {
  margin: 0;
  font-size: 1.25rem;
}

.inf-category-head span {
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.inf-category-desc {
  margin: 0;
  color: var(--muted);
  font-size: 0.92rem;
  line-height: 1.5;
}

@media (max-width: 720px) {
  .inf-summary-grid {
    grid-template-columns: 1fr;
  }
}
EOF_CSS

cat <<'EOF_CSS' > assets/css/cards.css
.inf-cards-rail {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 2px 2px 10px;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: 16px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

.inf-cards-rail::-webkit-scrollbar {
  height: 8px;
}

.inf-cards-rail::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.14);
  border-radius: 999px;
}

.inf-card {
  flex: 0 0 min(82vw, 360px);
  scroll-snap-align: start;
}

.inf-card.is-expanded {
  transform: translateY(-2px);
  border-color: rgba(201, 162, 39, 0.42);
}

.inf-card-head {
  display: grid;
  gap: 4px;
}

.inf-card-author {
  color: var(--muted);
  font-size: 0.9rem;
}

.inf-card-title {
  margin: 0;
  font-size: 1.08rem;
}

.inf-card-body {
  text-align: left;
  border-radius: 18px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255,255,255,0.06);
}

.inf-card-body p {
  margin: 0;
  color: var(--text);
}

.inf-card-foot {
  display: grid;
  gap: 12px;
}

.inf-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  color: var(--muted);
  font-size: 0.85rem;
}

.inf-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.inf-card-actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255,255,255,0.04);
  color: var(--soft);
  transition: transform 180ms ease, background 180ms ease, border-color 180ms ease;
}

.inf-card-actions button:hover {
  transform: translateY(-1px);
  background: rgba(201,162,39,0.08);
  border-color: rgba(201,162,39,0.32);
  color: #fff;
}

.inf-card-actions button svg {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

.inf-card-deps {
  margin: 0;
  white-space: pre-wrap;
  color: var(--soft);
  font-size: 0.85rem;
}

.inf-download-item,
.inf-result,
.inf-tile {
  padding: 18px;
}

@keyframes inf-spin {
  to { transform: rotate(360deg); }
}

.btn-loading {
  position: relative !important;
  pointer-events: none;
  color: transparent !important;
}

.btn-loading svg {
  opacity: 0;
}

.btn-loading::after {
  content: "";
  position: absolute;
  width: 1.2rem;
  height: 1.2rem;
  top: 50%;
  left: 50%;
  margin: -0.6rem 0 0 -0.6rem;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: var(--accent2);
  border-radius: 50%;
  animation: inf-spin 0.65s linear infinite;
}
EOF_CSS

cat <<'EOF_CSS' > assets/css/forms.css
.inf-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  margin: 0;
}

.inf-form-group {
  display: grid;
  gap: 8px;
}

.inf-form-group label {
  color: var(--muted);
  font-size: 0.88rem;
  font-weight: 700;
}

.inf-form-group input,
.inf-form-group textarea,
.inf-form-group select {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 16px;
  background: rgba(255,255,255,0.04);
  color: var(--text);
  outline: none;
  font: inherit;
  transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
}

.inf-form-group input::placeholder,
.inf-form-group textarea::placeholder {
  color: #8091ad;
}

.inf-form-group input:focus,
.inf-form-group textarea:focus,
.inf-form-group select:focus {
  border-color: rgba(201,162,39,0.5);
  background: rgba(255,255,255,0.06);
  box-shadow: 0 0 0 3px rgba(201,162,39,0.08);
}

.inf-btn-primary {
  align-self: flex-start;
}

.inf-loading {
  animation: inf-pulse 1.5s infinite;
}

@keyframes inf-pulse {
  0%, 100% { opacity: 0.65; }
  50% { opacity: 1; }
}
EOF_CSS

cat <<'EOF_CSS' > assets/css/interactions.css
.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  padding: 0;
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 13px;
  background: rgba(255,255,255,0.04);
  color: inherit;
  cursor: pointer;
  transition: transform 180ms ease, background 180ms ease, border-color 180ms ease;
}

.btn-icon:hover {
  transform: translateY(-1px);
  background: rgba(255,255,255,0.07);
  border-color: rgba(201,162,39,0.32);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn-loading {
  position: relative !important;
  pointer-events: none;
  color: transparent !important;
}

.btn-loading svg {
  opacity: 0;
}

.btn-loading::after {
  content: "";
  position: absolute;
  width: 1.2rem;
  height: 1.2rem;
  top: 50%;
  left: 50%;
  margin: -0.6rem 0 0 -0.6rem;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: var(--accent2);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
EOF_CSS

cat <<'EOF_CSS' > assets/css/searchdock.css
.inf-searchdock {
  position: fixed;
  right: max(1rem, calc((100vw - var(--max)) / 2));
  bottom: calc(var(--dock-height) + 28px);
  z-index: 990;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 56px;
  height: 56px;
  padding: 5px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(6, 16, 28, 0.9);
  box-shadow: var(--shadow);
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
  overflow: hidden;
  transition: width 260ms cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 180ms ease, border-color 180ms ease;
}

.inf-shell.rail-hidden .inf-searchdock {
  opacity: 0.84;
}

.inf-searchdock.is-open {
  width: min(92vw, 420px);
  border-radius: 22px;
  border-color: rgba(201,162,39,0.26);
}

.inf-searchfab {
  width: 46px;
  height: 46px;
  min-width: 46px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(201,162,39,0.22), rgba(143,211,255,0.16));
  color: var(--text);
  font-size: 1.1rem;
}

.inf-searchpanel {
  display: none;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1 1 auto;
}

.inf-searchdock.is-open .inf-searchpanel {
  display: flex;
  animation: inf-fade-in 180ms ease forwards;
}

.inf-searchpanel input {
  min-width: 0;
  flex: 1 1 auto;
  padding: 12px 14px;
  border: 1px solid transparent;
  border-radius: 999px;
  outline: 0;
  background: rgba(255,255,255,0.05);
  color: var(--text);
}

.inf-searchpanel input::placeholder {
  color: #8091ad;
}

@keyframes inf-fade-in {
  from { opacity: 0; transform: translateX(3px); }
  to { opacity: 1; transform: translateX(0); }
}

@media (max-width: 720px) {
  .inf-searchdock {
    right: 10px;
    bottom: 5.85rem;
  }

  .inf-searchdock.is-open {
    width: calc(100vw - 20px);
  }
}
EOF_CSS

cat <<'EOF_CSS' > assets/css/sidebar.css
:root {
  --inf-header-height: var(--header-height);
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  z-index: 998;
  opacity: 0;
  pointer-events: none;
  background: var(--sidebar-overlay);
  transition: opacity 180ms ease;
}

.sidebar-overlay.is-active {
  opacity: 1;
  pointer-events: auto;
}

.modern-sidebar {
  position: fixed;
  top: 0;
  left: max(0px, calc((100vw - var(--max)) / 2));
  z-index: 999;
  width: var(--sidebar-width);
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  box-shadow: 24px 0 64px rgba(0,0,0,0.38);
  transform: translateX(-106%);
  transition: transform 220ms ease;
  pointer-events: none;
  backdrop-filter: blur(18px) saturate(130%);
  -webkit-backdrop-filter: blur(18px) saturate(130%);
}

.modern-sidebar.is-open {
  transform: translateX(0);
  pointer-events: auto;
}

.sidebar-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px;
  border-bottom: 1px solid var(--sidebar-border);
}

.sidebar-title {
  color: var(--text);
  font-size: 0.98rem;
  font-weight: 800;
}

.icon-btn {
  appearance: none;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: var(--text);
  font-size: 1.05rem;
  line-height: 1;
  cursor: pointer;
  padding: 8px 10px;
  border-radius: 12px;
}

.icon-btn:hover {
  background: rgba(201,162,39,0.08);
}

.sidebar-nav {
  flex: 1 1 auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 14px;
}

.sidebar-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.sidebar-list li + li {
  margin-top: 5px;
}

.sidebar-link {
  display: block;
  padding: 12px 13px;
  border: 1px solid transparent;
  border-radius: 14px;
  color: var(--muted);
  text-decoration: none;
  font-size: 0.95rem;
  transition: background-color 160ms ease, color 160ms ease, transform 160ms ease, border-color 160ms ease;
}

.sidebar-link:hover,
.sidebar-link:focus-visible {
  color: var(--text);
  background: rgba(255,255,255,0.05);
  border-color: rgba(255,255,255,0.06);
  transform: translateX(2px);
}

.sidebar-link.active {
  color: var(--text);
  background: linear-gradient(90deg, rgba(201,162,39,0.14), rgba(143,211,255,0.07));
  border-color: rgba(201,162,39,0.2);
}

@media (max-width: 768px) {
  .modern-sidebar {
    left: 0;
    width: min(88vw, 320px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar-overlay,
  .modern-sidebar,
  .sidebar-link {
    transition: none;
  }
}
EOF_CSS

cat <<'EOF_CSS' > assets/css/panoramic.css
/* Compatibility entrypoint: panoramic hero presentation is owned by hero.css. */
@import url("./hero.css");
EOF_CSS

cat <<'EOF_CSS' > assets/css/media-card.css
.container-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  width: 100%;
  max-width: var(--max);
  margin: 20px auto;
}

.media-card {
  display: block;
  position: relative;
  width: 33.33%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--card);
  color: inherit;
  box-shadow: var(--shadow);
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.media-card:hover {
  transform: translateY(-3px);
  border-color: rgba(201,162,39,0.35);
}

.media-content {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-content img,
.media-content video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(5, 11, 20, 0.64);
  color: #fff;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 800;
  opacity: 0;
  transition: opacity 180ms ease;
  pointer-events: none;
}

.media-card:hover .card-overlay,
.media-card:focus-visible .card-overlay {
  opacity: 1;
}

.side-content {
  flex: 1 1 auto;
  width: 66.66%;
  min-width: 0;
}

@media (max-width: 768px) {
  .container-wrapper {
    flex-direction: column;
    align-items: center;
  }

  .media-card,
  .side-content {
    width: 100%;
    max-width: 400px;
  }
}
EOF_CSS

cat <<'EOF_CSS' > assets/css/style.css
/* Compatibility stylesheet for older direct imports. Canonical styling lives in main.css. */
@import url("./main.css");
EOF_CSS

cat <<'EOF_CSS' > assets/css/responsive.css
@media (max-width: 980px) {
  .inf-hero-grid,
  .inf-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .inf-shell {
    width: min(calc(100% - 20px), var(--max));
  }

  .inf-main,
  .inf-summary,
  .inf-hero {
    width: 100%;
  }

  .inf-searchdock {
    right: 10px;
  }

  .inf-bottombar.curved {
    width: calc(100vw - 20px);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
EOF_CSS

cat <<'EOF_CSS' > assets/css/main.css
@import url("./tokens.css");
@import url("./base.css");
@import url("./text.css");
@import url("./layout.css");
@import url("./topbar.css");
@import url("./hero.css");
@import url("./hero-overlay.css");
@import url("./categories.css");
@import url("./cards.css");
@import url("./forms.css");
@import url("./interactions.css");
@import url("./searchdock.css");
@import url("./sidebar.css");
@import url("./media-card.css");
@import url("./responsive.css");
EOF_CSS

printf '%s\n' "Infinity CSS rebuilt in assets/css using canonical Inf-* class names and premium token system."
