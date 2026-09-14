/**
 * Skeleton loader component for product cards.
 */

/**
 * Render N skeleton card placeholders into a container.
 * @param {HTMLElement} container
 * @param {number} [count=8]
 */
export function renderSkeletons(container, count = 8) {
  if (!container) {
    return;
  }

  container.innerHTML = '';
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    const card = document.createElement('div');
    card.className = 'skeleton-card';
    card.setAttribute('aria-hidden', 'true');
    card.innerHTML = `
      <div class="skeleton-card__image"></div>
      <div class="skeleton-card__body">
        <div class="skeleton-card__line" style="width:85%"></div>
        <div class="skeleton-card__line" style="width:60%"></div>
        <div class="skeleton-card__line" style="width:70%;"></div>
        <div class="skeleton-card__line" style="width:45%"></div>
      </div>
      <div class="skeleton-card__footer">
        <div class="skeleton-card__price"></div>
        <div class="skeleton-card__btn"></div>
      </div>
    `;
    fragment.appendChild(card);
  }

  container.appendChild(fragment);
}
