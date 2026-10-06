const CONFIG_SCHEMA_VERSION = 1;
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_JSON_BYTES = 5 * 1024 * 1024;
const DEFAULT_CACHE_MODE = 'no-cache';
const APP_MODULE_MARKER = '/assets/js/';
const MISSING = Symbol('missing');

export class ConfigError extends Error {
  constructor(message, { code = 'CONFIG_ERROR', path = '', cause = null, resource = '' } = {}) {
    super(message, { cause });
    this.name = 'ConfigError';
    this.code = code;
    this.path = path;
    this.resource = resource;
  }
}

export class ConfigAggregateError extends ConfigError {
  constructor(message, errors = []) {
    super(message, { code: 'CONFIG_AGGREGATE_ERROR' });
    this.name = 'ConfigAggregateError';
    this.errors = errors;
  }
}

const DEFAULT_PATHS = Object.freeze({
  configRoot: 'config/',
  siteConfig: 'config/site.json',
  formsConfig: 'config/forms.json',
  platformsConfig: 'config/platforms.json',
  devicesConfig: 'config/devices.json',
  scriptsConfig: 'config/scripts.json',

  dataRoot: 'data/',
  categoriesData: 'data/categories.json',
  docsDataRoot: 'data/docs/',
  scriptsDataRoot: 'data/scripts/',

  payloadRoot: 'assets/payloads/',
  payloadManifest: 'assets/payloads/manifest.json',
  docsManifest: 'assets/payloads/docs-manifest.json',

  developerRoot: 'config/developer/',
  developerListing: 'index/developer-listing.html',
  developerProfileIndex: 'index/index.html',

  renderer: 'renderer.html',
  rendererComponents: 'config/components/',
  rendererUi: 'config/ui/',
  rendererFuncs: 'config/funcs/',

  appDocument: 'index.html',
  legacySpaDocument: 'indexo.html',
  appScript: 'assets/js/app.js',
  configScript: 'assets/js/config.js',
  dataScript: 'assets/js/data.js',

  cssRoot: 'assets/css/',
  cssMain: 'assets/css/main.css',
  cssTokens: 'assets/css/tokens.css',
  cssBase: 'assets/css/base.css',
  cssText: 'assets/css/text.css',
  cssLayout: 'assets/css/layout.css',
  cssPanoramic: 'assets/css/panoramic.css',

  isolatedGhostRoot: 'config (1)/',
  isolatedGhostManifest: 'config (1)/config/manifest.json',
  isolatedGhostPaths: 'config (1)/config/paths.json'
});

const DEFAULT_SITE = Object.freeze({
  schema_version: CONFIG_SCHEMA_VERSION,
  site_name: 'Infinity Terminal Helpers',
  description: 'Infinity Terminal Helpers',
  entrypoint: 'index.html',
  default_route: 'assistance',
  navigation: [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'upload', label: 'Upload Workspace', icon: 'upload' },
    { key: 'download', label: 'Terminal Helpers', icon: 'terminal' },
    { key: 'assistance', label: 'Assistance' },
    { key: 'search', label: 'Search' },
    { key: 'sponsor', label: 'Sponsor' },
    { key: 'request', label: 'Request' },
    { key: 'iwl', label: 'I Would Like' },
    {
      key: 'developers',
      label: 'Hire Developers',
      icon: 'code',
      href: DEFAULT_PATHS.developerListing,
      kind: 'document'
    }
  ],
  quick_actions: [
    { key: 'download', label: 'scripts' },
    { key: 'share', label: 'share' },
    { key: 'request', label: 'request' },
    { key: 'disclaimer', label: 'configs' }
  ],
  ui: {
    hide_topbar_on_scroll: false,
    show_floating_logo: false,
    show_bottom_bar: true,
    show_bottom_search: true,
    card_style: 'rolling',
    hero_style: 'panning_panorama',
    search_mode: ['fuzzy', 'regex'],
    default_theme: 'dark'
  }
});

const DEFAULT_UI = Object.freeze({
  hide_topbar_on_scroll: false,
  show_floating_logo: false,
  show_bottom_bar: true,
  show_bottom_search: true,
  card_style: 'rolling',
  hero_style: 'panning_panorama',
  search_mode: ['fuzzy', 'regex'],
  default_theme: 'dark'
});

const DEFAULT_ROUTES = Object.freeze({
  assistance: { kind: 'spa', hash: '#assistance' },
  home: { kind: 'spa', hash: '#home' },
  docs: { kind: 'spa', hash: '#docs' },
  download: { kind: 'spa', hash: '#download' },
  search: { kind: 'spa', hash: '#search' },
  upload: { kind: 'spa', hash: '#upload' },
  request: { kind: 'spa', hash: '#request' },
  sponsor: { kind: 'spa', hash: '#sponsor' },
  report: { kind: 'spa', hash: '#report' },
  review: { kind: 'spa', hash: '#review' },
  share: { kind: 'action', action: 'share' },
  disclaimer: { kind: 'spa', hash: '#disclaimer' },
  devices: { kind: 'spa', hash: '#devices' },
  platforms: { kind: 'spa', hash: '#platforms' },
  terminal: { kind: 'spa', hash: '#terminal' },
  iwl: { kind: 'spa', hash: '#iwl' },
  developers: {
    kind: 'document',
    path: DEFAULT_PATHS.developerListing,
    external: false
  }
});

