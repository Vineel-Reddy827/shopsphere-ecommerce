/** Shared pure helpers (no fetch, no DOM state). */

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

export function formatPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '$0.00';
  return priceFormatter.format(n);
}

export function debounce(fn, wait = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export function isValidImageUrl(value) {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (!v) return false;
  try {
    const u = new URL(v, window.location.href);
    if (u.protocol === 'data:image/') return true;
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    return /\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i.test(u.pathname) || u.hostname.includes('picsum.photos') || u.hostname.includes('placehold');
  } catch {
    return false;
  }
}

export function clampPage(page, totalPages) {
  if (totalPages <= 0) return 1;
  return Math.min(Math.max(1, page), totalPages);
}
