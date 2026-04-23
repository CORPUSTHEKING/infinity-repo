export function renderSidebar() {
  return `
    <div id="sidebar-overlay" class="sidebar-overlay" aria-hidden="true" tabindex="-1"></div>

    <aside id="modern-sidebar" class="modern-sidebar" aria-label="Sidebar Navigation" aria-hidden="true">
      <div class="sidebar-header">
        <span class="sidebar-title">Infinity</span>
        <button id="close-sidebar" class="icon-btn" aria-label="Close sidebar">✕</button>
      </div>

      <nav class="sidebar-nav">
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

  if (!menuBtn || !sidebar || !overlay || !closeBtn) {
    return {
      open() {},
      close() {}
    };
  }

  function openSidebar() {
    sidebar.classList.add('is-open');
    overlay.classList.add('is-active');
    sidebar.setAttribute('aria-hidden', 'false');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar.classList.remove('is-open');
    overlay.classList.remove('is-active');
    sidebar.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  menuBtn.addEventListener('click', openSidebar);
  closeBtn.addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
  });

  return { open: openSidebar, close: closeSidebar };
}
