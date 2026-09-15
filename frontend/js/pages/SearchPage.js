/**
 * SearchPage Component
 * Dedicated Medicine Search & Discovery engine with multi-criteria filtering,
 * category quick-chips, sorting, and responsive card grid.
 */

import { api } from '../api/client.js';
import { initSearchBar } from '../components/SearchBar.js';
import { renderMedicineCard, bindMedicineCardEvents } from '../components/MedicineCard.js';
import { renderMedicineCardSkeleton } from '../components/SkeletonLoader.js';
import { renderEmptyState } from '../components/EmptyState.js';
import { renderErrorAlert } from '../components/ErrorAlert.js';

export async function renderSearchPage(containerElement) {
  // Parse initial query params from URL hash (e.g. #/search?q=amoxicillin&category=...)
  const hash = window.location.hash || '';
  const queryParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
  const initialQuery = queryParams.get('q') || '';
  const initialCategory = queryParams.get('category') || '';

  containerElement.innerHTML = `
    <div class="container animate-fade-in">
      <!-- Page Header -->
      <div style="margin-bottom: 1.5rem;">
        <h1 style="font-size: 2rem; margin-bottom: 0.25rem;">Medicine Catalog & Discovery</h1>
        <p style="color: var(--slate-600); font-size: 0.9375rem;">
          Search across public health inventories, inspect therapeutic equivalents, and check real-time availability.
        </p>
      </div>

      <!-- Top Search Bar -->
      <div id="search-page-input-container" style="margin-bottom: 1.5rem;"></div>

      <!-- Category Quick Chips -->
      <div class="category-chips-bar" id="category-chips-container">
        <!-- Rendered dynamically -->
      </div>

      <!-- Layout: Filter Sidebar + Main Grid -->
      <div class="search-page-layout">
        <!-- Filter Sidebar -->
        <aside class="filter-sidebar">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <h3 style="font-size: 1.125rem;">Filters</h3>
            <button type="button" class="btn btn-ghost btn-sm text-primary" id="btn-reset-filters">
              Reset All
            </button>
          </div>

          <!-- Availability Status Filter -->
          <div class="filter-section">
            <div class="filter-title">Availability Status</div>
            <div class="filter-option-list">
              <label class="checkbox-label">
                <input type="checkbox" name="filter-status" value="IN_STOCK" checked />
                <span>In Stock (Available)</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" name="filter-status" value="LOW_STOCK" checked />
                <span>Low Stock Warning</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" name="filter-status" value="HIGH_RISK" checked />
                <span>Stockout / High Risk</span>
              </label>
            </div>
          </div>

          <!-- Facility Types Supported -->
          <div class="filter-section">
            <div class="filter-title">Dispensing Facility Types</div>
            <div class="filter-option-list">
              <label class="checkbox-label">
                <input type="checkbox" name="filter-facility-type" value="District Hospital" checked />
                <span>District Hospitals</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" name="filter-facility-type" value="CHC" checked />
                <span>Community Health Centers (CHC)</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" name="filter-facility-type" value="PHC" checked />
                <span>Primary Health Centers (PHC)</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" name="filter-facility-type" value="Pharmacy" checked />
                <span>Jan Aushadhi / Pharmacies</span>
              </label>
            </div>
          </div>
        </aside>

        <!-- Main Results Column -->
        <main>
          <!-- Toolbar (Count & Sort) -->
          <div class="search-toolbar">
            <div class="search-results-count" id="search-results-count">
              Loading available medications...
            </div>

            <div class="sort-select-wrapper">
              <label for="sort-select" style="font-size: 0.875rem; color: var(--slate-600); white-space: nowrap;">Sort by:</label>
              <select id="sort-select" class="form-select" style="padding: 0.4rem 0.8rem; font-size: 0.875rem; width: auto;">
                <option value="name_asc">Name (A &rarr; Z)</option>
                <option value="name_desc">Name (Z &rarr; A)</option>
                <option value="category">Category</option>
              </select>
            </div>
          </div>

          <!-- Medicine Cards Grid -->
          <div class="auto-grid-cards" id="search-grid-container">
            ${renderMedicineCardSkeleton(6)}
          </div>
        </main>
      </div>
    </div>
  `;

  let medicinesData = [];
  let currentSearchTerm = initialQuery;
  let selectedCategory = initialCategory;

  // Mount SearchBar
  const searchInputContainer = containerElement.querySelector('#search-page-input-container');
  initSearchBar(searchInputContainer, {
    placeholder: "Filter by generic name, therapeutic class, or composition...",
    redirectOnSelect: false,
    onSearch: (term) => {
      currentSearchTerm = term;
      applyFiltersAndRender();
    }
  });

  if (initialQuery) {
    const inputEl = containerElement.querySelector('#global-search-input');
    if (inputEl) inputEl.value = initialQuery;
  }

  // Load Medicines Data
  try {
    medicinesData = await api.getMedicines();
    populateCategoryChips(medicinesData);
    applyFiltersAndRender();
  } catch (err) {
    const grid = containerElement.querySelector('#search-grid-container');
    grid.innerHTML = renderErrorAlert("Failed to load medicine catalog. Please check network connection.", {
      retryAction: () => renderSearchPage(containerElement)
    });
  }

  // Render Category Quick Chips
  function populateCategoryChips(medicines) {
    const categories = ['All', ...new Set(medicines.map(m => m.category).filter(Boolean))];
    const chipsContainer = containerElement.querySelector('#category-chips-container');

    chipsContainer.innerHTML = categories.map(cat => {
      const isAll = cat === 'All';
      const isActive = isAll ? !selectedCategory : selectedCategory === cat;
      return `
        <button type="button" class="category-chip ${isActive ? 'active' : ''}" data-category="${isAll ? '' : cat}">
          ${escapeHtml(cat)}
        </button>
      `;
    }).join('');

    chipsContainer.querySelectorAll('.category-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        chipsContainer.querySelectorAll('.category-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedCategory = btn.getAttribute('data-category');
        applyFiltersAndRender();
      });
    });
  }

  // Filter & Sort Engine
  function applyFiltersAndRender() {
    const grid = containerElement.querySelector('#search-grid-container');
    const countEl = containerElement.querySelector('#search-results-count');
    const sortVal = containerElement.querySelector('#sort-select').value;

    let filtered = [...medicinesData];

    // 1. Text Search Filter
    if (currentSearchTerm.trim()) {
      const q = currentSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(m => 
        m.name.toLowerCase().includes(q) ||
        (m.category && m.category.toLowerCase().includes(q)) ||
        (m.composition && m.composition.toLowerCase().includes(q)) ||
        (m.manufacturer && m.manufacturer.toLowerCase().includes(q))
      );
    }

    // 2. Category Filter
    if (selectedCategory) {
      filtered = filtered.filter(m => m.category === selectedCategory);
    }

    // 3. Sorting
    if (sortVal === 'name_asc') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortVal === 'name_desc') {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortVal === 'category') {
      filtered.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
    }

    // Update Result Count
    countEl.textContent = `Showing ${filtered.length} of ${medicinesData.length} medicines`;

    // Render Grid
    if (filtered.length === 0) {
      grid.innerHTML = renderEmptyState({
        title: "No Matching Medicines",
        description: `We couldn't find any medications matching your filters. Try checking the spelling or resetting filters.`,
        actionText: "Clear All Filters",
        actionId: "btn-empty-clear"
      });

      const clearBtn = grid.querySelector('#btn-empty-clear');
      if (clearBtn) {
        clearBtn.addEventListener('click', resetAllFilters);
      }
    } else {
      grid.innerHTML = filtered.map((med, idx) => {
        // Dynamic simulated stock status based on index for variety
        const status = idx % 4 === 1 ? 'LOW_STOCK' : (idx % 7 === 0 ? 'HIGH_RISK' : 'IN_STOCK');
        const facilitiesCount = status === 'HIGH_RISK' ? 1 : (status === 'LOW_STOCK' ? 2 : 5);
        return renderMedicineCard(med, status, facilitiesCount);
      }).join('');

      bindMedicineCardEvents(grid);
    }
  }

  function resetAllFilters() {
    currentSearchTerm = '';
    selectedCategory = '';
    const inputEl = containerElement.querySelector('#global-search-input');
    if (inputEl) inputEl.value = '';

    const chips = containerElement.querySelectorAll('.category-chip');
    chips.forEach((c, idx) => c.classList.toggle('active', idx === 0));

    applyFiltersAndRender();
  }

  // Event bindings for sorting and reset
  containerElement.querySelector('#sort-select').addEventListener('change', applyFiltersAndRender);
  containerElement.querySelector('#btn-reset-filters').addEventListener('click', resetAllFilters);
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
