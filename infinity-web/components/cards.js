import { Icons } from './icons.js';

export function renderScriptCards(items = []) {
  return `
    <div class="inf-cards-rail" aria-label="Scripts">
      ${items.length ? items.map((item) => `
        <article class="inf-card" data-script-card data-script-id="${item.id || ''}">
          <header class="inf-card-head">
            <div class="inf-card-author">${item.author || item.owner || 'Unknown author'}</div>
            <h3 class="inf-card-title">${item.name || item.title || 'Untitled script'}</h3>
          </header>

          <button type="button" class="inf-card-body" data-script-expand>
            <p>${item.description || item.summary || 'No description provided.'}</p>
          </button>

          <footer class="inf-card-foot">
            <div class="inf-card-meta">
              <span>${item.shell || ''}</span>
              <span>${item.language || ''}</span>
              <span>${item.category || ''}</span>
            </div>

            <div class="inf-card-actions">
              <button type="button" data-action="download" title="Download">${Icons.download}</button>
              <button type="button" data-action="share" title="Share">${Icons.share}</button>
              <button type="button" data-action="request" title="Request">${Icons.request}</button>
              <button type="button" data-action="report" title="Report">${Icons.report}</button>
            </div>

            <pre class="inf-card-deps">${Array.isArray(item.dependencies) ? item.dependencies.join('\n') : (item.dependencies || '')}</pre>
          </footer>
        </article>
      `).join('') : '<div class="inf-result">No scripts loaded yet.</div>'}
    </div>
  `;
}
