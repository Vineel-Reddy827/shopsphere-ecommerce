/**
 * Product Grid component — renders product cards, loading, error, and empty states.
 */

import { getState, subscribe } from '../state/store.js';
import { renderSkeletons } from './skeleton.js';
import { createProductCard } from './product-card.js';

let gridContainer = null;
let callbacks = {};
let showAdminControls = false;
const unsubscribes = [];

/**
 * Initialize the product grid.
 * @param {{ onAddToCart: Function, onViewDetails: Function, onDelete: Function, onRetry: Function }} cbs
 */
export function initProductGrid(cbs) {
  gridContainer = document.getElementById('product-grid-container');
  callbacks = cbs;

  // Subscribe to state keys that require re-render
  unsubscribes.push(subscribe('loading', render));
  unsubscribes.push(subscribe('error', render));
  unsubscribes.push(subscribe('displayedProducts', render));
  unsubscribes.push(subscribe('deletingIds', render));

  render(getState());
}

/**
 * Toggle admin controls (delete buttons on cards).
 * @param {boolean} show
 */
export function setShowAdminControls(show) {
  showAdminControls = show;
  render(getState());
}

function render(state) {
  if (!gridContainer) {
    return;
  }

  const { loading, error, displayedProducts, initialized } = state;

  if (loading && !initialized) {
    renderLoading();
    return;
  }

  if (error && !initialized) {
    renderError(error);
    return;
  }

  if (!displayedProducts || displayedProducts.length === 0) {
    renderEmpty();
    return;
  }

  renderProducts(displayedProducts);
}

function renderLoading() {
  const grid = getOrCreateGrid();
  renderSkeletons(grid);

  // Announce to screen readers
  announce('Loading products…');
}

function renderError(error) {
  gridContainer.innerHTML = `
    <div class="error-state" role="alert">
      <div class="error-state__icon" aria-hidden="true">⚠️</div>
      <h2 class="error-state__title">Failed to Load Products</h2>
      <p class="error-state__message">${escapeHtml(error)}</p>
      <button class="btn btn-primary" id="retry-btn" type="button">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
        Try Again
      </button>
    </div>
  `;

  document.getElementById('retry-btn')?.addEventListener('click', () => {
    callbacks.onRetry?.();
  });

  announce('Error loading products. A retry button is available.');
}

function renderEmpty() {
  const { searchQuery, activeCategories, priceMin, priceMax, minRating } = getState();
  const hasActiveFilters = searchQuery || activeCategories.length > 0 || priceMin || priceMax || minRating > 0;

  gridContainer.innerHTML = `
    <div class="empty-state">
      <div class="empty-state__icon" aria-hidden="true">${hasActiveFilters ? '🔍' : '🛍️'}</div>
      <h2 class="empty-state__title">${hasActiveFilters ? 'No results found' : 'No products available'}</h2>
      <p class="empty-state__description">
        ${hasActiveFilters
          ? 'Try adjusting your search, filters, or clearing them to see more products.'
          : 'Products will appear here once the catalog is loaded.'}
      </p>
      ${hasActiveFilters
        ? `<button class="btn btn-secondary" id="clear-filters-empty-btn" type="button">Clear filters</button>`
        : ''}
    </div>
  `;

  document.getElementById('clear-filters-empty-btn')?.addEventListener('click', () => {
    callbacks.onClearFilters?.();
  });
}

function renderProducts(products) {
  const grid = getOrCreateGrid();
  grid.innerHTML = '';

  const fragment = document.createDocumentFragment();
  products.forEach((product) => {
    const card = createProductCard(product, {
      onAddToCart: callbacks.onAddToCart,
      onViewDetails: callbacks.onViewDetails,
      onDelete: callbacks.onDelete,
      showDeleteBtn: showAdminControls,
    });
    fragment.appendChild(card);
  });

  grid.appendChild(fragment);
}

function getOrCreateGrid() {
  let grid = gridContainer.querySelector('.product-grid');
  if (!grid) {
    gridContainer.innerHTML = '';
    grid = document.createElement('div');
    grid.className = 'product-grid';
    grid.setAttribute('role', 'list');
    gridContainer.appendChild(grid);
  }
  return grid;
}

function announce(message) {
  const region = document.getElementById('aria-live-region');
  if (region) {
    region.textContent = '';
    requestAnimationFrame(() => {
      region.textContent = message;
    });
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}
