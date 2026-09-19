/**
 * Task-6 API service layer.
 * ALL fetch() calls in the application MUST live in this file.
 * The UI layer (app.js / components) must never call fetch() directly.
 */

const API_BASE_URL = (import.meta.env?.VITE_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');
const PRODUCTS_PATH = '/products';
const REQUEST_TIMEOUT_MS = 12000;

export const FALLBACK_IMAGE = 'images/product-placeholder.svg';

export class ApiError extends Error {
  constructor(message, { status = 0, url = '', method = 'GET' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.url = url;
    this.method = method;
  }
}

function withTimeout(signal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onAbort, { once: true });
  }
  return {
    signal: controller.signal,
    done() {
      clearTimeout(timer);
      if (signal) signal.removeEventListener('abort', onAbort);
    }
  };
}

function friendlyMessage(status, method) {
  if (status === 0) return 'Network error. Check that the API server is running, then try again.';
  if (status === 404) return method === 'GET'
    ? 'Products endpoint was not found (404). Is JSON Server running with server/db.json?'
    : 'Item not found (404). It may already have been deleted.';
  if (status >= 400 && status < 500) return `Request failed (${status}). Please check your input and try again.`;
  if (status >= 500) return `Server error (${status}). Please try again in a moment.`;
  return `Unexpected response (${status}). Please try again.`;
}

async function parseJsonSafely(response, url, method) {
  const text = await response.text();
  if (!text) {
    if (method === 'DELETE') return {};
    throw new ApiError('The server returned an empty response. Please try again.', {
      status: response.status, url, method
    });
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError('The server returned a malformed response. Please try again.', {
      status: response.status, url, method
    });
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const url = `${API_BASE_URL}${path}`;
  const gate = withTimeout(signal);
  try {
    const response = await fetch(url, {
      method,
      signal: gate.signal,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    if (!response.ok) {
      throw new ApiError(friendlyMessage(response.status, method), {
        status: response.status, url, method
      });
    }
    return await parseJsonSafely(response, url, method);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err?.name === 'AbortError') {
      throw new ApiError('Request timed out. Check your connection and try again.', {
        status: 0, url, method
      });
    }
    throw new ApiError('Network error. Check that the API server is running, then try again.', {
      status: 0, url, method
    });
  } finally {
    gate.done();
  }
}

function sanitizeProduct(value) {
  if (!value || typeof value !== 'object') return null;
  const id = Number(value.id);
  if (!Number.isFinite(id)) return null;
  return {
    id,
    title: String(value.title ?? 'Untitled product'),
    price: Number(value.price ?? 0),
    category: String(value.category ?? 'general'),
    description: String(value.description ?? ''),
    image: typeof value.image === 'string' ? value.image : '',
    rating: value.rating && typeof value.rating === 'object'
      ? { rate: Number(value.rating.rate ?? 0), count: Number(value.rating.count ?? 0) }
      : undefined
  };
}

/** GET /products — returns an array of sanitized products. */
export async function getProducts() {
  const data = await request(PRODUCTS_PATH, { method: 'GET' });
  if (!Array.isArray(data)) {
    throw new ApiError('The server returned a malformed response. Please try again.', {
      status: 200, url: `${API_BASE_URL}${PRODUCTS_PATH}`, method: 'GET'
    });
  }
  return data.map(sanitizeProduct).filter(Boolean);
}

/** POST /products — creates a product, returns the server-created record. */
export async function createProduct(payload) {
  const data = await request(PRODUCTS_PATH, { method: 'POST', body: payload });
  const product = sanitizeProduct(data);
  if (!product) {
    throw new ApiError('The server returned a malformed response. Please try again.', {
      status: 200, url: `${API_BASE_URL}${PRODUCTS_PATH}`, method: 'POST'
    });
  }
  return product;
}

/** DELETE /products/:id */
export async function deleteProduct(id) {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    throw new ApiError('Invalid product id.', { status: 400, url: `${API_BASE_URL}${PRODUCTS_PATH}/${id}`, method: 'DELETE' });
  }
  await request(`${PRODUCTS_PATH}/${encodeURIComponent(String(numericId))}`, { method: 'DELETE' });
  return numericId;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}
