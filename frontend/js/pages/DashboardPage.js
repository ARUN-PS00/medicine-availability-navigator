/**
 * DashboardPage Component
 * Client-facing dashboard with personalized welcome, recently viewed medicines,
 * active shortage warnings, and quick shortcuts. (STRICTLY client only; no admin features).
 */

import { authService } from '../api/authService.js';
import { api } from '../api/client.js';
import { state } from '../state.js';
import { initSearchBar } from '../components/SearchBar.js';
import { renderMedicineCard, bindMedicineCardEvents } from '../components/MedicineCard.js';
import { renderStatusBadge } from '../components/StatusBadge.js';
import { renderEmptyState } from '../components/EmptyState.js';

export async function renderDashboardPage(containerElement) {
  const user = authService.getCurrentUser() || { name: 'Patient / Citizen' };

  containerElement.innerHTML = `
    <div class="container animate-fade-in">
      <!-- Welcome Section -->
      <div class="dashboard-welcome-banner">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(255, 255, 255, 0.15); padding: 0.25rem 0.75rem; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 600; margin-bottom: 0.75rem;">
              <span class="badge-dot" style="background: #34d399;"></span>
              Client Portal Active
            </div>
            <h2>Welcome back, ${escapeHtml(user.name)}</h2>
            <p>
              Review your tracked medicines, search live stock at your preferred dispensary (${escapeHtml(user.preferred_facility_name || 'District Hospital')}), and monitor critical supply shortages.
            </p>
          </div>
        </div>

        <div class="dashboard-quick-actions">
          <a href="#/search" class="quick-action-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            Search Medicines
          </a>
          <a href="#/pharmacies" class="quick-action-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            Find Nearby Pharmacy
          </a>
          <a href="#/notifications" class="quick-action-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            View Restock Alerts
          </a>
          <a href="#/profile" class="quick-action-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Edit Health Preferences
          </a>
        </div>
      </div>

      <!-- Quick Medicine Search Widget -->
      <div class="card" style="margin-bottom: 2.5rem; padding: 1.5rem; background: var(--bg-surface);">
        <h4 style="font-size: 1rem; color: var(--slate-700); margin-bottom: 0.75rem;">
          Quick Medicine Lookup
        </h4>
        <div id="dashboard-search-container"></div>
      </div>

      <!-- Main Dashboard Grid: Saved & Recently Viewed + Critical Alerts -->
      <div style="display: grid; grid-template-columns: 1fr; gap: 2rem;" id="dashboard-grid-wrapper">
        <!-- 1. Critical Shortage Alerts (from GET /dashboard/summary) -->
        <div class="card" style="border-left: 4px solid var(--status-stockout-dot);">
          <div class="card-header" style="border-bottom: 1px solid var(--slate-100);">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <svg style="color: var(--status-stockout-dot);" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <h3 style="font-size: 1.125rem;">Active Supply Warning Alerts</h3>
            </div>
            <a href="#/notifications" class="btn btn-ghost btn-sm text-primary">
              All Alerts &rarr;
            </a>
          </div>

          <div class="card-body" id="dashboard-alerts-list" style="padding: 0.5rem 0;">
            <div style="padding: 1rem; text-align: center; color: var(--slate-400);">
              Loading real-time supply alerts...
            </div>
          </div>
        </div>

        <!-- 2. Saved Medicines -->
        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <h3 style="font-size: 1.25rem;">My Saved Medicines</h3>
            <a href="#/search" class="btn btn-ghost btn-sm text-primary">Explore Catalog &rarr;</a>
          </div>
          <div class="auto-grid-cards" id="dashboard-saved-medicines">
            <!-- Rendered dynamically -->
          </div>
        </div>

        <!-- 3. Recently Viewed Medicines -->
        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <h3 style="font-size: 1.25rem;">Recently Viewed</h3>
          </div>
          <div class="auto-grid-cards" id="dashboard-recent-medicines">
            <!-- Rendered dynamically -->
          </div>
        </div>
      </div>
    </div>
  `;

  // Mount SearchBar in Dashboard
  const searchContainer = containerElement.querySelector('#dashboard-search-container');
  if (searchContainer) {
    initSearchBar(searchContainer, {
      placeholder: "Search for a medicine to check inventory levels immediately...",
      redirectOnSelect: true
    });
  }

  // Load and render Critical Shortage Alerts
  const alertsList = containerElement.querySelector('#dashboard-alerts-list');
  try {
    const summary = await api.getDashboardSummary();
    const alerts = summary.critical_alerts || [];

    if (alerts.length === 0) {
      alertsList.innerHTML = `
        <div style="padding: 1.5rem; text-align: center; color: var(--status-instock-text); background: var(--status-instock-bg); border-radius: var(--radius-md);">
          All essential catalog drugs currently maintain safe operational buffer stock.
        </div>
      `;
    } else {
      alertsList.innerHTML = alerts.slice(0, 4).map(alert => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.875rem 1rem; border-bottom: 1px solid var(--slate-100); flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <div style="font-weight: 600; font-size: 0.9375rem; color: var(--slate-900);">
              ${escapeHtml(alert.medicine_name)}
            </div>
            <div style="font-size: 0.8125rem; color: var(--slate-500);">
              Reported at <strong>${escapeHtml(alert.facility_name)}</strong> &bull; Current Stock: <strong>${alert.closing_stock} units</strong>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            ${renderStatusBadge(alert.closing_stock === 0 ? 'STOCKOUT' : 'HIGH_RISK')}
            <a href="#/medicine/${alert.medicine_id}" class="btn btn-outline btn-sm">
              Find Alternatives
            </a>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    alertsList.innerHTML = `<div style="padding: 1rem; color: var(--text-muted);">Alert telemetry currently synchronizing.</div>`;
  }

  // Load Saved & Recent Medicines
  try {
    const allMedicines = await api.getMedicines();
    const savedIds = state.getSavedIds();
    const recentIds = state.getRecentIds();

    // Render Saved
    const savedContainer = containerElement.querySelector('#dashboard-saved-medicines');
    const savedMedicines = allMedicines.filter(m => savedIds.includes(m.id));

    if (savedMedicines.length === 0) {
      savedContainer.innerHTML = renderEmptyState({
        title: "No Saved Medicines Yet",
        description: "Bookmark medications from the catalog for 1-click availability monitoring.",
        actionText: "Find Medicines",
        actionHref: "#/search"
      });
    } else {
      savedContainer.innerHTML = savedMedicines.map((m, i) => renderMedicineCard(m, i % 2 === 0 ? 'IN_STOCK' : 'LOW_STOCK', 3)).join('');
      bindMedicineCardEvents(savedContainer);
    }

    // Render Recent
    const recentContainer = containerElement.querySelector('#dashboard-recent-medicines');
    const recentMedicines = allMedicines.filter(m => recentIds.includes(m.id));

    if (recentMedicines.length === 0) {
      recentContainer.innerHTML = renderEmptyState({
        title: "No Recent Views",
        description: "Medicines you inspect will appear here for fast access.",
        actionText: "Browse Catalog",
        actionHref: "#/search"
      });
    } else {
      recentContainer.innerHTML = recentMedicines.map(m => renderMedicineCard(m, 'IN_STOCK', 4)).join('');
      bindMedicineCardEvents(recentContainer);
    }
  } catch (err) {
    console.error("Error loading dashboard medicines:", err);
  }
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
