/**
 * LocalStorage abstraction with error handling.
 */

/**
 * Read a value from LocalStorage by key.
 * Returns null if the key doesn't exist or parsing fails.
 * @param {string} key
 * @returns {unknown}
 */
export function storageGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Write a value to LocalStorage by key.
 * Silently fails if storage is full or unavailable.
 * @param {string} key
 * @param {unknown} value
 * @returns {boolean} true on success
 */
export function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove a key from LocalStorage.
 * @param {string} key
 */
export function storageRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Check whether LocalStorage is available.
 * @returns {boolean}
 */
export function isStorageAvailable() {
  try {
    const testKey = '__shopsphere_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
