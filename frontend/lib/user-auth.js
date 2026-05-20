// User auth helpers — separate from admin auth
const TOKEN_KEY = 'user_token';
const USER_KEY  = 'user_data';

export const userAuth = {
  isLoggedIn: () => typeof window !== 'undefined' && !!localStorage.getItem(TOKEN_KEY),
  getToken:   () => (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null),
  getUser:    () => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setSession: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  authHeaders: () => {
    const t = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    return t ? { Authorization: `Bearer ${t}` } : {};
  },
};
