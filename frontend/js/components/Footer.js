/**
 * Footer Component
 * Healthcare footer with emergency contacts, platform navigation, and trust statement.
 */

export function renderFooter(containerElement) {
  containerElement.innerHTML = `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <!-- Column 1: Brand & Mission -->
          <div class="footer-brand">
            <div class="footer-brand-title">
              <div style="width: 2rem; height: 2rem; border-radius: var(--radius-sm); background: var(--primary-600); display: flex; align-items: center; justify-content: center; color: #fff;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M12 2v20M2 12h20"></path>
                </svg>
              </div>
              <span>Medicine Availability Navigator</span>
            </div>
            <p style="font-size: 0.875rem; color: var(--slate-400); line-height: 1.5;">
              A patient-centric digital platform providing real-time stock availability, AI-powered stockout early warnings, and verified pharmacy navigation across public health networks.
            </p>
            <div style="display: flex; gap: 0.5rem; align-items: center; margin-top: 0.5rem;">
              <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border-color: rgba(16, 185, 129, 0.3);">
                <span class="badge-dot" style="background: #10b981;"></span>
                Live Telemetry Active
              </span>
            </div>
          </div>

          <!-- Column 2: Navigation -->
          <div>
            <h5 class="footer-col-title">Navigation</h5>
            <div class="footer-links">
              <a href="#/">Home</a>
              <a href="#/search">Find Medicines</a>
              <a href="#/pharmacies">Pharmacies & Facilities</a>
              <a href="#/dashboard">Client Dashboard</a>
              <a href="#/notifications">Stock Alerts</a>
            </div>
          </div>

          <!-- Column 3: Patient Care -->
          <div>
            <h5 class="footer-col-title">Resources</h5>
            <div class="footer-links">
              <a href="#/profile">My Account & Alerts</a>
              <a href="#/search?category=Antibiotics%20%26%20Antimicrobials">Antibiotic Availability</a>
              <a href="#/search?category=Antidiabetics">Diabetes Management</a>
              <a href="#/search?category=Cardiovascular%20%26%20Antihypertensives">Cardiac & BP Stock</a>
              <a href="#/auth">Patient Sign In</a>
            </div>
          </div>

          <!-- Column 4: Emergency Contacts & Disclaimer -->
          <div>
            <h5 class="footer-col-title">Emergency Helplines</h5>
            <div class="footer-emergency-box">
              <div class="footer-emergency-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                National Health Helplines
              </div>
              <div class="footer-emergency-text">
                Emergency & Ambulance: <strong>108</strong> / <strong>102</strong><br>
                National Health Portal: <strong>1800-180-1104</strong><br>
                Poison Info Helpline: <strong>1800-116-117</strong>
              </div>
            </div>
            <p style="font-size: 0.75rem; color: var(--slate-500); margin-top: 0.75rem; line-height: 1.4;">
              * Medical Disclaimer: Information on MAP reflects reported inventory states and predictive supply indicators. Always consult licensed medical professionals for diagnosis and treatment.
            </p>
          </div>
        </div>

        <!-- Footer Bottom -->
        <div class="footer-bottom">
          <div>
            &copy; ${new Date().getFullYear()} Medicine Availability Navigator (MAP). All rights reserved.
          </div>
          <div style="display: flex; gap: 1.25rem;">
            <a href="#/" style="color: var(--slate-400);">Privacy Policy</a>
            <a href="#/" style="color: var(--slate-400);">Terms of Service</a>
            <a href="#/" style="color: var(--slate-400);">Public Data Charter</a>
          </div>
        </div>
      </div>
    </footer>
  `;
}
