/**
 * Formatting utilities.
 */

/**
 * Format a price number as a currency string.
 * @param {number} price
 * @param {string} [currency='USD']
 * @returns {string}
 */
export function formatPrice(price) {
  if (typeof price !== 'number' || isNaN(price)) {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Format a rating number (0–5) as a fixed decimal string.
 * @param {number} rate
 * @returns {string}
 */
export function formatRating(rate) {
  if (typeof rate !== 'number' || isNaN(rate)) {
    return '0.0';
  }
  return rate.toFixed(1);
}

/**
 * Format a count number with thousands separators.
 * @param {number} count
 * @returns {string}
 */
export function formatCount(count) {
  if (typeof count !== 'number' || isNaN(count)) {
    return '0';
  }
  return new Intl.NumberFormat('en-US').format(count);
}

/**
 * Capitalize first letter of each word in a string.
 * @param {string} str
 * @returns {string}
 */
export function toTitleCase(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Truncate a string to a given length, adding an ellipsis.
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(str, maxLength) {
  if (!str || typeof str !== 'string') {
    return '';
  }
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength).trimEnd() + '…';
}

/**
 * Generate star characters for a rating.
 * @param {number} rate  0–5
 * @returns {{ filled: number, half: boolean, empty: number }}
 */
export function getRatingParts(rate) {
  const clamped = Math.max(0, Math.min(5, rate || 0));
  const filled = Math.floor(clamped);
  const half = clamped - filled >= 0.25 && clamped - filled < 0.75;
  const adjustedFilled = clamped - filled >= 0.75 ? filled + 1 : filled;
  const empty = 5 - adjustedFilled - (half ? 1 : 0);
  return { filled: adjustedFilled, half, empty: Math.max(0, empty) };
}

/**
 * Render a star rating string (unicode).
 * @param {number} rate
 * @returns {string}
 */
export function renderStars(rate) {
  const { filled, half, empty } = getRatingParts(rate);
  return '★'.repeat(filled) + (half ? '½' : '') + '☆'.repeat(empty);
}
