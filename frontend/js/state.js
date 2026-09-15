/**
 * MAP Reactive State Store
 * 
 * Manages client bookmarks, recently viewed medicines, notifications,
 * and search history with localStorage persistence and pub/sub updates.
 */

import { MOCK_NOTIFICATIONS } from './api/mockData.js';

const KEY_SAVED = 'map_saved_medicines';
const KEY_RECENT = 'map_recent_medicines';
const KEY_NOTIFICATIONS = 'map_notifications';
const KEY_SEARCH_HISTORY = 'map_search_history';

class AppState {
  constructor() {
    this.subscribers = new Map();
    this.savedMedicineIds = this.load(KEY_SAVED, ['M001', 'M002']);
    this.recentMedicineIds = this.load(KEY_RECENT, ['M001', 'M003', 'M005']);
    this.notifications = this.load(KEY_NOTIFICATIONS, MOCK_NOTIFICATIONS);
    this.searchHistory = this.load(KEY_SEARCH_HISTORY, ['Paracetamol', 'Amoxicillin', 'Metformin']);
  }

  load(key, fallback) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  save(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn("Could not persist to localStorage:", e);
    }
  }

  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    this.subscribers.get(event).push(callback);
    return () => {
      const list = this.subscribers.get(event) || [];
      this.subscribers.set(event, list.filter(fn => fn !== callback));
    };
  }

  emit(event, data) {
    const list = this.subscribers.get(event) || [];
    list.forEach(fn => fn(data));
  }

  // Saved / Bookmarks
  isSaved(medicineId) {
    return this.savedMedicineIds.includes(medicineId);
  }

  toggleSave(medicineId) {
    if (this.isSaved(medicineId)) {
      this.savedMedicineIds = this.savedMedicineIds.filter(id => id !== medicineId);
    } else {
      this.savedMedicineIds.unshift(medicineId);
    }
    this.save(KEY_SAVED, this.savedMedicineIds);
    this.emit('saved_changed', this.savedMedicineIds);
    return this.isSaved(medicineId);
  }

  getSavedIds() {
    return [...this.savedMedicineIds];
  }

  // Recently Viewed
  addRecent(medicineId) {
    this.recentMedicineIds = [medicineId, ...this.recentMedicineIds.filter(id => id !== medicineId)].slice(0, 8);
    this.save(KEY_RECENT, this.recentMedicineIds);
    this.emit('recent_changed', this.recentMedicineIds);
  }

  getRecentIds() {
    return [...this.recentMedicineIds];
  }

  // Search History
  addSearchQuery(query) {
    if (!query || !query.trim()) return;
    const clean = query.trim();
    this.searchHistory = [clean, ...this.searchHistory.filter(q => q.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
    this.save(KEY_SEARCH_HISTORY, this.searchHistory);
  }

  getSearchHistory() {
    return [...this.searchHistory];
  }

  clearSearchHistory() {
    this.searchHistory = [];
    this.save(KEY_SEARCH_HISTORY, []);
  }

  // Notifications
  getNotifications() {
    return [...this.notifications];
  }

  getUnreadNotificationsCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  markNotificationAsRead(id) {
    this.notifications = this.notifications.map(n => n.id === id ? { ...n, read: true } : n);
    this.save(KEY_NOTIFICATIONS, this.notifications);
    this.emit('notifications_changed', this.notifications);
  }

  markAllNotificationsAsRead() {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    this.save(KEY_NOTIFICATIONS, this.notifications);
    this.emit('notifications_changed', this.notifications);
  }

  clearAllNotifications() {
    this.notifications = [];
    this.save(KEY_NOTIFICATIONS, []);
    this.emit('notifications_changed', []);
  }
}

export const state = new AppState();
