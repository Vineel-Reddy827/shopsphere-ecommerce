/** Cart drawer renderer. Pure render from joined entries; events delegated via callbacks. */
import { formatPrice } from '../utils/helpers.js';
import { FALLBACK_IMAGE } from '../services/api.js';

export function renderCart({ container, entries, onIncrease, onDecrease, onRemove, onClear, onClose }) {
  container.innerHTML = '';
  if (entries.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'cart-empty';
    empty.innerHTML = `<p class="cart-empty-icon" aria-hidden="true">🛒</p><p><strong>Your cart is empty</strong></p><p class="muted">Add some products to get started.</p>`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-primary';
    btn.textContent = 'Continue shopping';
    btn.addEventListener('click', onClose);
    empty.appendChild(btn);
    container.appendChild(empty);
    return { total: 0, count: 0 };
  }

  const list = document.createElement('ul');
  list.className = 'cart-list';
  let total = 0;
  let count = 0;

  for (const entry of entries) {
    const li = document.createElement('li');
    li.className = 'cart-item' + (entry.missing ? ' cart-item--missing' : '');

    const img = document.createElement('img');
    img.className = 'cart-thumb';
    img.src = entry.product?.image || FALLBACK_IMAGE;
    img.alt = entry.product ? `${entry.product.title} thumbnail` : 'Unavailable product';
    img.loading = 'lazy';
    img.width = 96;
    img.height = 96;
    img.dataset.fallback = FALLBACK_IMAGE;

    const info = document.createElement('div');
    info.className = 'cart-info';
    const name = document.createElement('p');
    name.className = 'cart-name';
    name.textContent = entry.product ? entry.product.title : `Product #${entry.id} (unavailable)`;
    const unit = document.createElement('p');
    unit.className = 'cart-unit muted';
    unit.textContent = entry.missing ? 'No longer available' : formatPrice(entry.product.price);

    const qtyRow = document.createElement('div');
    qtyRow.className = 'qty-row';
    const dec = document.createElement('button');
    dec.type = 'button'; dec.className = 'qty-btn'; dec.textContent = '−';
    dec.setAttribute('aria-label', 'Decrease quantity');
    dec.addEventListener('click', () => onDecrease(entry.id));
    const qty = document.createElement('span');
    qty.className = 'qty-val';
    qty.textContent = String(entry.qty);
    const inc = document.createElement('button');
    inc.type = 'button'; inc.className = 'qty-btn'; inc.textContent = '+';
    inc.setAttribute('aria-label', 'Increase quantity');
    inc.addEventListener('click', () => onIncrease(entry.id));
    qtyRow.append(dec, qty, inc);

    info.append(name, unit, qtyRow);

    const right = document.createElement('div');
    right.className = 'cart-right';
    const line = document.createElement('p');
    line.className = 'cart-line';
    const lineTotal = entry.missing ? 0 : entry.product.price * entry.qty;
    total += lineTotal;
    count += entry.qty;
    line.textContent = formatPrice(lineTotal);
    const rm = document.createElement('button');
    rm.type = 'button'; rm.className = 'link-danger';
    rm.textContent = 'Remove';
    rm.addEventListener('click', () => onRemove(entry.id));
    right.append(line, rm);

    li.append(img, info, right);
    list.appendChild(li);
  }

  container.appendChild(list);

  const footer = document.createElement('div');
  footer.className = 'cart-footer';
  const totalRow = document.createElement('div');
  totalRow.className = 'cart-total-row';
  const label = document.createElement('span');
  label.textContent = 'Total';
  const val = document.createElement('strong');
  val.textContent = formatPrice(total);
  totalRow.append(label, val);
  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'btn btn-ghost btn-sm';
  clear.textContent = 'Empty cart';
  clear.addEventListener('click', onClear);
  footer.append(totalRow, clear);
  container.appendChild(footer);

  return { total, count };
}