const DEFAULT_ASSET_PATHS = Object.freeze({
  css: {
    root: DEFAULT_PATHS.cssRoot,
    main: DEFAULT_PATHS.cssMain,
    tokens: DEFAULT_PATHS.cssTokens,
    base: DEFAULT_PATHS.cssBase,
    text: DEFAULT_PATHS.cssText,
    layout: DEFAULT_PATHS.cssLayout,
    panoramic: DEFAULT_PATHS.cssPanoramic
  },
  js: {
    app: DEFAULT_PATHS.appScript,
    config: DEFAULT_PATHS.configScript,
    data: DEFAULT_PATHS.dataScript
  },
  images: {
    panoramicBackground: 'assets/img/panoramic-bg.jpg'
  },
  payloads: {
    root: DEFAULT_PATHS.payloadRoot,
    manifest: DEFAULT_PATHS.payloadManifest,
    docsManifest: DEFAULT_PATHS.docsManifest
  }
});

const BUILTIN_RESOURCES = Object.freeze({
  site: {
    path: DEFAULT_PATHS.siteConfig,
    required: true,
    fallback: DEFAULT_SITE,
    validate: validateSite
  },
  forms: {
    path: DEFAULT_PATHS.formsConfig,
    required: false,
    fallback: { forms: {} },
    validate: validateRecord
  },
  platforms: {
    path: DEFAULT_PATHS.platformsConfig,
    required: false,
    fallback: { platforms: [] },
    validate: validateRecord
  },
  devices: {
    path: DEFAULT_PATHS.devicesConfig,
    required: false,
    fallback: { devices: [] },
    validate: validateJsonValue
  },
  scriptsConfig: {
    path: DEFAULT_PATHS.scriptsConfig,
    required: false,
    fallback: { categories: [] },
    validate: validateRecord
  },
  categories: {
    path: DEFAULT_PATHS.categoriesData,
    required: false,
    fallback: {},
    validate: validateJsonValue
  },
  payloadManifest: {
    path: DEFAULT_PATHS.payloadManifest,
    required: false,
    fallback: [],
    validate: validateManifest
  },
  docsManifest: {
    path: DEFAULT_PATHS.docsManifest,
    required: false,
    fallback: [],
    validate: validateManifest
  }
});

const resourceRegistry = new Map(
  Object.entries(BUILTIN_RESOURCES).map(([name, definition]) => [
    name,
    normalizeResourceDefinition(name, definition)
  ])
);

const resourceCache = new Map();
const resourceInflight = new Map();
const configCache = new Map();
const configInflight = new Map();

function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function clone(value) {
  if (value === undefined) return undefined;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function deepMerge(base, override) {
  if (Array.isArray(base)) {
    return Array.isArray(override) ? clone(override) : clone(base);
  }

  if (!isPlainObject(base)) {
    return override === undefined ? base : clone(override);
  }

  const output = clone(base) ?? {};
  if (!isPlainObject(override)) return output;

  for (const [key, value] of Object.entries(override)) {
    output[key] =
      isPlainObject(output[key]) && isPlainObject(value)
        ? deepMerge(output[key], value)
        : clone(value);
  }

  return output;
}

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

function normalizeText(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const text = value.trim();
  return text || fallback;
}

function normalizeKey(value, fallback = '') {
  return normalizeText(value, fallback)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function identity(value) {
  return value;
}

function normalizeResourceName(name) {
  if (typeof name !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(name)) {
    throw new ConfigError(`Invalid resource name: ${String(name)}`, {
      code: 'INVALID_RESOURCE_NAME'
    });
  }
  return name;
}

function normalizeRelativePath(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ConfigError('A non-empty relative path is required.', {
      code: 'INVALID_PATH'
    });
  }

  const input = value.trim().replaceAll('\\', '/');

  if (/^[a-z][a-z\d+.-]*:/i.test(input) || input.startsWith('//')) {
    throw new ConfigError(`Absolute/protocol URL not permitted: ${value}`, {
      code: 'ABSOLUTE_PATH_NOT_ALLOWED',
      path: value
    });
  }

  const parts = input.replace(/^\/+/, '').split('/');
  const stack = [];

  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (!stack.length) {
        throw new ConfigError(`Path escapes the application root: ${value}`, {
          code: 'PATH_ESCAPE',
          path: value
        });
      }
      stack.pop();
      continue;
    }
    stack.push(part);
  }

  return stack.join('/');
}

function normalizeResourceDefinition(name, definition = {}) {
  if (!isPlainObject(definition)) {
    throw new ConfigError(`Resource definition must be an object: ${name}`, {
      code: 'INVALID_RESOURCE_DEFINITION',
      resource: name
    });
  }

  const path = normalizeRelativePath(definition.path);

  return {
    path,
    required: Boolean(definition.required),
    fallback: 'fallback' in definition ? definition.fallback : undefined,
    validate: typeof definition.validate === 'function' ? definition.validate : validateJsonValue,
    transform: typeof definition.transform === 'function' ? definition.transform : identity,
    maxBytes:
      Number.isFinite(definition.maxBytes) && definition.maxBytes > 0
        ? Math.floor(definition.maxBytes)
        : DEFAULT_MAX_JSON_BYTES
  };
}

function validateJsonValue(value) {
  if (value === undefined) {
    throw new ConfigError('JSON resource returned undefined.', {
      code: 'INVALID_JSON_VALUE'
    });
  }
  return value;
}

function validateRecord(value) {
  if (!isPlainObject(value)) {
    throw new ConfigError('Expected a JSON object.', { code: 'INVALID_OBJECT' });
  }
  return value;
}

