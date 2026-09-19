/** Task-6 storefront orchestrator. UI layer — NEVER calls fetch() directly (see src/services/api.js). */
import './styles.css';
import { getProducts, createProduct, deleteProduct, FALLBACK_IMAGE } from './services/api.js';
import { createProductCard, skeletonCards } from './components/productCard.js';
import { renderCart } from './components/cart.js';
import { showToast } from './components/toast.js';
import { debounce, clampPage } from './utils/helpers.js';
import { loadCart, saveCart } from './utils/storage.js';
import { validateProduct } from './utils/validation.js';

const PER_PAGE = 8;

const state = {
  products: [],
  search: '',
  category: 'all',
  sort: 'default',
  page: 1,
  loading: false,
  loadError: '',
  deletingId: null,
  cart: [],
  pendingDelete: null,
  highlightId: null
};

const el = {
  search: document.getElementById('search'),
  searchClear: document.getElementById('search-clear'),
  category: document.getElementById('category'),
  sort: document.getElementById('sort'),
  resultCount: document.getElementById('result-count'),
  status: document.getElementById('status'),
  grid: document.getElementById('grid'),
  pagination: document.getElementById('pagination'),
  cartBtn: document.getElementById('cart-btn'),
  cartCount: document.getElementById('cart-count'),
  cartOverlay: document.getElementById('cart-overlay'),
  cartDrawer: document.getElementById('cart-drawer'),
  cartClose: document.getElementById('cart-close'),
  cartItems: document.getElementById('cart-items'),
  addProductBtn: document.getElementById('add-product-btn'),
  productModal: document.getElementById('product-modal'),
  productOverlay: document.getElementById('product-modal-overlay'),
  productForm: document.getElementById('product-form'),
  productClose: document.getElementById('product-modal-close'),
  productCancel: document.getElementById('product-cancel'),
  productSubmit: document.getElementById('product-submit'),
  formError: document.getElementById('form-error'),
  imageInput: document.getElementById('f-image'),
  imagePreview: document.getElementById('f-image-preview'),
  categoryList: document.getElementById('category-list'),
  confirmOverlay: document.getElementById('confirm-overlay'),
  confirmModal: document.getElementById('confirm-modal'),
  confirmDesc: document.getElementById('confirm-desc'),
  confirmCancel: document.getElementById('confirm-cancel'),
  confirmOk: document.getElementById('confirm-ok')
};

/* ---------- Global image fallback (no infinite loop) ---------- */
document.addEventListener('error', (event) => {
  const target = event.target;
  if (target instanceof HTMLImageElement && target.dataset.fallback && !target.dataset.fallbackApplied) {
    target.dataset.fallbackApplied = 'true';
    target.src = target.dataset.fallback;
  }
}, true);

/* ---------- Filtering / sorting / pagination ---------- */
function getFiltered() {
  const q = state.search.trim().toLowerCase();
  let list = [...state.products];
  if (state.category !== 'all') list = list.filter((p) => p.category === state.category);
  if (q) {
    list = list.filter((p) =>
      `${p.title} ${p.description} ${p.category}`.toLowerCase().includes(q)
    );
  }
  switch (state.sort) {
    case 'price-asc': list.sort((a, b) => a.price - b.price); break;
    case 'price-desc': list.sort((a, b) => b.price - a.price); break;
    case 'name-asc': list.sort((a, b) => a.title.localeCompare(b.title)); break;
    case 'name-desc': list.sort((a, b) => b.title.localeCompare(a.title)); break;
    default: list.sort((a, b) => a.id - b.id);
  }
  return list;
}

function totalPagesFor(list) {
  return Math.max(1, Math.ceil(list.length / PER_PAGE));
}

/* ---------- Render ---------- */
function renderCategories() {
  const cats = [...new Set(state.products.map((p) => p.category))].sort();
  const current = state.category;
  el.category.innerHTML = '<option value="all">All categories</option>';
  for (const c of cats) {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c.charAt(0).toUpperCase() + c.slice(1);
    el.category.appendChild(opt);
  }
  el.category.value = cats.includes(current) ? current : 'all';
  state.category = el.category.value;

  el.categoryList.innerHTML = '';
  for (const c of cats) {
    const opt = document.createElement('option');
    opt.value = c;
    el.categoryList.appendChild(opt);
  }
}

