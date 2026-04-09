import { renderCategoriesView, renderSearchResultsView } from './categories.js';
import { getManifest, searchScripts } from '../assets/js/data.js';
import { handleDownloadPageRoute } from './router/download.js';
import { handleDocsPageRoute } from './router/docs.js';

export function initRouter(ui, config) {
  async function handleRoute() {
    // Extract hash and potential query parameters (e.g., #search?q=term)
    const rawHash = window.location.hash.replace('#', '') || 'assistance';
    const [hashPath, queryString] = rawHash.split('?');
    const hash = hashPath || 'assistance';

    const urlParams = new URLSearchParams(queryString || '');

    // Update active state in navigation links
    document.querySelectorAll('.inf-bottombar a, .inf-drawer a').forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href')?.replace('#', '');
      if (href && href.split('?')[0] === hash) {
        link.classList.add('active');
      }
    });

    switch (hash) {
      case 'docs':
        await handleDocsPageRoute(ui, urlParams);
        break;

      case 'assistance':
      case 'home':
        ui.setPageContent(`
          <div class="inf-page">
            <h2>Welcome to Infinity</h2>
            <p>Your centralized hub for terminal utilities, payload scripts, and workspace configurations.</p>
            <p>Use the navigation below to browse downloads, or tap the search icon to find specific tools.</p>
          </div>
        `);
        break;

      case 'download':
        // We delegate all the work (fetching, rendering, and binding) to the sub-router
        await handleDownloadPageRoute(ui, config);
        break;

      case 'search':
        const query = urlParams.get('q') || '';
        if (!query) {
            ui.setPageContent('<div class="inf-page"><p>Please enter a search term.</p></div>');
            break;
        }
        ui.setPageContent(`<div class="inf-page"><p class="inf-loading">Searching for "${query}"...</p></div>`);
        const results = await searchScripts(query);
        ui.setPageContent(renderSearchResultsView(results, query));
        break;

      case 'upload':
      case 'request':
        const isUpload = hash === 'upload';
        const titleText = isUpload ? 'Upload a Script' : 'Request a Script';
        const labelText = isUpload ? 'Script Content or Link' : 'Describe the tool you need';
        const ghLabel = isUpload ? 'submission' : 'enhancement';

        ui.setPageContent(`
          <div class="inf-page">
            <h2>${titleText.toUpperCase()}</h2>
            <p class="inf-category-desc">
              Infinity is a decentralized static platform. Submissions are securely routed through GitHub Issues.
            </p>
            <form class="inf-form" onsubmit="
              event.preventDefault();
              const title = encodeURIComponent((document.getElementById('inf-f-title').value || '').trim());
              const body = encodeURIComponent((document.getElementById('inf-f-body').value || '').trim());
              const url = 'https://github.com/CORPUSTHEKING/infinity/issues/new?title=' + title + '&body=' + body + '&labels=${ghLabel}';
              window.open(url, '_blank');
            ">
              <div class="inf-form-group">
                <input type="text" id="inf-f-title" placeholder="${isUpload ? 'e.g., Network Scanner Script' : 'e.g., Need a script to automate backups'}" required />
              </div>
              <div class="inf-form-group">
                <textarea id="inf-f-body" placeholder="${labelText}" rows="6" required></textarea>
              </div>
              <button type="submit" class="inf-btn-primary">Submit via GitHub</button>
            </form>
          </div>
        `);
        break;

      default:
        ui.setPageContent(`
          <div class="inf-page">
            <h2>${hash.toUpperCase()}</h2>
            <p>Information regarding ${hash} is currently being updated.</p>
          </div>
        `);
        break;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}
