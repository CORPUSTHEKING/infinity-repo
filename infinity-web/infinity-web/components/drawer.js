export function renderDrawer(config = {}) {
  const nav = Array.isArray(config.navigation) ? config.navigation : [];
  const admin = config.admin_contacts || {};
  const siteName = config.site_name || 'Infinity';

  return `
    <aside class="inf-drawer" data-inf-drawer hidden>
      <div class="inf-drawer-head">
        <strong>${siteName}</strong>
        <span>Admin: ${admin.primary_email || ''}</span>
      </div>
      <nav class="inf-drawer-nav" aria-label="Primary">
        ${nav.map((item) => `<a href="#${item.key}" data-route="${item.key}">${item.label}</a>`).join('')}
      </nav>
    </aside>
  `;
}

export function bindDrawerToggle({ drawer, button } = {}) {
  if (!drawer || !button) {
    return {
      open() {},
      close() {},
      toggle() {},
      isOpen() {
        return false;
      }
    };
  }

  const open = () => {
    drawer.hidden = false;
  };

  const close = () => {
    drawer.hidden = true;
  };

  const toggle = () => {
    drawer.hidden = !drawer.hidden;
  };

  button.addEventListener('click', toggle);

  document.addEventListener(
    'pointerdown',
    (event) => {
      if (drawer.hidden) return;
      if (drawer.contains(event.target) || button.contains(event.target)) return;
      close();
    },
    { capture: true }
  );

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });

  return {
    open,
    close,
    toggle,
    isOpen() {
      return !drawer.hidden;
    }
  };
}
