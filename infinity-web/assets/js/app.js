import { loadConfig, ConfigError } from './config.js';
import { mountLayout } from '../../components/layout.js';
import { initRouter } from '../../components/router.js';
import {
  initializeState,
  destroyState,
  getState,
  setUI
} from '../../components/state.js';

const DEFAULT_ROUTE = '#assistance';
const SCROLL_PREFIX = 'scroll_';
const SCROLL_RESTORE_DELAYS = Object.freeze([0, 50, 150, 400]);

let bootstrapped = false;
let bootstrapPromise = null;
let appCleanup = null;
let router = null;
let mountedUi = null;
let scrollGeneration = 0;
const scrollTimers = new Set();

function getCurrentRouteKey() {
  return window.location.hash || DEFAULT_ROUTE;
}

function getScrollStorageKey(route = getCurrentRouteKey()) {
  return `${SCROLL_PREFIX}${encodeURIComponent(String(route))}`;
}

function safeSessionGet(key) {
  try {
    return window.sessionStorage.getItem(key);
  } catch (error) {
    console.warn('[Infinity] sessionStorage read failed:', error);
    return null;
  }
}

function safeSessionSet(key, value) {
  try {
    window.sessionStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn('[Infinity] sessionStorage write failed:', error);
    return false;
  }
}

function saveScroll(route = getCurrentRouteKey()) {
  safeSessionSet(
    getScrollStorageKey(route),
    String(Math.max(0, Math.round(window.scrollY || 0)))
  );
}

function restoreScroll(route = getCurrentRouteKey()) {
  if (route !== getCurrentRouteKey()) return;

  const saved = safeSessionGet(getScrollStorageKey(route));
  const top = saved === null ? 0 : Number.parseInt(saved, 10);

  window.scrollTo({
    top: Number.isFinite(top) && top >= 0 ? top : 0,
    left: 0,
    behavior: 'auto'
  });
}

function cancelScheduledScrollRestore() {
  scrollGeneration += 1;

  for (const timer of scrollTimers) {
    window.clearTimeout(timer);
  }

  scrollTimers.clear();
}

function scheduleScrollRestore(route) {
  cancelScheduledScrollRestore();

  const generation = scrollGeneration;

  for (const delay of SCROLL_RESTORE_DELAYS) {
    const timer = window.setTimeout(() => {
      scrollTimers.delete(timer);

      if (
        generation !== scrollGeneration ||
        route !== getCurrentRouteKey()
      ) {
        return;
      }

      window.requestAnimationFrame(() => {
        if (
          generation !== scrollGeneration ||
          route !== getCurrentRouteKey()
        ) {
          return;
        }

        restoreScroll(route);
      });
    }, delay);

    scrollTimers.add(timer);
  }
}

function getClosest(target, selector) {
  if (!(target instanceof Element)) return null;
  return target.closest(selector);
}

function isNavigationElement(target) {
  return Boolean(
    getClosest(target, 'a[href]') ||
    getClosest(target, '[data-action]')
  );
}

function getDrawer(ui) {
  return ui?.drawer || ui?.root?.querySelector('[data-inf-drawer]');
}

function getSearchDock(ui) {
  return ui?.searchDock || ui?.root?.querySelector('[data-inf-searchdock]');
}

function isSearchOpen(ui) {
  try {
    return getState().ui.searchOpen;
  } catch {
    const dock = getSearchDock(ui);
    return Boolean(dock?.classList.contains('is-open'));
  }
}

function navigateToSearch(ui, config, query) {
  const normalizedQuery = String(query || '').trim();
  if (!normalizedQuery) return;

  const href = config.href('search', { q: normalizedQuery });

  if (!href || typeof href !== 'string') {
    console.error('[Infinity] Search route could not be generated.');
    return;
  }

  if (href.startsWith('#')) {
    window.location.hash = href.slice(1);
  } else {
    window.location.href = href;
  }

  ui.closeSearch();
  ui.setSearchValue('');
}

function handleShare(config) {
  const shareData = {
    title: config.site_name || config.site?.site_name || 'Infinity',
    text: config.site?.description || 'Infinity Terminal Helpers',
    url: window.location.href
  };

  if (typeof navigator.share === 'function') {
    void navigator.share(shareData).catch((error) => {
      if (error?.name !== 'AbortError') {
        console.error('[Infinity] Share failed:', error);
      }
    });
    return;
  }

  const href = config.href('share');

  if (typeof href === 'string' && href.startsWith('#')) {
    window.location.hash = href.slice(1);
    return;
  }

  window.location.hash = 'share';
}

function handleAction(action, config) {
  const normalizedAction = String(action || '').trim().toLowerCase();
  if (!normalizedAction) return;

  if (normalizedAction === 'share') {
    handleShare(config);
    return;
  }

  const routeHref = config.href(normalizedAction);

  if (typeof routeHref !== 'string' || !routeHref) {
    console.error(`[Infinity] Invalid action target: ${normalizedAction}`);
    return;
  }

  if (routeHref.startsWith('#')) {
    window.location.hash = routeHref.slice(1);
  } else {
    window.location.href = routeHref;
  }
}

