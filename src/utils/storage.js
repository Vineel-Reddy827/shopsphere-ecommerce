/** LocalStorage cart persistence. Cart shape: [{ id: number, qty: number }]. */

const CART_KEY = 'task6_cart_v1';

export function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e) => e && Number.isFinite(Number(e.id)) && Number.isFinite(Number(e.qty)))
      .map((e) => ({ id: Number(e.id), qty: Math.min(99, Math.max(1, Math.floor(Number(e.qty)))) }));
  } catch {
    return [];
  }
}

export function saveCart(entries) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(entries));
  } catch {
    // Storage full / private mode — cart still works in memory.
  }
}

export function clearCartStorage() {
  try {
    localStorage.removeItem(CART_KEY);
  } catch {
    /* noop */
  }
}
