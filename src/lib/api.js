import axios from 'axios';

/**
 * The API root, as configured for the build. It already ends in "/api"
 * (for example "https://api.example.com/api"), so paths are written without it.
 */
export const API_URL = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

const SESSION_KEYS = ['adminLoggedIn', 'token', 'refresh_token'];

export const isSignedIn = () => !!localStorage.getItem('adminLoggedIn');

export function saveSession({ token, refresh_token: refreshToken }) {
  localStorage.setItem('adminLoggedIn', 'true');
  if (token) localStorage.setItem('token', token);
  if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
}

export function signOut() {
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
  if (window.location.pathname !== '/login') window.location.href = '/login';
}

/** The signed-in admin's name, read from the token. */
export function adminName() {
  try {
    const payload = JSON.parse(atob((localStorage.getItem('token') || '').split('.')[1]));
    return payload.username || payload.name || 'المدير';
  } catch (error) {
    return 'المدير';
  }
}

/** For calls made with fetch(): the same Authorization header axios sends. */
export const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/** The API client the pages use: paths are relative to the API root. */
export const api = axios.create({ baseURL: API_URL });

let refreshing = null;

function refreshToken() {
  if (!refreshing) {
    const stored = localStorage.getItem('refresh_token');
    if (!stored) return Promise.reject(new Error('no refresh token'));
    // A bare axios call, so a failing refresh cannot loop back into the interceptor below
    refreshing = axios
      .post(`${API_URL}/auth/refresh`, { refresh_token: stored })
      .then(({ data }) => {
        localStorage.setItem('token', data.token);
        if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
        return data.token;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

/** Adds the token to every request and renews it once when the server answers 401. */
function withSession(client) {
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config;
      if (!error.response || error.response.status !== 401 || !original || original._retried) {
        return Promise.reject(error);
      }
      original._retried = true;
      try {
        const token = await refreshToken();
        original.headers.Authorization = `Bearer ${token}`;
        return client(original);
      } catch (refreshError) {
        signOut();
        return Promise.reject(error);
      }
    },
  );
}

withSession(api);
// Pages written before this client existed call the global axios directly
withSession(axios);

/**
 * Pages written before this client existed call fetch() directly, and several of them forgot the
 * Authorization header, so their saves were refused by the server. Until each is moved to `api`,
 * every fetch() to our own API gets the token here.
 */
if (typeof window !== 'undefined' && window.fetch && API_URL && !window.fetch.__withSession) {
  const plainFetch = window.fetch.bind(window);
  const sessionFetch = (input, init = {}) => {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const token = localStorage.getItem('token');
    if (!token || !url.startsWith(API_URL)) return plainFetch(input, init);
    const headers = new Headers(init.headers || (typeof input !== 'string' && input.headers) || {});
    // "undefined" was being sent as a real header value by one page
    if (headers.get('Content-Type') === 'undefined') headers.delete('Content-Type');
    if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
    return plainFetch(input, { ...init, headers });
  };
  sessionFetch.__withSession = true;
  window.fetch = sessionFetch;
}

/** A readable message for a failed request. */
export function errorMessage(error, fallback = 'حدث خطأ غير متوقع. حاول مرة أخرى.') {
  const detail = error && error.response && error.response.data && error.response.data.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail[0] && detail[0].msg) return detail[0].msg;
  if (error && error.message === 'Network Error') return 'تعذّر الاتصال بالخادم. تحقق من الشبكة.';
  return fallback;
}
