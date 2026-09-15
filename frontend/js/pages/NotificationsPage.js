/**
 * NotificationsPage Component
 * Patient notification center displaying stock alerts, restock updates,
 * and system telemetry notices with read/unread filtering.
 */

import { state } from '../state.js';
import { renderNavbar } from '../components/Navbar.js';
import { renderEmptyState } from '../components/EmptyState.js';

export function renderNotificationsPage(containerElement) {
  let filterMode = 'all'; // 'all' or 'unread'

  const renderContent = () => {
    const allNotifications = state.getNotifications();
    const unreadCount = state.getUnreadNotificationsCount();

    const filtered = filterMode === 'unread'
      ? allNotifications.filter(n => !n.read)
      : allNotifications;

    containerElement.innerHTML = `
      <div class="container animate-fade-in">
        <!-- Page Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 style="font-size: 2rem; margin-bottom: 0.25rem;">Alert & Notification Center</h1>
            <p style="color: var(--slate-600); font-size: 0.9375rem;">
              Critical shortage warnings and replenishment notices for your monitored medications.
            </p>
          </div>

          <div style="display: flex; gap: 0.75rem; align-items: center;">
            <button type="button" class="btn btn-outline btn-sm" id="btn-mark-all-read" ${unreadCount === 0 ? 'disabled' : ''}>
              Mark All as Read
            </button>
            <button type="button" class="btn btn-ghost btn-sm text-danger" id="btn-clear-all-notifs">
              Clear All
            </button>
          </div>
        </div>

        <!-- Filter Tabs -->
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
          <button type="button" class="btn btn-sm ${filterMode === 'all' ? 'btn-primary' : 'btn-ghost'}" id="filter-all-btn">
            All Notifications (${allNotifications.length})
          </button>
          <button type="button" class="btn btn-sm ${filterMode === 'unread' ? 'btn-primary' : 'btn-ghost'}" id="filter-unread-btn">
            Unread Only (${unreadCount})
          </button>
        </div>

        <!-- Notification List -->
        <div id="notifications-list-container">
          ${filtered.length === 0 ? renderEmptyState({
            title: filterMode === 'unread' ? "No Unread Alerts" : "All Caught Up!",
            description: filterMode === 'unread' 
              ? "You have acknowledged all active medicine availability notifications."
              : "No stockout notifications or supply warnings currently on file.",
            actionText: "Browse Medicine Catalog",
            actionHref: "#/search"
          }) : filtered.map(notif => {
            const iconBg = notif.type === 'critical' 
              ? '#fee2e2' 
              : (notif.type === 'warning' ? '#fef3c7' : '#eff6ff');
            const iconColor = notif.type === 'critical' 
              ? '#b91c1c' 
              : (notif.type === 'warning' ? '#b45309' : '#1d4ed8');

            return `
              <div class="notification-item ${notif.read ? '' : 'unread'}" id="notif-item-${notif.id}">
                <div class="notification-icon" style="background: ${iconBg}; color: ${iconColor};">
                  ${notif.type === 'critical' ? `
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                  ` : `
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                  `}
                </div>

                <div style="flex: 1;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.25rem;">
                    <h4 style="font-size: 1rem; font-weight: 700; color: var(--slate-900);">
                      ${escapeHtml(notif.title)}
                    </h4>
                    <span style="font-size: 0.75rem; color: var(--slate-400); white-space: nowrap;">
                      ${escapeHtml(notif.timestamp)}
                    </span>
                  </div>

                  <p style="font-size: 0.875rem; color: var(--slate-600); margin-bottom: 0.75rem; line-height: 1.5;">
                    ${escapeHtml(notif.message)}
                  </p>

                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    ${notif.link ? `
                      <a href="${notif.link}" class="btn btn-outline btn-sm" style="font-size: 0.75rem;">
                        View Medicine Status &rarr;
                      </a>
                    ` : '<span></span>'}

                    ${!notif.read ? `
                      <button type="button" class="btn btn-ghost btn-sm text-primary mark-read-btn" data-id="${notif.id}">
                        Mark as read
                      </button>
                    ` : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Event Bindings
    const filterAllBtn = containerElement.querySelector('#filter-all-btn');
    const filterUnreadBtn = containerElement.querySelector('#filter-unread-btn');

    if (filterAllBtn) {
      filterAllBtn.addEventListener('click', () => {
        filterMode = 'all';
        renderContent();
      });
    }

    if (filterUnreadBtn) {
      filterUnreadBtn.addEventListener('click', () => {
        filterMode = 'unread';
        renderContent();
      });
    }

    const markAllBtn = containerElement.querySelector('#btn-mark-all-read');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', () => {
        state.markAllNotificationsAsRead();
        renderNavbar(document.getElementById('navbar-container'));
        renderContent();
      });
    }

    const clearAllBtn = containerElement.querySelector('#btn-clear-all-notifs');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to clear all notifications?")) {
          state.clearAllNotifications();
          renderNavbar(document.getElementById('navbar-container'));
          renderContent();
        }
      });
    }

    containerElement.querySelectorAll('.mark-read-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        state.markNotificationAsRead(id);
        renderNavbar(document.getElementById('navbar-container'));
        renderContent();
      });
    });
  };

  renderContent();
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
