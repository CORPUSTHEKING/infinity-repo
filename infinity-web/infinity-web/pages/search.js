export function renderSearchPage(results = [], query = '') {
  return `
    <section class="inf-page">
      <h2>Search</h2>
      <p>Search query: ${query || 'none'}</p>
      <div class="inf-results">
        ${results.map(item => `
          <article class="inf-result">
            <strong>${item.name || item.title || 'Untitled'}</strong>
            <span>${item.author || ''}</span>
            <p>${item.description || ''}</p>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}
