/**
 * AuthPage Component
 * Client authentication: Login, Registration, Forgot Password, and Password Reset.
 */

import { authService } from '../api/authService.js';
import { renderNavbar } from '../components/Navbar.js';

export function renderAuthPage(containerElement) {
  const currentUser = authService.getCurrentUser();

  // If already authenticated, show friendly session panel
  if (currentUser) {
    containerElement.innerHTML = `
      <div class="auth-wrapper">
        <div class="auth-card animate-fade-in text-center" style="padding: 2.5rem 2rem;">
          <div style="width: 4rem; height: 4rem; border-radius: 50%; background: var(--primary-50); color: var(--primary-600); margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Signed In as ${escapeHtml(currentUser.name)}</h3>
          <p style="font-size: 0.875rem; color: var(--slate-500); margin-bottom: 1.5rem;">
            ${escapeHtml(currentUser.email)} &bull; ${escapeHtml(currentUser.preferred_facility_name || 'Public Health Network')}
          </p>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <a href="#/dashboard" class="btn btn-primary btn-lg">
              Go to Client Dashboard &rarr;
            </a>
            <a href="#/profile" class="btn btn-secondary">
              View Profile & Alerts
            </a>
            <button type="button" class="btn btn-ghost text-danger" id="auth-logout-btn">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    `;

    const logoutBtn = containerElement.querySelector('#auth-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        authService.logout();
        renderNavbar(document.getElementById('navbar-container'));
        renderAuthPage(containerElement);
      });
    }
    return;
  }

  // Otherwise render the auth tabs card
  containerElement.innerHTML = `
    <div class="auth-wrapper">
      <div class="auth-card animate-fade-in">
        <div class="auth-header">
          <div style="display: flex; justify-content: center; margin-bottom: 0.75rem;">
            <div class="brand-icon-wrapper" style="width: 2.75rem; height: 2.75rem;">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 2v20M2 12h20"></path>
              </svg>
            </div>
          </div>
          <h2 style="font-size: 1.5rem; color: var(--slate-900);">Patient & Citizen Access</h2>
          <p style="font-size: 0.875rem; color: var(--slate-500); margin-top: 0.25rem;">
            Track personal prescriptions and receive shortage alerts.
          </p>
        </div>

        <!-- Auth Mode Tabs -->
        <div class="auth-tabs">
          <button class="auth-tab active" data-tab="login" id="tab-btn-login">Sign In</button>
          <button class="auth-tab" data-tab="signup" id="tab-btn-signup">Register</button>
          <button class="auth-tab" data-tab="forgot" id="tab-btn-forgot">Recover</button>
        </div>

        <div class="auth-body">
          <div id="auth-alert-box"></div>

          <!-- 1. LOGIN FORM -->
          <form id="form-login" class="animate-fade-in">
            <div class="form-group">
              <label class="form-label" for="login-email">Email Address</label>
              <input type="email" id="login-email" class="form-input" placeholder="e.g. name@example.com" value="akshay.sharma@healthnet.in" required />
            </div>

            <div class="form-group">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <label class="form-label" for="login-password">Password</label>
                <a href="#/auth" class="auth-link-forgot" style="font-size: 0.75rem; color: var(--primary-600);">Forgot?</a>
              </div>
              <input type="password" id="login-password" class="form-input" placeholder="Enter your password" value="password123" required />
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
              <label class="checkbox-label" style="font-size: 0.8125rem;">
                <input type="checkbox" id="login-remember" checked />
                Remember this device
              </label>
            </div>

            <button type="submit" class="btn btn-primary w-full" id="btn-submit-login">
              Sign In to MAP
            </button>

            <div style="margin-top: 1rem; padding: 0.75rem; background: var(--slate-50); border-radius: var(--radius-md); border: 1px dashed var(--slate-200); text-align: center; font-size: 0.75rem; color: var(--slate-500);">
              <strong>Quick Test Account:</strong><br>
              Pre-filled with verified test credentials for immediate review.
            </div>
          </form>

          <!-- 2. SIGNUP FORM -->
          <form id="form-signup" class="animate-fade-in" style="display: none;">
            <div class="form-group">
              <label class="form-label" for="signup-name">Full Name</label>
              <input type="text" id="signup-name" class="form-input" placeholder="e.g. Priya Sundaram" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="signup-email">Email Address</label>
              <input type="email" id="signup-email" class="form-input" placeholder="e.g. priya@example.com" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="signup-phone">Phone Number (SMS Alerts)</label>
              <input type="tel" id="signup-phone" class="form-input" placeholder="e.g. +91 98450 00000" />
            </div>

            <div class="form-group">
              <label class="form-label" for="signup-password">Create Password</label>
              <input type="password" id="signup-password" class="form-input" placeholder="Min. 6 characters" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="signup-confirm-password">Confirm Password</label>
              <input type="password" id="signup-confirm-password" class="form-input" placeholder="Repeat password" required />
            </div>

            <div style="margin-bottom: 1.25rem;">
              <label class="checkbox-label" style="font-size: 0.8125rem;">
                <input type="checkbox" id="signup-terms" required checked />
                I agree to the Public Health Data Terms & Privacy Policy
              </label>
            </div>

            <button type="submit" class="btn btn-primary w-full" id="btn-submit-signup">
              Create Patient Account
            </button>
          </form>

          <!-- 3. FORGOT PASSWORD FORM -->
          <form id="form-forgot" class="animate-fade-in" style="display: none;">
            <p style="font-size: 0.875rem; color: var(--slate-600); margin-bottom: 1rem;">
              Enter your registered email address and we will generate a secure reset link.
            </p>

            <div class="form-group">
              <label class="form-label" for="forgot-email">Account Email</label>
              <input type="email" id="forgot-email" class="form-input" placeholder="e.g. name@example.com" required />
            </div>

            <button type="submit" class="btn btn-primary w-full" id="btn-submit-forgot">
              Send Reset Instructions
            </button>

            <div style="text-align: center; margin-top: 1rem;">
              <button type="button" class="btn btn-ghost btn-sm text-primary" id="btn-back-to-login">
                &larr; Back to Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  // Tab switching logic
  const tabs = containerElement.querySelectorAll('.auth-tab');
  const forms = {
    login: containerElement.querySelector('#form-login'),
    signup: containerElement.querySelector('#form-signup'),
    forgot: containerElement.querySelector('#form-forgot')
  };
  const alertBox = containerElement.querySelector('#auth-alert-box');

  const switchTab = (tabKey) => {
    alertBox.innerHTML = '';
    tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === tabKey));
    for (const key in forms) {
      if (forms[key]) {
        forms[key].style.display = key === tabKey ? 'block' : 'none';
      }
    }
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.getAttribute('data-tab'));
    });
  });

  const forgotLink = containerElement.querySelector('.auth-link-forgot');
  if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('forgot');
    });
  }

  const backToLoginBtn = containerElement.querySelector('#btn-back-to-login');
  if (backToLoginBtn) {
    backToLoginBtn.addEventListener('click', () => switchTab('login'));
  }

  // Handle Login Submit
  forms.login.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = containerElement.querySelector('#login-email').value;
    const password = containerElement.querySelector('#login-password').value;
    const btn = containerElement.querySelector('#btn-submit-login');

    try {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> Verifying...`;
      await authService.login(email, password);
      renderNavbar(document.getElementById('navbar-container'));
      window.location.hash = '#/dashboard';
    } catch (err) {
      alertBox.innerHTML = `
        <div class="alert alert-danger" style="margin-bottom: 1rem;">
          ${escapeHtml(err.message)}
        </div>
      `;
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Sign In to MAP';
    }
  });

  // Handle Signup Submit
  forms.signup.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = containerElement.querySelector('#signup-name').value;
    const email = containerElement.querySelector('#signup-email').value;
    const phone = containerElement.querySelector('#signup-phone').value;
    const password = containerElement.querySelector('#signup-password').value;
    const confirmPassword = containerElement.querySelector('#signup-confirm-password').value;
    const btn = containerElement.querySelector('#btn-submit-signup');

    if (password !== confirmPassword) {
      alertBox.innerHTML = `<div class="alert alert-danger">Passwords do not match.</div>`;
      return;
    }

    try {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> Registering...`;
      await authService.register(name, email, phone, password);
      renderNavbar(document.getElementById('navbar-container'));
      window.location.hash = '#/dashboard';
    } catch (err) {
      alertBox.innerHTML = `<div class="alert alert-danger">${escapeHtml(err.message)}</div>`;
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Create Patient Account';
    }
  });

  // Handle Forgot Password Submit
  forms.forgot.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = containerElement.querySelector('#forgot-email').value;
    const btn = containerElement.querySelector('#btn-submit-forgot');

    try {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> Sending...`;
      const res = await authService.forgotPassword(email);
      alertBox.innerHTML = `<div class="alert alert-success">${escapeHtml(res.message)}</div>`;
    } catch (err) {
      alertBox.innerHTML = `<div class="alert alert-danger">${escapeHtml(err.message)}</div>`;
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Send Reset Instructions';
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
