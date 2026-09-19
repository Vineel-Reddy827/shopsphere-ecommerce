/** Toast notifications (success / error / info). */
import { escapeHtml } from '../utils/helpers.js';

let container = null;

function ensureContainer() {
  if (container) return container;
  container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message, type = 'info', timeout = 3600) {
  const host = ensureContainer();
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.setAttribute('role', 'status');
  el.innerHTML = `<span class="toast-dot" aria-hidden="true"></span><p>${escapeHtml(message)}</p>`;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add('toast--visible'));
  setTimeout(() => {
    el.classList.remove('toast--visible');
    setTimeout(() => el.remove(), 300);
  }, timeout);
}
