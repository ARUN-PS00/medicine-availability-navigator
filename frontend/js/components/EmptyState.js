/**
 * EmptyState Component
 * Visual empty states for search queries, bookmarks, or missing records.
 */

export function renderEmptyState({
  icon = null,
  title = "No items found",
  description = "There are no records matching your current criteria or filters.",
  actionText = null,
  actionHref = null,
  actionId = null
} = {}) {
  const defaultIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  `;

  return `
    <div class="empty-state animate-fade-in">
      <div class="empty-state-icon">
        ${icon || defaultIcon}
      </div>
      <h3 class="empty-state-title">${escapeHtml(title)}</h3>
      <p class="empty-state-desc">${escapeHtml(description)}</p>
      ${actionText ? (
        actionHref ? `
          <a href="${actionHref}" class="btn btn-primary">
            ${escapeHtml(actionText)}
          </a>
        ` : `
          <button type="button" class="btn btn-primary" id="${actionId || 'empty-action-btn'}">
            ${escapeHtml(actionText)}
          </button>
        `
      ) : ''}
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
