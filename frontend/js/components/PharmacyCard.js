/**
 * PharmacyCard Component
 * Displays facility details, operational hours, type pill, and stock status.
 */

import { renderStatusBadge } from './StatusBadge.js';

export function renderPharmacyCard(facility, stockStatus = 'AVAILABLE') {
  const typeClasses = {
    'District Hospital': 'facility-type-hospital',
    'CHC': 'facility-type-chc',
    'PHC': 'facility-type-phc',
    'Pharmacy': 'facility-type-pharmacy'
  };

  const typeClass = typeClasses[facility.type] || 'facility-type-pharmacy';

  return `
    <div class="card card-hover animate-fade-in" id="fac-card-${facility.id}">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
        <span class="facility-type-badge ${typeClass}">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          </svg>
          ${escapeHtml(facility.type)}
        </span>
        ${renderStatusBadge(stockStatus === 'AVAILABLE' ? 'IN_STOCK' : stockStatus)}
      </div>

      <h4 style="font-size: 1.125rem; font-weight: 700; color: var(--slate-900); margin-bottom: 0.5rem; line-height: 1.3;">
        ${escapeHtml(facility.name)}
      </h4>

      <div style="display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.8125rem; color: var(--slate-600); margin-bottom: 1rem;">
        <div style="display: flex; align-items: flex-start; gap: 0.4rem;">
          <svg style="flex-shrink: 0; margin-top: 2px; color: var(--slate-400);" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>${escapeHtml(facility.address || `Lat: ${facility.latitude}, Long: ${facility.longitude}`)}</span>
        </div>

        <div style="display: flex; align-items: center; gap: 0.4rem;">
          <svg style="flex-shrink: 0; color: var(--slate-400);" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>${escapeHtml(facility.open_hours || '09:00 AM - 05:00 PM')}</span>
        </div>

        <div style="display: flex; align-items: center; gap: 0.4rem;">
          <svg style="flex-shrink: 0; color: var(--slate-400);" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          <span>${escapeHtml(facility.phone || '+91 80 2000 0000')}</span>
        </div>
      </div>

      <div style="margin-top: auto; padding-top: 0.75rem; border-top: 1px solid var(--slate-100); display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 0.75rem; font-weight: 500; color: var(--primary-700);">
          Verified Public Node
        </span>
        <a href="#/search?facility=${facility.id}" class="btn btn-secondary btn-sm">
          Browse Stock &rarr;
        </a>
      </div>
    </div>
  `;
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
