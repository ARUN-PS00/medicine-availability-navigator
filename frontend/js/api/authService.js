/**
 * MAP Client Authentication Service
 * 
 * Manages client user sessions, profile details, and authentication states
 * via localStorage. Contains clearly marked integration stubs for Supabase Auth.
 */

const STORAGE_KEY_USER = 'map_client_user';
const STORAGE_KEY_TOKEN = 'map_client_token';

const DEMO_USER = {
  id: "usr-demo-001",
  name: "Dr. Akshay Sharma",
  email: "akshay.sharma@healthnet.in",
  phone: "+91 98450 12345",
  role: "client",
  preferred_facility_id: "F001",
  preferred_facility_name: "Synthetic District Hospital F001",
  notification_preferences: {
    email_critical: true,
    sms_urgent: true,
    restock_alerts: true
  },
  created_at: "2024-01-15T09:30:00Z"
};

class AuthService {
  constructor() {
    this.currentUser = null;
    this.listeners = [];
    this.init();
  }

  init() {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
      } catch (e) {
        this.currentUser = DEMO_USER;
        this.saveUser(DEMO_USER);
      }
    } else {
      // Default to demo user for frictionless evaluation
      this.currentUser = DEMO_USER;
      this.saveUser(DEMO_USER);
    }
  }

  saveUser(user) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEY_TOKEN, 'demo-jwt-token-client-session');
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_TOKEN);
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn(this.currentUser));
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Client Login
   * INTEGRATION POINT: When Supabase Auth is enabled, call:
   * const { data, error } = await supabase.auth.signInWithPassword({ email, password });
   */
  async login(email, password) {
    await new Promise(res => setTimeout(res, 400)); // Simulate async auth

    if (!email || !password) {
      throw new Error("Please enter both email and password.");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    const user = {
      id: "usr-" + Math.random().toString(36).substring(2, 9),
      name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      email: email,
      phone: "+91 98000 00000",
      role: "client",
      preferred_facility_id: "F001",
      preferred_facility_name: "Synthetic District Hospital F001",
      notification_preferences: {
        email_critical: true,
        sms_urgent: true,
        restock_alerts: true
      },
      created_at: new Date().toISOString()
    };

    this.saveUser(user);
    return user;
  }

  /**
   * Client Registration
   * INTEGRATION POINT: When Supabase Auth is enabled, call:
   * const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name, phone } } });
   */
  async register(name, email, phone, password) {
    await new Promise(res => setTimeout(res, 500));

    if (!name || !email || !password) {
      throw new Error("Full name, email, and password are required.");
    }

    if (password.length < 6) {
      throw new Error("Password must contain at least 6 characters.");
    }

    const user = {
      id: "usr-" + Math.random().toString(36).substring(2, 9),
      name,
      email,
      phone: phone || "+91 98000 00000",
      role: "client",
      preferred_facility_id: "F001",
      preferred_facility_name: "Synthetic District Hospital F001",
      notification_preferences: {
        email_critical: true,
        sms_urgent: false,
        restock_alerts: true
      },
      created_at: new Date().toISOString()
    };

    this.saveUser(user);
    return user;
  }

  /**
   * Logout
   */
  logout() {
    this.saveUser(null);
  }

  /**
   * Forgot Password request
   */
  async forgotPassword(email) {
    await new Promise(res => setTimeout(res, 400));
    if (!email || !email.includes('@')) {
      throw new Error("Please enter a valid email address.");
    }
    return { success: true, message: `Password reset instructions sent to ${email}.` };
  }

  /**
   * Reset Password
   */
  async resetPassword(token, newPassword) {
    await new Promise(res => setTimeout(res, 400));
    if (!newPassword || newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }
    return { success: true, message: "Password has been successfully updated. Please login." };
  }

  /**
   * Update Profile Details
   */
  async updateProfile(updates) {
    await new Promise(res => setTimeout(res, 300));
    if (!this.currentUser) throw new Error("No active user session.");

    const updatedUser = {
      ...this.currentUser,
      ...updates
    };

    this.saveUser(updatedUser);
    return updatedUser;
  }
}

export const authService = new AuthService();
