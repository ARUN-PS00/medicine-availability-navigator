/**
 * MobileNav Component
 * Thumb-friendly bottom navigation bar for mobile screens.
 */

export function renderMobileNav(containerElement) {
  containerElement.innerHTML = `
    <nav class="mobile-bottom-nav" id="mobile-bottom-nav" aria-label="Mobile Navigation">
      <a href="#/" class="mobile-nav-item" data-route="#/">
        <svg class="mobile-nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        </svg>
        <span class="mobile-nav-label">Home</span>
      </a>

      <a href="#/search" class="mobile-nav-item" data-route="#/search">
        <svg class="mobile-nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span class="mobile-nav-label">Search</span>
      </a>

      <a href="#/pharmacies" class="mobile-nav-item" data-route="#/pharmacies">
        <svg class="mobile-nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span class="mobile-nav-label">Facilities</span>
      </a>

      <a href="#/dashboard" class="mobile-nav-item" data-route="#/dashboard">
        <svg class="mobile-nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        <span class="mobile-nav-label">Dashboard</span>
      </a>

      <a href="#/profile" class="mobile-nav-item" data-route="#/profile">
        <svg class="mobile-nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span class="mobile-nav-label">Profile</span>
      </a>
    </nav>
  `;

  updateActiveMobileNav(window.location.hash || '#/');
}

export function updateActiveMobileNav(hash) {
  const current = hash.split('?')[0];
  document.querySelectorAll('.mobile-nav-item').forEach(item => {
    const route = item.getAttribute('data-route');
    if (route === current || (current.startsWith('#/medicine') && route === '#/search')) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}
