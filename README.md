# Task-6 — Ecommerce Product Catalog (Standalone)

A complete, standalone full-stack ecommerce **Product Catalog** built with **HTML5 + CSS3 + Vanilla JavaScript (ES Modules) + Vite** on the frontend and **JSON Server** as the local REST API backend.

> Fully independent project — no shared code, styling, storage, or architecture with any other task.

---

## Features

- **REST API integration** — `GET /products`, `POST /products`, `DELETE /products/:id` against JSON Server
- **Dedicated API service layer** — every `fetch()` call lives in `src/services/api.js`; the UI never calls `fetch()` directly (`async/await`, timeouts, friendly errors)
- **Loading state** — spinner + skeleton cards on startup
- **Error state + Retry** — friendly message with a working **Try Again** button (network errors, 4xx, 5xx, malformed responses, empty arrays)
- **Search** — partial matches across title, description, category (debounced) with no-result state
- **Category filtering** — categories derived dynamically from API data
- **Sorting** — Default, Price low→high, Price high→low, Name A→Z, Name Z→A
- **Pagination** — Prev/Next + page numbers, correct disabled states, resets to page 1 on search/filter/sort, clamps correctly after deletion
- **Add Product form** — validation (required fields, positive price, valid image URL), submitting state, uses the real server response, navigates to + highlights the new card
- **Delete Product** — per-card Delete with confirmation modal, no page reload, failure keeps the product with an error toast
- **Shopping cart** — add / remove / increase / decrease / totals / empty, persisted in **LocalStorage** across refreshes; deleting a catalog product also cleans it from the cart gracefully
- **Image handling (zero-tolerance)** — every product renders a real `<img>` with lazy loading, fixed dimensions, `object-fit: cover`, meaningful `alt` text, and a global error handler that swaps in `images/product-placeholder.svg` exactly once (no infinite loop)
- **Responsive UI** — 4 → 3 → 2 → 1 column grid (desktop / laptop / tablet / mobile), accessible (labels, ARIA live regions, focus management, Esc to close, skip link)

---

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript ES6+, ES Modules, Vite 6 |
| Backend  | JSON Server 0.17 (local REST API)       |
| Testing  | Manual + automated jsdom harness + headless-Chrome live test |

No React / Angular / Next.js — intentionally dependency-light.

---

## Project Structure

```text
Task-6/
├── index.html                    # App shell (header, toolbar, grid, pagination, cart drawer, modals, toasts)
├── package.json                  # Scripts + devDependencies (vite, json-server, concurrently)
├── vite.config.js                # Vite dev server (port 5173)
├── .env.example                  # Sample API URL override (VITE_API_URL)
├── .gitignore
├── README.md
├── public/
│   └── images/
│       └── product-placeholder.svg   # Local fallback when any image fails
├── server/
│   └── db.json                   # JSON Server database (24 realistic products)
└── src/
    ├── app.js                    # Storefront orchestrator (state, rendering, cart, forms) — no fetch() here
    ├── styles.css                # Full responsive design system
    ├── services/
    │   └── api.js                # ONLY place fetch() may appear; base URL centralized here
    ├── components/
    │   ├── productCard.js        # Product card + skeleton renderer (XSS-safe DOM building)
    │   ├── cart.js               # Cart drawer renderer
    │   └── toast.js              # Success/error notifications
    └── utils/
        ├── helpers.js            # escapeHtml, formatPrice, debounce, image-URL check
        ├── storage.js            # LocalStorage cart persistence
        └── validation.js         # Add Product form validation
```

---

## Installation

Requirements: **Node.js 18+** and **npm**.

```bash
cd Task-6
npm install
```

---

## Running the Project

The app needs **two processes**: the JSON Server API (port `3001`) and the Vite frontend (port `5173`).

**Terminal 1 — Backend (JSON Server):**

```bash
npm run dev:api
# serves http://localhost:3001/products (watch mode on server/db.json)
```

**Terminal 2 — Frontend (Vite):**

```bash
npm run dev
# serves http://localhost:5173
```

**Or both at once:**

```bash
npm run dev:all
```

**Production build / preview:**

```bash
npm run build
npm run preview
# serves the dist/ build at http://localhost:5173
```

> The API base URL is centralized in `src/services/api.js` and defaults to `http://localhost:3001`. Override it with a `.env` file (see `.env.example`): `VITE_API_URL=http://localhost:3001`.

---

## API Endpoints

Base URL: `http://localhost:3001`

| Method | Endpoint          | Description                              |
|--------|-------------------|------------------------------------------|
| GET    | `/products`       | List all products (200 + JSON array)     |
| GET    | `/products/:id`   | Single product (200, or 404 if missing)  |
| POST   | `/products`       | Create product — body `{title, price, category, description, image, rating}` → 201 with generated `id` |
| DELETE | `/products/:id`   | Delete product (200, or 404 if missing)  |

Quick smoke test (backend must be running):

```bash
curl http://localhost:3001/products            # GET list
curl -X POST http://localhost:3001/products ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Demo\",\"price\":9.99,\"category\":\"test\",\"description\":\"Demo product.\",\"image\":\"https://picsum.photos/seed/demo/600/600\"}"
curl -X DELETE http://localhost:3001/products/25
```

---

## Testing Instructions

### 1. Startup states
1. Start both servers, open `http://localhost:5173` — observe skeleton cards → 8 products, "Showing 1–8 of 24 products", "Page 1 of 3".
2. Stop the backend, reload → friendly error card → restart backend → **Try Again** → products render.

### 2. Images (mandatory QA)
1. Confirm all 8 visible cards show real photos (no broken icons).
2. Open DevTools → Network → filter `Img` → reload → every image request is 200, zero 404s.
3. Add a product with a valid image URL → its card renders the photo.
4. Temporarily break an image (DevTools → edit an `<img src>` to an invalid URL) → it swaps to the local placeholder, no loop.
5. Check Console → zero errors caused by the app.

### 3. Search / filter / sort / pagination
- Search `wire` → 2 results; search gibberish → empty state with a clear button.
- Category `sports` → 4 results; categories come from the API data.
- Sort price low→high starts at $12.50; name A→Z starts with "Aroma".
- Next/Prev + page numbers work; Prev disabled on page 1; filters reset to page 1.

### 4. Cart
- Add to Cart → badge increments → open Cart → +/−/Remove/Empty cart, totals correct.
- Refresh → cart persists (LocalStorage key `task6_cart_v1`).
- Add a product to cart, then Delete that product → cart entry removed gracefully with a notice.

### 5. POST validation
- Open Add Product → submit empty → inline field errors.
- Price `-5` or bad image URL → rejected. Valid data → 201 → new card appears (highlighted) with its own image → form resets → success toast.

### 6. DELETE
- Delete → confirmation modal → confirm → card disappears without reload → pagination adjusts.
- (To simulate failure: stop the backend mid-delete → product stays + error toast.)

---

## Notes

- Product photos use seeded `picsum.photos` URLs (stable, always HTTP 200) across 6 categories: electronics, fashion, home, beauty, sports, kitchen.
- No GitHub Actions / workflows / CI files are included (handled manually).
- No secrets or credentials anywhere in the repo.
