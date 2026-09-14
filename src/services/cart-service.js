/**
 * Cart Service — manages cart state, persistence, and calculations.
 * No DOM or API logic lives here.
 */

import { storageGet, storageSet, storageRemove } from './storage.js';
import { validateCartData } from '../utils/validation.js';
import { CART_STORAGE_KEY, MAX_QUANTITY, MIN_QUANTITY } from '../utils/constants.js';

/**
 * @typedef {Object} CartItem
 * @property {number|string} id
 * @property {string} title
 * @property {number} price
 * @property {string} image
 * @property {string} category
 * @property {number} quantity
 */

/** @type {CartItem[]} */
let cart = [];

/**
 * Load cart from LocalStorage.
 */
export function loadCart() {
  const raw = storageGet(CART_STORAGE_KEY);
  cart = validateCartData(raw);
}

/**
 * Persist cart to LocalStorage.
 */
function saveCart() {
  storageSet(CART_STORAGE_KEY, cart);
}

/**
 * Get a copy of the current cart.
 * @returns {CartItem[]}
 */
export function getCart() {
  return [...cart];
}

/**
 * Add a product to the cart.
 * If already present, increments quantity.
 * @param {import('../services/api.js').Product} product
 * @param {number} [quantity=1]
 * @returns {{ added: boolean, quantity: number }}
 */
export function addToCart(product, quantity = 1) {
  if (!product || product.id === undefined) {
    return { added: false, quantity: 0 };
  }

  const existing = cart.find((item) => String(item.id) === String(product.id));

  if (existing) {
    const newQty = Math.min(existing.quantity + quantity, MAX_QUANTITY);
    existing.quantity = newQty;
    saveCart();
    return { added: true, quantity: newQty };
  }

  const newItem = {
    id: product.id,
    title: product.title || 'Unknown Product',
    price: typeof product.price === 'number' ? product.price : 0,
    image: product.image || '',
    category: product.category || '',
    quantity: Math.min(Math.max(quantity, MIN_QUANTITY), MAX_QUANTITY),
  };

  cart.push(newItem);
  saveCart();
  return { added: true, quantity: newItem.quantity };
}

/**
 * Remove a product from the cart by ID.
 * @param {number|string} id
 * @returns {boolean}
 */
export function removeFromCart(id) {
  const before = cart.length;
  cart = cart.filter((item) => String(item.id) !== String(id));
  if (cart.length !== before) {
    saveCart();
    return true;
  }
  return false;
}

/**
 * Update the quantity of a cart item.
 * @param {number|string} id
 * @param {number} quantity
 * @returns {boolean}
 */
export function updateQuantity(id, quantity) {
  const item = cart.find((item) => String(item.id) === String(id));
  if (!item) {
    return false;
  }

  if (quantity < MIN_QUANTITY) {
    return removeFromCart(id);
  }

  item.quantity = Math.min(quantity, MAX_QUANTITY);
  saveCart();
  return true;
}

/**
 * Clear the entire cart.
 */
export function clearCart() {
  cart = [];
  storageRemove(CART_STORAGE_KEY);
}

/**
 * Get the total item count (sum of all quantities).
 * @returns {number}
 */
export function getTotalItemCount() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Get the total price of the cart.
 * @returns {number}
 */
export function getTotalPrice() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/**
 * Check if a product is in the cart.
 * @param {number|string} id
 * @returns {boolean}
 */
export function isInCart(id) {
  return cart.some((item) => String(item.id) === String(id));
}

/**
 * Get a single cart item by product ID.
 * @param {number|string} id
 * @returns {CartItem | undefined}
 */
export function getCartItem(id) {
  return cart.find((item) => String(item.id) === String(id));
}
