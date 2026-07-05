// Auth is an HttpOnly session cookie (Sanctum stateful mode) — no token is
// ever held in JS. Requests go through Vite's dev proxy (see vite.config.js),
// so this stays same-origin from the browser's point of view.

const cookie = (name) =>
  decodeURIComponent((document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)')) || [])[1] || '');

export const csrf = () => fetch('/sanctum/csrf-cookie', { credentials: 'same-origin' });

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function api(method, path, body) {
  const res = await fetch('/api' + path, {
    method,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': cookie('XSRF-TOKEN'),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError((data && data.message) || res.statusText, res.status, data);
  }

  return data;
}

export function errMsg(e) {
  if (e.data && e.data.errors) return Object.values(e.data.errors).flat().join(' ');
  return e.message || 'Something went wrong.';
}
