# ShopSphere

A complete, modern API-powered e-commerce product catalog and shopping application. Built for the Maincrafts Full Stack Web Development Internship — Project 6.

ShopSphere allows users to browse a product catalog, search, filter, sort, view details, and manage a shopping cart. It also includes a demo "Admin Mode" to manage the catalog (Create and Delete products) using a local JSON server.

## Features

- **Product Catalog**: View products with images, prices, ratings, and categories.
- **Search & Filter**: Real-time debounced search, category checkboxes, price ranges, and minimum rating filters.
- **Sorting**: Sort by price, title, and rating.
- **Pagination**: Client-side pagination for smooth browsing.
- **Shopping Cart**: Add items, adjust quantities, remove items. Cart state persists across browser reloads using LocalStorage.
- **Product Details**: Dedicated modal for full product descriptions and adding multiple quantities.
- **Demo Admin Mode**: Add new products (POST) and delete products (DELETE) via the UI.
- **Professional UI/UX**: Loading skeletons, error states, empty states, toast notifications, responsive design, and light/dark theme toggle.
- **Accessibility**: Keyboard navigation, semantic HTML, ARIA attributes, focus management, and screen reader live regions.

## Technology Stack

- **HTML5 & CSS3** (CSS Grid, Flexbox, Custom Properties/Variables)
- **JavaScript ES2022+** (Modules, async/await, Fetch API)
- **Vite** (Build tool and dev server)
- **JSON Server** (Local REST API for GET, POST, DELETE)
- **Vitest & Playwright** (Testing setup ready)
- **ESLint & Prettier** (Code quality)
- *No frontend frameworks (React/Vue) were used, per requirements.*

## Architecture & Data Flow

- **State Management** (`src/state/store.js`): A lightweight, centralized state store with a publish/subscribe pattern. Components subscribe to specific state keys (like `cartCount`, `filteredProducts`) and re-render only when necessary.
- **API Service Layer** (`src/services/api.js`): All HTTP communication is isolated here. It handles `fetch` calls, parses JSON, normalizes data to a consistent shape, and throws structured `ApiError` objects for the UI to handle.
- **Cart Service** (`src/services/cart-service.js`): Manages cart logic and interacts with `localStorage` via a safe wrapper (`storage.js`).
- **Components** (`src/components/`): Modular functions that generate DOM elements and bind event listeners.
- **Main** (`src/main.js`): The orchestrator. It initializes state, binds components together, fetches initial data, and applies derived state logic (searching, filtering, sorting, paginating).

## Project Structure

```
├── db.json                # Local JSON database (seed data)
├── routes.json            # JSON Server route mappings
├── vite.config.js         # Vite configuration
├── package.json           # Dependencies and scripts
└── src/
    ├── main.js            # Entry point
    ├── styles/            # CSS files (reset, variables, global, components, responsive)
    ├── components/        # UI modules (header, grid, cards, cart, modals, etc.)
    ├── services/          # API and LocalStorage services
    ├── state/             # Centralized store (store.js)
    └── utils/             # Formatters, validation, constants
```

## Setup & Running Locally

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the application (API + Frontend)**
   ```bash
   npm run dev
   ```
   This uses `concurrently` to run both the JSON Server (port 3001) and Vite dev server (port 5173).
   The application will automatically open in your browser at `http://localhost:5173`.

## API Endpoints (Local JSON Server)

Base URL: `http://localhost:3001`

- `GET /api/products` - Retrieve all products
- `GET /api/products/:id` - Retrieve a single product
- `POST /api/products` - Create a new product
- `DELETE /api/products/:id` - Delete a product

## Development Commands

- `npm run dev` - Start dev server and API.
- `npm run api` - Start only the JSON server.
- `npm run build` - Create a production build.
- `npm run preview` - Preview the production build locally.
- `npm run lint` - Run ESLint.
- `npm run format` - Format code with Prettier.
- `npm run test` - Run Vitest unit tests.
- `npm run test:e2e` - Run Playwright browser tests.

## Testing Behavior

- **Loading States**: Skeletons appear while products load. Disabled buttons and spinners show during POST/DELETE.
- **Error States**: If the API is down, a user-friendly error screen with a "Try Again" button appears. Forms show validation errors inline.
- **Persistence**: Add items to the cart, refresh the page, and observe the cart badge and contents remain intact.
- **Mutations**: Click "Manage" in the header to enter Admin Mode. You can add a product via the form (sends POST) and it appears in the grid immediately. Click the trash icon on a card to delete it (sends DELETE).

## Mapping to Project 6 Requirements

- ✅ Retrieve products via HTTP GET.
- ✅ Add products via HTTP POST.
- ✅ Remove products via HTTP DELETE.
- ✅ Fetch API & async/await used exclusively.
- ✅ Professional loading and error states implemented.
- ✅ Dedicated API service layer (`src/services/api.js`).
- ✅ Search, filter, sort, and pagination work harmoniously.
- ✅ Shopping cart with LocalStorage persistence.
- ✅ Fully responsive interface with CSS Grid/Flexbox.
- ✅ Independent standalone project (does not rely on Project 5).
