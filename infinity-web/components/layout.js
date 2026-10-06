import { renderSidebar, bindSidebar } from './sidebar.js';
import { renderDrawer } from './drawer.js';
import { renderHero } from './hero.js';
import { renderQuickRail } from './quickrail.js';
import { renderSearchDock } from './searchdock.js';
import { renderSummary } from './summary.js';
import { isInitialized, setUI } from './state.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getNavigationItem(config, key, fallback) {
  const item = config?.navigationApi?.get?.(key) ||
    config?.navigation?.find?.(entry => entry.key === key);
  return item || fallback;
}

function renderBottomBar(config = {}) {
  const fallbackItems = [
    { key: 'home', label: 'home', href: '#home' },
    { key: 'upload', label: 'upload', href: '#upload' },
    { key: 'download', label: 'downloads', href: '#download' },
    { key: 'sponsor', label: '❤️ sponsor', href: '#sponsor' }
  ];

  const keys = ['home', 'upload', 'download', 'sponsor'];

  return `
    <footer class="inf-bottombar curved" data-inf-bottombar>
      <div class="inf-bottombar-inner">
        ${keys.map((key, index) => {
          const item = getNavigationItem(config, key, fallbackItems[index]);
          const href = escapeHtml(item.href || fallbackItems[index].href);
          const label = escapeHtml(item.label || fallbackItems[index].label);
          const target = escapeHtml(item.target || '_self');
          const rel = escapeHtml(item.rel || '');
          const targetAttrs = target !== '_self'
            ? ` target="${target}"${rel ? ` rel="${rel}"` : ''}`
            : '';

          return `<a href="${href}"${targetAttrs} data-inf-nav="${escapeHtml(key)}">${label}</a>`;
        }).join('')}
      </div>
    </footer>
  `;
}

export function createLayoutShell(config = {}) {
  const siteName = config.site_name || config.site?.site_name || 'INFINITY';
  const ui = config.ui || {};

  return `
    <div class="inf-shell" data-inf-shell>
      <header class="inf-brandbar" data-inf-brandbar>
        <div class="inf-logo-wrapper">
          <span class="inf-symbol">∞</span>
        </div>
        <button
          type="button"
          class="inf-menu-btn"
          data-inf-menu-toggle
          aria-label="Menu"
          aria-controls="infinity-drawer"
          aria-expanded="false"
        >
          menu
        </button>
      </header>

      ${renderSidebar(config)}
      ${renderQuickRail(config)}
      ${renderDrawer(config)}

      <section class="inf-hero" data-inf-hero>
        ${renderHero(siteName)}
      </section>

      <section class="inf-summary" data-inf-summary style="display: none;">
        ${renderSummary()}
      </section>

      <main class="inf-main" data-inf-main></main>

      ${ui.show_bottom_search === false ? '' : renderSearchDock()}

      ${ui.show_bottom_bar === false ? '' : renderBottomBar(config)}
    </div>
  `;
}

export function mountLayout(root, config = {}) {
  if (!(root instanceof Element)) {
    throw new TypeError('[Infinity] mountLayout requires a DOM element root.');
  }

  root.innerHTML = createLayoutShell(config);

  const sidebarCleanup = bindSidebar(root);
  const shell = root.querySelector('[data-inf-shell]');
  const brandbar = root.querySelector('[data-inf-brandbar]');
  const quickRail = root.querySelector('[data-inf-quickrail]');
  const drawer = root.querySelector('[data-inf-drawer]');
  const searchDock = root.querySelector('[data-inf-searchdock]');
  const searchPanel = root.querySelector('[data-inf-searchpanel]');
  const searchInput = root.querySelector('[data-inf-search-input]');

  function syncUiState(patch) {
    if (isInitialized()) setUI(patch);
  }

  function getCurrentSearchInput() {
    return root.querySelector('[data-inf-search-input]');
  }

  return {
    root,
    shell,
    brandbar,
    quickRail,
    drawer,
    searchDock,
    searchPanel,
    searchInput,

    setHero(html = '') {
      const hero = root.querySelector('[data-inf-hero]');
      if (hero) hero.innerHTML = String(html);
    },

    setSummary(html = '') {
      const summary = root.querySelector('[data-inf-summary]');
      if (summary) summary.innerHTML = String(html);
    },

    setPageContent(html = '') {
      const main = root.querySelector('[data-inf-main]');
      if (main) main.innerHTML = String(html);
    },

    setDrawerVisible(visible) {
      const drawerElement = root.querySelector('[data-inf-drawer]');
      if (drawerElement) {
        drawerElement.hidden = !Boolean(visible);
        drawerElement.setAttribute('aria-hidden', String(!Boolean(visible)));
      }

      const menuToggle = root.querySelector('[data-inf-menu-toggle]');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', String(Boolean(visible)));

      syncUiState({ drawerOpen: Boolean(visible) });
    },

    setSearchValue(value = '') {
      const input = getCurrentSearchInput();
      if (input) input.value = String(value ?? '');
    },

    openSearch() {
      const dock = root.querySelector('[data-inf-searchdock]');
      const panel = root.querySelector('[data-inf-searchpanel]');
      const input = getCurrentSearchInput();

      if (dock) dock.classList.add('is-open');
      if (panel) panel.hidden = false;
      syncUiState({ searchOpen: true });
      input?.focus();
    },

    closeSearch() {
      const dock = root.querySelector('[data-inf-searchdock]');
      const panel = root.querySelector('[data-inf-searchpanel]');

      if (dock) dock.classList.remove('is-open');
      if (panel) panel.hidden = true;
      syncUiState({ searchOpen: false });
    },

    destroy() {
      try {
        if (typeof sidebarCleanup === 'function') sidebarCleanup();
        else if (sidebarCleanup?.destroy) sidebarCleanup.destroy();
        else if (sidebarCleanup?.dispose) sidebarCleanup.dispose();
      } catch (error) {
        console.error('[Infinity] Sidebar teardown failed:', error);
      }

      root.innerHTML = '';
    }
  };
}
