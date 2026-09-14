/**
 * Filters sidebar component.
 */

import { getState, setState, subscribe } from '../state/store.js';
import { RATING_FILTER_OPTIONS } from '../utils/constants.js';
import { toTitleCase } from '../utils/formatters.js';

let sidebarEl = null;
let onFilterChange = null;

/**
 * Initialize the filters sidebar.
 * @param {{ onChange: Function }} opts
 */
export function initFilters({ onChange }) {
  sidebarEl = document.getElementById('filter-sidebar');
  onFilterChange = onChange;

  subscribe('allProducts', ({ allProducts }) => {
    renderFilters(allProducts);
  });

  renderFilters(getState().allProducts);
}

/**
 * Get all unique categories from products.
 * @param {Array} products
 * @returns {string[]}
 */
function getCategories(products) {
  const cats = new Set(products.map((p) => p.category?.toLowerCase().trim()).filter(Boolean));
  return [...cats].sort();
}

function renderFilters(products) {
  if (!sidebarEl) {
    return;
  }

  const { activeCategories, priceMin, priceMax, minRating } = getState();
  const categories = getCategories(products);
  const hasActiveFilters = activeCategories.length > 0 || priceMin || priceMax || minRating > 0;

  sidebarEl.innerHTML = `
    <div class="filters__header">
      <h2 class="filters__title">Filters</h2>
      ${hasActiveFilters
        ? `<button class="btn btn-ghost btn-sm" id="clear-filters-btn" type="button">Clear all</button>`
        : ''}
    </div>

    <!-- Category filter -->
    <div class="filters__section">
      <h3 class="filters__section-title">Category</h3>
      <div class="filters__category-list" role="group" aria-label="Filter by category">
        ${categories.map((cat) => {
          const count = products.filter((p) => p.category?.toLowerCase().trim() === cat).length;
          const checked = activeCategories.includes(cat);
          const id = `cat-${cat.replace(/\s+/g, '-')}`;
          return `
            <label class="filter-option" for="${id}">
              <input
                type="checkbox"
                id="${id}"
                name="category"
                value="${escapeAttr(cat)}"
                ${checked ? 'checked' : ''}
              />
              <span class="filter-option__label">${escapeHtml(toTitleCase(cat))}</span>
              <span class="filter-option__count">${count}</span>
            </label>
          `;
        }).join('')}
        ${categories.length === 0
          ? '<p style="font-size:var(--font-size-sm);color:var(--text-tertiary);">No categories available</p>'
          : ''}
      </div>
    </div>

    <div class="divider"></div>

    <!-- Price range filter -->
    <div class="filters__section">
      <h3 class="filters__section-title">Price Range</h3>
      <div class="filters__price-range">
        <div class="filters__price-inputs">
          <input
            type="number"
            class="filters__price-input"
            id="price-min"
            placeholder="Min"
            min="0"
            step="1"
            value="${priceMin}"
            aria-label="Minimum price"
          />
          <span class="filters__price-sep">—</span>
          <input
            type="number"
            class="filters__price-input"
            id="price-max"
            placeholder="Max"
            min="0"
            step="1"
            value="${priceMax}"
            aria-label="Maximum price"
          />
        </div>
        <button class="btn btn-ghost btn-sm" id="apply-price-btn" type="button">Apply</button>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Rating filter -->
    <div class="filters__section">
      <h3 class="filters__section-title">Minimum Rating</h3>
      <div role="group" aria-label="Filter by minimum rating">
        <label class="filter-rating-option">
          <input type="radio" name="rating" value="0" ${minRating === 0 ? 'checked' : ''} />
          <span class="filter-option__label">All ratings</span>
        </label>
        ${RATING_FILTER_OPTIONS.map(({ value, label }) => `
          <label class="filter-rating-option">
            <input type="radio" name="rating" value="${value}" ${minRating === value ? 'checked' : ''} />
            <span class="filter-option__label">${escapeHtml(label)}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `;

  bindEvents();
}

function bindEvents() {
  // Clear all filters
  document.getElementById('clear-filters-btn')?.addEventListener('click', clearAllFilters);

  // Category checkboxes
  sidebarEl.querySelectorAll('input[name="category"]').forEach((input) => {
    input.addEventListener('change', () => {
      const checked = [...sidebarEl.querySelectorAll('input[name="category"]:checked')].map(
        (el) => el.value
      );
      setState({ activeCategories: checked, currentPage: 1 });
      onFilterChange?.();
    });
  });

  // Price range apply
  document.getElementById('apply-price-btn')?.addEventListener('click', () => {
    const min = document.getElementById('price-min')?.value || '';
    const max = document.getElementById('price-max')?.value || '';
    setState({ priceMin: min, priceMax: max, currentPage: 1 });
    onFilterChange?.();
  });

  // Price inputs — apply on Enter
  ['price-min', 'price-max'].forEach((id) => {
    document.getElementById(id)?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('apply-price-btn')?.click();
      }
    });
  });

  // Rating filter
  sidebarEl.querySelectorAll('input[name="rating"]').forEach((input) => {
    input.addEventListener('change', (e) => {
      const val = parseFloat(e.target.value) || 0;
      setState({ minRating: val, currentPage: 1 });
      onFilterChange?.();
    });
  });
}

function clearAllFilters() {
  setState({
    activeCategories: [],
    priceMin: '',
    priceMax: '',
    minRating: 0,
    currentPage: 1,
    searchQuery: '',
  });

  // Also clear search input in header
  const searchInput = document.getElementById('header-search-input');
  if (searchInput) {
    searchInput.value = '';
    const clearBtn = document.getElementById('search-clear-btn');
    clearBtn?.classList.remove('is-visible');
  }

  onFilterChange?.();
  renderFilters(getState().allProducts);
}

/**
 * Toggle mobile filters sidebar.
 */
export function toggleMobileFilters() {
  sidebarEl?.classList.toggle('is-mobile-open');
}

/**
 * Close mobile filters.
 */
export function closeMobileFilters() {
  sidebarEl?.classList.remove('is-mobile-open');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}

function escapeAttr(str) {
  return String(str ?? '').replace(/"/g, '&quot;');
}