function bindInteractions(root, ui, config) {
  const controller = new AbortController();
  const { signal } = controller;

  const onClick = (event) => {
    const target = event.target;

    if (isNavigationElement(target)) {
      saveScroll();
    }

    const menuToggle = getClosest(target, '[data-inf-menu-toggle]');
    if (menuToggle) {
      const drawer = getDrawer(ui);
      if (drawer) {
        ui.setDrawerVisible(drawer.hasAttribute('hidden'));
      }
      event.preventDefault();
      return;
    }

    const drawer = getDrawer(ui);
    if (drawer && !drawer.hasAttribute('hidden')) {
      const clickedInside = Boolean(getClosest(target, '.inf-drawer-inner'));
      const clickedLink = Boolean(getClosest(target, 'a[href]'));

      if (!clickedInside || clickedLink) {
        ui.setDrawerVisible(false);
      }
    }

    const searchFab = getClosest(target, '.inf-searchfab');
    if (searchFab) {
      event.preventDefault();
      if (isSearchOpen(ui)) ui.closeSearch();
      else ui.openSearch();
      return;
    }

    const actionButton = getClosest(target, '[data-action]');
    if (actionButton) {
      event.preventDefault();
      handleAction(
        actionButton.getAttribute('data-action'),
        config
      );
    }
  };

  const onKeydown = (event) => {
    if (event.key === 'Escape') {
      ui.closeSearch();
      ui.setDrawerVisible(false);
      return;
    }

    if (
      event.key === 'Enter' &&
      event.target instanceof HTMLInputElement &&
      event.target.matches('[data-inf-search-input]')
    ) {
      event.preventDefault();
      navigateToSearch(ui, config, event.target.value);
    }
  };

  const onHashChange = () => {
    scheduleScrollRestore(getCurrentRouteKey());
    ui.setDrawerVisible(false);
    ui.closeSearch();
  };

  const onPageHide = () => saveScroll();
  const onBeforeUnload = () => saveScroll();

  root.addEventListener('click', onClick, { signal });
  root.addEventListener('keydown', onKeydown, { signal });
  window.addEventListener('hashchange', onHashChange, { signal });
  window.addEventListener('pagehide', onPageHide, { signal });
  window.addEventListener('beforeunload', onBeforeUnload, { signal });

  return () => controller.abort();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function describeError(error) {
  if (error instanceof ConfigError) {
    return [
      error.code ? `Code: ${error.code}` : '',
      error.resource ? `Resource: ${error.resource}` : '',
      error.path ? `Path: ${error.path}` : '',
      error.message || ''
    ].filter(Boolean);
  }

  if (error?.errors && Array.isArray(error.errors)) {
    return error.errors.flatMap(describeError);
  }

  return [
    error?.message || String(error || 'Unknown startup error')
  ];
}

function renderFatalError(root, error) {
  const isConfigError = error instanceof ConfigError;
  const title = isConfigError
    ? 'Configuration Failure'
    : 'Application Startup Failure';

  const details = describeError(error);
  const detail = [...new Set(details)].slice(0, 8).join(' · ');

  root.innerHTML = `
    <section
      class="inf-page inf-fatal-error"
      role="alert"
      aria-live="assertive"
    >
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(details[details.length - 1] || 'Infinity could not start.')}</p>
      <p class="mini">${escapeHtml(detail)}</p>
      <button
        type="button"
        class="inf-btn"
        data-infinity-retry
      >
        Retry
      </button>
    </section>
  `;

  root.querySelector('[data-infinity-retry]')?.addEventListener(
    'click',
    () => window.location.reload(),
    { once: true }
  );
}

function destroyRuntime({ destroyStore = true } = {}) {
  cancelScheduledScrollRestore();

  try {
    router?.destroy();
  } catch (error) {
    console.error('[Infinity] Router teardown failed:', error);
  }

  router = null;

  try {
    appCleanup?.();
  } catch (error) {
    console.error('[Infinity] Application listener teardown failed:', error);
  }

  appCleanup = null;

  try {
    mountedUi?.destroy?.();
  } catch (error) {
    console.error('[Infinity] Layout teardown failed:', error);
  }

  mountedUi = null;

  if (destroyStore) {
    destroyState();
  }

  if (globalThis.__INFINITY_APP__) {
    try {
      delete globalThis.__INFINITY_APP__;
    } catch {
      globalThis.__INFINITY_APP__ = undefined;
    }
  }
}

async function bootstrap() {
  if (bootstrapped) {
    return globalThis.__INFINITY_APP__;
  }

  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    const root = document.getElementById('app');

    if (!root) {
      throw new Error('Root #app element not found.');
    }

    destroyRuntime();

    try {
      const config = await loadConfig();

      initializeState({
        route: null,
        query: '',
        params: {},
        lifecycle: 'booting'
      });

      const ui = mountLayout(root, config);

      if (!ui || !ui.root || typeof ui.setPageContent !== 'function') {
        throw new Error('Layout initialization failed.');
      }

      mountedUi = ui;
      appCleanup = bindInteractions(root, ui, config);
      router = initRouter(ui, config);

      scheduleScrollRestore(getCurrentRouteKey());

      bootstrapped = true;

      const appHandle = {
        root,
        ui,
        router,
        config,
        get state() {
          return getState();
        },
        destroy
      };

      globalThis.__INFINITY_APP__ = Object.freeze(appHandle);

      return appHandle;
    } catch (error) {
      console.error('[Infinity] Application bootstrap failed:', error);
      destroyRuntime();
      renderFatalError(root, error);
      throw error;
    }
  })();

  try {
    return await bootstrapPromise;
  } finally {
    bootstrapPromise = null;
  }
}

function start() {
  void bootstrap().catch(() => {});
}

function destroy() {
  destroyRuntime();
  bootstrapped = false;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}

export { bootstrap, destroy };
