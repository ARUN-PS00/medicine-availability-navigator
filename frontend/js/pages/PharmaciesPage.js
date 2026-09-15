/**
 * PharmaciesPage Component — Stitch Screen 2: Results & Pharmacy Experience
 * 
 * Interactive Leaflet Map + Nearby Pharmacy Directory.
 * Uses browser Geolocation API and real facility coordinates from backend.
 * Provides MAP Recommended badges and external Google Maps directions handoff.
 */

import { api } from '../api/client.js';
import { state } from '../state.js';
import { renderErrorAlert } from '../components/ErrorAlert.js';

export async function renderPharmaciesPage(containerElement) {
  // Automatically request browser location if not yet requested
  let locState = state.getLocationState();
  if (locState.status === 'DEFAULT') {
    locState = await state.requestUserLocation();
  }

  const fallbackBannerHtml = locState.isFallback ? `
    <div class="location-fallback-banner animate-fade-in" id="location-fallback-alert">
      <div>
        <strong>📍 Location unavailable — showing demo pharmacies</strong>
        <span style="display: block; font-size: 0.8125rem; margin-top: 0.15rem; color: #78350f;">
          Browser location permission was not granted. Displaying synthetic demo health facilities.
        </span>
      </div>
      <button type="button" class="btn btn-sm btn-primary" id="btn-request-location-banner" style="background: #92400e; border: none; color: #fff;">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        🎯 Use My Location
      </button>
    </div>
  ` : `
    <div class="location-fallback-banner animate-fade-in" style="background: #f0fdf4; border-color: #bbf7d0; color: #166534;" id="location-granted-alert">
      <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 0.5rem; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 1.1rem;">📍</span>
          <div>
            <strong>Browser GPS Location Active</strong>
            <span style="display: block; font-size: 0.8125rem; color: #15803d;">
              Coordinates: ${locState.lat.toFixed(4)}, ${locState.lng.toFixed(4)} — Calculating travel distances from your actual browser location.
            </span>
          </div>
        </div>
        <button type="button" class="btn btn-sm btn-outline" id="btn-request-location-banner" style="border-color: #166534; color: #166534; background: #ffffff;">
          🎯 Refresh Location
        </button>
      </div>
    </div>
  `;

  containerElement.innerHTML = `
    <div class="container animate-fade-in" style="padding-top: 1rem; padding-bottom: 3rem;">
      <!-- Page Header -->
      <div style="margin-bottom: 1.25rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; flex-wrap: wrap;">
          <span class="badge badge-primary">Screen 2 • Results & Map</span>
          <span class="badge" style="background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; font-weight: 600;">
            Demo pharmacy locations (Synthetic Data)
          </span>
        </div>
        <h1 style="font-size: 1.875rem; color: var(--slate-900); margin-bottom: 0.25rem;">
          Nearby Pharmacies & Dispensary Map
        </h1>
        <p style="color: var(--slate-600); font-size: 0.9375rem;">
          Locate verified government health centers, Jan Aushadhi Kendras, and community dispensaries.
        </p>
      </div>

      ${fallbackBannerHtml}

      <!-- Filter Controls & Search Bar -->
      <div class="card" style="padding: 1rem; margin-bottom: 1.25rem; background: var(--bg-surface);">
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;" id="facility-type-filters">
              <button type="button" class="btn btn-sm btn-primary filter-type-btn" data-type="All">All Facilities</button>
              <button type="button" class="btn btn-sm btn-secondary filter-type-btn" data-type="District Hospital">District Hospitals</button>
              <button type="button" class="btn btn-sm btn-secondary filter-type-btn" data-type="CHC">CHCs (Community)</button>
              <button type="button" class="btn btn-sm btn-secondary filter-type-btn" data-type="PHC">PHCs (Primary)</button>
              <button type="button" class="btn btn-sm btn-secondary filter-type-btn" data-type="Pharmacy">Jan Aushadhi & Pharmacies</button>
            </div>

            <button type="button" class="btn btn-sm btn-primary" id="btn-use-my-location-control" style="white-space: nowrap;">
              🎯 Use my location
            </button>
          </div>

          <div style="position: relative;">
            <input 
              type="text" 
              class="form-input" 
              id="facility-search-input" 
              placeholder="Filter by facility name, address, or type..."
              style="padding-left: 2.5rem; height: 42px;"
            />
            <svg style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: var(--slate-400);" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>
      </div>

      <!-- Main Split Layout: Leaflet Map (Left) + Ranked Pharmacy List (Right) -->
      <div style="display: grid; grid-template-columns: 1fr; gap: 1.25rem;" id="map-split-grid">
        <!-- Left: Leaflet Map Container -->
        <div>
          <div class="map-container-box" id="leaflet-map-wrapper">
            <div id="leaflet-map" style="width: 100%; height: 100%; z-index: 1;"></div>
          </div>
        </div>

        <!-- Right: Ranked Pharmacy List & Selected Drawer -->
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span id="facilities-count-text" style="font-size: 0.875rem; font-weight: 600; color: var(--slate-700);">
              Loading health facilities...
            </span>
          </div>

          <!-- Pharmacy List -->
          <div id="pharmacies-list-container" style="display: flex; flex-direction: column; gap: 0.85rem; max-height: 520px; overflow-y: auto; padding-right: 0.25rem;">
            <!-- Dynamically rendered -->
          </div>
        </div>
      </div>
    </div>
  `;

  // Adjust split layout for desktop (min-width: 992px)
  const gridEl = containerElement.querySelector('#map-split-grid');
  if (window.innerWidth >= 992) {
    gridEl.style.gridTemplateColumns = '1.2fr 1fr';
  }

  // Handle Location Request from Banner & Control Button
  const handleLocationRequest = async (btn) => {
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Acquiring GPS...';
    }
    await state.requestUserLocation();
    renderPharmaciesPage(containerElement);
  };

  const bannerBtn = containerElement.querySelector('#btn-request-location-banner');
  if (bannerBtn) {
    bannerBtn.addEventListener('click', () => handleLocationRequest(bannerBtn));
  }

  const controlBtn = containerElement.querySelector('#btn-use-my-location-control');
  if (controlBtn) {
    controlBtn.addEventListener('click', () => handleLocationRequest(controlBtn));
  }

  let allFacilities = [];
  let selectedType = 'All';
  let searchTerm = '';
  let selectedFacilityId = null;
  let mapInstance = null;
  let markersGroup = null;

  const listContainer = containerElement.querySelector('#pharmacies-list-container');
  const countText = containerElement.querySelector('#facilities-count-text');
  const searchInput = containerElement.querySelector('#facility-search-input');
  const filterButtons = containerElement.querySelectorAll('.filter-type-btn');

  // Load facilities using real backend endpoint & user lat/lng for distance calculation
  try {
    const currentLocation = state.getLocationState();
    allFacilities = await api.getFacilities(null, currentLocation.lat, currentLocation.lng);
    
    // Sort by proximity distance if available
    allFacilities.sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999));

    // Initialize Leaflet Map
    initLeafletMap(currentLocation);
    renderFilteredFacilities();
  } catch (err) {
    console.error("Error loading facilities for map:", err);
    listContainer.innerHTML = renderErrorAlert("Failed to load healthcare facilities from backend.", {
      retryAction: () => renderPharmaciesPage(containerElement)
    });
  }

  // Initialize Leaflet Map Instance
  function initLeafletMap(loc) {
    const mapEl = containerElement.querySelector('#leaflet-map');
    if (!mapEl || typeof L === 'undefined') return;

    try {
      mapInstance = L.map(mapEl).setView([loc.lat, loc.lng], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
      }).addTo(mapInstance);

      // Add User Location Marker ("You are here")
      const userIcon = L.divIcon({
        className: 'user-marker-pulse',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const userMarker = L.marker([loc.lat, loc.lng], { icon: userIcon }).addTo(mapInstance);

      if (loc.isFallback) {
        userMarker.bindPopup(`<b>Demo Center</b><br>Location unavailable — showing demo pharmacies`);
      } else {
        userMarker.bindPopup(`<b>You Are Here</b><br>GPS Coordinates: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`);
      }

      markersGroup = L.featureGroup().addTo(mapInstance);
      // Include user marker in feature group for fit bounds calculation
      markersGroup.addLayer(userMarker);
    } catch (e) {
      console.warn("Leaflet map initialization warning:", e);
    }
  }

  // Render Pharmacy Markers on Leaflet Map
  function updateMapMarkers(facilities) {
    if (!mapInstance || !markersGroup) return;

    markersGroup.clearLayers();

    facilities.forEach((fac, idx) => {
      if (!fac.latitude || !fac.longitude) return;

      const isRecommended = idx < 3;
      const markerColor = isRecommended ? '#0d9488' : '#0284c7';

      const customIcon = L.divIcon({
        className: 'custom-pharmacy-pin',
        html: `
          <div style="
            background: ${markerColor};
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 12px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
            border: 2px solid #ffffff;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 4px;
          ">
            <span>🏥</span>
            <span>${escapeHtml(fac.name.slice(0, 18))}</span>
          </div>
        `,
        iconAnchor: [30, 15]
      });

      const marker = L.marker([fac.latitude, fac.longitude], { icon: customIcon });

      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${fac.latitude},${fac.longitude}`;

      const popupHtml = `
        <div style="padding: 4px; font-family: var(--font-body);">
          <div style="font-weight: 700; font-size: 0.9375rem; color: #0f172a; margin-bottom: 2px;">
            ${escapeHtml(fac.name)}
          </div>
          <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 6px;">
            ${escapeHtml(fac.type)} • ${fac.distance_km ? `${fac.distance_km} km away` : 'Nearby'}
          </div>
          <div style="font-size: 0.8125rem; color: #334155; margin-bottom: 8px;">
            ${escapeHtml(fac.address || 'Public Health Outpost')}
          </div>
          <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary" style="display: block; text-align: center; text-decoration: none; padding: 4px 8px; font-size: 0.75rem;">
            🧭 GET DIRECTIONS
          </a>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        selectPharmacyCard(fac.id);
      });

      markersGroup.addLayer(marker);
    });

    if (facilities.length > 0 && mapInstance) {
      try {
        const bounds = markersGroup.getBounds();
        if (bounds.isValid()) {
          mapInstance.fitBounds(bounds, { padding: [40, 40] });
        }
      } catch (e) {}
    }
  }

  // Render Filtered Pharmacy List
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

    updateMapMarkers(filtered);

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="card" style="padding: 2rem; text-align: center; color: var(--slate-500);">
          <p style="margin-bottom: 0.5rem; font-weight: 600;">No facilities match your search</p>
          <button type="button" class="btn btn-sm btn-outline" id="btn-clear-fac-filter">Reset Filters</button>
        </div>
      `;

      const clearBtn = listContainer.querySelector('#btn-clear-fac-filter');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
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
      listContainer.innerHTML = filtered.map((fac, idx) => {
        const isRecommended = idx === 0 || idx === 1;
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${fac.latitude},${fac.longitude}`;
        const isSelected = selectedFacilityId === fac.id;

        return `
          <div 
            class="card pharmacy-list-card ${isSelected ? 'selected' : ''}" 
            data-id="${fac.id}" 
            style="
              padding: 1.15rem; 
              cursor: pointer; 
              transition: all 0.2s ease;
              border-left: ${isSelected ? '4px solid var(--primary-600)' : '1px solid var(--border-color)'};
              background: ${isSelected ? 'var(--primary-50)' : 'var(--bg-surface)'};
            "
          >
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.4rem;">
              <div>
                ${isRecommended ? `
                  <span class="badge-recommended" style="margin-bottom: 0.25rem;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    MAP Recommended
                  </span>
                ` : ''}
                <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--slate-900); margin: 0;">
                  ${escapeHtml(fac.name)}
                </h3>
              </div>
              <span class="badge" style="background: var(--slate-100); color: var(--slate-700); font-size: 0.75rem;">
                ${escapeHtml(fac.type)}
              </span>
            </div>

            <p style="font-size: 0.8125rem; color: var(--slate-600); margin-bottom: 0.75rem; line-height: 1.4;">
              📍 ${escapeHtml(fac.address || 'Public Health Outpost')}
            </p>

            <div style="display: flex; justify-content: space-between; align-items: center; pt-2; border-top: 1px dashed var(--slate-200); margin-top: 0.5rem; padding-top: 0.5rem;">
              <div style="font-size: 0.8125rem; font-weight: 600; color: var(--primary-700);">
                ⚡ ${fac.distance_km} km away
              </div>

              <div style="display: flex; gap: 0.5rem;">
                <a 
                  href="${googleMapsUrl}" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="btn btn-sm btn-primary"
                  style="text-decoration: none; padding: 0.3rem 0.7rem; font-size: 0.75rem;"
                  onclick="event.stopPropagation();"
                >
                  🧭 GET DIRECTIONS
                </a>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Bind card click to select and center map
      listContainer.querySelectorAll('.pharmacy-list-card').forEach(card => {
        card.addEventListener('click', () => {
          const facId = card.getAttribute('data-id');
          selectPharmacyCard(facId);
        });
      });
    }
  }

  function selectPharmacyCard(facId) {
    selectedFacilityId = facId;
    const targetFac = allFacilities.find(f => f.id === facId);

    // Highlight card
    listContainer.querySelectorAll('.pharmacy-list-card').forEach(card => {
      const isTarget = card.getAttribute('data-id') === facId;
      card.style.borderLeft = isTarget ? '4px solid var(--primary-600)' : '1px solid var(--border-color)';
      card.style.background = isTarget ? 'var(--primary-50)' : 'var(--bg-surface)';
    });

    // Pan Leaflet map to marker
    if (targetFac && mapInstance && targetFac.latitude && targetFac.longitude) {
      mapInstance.flyTo([targetFac.latitude, targetFac.longitude], 14, { duration: 1.2 });
    }
  }

  // Bind type filter buttons
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
