/**
 * Main application entry point — orchestrates state, services, and components.
 */

import './styles/reset.css';
import './styles/variables.css';
import './styles/global.css';
import './styles/components.css';
import './styles/responsive.css';

import { getState, setState, subscribe, addDeletingId, removeDeletingId } from './state/store.js';
import { fetchProducts, createProduct, deleteProduct } from './services/api.js';
import { loadCart, getTotalItemCount, addToCart } from './services/cart-service.js';
import { storageGet } from './services/storage.js';
import { THEME_STORAGE_KEY, SORT_OPTIONS } from './utils/constants.js';

import { initHeader } from './components/header.js';
import { initProductGrid, setShowAdminControls } from './components/product-grid.js';
import { initFilters, toggleMobileFilters } from './components/filters.js';
import { initPagination } from './components/pagination.js';
import { initCartDrawer, openCartDrawer } from './components/cart-drawer.js';
import { initProductDetails, openProductDetails } from './components/product-details.js';
import { initProductManagement, openProductManagement } from './components/product-management.js';
import { toastSuccess, toastError, toastInfo } from './components/toast.js';

let adminMode = false;
let abortController = null;

async function init() {
  // 1. Initialize Theme
  const savedTheme = storageGet(THEME_STORAGE_KEY) || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  setState({ theme: savedTheme });

  // 2. Initialize Cart State
  loadCart();
  setState({ cartCount: getTotalItemCount() });

  // 3. Setup Components
  initHeader({
    onSearch: (query) => {
      setState({ searchQuery: query, currentPage: 1 });
      applyDerivedState();
    },
    onCartClick: openCartDrawer,
    onAdminClick: toggleAdminMode,
  });

  initCartDrawer({
    onCheckout: () => {
      toastInfo('Checkout is not implemented in this demo.', 'Demo Mode');
    }
  });

  initProductDetails();
  
  initProductManagement({
    onAdd: handleAddProduct
  });

  // Setup toolbar controls
  setupToolbar();

  initFilters({
    onChange: () => {
      applyDerivedState();
    }
  });

  initProductGrid({
    onAddToCart: handleAddToCart,
    onViewDetails: handleViewDetails,
    onDelete: handleDeleteProduct,
    onRetry: loadCatalog
  });

  initPagination({
    onChange: () => {
      applyDerivedState();
    }
  });

  // 4. Load Data
  await loadCatalog();
}

function setupToolbar() {
  const toolbar = document.getElementById('catalog-toolbar');
  if (!toolbar) {return;}

  toolbar.innerHTML = `
    <div class="catalog-controls" style="width:100%;">
      <div class="catalog-results-count" id="results-count">Loading results...</div>
      <div class="sort-select-wrapper">
        <select class="sort-select" id="sort-select" aria-label="Sort products">
          <option value="${SORT_OPTIONS.DEFAULT}">Default Order</option>
          <option value="${SORT_OPTIONS.PRICE_ASC}">Price: Low to High</option>
          <option value="${SORT_OPTIONS.PRICE_DESC}">Price: High to Low</option>
          <option value="${SORT_OPTIONS.TITLE_ASC}">Title: A to Z</option>
          <option value="${SORT_OPTIONS.TITLE_DESC}">Title: Z to A</option>
          <option value="${SORT_OPTIONS.RATING_DESC}">Highest Rated</option>
        </select>
      </div>
      <button class="btn btn-secondary btn-sm mobile-menu-btn" id="mobile-filter-btn" type="button" style="display:none;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
        Filters
      </button>
    </div>
  `;

  document.getElementById('sort-select')?.addEventListener('change', (e) => {
    setState({ sortOrder: e.target.value, currentPage: 1 });
    applyDerivedState();
  });

  document.getElementById('mobile-filter-btn')?.addEventListener('click', toggleMobileFilters);

  // Show mobile filter button on small screens (CSS handles the display toggle, but we ensure it exists)
  
  subscribe('filteredProducts', ({ filteredProducts }) => {
    const countEl = document.getElementById('results-count');
    if (countEl) {
      countEl.innerHTML = `Showing <strong>${filteredProducts.length}</strong> product${filteredProducts.length !== 1 ? 's' : ''}`;
    }
  });
}

function toggleAdminMode() {
  adminMode = !adminMode;
  setShowAdminControls(adminMode);
  
  const adminBtn = document.getElementById('admin-btn');
  if (adminBtn) {
    if (adminMode) {
      adminBtn.classList.remove('btn-ghost');
      adminBtn.classList.add('btn-secondary');
      adminBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span class="btn-label">Add Product</span>
      `;
      // If clicking while IN admin mode, it means "Add Product"
      adminBtn.onclick = openProductManagement;
      toastInfo('Admin mode enabled. You can now add or delete products.', 'Admin Mode');
    } else {
      adminBtn.classList.remove('btn-secondary');
      adminBtn.classList.add('btn-ghost');
      adminBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        <span class="btn-label">Manage</span>
      `;
      adminBtn.onclick = toggleAdminMode;
    }
  }
}

