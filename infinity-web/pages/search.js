import { searchScripts } from '../assets/js/data.js';
import { renderSearchResultsView } from '../components/categories.js';

export async function handleSearchRoute(ui, query) {
    // This is the exact logic extracted from router.js
    if (!query) {
        ui.setPageContent('<div class="inf-page"><p>Please enter a search term.</p></div>');
        return;
    }
    
    ui.setPageContent(`<div class="inf-page"><p class="inf-loading">Searching for "${query}"...</p></div>`);
    const results = await searchScripts(query);
    ui.setPageContent(renderSearchResultsView(results, query));
}

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
