function bindPersistentScroll(container, key = 'sidebar-scroll') {
  if (!container) return () => {};

  const saved = window.sessionStorage.getItem(key);
  if (saved !== null) {
    container.scrollTop = Number(saved) || 0;
  }

  const onScroll = () => {
    window.sessionStorage.setItem(key, String(container.scrollTop));
  };

  container.addEventListener('scroll', onScroll, { passive: true });

  return () => {
    container.removeEventListener('scroll', onScroll);
  };
}

export function renderSidebar() {
  return `
    <div id="sidebar-overlay" class="sidebar-overlay" aria-hidden="true" tabindex="-1"></div>

    <aside id="modern-sidebar" class="modern-sidebar" aria-label="Sidebar Navigation" aria-hidden="true">
      <div class="sidebar-header">
        <span class="sidebar-title">Infinity</span>
        <button id="close-sidebar" type="button" class="icon-btn" aria-label="Close sidebar">✕</button>
      </div>

      <nav class="sidebar-nav" data-sidebar-scroll>
        <ul class="sidebar-list">
          <li><a href="#assistance" class="sidebar-link">Home</a></li>
          <li><a href="#download" class="sidebar-link">Downloads</a></li>
          <li><a href="#upload" class="sidebar-link">Upload</a></li>
          <li><a href="#search" class="sidebar-link">Search</a></li>
          <li><a href="#sponsor" class="sidebar-link">Sponsor</a></li>
          <li><a href="#report" class="sidebar-link">Report</a></li>
        </ul>
      </nav>
    </aside>
  `;
}

export function bindSidebar(root) {
  const menuBtn = root.querySelector('[data-inf-menu-toggle]');
  const sidebar = root.querySelector('#modern-sidebar');
  const overlay = root.querySelector('#sidebar-overlay');
  const closeBtn = root.querySelector('#close-sidebar');
  const scrollContainer = sidebar?.querySelector('[data-sidebar-scroll]');
  const unbindScroll = bindPersistentScroll(scrollContainer, 'sidebar-scroll');

  if (!menuBtn || !sidebar || !overlay || !closeBtn) {
    return {
      open() {},
      close() {},
      destroy() {}
    };
  }

  function openSidebar() {
    sidebar.classList.add('is-open');
    overlay.classList.add('is-active');
    sidebar.setAttribute('aria-hidden', 'false');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('sidebar-open');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar.classList.remove('is-open');
    overlay.classList.remove('is-active');
    sidebar.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('sidebar-open');
    document.body.style.overflow = '';
  }

  function toggleSidebar() {
    if (sidebar.classList.contains('is-open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  menuBtn.addEventListener('click', (e) => {
    e.preventDefault();
    toggleSidebar();
  });

  closeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    closeSidebar();
  });

  overlay.addEventListener('click', (e) => {
    e.preventDefault();
    closeSidebar();
  });

  sidebar.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeSidebar);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
  });

  return {
    open: openSidebar,
    close: closeSidebar,
    destroy() {
      unbindScroll?.();
      closeSidebar();
    }
  };
}
