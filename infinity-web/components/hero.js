import { renderHeroOverlay } from './hero/overlay/text.js';

export function renderHero(config = {}) {
  const overlay =
    config.showOverlay !== false
      ? renderHeroOverlay(config.content || {}, config.subtext || '')
      : '';

  return `
    <div class="inf-hero-panoramic" data-hero-parallax>
      <div class="inf-hero-layer inf-hero-layer-back" aria-hidden="true"></div>
      <div class="inf-hero-layer inf-hero-layer-mid" aria-hidden="true"></div>
      <div class="inf-hero-layer inf-hero-layer-front" aria-hidden="true"></div>
      <div class="inf-hero-vignette" aria-hidden="true"></div>
      ${overlay}
    </div>
  `;
}