async function loadCatalog() {
  if (abortController) {
    abortController.abort();
  }
  abortController = new AbortController();

  setState({ loading: true, error: null });

  try {
    const products = await fetchProducts(abortController.signal);
    setState({ 
      allProducts: products, 
      loading: false, 
      initialized: true 
    });
    applyDerivedState();
  } catch (err) {
    if (err.type !== 'abort') {
      setState({ 
        error: err.message, 
        loading: false,
        allProducts: [],
        filteredProducts: [],
        displayedProducts: []
      });
      console.error('Failed to load catalog:', err);
    }
  }
}

/**
 * Filter, Sort, and Paginate the allProducts array based on current state.
 */
function applyDerivedState() {
  const state = getState();
  if (state.loading && !state.initialized) {return;}

  let result = [...state.allProducts];

  // 1. Search
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase().trim();
    result = result.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.category?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  }

  // 2. Filter - Category
  if (state.activeCategories.length > 0) {
    result = result.filter(p => state.activeCategories.includes(p.category?.toLowerCase().trim()));
  }

  // 3. Filter - Price
  const minP = parseFloat(state.priceMin);
  const maxP = parseFloat(state.priceMax);
  if (!isNaN(minP)) {
    result = result.filter(p => p.price >= minP);
  }
  if (!isNaN(maxP)) {
    result = result.filter(p => p.price <= maxP);
  }

  // 4. Filter - Rating
  if (state.minRating > 0) {
    result = result.filter(p => (p.rating?.rate || 0) >= state.minRating);
  }

  // 5. Sort
  result.sort((a, b) => {
    switch (state.sortOrder) {
      case SORT_OPTIONS.PRICE_ASC: return a.price - b.price;
      case SORT_OPTIONS.PRICE_DESC: return b.price - a.price;
      case SORT_OPTIONS.TITLE_ASC: return a.title.localeCompare(b.title);
      case SORT_OPTIONS.TITLE_DESC: return b.title.localeCompare(a.title);
      case SORT_OPTIONS.RATING_DESC: return (b.rating?.rate || 0) - (a.rating?.rate || 0);
      default: return 0; // retain original API order
    }
  });

  // 6. Pagination
  const total = result.length;
  let page = state.currentPage;
  const maxPage = Math.max(1, Math.ceil(total / state.pageSize));
  if (page > maxPage) {
    page = maxPage;
    // We don't setState({currentPage}) here to avoid loops, just use it for slicing
  }

  const start = (page - 1) * state.pageSize;
  const paginated = result.slice(start, start + state.pageSize);

  setState({
    filteredProducts: result,
    displayedProducts: paginated,
    currentPage: page
  });
}

// --- Action Handlers ---

function handleAddToCart(product, quantity = 1) {
  const { added, quantity: newQty } = addToCart(product, quantity);
  if (added) {
    setState({ cartCount: getTotalItemCount() });
    toastSuccess(`${product.title} added to cart. (Total: ${newQty})`, 'Cart Updated');
  } else {
    toastError('Could not add product to cart.');
  }
}

function handleViewDetails(product) {
  openProductDetails(product, {
    onAddToCart: handleAddToCart
  });
}

async function handleAddProduct(productData) {
  try {
    const newProduct = await createProduct(productData);
    const { allProducts } = getState();
    
    // Add to top of list
    setState({ allProducts: [newProduct, ...allProducts] });
    applyDerivedState();
    
    toastSuccess('Product added successfully!');
  } catch (err) {
    toastError(err.message || 'Failed to add product.');
    throw err; // throw so form doesn't close
  }
}

async function handleDeleteProduct(product) {
  if (!confirm(`Are you sure you want to delete "${product.title}"?`)) {
    return;
  }

  addDeletingId(product.id);
  
  try {
    await deleteProduct(product.id);
    
    const { allProducts } = getState();
    const updated = allProducts.filter(p => String(p.id) !== String(product.id));
    
    setState({ allProducts: updated });
    applyDerivedState();
    
    toastSuccess('Product deleted successfully.');
  } catch (err) {
    toastError(err.message || 'Failed to delete product.');
  } finally {
    removeDeletingId(product.id);
  }
}

// Boot
document.addEventListener('DOMContentLoaded', init);
