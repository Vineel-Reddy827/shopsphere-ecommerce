/**
 * Product Card component.
 */

import { formatPrice, formatRating, formatCount, renderStars, toTitleCase } from '../utils/formatters.js';
import { isDeletingProduct } from '../state/store.js';
import { isInCart } from '../services/cart-service.js';

/**
 * Create a product card element.
 * @param {import('../services/api.js').Product} product
 * @param {{ onAddToCart: Function, onViewDetails: Function, onDelete: Function, showDeleteBtn: boolean }} opts
 * @returns {HTMLElement}
 */
export function createProductCard(product, { onAddToCart, onViewDetails, onDelete, showDeleteBtn = false }) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.setAttribute('data-product-id', product.id);

  const isDeleting = isDeletingProduct(product.id);
  if (isDeleting) {
    card.classList.add('product-card--deleting');
  }

  const inCart = isInCart(product.id);
  const stars = renderStars(product.rating?.rate ?? 0);
  const rateText = formatRating(product.rating?.rate ?? 0);
  const countText = formatCount(product.rating?.count ?? 0);
  const priceText = formatPrice(product.price);
  const categoryText = toTitleCase(product.category || '');

  card.innerHTML = `
    <div class="product-card__image-wrapper">
      ${product.image
        ? `<img
            class="product-card__image"
            src="${escapeAttr(product.image)}"
            alt="${escapeAttr(product.title)}"
            loading="lazy"
            onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
          />
          <div class="product-card__image-fallback" style="display:none;" aria-hidden="true">🛍️</div>`
        : `<div class="product-card__image-fallback" aria-hidden="true">🛍️</div>`
      }
      <span class="product-card__category-badge" title="${escapeAttr(categoryText)}">${escapeHtml(categoryText)}</span>
    </div>
    <div class="product-card__body">
      <h3 class="product-card__title" title="${escapeAttr(product.title)}">${escapeHtml(product.title)}</h3>
      <div class="product-card__rating" aria-label="Rating: ${rateText} out of 5, ${countText} reviews">
        <span class="stars" aria-hidden="true">${stars}</span>
        <span class="product-card__rating-count">(${countText})</span>
      </div>
      ${product.description
        ? `<p class="product-card__description">${escapeHtml(product.description)}</p>`
        : ''}
    </div>
    <div class="product-card__footer">
      <span class="product-card__price" aria-label="Price: ${priceText}">${priceText}</span>
      <div class="product-card__actions">
        ${showDeleteBtn
          ? `<button
              class="btn btn-ghost btn-sm btn-icon product-card__delete-btn"
              data-action="delete"
              aria-label="Delete ${escapeAttr(product.title)}"
              type="button"
              ${isDeleting ? 'disabled' : ''}
            >${isDeleting ? '<span class="spinner" aria-hidden="true"></span>' : '🗑️'}</button>`
          : ''
        }
        <button
          class="btn btn-ghost btn-sm"
          data-action="details"
          aria-label="View details for ${escapeAttr(product.title)}"
          type="button"
        >Details</button>
        <button
          class="btn btn-primary btn-sm"
          data-action="cart"
          aria-label="${inCart ? 'Already in cart: ' : 'Add to cart: '}${escapeAttr(product.title)}"
          type="button"
          ${isDeleting ? 'disabled' : ''}
        >${inCart ? '✓ Added' : '+ Cart'}</button>
      </div>
    </div>
  `;

  // Bind events via delegation
  card.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) {
      return;
    }
    const action = btn.dataset.action;
    if (action === 'cart') {
      onAddToCart?.(product);
    } else if (action === 'details') {
      onViewDetails?.(product);
    } else if (action === 'delete') {
      onDelete?.(product);
    }
  });

  return card;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}

function escapeAttr(str) {
  return String(str ?? '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
