/**
 * Pagination component.
 */

import { getState, setState, subscribe } from '../state/store.js';

let paginationContainer = null;
let onPageChange = null;

/**
 * Initialize pagination.
 * @param {{ onChange: Function }} opts
 */
export function initPagination({ onChange }) {
  paginationContainer = document.getElementById('pagination-container');
  onPageChange = onChange;

  subscribe('filteredProducts', render);
  subscribe('currentPage', render);
  subscribe('pageSize', render);

  render(getState());
}

function render(state) {
  if (!paginationContainer) {
    return;
  }

  const { filteredProducts, currentPage, pageSize } = state;
  const total = filteredProducts?.length ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }

  const pages = buildPageList(currentPage, totalPages);

  paginationContainer.innerHTML = `
    <nav class="pagination" aria-label="Product pages" role="navigation">
      <button
        class="pagination__btn"
        data-page="prev"
        aria-label="Previous page"
        ${currentPage === 1 ? 'disabled' : ''}
        type="button"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      ${pages.map((page) => {
        if (page === '…') {
          return `<span class="pagination__ellipsis" aria-hidden="true">…</span>`;
        }
        return `
          <button
            class="pagination__btn ${page === currentPage ? 'is-active' : ''}"
            data-page="${page}"
            aria-label="Page ${page}"
            aria-current="${page === currentPage ? 'page' : 'false'}"
            type="button"
          >${page}</button>
        `;
      }).join('')}

      <button
        class="pagination__btn"
        data-page="next"
        aria-label="Next page"
        ${currentPage === totalPages ? 'disabled' : ''}
        type="button"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </nav>
  `;

  // Event delegation
  paginationContainer.querySelector('.pagination')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-page]');
    if (!btn || btn.disabled) {
      return;
    }

    const pageVal = btn.dataset.page;
    const { currentPage: cp } = getState();
    const total = getState().filteredProducts?.length ?? 0;
    const tp = Math.ceil(total / getState().pageSize);

    let newPage = cp;
    if (pageVal === 'prev') {
      newPage = Math.max(1, cp - 1);
    } else if (pageVal === 'next') {
      newPage = Math.min(tp, cp + 1);
    } else {
      newPage = parseInt(pageVal, 10);
    }

    if (newPage !== cp) {
      setState({ currentPage: newPage });
      onPageChange?.(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

/**
 * Build a list of page numbers with ellipsis for large page counts.
 * @param {number} current
 * @param {number} total
 * @returns {(number|string)[]}
 */
function buildPageList(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = [];
  const delta = 2;

  pages.push(1);

  const rangeStart = Math.max(2, current - delta);
  const rangeEnd = Math.min(total - 1, current + delta);

  if (rangeStart > 2) {
    pages.push('…');
  }

  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i);
  }

  if (rangeEnd < total - 1) {
    pages.push('…');
  }

  pages.push(total);
  return pages;
}
