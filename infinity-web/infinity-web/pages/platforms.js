export function renderPlatformsPage(platforms = []) {
  return `
    <section class="inf-page">
      <h2>Platforms</h2>
      <div class="inf-grid">
        ${platforms.map((platform) => `
          <article class="inf-tile">
            <strong>${platform.name || platform.label || ''}</strong>
            <p>${platform.url || platform.link || ''}</p>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}
