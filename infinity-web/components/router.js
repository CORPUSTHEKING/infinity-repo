import {
  getState,
  setRoute,
  setLifecycle
} from './state.js';

let activeCleanup = null;
let routerController = null;
let navigationId = 0;

const ROUTES = Object.freeze({
  home: {
    async load() {
      return {
        async render(ui) {
          ui.setPageContent(`
            <div class="inf-page">
              <h2>Welcome to Infinity</h2>
              <p>Your centralized hub for terminal utilities, payload scripts, and workspace configurations.</p>
              <p>Use the navigation below to browse downloads, or use search to find a specific tool.</p>
            </div>
          `);
        }
      };
    }
  },

  assistance: {
    async load() {
      return import('../pages/assistance.js');
    },
    render(module, ui) {
      ui.setPageContent(module.renderAssistancePage());
    }
  },

  sponsor: {
    async load() {
      return import('../pages/sponsor.js');
    },
    render(module, ui) {
      ui.setPageContent(module.renderSponsorPage());
    }
  },

  download: {
    async load() {
      return import('./router/download.js');
    },
    async render(module, ui, context) {
      return module.handleDownloadPageRoute(ui, context.config);
    }
  },

  docs: {
    async load() {
      return import('./router/docs.js');
    },
    async render(module, ui, context) {
      return module.handleDocsPageRoute(ui, context.params);
    }
  },

  search: {
    async load() {
      return import('../pages/search.js');
    },
    async render(module, ui, context) {
      return module.handleSearchRoute(ui, context.query);
    }
  },

  upload: {
    async load() {
      return import('../pages/upload.js');
    },
    async render(module, ui, context) {
      ui.setPageContent(module.renderUploadPage());
      return module.bindUploadEvents(context.config);
    }
  },

  request: {
    async load() {
      return import('../pages/request.js');
    },
    async render(module, ui) {
      ui.setPageContent(module.renderRequestPage());
      return module.bindRequestEvents();
    }
  },

  report: {
    async load() {
      return import('../pages/report.js');
    },
    render(module, ui, context) {
      ui.setPageContent(module.renderReportPage(getFormSchema(context.config, 'report')));
    }
  },

  review: {
    async load() {
      return import('../pages/review.js');
    },
    render(module, ui, context) {
      ui.setPageContent(module.renderReviewPage(getFormSchema(context.config, 'review')));
    }
  },

  iwl: {
    async load() {
      return import('../pages/iwl.js');
    },
    render(module, ui, context) {
      ui.setPageContent(module.renderIwlPage(getFormSchema(context.config, 'iwl')));
    }
  },

  disclaimer: {
    async load() {
      return import('../pages/disclaimer.js');
    },
    render(module, ui) {
      ui.setPageContent(module.renderDisclaimerPage());
    }
  },

  devices: {
    async load() {
      return import('../pages/devices.js');
    },
    render(module, ui, context) {
      ui.setPageContent(module.renderDevicesPage(getDevices(context.config)));
    }
  },

  platforms: {
    async load() {
      return import('../pages/platforms.js');
    },
    render(module, ui, context) {
      ui.setPageContent(module.renderPlatformsPage(getPlatforms(context.config)));
    }
  },

  terminal: {
    async load() {
      return import('../pages/terminal.js');
    },
    render(module, ui) {
      ui.setPageContent(module.renderTerminalPage());
    }
  },

  share: {
    async load() {
      return {
        async render(ui) {
          ui.setPageContent(`
            <div class="inf-page">
              <h2>Share Infinity</h2>
              <p>Your browser does not expose the Web Share API.</p>
              <p>Use your browser's page sharing controls to share this site.</p>
              <p><a href="#assistance">Return to Assistance</a></p>
            </div>
          `);
        }
      };
    }
  }
});

function getFormSchema(config, name) {
  const forms = config?.data?.forms;
  return forms?.forms?.[name] ?? forms?.[name] ?? {};
}

function getDevices(config) {
  const devices = config?.data?.devices;
  if (Array.isArray(devices)) return devices;
  if (Array.isArray(devices?.devices)) return devices.devices;
  return [];
}

function getPlatforms(config) {
  const platforms = config?.data?.platforms;
  if (Array.isArray(platforms)) return platforms;
  if (Array.isArray(platforms?.platforms)) return platforms.platforms;
  return [];
}

function normalizeCleanup(value) {
  if (typeof value === 'function') return value;
  if (value && typeof value.dispose === 'function') return () => value.dispose();
  if (value && typeof value.destroy === 'function') return () => value.destroy();
  if (value && typeof value.unbind === 'function') return () => value.unbind();
  return null;
}

function disposeActivePage() {
  if (!activeCleanup) return;

  const cleanup = activeCleanup;
  activeCleanup = null;

  try {
    cleanup();
  } catch (error) {
    console.error('[Infinity] Route cleanup failed:', error);
  }
}

