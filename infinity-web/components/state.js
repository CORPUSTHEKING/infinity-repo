const state = {
  route: 'assistance',
  query: '',
  quickRailOpen: true,
  drawerOpen: false,
  searchOpen: false
};

const listeners = new Set();

function notify() {
  const snapshot = getState();
  for (const listener of listeners) {
    listener(snapshot);
  }
}

export function getState() {
  return { ...state };
}

export function setState(patch = {}) {
  Object.entries(patch).forEach(([key, value]) => {
    if (value !== undefined) state[key] = value;
  });
  notify();
  return getState();
}

export function subscribe(listener) {
  if (typeof listener !== 'function') return () => {};
  listeners.add(listener);
  listener(getState());
  return () => listeners.delete(listener);
}

export function resetState() {
  state.route = 'assistance';
  state.query = '';
  state.quickRailOpen = true;
  state.drawerOpen = false;
  state.searchOpen = false;
  notify();
  return getState();
}