function renderStatus(kind, { title = '', message = '', actionLabel = '', onAction, secondaryLabel = '', onSecondary } = {}) {
  el.status.innerHTML = '';
  if (kind === 'none') return;
  const card = document.createElement('div');
  card.className = 'state-card';
  if (kind === 'loading') {
    card.innerHTML = `<div class="spinner" role="status" aria-label="Loading products"></div><h2>Loading products…</h2><p>Fetching the catalog from the API.</p>`;
  } else {
    const h = document.createElement('h2');
    h.textContent = title;
    const p = document.createElement('p');
    p.textContent = message;
    card.append(h, p);
    if (actionLabel) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-primary';
      btn.textContent = actionLabel;
      btn.addEventListener('click', onAction);
      card.appendChild(btn);
    }
    if (secondaryLabel) {
      const btn2 = document.createElement('button');
      btn2.type = 'button';
      btn2.className = 'btn btn-ghost';
      btn2.style.marginLeft = '8px';
      btn2.textContent = secondaryLabel;
      btn2.addEventListener('click', onSecondary);
      card.appendChild(btn2);
    }
  }
  el.status.appendChild(card);
}

function render() {
  const filtered = getFiltered();
  const totalPages = totalPagesFor(filtered);
  state.page = clampPage(state.page, totalPages);

  // Loading
  if (state.loading) {
    renderStatus('loading');
    el.grid.innerHTML = '';
    el.grid.appendChild(skeletonCards(PER_PAGE));
    el.pagination.innerHTML = '';
    el.resultCount.textContent = '';
    return;
  }

  // API error
  if (state.loadError) {
    renderStatus('error', {
      title: 'Could not load products',
      message: state.loadError,
      actionLabel: 'Try Again',
      onAction: () => loadProducts()
    });
    el.grid.innerHTML = '';
    el.pagination.innerHTML = '';
    el.resultCount.textContent = '';
    return;
  }

  // Empty catalog
  if (state.products.length === 0) {
    renderStatus('empty', {
      title: 'No products yet',
      message: 'The catalog is empty. Add the first product to get started.',
      actionLabel: 'Add Product',
      onAction: () => openProductModal()
    });
    el.grid.innerHTML = '';
    el.pagination.innerHTML = '';
    el.resultCount.textContent = '0 products';
    return;
  }

  // No matches
  if (filtered.length === 0) {
    renderStatus('empty', {
      title: 'No products match your search',
      message: 'Try a different keyword or clear the filters.',
      actionLabel: 'Clear search & filters',
      onAction: () => {
        state.search = '';
        el.search.value = '';
        el.searchClear.hidden = true;
        state.category = 'all';
        el.category.value = 'all';
        state.page = 1;
        render();
      }
    });
    el.grid.innerHTML = '';
    el.pagination.innerHTML = '';
    el.resultCount.textContent = `0 of ${state.products.length} products`;
    return;
  }

  renderStatus('none');
  const start = (state.page - 1) * PER_PAGE;
  const pageItems = filtered.slice(start, start + PER_PAGE);
  el.grid.innerHTML = '';
  for (const product of pageItems) {
    const card = createProductCard(product, {
      onAddToCart: addToCart,
      onDelete: askDelete,
      deletingId: state.deletingId
    });
    if (state.highlightId === product.id) {
      card.classList.add('flash');
      setTimeout(() => {
        card.classList.remove('flash');
        if (state.highlightId === product.id) state.highlightId = null;
      }, 2600);
    }
    el.grid.appendChild(card);
  }

  const end = Math.min(start + PER_PAGE, filtered.length);
  el.resultCount.textContent = `Showing ${start + 1}–${end} of ${filtered.length} products`;

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  el.pagination.innerHTML = '';
  if (totalPages <= 1) return;

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'page-btn';
  prev.textContent = '‹ Prev';
  prev.disabled = state.page === 1;
  prev.setAttribute('aria-label', 'Previous page');
  prev.addEventListener('click', () => { state.page -= 1; render(); });
  el.pagination.appendChild(prev);

  const windowSize = 5;
  let startPage = Math.max(1, Math.min(state.page - 2, totalPages - windowSize + 1));
  const endPage = Math.min(totalPages, startPage + windowSize - 1);
  startPage = Math.max(1, endPage - windowSize + 1);
  for (let p = startPage; p <= endPage; p++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `page-btn${p === state.page ? ' active' : ''}`;
    b.textContent = String(p);
    b.setAttribute('aria-label', `Page ${p}`);
    if (p === state.page) b.setAttribute('aria-current', 'page');
    b.addEventListener('click', () => { state.page = p; render(); });
    el.pagination.appendChild(b);
  }

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'page-btn';
  next.textContent = 'Next ›';
  next.disabled = state.page === totalPages;
  next.setAttribute('aria-label', 'Next page');
  next.addEventListener('click', () => { state.page += 1; render(); });
  el.pagination.appendChild(next);

  const info = document.createElement('span');
  info.className = 'page-info';
  info.textContent = `Page ${state.page} of ${totalPages}`;
  el.pagination.appendChild(info);
}

