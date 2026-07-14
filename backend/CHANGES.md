# Backend Integration Changes

## What changed

The project was split into independent `frontend/` and `backend/` applications.
The Express backend now owns authentication and persistent user activity, while
DummyJSON remains the upstream product catalog behind a backend proxy.

### Authentication

- Replaced direct DummyJSON auth with MongoDB users and bcrypt password hashes.
- Added JWT access/refresh tokens and automatic frontend refresh/retry handling.
- Added registration, login, refresh, and current-user endpoints.

### Cart and wishlist

- Added one MongoDB cart and wishlist per user.
- Added product snapshots so saved data does not depend on a later DummyJSON
  response.
- Kept Zustand as an optimistic UI mirror and guest fallback, not the signed-in
  source of truth.

### Orders

- Checkout snapshots the current cart into an order and clears the cart.
- Added paginated history and user-scoped order detail endpoints.
- Connected checkout, history, and detail pages in the frontend.

## Manual end-to-end checklist

Run the backend on port 4000 and the frontend on port 3000, then verify:

- [ ] Register and log in.
- [ ] Refresh the page and confirm the session remains active.
- [ ] Add a product to the cart, change quantity, and refresh the page.
- [ ] Save a product to the wishlist and refresh the page.
- [ ] Check out a non-empty cart.
- [ ] Confirm the cart becomes empty after checkout.
- [ ] Confirm the new order appears under `/orders`.
- [ ] Open `/orders/:id` and verify item quantities and captured prices.
- [ ] Log in as another user and confirm the first user's cart, wishlist, and
  order detail are inaccessible.

Automated API coverage for these persistence and isolation rules lives in
`src/tests/`.