function validateManifest(value) {
  if (!Array.isArray(value) && !isPlainObject(value)) {
    throw new ConfigError('Expected a manifest array or object.', {
      code: 'INVALID_MANIFEST'
    });
  }
  return value;
}

function validateSite(value) {
  if (!isPlainObject(value)) {
    throw new ConfigError('site.json must contain a JSON object.', {
      code: 'INVALID_SITE'
    });
  }

  if ('schema_version' in value) {
    const version = Number(value.schema_version);
    if (!Number.isInteger(version) || version < 1) {
      throw new ConfigError('site.json schema_version must be a positive integer.', {
        code: 'INVALID_SCHEMA_VERSION'
      });
    }
    if (version > CONFIG_SCHEMA_VERSION) {
      throw new ConfigError(
        `Unsupported site.json schema_version ${version}; loader supports ${CONFIG_SCHEMA_VERSION}.`,
        { code: 'UNSUPPORTED_SCHEMA_VERSION' }
      );
    }
  }

  if ('navigation' in value && !Array.isArray(value.navigation)) {
    throw new ConfigError('site.json navigation must be an array.', {
      code: 'INVALID_NAVIGATION'
    });
  }

  if ('quick_actions' in value && !Array.isArray(value.quick_actions)) {
    throw new ConfigError('site.json quick_actions must be an array.', {
      code: 'INVALID_QUICK_ACTIONS'
    });
  }

  if ('ui' in value && !isPlainObject(value.ui)) {
    throw new ConfigError('site.json ui must be an object.', {
      code: 'INVALID_UI'
    });
  }

  if ('routes' in value && !isPlainObject(value.routes)) {
    throw new ConfigError('site.json routes must be an object.', {
      code: 'INVALID_ROUTES'
    });
  }

  if ('resources' in value && !isPlainObject(value.resources)) {
    throw new ConfigError('site.json resources must be an object.', {
      code: 'INVALID_RESOURCES'
    });
  }

  if ('data_sources' in value && !isPlainObject(value.data_sources)) {
    throw new ConfigError('site.json data_sources must be an object.', {
      code: 'INVALID_DATA_SOURCES'
    });
  }

  return value;
}

function deriveRootFromModule(moduleUrl) {
  const url = new URL(moduleUrl);
  const path = url.pathname;
  const markerIndex = path.lastIndexOf(APP_MODULE_MARKER);

  if (markerIndex >= 0) {
    const root = new URL(url.href);
    root.pathname = path.slice(0, markerIndex + 1);
    root.search = '';
    root.hash = '';
    return ensureTrailingSlash(root);
  }

  return ensureTrailingSlash(new URL('../../', url));
}

const MODULE_ROOT_URL = deriveRootFromModule(import.meta.url);

function ensureTrailingSlash(url) {
  const normalized = new URL(url.href || url);
  if (!normalized.pathname.endsWith('/')) normalized.pathname += '/';
  normalized.search = '';
  normalized.hash = '';
  return normalized;
}

function getMetaRootOverride() {
  if (typeof document === 'undefined') return null;
  const meta = document.querySelector(
    'meta[name="infinity-app-root"], meta[name="application-root"], meta[data-infinity-app-root]'
  );
  return meta?.content?.trim() || null;
}

function getGlobalRootOverride() {
  const value = globalThis.__INFINITY_APP_ROOT__ ?? globalThis.__INFINITY_BASE_URL__;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getConfiguredRootUrl(explicitRoot) {
  const raw = explicitRoot || getGlobalRootOverride() || getMetaRootOverride();
  if (!raw) return MODULE_ROOT_URL;

  try {
    return ensureTrailingSlash(
      new URL(raw, typeof location !== 'undefined' ? location.href : MODULE_ROOT_URL.href)
    );
  } catch (error) {
    throw new ConfigError(`Invalid application root URL: ${raw}`, {
      code: 'INVALID_APP_ROOT',
      cause: error
    });
  }
}

export function getAppRoot(explicitRoot = null) {
  return getConfiguredRootUrl(explicitRoot);
}

export function resolveAppUrl(path, root = getAppRoot()) {
  if (typeof path !== 'string') {
    throw new ConfigError('resolveAppUrl() requires a string path.', {
      code: 'INVALID_PATH'
    });
  }

  const trimmed = path.trim();
  if (/^(?:https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('#')) return trimmed;

  return new URL(normalizeRelativePath(trimmed), ensureTrailingSlash(new URL(root.href))).href;
}

function createAbortController(timeoutMs, externalSignal) {
  const controller = new AbortController();
  let timeoutId = null;

  const abortFromExternal = () => controller.abort(externalSignal?.reason);

  if (externalSignal) {
    if (externalSignal.aborted) controller.abort(externalSignal.reason);
    else externalSignal.addEventListener('abort', abortFromExternal, { once: true });
  }

  if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      const reason =
        typeof DOMException === 'function'
          ? new DOMException('Configuration request timed out.', 'TimeoutError')
          : Object.assign(new Error('Configuration request timed out.'), { name: 'TimeoutError' });
      controller.abort(reason);
    }, timeoutMs);
  }

  return {
    signal: controller.signal,
    dispose() {
      if (timeoutId !== null) clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', abortFromExternal);
    }
  };
}

