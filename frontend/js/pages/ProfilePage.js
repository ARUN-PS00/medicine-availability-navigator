/**
 * ProfilePage Component
 * Client profile view: personal information, notification preferences,
 * preferred dispensary, saved medications, and session management.
 */

import { authService } from '../api/authService.js';
import { api } from '../api/client.js';
import { state } from '../state.js';
import { renderNavbar } from '../components/Navbar.js';
import { renderMedicineCard, bindMedicineCardEvents } from '../components/MedicineCard.js';

export async function renderProfilePage(containerElement) {
  const user = authService.getCurrentUser() || {
    name: "Dr. Akshay Sharma",
    email: "akshay.sharma@healthnet.in",
    phone: "+91 98450 12345",
    preferred_facility_name: "Synthetic District Hospital F001",
    notification_preferences: { email_critical: true, sms_urgent: true, restock_alerts: true }
  };

  const facilities = await api.getFacilities();

  containerElement.innerHTML = `
    <div class="container animate-fade-in">
      <div style="margin-bottom: 2rem;">
        <h1 style="font-size: 2rem; margin-bottom: 0.25rem;">Patient & Account Profile</h1>
        <p style="color: var(--slate-600); font-size: 0.9375rem;">
          Manage your personal contact details, health alerts, and preferred hospital dispensary.
        </p>
      </div>

      <div class="profile-layout">
        <!-- Profile Sidebar / Quick Summary Card -->
        <aside>
          <div class="card" style="text-align: center; padding: 2rem 1.5rem; margin-bottom: 1.5rem;">
            <div style="width: 5rem; height: 5rem; border-radius: 50%; background: linear-gradient(135deg, var(--primary-600), var(--secondary-600)); color: #fff; font-size: 1.75rem; font-weight: 700; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; box-shadow: var(--shadow-teal);">
              ${getInitials(user.name)}
            </div>
            <h3 style="font-size: 1.25rem; margin-bottom: 0.25rem;">${escapeHtml(user.name)}</h3>
            <p style="font-size: 0.8125rem; color: var(--slate-500); margin-bottom: 1rem;">${escapeHtml(user.email)}</p>

            <span class="badge badge-primary" style="margin-bottom: 1.5rem;">
              Verified Citizen Account
            </span>

            <div style="border-top: 1px solid var(--slate-100); padding-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem; text-align: left; font-size: 0.8125rem;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--slate-400);">Account ID:</span>
                <span style="font-weight: 600; color: var(--slate-700);">${escapeHtml(user.id || 'usr-client-01')}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--slate-400);">Registered:</span>
                <span style="font-weight: 600; color: var(--slate-700);">January 2024</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--slate-400);">Telemetry Feed:</span>
                <span style="font-weight: 600; color: #10b981;">Online (P5.2)</span>
              </div>
            </div>

            <div style="margin-top: 1.5rem; border-top: 1px solid var(--slate-100); padding-top: 1.25rem;">
              <button type="button" class="btn btn-danger w-full btn-sm" id="profile-logout-btn">
                Sign Out from Session
              </button>
            </div>
          </div>
        </aside>

        <!-- Main Form & Settings Panels -->
        <main style="display: flex; flex-direction: column; gap: 2rem;">
          <!-- 1. Personal Details Form -->
          <div class="card">
            <div class="card-header">
              <h3 style="font-size: 1.25rem;">Personal Details & Dispensary</h3>
            </div>
            <div class="card-body">
              <div id="profile-feedback-box"></div>

              <form id="profile-edit-form">
                <div class="grid-2">
                  <div class="form-group">
                    <label class="form-label" for="prof-name">Full Name</label>
                    <input type="text" id="prof-name" class="form-input" value="${escapeHtml(user.name)}" required />
                  </div>

                  <div class="form-group">
                    <label class="form-label" for="prof-email">Email Address</label>
                    <input type="email" id="prof-email" class="form-input" value="${escapeHtml(user.email)}" required />
                  </div>
                </div>

                <div class="grid-2">
                  <div class="form-group">
                    <label class="form-label" for="prof-phone">Contact Phone</label>
                    <input type="tel" id="prof-phone" class="form-input" value="${escapeHtml(user.phone || '')}" />
                  </div>

                  <div class="form-group">
                    <label class="form-label" for="prof-facility">Preferred Health Facility</label>
                    <select id="prof-facility" class="form-select">
                      ${facilities.map(fac => `
                        <option value="${fac.id}" ${user.preferred_facility_id === fac.id ? 'selected' : ''}>
                          ${escapeHtml(fac.name)} (${escapeHtml(fac.type)})
                        </option>
                      `).join('')}
                    </select>
                  </div>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem;">
                  <button type="submit" class="btn btn-primary" id="btn-save-profile">
                    Save Profile Changes
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- 2. Notification Preferences -->
          <div class="card">
            <div class="card-header">
              <h3 style="font-size: 1.25rem;">Stockout & Restock Notifications</h3>
            </div>
            <div class="card-body">
              <div style="display: flex; flex-direction: column; gap: 1rem;">
                <label class="checkbox-label" style="justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--slate-100);">
                  <div>
                    <div style="font-weight: 600; color: var(--slate-800);">Critical Stockout Alerts (Email)</div>
                    <div style="font-size: 0.8125rem; color: var(--slate-500);">Receive immediate notification if a saved medication enters critical supply deficit.</div>
                  </div>
                  <input type="checkbox" id="pref-email-critical" checked />
                </label>

                <label class="checkbox-label" style="justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--slate-100);">
                  <div>
                    <div style="font-weight: 600; color: var(--slate-800);">Urgent Shortage SMS Notification</div>
                    <div style="font-size: 0.8125rem; color: var(--slate-500);">Receive instant SMS when your preferred dispensary experiences an imminent stockout.</div>
                  </div>
                  <input type="checkbox" id="pref-sms-urgent" checked />
                </label>

                <label class="checkbox-label" style="justify-content: space-between; padding: 0.5rem 0;">
                  <div>
                    <div style="font-weight: 600; color: var(--slate-800);">Restock Influx Notices</div>
                    <div style="font-size: 0.8125rem; color: var(--slate-500);">Alerts when new inventory is processed and received at your primary center.</div>
                  </div>
                  <input type="checkbox" id="pref-restock-alerts" checked />
                </label>
              </div>
            </div>
          </div>

          <!-- 3. Saved Medications Quick View -->
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
              <h3 style="font-size: 1.25rem;">My Bookmarked Medications</h3>
              <a href="#/search" class="btn btn-ghost btn-sm text-primary">Browse Drug Catalog &rarr;</a>
            </div>
            <div class="auto-grid-cards" id="profile-saved-medicines">
              <!-- Rendered dynamically -->
            </div>
          </div>
        </main>
      </div>
    </div>
  `;

  // Render Saved Medicines
  try {
    const allMedicines = await api.getMedicines();
    const savedIds = state.getSavedIds();
    const savedMeds = allMedicines.filter(m => savedIds.includes(m.id));
    const savedContainer = containerElement.querySelector('#profile-saved-medicines');

    if (savedMeds.length === 0) {
      savedContainer.innerHTML = `<div style="padding: 1.5rem; background: var(--bg-surface); border-radius: var(--radius-md); border: 1px dashed var(--border-color); color: var(--text-muted); text-align: center; grid-column: 1 / -1;">No medications saved yet. Click the bookmark icon on any medicine card to pin it here.</div>`;
    } else {
      savedContainer.innerHTML = savedMeds.map(m => renderMedicineCard(m, 'IN_STOCK', 3)).join('');
      bindMedicineCardEvents(savedContainer);
    }
  } catch (err) {
    console.error("Error loading profile saved medicines:", err);
  }

  // Handle Form Submit
  const form = containerElement.querySelector('#profile-edit-form');
  const feedbackBox = containerElement.querySelector('#profile-feedback-box');
  const saveBtn = containerElement.querySelector('#btn-save-profile');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = containerElement.querySelector('#prof-name').value;
    const email = containerElement.querySelector('#prof-email').value;
    const phone = containerElement.querySelector('#prof-phone').value;
    const facSelect = containerElement.querySelector('#prof-facility');
    const preferredFacilityId = facSelect.value;
    const preferredFacilityName = facSelect.options[facSelect.selectedIndex].text;

    try {
      saveBtn.disabled = true;
      saveBtn.innerHTML = `<span class="spinner"></span> Saving...`;

      await authService.updateProfile({
        name,
        email,
        phone,
        preferred_facility_id: preferredFacilityId,
        preferred_facility_name: preferredFacilityName
      });

      renderNavbar(document.getElementById('navbar-container'));
      feedbackBox.innerHTML = `
        <div class="alert alert-success animate-fade-in" style="margin-bottom: 1rem;">
          Profile information and notification preferences updated successfully!
        </div>
      `;
    } catch (err) {
      feedbackBox.innerHTML = `<div class="alert alert-danger">${escapeHtml(err.message)}</div>`;
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = 'Save Profile Changes';
    }
  });

  // Handle Logout
  const logoutBtn = containerElement.querySelector('#profile-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      authService.logout();
      renderNavbar(document.getElementById('navbar-container'));
      window.location.hash = '#/auth';
    });
  }
}

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
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
