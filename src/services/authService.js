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

/** Generate a simple JWT-like token string (not cryptographically secure) */
function makeToken(user) {
  const payload = btoa(
    JSON.stringify({ id: user.id, role: user.role, exp: Date.now() + 86_400_000 })
  );
  return `lerno.${payload}.sig`;
}

// ── Service ───────────────────────────────────────────────────────────────────
export const authService = {
  async login(email, password) {
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!data.success) return { success: false, error: data.error };
      
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return { success: true, token: data.token, user: data.user };
    } catch (e) {
      return { success: false, error: 'Network error: ensure backend is running.' };
    }
  },

  async register(name, email, password, role = 'student') {
    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await response.json();
      if (!data.success) return { success: false, error: data.error };

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return { success: true, token: data.token, user: data.user };
    } catch (e) {
      return { success: false, error: 'Network error: ensure backend is running.' };
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

  async getAllUsers() {
    try {
      const response = await fetch('http://localhost:5000/api/users');
      return await response.json();
    } catch (e) {
      return [];
    }
  },

  async updateUserStatus(userId, status) {
    const users = loadUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return { success: false, error: 'User not found.' };
    users[idx].status = status;
    saveUsers(users);

    // If the user updated their own status, update the session too
    try {
      const sessionUser = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
      if (sessionUser && sessionUser.id === userId) {
        localStorage.setItem(USER_KEY, JSON.stringify({ ...sessionUser, status }));
      }
    } catch { /* ignore */ }

    return { success: true };
  },

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

  async deleteUser(userId) {
    const users = loadUsers();
    const filtered = users.filter(u => u.id !== userId);
    if (filtered.length === users.length) return { success: false, error: 'User not found.' };
    saveUsers(filtered);
    return { success: true };
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
