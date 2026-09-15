/**
 * MAP Hash-Based Client Router
 * 
 * Routes:
 * - #/                 Home / Landing Page
 * - #/auth             Authentication (Login, Signup, Forgot Password)
 * - #/dashboard        Client Dashboard (Protected)
 * - #/search           Medicine Search & Discovery
 * - #/medicine/:id     Medicine Details & Availability View
 * - #/pharmacies       Facilities & Pharmacies Directory
 * - #/profile          User Profile (Protected)
 * - #/notifications    Notification Center
 */

import { authService } from './api/authService.js';

class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.currentParams = {};
    this.beforeHooks = [];
    this.afterHooks = [];

    window.addEventListener('hashchange', () => this.handleRouting());
  }

  addRoute(path, handler, isProtected = false) {
    this.routes[path] = { handler, isProtected };
  }

  beforeEach(hook) {
    this.beforeHooks.push(hook);
  }

  afterEach(hook) {
    this.afterHooks.push(hook);
  }

  navigate(hash) {
    window.location.hash = hash;
  }

  matchRoute(currentHash) {
    // Strip leading '#'
    const path = currentHash.replace(/^#/, '') || '/';

    // 1. Exact match
    if (this.routes[path]) {
      return { route: this.routes[path], params: {} };
    }

    // 2. Pattern match (e.g., /medicine/:id)
    for (const routePattern in this.routes) {
      if (routePattern.includes(':')) {
        const patternParts = routePattern.split('/');
        const pathParts = path.split('/');

        if (patternParts.length === pathParts.length) {
          const params = {};
          let match = true;

          for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i].startsWith(':')) {
              const paramName = patternParts[i].slice(1);
              params[paramName] = decodeURIComponent(pathParts[i]);
            } else if (patternParts[i] !== pathParts[i]) {
              match = false;
              break;
            }
          }

          if (match) {
            return { route: this.routes[routePattern], params };
          }
        }
      }
    }

    // Fallback to Home if unknown route
    return { route: this.routes['/'], params: {} };
  }

  async handleRouting() {
    const rawHash = window.location.hash || '#/';
    const { route, params } = this.matchRoute(rawHash);

    if (!route) {
      console.error("No route found for", rawHash);
      return;
    }

    // Route protection check
    if (route.isProtected && !authService.isAuthenticated()) {
      console.warn("Protected route accessed while unauthenticated. Redirecting to #/auth");
      window.location.hash = '#/auth';
      return;
    }

    // Execute before hooks
    for (const hook of this.beforeHooks) {
      const allowed = await hook(rawHash, params);
      if (allowed === false) return;
    }

    this.currentRoute = rawHash;
    this.currentParams = params;

    const contentContainer = document.getElementById('main-content');
    if (contentContainer) {
      // Execute page handler
      await route.handler(contentContainer, params);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    // Execute after hooks (e.g. updating active navbar links)
    for (const hook of this.afterHooks) {
      hook(rawHash, params);
    }
  }

  start() {
    if (!window.location.hash) {
      window.location.hash = '#/';
    } else {
      this.handleRouting();
    }
  }
}

export const router = new Router();
