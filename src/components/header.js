/**
 * Header component — brand, search, cart button, theme toggle.
 */

import { getState, setState, subscribe } from '../state/store.js';
import { THEME_STORAGE_KEY, DEBOUNCE_DELAY } from '../utils/constants.js';
import { storageSet } from '../services/storage.js';

let headerEl = null;
let searchInput = null;
let cartBadge = null;
let themeToggleBtn = null;
let mobileSearchBtn = null;
let searchWrapper = null;
let clearBtn = null;

let searchDebounceTimer = null;
let onSearchCallback = null;
let onCartClickCallback = null;
let onAdminClickCallback = null;

/**
 * Debounce helper.
 */
function debounce(fn, delay) {
  return (...args) => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Initialize the header.
 * @param {{ onSearch: Function, onCartClick: Function, onAdminClick: Function }} callbacks
 */
export function initHeader({ onSearch, onCartClick, onAdminClick }) {
  headerEl = document.getElementById('app-header');
  if (!headerEl) {
    return;
  }

  onSearchCallback = onSearch;
  onCartClickCallback = onCartClick;
  onAdminClickCallback = onAdminClick;

  const { theme, cartCount } = getState();
  renderHeader(theme, cartCount);
  bindEvents();

  // Subscribe to state changes
  subscribe('cartCount', ({ cartCount }) => updateCartBadge(cartCount));
  subscribe('theme', ({ theme }) => updateThemeIcon(theme));
}

function renderHeader(theme, cartCount) {
  headerEl.innerHTML = `
    <header class="header" role="banner">
      <div class="header__inner">
        <!-- Brand -->
        <a href="/" class="header__brand" aria-label="ShopSphere home">
          <div class="header__logo" aria-hidden="true">S</div>
          <span class="header__brand-name">Shop<span>Sphere</span></span>
        </a>

        <!-- Desktop search -->
        <div class="header__search search-bar" id="header-search-wrapper">
          <div class="search-bar__input-wrapper">
            <svg class="search-bar__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="search"
              class="search-bar__input"
              id="header-search-input"
              placeholder="Search products…"
              aria-label="Search products"
              autocomplete="off"
              spellcheck="false"
            />
            <button class="search-bar__clear" id="search-clear-btn" aria-label="Clear search" type="button">✕</button>
          </div>
        </div>

        <!-- Actions -->
        <div class="header__actions">
          <!-- Mobile search toggle -->
          <button class="btn btn-ghost btn-icon mobile-menu-btn" id="mobile-search-btn" aria-label="Toggle search" type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>

          <!-- Admin -->
          <button class="btn btn-ghost btn-sm" id="admin-btn" type="button" aria-label="Open catalog management">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            <span class="btn-label">Manage</span>
          </button>

          <!-- Theme toggle -->
          <button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme" type="button">
            <span id="theme-icon" aria-hidden="true">${theme === 'dark' ? '☀️' : '🌙'}</span>
          </button>

          <!-- Cart -->
          <button class="cart-button" id="cart-btn" aria-label="Open cart" type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span
              class="cart-button__badge ${cartCount === 0 ? 'is-empty' : ''}"
              id="cart-badge"
              aria-label="${cartCount} items in cart"
            >${cartCount}</span>
          </button>
        </div>
      </div>
    </header>
  `;
}

function bindEvents() {
  searchInput = document.getElementById('header-search-input');
  cartBadge = document.getElementById('cart-badge');
  themeToggleBtn = document.getElementById('theme-toggle');
  mobileSearchBtn = document.getElementById('mobile-search-btn');
  searchWrapper = document.getElementById('header-search-wrapper');
  clearBtn = document.getElementById('search-clear-btn');

  // Search input (debounced)
  const debouncedSearch = debounce((query) => {
    setState({ searchQuery: query });
    onSearchCallback?.(query);
  }, DEBOUNCE_DELAY);

  searchInput?.addEventListener('input', (e) => {
    const query = e.target.value;
    toggleClearBtn(query);
    debouncedSearch(query);
  });

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      clearSearch();
    }
  });

  // Clear button
  clearBtn?.addEventListener('click', clearSearch);

  // Cart button
  document.getElementById('cart-btn')?.addEventListener('click', () => {
    onCartClickCallback?.();
  });

  // Admin button
  document.getElementById('admin-btn')?.addEventListener('click', () => {
    onAdminClickCallback?.();
  });

  // Theme toggle
  themeToggleBtn?.addEventListener('click', toggleTheme);

  // Mobile search toggle
  mobileSearchBtn?.addEventListener('click', () => {
    searchWrapper?.classList.toggle('is-expanded');
    if (searchWrapper?.classList.contains('is-expanded')) {
      searchInput?.focus();
    }
  });
}

function clearSearch() {
  if (searchInput) {
    searchInput.value = '';
    toggleClearBtn('');
    setState({ searchQuery: '' });
    onSearchCallback?.('');
    searchInput.focus();
  }
}

function toggleClearBtn(query) {
  if (!clearBtn) {
    return;
  }
  if (query) {
    clearBtn.classList.add('is-visible');
  } else {
    clearBtn.classList.remove('is-visible');
  }
}

function updateCartBadge(count) {
  cartBadge = document.getElementById('cart-badge');
  if (!cartBadge) {
    return;
  }
  cartBadge.textContent = count;
  cartBadge.setAttribute('aria-label', `${count} items in cart`);
  if (count === 0) {
    cartBadge.classList.add('is-empty');
  } else {
    cartBadge.classList.remove('is-empty');
  }
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

function toggleTheme() {
  const { theme } = getState();
  const nextTheme = theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', nextTheme);
  storageSet(THEME_STORAGE_KEY, nextTheme);
  setState({ theme: nextTheme });
}
