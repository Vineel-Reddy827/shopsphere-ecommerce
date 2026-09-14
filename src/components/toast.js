/**
 * Toast notification component.
 */

import { TOAST_DURATION, TOAST_TYPES } from '../utils/constants.js';

const ICONS = {
  [TOAST_TYPES.SUCCESS]: '✅',
  [TOAST_TYPES.ERROR]: '❌',
  [TOAST_TYPES.WARNING]: '⚠️',
  [TOAST_TYPES.INFO]: 'ℹ️',
};

const TITLES = {
  [TOAST_TYPES.SUCCESS]: 'Success',
  [TOAST_TYPES.ERROR]: 'Error',
  [TOAST_TYPES.WARNING]: 'Warning',
  [TOAST_TYPES.INFO]: 'Info',
};

let container = null;

function getContainer() {
  if (!container) {
    container = document.getElementById('toast-container');
  }
  return container;
}

/**
 * Show a toast notification.
 * @param {object} options
 * @param {string} options.message
 * @param {string} [options.type='info']
 * @param {string} [options.title]
 * @param {number} [options.duration]
 */
export function showToast({ message, type = TOAST_TYPES.INFO, title, duration = TOAST_DURATION }) {
  const c = getContainer();
  if (!c) {
    return;
  }

  const toastEl = document.createElement('div');
  toastEl.className = `toast toast--${type}`;
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');

  const displayTitle = title || TITLES[type] || 'Notification';

  toastEl.innerHTML = `
    <span class="toast__icon" aria-hidden="true">${ICONS[type] || 'ℹ️'}</span>
    <div class="toast__content">
      <div class="toast__title">${escapeHtml(displayTitle)}</div>
      <div class="toast__message">${escapeHtml(message)}</div>
    </div>
    <button class="toast__close" aria-label="Close notification">✕</button>
  `;

  c.appendChild(toastEl);

  // Trigger animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toastEl.classList.add('is-visible');
    });
  });

  const dismiss = () => {
    toastEl.classList.remove('is-visible');
    toastEl.classList.add('is-hiding');
    setTimeout(() => {
      if (toastEl.parentNode === c) {
        c.removeChild(toastEl);
      }
    }, 300);
  };

  toastEl.querySelector('.toast__close').addEventListener('click', dismiss);

  if (duration > 0) {
    setTimeout(dismiss, duration);
  }

  return dismiss;
}

/**
 * Escape HTML to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

export function toastSuccess(message, title) {
  return showToast({ message, type: TOAST_TYPES.SUCCESS, title });
}

export function toastError(message, title) {
  return showToast({ message, type: TOAST_TYPES.ERROR, title });
}

export function toastWarning(message, title) {
  return showToast({ message, type: TOAST_TYPES.WARNING, title });
}

export function toastInfo(message, title) {
  return showToast({ message, type: TOAST_TYPES.INFO, title });
}
