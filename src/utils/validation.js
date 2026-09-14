/**
 * Validation utilities for product forms and cart.
 */

/**
 * Validate a product object for the Add Product form.
 * @param {object} data
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateProduct(data) {
  const errors = {};

  // Title
  if (!data.title || typeof data.title !== 'string') {
    errors.title = 'Product title is required.';
  } else if (data.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters.';
  } else if (data.title.trim().length > 120) {
    errors.title = 'Title must be 120 characters or fewer.';
  }

  // Price
  const price = parseFloat(data.price);
  if (data.price === '' || data.price === undefined || data.price === null) {
    errors.price = 'Price is required.';
  } else if (isNaN(price)) {
    errors.price = 'Price must be a number.';
  } else if (price < 0) {
    errors.price = 'Price cannot be negative.';
  } else if (price > 99999) {
    errors.price = 'Price cannot exceed $99,999.';
  }

  // Category
  if (!data.category || typeof data.category !== 'string') {
    errors.category = 'Category is required.';
  } else if (data.category.trim().length < 2) {
    errors.category = 'Category must be at least 2 characters.';
  } else if (data.category.trim().length > 50) {
    errors.category = 'Category must be 50 characters or fewer.';
  }

  // Description (optional but validated if provided)
  if (data.description && typeof data.description === 'string') {
    if (data.description.trim().length > 1000) {
      errors.description = 'Description must be 1000 characters or fewer.';
    }
  }

  // Image URL (optional but validated if provided)
  if (data.image && typeof data.image === 'string' && data.image.trim()) {
    if (!isValidUrl(data.image.trim())) {
      errors.image = 'Please enter a valid image URL (http:// or https://).';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Check if a string is a valid URL.
 * @param {string} str
 * @returns {boolean}
 */
export function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate a cart item quantity.
 * @param {number} qty
 * @param {number} [max=99]
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateQuantity(qty, max = 99) {
  if (!Number.isInteger(qty) || qty < 1) {
    return { isValid: false, error: 'Quantity must be at least 1.' };
  }
  if (qty > max) {
    return { isValid: false, error: `Quantity cannot exceed ${max}.` };
  }
  return { isValid: true };
}

/**
 * Normalize a product object from the API to a consistent shape.
 * Handles missing / unexpected fields gracefully.
 * @param {unknown} raw
 * @returns {import('../services/api.js').Product | null}
 */
export function normalizeProduct(raw) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const id = raw.id;
  if (id === undefined || id === null) {
    return null;
  }

  return {
    id,
    title: typeof raw.title === 'string' ? raw.title.trim() : 'Untitled Product',
    price: typeof raw.price === 'number' && !isNaN(raw.price) ? raw.price : 0,
    category: typeof raw.category === 'string' ? raw.category.trim().toLowerCase() : 'uncategorized',
    description: typeof raw.description === 'string' ? raw.description.trim() : '',
    image: typeof raw.image === 'string' ? raw.image.trim() : '',
    rating: {
      rate:
        raw.rating &&
        typeof raw.rating.rate === 'number' &&
        !isNaN(raw.rating.rate)
          ? raw.rating.rate
          : 0,
      count:
        raw.rating &&
        typeof raw.rating.count === 'number' &&
        !isNaN(raw.rating.count)
          ? raw.rating.count
          : 0,
    },
  };
}

/**
 * Validate and sanitize cart data loaded from LocalStorage.
 * Returns a clean array or empty array on corruption.
 * @param {unknown} data
 * @returns {Array}
 */
export function validateCartData(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.filter((item) => {
    if (!item || typeof item !== 'object') {
      return false;
    }
    if (item.id === undefined || item.id === null) {
      return false;
    }
    if (typeof item.quantity !== 'number' || item.quantity < 1) {
      return false;
    }
    if (typeof item.price !== 'number' || isNaN(item.price)) {
      return false;
    }
    return true;
  });
}