async function fetchJson(
  path,
  {
    root,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    cache = DEFAULT_CACHE_MODE,
    signal,
    fetchImpl = globalThis.fetch,
    maxBytes = DEFAULT_MAX_JSON_BYTES,
    resource = ''
  } = {}
) {
  if (typeof fetchImpl !== 'function') {
    throw new ConfigError('No fetch implementation is available in this environment.', {
      code: 'FETCH_UNAVAILABLE',
      resource,
      path
    });
  }

  const url = resolveAppUrl(path, root);
  const abort = createAbortController(timeoutMs, signal);

  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      cache,
      credentials: 'same-origin',
      redirect: 'follow',
      referrerPolicy: 'same-origin',
      headers: { Accept: 'application/json' },
      signal: abort.signal
    });

    if (!response?.ok) {
      throw new ConfigError(
        `Failed to load ${resource || path}: HTTP ${response?.status ?? 'unknown'} ${response?.statusText ?? ''}`.trim(),
        { code: 'HTTP_ERROR', resource, path }
      );
    }

    const contentLength = Number(response.headers?.get?.('content-length'));
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      throw new ConfigError(`JSON resource exceeds ${maxBytes} bytes: ${path}`, {
        code: 'RESOURCE_TOO_LARGE',
        resource,
        path
      });
    }

    const text = await response.text();
    const byteLength =
      typeof TextEncoder === 'function'
        ? new TextEncoder().encode(text).byteLength
        : text.length;

    if (byteLength > maxBytes) {
      throw new ConfigError(`JSON resource exceeds ${maxBytes} bytes: ${path}`, {
        code: 'RESOURCE_TOO_LARGE',
        resource,
        path
      });
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      throw new ConfigError(`Invalid JSON in ${path}`, {
        code: 'INVALID_JSON',
        resource,
        path,
        cause: error
      });
    }
  } catch (error) {
    if (error instanceof ConfigError) throw error;

    const reason = abort.signal.reason;
    const code = abort.signal.aborted
      ? reason?.name === 'TimeoutError' ? 'TIMEOUT' : 'ABORTED'
      : 'NETWORK_ERROR';

    throw new ConfigError(
      `Unable to load ${resource || path}: ${error?.message || String(error)}`,
      { code, resource, path, cause: error }
    );
  } finally {
    abort.dispose();
  }
}

function createDiagnostics(root) {
  return {
    ok: true,
    degraded: false,
    startedAt: new Date().toISOString(),
    completedAt: null,
    durationMs: null,
    root: root.href,
    warnings: [],
    errors: [],
    resources: {}
  };
}

function recordDiagnostic(diagnostics, { level, resource, code, message, path, cause = null }) {
  const item = {
    level,
    resource,
    code,
    message,
    path: path || undefined,
    cause: cause?.message || undefined,
    at: new Date().toISOString()
  };

  if (level === 'error') diagnostics.errors.push(item);
  else diagnostics.warnings.push(item);
  return item;
}

function applyValidation(definition, rawValue, resourceName) {
  const validate = typeof definition.validate === 'function' ? definition.validate : validateJsonValue;
  const transform = typeof definition.transform === 'function' ? definition.transform : identity;
  const validated = validate(rawValue);
  const value = transform(validated);

  if (value === undefined) {
    throw new ConfigError(`Resource transformer returned undefined: ${resourceName}`, {
      code: 'TRANSFORM_UNDEFINED',
      resource: resourceName,
      path: definition.path
    });
  }

  return value;
}

function getResourceCacheKey(root, name, definition) {
  return `${root.href}|${name}|${definition.path}`;
}

async function loadRegisteredResource(
  name,
  {
    root,
    registry = resourceRegistry,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    cache = DEFAULT_CACHE_MODE,
    signal,
    fetchImpl,
    diagnostics,
    forceReload = false
  } = {}
) {
  const definition = registry.get(name);

  if (!definition) {
    throw new ConfigError(`Unknown configuration resource: ${name}`, {
      code: 'UNKNOWN_RESOURCE',
      resource: name
    });
  }

  const cacheKey = getResourceCacheKey(root, name, definition);

  if (!forceReload && resourceCache.has(cacheKey)) {
    const cached = resourceCache.get(cacheKey);
    if (diagnostics) {
      diagnostics.resources[name] = {
        name,
        path: definition.path,
        required: Boolean(definition.required),
        loaded: !cached.fallback,
        fallback: Boolean(cached.fallback),
        ok: true,
        cached: true,
        startedAt: null,
        completedAt: new Date(cached.loadedAt).toISOString()
      };
    }
    return cached.value;
  }

  if (!forceReload && resourceInflight.has(cacheKey)) {
    return resourceInflight.get(cacheKey);
  }

  const promise = (async () => {
    const status = {
      name,
      path: definition.path,
      required: Boolean(definition.required),
      loaded: false,
      fallback: false,
      ok: false,
      cached: false,
      startedAt: new Date().toISOString(),
      completedAt: null
    };

    if (diagnostics) diagnostics.resources[name] = status;

    try {
      const raw = await fetchJson(definition.path, {
        root,
        timeoutMs,
        cache,
        signal,
        fetchImpl,
        maxBytes: definition.maxBytes,
        resource: name
      });

      const value = applyValidation(definition, raw, name);
      resourceCache.set(cacheKey, {
        value,
        loadedAt: Date.now(),
        path: definition.path,
        fallback: false
      });

      status.loaded = true;
      status.ok = true;
      status.completedAt = new Date().toISOString();
      return value;
    } catch (error) {
      const configError =
        error instanceof ConfigError
          ? error
          : new ConfigError(String(error), {
              resource: name,
              path: definition.path,
              cause: error
            });

      if ('fallback' in definition && definition.fallback !== undefined) {
        const fallbackValue = applyValidation(
          definition,
          clone(definition.fallback),
          `${name}:fallback`
        );

        resourceCache.set(cacheKey, {
          value: fallbackValue,
          loadedAt: Date.now(),
          path: definition.path,
          fallback: true
        });

        status.fallback = true;
        status.ok = true;
        status.completedAt = new Date().toISOString();

        if (diagnostics) {
          recordDiagnostic(diagnostics, {
            level: 'warning',
            resource: name,
            code: configError.code,
            message: `Using fallback for ${name}: ${configError.message}`,
            path: definition.path,
            cause: configError
          });
        }

        return fallbackValue;
      }

      status.completedAt = new Date().toISOString();

      if (diagnostics) {
        recordDiagnostic(diagnostics, {
          level: 'error',
          resource: name,
          code: configError.code,
          message: configError.message,
          path: definition.path,
          cause: configError
        });
      }

      throw configError;
    }
  })();

  resourceInflight.set(cacheKey, promise);

  try {
    return await promise;
  } finally {
    resourceInflight.delete(cacheKey);
  }
}

function isHttpUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim());
}

function normalizeNavigation(rawNavigation, routes) {
  const source = Array.isArray(rawNavigation) ? rawNavigation : [];
  const output = [];
  const seen = new Set();

  for (const item of source) {
    if (!isPlainObject(item)) continue;

    const key = normalizeKey(item.key ?? item.id ?? item.route, '');
    if (!key || seen.has(key)) continue;

    const routeInfo = routes[key];
    const rawHref = normalizeText(item.href, '');
    const rawRoute = normalizeText(item.route, '');
    const isDeveloper = key === 'developers';

    let href;
    let kind;
    let external = false;

    if (isDeveloper) {
      href = DEFAULT_PATHS.developerListing;
      kind = 'document';
    } else if (rawHref) {
      href = rawHref;
      external = isHttpUrl(rawHref);
      kind = item.kind || (external || !rawHref.startsWith('#') ? 'document' : 'spa');
    } else if (routeInfo?.kind === 'document') {
      href = routeInfo.path;
      kind = 'document';
    } else if (routeInfo?.kind === 'action') {
      href = `#${key}`;
      kind = 'action';
    } else {
      href = rawRoute ? `#${rawRoute.replace(/^#/, '')}` : `#${key}`;
      kind = item.kind || 'spa';
    }

    output.push({
      ...clone(item),
      key,
      label: normalizeText(item.label, key),
      icon: normalizeText(item.icon, ''),
      href,
      route: rawRoute.replace(/^#/, '') || (kind === 'spa' ? key : ''),
      kind,
      external,
      visible: item.visible !== false,
      target: normalizeText(item.target, external ? '_blank' : '_self'),
      rel: normalizeText(item.rel, external ? 'noopener noreferrer' : '')
    });

    seen.add(key);
  }

  const developerItem = {
    key: 'developers',
    label: 'Hire Developers',
    icon: 'code',
    href: DEFAULT_PATHS.developerListing,
    route: '',
    kind: 'document',
    external: false,
    visible: true,
    target: '_self',
    rel: ''
  };

  const developerIndex = output.findIndex(item => item.key === 'developers');

  if (developerIndex === -1) output.push(developerItem);
  else {
    const existing = output[developerIndex];
    output[developerIndex] = {
      ...existing,
      ...developerItem,
      label: normalizeText(existing.label, developerItem.label)
    };
  }

  return output;
}

function normalizeQuickActions(rawQuickActions) {
  if (!Array.isArray(rawQuickActions)) return clone(DEFAULT_SITE.quick_actions);

  const output = [];
  const seen = new Set();

  for (const item of rawQuickActions) {
    if (!isPlainObject(item)) continue;

    const key = normalizeKey(item.key ?? item.action, '');
    if (!key || seen.has(key)) continue;
    seen.add(key);

    output.push({
      ...clone(item),
      key,
      label: normalizeText(item.label, key),
      enabled: item.enabled !== false
    });
  }

  return output;
}

function normalizeSearchModes(value) {
  const allowed = new Set(['fuzzy', 'regex', 'exact', 'prefix']);
  const modes = Array.isArray(value) ? value : [];
  const normalized = [...new Set(
    modes.map(item => normalizeKey(item, '')).filter(item => allowed.has(item))
  )];
  return normalized.length ? normalized : [...DEFAULT_UI.search_mode];
}

function normalizeUi(rawUi) {
  const merged = deepMerge(DEFAULT_UI, isPlainObject(rawUi) ? rawUi : {});

  return {
    ...merged,
    hide_topbar_on_scroll: Boolean(merged.hide_topbar_on_scroll),
    show_floating_logo: Boolean(merged.show_floating_logo),
    show_bottom_bar: Boolean(merged.show_bottom_bar),
    show_bottom_search: Boolean(merged.show_bottom_search),
    card_style: normalizeText(merged.card_style, DEFAULT_UI.card_style),
    hero_style: normalizeText(merged.hero_style, DEFAULT_UI.hero_style),
    search_mode: normalizeSearchModes(merged.search_mode),
    default_theme: normalizeText(merged.default_theme, DEFAULT_UI.default_theme)
  };
}

function mergeRouteTables(site) {
  const custom = isPlainObject(site.routes) ? site.routes : {};
  const routes = deepMerge(DEFAULT_ROUTES, custom);

  for (const [key, value] of Object.entries(routes)) {
    if (!isPlainObject(value)) {
      routes[key] = { kind: 'spa', hash: `#${key}` };
      continue;
    }

    if (value.kind === 'spa') {
      const hash = normalizeText(value.hash, `#${key}`);
      value.hash = hash.startsWith('#') ? hash : `#${hash}`;
    }
  }

  routes.developers = {
    ...(routes.developers || {}),
    kind: 'document',
    path: DEFAULT_PATHS.developerListing,
    external: false
  };

  return routes;
}

function normalizeSite(rawSite) {
  const site = deepMerge(DEFAULT_SITE, isPlainObject(rawSite) ? rawSite : {});
  const routes = mergeRouteTables(site);

  site.schema_version = Number.isInteger(Number(site.schema_version))
    ? Number(site.schema_version)
    : CONFIG_SCHEMA_VERSION;
  site.site_name = normalizeText(site.site_name, DEFAULT_SITE.site_name);
  site.description = normalizeText(site.description, DEFAULT_SITE.description);
  site.entrypoint = DEFAULT_PATHS.appDocument;
  site.default_route = normalizeKey(
    site.default_route ?? site.defaultRoute ?? site.routing?.default_route ?? DEFAULT_SITE.default_route,
    DEFAULT_SITE.default_route
  );

  if (!routes[site.default_route] || routes[site.default_route].kind !== 'spa') {
    site.default_route = DEFAULT_SITE.default_route;
  }

  site.navigation = normalizeNavigation(site.navigation, routes);
  site.quick_actions = normalizeQuickActions(site.quick_actions);
  site.ui = normalizeUi(site.ui);
  site.routes = routes;

  return site;
}

function validateSlug(slug) {
  const value = normalizeText(slug, '');
  if (!/^[a-z0-9][a-z0-9_-]{0,127}$/i.test(value)) {
    throw new ConfigError(`Invalid slug: ${slug}`, { code: 'INVALID_SLUG' });
  }
  return value;
}

function createUrls(root, paths) {
  const url = path => resolveAppUrl(path, root);

  return {
    root: root.href,
    home: url(paths.appDocument),
    app: url(paths.legacySpaDocument),
    appScript: url(paths.appScript),
    config: url(paths.siteConfig),
    developerListing: url(paths.developerListing),
    developerRoot: url(paths.developerRoot),
    developerProfile(slug) {
      return url(`${paths.developerProfileIndex}?name=${encodeURIComponent(validateSlug(slug))}`);
    },
    developerJson(slug) {
      const safeSlug = validateSlug(slug);
      return url(`${paths.developerRoot}${safeSlug}/index.json`);
    },
    renderer: url(paths.renderer),
    forms: url(paths.formsConfig),
    platforms: url(paths.platformsConfig),
    devices: url(paths.devicesConfig),
    scriptsConfig: url(paths.scriptsConfig),
    payloadManifest: url(paths.payloadManifest),
    docsManifest: url(paths.docsManifest),
    categories: url(paths.categoriesData)
  };
}

function buildRouteHelpers(routes) {
  const routeByKey = new Map(Object.entries(routes));

  function getRoute(key) {
    return routeByKey.get(normalizeKey(key, '')) || null;
  }

  function hrefFor(key, params = null) {
    const normalized = normalizeKey(key, '');
    const route = getRoute(normalized);
    if (!route) return `#${normalized}`;

    if (route.kind === 'document') {
      const basePath = route.path || DEFAULT_PATHS.developerListing;
      const query = toQuery(params);
      return query ? `${basePath}?${query}` : basePath;
    }

    if (route.kind === 'action') return `#${normalized}`;

    const hash = normalizeText(route.hash, `#${normalized}`);
    const query = toQuery(params);
    return query ? `${hash.split('?')[0]}?${query}` : hash;
  }

  return {
    getRoute,
    hrefFor,
    routeKeys: [...routeByKey.keys()]
  };
}

function toQuery(params) {
  if (!params || typeof params !== 'object' || Array.isArray(params)) return '';
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) query.set(key, String(value));
  }
  return query.toString();
}

