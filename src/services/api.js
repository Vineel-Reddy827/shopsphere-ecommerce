/**
 * API Service Layer — ShopSphere
 *
 * All HTTP communication goes through this module.
 * No DOM manipulation or UI logic lives here.
 *
 * @typedef {Object} Product
 * @property {number|string} id
 * @property {string} title
 * @property {number} price
 * @property {string} category
 * @property {string} description
 * @property {string} image
 * @property {{ rate: number, count: number }} rating
 */

import { PRODUCTS_ENDPOINT } from '../utils/constants.js';
import { normalizeProduct } from '../utils/validation.js';

/**
 * Custom API error class.
 */
export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {number} [status]
   * @param {string} [type]
   */
  constructor(message, status, type = 'api_error') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.type = type;
  }
}

/**
 * Perform a fetch request with consistent error handling.
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<unknown>}
 */
async function request(url, options = {}) {
  let response;

  try {
    response = await fetch(url, options);
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ApiError('Request was cancelled.', 0, 'abort');
    }
    throw new ApiError(
      'Unable to reach the server. Please check that the API is running.',
      0,
      'network'
    );
  }

  if (!response.ok) {
    let errorMessage = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      if (body && body.message) {
        errorMessage = body.message;
      }
    } catch {
      // use default message
    }
    throw new ApiError(errorMessage, response.status, 'http');
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    throw new ApiError('Received invalid JSON from the server.', response.status, 'parse');
  }
}

/**
 * Fetch all products from the API.
 * @param {AbortSignal} [signal]
 * @returns {Promise<Product[]>}
 */
export async function fetchProducts(signal) {
  const raw = await request(PRODUCTS_ENDPOINT, { signal });

  if (!Array.isArray(raw)) {
    throw new ApiError('Unexpected response format from the products endpoint.', 0, 'parse');
  }

  const products = raw.map(normalizeProduct).filter(Boolean);
  return products;
}

/**
 * Fetch a single product by ID.
 * @param {number|string} id
 * @param {AbortSignal} [signal]
 * @returns {Promise<Product>}
 */
export async function fetchProductById(id, signal) {
  const raw = await request(`${PRODUCTS_ENDPOINT}/${id}`, { signal });
  const product = normalizeProduct(raw);
  if (!product) {
    throw new ApiError(`Product with ID ${id} not found or returned invalid data.`, 404, 'not_found');
  }
  return product;
}

/**
 * Create a new product via POST.
 * @param {Omit<Product, 'id'>} productData
 * @returns {Promise<Product>}
 */
export async function createProduct(productData) {
  const raw = await request(PRODUCTS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: productData.title.trim(),
      price: parseFloat(productData.price),
      category: productData.category.trim().toLowerCase(),
      description: productData.description ? productData.description.trim() : '',
      image: productData.image ? productData.image.trim() : '',
      rating: { rate: 0, count: 0 },
    }),
  });

  const product = normalizeProduct(raw);
  if (!product) {
    throw new ApiError('Server returned an invalid product after creation.', 0, 'parse');
  }
  return product;
}

/**
 * Delete a product by ID via DELETE.
 * @param {number|string} id
 * @returns {Promise<void>}
 */
export async function deleteProduct(id) {
  await request(`${PRODUCTS_ENDPOINT}/${id}`, { method: 'DELETE' });
}

/**
 * Update a product by ID via PATCH.
 * @param {number|string} id
 * @param {Partial<Product>} updates
 * @returns {Promise<Product>}
 */
export async function updateProduct(id, updates) {
  const raw = await request(`${PRODUCTS_ENDPOINT}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  const product = normalizeProduct(raw);
  if (!product) {
    throw new ApiError('Server returned an invalid product after update.', 0, 'parse');
  }
  return product;
}
