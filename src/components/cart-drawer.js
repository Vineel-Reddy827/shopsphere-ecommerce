/**
 * Cart Drawer component.
 */

import { getCart, getTotalItemCount, getTotalPrice, updateQuantity, removeFromCart, clearCart } from '../services/cart-service.js';
import { formatPrice } from '../utils/formatters.js';
import { MIN_QUANTITY, MAX_QUANTITY } from '../utils/constants.js';

let drawerContainer = null;
let onCheckoutCallback = null;

/**
 * Initialize the cart drawer container.
 */
export function initCartDrawer({ onCheckout }) {
  drawerContainer = document.getElementById('cart-drawer-container');
  onCheckoutCallback = onCheckout;
}

/**
 * Open the cart drawer and render contents.
 */
export function openCartDrawer() {
  renderDrawer();
  
  const drawer = drawerContainer.querySelector('.cart-drawer');
  requestAnimationFrame(() => {
    drawer?.classList.add('is-open');
  });

  document.getElementById('overlay')?.classList.add('is-active');
  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    drawerContainer.querySelector('.cart-drawer__close')?.focus();
  }, 50);

  document.addEventListener('keydown', handleKeydown);
}

/**
 * Close the cart drawer.
 */
export function closeCartDrawer() {
  const drawer = drawerContainer?.querySelector('.cart-drawer');
  if (drawer) {
    drawer.classList.remove('is-open');
    setTimeout(() => {
      if (drawerContainer) {
        drawerContainer.innerHTML = '';
      }
    }, 300);
  }

  document.getElementById('overlay')?.classList.remove('is-active');
  document.body.style.overflow = '';
  document.removeEventListener('keydown', handleKeydown);
}

function handleKeydown(e) {
  if (e.key === 'Escape') {
    closeCartDrawer();
  }
}

function renderDrawer() {
  if (!drawerContainer) {
    return;
  }

  const cartItems = getCart();
  const totalCount = getTotalItemCount();
  const totalPrice = getTotalPrice();
  const isEmpty = cartItems.length === 0;

  drawerContainer.innerHTML = `
    <div class="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title" id="cart-drawer-element">
      <div class="cart-drawer__header">
        <h2 class="cart-drawer__title" id="cart-drawer-title">Your Cart <span class="cart-drawer__count">(${totalCount} items)</span></h2>
        <button class="cart-drawer__close" id="cart-drawer-close" aria-label="Close cart" type="button">✕</button>
      </div>

      <div class="cart-drawer__items" role="list">
        ${isEmpty ? `
          <div class="empty-state" style="padding:var(--space-8) var(--space-4);">
            <div class="empty-state__icon" aria-hidden="true">🛒</div>
            <h3 class="empty-state__title" style="font-size:var(--font-size-base);">Your cart is empty</h3>
            <p class="empty-state__description">Looks like you haven't added any products to your cart yet.</p>
            <button class="btn btn-primary" id="cart-continue-shopping" type="button" style="margin-top:var(--space-4);">Continue Shopping</button>
          </div>
        ` : cartItems.map(item => `
          <div class="cart-item" role="listitem">
            <div class="cart-item__image-wrapper">
              ${item.image 
                ? `<img class="cart-item__image" src="${escapeAttr(item.image)}" alt="${escapeAttr(item.title)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
                   <div class="cart-item__image-fallback" style="display:none;" aria-hidden="true">🛍️</div>` 
                : `<div class="cart-item__image-fallback" aria-hidden="true">🛍️</div>`
              }
            </div>
            <div class="cart-item__info">
              <h4 class="cart-item__name" title="${escapeAttr(item.title)}">${escapeHtml(item.title)}</h4>
              <div class="cart-item__price">${formatPrice(item.price)}</div>
              <div class="cart-item__controls">
                <button class="qty-btn" data-action="dec" data-id="${item.id}" aria-label="Decrease quantity" type="button" ${item.quantity <= MIN_QUANTITY ? 'disabled' : ''}>−</button>
                <span class="cart-item__qty" aria-label="Quantity ${item.quantity}">${item.quantity}</span>
                <button class="qty-btn" data-action="inc" data-id="${item.id}" aria-label="Increase quantity" type="button" ${item.quantity >= MAX_QUANTITY ? 'disabled' : ''}>+</button>
                <button class="cart-item__remove" data-action="remove" data-id="${item.id}" aria-label="Remove ${escapeAttr(item.title)}" type="button">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="cart-drawer__footer">
        <div class="cart-drawer__summary">
          <div class="cart-drawer__summary-row">
            <span>Subtotal</span>
            <span>${formatPrice(totalPrice)}</span>
          </div>
          <div class="cart-drawer__summary-row">
            <span>Shipping</span>
            <span>${isEmpty ? '$0.00' : 'Calculated at checkout'}</span>
          </div>
          <div class="cart-drawer__summary-row cart-drawer__summary-row--total">
            <span>Total</span>
            <span>${formatPrice(totalPrice)}</span>
          </div>
        </div>
        <button class="btn btn-primary btn-lg" id="cart-checkout-btn" type="button" ${isEmpty ? 'disabled' : ''}>
          Proceed to Checkout (Demo)
        </button>
        ${!isEmpty ? `<button class="btn btn-ghost btn-sm" id="cart-clear-btn" type="button">Empty Cart</button>` : ''}
      </div>
    </div>
  `;

  bindEvents();
}

function bindEvents() {
  document.getElementById('cart-drawer-close')?.addEventListener('click', closeCartDrawer);
  
  document.getElementById('overlay')?.addEventListener('click', () => {
    if (drawerContainer.querySelector('.cart-drawer')?.classList.contains('is-open')) {
      closeCartDrawer();
    }
  });

  document.getElementById('cart-continue-shopping')?.addEventListener('click', closeCartDrawer);

  const itemsContainer = drawerContainer.querySelector('.cart-drawer__items');
  itemsContainer?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn || btn.disabled) {return;}

    const action = btn.dataset.action;
    const id = btn.dataset.id;
    const item = getCart().find(i => String(i.id) === String(id));
    if (!item) {return;}

    if (action === 'inc') {
      updateQuantity(id, item.quantity + 1);
      renderDrawer(); // Re-render to update totals and states immediately
    } else if (action === 'dec') {
      updateQuantity(id, item.quantity - 1);
      renderDrawer();
    } else if (action === 'remove') {
      removeFromCart(id);
      renderDrawer();
    }
    
    // Also notify state store that cart changed to update header badge
    import('../state/store.js').then(({ setState }) => {
      setState({ cartCount: getTotalItemCount() });
    });
  });

  document.getElementById('cart-clear-btn')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to empty your cart?')) {
      clearCart();
      renderDrawer();
      import('../state/store.js').then(({ setState }) => {
        setState({ cartCount: 0 });
      });
    }
  });

  document.getElementById('cart-checkout-btn')?.addEventListener('click', () => {
    onCheckoutCallback?.();
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