function buildNavigationIndex(navigation) {
  const byKey = new Map(navigation.map(item => [item.key, item]));
  return {
    get(key) { return byKey.get(normalizeKey(key, '')) || null; },
    has(key) { return byKey.has(normalizeKey(key, '')); },
    all() { return navigation.filter(item => item.visible !== false); }
  };
}

function buildPathAccessors(root, paths) {
  return {
    ...clone(paths),
    resolve(value) { return resolveAppUrl(value, root); },
    relative(value) { return normalizeRelativePath(value); }
  };
}

function buildDataView(data) {
  return {
    forms: data.forms,
    platforms: data.platforms,
    devices: data.devices,
    scriptsConfig: data.scriptsConfig,
    categories: data.categories,
    payloadManifest: data.payloadManifest,
    docsManifest: data.docsManifest
  };
}

function getSiteExtraDefinitions(site) {
  const extras = isPlainObject(site.resources)
    ? site.resources
    : isPlainObject(site.data_sources)
      ? site.data_sources
      : {};

  return Object.entries(extras).map(([name, definition]) => [
    normalizeResourceName(name),
    normalizeResourceDefinition(name, definition)
  ]);
}

function buildResourceRegistry(site, options) {
  const registry = new Map(resourceRegistry);
  const extras = getSiteExtraDefinitions(site);

  for (const [name, definition] of extras) registry.set(name, definition);

  if (options.registerExtraResources !== false) {
    for (const [name, definition] of extras) {
      if (!resourceRegistry.has(name)) resourceRegistry.set(name, definition);
    }
  }

  return registry;
}

