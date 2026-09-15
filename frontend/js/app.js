/**
 * MAP (Medicine Availability Navigator)
 * Client Frontend Main Application Entry Point
 */

import { router } from './router.js';
import { state } from './state.js';
import { authService } from './api/authService.js';

import { renderNavbar, updateActiveNavLinks } from './components/Navbar.js';
import { renderMobileNav, updateActiveMobileNav } from './components/MobileNav.js';
import { renderFooter } from './components/Footer.js';

import { renderHomePage } from './pages/HomePage.js';
import { renderAuthPage } from './pages/AuthPage.js';
import { renderDashboardPage } from './pages/DashboardPage.js';
import { renderSearchPage } from './pages/SearchPage.js';
import { renderMedicineDetailPage } from './pages/MedicineDetailPage.js';
import { renderPharmaciesPage } from './pages/PharmaciesPage.js';
import { renderProfilePage } from './pages/ProfilePage.js';
import { renderNotificationsPage } from './pages/NotificationsPage.js';
import { renderPartnerLoginPage } from './pages/PartnerLoginPage.js';
import { renderPharmacyDashboardPage } from './pages/PharmacyDashboardPage.js';

class Application {
  constructor() {
    this.navbarContainer = document.getElementById('navbar-container');
    this.mobileNavContainer = document.getElementById('mobile-nav-container');
    this.footerContainer = document.getElementById('footer-container');
  }

  init() {
    console.log("%c[MAP Client Frontend]%c Initializing Medicine Availability Navigator...", "color: #0d9488; font-weight: bold;", "color: inherit;");

    // 1. Mount Global Structural Chrome
    this.mountGlobalChrome();

    // 2. Register Routes
    this.registerRoutes();

    // 3. Setup Global UI Listeners & Shortcuts
    this.setupGlobalListeners();

    // 4. Start Router
    router.start();
  }

  mountGlobalChrome() {
    if (this.navbarContainer) {
      renderNavbar(this.navbarContainer);
    }
    if (this.mobileNavContainer) {
      renderMobileNav(this.mobileNavContainer);
    }
    if (this.footerContainer) {
      renderFooter(this.footerContainer);
    }

    // Subscribe to state & auth updates to refresh navigation badges
    state.subscribe('notifications_changed', () => {
      if (this.navbarContainer) renderNavbar(this.navbarContainer);
    });

    state.subscribe('pharmacy_session_changed', () => {
      if (this.navbarContainer) renderNavbar(this.navbarContainer);
    });

    authService.subscribe(() => {
      if (this.navbarContainer) renderNavbar(this.navbarContainer);
    });
  }

  registerRoutes() {
    // 1. Landing / Home Page
    router.addRoute('/', renderHomePage);

    // 2. Authentication Page (Sign up, Login, Forgot password, Reset)
    router.addRoute('/auth', renderAuthPage);

    // 3. Client Dashboard
    router.addRoute('/dashboard', renderDashboardPage, true);

    // 4. Medicine Search & Discovery
    router.addRoute('/search', renderSearchPage);

    // 5. Medicine Details & Availability View
    router.addRoute('/medicine/:id', renderMedicineDetailPage);

    // 6. Pharmacies & Health Facilities Directory
    router.addRoute('/pharmacies', renderPharmaciesPage);

    // 7. Pharmacy Partner Portal & Dashboard
    router.addRoute('/partner-login', renderPartnerLoginPage);
    router.addRoute('/pharmacy-login', renderPartnerLoginPage);
    router.addRoute('/pharmacy-dashboard', renderPharmacyDashboardPage);

    // 8. Client Profile & Preferences
    router.addRoute('/profile', renderProfilePage, true);

    // 9. Notifications / Alert Center
    router.addRoute('/notifications', renderNotificationsPage);

    // Router after-hook: update active link highlights on both desktop and mobile bars
    router.afterEach((hash) => {
      updateActiveNavLinks(hash);
      updateActiveMobileNav(hash);
    });
  }

  setupGlobalListeners() {
    // Header shadow on scroll
    window.addEventListener('scroll', () => {
      const header = document.getElementById('site-header');
      if (header) {
        if (window.scrollY > 15) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      }
    }, { passive: true });

    // Keyboard shortcut: Pressing "/" focuses search input if not currently typing in a field
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        const searchInput = document.getElementById('global-search-input') || document.querySelector('.search-input');
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
          searchInput.select();
        }
      }
    });
  }
}

// Boot application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new Application();
  app.init();
});
