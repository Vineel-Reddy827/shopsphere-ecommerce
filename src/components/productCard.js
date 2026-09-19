/** Product card renderer — builds DOM safely (no raw HTML injection of product data). */
import { escapeHtml, formatPrice } from '../utils/helpers.js';
import { FALLBACK_IMAGE } from '../services/api.js';

function starText(rate) {
  if (!rate || rate <= 0) return 'New';
  return `★ ${Number(rate).toFixed(1)}`;
}

export function createProductCard(product, { onAddToCart, onDelete, deletingId }) {
  const card = document.createElement('article');
  card.className = 'card';
  card.dataset.productId = String(product.id);

  const imgWrap = document.createElement('div');
  imgWrap.className = 'card-media';

  const img = document.createElement('img');
  img.className = 'card-img';
  img.src = product.image || FALLBACK_IMAGE;
  img.alt = product.title ? `${product.title} — ${product.category}` : 'Product image';
  img.loading = 'lazy';
  img.decoding = 'async';
  img.width = 600;
  img.height = 600;
  // Global delegated error handler in app.js swaps to fallback; this dataset marks it handled.
  img.dataset.fallback = FALLBACK_IMAGE;
  imgWrap.appendChild(img);

  if (!product.rating || !product.rating.rate) {
    const badge = document.createElement('span');
    badge.className = 'badge badge-new';
    badge.textContent = 'New';
    imgWrap.appendChild(badge);
  }

  const body = document.createElement('div');
  body.className = 'card-body';

  const cat = document.createElement('p');
  cat.className = 'card-category';
  cat.textContent = product.category;

  const title = document.createElement('h3');
  title.className = 'card-title';
  title.textContent = product.title;
  title.title = product.title;

  const desc = document.createElement('p');
  desc.className = 'card-desc';
  desc.textContent = product.description || '';

  const meta = document.createElement('div');
  meta.className = 'card-meta';
  const price = document.createElement('span');
  price.className = 'card-price';
  price.textContent = formatPrice(product.price);
  const rating = document.createElement('span');
  rating.className = 'card-rating';
  const count = product.rating?.count ? ` (${product.rating.count.toLocaleString()})` : '';
  rating.textContent = `${starText(product.rating?.rate)}${count}`;
  rating.title = product.rating?.rate ? `Rated ${product.rating.rate} out of 5` : 'Not rated yet';
  meta.append(price, rating);

  const actions = document.createElement('div');
  actions.className = 'card-actions';

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'btn btn-primary btn-sm';
  addBtn.textContent = 'Add to Cart';
  addBtn.setAttribute('aria-label', `Add ${product.title} to cart`);
  addBtn.addEventListener('click', () => onAddToCart(product));

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'btn btn-danger-ghost btn-sm';
  const isDeleting = deletingId === product.id;
  delBtn.textContent = isDeleting ? 'Deleting…' : 'Delete';
  delBtn.disabled = isDeleting;
  delBtn.setAttribute('aria-label', `Delete ${product.title}`);
  delBtn.addEventListener('click', () => onDelete(product));

  actions.append(addBtn, delBtn);
  body.append(cat, title, desc, meta, actions);
  card.append(imgWrap, body);
  return card;
}

export function skeletonCards(count = 8) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = 'card skeleton';
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = `<div class="sk sk-img"></div><div class="sk-body"><div class="sk sk-line w60"></div><div class="sk sk-line"></div><div class="sk sk-line w40"></div></div>`;
    frag.appendChild(s);
  }
  return frag;
}

export { escapeHtml };
