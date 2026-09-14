/**
 * Application State Store — ShopSphere
 *
 * Centralized state with subscriber notification.
 * No DOM logic lives here.
 */

import { SORT_OPTIONS, PAGE_SIZE } from '../utils/constants.js';

/** @type {AppState} */
const state = {
  // Products
  allProducts: [],         // Source of truth from API
  loading: false,
  error: null,
  initialized: false,

  // Derived catalog
  filteredProducts: [],    // After search + filters + sort
  displayedProducts: [],   // Current page slice

  // Mutations
  mutating: false,
  deletingIds: new Set(),

  // Search
  searchQuery: '',

  // Filters
  activeCategories: [],
  priceMin: '',
  priceMax: '',
  minRating: 0,

  // Sort
  sortOrder: SORT_OPTIONS.DEFAULT,

  // Pagination
  currentPage: 1,
  pageSize: PAGE_SIZE,
  totalPages: 0,

  // Selected product (for details modal)
  selectedProduct: null,

  // Theme
  theme: 'light',

  // Cart (count mirror — actual data in cart-service)
  cartCount: 0,
};

/** @type {Map<string, Set<Function>>} */
const subscribers = new Map();

/**
 * Subscribe to state changes for a given key (or '*' for all changes).
 * @param {string} key
 * @param {Function} callback
 * @returns {Function} unsubscribe
 */
export function subscribe(key, callback) {
  if (!subscribers.has(key)) {
    subscribers.set(key, new Set());
  }
  subscribers.get(key).add(callback);

  return () => {
    subscribers.get(key)?.delete(callback);
  };
}

/**
 * Notify all subscribers for a given key and wildcard listeners.
 * @param {string} key
 */
function notify(key) {
  subscribers.get(key)?.forEach((cb) => cb(state));
  subscribers.get('*')?.forEach((cb) => cb(state));
}

/**
 * Get a snapshot of state (shallow copy).
 * @returns {AppState}
 */
export function getState() {
  return { ...state };
}

/**
 * Update specific state keys and notify subscribers.
 * @param {Partial<AppState>} updates
 */
export function setState(updates) {
  const changedKeys = Object.keys(updates);
  Object.assign(state, updates);
  changedKeys.forEach(notify);
}

/**
 * Mark a product as "being deleted".
 * @param {number|string} id
 */
export function addDeletingId(id) {
  state.deletingIds = new Set([...state.deletingIds, String(id)]);
  notify('deletingIds');
}

/**
 * Unmark a product as "being deleted".
 * @param {number|string} id
 */
export function removeDeletingId(id) {
  const next = new Set(state.deletingIds);
  next.delete(String(id));
  state.deletingIds = next;
  notify('deletingIds');
}

/**
 * Check whether a product is being deleted.
 * @param {number|string} id
 * @returns {boolean}
 */
export function isDeletingProduct(id) {
  return state.deletingIds.has(String(id));
}
