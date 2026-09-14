/**
 * Application-wide constants.
 */

export const API_BASE_URL = 'http://localhost:3001';
export const PRODUCTS_ENDPOINT = `${API_BASE_URL}/api/products`;

export const PAGE_SIZE = 8;

export const SORT_OPTIONS = {
  DEFAULT: 'default',
  PRICE_ASC: 'price_asc',
  PRICE_DESC: 'price_desc',
  TITLE_ASC: 'title_asc',
  TITLE_DESC: 'title_desc',
  RATING_DESC: 'rating_desc',
};

export const SORT_LABELS = {
  [SORT_OPTIONS.DEFAULT]: 'Default Order',
  [SORT_OPTIONS.PRICE_ASC]: 'Price: Low to High',
  [SORT_OPTIONS.PRICE_DESC]: 'Price: High to Low',
  [SORT_OPTIONS.TITLE_ASC]: 'Title: A–Z',
  [SORT_OPTIONS.TITLE_DESC]: 'Title: Z–A',
  [SORT_OPTIONS.RATING_DESC]: 'Rating: Highest First',
};

export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

export const TOAST_DURATION = 4000;

export const CART_STORAGE_KEY = 'shopsphere_cart';
export const THEME_STORAGE_KEY = 'shopsphere_theme';

export const DEBOUNCE_DELAY = 300;

export const MIN_PRICE = 0;
export const MAX_PRICE = 10000;

export const RATING_FILTER_OPTIONS = [
  { value: 4, label: '4★ & above' },
  { value: 3, label: '3★ & above' },
  { value: 2, label: '2★ & above' },
];

export const MAX_QUANTITY = 99;
export const MIN_QUANTITY = 1;