async function buildConfig(options) {
  const root = getConfiguredRootUrl(options.root || null);
  const diagnostics = createDiagnostics(root);
  const registry = new Map(resourceRegistry);

  const site = await loadRegisteredResource('site', {
    root,
    registry,
    timeoutMs: options.timeoutMs,
    cache: options.cache,
    signal: options.signal,
    fetchImpl: options.fetchImpl,
    diagnostics,
    forceReload: options.forceReload
  });

  const normalizedSite = normalizeSite(site);
  const effectiveRegistry = buildResourceRegistry(normalizedSite, options);

  const requested = Array.isArray(options.include) && options.include.length
    ? options.include.map(normalizeResourceName)
    : [...effectiveRegistry.keys()];

  const resourcesToLoad = new Set(requested);
  resourcesToLoad.add('site');
  resourcesToLoad.delete('site');

  const resourceEntries = [...resourcesToLoad].map(name => [
    name,
    loadRegisteredResource(name, {
      root,
      registry: effectiveRegistry,
      timeoutMs: options.timeoutMs,
      cache: options.cache,
      signal: options.signal,
      fetchImpl: options.fetchImpl,
      diagnostics,
      forceReload: options.forceReload
    })
  ]);

  const settled = await Promise.all(resourceEntries.map(async ([name, promise]) => {
    try {
      return [name, await promise, null];
    } catch (error) {
      return [name, undefined, error];
    }
  }));

  const data = { site: normalizedSite };
  const resourceErrors = [];

  for (const [name, value, error] of settled) {
    if (error) resourceErrors.push(error);
    else data[name] = value;
  }

  const fatal = resourceErrors.filter(error => effectiveRegistry.get(error.resource)?.required);
  if (fatal.length) {
    throw new ConfigAggregateError(
      'One or more required configuration resources failed to load.',
      fatal
    );
  }

  const paths = buildPathAccessors(root, DEFAULT_PATHS);
  const urls = createUrls(root, DEFAULT_PATHS);
  const navigation = normalizedSite.navigation;
  const quickActions = normalizedSite.quick_actions;
  const ui = normalizedSite.ui;
  const routes = normalizedSite.routes;
  const routeApi = buildRouteHelpers(routes);
  const navigationApi = buildNavigationIndex(navigation);

  const config = {
    schemaVersion: CONFIG_SCHEMA_VERSION,
    site: normalizedSite,
    paths,
    urls,
    routes,
    navigation,
    quickActions,
    quick_actions: quickActions,
    ui,
    site_name: normalizedSite.site_name,
    entrypoint: normalizedSite.entrypoint,
    defaultRoute: normalizedSite.default_route,
    default_route: normalizedSite.default_route,
    admin_contacts: normalizedSite.admin_contacts || {},
    data: buildDataView(data),
    scriptConfig: data.scriptsConfig,
    payloadManifest: data.payloadManifest,
    docsManifest: data.docsManifest,
    assets: deepMerge(DEFAULT_ASSET_PATHS, isPlainObject(normalizedSite.assets) ? normalizedSite.assets : {}),

    developers: {
      listingPath: DEFAULT_PATHS.developerListing,
      listingUrl: urls.developerListing,
      rootPath: DEFAULT_PATHS.developerRoot,
      rootUrl: urls.developerRoot,
      profilePath: DEFAULT_PATHS.developerProfileIndex,
      profileUrl: urls.developerProfile,
      jsonUrl: urls.developerJson,
      makeProfileHref(slug) {
        return `./index.html?name=${encodeURIComponent(validateSlug(slug))}`;
      },
      makeJsonHref(slug) {
        const safeSlug = validateSlug(slug);
        return `../config/developer/${safeSlug}/index.json`;
      }
    },

    renderer: {
      url: urls.renderer,
      page: urls.renderer,
      componentsPath: DEFAULT_PATHS.rendererComponents,
      uiPath: DEFAULT_PATHS.rendererUi,
      funcsPath: DEFAULT_PATHS.rendererFuncs
    },

    isolated: {
      ghost: {
        root: DEFAULT_PATHS.isolatedGhostRoot,
        manifest: DEFAULT_PATHS.isolatedGhostManifest,
        paths: DEFAULT_PATHS.isolatedGhostPaths
      }
    },

    navigationApi,
    routeApi,

    get(keyPath, fallback = undefined) {
      return getByPath(config, keyPath, fallback);
    },
    has(keyPath) {
      return getByPath(config, keyPath, MISSING) !== MISSING;
    },
    url(path) {
      return resolveAppUrl(path, root);
    },
    href(key, params = null) {
      return routeApi.hrefFor(key, params);
    },

    async loadResource(name, resourceOptions = {}) {
      const normalizedName = normalizeResourceName(name);
      return loadRegisteredResource(normalizedName, {
        root: getConfiguredRootUrl(resourceOptions.root || root),
        registry: effectiveRegistry,
        timeoutMs: resourceOptions.timeoutMs ?? options.timeoutMs,
        cache: resourceOptions.cache ?? options.cache,
        signal: resourceOptions.signal,
        fetchImpl: resourceOptions.fetchImpl ?? options.fetchImpl,
        diagnostics,
        forceReload: Boolean(resourceOptions.forceReload)
      });
    },

    async loadDeveloper(slug, developerOptions = {}) {
      const safeSlug = validateSlug(slug);
      const path = `${DEFAULT_PATHS.developerRoot}${safeSlug}/index.json`;
      const developer = await fetchJson(path, {
        root: getConfiguredRootUrl(developerOptions.root || root),
        timeoutMs: developerOptions.timeoutMs ?? options.timeoutMs,
        cache: developerOptions.cache ?? options.cache,
        signal: developerOptions.signal,
        fetchImpl: developerOptions.fetchImpl ?? options.fetchImpl,
        maxBytes: developerOptions.maxBytes ?? DEFAULT_MAX_JSON_BYTES,
        resource: `developer:${safeSlug}`
      });

      if (!isPlainObject(developer)) {
        throw new ConfigError(`Developer profile must be a JSON object: ${safeSlug}`, {
          code: 'INVALID_DEVELOPER_PROFILE',
          resource: `developer:${safeSlug}`,
          path
        });
      }

      return developer;
    },

    diagnostics
  };

  for (const [name, value] of Object.entries(data)) {
    if (name !== 'site' && !(name in config.data)) config.data[name] = value;
  }

  diagnostics.completedAt = new Date().toISOString();
  diagnostics.durationMs = Date.parse(diagnostics.completedAt) - Date.parse(diagnostics.startedAt);
  diagnostics.degraded = diagnostics.warnings.length > 0 || diagnostics.errors.length > 0;
  diagnostics.ok = diagnostics.errors.length === 0;

  deepFreeze(config.site);
  deepFreeze(config.navigation);
  deepFreeze(config.quickActions);
  deepFreeze(config.ui);
  deepFreeze(config.routes);
  deepFreeze(config.assets);

  return config;
}

