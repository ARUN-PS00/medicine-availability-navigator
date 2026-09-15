/**
 * Navbar Component
 * Desktop & Mobile Top Navigation with active route states and user menu.
 */

import { authService } from '../api/authService.js';
import { state } from '../state.js';

export function renderNavbar(containerElement) {
  const user = authService.getCurrentUser();
  const unreadCount = state.getUnreadNotificationsCount();

  const userActionHtml = user ? `
    <div style="position: relative;" id="user-menu-wrapper">
      <button class="nav-user-pill" id="user-menu-btn" aria-label="User profile options">
        <span class="user-avatar">${getInitials(user.name)}</span>
        <span class="user-name">${escapeHtml(user.name)}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <div class="user-dropdown-menu" id="user-dropdown-menu" style="display: none; position: absolute; right: 0; top: calc(100% + 8px); background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); width: 200px; padding: 0.5rem; z-index: 100;">
        <a href="#/profile" class="user-dropdown-item" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; color: var(--slate-700); border-radius: var(--radius-sm); text-decoration: none;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          My Profile
        </a>
        <a href="#/dashboard" class="user-dropdown-item" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; color: var(--slate-700); border-radius: var(--radius-sm); text-decoration: none;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          Dashboard
        </a>
        <div style="border-top: 1px solid var(--slate-100); margin: 0.25rem 0;"></div>
        <button id="logout-menu-btn" style="width: 100%; text-align: left; display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; color: var(--status-stockout-text); border-radius: var(--radius-sm);">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Sign Out
        </button>
      </div>
    </div>
  ` : `
    <a href="#/auth" class="btn btn-primary btn-sm">
      Sign In
    </a>
  `;

  containerElement.innerHTML = `
    <header class="site-header" id="site-header">
      <div class="container navbar">
        <!-- Logo -->
        <a href="#/" class="nav-brand">
          <div class="brand-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v20M2 12h20M7 7l10 10M17 7L7 17"></path>
            </svg>
          </div>
          <div class="brand-title">
            <span class="brand-name">MAP</span>
            <span class="brand-badge">Medicine Navigator</span>
          </div>
        </a>

        <!-- Desktop Navigation Links -->
        <nav class="nav-links" id="desktop-nav-links">
          <a href="#/" class="nav-link" data-route="#/">Home</a>
          <a href="#/search" class="nav-link" data-route="#/search">Search Medicines</a>
          <a href="#/pharmacies" class="nav-link" data-route="#/pharmacies">Pharmacies & Facilities</a>
          <a href="#/dashboard" class="nav-link" data-route="#/dashboard">Dashboard</a>
        </nav>

        <!-- Right Side Actions -->
        <div class="nav-actions">
          <a href="#/notifications" class="nav-icon-btn" title="Notifications" aria-label="Notifications" id="nav-notif-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            ${unreadCount > 0 ? `<span class="notification-count-badge" id="nav-unread-badge">${unreadCount}</span>` : ''}
          </a>

          ${userActionHtml}

          <!-- Mobile Menu Hamburger -->
          <button class="mobile-menu-btn" id="mobile-drawer-toggle" aria-label="Open Navigation Menu">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Mobile Drawer Overlay -->
    <div class="mobile-drawer" id="mobile-drawer">
      <div class="mobile-drawer-content">
        <a href="#/" class="mobile-drawer-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
          Home
        </a>
        <a href="#/search" class="mobile-drawer-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          Search Medicines
        </a>
        <a href="#/pharmacies" class="mobile-drawer-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          Pharmacies & Facilities
        </a>
        <a href="#/dashboard" class="mobile-drawer-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          Client Dashboard
        </a>
        <a href="#/notifications" class="mobile-drawer-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          Notifications ${unreadCount > 0 ? `(${unreadCount})` : ''}
        </a>
        <a href="#/profile" class="mobile-drawer-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          User Profile
        </a>
      </div>
    </div>
  `;

  // Bind dropdown & drawer events
  const userMenuBtn = containerElement.querySelector('#user-menu-btn');
  const userDropdown = containerElement.querySelector('#user-dropdown-menu');
  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', () => {
      userDropdown.style.display = 'none';
    });
  }

  const logoutBtn = containerElement.querySelector('#logout-menu-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      authService.logout();
      window.location.hash = '#/auth';
    });
  }

  const drawerToggle = containerElement.querySelector('#mobile-drawer-toggle');
  const drawer = containerElement.querySelector('#mobile-drawer');
  if (drawerToggle && drawer) {
    drawerToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      drawer.classList.toggle('open');
    });

    drawer.addEventListener('click', (e) => {
      if (e.target === drawer || e.target.closest('.mobile-drawer-link')) {
        drawer.classList.remove('open');
      }
    });
  }

  updateActiveNavLinks(window.location.hash || '#/');
}

export function updateActiveNavLinks(hash) {
  const current = hash.split('?')[0];
  document.querySelectorAll('.nav-link, .mobile-drawer-link').forEach(link => {
    const route = link.getAttribute('data-route') || link.getAttribute('href');
    if (route === current || (current.startsWith('#/medicine') && route === '#/search')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}
