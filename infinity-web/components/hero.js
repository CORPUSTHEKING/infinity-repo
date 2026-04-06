import { renderHeroOverlay } from './hero/overlay/text.js';

export function renderHero(config = {}) {
  // Use config to decide if overlay should show
  const overlay = config.showOverlay !== false ? renderHeroOverlay(config.content, config.subtext) : '';

  return `
    <div class="inf-hero-panoramic">
      ${overlay}
    </div>
  `;
}
