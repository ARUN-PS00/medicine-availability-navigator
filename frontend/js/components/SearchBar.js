/**
 * SearchBar Component
 * Search bar with debounced autocomplete suggestions and clear action.
 */

import { api } from '../api/client.js';
import { state } from '../state.js';

export function initSearchBar(containerElement, { placeholder = "Search medicines, brands, or health categories...", onSearch = null, redirectOnSelect = true } = {}) {
  containerElement.innerHTML = `
    <div class="search-container">
      <div class="search-input-wrapper">
        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="text" 
          class="search-input" 
          id="global-search-input" 
          placeholder="${placeholder}" 
          autocomplete="off"
        />
        <button type="button" class="search-clear-btn" id="search-clear-btn" aria-label="Clear search">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="suggestions-dropdown" id="search-suggestions-dropdown"></div>
    </div>
  `;

  const input = containerElement.querySelector('#global-search-input');
  const clearBtn = containerElement.querySelector('#search-clear-btn');
  const dropdown = containerElement.querySelector('#search-suggestions-dropdown');

  let debounceTimer = null;
  let allMedicines = [];

  // Cache catalog for instant filtering
  api.getMedicines().then(data => {
    allMedicines = data;
  });

  const showSuggestions = (query) => {
    const q = (query || '').toLowerCase().trim();
    if (!q) {
      dropdown.style.display = 'none';
      return;
    }

    const matches = allMedicines.filter(m => 
      m.name.toLowerCase().includes(q) || 
      (m.category && m.category.toLowerCase().includes(q)) ||
      (m.composition && m.composition.toLowerCase().includes(q))
    ).slice(0, 6);

    if (matches.length === 0) {
      dropdown.innerHTML = `
        <div style="padding: 1rem; text-align: center; color: var(--slate-400); font-size: 0.875rem;">
          No matching medicines found for "<strong>${escapeHtml(query)}</strong>"
        </div>
      `;
      dropdown.style.display = 'block';
      return;
    }

    dropdown.innerHTML = matches.map((m, idx) => `
      <div class="suggestion-item" data-id="${m.id}" data-name="${m.name}" tabindex="0">
        <div>
          <div style="font-weight: 600; font-size: 0.9375rem; color: var(--slate-900);">${escapeHtml(m.name)}</div>
          <div style="font-size: 0.75rem; color: var(--slate-500);">${escapeHtml(m.category || 'Essential Medicine')}</div>
        </div>
        <span style="font-size: 0.75rem; font-weight: 600; color: var(--primary-600); background: var(--primary-50); padding: 2px 8px; border-radius: var(--radius-full);">
          View Stock &rarr;
        </span>
      </div>
    `).join('');

    dropdown.style.display = 'block';

    dropdown.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-id');
        const name = item.getAttribute('data-name');
        state.addSearchQuery(name);
        dropdown.style.display = 'none';
        input.value = name;
        if (redirectOnSelect) {
          window.location.hash = `#/medicine/${id}`;
        } else if (onSearch) {
          onSearch(name);
        }
      });
    });
  };

  input.addEventListener('input', (e) => {
    const val = e.target.value;
    clearBtn.style.display = val ? 'block' : 'none';

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      showSuggestions(val);
      if (onSearch) onSearch(val);
    }, 200);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = input.value.trim();
      dropdown.style.display = 'none';
      if (val) {
        state.addSearchQuery(val);
        if (redirectOnSelect) {
          window.location.hash = `#/search?q=${encodeURIComponent(val)}`;
        } else if (onSearch) {
          onSearch(val);
        }
      }
    } else if (e.key === 'Escape') {
      dropdown.style.display = 'none';
    }
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.style.display = 'none';
    dropdown.style.display = 'none';
    input.focus();
    if (onSearch) onSearch('');
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!containerElement.contains(e.target)) {
      dropdown.style.display = 'none';
    }
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