/* ---------- Data loading ---------- */
async function loadProducts() {
  state.loading = true;
  state.loadError = '';
  render();
  try {
    const products = await getProducts();
    state.products = products;
    renderCategories();
    state.page = clampPage(state.page, totalPagesFor(getFiltered()));
    state.loading = false;
    reconcileCartAfterLoad();
    render();
    updateCartBadge();
  } catch (err) {
    state.loading = false;
    state.loadError = err?.message || 'Something went wrong while loading products.';
    render();
  }
}

/* ---------- Cart ---------- */
function persistCart() {
  saveCart(state.cart);
  updateCartBadge();
}

function joinedCart() {
  const byId = new Map(state.products.map((p) => [p.id, p]));
  return state.cart.map((e) => {
    const product = byId.get(e.id);
    return product ? { ...e, product, missing: false } : { ...e, product: null, missing: true };
  });
}

function updateCartBadge() {
  const count = state.cart.reduce((n, e) => n + e.qty, 0);
  el.cartCount.textContent = String(count);
  el.cartCount.setAttribute('aria-label', `${count} items in cart`);
}

function renderCartDrawer() {
  renderCart({
    container: el.cartItems,
    entries: joinedCart(),
    onIncrease: (id) => {
      const e = state.cart.find((x) => x.id === id);
      if (e && e.qty < 99) { e.qty += 1; persistCart(); renderCartDrawer(); }
    },
    onDecrease: (id) => {
      const e = state.cart.find((x) => x.id === id);
      if (!e) return;
      e.qty -= 1;
      if (e.qty <= 0) state.cart = state.cart.filter((x) => x.id !== id);
      persistCart();
      renderCartDrawer();
    },
    onRemove: (id) => {
      state.cart = state.cart.filter((x) => x.id !== id);
      persistCart();
      renderCartDrawer();
      showToast('Removed from cart.', 'info');
    },
    onClear: () => {
      state.cart = [];
      persistCart();
      renderCartDrawer();
      showToast('Cart emptied.', 'info');
    },
    onClose: closeCart
  });
  updateCartBadge();
}

function openCart() {
  renderCartDrawer();
  el.cartDrawer.hidden = false;
  el.cartOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  el.cartClose.focus();
}

function closeCart() {
  el.cartDrawer.hidden = true;
  el.cartOverlay.hidden = true;
  document.body.style.overflow = '';
  el.cartBtn.focus();
}

function addToCart(product) {
  const existing = state.cart.find((x) => x.id === product.id);
  if (existing) {
    if (existing.qty >= 99) { showToast('Maximum quantity reached for this item.', 'error'); return; }
    existing.qty += 1;
  } else {
    state.cart.push({ id: product.id, qty: 1 });
  }
  persistCart();
  showToast(`Added “${product.title}” to cart.`, 'success');
}

function reconcileCartAfterLoad() {
  // Drop cart entries whose product no longer exists (e.g. deleted on server).
  const valid = new Set(state.products.map((p) => p.id));
  const before = state.cart.length;
  state.cart = state.cart.filter((e) => valid.has(e.id));
  if (state.cart.length !== before) {
    persistCart();
    showToast('Cart was updated: an unavailable product was removed.', 'info');
  }
}

/* ---------- Delete ---------- */
function askDelete(product) {
  state.pendingDelete = product;
  el.confirmDesc.textContent = `“${product.title}” (${product.category} · $${Number(product.price).toFixed(2)}) will be permanently removed.`;
  el.confirmModal.hidden = false;
  el.confirmOverlay.hidden = false;
  el.confirmCancel.focus();
}

function closeConfirm() {
  state.pendingDelete = null;
  el.confirmModal.hidden = true;
  el.confirmOverlay.hidden = true;
}

async function confirmDelete() {
  const product = state.pendingDelete;
  if (!product) return;
  closeConfirm();
  state.deletingId = product.id;
  render();
  try {
    await deleteProduct(product.id);
    state.products = state.products.filter((p) => p.id !== product.id);
    const inCart = state.cart.some((x) => x.id === product.id);
    if (inCart) {
      state.cart = state.cart.filter((x) => x.id !== product.id);
      persistCart();
    }
    renderCategories();
    const filtered = getFiltered();
    state.page = clampPage(state.page, totalPagesFor(filtered));
    showToast(`Deleted “${product.title}”.${inCart ? ' Also removed from cart.' : ''}`, 'success');
  } catch (err) {
    // Keep product visible; allow retry via Delete button again.
    showToast(err?.message || 'Delete failed. The product was kept — please try again.', 'error');
  } finally {
    state.deletingId = null;
    render();
  }
}

