/**
 * Product Details Modal component.
 */

import { formatPrice, formatRating, formatCount, renderStars, toTitleCase } from '../utils/formatters.js';
import { MIN_QUANTITY, MAX_QUANTITY } from '../utils/constants.js';

let modalContainer = null;
let currentProduct = null;
let currentQty = 1;
let onAddToCartCallback = null;

/**
 * Initialize the product details container.
 */
export function initProductDetails() {
  modalContainer = document.getElementById('product-details-container');
}

/**
 * Open the product details modal.
 * @param {import('../services/api.js').Product} product
 * @param {{ onAddToCart: Function }} opts
 */
export function openProductDetails(product, { onAddToCart }) {
  currentProduct = product;
  currentQty = 1;
  onAddToCartCallback = onAddToCart;

  renderModal();

  const backdrop = modalContainer.querySelector('.modal-backdrop');
  requestAnimationFrame(() => {
    backdrop?.classList.add('is-open');
  });

  document.getElementById('overlay')?.classList.add('is-active');
  document.body.style.overflow = 'hidden';

  // Focus the close button
  setTimeout(() => {
    modalContainer.querySelector('.modal__close')?.focus();
  }, 50);

  // Keyboard handler
  document.addEventListener('keydown', handleKeydown);
}

/**
 * Close the product details modal.
 */
export function closeProductDetails() {
  const backdrop = modalContainer?.querySelector('.modal-backdrop');
  if (backdrop) {
    backdrop.classList.remove('is-open');
    setTimeout(() => {
      if (modalContainer) {
        modalContainer.innerHTML = '';
      }
    }, 300);
  }

  document.getElementById('overlay')?.classList.remove('is-active');
  document.body.style.overflow = '';
  document.removeEventListener('keydown', handleKeydown);
  currentProduct = null;
}

function handleKeydown(e) {
  if (e.key === 'Escape') {
    closeProductDetails();
  }
}

function renderModal() {
  if (!modalContainer || !currentProduct) {
    return;
  }

  const p = currentProduct;
  const stars = renderStars(p.rating?.rate ?? 0);
  const rateText = formatRating(p.rating?.rate ?? 0);
  const countText = formatCount(p.rating?.count ?? 0);

  modalContainer.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="product-details-title" id="product-details-backdrop">
      <div class="modal">
        <div class="modal__header">
          <h2 class="modal__title" id="product-details-title">Product Details</h2>
          <button class="modal__close" id="product-details-close" aria-label="Close product details" type="button">✕</button>
        </div>
        <div class="modal__body">
          <div class="product-details">
            <!-- Image -->
            <div class="product-details__image-wrapper">
              ${p.image
                ? `<img
                    class="product-details__image"
                    src="${escapeAttr(p.image)}"
                    alt="${escapeAttr(p.title)}"
                    onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
                  />
                  <div style="display:none;align-items:center;justify-content:center;font-size:4rem;" aria-hidden="true">🛍️</div>`
                : `<div style="display:flex;align-items:center;justify-content:center;font-size:4rem;" aria-hidden="true">🛍️</div>`
              }
            </div>

            <!-- Info -->
            <div class="product-details__info">
              <div class="product-details__category">
                <span class="badge badge-primary">${escapeHtml(toTitleCase(p.category || ''))}</span>
              </div>

              <h3 class="product-details__title">${escapeHtml(p.title)}</h3>

              <div class="product-details__rating" aria-label="Rating: ${rateText} out of 5 from ${countText} reviews">
                <span class="stars" aria-hidden="true" style="font-size:1.25rem;">${stars}</span>
                <span class="product-details__rating-text">${rateText} / 5 (${countText} reviews)</span>
              </div>

              <div class="product-details__price" aria-label="Price: ${formatPrice(p.price)}">${formatPrice(p.price)}</div>

              ${p.description
                ? `<p class="product-details__description">${escapeHtml(p.description)}</p>`
                : ''}

              <!-- Quantity selector -->
              <div class="product-details__quantity">
                <label class="product-details__quantity-label" for="detail-qty">Quantity:</label>
                <div class="qty-control">
                  <button class="qty-btn" id="detail-qty-dec" aria-label="Decrease quantity" type="button">−</button>
                  <input
                    type="number"
                    class="qty-control__input"
                    id="detail-qty"
                    value="1"
                    min="${MIN_QUANTITY}"
                    max="${MAX_QUANTITY}"
                    aria-label="Product quantity"
                    readonly
                  />
                  <button class="qty-btn" id="detail-qty-inc" aria-label="Increase quantity" type="button">+</button>
                </div>
              </div>

              <!-- Actions -->
              <div style="display:flex;gap:var(--space-3);">
                <button class="btn btn-primary btn-lg" id="detail-add-cart" style="flex:1;" type="button">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  Add to Cart
                </button>
                <button class="btn btn-ghost btn-lg" id="detail-close-btn" type="button">Close</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  bindEvents();
}

function bindEvents() {
  // Close buttons
  document.getElementById('product-details-close')?.addEventListener('click', closeProductDetails);
  document.getElementById('detail-close-btn')?.addEventListener('click', closeProductDetails);

  // Click outside modal
  document.getElementById('product-details-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'product-details-backdrop') {
      closeProductDetails();
    }
  });

  // Quantity controls
  const qtyInput = document.getElementById('detail-qty');

  document.getElementById('detail-qty-dec')?.addEventListener('click', () => {
    currentQty = Math.max(MIN_QUANTITY, currentQty - 1);
    if (qtyInput) {
      qtyInput.value = currentQty;
    }
    document.getElementById('detail-qty-dec').disabled = currentQty <= MIN_QUANTITY;
  });

  document.getElementById('detail-qty-inc')?.addEventListener('click', () => {
    currentQty = Math.min(MAX_QUANTITY, currentQty + 1);
    if (qtyInput) {
      qtyInput.value = currentQty;
    }
    document.getElementById('detail-qty-inc').disabled = currentQty >= MAX_QUANTITY;
  });

  // Add to cart
  document.getElementById('detail-add-cart')?.addEventListener('click', () => {
    if (currentProduct) {
      onAddToCartCallback?.(currentProduct, currentQty);
      closeProductDetails();
    }
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}

function escapeAttr(str) {
  return String(str ?? '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