function getByPath(source, keyPath, fallback = undefined) {
  if (typeof keyPath !== 'string' || !keyPath.trim()) return fallback;
  const parts = keyPath.split('.').filter(Boolean);
  let current = source;

  for (const part of parts) {
    if (current === null || current === undefined || !(part in Object(current))) return fallback;
    current = current[part];
  }

  return current;
}

function configCacheKey(options) {
  const root = getConfiguredRootUrl(options.root || null).href;
  const include = Array.isArray(options.include) && options.include.length
    ? options.include.map(normalizeResourceName).sort().join(',')
    : '*';
  return `${root}|${include}`;
}

export function registerConfigResource(name, definition) {
  const normalizedName = normalizeResourceName(name);
  resourceRegistry.set(normalizedName, normalizeResourceDefinition(normalizedName, definition));
  resetConfigCache();
  return normalizedName;
}

export function unregisterConfigResource(name) {
  const normalizedName = normalizeResourceName(name);
  if (Object.prototype.hasOwnProperty.call(BUILTIN_RESOURCES, normalizedName)) {
    throw new ConfigError(`Cannot unregister built-in resource: ${normalizedName}`, {
      code: 'BUILTIN_RESOURCE'
    });
  }
  resourceRegistry.delete(normalizedName);
  resetConfigCache();
}

export function listConfigResources() {
  return [...resourceRegistry.entries()].map(([name, definition]) => ({
    name,
    path: definition.path,
    required: Boolean(definition.required)
  }));
}

export async function loadConfig(options = {}) {
  const normalizedOptions = {
    root: options.root || null,
    timeoutMs: Number.isFinite(options.timeoutMs) && options.timeoutMs > 0 ? options.timeoutMs : DEFAULT_TIMEOUT_MS,
    cache: options.cache || DEFAULT_CACHE_MODE,
    signal: options.signal,
    fetchImpl: options.fetchImpl || globalThis.fetch,
    include: options.include,
    forceReload: Boolean(options.forceReload),
    registerExtraResources: options.registerExtraResources !== false
  };

  const key = configCacheKey(normalizedOptions);

  if (!normalizedOptions.forceReload && configInflight.has(key)) {
    return configInflight.get(key);
  }

  if (!normalizedOptions.forceReload && configCache.has(key)) {
    return configCache.get(key);
  }

  const promise = buildConfig(normalizedOptions);
  configInflight.set(key, promise);

  try {
    const config = await promise;
    if (!normalizedOptions.forceReload) configCache.set(key, config);
    return config;
  } finally {
    configInflight.delete(key);
  }
}

export function getConfig(options = {}) {
  return loadConfig(options);
}

export function getCachedConfig(options = {}) {
  try {
    return configCache.get(configCacheKey(options)) || null;
  } catch {
    return null;
  }
}

export function resetConfigCache() {
  configCache.clear();
  configInflight.clear();
  resourceCache.clear();
  resourceInflight.clear();
}

export async function loadJsonResource(path, options = {}) {
  return fetchJson(path, {
    root: getConfiguredRootUrl(options.root || null),
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    cache: options.cache ?? DEFAULT_CACHE_MODE,
    signal: options.signal,
    fetchImpl: options.fetchImpl ?? globalThis.fetch,
    maxBytes: options.maxBytes ?? DEFAULT_MAX_JSON_BYTES,
    resource: options.resource || path
  });
}

export function createConfigLoader(options = {}) {
  const defaults = { ...options };

  return {
    load(extra = {}) {
      return loadConfig({ ...defaults, ...extra });
    },
    root() {
      return getConfiguredRootUrl(defaults.root || null);
    },
    url(path) {
      return resolveAppUrl(path, getConfiguredRootUrl(defaults.root || null));
    },
    resource(name, extra = {}) {
      return loadConfig({ ...defaults, ...extra }).then(config => config.loadResource(name, extra));
    }
  };
}
