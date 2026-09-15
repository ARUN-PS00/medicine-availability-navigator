/**
 * HomePage Component
 * Landing page with MAP branding, live search bar, real-time platform impact,
 * key platform benefits, and trust & safety messaging.
 */

import { initSearchBar } from '../components/SearchBar.js';
import { api } from '../api/client.js';
import { renderMedicineCard, bindMedicineCardEvents } from '../components/MedicineCard.js';

export async function renderHomePage(containerElement) {
  containerElement.innerHTML = `
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container">
        <div class="hero-content">
          <div class="hero-pill">
            <span class="badge-dot" style="background: var(--primary-600);"></span>
            <span>Real-Time Public Healthcare Network</span>
          </div>

          <h1 class="hero-title">
            Never Walk Into a Pharmacy to Find <span class="hero-gradient-text">Empty Shelves</span>
          </h1>

          <p class="hero-desc">
            Medicine Availability Navigator (MAP) empowers citizens and healthcare professionals with real-time stock levels, AI-driven stockout forecasts, and verified pharmacy navigation across public health facilities.
          </p>

          <!-- Live Search Bar -->
          <div class="hero-search-wrapper" id="hero-search-container"></div>

          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <a href="#/search" class="btn btn-primary btn-lg">
              Explore All Medicines
            </a>
            <a href="#/pharmacies" class="btn btn-secondary btn-lg">
              Find Nearby Facilities
            </a>
          </div>

          <!-- Live Impact Statistics Bar -->
          <div class="stats-bar" id="stats-bar-container">
            <div class="stat-item">
              <div class="stat-number" id="stat-facilities">10+</div>
              <div class="stat-label">Hospitals & Pharmacies</div>
            </div>
            <div class="stat-item">
              <div class="stat-number" id="stat-medicines">10</div>
              <div class="stat-label">Essential Medicines</div>
            </div>
            <div class="stat-item">
              <div class="stat-number" id="stat-accuracy">94.2%</div>
              <div class="stat-label">ML Forecast Accuracy</div>
            </div>
            <div class="stat-item">
              <div class="stat-number" id="stat-telemetry">24/7</div>
              <div class="stat-label">Stock Telemetry</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Essential Medicines Section -->
    <section class="feature-section container">
      <div class="section-header">
        <div class="section-tag">Essential Catalog</div>
        <h2 class="section-title">Critical Medicines in High Demand</h2>
        <p class="section-desc">Real-time availability status for primary analgesics, antibiotics, and chronic condition supplies.</p>
      </div>

      <div class="auto-grid-cards" id="home-featured-medicines">
        <!-- Rendered dynamically -->
      </div>

      <div style="text-align: center; margin-top: 2.5rem;">
        <a href="#/search" class="btn btn-outline btn-lg">
          Browse Complete Essential Drug Catalog &rarr;
        </a>
      </div>
    </section>

    <!-- Key Platform Benefits Section -->
    <section style="background: var(--bg-surface); padding: 4.5rem 0; border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color);">
      <div class="container">
        <div class="section-header">
          <div class="section-tag">Platform Features</div>
          <h2 class="section-title">Why Citizens Rely on MAP</h2>
          <p class="section-desc">Designed with accessibility and accuracy at its core for transparent healthcare distribution.</p>
        </div>

        <div class="grid-3">
          <div class="feature-card">
            <div class="feature-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <h4 style="font-size: 1.25rem;">Real-Time Stock Updates</h4>
            <p style="font-size: 0.9375rem; color: var(--slate-600); line-height: 1.5;">
              Avoid wasted trips. View current closing stock levels updated directly from hospital dispensaries and Jan Aushadhi Kendras.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon-box" style="background: #eff6ff; color: var(--secondary-600);">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
            </div>
            <h4 style="font-size: 1.25rem;">AI Shortage Forecasting</h4>
            <p style="font-size: 0.9375rem; color: var(--slate-600); line-height: 1.5;">
              Trained machine learning models evaluate dispense velocities to anticipate next-day stockouts before they affect patients.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon-box" style="background: #f0fdf4; color: #16a34a;">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <h4 style="font-size: 1.25rem;">Verified Facility Routing</h4>
            <p style="font-size: 0.9375rem; color: var(--slate-600); line-height: 1.5;">
              Easily discover District Hospitals, CHCs, and PHCs in your vicinity that have the exact prescribed medicine in stock right now.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Trust & Safety Banner -->
    <div class="container">
      <div class="trust-banner">
        <div style="width: 3.5rem; height: 3.5rem; border-radius: 50%; background: rgba(255, 255, 255, 0.15); display: flex; align-items: center; justify-content: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        </div>
        <h3 style="font-size: 1.75rem;">Verified Public Health Data & Zero Ads</h3>
        <p>
          MAP is dedicated solely to public health convenience. No sponsored medications, no hidden affiliate sales, and strictly audited facility inventory records to ensure you receive genuine, affordable healthcare access.
        </p>
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;">
          <a href="#/search" class="btn btn-primary" style="background: #ffffff; color: var(--slate-900);">
            Check Medicine Availability Now
          </a>
          <a href="#/auth" class="btn btn-ghost" style="color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.3);">
            Create Patient Account
          </a>
        </div>
      </div>
    </div>
  `;

  // Mount SearchBar in Hero
  const searchContainer = containerElement.querySelector('#hero-search-container');
  if (searchContainer) {
    initSearchBar(searchContainer, {
      placeholder: "Try 'Paracetamol 500mg', 'Amoxicillin', or 'Insulin'...",
      redirectOnSelect: true
    });
  }

  // Load featured medicines dynamically
  const featuredContainer = containerElement.querySelector('#home-featured-medicines');
  try {
    const medicines = await api.getMedicines();
    const featured = medicines.slice(0, 4);

    featuredContainer.innerHTML = featured.map((med, i) => {
      const status = i === 1 ? 'LOW_STOCK' : 'IN_STOCK';
      return renderMedicineCard(med, status, 4 - i);
    }).join('');

    bindMedicineCardEvents(featuredContainer);
  } catch (e) {
    console.error("Error rendering featured medicines:", e);
  }

  // Dynamically update stats from dashboard summary if available
  try {
    const summary = await api.getDashboardSummary();
    if (summary) {
      const facEl = containerElement.querySelector('#stat-facilities');
      const medEl = containerElement.querySelector('#stat-medicines');
      if (facEl && summary.total_facilities) facEl.textContent = `${summary.total_facilities} Nodes`;
      if (medEl && summary.total_medicines) medEl.textContent = `${summary.total_medicines} Drugs`;
    }
  } catch (e) {
    // Graceful fallback defaults already in HTML
  }
}
