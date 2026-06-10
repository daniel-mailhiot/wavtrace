// fetch wrapper for the backend API
// Sends session cookie and throws on non-2xx with the server's message so callers can show it

const BASE = import.meta.env.VITE_API_BASE_URL || '';

async function request(path, { method = 'GET', body, headers } = {}) {
  // Uploads send FormData so skip JSON header and let browser set the right one
  const isForm = body instanceof FormData;
  const res = await fetch(BASE + path, {
    method,
    credentials: 'include',
    headers: isForm ? headers : { 'Content-Type': 'application/json', ...headers },
    body: isForm ? body : body != null ? JSON.stringify(body) : undefined,
  });

  // Tolerate an empty body (some responses have none)
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.message || `Request failed (${res.status})`);
    err.status = res.status; // so screens can tell a 403/404 apart from other failures
    throw err;
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
};
