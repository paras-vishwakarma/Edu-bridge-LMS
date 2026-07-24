import { mockUsers } from '../data/mockData';

// ── Storage Keys ──────────────────────────────────────────────────────────────
const USERS_KEY   = 'lerno_users';
const TOKEN_KEY   = 'lerno_token';
const USER_KEY    = 'lerno_user';
const SEEDED_KEY  = 'lerno_seeded_v3'; // bump only when mock schema changes

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Load users from localStorage.
 * Priority: stored data ALWAYS wins.
 * Only seeds from mockData on the very first run (no stored data at all).
 */
function loadUsers() {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed; // ✅ Return existing data — never overwrite it
      }
    }
  } catch { /* ignore corrupt data */ }

  // ── First-ever run: seed from mockData ────────────────────────────────────
  console.info('[AuthService] Seeding users from mockData for the first time.');
  const seeded = [...mockUsers];
  localStorage.setItem(USERS_KEY, JSON.stringify(seeded));
  localStorage.setItem(SEEDED_KEY, 'true');
  return seeded;
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(SEEDED_KEY, 'true'); // mark as seeded whenever we save
}

// ── Service ───────────────────────────────────────────────────────────────────
export const authService = {
  /**
   * Login via backend API.
   * Uses relative URL (/api/login) so it works with:
   *  - Vite proxy in development (forwards to :5000)
   *  - Same-origin Express server in production
   */
  async login(email, password) {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!data.success) return { success: false, error: data.error };

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return { success: true, token: data.token, user: data.user };
    } catch {
      return { success: false, error: 'Network error: ensure the backend server is running.' };
    }
  },

  /**
   * Register via backend API.
   * Uses relative URL (/api/register).
   */
  async register(name, email, password, role = 'student') {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await response.json();
      if (!data.success) return { success: false, error: data.error };

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return { success: true, token: data.token, user: data.user };
    } catch {
      return { success: false, error: 'Network error: ensure the backend server is running.' };
    }
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getCurrentUser() {
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (!stored) return null;
      const user = JSON.parse(stored);
      // Validate token hasn't expired
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            if (payload.exp && Date.now() > payload.exp) {
              // Token expired — log out silently
              localStorage.removeItem(TOKEN_KEY);
              localStorage.removeItem(USER_KEY);
              return null;
            }
          }
        } catch { /* ignore token parse errors */ }
      }
      return user;
    } catch {
      return null;
    }
  },

  /** Fetch all users from backend API (admin use). */
  async getAllUsers() {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) return [];
      return await response.json();
    } catch {
      return [];
    }
  },

  /** Update user status via backend API (admin ban/unban). */
  async updateUserStatus(userId, status) {
    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!data.success) return { success: false, error: data.error };

      // Sync local session if the current user's status was updated
      try {
        const sessionUser = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
        if (sessionUser && sessionUser.id === userId) {
          localStorage.setItem(USER_KEY, JSON.stringify({ ...sessionUser, status }));
        }
      } catch { /* ignore */ }

      return { success: true };
    } catch {
      return { success: false, error: 'Network error.' };
    }
  },

  /** Update user profile fields (kept in localStorage for session). */
  async updateUserProfile(userId, updates) {
    const users = loadUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return { success: false, error: 'User not found.' };

    // Never allow overwriting password through this method
    const { password: _pw, id: _id, ...safeUpdates } = updates;
    users[idx] = { ...users[idx], ...safeUpdates };
    saveUsers(users);

    // Sync session
    try {
      const sessionUser = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
      if (sessionUser && sessionUser.id === userId) {
        const { password: __pw, ...safeUser } = users[idx];
        localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
      }
    } catch { /* ignore */ }

    return { success: true, user: users[idx] };
  },

  /** Delete a user via backend API (admin use). */
  async deleteUser(userId) {
    try {
      const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      const data = await response.json();
      return data.success ? { success: true } : { success: false, error: data.error };
    } catch {
      return { success: false, error: 'Network error.' };
    }
  },

  async getUserById(userId) {
    const users = loadUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return null;
    const { password: _pw, ...safeUser } = user;
    return safeUser;
  },

  async changePassword(userId, currentPassword, newPassword) {
    const users = loadUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return { success: false, error: 'User not found.' };
    if (users[idx].password !== currentPassword) {
      return { success: false, error: 'Current password is incorrect.' };
    }
    users[idx].password = newPassword;
    saveUsers(users);
    return { success: true };
  },
};
