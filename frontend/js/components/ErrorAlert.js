/**
 * ErrorAlert Component
 * Dismissible error alert with optional retry action.
 */

export function renderErrorAlert(message, { retryAction = null, retryButtonText = "Try Again" } = {}) {
  const alertId = 'alert-' + Math.random().toString(36).substring(2, 8);

  setTimeout(() => {
    const el = document.getElementById(alertId);
    if (el && retryAction) {
      const btn = el.querySelector('.alert-retry-btn');
      if (btn) btn.addEventListener('click', retryAction);
    }
  }, 50);

  return `
    <div class="alert alert-danger animate-fade-in" id="${alertId}">
      <svg style="flex-shrink: 0; margin-top: 2px;" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <div style="flex: 1;">
        <div style="font-weight: 600; margin-bottom: 2px;">Unable to load data</div>
        <div>${escapeHtml(message || "An unexpected error occurred while communicating with the service.")}</div>
        ${retryAction ? `
          <button type="button" class="btn btn-danger btn-sm alert-retry-btn" style="margin-top: 0.5rem;">
            ${retryButtonText}
          </button>
        ` : ''}
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
