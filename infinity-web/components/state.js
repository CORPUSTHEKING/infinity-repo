const DEFAULT_STATE = Object.freeze({
  route: null,
  query: '',
  params: Object.freeze({}),
  ui: Object.freeze({
    quickRailOpen: true,
    drawerOpen: false,
    searchOpen: false
  }),
  lifecycle: 'idle',
  error: null
});

const LIFECYCLES = new Set([
  'idle',
  'booting',
  'ready',
  'navigating',
  'degraded',
  'error'
]);

const UI_KEYS = new Set([
  'quickRailOpen',
  'drawerOpen',
  'searchOpen'
]);

let state = createState(DEFAULT_STATE);
let initialized = false;
const listeners = new Set();

function cloneParams(params) {
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    return Object.freeze({});
  }

  return Object.freeze(
    Object.fromEntries(
      Object.entries(params).map(([key, value]) => [
        String(key),
        value == null ? '' : String(value)
      ])
    )
  );
}

function createState(source = {}) {
  const ui = source.ui && typeof source.ui === 'object'
    ? source.ui
    : {};

  const lifecycle = LIFECYCLES.has(source.lifecycle)
    ? source.lifecycle
    : DEFAULT_STATE.lifecycle;

  return {
    route:
      typeof source.route === 'string' && source.route.trim()
        ? source.route.trim()
        : null,
    query:
      typeof source.query === 'string'
        ? source.query
        : '',
    params: cloneParams(source.params),
    ui: Object.freeze({
      quickRailOpen:
        ui.quickRailOpen ?? DEFAULT_STATE.ui.quickRailOpen,
      drawerOpen:
        ui.drawerOpen ?? DEFAULT_STATE.ui.drawerOpen,
      searchOpen:
        ui.searchOpen ?? DEFAULT_STATE.ui.searchOpen
    }),
    lifecycle,
    error: source.error ?? null
  };
}

function snapshot() {
  return Object.freeze({
    route: state.route,
    query: state.query,
    params: state.params,
    ui: state.ui,
    lifecycle: state.lifecycle,
    error: state.error
  });
}

function hasSameState(a, b) {
  return (
    a.route === b.route &&
    a.query === b.query &&
    a.lifecycle === b.lifecycle &&
    a.error === b.error &&
    a.params === b.params &&
    a.ui === b.ui
  );
}

function notify(previous) {
  const next = snapshot();

  for (const listener of [...listeners]) {
    try {
      listener(next, previous);
    } catch (error) {
      console.error('[Infinity] State listener failed:', error);
    }
  }

  return next;
}

function commit(nextState) {
  const previous = snapshot();
  const next = createState(nextState);

  if (hasSameState(previous, next)) {
    return previous;
  }

  state = next;
  return notify(previous);
}

function requireInitialized() {
  if (!initialized) {
    throw new Error(
      'Infinity state has not been initialized. Call initializeState() during bootstrap.'
    );
  }
}

export function isInitialized() {
  return initialized;
}

export function initializeState(initial = {}) {
  if (initialized) {
    return snapshot();
  }

  initialized = true;

  return commit({
    ...DEFAULT_STATE,
    ...initial,
    ui: {
      ...DEFAULT_STATE.ui,
      ...(initial.ui ?? {})
    }
  });
}

export function getState() {
  requireInitialized();
  return snapshot();
}

export function setRoute(route, query = '', params = {}) {
  requireInitialized();

  return commit({
    ...state,
    route:
      typeof route === 'string' && route.trim()
        ? route.trim()
        : null,
    query:
      typeof query === 'string'
        ? query
        : '',
    params
  });
}

export function setQuery(query = '') {
  requireInitialized();

  return commit({
    ...state,
    query:
      typeof query === 'string'
        ? query
        : ''
  });
}

export function setUI(patch = {}) {
  requireInitialized();

  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    throw new TypeError('[Infinity] UI patch must be an object.');
  }

  const nextUI = { ...state.ui };

  for (const [key, value] of Object.entries(patch)) {
    if (!UI_KEYS.has(key)) {
      throw new Error(`[Infinity] Unknown UI state key: ${key}`);
    }

    if (typeof value !== 'boolean') {
      throw new TypeError(
        `[Infinity] UI state "${key}" must be boolean.`
      );
    }

    nextUI[key] = value;
  }

  return commit({ ...state, ui: nextUI });
}

export function setLifecycle(lifecycle, error = null) {
  requireInitialized();

  if (!LIFECYCLES.has(lifecycle)) {
    throw new Error(`[Infinity] Invalid lifecycle state: ${lifecycle}`);
  }

  return commit({
    ...state,
    lifecycle,
    error
  });
}

export function subscribe(listener) {
  requireInitialized();

  if (typeof listener !== 'function') {
    throw new TypeError('[Infinity] State subscriber must be a function.');
  }

  listeners.add(listener);
  const current = snapshot();
  listener(current, current);

  return () => {
    listeners.delete(listener);
  };
}

export function resetState() {
  requireInitialized();
  return commit(DEFAULT_STATE);
}

export function destroyState() {
  state = createState(DEFAULT_STATE);
  initialized = false;
  listeners.clear();
}
