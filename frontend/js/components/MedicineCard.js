/**
 * MedicineCard Component
 * Displays essential medicine overview with bookmarking and stock indicators.
 */

import { renderStatusBadge } from './StatusBadge.js';
import { state } from '../state.js';

export function renderMedicineCard(medicine, stockStatus = 'IN_STOCK', stockingFacilitiesCount = null) {
  const isSaved = state.isSaved(medicine.id);
  const facilitiesLabel = stockingFacilitiesCount !== null 
    ? `${stockingFacilitiesCount} Facilities in Stock`
    : 'Available in Network';

  return `
    <div class="card card-hover animate-fade-in" id="med-card-${medicine.id}">
      <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.75rem;">
        <span class="badge badge-primary" style="font-size: 0.7rem;">
          ${escapeHtml(medicine.category || 'Essential')}
        </span>
        <button 
          class="bookmark-btn" 
          data-id="${medicine.id}" 
          title="${isSaved ? 'Remove from saved' : 'Save medicine'}"
          style="color: ${isSaved ? '#e11d48' : 'var(--slate-400)'}; padding: 4px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all var(--transition-fast);"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      </div>

      <h4 style="font-size: 1.125rem; font-weight: 700; color: var(--slate-900); margin-bottom: 0.35rem; line-height: 1.3;">
        ${escapeHtml(medicine.name)}
      </h4>

      <p style="font-size: 0.8125rem; color: var(--slate-500); margin-bottom: 0.75rem; line-height: 1.4;">
        ${escapeHtml(medicine.dosage_form || 'Tablet / Oral')} &bull; ${escapeHtml(medicine.manufacturer || 'Certified Provider')}
      </p>

      <div style="margin-top: auto; padding-top: 0.875rem; border-top: 1px solid var(--slate-100); display: flex; align-items: center; justify-content: space-between;">
        <div>
          ${renderStatusBadge(stockStatus)}
          <div style="font-size: 0.75rem; color: var(--slate-400); margin-top: 0.25rem;">
            ${facilitiesLabel}
          </div>
        </div>

        <a href="#/medicine/${medicine.id}" class="btn btn-primary btn-sm" style="font-size: 0.8125rem;">
          View Stock &rarr;
        </a>
      </div>
    </div>
  `;
}

export function bindMedicineCardEvents(containerElement) {
  containerElement.querySelectorAll('.bookmark-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const medId = btn.getAttribute('data-id');
      const saved = state.toggleSave(medId);
      
      btn.style.color = saved ? '#e11d48' : 'var(--slate-400)';
      const svg = btn.querySelector('svg');
      if (svg) {
        svg.setAttribute('fill', saved ? 'currentColor' : 'none');
      }
      btn.setAttribute('title', saved ? 'Remove from saved' : 'Save medicine');
    });
  });
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
