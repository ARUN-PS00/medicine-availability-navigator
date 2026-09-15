/**
 * PharmaciesPage Component
 * Public Health Facility & Pharmacy Directory.
 * Supports filtering by facility type (District Hospital, CHC, PHC, Pharmacy) and text search.
 */

import { api } from '../api/client.js';
import { renderPharmacyCard } from '../components/PharmacyCard.js';
import { renderEmptyState } from '../components/EmptyState.js';
import { renderErrorAlert } from '../components/ErrorAlert.js';

export async function renderPharmaciesPage(containerElement) {
  containerElement.innerHTML = `
    <div class="container animate-fade-in">
      <!-- Page Header -->
      <div style="margin-bottom: 2rem;">
        <h1 style="font-size: 2rem; margin-bottom: 0.25rem;">Health Facilities & Pharmacies</h1>
        <p style="color: var(--slate-600); font-size: 0.9375rem;">
          Locate verified government hospitals, community health posts, and Jan Aushadhi dispensaries connected to the live stock network.
        </p>
      </div>

      <!-- Filter Controls & Search -->
      <div class="card" style="padding: 1.25rem; margin-bottom: 1.5rem; background: var(--bg-surface);">
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;" id="facility-type-filters">
            <button type="button" class="btn btn-sm btn-primary filter-type-btn" data-type="All">All Facilities</button>
            <button type="button" class="btn btn-sm btn-secondary filter-type-btn" data-type="District Hospital">District Hospitals</button>
            <button type="button" class="btn btn-sm btn-secondary filter-type-btn" data-type="CHC">CHCs (Community)</button>
            <button type="button" class="btn btn-sm btn-secondary filter-type-btn" data-type="PHC">PHCs (Primary)</button>
            <button type="button" class="btn btn-sm btn-secondary filter-type-btn" data-type="Pharmacy">Jan Aushadhi & Pharmacies</button>
          </div>

          <div style="position: relative;">
            <input 
              type="text" 
              class="form-input" 
              id="facility-search-input" 
              placeholder="Search by facility name, locality, or sector..."
              style="padding-left: 2.5rem;"
            />
            <svg style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: var(--slate-400);" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>
      </div>

      <!-- Facility Count Banner -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <span id="facilities-count-text" style="font-size: 0.875rem; color: var(--slate-500);">
          Scanning verified health nodes...
        </span>
      </div>

      <!-- Pharmacy Grid -->
      <div class="pharmacy-card-grid" id="pharmacies-grid-container">
        <!-- Rendered dynamically -->
      </div>
    </div>
  `;

  let allFacilities = [];
  let selectedType = 'All';
  let searchTerm = '';

  const gridContainer = containerElement.querySelector('#pharmacies-grid-container');
  const countText = containerElement.querySelector('#facilities-count-text');
  const searchInput = containerElement.querySelector('#facility-search-input');
  const filterButtons = containerElement.querySelectorAll('.filter-type-btn');

  try {
    allFacilities = await api.getFacilities();
    renderFilteredFacilities();
  } catch (err) {
    gridContainer.innerHTML = renderErrorAlert("Failed to load healthcare facilities.", {
      retryAction: () => renderPharmaciesPage(containerElement)
    });
  }

  function renderFilteredFacilities() {
    let filtered = [...allFacilities];

    // Filter by type
    if (selectedType !== 'All') {
      filtered = filtered.filter(f => f.type.toLowerCase() === selectedType.toLowerCase());
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(f => 
        f.name.toLowerCase().includes(q) || 
        (f.address && f.address.toLowerCase().includes(q)) ||
        f.type.toLowerCase().includes(q)
      );
    }

    countText.textContent = `Showing ${filtered.length} of ${allFacilities.length} health network nodes`;

    if (filtered.length === 0) {
      gridContainer.innerHTML = renderEmptyState({
        title: "No Facilities Found",
        description: `No health facility or pharmacy matched "${escapeHtml(searchTerm)}". Try selecting a different facility type.`,
        actionText: "Reset Filters",
        actionId: "btn-reset-fac-filters"
      });

      const resetBtn = gridContainer.querySelector('#btn-reset-fac-filters');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          selectedType = 'All';
          searchTerm = '';
          searchInput.value = '';
          filterButtons.forEach((b, idx) => {
            b.className = idx === 0 ? 'btn btn-sm btn-primary filter-type-btn' : 'btn btn-sm btn-secondary filter-type-btn';
          });
          renderFilteredFacilities();
        });
      }
    } else {
      gridContainer.innerHTML = filtered.map(fac => renderPharmacyCard(fac, 'AVAILABLE')).join('');
    }
  }

  // Bind filter button clicks
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-secondary');
      });
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary');
      selectedType = btn.getAttribute('data-type');
      renderFilteredFacilities();
    });
  });

  // Bind search input with debounce
  let debounceTimeout = null;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      searchTerm = e.target.value;
      renderFilteredFacilities();
    }, 200);
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