/* ---------- Add product modal ---------- */
function openProductModal() {
  el.productForm.reset();
  clearFormErrors();
  el.formError.hidden = true;
  el.imagePreview.hidden = true;
  el.productSubmit.disabled = false;
  el.productSubmit.textContent = 'Add Product';
  el.productModal.hidden = false;
  el.productOverlay.hidden = false;
  document.getElementById('f-title').focus();
}

function closeProductModal() {
  el.productModal.hidden = true;
  el.productOverlay.hidden = true;
  el.addProductBtn.focus();
}

function setFieldError(fieldId, message) {
  const p = document.querySelector(`[data-error-for="${fieldId}"]`);
  if (p) p.textContent = message || '';
}

function clearFormErrors() {
  document.querySelectorAll('.field-error').forEach((p) => { p.textContent = ''; });
}

async function submitProduct(event) {
  event.preventDefault();
  clearFormErrors();
  el.formError.hidden = true;

  const data = {
    title: document.getElementById('f-title').value,
    price: document.getElementById('f-price').value,
    category: document.getElementById('f-category').value,
    image: el.imageInput.value,
    description: document.getElementById('f-description').value
  };
  const result = validateProduct(data);
  if (!result.ok) {
    const map = { title: 'f-title', price: 'f-price', category: 'f-category', image: 'f-image', description: 'f-description' };
    for (const [key, msg] of Object.entries(result.errors)) setFieldError(map[key], msg);
    el.formError.textContent = 'Please fix the highlighted fields and try again.';
    el.formError.hidden = false;
    return;
  }

  el.productSubmit.disabled = true;
  el.productSubmit.textContent = 'Adding…';
  try {
    // Use the ACTUAL server response (with generated id).
    const created = await createProduct(result.value);
    state.products.push(created);
    renderCategories();
    // Reset filters so the new product is visible, then jump to its page.
    state.search = '';
    el.search.value = '';
    el.searchClear.hidden = true;
    state.category = 'all';
    el.category.value = 'all';
    state.sort = 'default';
    el.sort.value = 'default';
    const filtered = getFiltered();
    const idx = filtered.findIndex((p) => p.id === created.id);
    state.page = idx >= 0 ? Math.floor(idx / PER_PAGE) + 1 : totalPagesFor(filtered);
    state.highlightId = created.id;
    closeProductModal();
    render();
    showToast(`Added “${created.title}” successfully.`, 'success');
    requestAnimationFrame(() => {
      const card = el.grid.querySelector(`[data-product-id="${created.id}"]`);
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  } catch (err) {
    el.formError.textContent = err?.message || 'Could not add the product. Please try again.';
    el.formError.hidden = false;
  } finally {
    el.productSubmit.disabled = false;
    el.productSubmit.textContent = 'Add Product';
  }
}

/* ---------- Events ---------- */
function bindEvents() {
  const debouncedSearch = debounce(() => {
    state.search = el.search.value;
    el.searchClear.hidden = !el.search.value;
    state.page = 1;
    render();
  }, 250);

  el.search.addEventListener('input', debouncedSearch);
  el.searchClear.addEventListener('click', () => {
    el.search.value = '';
    el.searchClear.hidden = true;
    state.search = '';
    state.page = 1;
    render();
    el.search.focus();
  });

  el.category.addEventListener('change', () => {
    state.category = el.category.value;
    state.page = 1;
    render();
  });
  el.sort.addEventListener('change', () => {
    state.sort = el.sort.value;
    state.page = 1;
    render();
  });

  el.cartBtn.addEventListener('click', openCart);
  el.cartClose.addEventListener('click', closeCart);
  el.cartOverlay.addEventListener('click', closeCart);

  el.addProductBtn.addEventListener('click', openProductModal);
  el.productClose.addEventListener('click', closeProductModal);
  el.productCancel.addEventListener('click', closeProductModal);
  el.productOverlay.addEventListener('click', closeProductModal);
  el.productForm.addEventListener('submit', submitProduct);

  el.imageInput.addEventListener('input', debounce(() => {
    const url = el.imageInput.value.trim();
    if (!url) { el.imagePreview.hidden = true; return; }
    delete el.imagePreview.dataset.fallbackApplied;
    el.imagePreview.dataset.fallback = FALLBACK_IMAGE;
    el.imagePreview.src = url;
    el.imagePreview.hidden = false;
  }, 300));

  el.confirmCancel.addEventListener('click', closeConfirm);
  el.confirmOverlay.addEventListener('click', closeConfirm);
  el.confirmOk.addEventListener('click', confirmDelete);

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!el.confirmModal.hidden) closeConfirm();
    else if (!el.productModal.hidden) closeProductModal();
    else if (!el.cartDrawer.hidden) closeCart();
  });
}

/* ---------- Init ---------- */
function init() {
  state.cart = loadCart();
  updateCartBadge();
  bindEvents();
  loadProducts();
}

init();
