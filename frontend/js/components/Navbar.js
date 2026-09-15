/**
 * Navbar Component
 * Desktop & Mobile Top Navigation with active route states and user menu.
 */

import { authService } from '../api/authService.js';
import { state } from '../state.js';

export function renderNavbar(containerElement) {
  const locState = state.getLocationState();

  const locationPillHtml = `
    <button id="nav-location-pill" class="location-pill-btn" title="Click to request current location via browser Geolocation">
      <svg class="location-pin-icon" fill="currentColor" viewBox="0 0 20 20" width="14" height="14">
        <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
      </svg>
      <span class="location-label-text">${locState.isFallback ? '🎯 Use my location' : escapeHtml(locState.label)}</span>
      <span class="location-status-tag ${locState.isFallback ? 'tag-fallback' : 'tag-exact'}">
        ${locState.isFallback ? 'Off' : 'GPS'}
      </span>
    </button>
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
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <span class="brand-name">MAP</span>
              <span class="brand-badge">Live Finder</span>
            </div>
            <span class="brand-sub">Medicine Availability & Stockout Navigator</span>
          </div>
        </a>

        <!-- Desktop Navigation Links -->
        <nav class="nav-links" id="desktop-nav-links">
          <a href="#/" class="nav-link" data-route="#/">Home</a>
          <a href="#/search" class="nav-link" data-route="#/search">Search Medicines</a>
          <a href="#/pharmacies" class="nav-link" data-route="#/pharmacies">Nearby Pharmacies & Map</a>
          <a href="#/medicine/M001" class="nav-link" data-route="#/medicine">Stockout Risk</a>
        </nav>

        <!-- Right Side Actions -->
        <div class="nav-actions">
          ${locationPillHtml}

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
          Nearby Pharmacies & Map
        </a>
        <a href="#/medicine/M001" class="mobile-drawer-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
          Stockout Risk Prototype
        </a>
      </div>
    </div>
  `;

  // Bind location pill button to request browser location
  const locBtn = containerElement.querySelector('#nav-location-pill');
  if (locBtn) {
    locBtn.addEventListener('click', async () => {
      locBtn.classList.add('loading');
      locBtn.querySelector('.location-label-text').textContent = 'Acquiring GPS...';
      await state.requestUserLocation();
      renderNavbar(containerElement);
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
