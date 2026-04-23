import { mountLayout } from '../../components/layout.js';
import { initRouter } from '../../components/router.js';

async function bootstrap() {
  const root = document.getElementById('app');
  if (!root) return console.error('Root #app element not found');

  let config = {};
  try {
    const res = await fetch('./config/site.json');
    config = await res.json();
  } catch (err) {
    console.warn('Could not load site.json, falling back to defaults.', err);
  }

  const ui = mountLayout(root, config);

  // Centralized Event Delegation
  document.addEventListener('click', (e) => {
    // Menu Toggle
    if (e.target.closest('[data-inf-menu-toggle]')) {
      const drawer = document.querySelector('[data-inf-drawer]');
      if (drawer) ui.setDrawerVisible(drawer.hasAttribute('hidden'));
      return;
    }

    // Close Drawer when clicking outside or on a drawer link
    const drawer = document.querySelector('[data-inf-drawer]');
    if (drawer && !drawer.hasAttribute('hidden')) {
      if (!e.target.closest('.inf-drawer-inner') || e.target.closest('a')) {
        ui.setDrawerVisible(false);
      }
    }

    // Search Dock Toggle
    if (e.target.closest('.inf-searchfab')) {
      const dock = document.querySelector('[data-inf-searchdock]');
      if (dock && dock.classList.contains('is-open')) {
        ui.closeSearch();
      } else {
        ui.openSearch();
      }
      return;
    }

    // Quick Action Buttons
    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn) {
      const action = actionBtn.getAttribute('data-action');
      if (action === 'share' && navigator.share) {
        navigator.share({ title: config.site_name, url: window.location.href }).catch(console.error);
      } else {
        window.location.hash = action;
      }
    }
  });

  // Handle Search Input 'Enter' and 'Escape'
  const searchInput = document.querySelector('input[data-inf-search-input]');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        ui.closeSearch();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const query = e.target.value.trim();
        if (query) {
          window.location.hash = `search?q=${encodeURIComponent(query)}`;
          ui.closeSearch();
          if (ui.setSearchValue) ui.setSearchValue(''); 
        }
      }
    });
  } else {
      // Global fallback if input is dynamically rendered later
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') ui.closeSearch();
        if (e.key === 'Enter' && e.target.matches('input[data-inf-search-input]')) {
            e.preventDefault();
            const query = e.target.value.trim();
            if (query) {
                window.location.hash = `search?q=${encodeURIComponent(query)}`;
                ui.closeSearch();
                e.target.value = '';
            }
        }
      });
  }

  initRouter(ui, config);
}

document.addEventListener('DOMContentLoaded', bootstrap);
