/**
 * Product Management Modal component (Add / Delete).
 */

import { validateProduct } from '../utils/validation.js';

let modalContainer = null;
let onAddCallback = null;

export function initProductManagement({ onAdd }) {
  modalContainer = document.getElementById('product-management-container');
  onAddCallback = onAdd;
}

export function openProductManagement() {
  renderModal();
  
  const backdrop = modalContainer.querySelector('.modal-backdrop');
  requestAnimationFrame(() => {
    backdrop?.classList.add('is-open');
  });

  document.getElementById('overlay')?.classList.add('is-active');
  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    modalContainer.querySelector('#title-input')?.focus();
  }, 50);

  document.addEventListener('keydown', handleKeydown);
}

export function closeProductManagement() {
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
}

function handleKeydown(e) {
  if (e.key === 'Escape') {
    closeProductManagement();
  }
}

function renderModal() {
  if (!modalContainer) {return;}

  modalContainer.innerHTML = `
    <div class="modal-backdrop management-modal" role="dialog" aria-modal="true" aria-labelledby="mgmt-title" id="mgmt-backdrop">
      <div class="modal">
        <div class="modal__header">
          <h2 class="modal__title" id="mgmt-title">Add New Product (Demo)</h2>
          <button class="modal__close" id="mgmt-close" aria-label="Close management" type="button">✕</button>
        </div>
        <div class="modal__body">
          <form class="management-form" id="mgmt-form" novalidate>
            <div class="management-form__grid">
              <div class="form-group">
                <label class="form-label" for="title-input">Product Title <span class="required">*</span></label>
                <input type="text" class="form-input" id="title-input" name="title" required placeholder="e.g. Vintage Denim Jacket" />
                <div class="form-error" id="title-error"></div>
              </div>
              
              <div class="form-group">
                <label class="form-label" for="price-input">Price ($) <span class="required">*</span></label>
                <input type="number" class="form-input" id="price-input" name="price" required min="0" step="0.01" placeholder="0.00" />
                <div class="form-error" id="price-error"></div>
              </div>
            </div>

            <div class="management-form__grid">
              <div class="form-group">
                <label class="form-label" for="category-input">Category <span class="required">*</span></label>
                <input type="text" class="form-input" id="category-input" name="category" required placeholder="e.g. clothing" />
                <div class="form-error" id="category-error"></div>
              </div>
              
              <div class="form-group">
                <label class="form-label" for="image-input">Image URL</label>
                <input type="url" class="form-input" id="image-input" name="image" placeholder="https://..." />
                <div class="form-error" id="image-error"></div>
                <div class="form-hint">Leave blank for placeholder image.</div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="desc-input">Description</label>
              <textarea class="form-textarea" id="desc-input" name="description" placeholder="Product details..."></textarea>
              <div class="form-error" id="desc-error"></div>
            </div>

            <div class="management-form__actions">
              <button class="btn btn-primary" type="submit" id="mgmt-submit">Add Product</button>
              <button class="btn btn-ghost" type="button" id="mgmt-cancel">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  bindEvents();
}

function bindEvents() {
  document.getElementById('mgmt-close')?.addEventListener('click', closeProductManagement);
  document.getElementById('mgmt-cancel')?.addEventListener('click', closeProductManagement);
  
  document.getElementById('mgmt-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'mgmt-backdrop') {
      closeProductManagement();
    }
  });

  const form = document.getElementById('mgmt-form');
  const submitBtn = document.getElementById('mgmt-submit');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear old errors
    ['title', 'price', 'category', 'image', 'desc'].forEach(id => {
      const errEl = document.getElementById(`${id}-error`);
      if (errEl) {errEl.textContent = '';}
      const inputEl = document.getElementById(`${id}-input`);
      if (inputEl) {inputEl.classList.remove('is-error');}
    });

    const formData = new FormData(form);
    const data = {
      title: formData.get('title'),
      price: formData.get('price'),
      category: formData.get('category'),
      image: formData.get('image'),
      description: formData.get('description')
    };

    const { isValid, errors } = validateProduct(data);

    if (!isValid) {
      Object.entries(errors).forEach(([key, msg]) => {
        const idMap = { description: 'desc' };
        const idPrefix = idMap[key] || key;
        const errEl = document.getElementById(`${idPrefix}-error`);
        if (errEl) {errEl.textContent = msg;}
        const inputEl = document.getElementById(`${idPrefix}-input`);
        if (inputEl) {inputEl.classList.add('is-error');}
      });
      return;
    }

    // Valid - submit
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Adding...';

    try {
      if (onAddCallback) {
        await onAddCallback(data);
      }
      closeProductManagement();
    } catch {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Add Product';
      // Error is handled via toast in main.js usually, but we could show it here too if needed
    }
  });
}
