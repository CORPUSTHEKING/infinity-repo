export function renderSearchDock() {
  return `
    <div class="inf-searchdock" data-inf-searchdock>
      <button type="button" class="inf-searchfab" data-inf-search-toggle aria-label="Open search">⌕</button>
      <div class="inf-searchpanel" data-inf-searchpanel hidden>
        <input type="search" data-inf-search-input placeholder="Search scripts, authors, shells, descriptions..." />
        <button type="button" data-inf-search-filters>filters</button>
      </div>
    </div>
  `;
}

export function bindSearchDock({
  dock,
  panel,
  input,
  toggleButton,
  onChange,
  onOpen,
  onClose
} = {}) {
  if (!dock || !panel || !input || !toggleButton) {
    return {
      open() {},
      close() {},
      toggle() {},
      isOpen() {
        return false;
      }
    };
  }

  const sync = () => {
    const open = dock.classList.contains('is-open');
    panel.hidden = !open;
  };

  const open = () => {
    dock.classList.add('is-open');
    sync();
    input.focus();
    onOpen?.();
  };

  const close = () => {
    dock.classList.remove('is-open');
    sync();
    onClose?.();
  };

  const toggle = () => {
    if (dock.classList.contains('is-open')) close();
    else open();
  };

  toggleButton.addEventListener('click', toggle);
  input.addEventListener('input', () => onChange?.(input.value));
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });

  document.addEventListener(
    'pointerdown',
    (event) => {
      if (!dock.classList.contains('is-open')) return;
      if (dock.contains(event.target) || toggleButton.contains(event.target)) return;
      close();
    },
    { capture: true }
  );

  sync();

  return {
    open,
    close,
    toggle,
    isOpen() {
      return dock.classList.contains('is-open');
    },
    setValue(value = '') {
      input.value = value;
      onChange?.(value);
    }
  };
}