function getDefaultRoute(config) {
  const configured =
    config?.defaultRoute ??
    config?.default_route ??
    config?.site?.default_route;

  return typeof configured === 'string' && configured.trim()
    ? configured.trim().replace(/^#/, '').toLowerCase()
    : 'assistance';
}

function getRouteAliases(config) {
  const aliases = new Map();
  const routes = config?.routes || {};

  for (const [key, definition] of Object.entries(routes)) {
    const normalizedKey = decodeRoute(key);
    if (normalizedKey) aliases.set(normalizedKey, normalizedKey);

    if (definition?.kind === 'spa' && typeof definition.hash === 'string') {
      const hashKey = decodeRoute(definition.hash.replace(/^#/, '').split('?')[0]);
      if (hashKey) aliases.set(hashKey, normalizedKey);
    }
  }

  return aliases;
}

function parseLocation(config) {
  const raw = typeof window.location.hash === 'string'
    ? window.location.hash.replace(/^#/, '')
    : '';

  const [rawPath, ...queryParts] = raw.split('?');
  const queryString = queryParts.join('?');
  const aliases = getRouteAliases(config);
  const fallbackRoute = getDefaultRoute(config);
  const decoded = decodeRoute(rawPath || fallbackRoute);
  const route = aliases.get(decoded) || decoded || fallbackRoute;

  let params;
  try {
    params = new URLSearchParams(queryString);
  } catch (error) {
    console.error('[Infinity] Invalid route query string:', error);
    params = new URLSearchParams();
  }

  return {
    route,
    query: params.get('q') || '',
    params,
    queryString
  };
}

function decodeRoute(value) {
  try {
    return decodeURIComponent(String(value || ''))
      .trim()
      .replace(/^#/, '')
      .replace(/\/+$/, '')
      .toLowerCase();
  } catch {
    return String(value || '')
      .trim()
      .replace(/^#/, '')
      .replace(/\/+$/, '')
      .toLowerCase();
  }
}

function routeKeyFromHref(href, config) {
  if (typeof href !== 'string' || !href.startsWith('#')) return null;
  const raw = decodeRoute(href.slice(1).split('?')[0]);
  return getRouteAliases(config).get(raw) || raw || null;
}

function updateNavigation(route, config) {
  for (const link of document.querySelectorAll('a[href^="#"]')) {
    link.classList.remove('active');
    link.removeAttribute('aria-current');

    const target = routeKeyFromHref(link.getAttribute('href'), config);
    if (target === route) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderUnknownRoute(ui, route, config) {
  const safeRoute = escapeHtml(route);
  const fallback = escapeHtml(config.href(getDefaultRoute(config)));

  ui.setPageContent(`
    <div class="inf-page" role="region" aria-labelledby="route-error-title">
      <h2 id="route-error-title">${safeRoute.toUpperCase()}</h2>
      <p>Information regarding <strong>${safeRoute}</strong> is currently unavailable.</p>
      <p><a href="${fallback}">Return to Assistance</a></p>
    </div>
  `);
}

function renderRouteError(ui, route, error, config) {
  console.error(`[Infinity] Route "${route}" failed:`, error);

  const message = error instanceof Error && error.message
    ? error.message
    : 'The requested page could not be loaded.';
  const fallback = escapeHtml(config.href(getDefaultRoute(config)));

  ui.setPageContent(`
    <div class="inf-page" role="alert" aria-live="assertive">
      <h2>Page Unavailable</h2>
      <p>${escapeHtml(message)}</p>
      <p><a href="${fallback}">Return to Assistance</a></p>
    </div>
  `);
}

function routeStillCurrent(route, id) {
  if (id !== navigationId) return false;
  try {
    return getState().route === route;
  } catch {
    return false;
  }
}

async function handleRoute(ui, config) {
  const id = ++navigationId;
  const location = parseLocation(config);
  const route = location.route;
  const routeDefinition = ROUTES[route];

  setRoute(
    route,
    location.query,
    Object.fromEntries(location.params.entries())
  );

  updateNavigation(route, config);
  disposeActivePage();

  if (!routeDefinition) {
    setLifecycle('ready');
    renderUnknownRoute(ui, route, config);
    return;
  }

  setLifecycle('navigating');

  try {
    const module = await routeDefinition.load();

    if (!routeStillCurrent(route, id)) return;

    const render = routeDefinition.render || module.render;

    if (typeof render !== 'function') {
      throw new Error(`Route module has no render function: ${route}`);
    }

    const cleanup = await render(module, ui, {
      ui,
      config,
      route,
      query: location.query,
      params: location.params,
      queryString: location.queryString
    });

    const normalizedCleanup = normalizeCleanup(cleanup);

    if (!routeStillCurrent(route, id)) {
      normalizedCleanup?.();
      return;
    }

    activeCleanup = normalizedCleanup;
    setLifecycle(config.diagnostics?.degraded ? 'degraded' : 'ready');
  } catch (error) {
    if (!routeStillCurrent(route, id)) return;
    setLifecycle('error', error);
    renderRouteError(ui, route, error, config);
  }
}

export function initRouter(ui, config = {}) {
  if (!ui || typeof ui.setPageContent !== 'function') {
    throw new TypeError('[Infinity] initRouter requires a valid UI controller.');
  }

  getState();

  routerController?.abort();
  routerController = new AbortController();
  const { signal } = routerController;

  const onHashChange = () => {
    void handleRoute(ui, config);
  };

  window.addEventListener('hashchange', onHashChange, { signal });
  void handleRoute(ui, config);

  return {
    destroy() {
      routerController?.abort();
      routerController = null;
      navigationId += 1;
      disposeActivePage();

      try {
        setLifecycle('idle');
      } catch {
        // State may already have been destroyed during teardown.
      }
    }
  };
}
