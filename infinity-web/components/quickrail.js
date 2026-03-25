const DEFAULT_ACTIONS = [
  { key: 'download', label: 'scripts' },
  { key: 'share', label: 'share' },
  { key: 'request', label: 'request' },
  { key: 'disclaimer', label: 'configs' }
];

export function renderQuickRail(config = {}) {
  const actions = Array.isArray(config.quick_actions) && config.quick_actions.length
    ? config.quick_actions
    : DEFAULT_ACTIONS;

  return `
    <nav class="inf-quickrail" data-inf-quickrail aria-label="Quick actions">
      <div class="inf-quickrail-scroll">
        ${actions.map((item) => `
          <a href="#${item.key}" data-route="${item.key}">${item.label}</a>
        `).join('')}
      </div>
    </nav>
  `;
}

export function bindQuickRail({ rail, shell, onOpen, onClose } = {}) {
  if (!rail) {
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
    rail.classList.remove('is-hidden');
    rail.classList.remove('is-faded');
    shell?.classList.remove('rail-hidden');
    onOpen?.();
  };

  const close = () => {
    rail.classList.add('is-hidden');
    shell?.classList.add('rail-hidden');
    onClose?.();
  };

  const toggle = () => {
    if (rail.classList.contains('is-hidden')) open();
    else close();
  };

  const updateFade = () => {
    const scrolled = (window.scrollY || 0) > 18;
    rail.classList.toggle('is-faded', scrolled && !rail.classList.contains('is-hidden'));
  };

  document.addEventListener(
    'pointerdown',
    (event) => {
      if (rail.contains(event.target)) return;
      close();
    },
    { capture: true }
  );

  window.addEventListener('scroll', updateFade, { passive: true });
  updateFade();

  open();

  return {
    open,
    close,
    toggle,
    isOpen() {
      return !rail.classList.contains('is-hidden');
    }
  };
}
