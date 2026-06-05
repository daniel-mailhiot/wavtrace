// fetch wrapper for the backend API
// Sends session cookie and throws on non-2xx with the server's message so callers can show it

const BASE = import.meta.env.VITE_API_BASE_URL || '';

async function request(path, { method = 'GET', body, headers } = {}) {
  const res = await fetch(BASE + path, {
    method,
    credentials: 'include', 
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body != null ? JSON.stringify(body) : undefined,
  });

  // Tolerate an empty body (some responses have none)
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
};
