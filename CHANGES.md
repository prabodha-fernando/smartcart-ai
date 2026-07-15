# Backend Integration Changes

SmartCart now uses the Express API in `backend/` for authentication, the
product proxy, authenticated carts, wishlists, and orders. MongoDB is the
source of truth for signed-in user data; Zustand is an optimistic UI mirror
and remains a local fallback for guests.

## Frontend changes

- Auth uses `/api/auth/*` and automatically refreshes an expired access token.
- Product requests go through `/api/products` instead of calling DummyJSON in
  the browser.
- Cart and wishlist mutations are persisted per authenticated user.
- Checkout calls `POST /api/orders`, clears the local mirror only after
  success, and redirects to the persisted order detail.
- Order history uses the backend's paginated, owner-scoped endpoints.
- All active AI intent, catalog resolution, filtering, prompting, and NVIDIA
  requests run in Express; the NVIDIA key remains backend-only.
- AI limits are persisted in MongoDB and scoped by authenticated user with an
  IP fallback for guests.
- Refresh tokens rotate on use; replaying an old refresh token is rejected.
- Checkout uses a MongoDB transaction on replica-set deployments.
- Docker Compose can start both the API and MongoDB.

## End-to-end verification checklist

- [x] Register, log in, refresh the page, and restore the session.
- [x] Add a cart item, update quantity, refresh, and confirm persistence.
- [x] Add a wishlist item, refresh, remove it, and confirm persistence.
- [x] Checkout and confirm redirect to the order detail.
- [x] Confirm the order appears in history and wishlist removal persists.
- [x] Confirm refresh-token rotation and replay rejection through integration tests.
- [x] Log out, log in again, and confirm orders persist while the checked-out
  cart and removed wishlist item remain empty.
- [x] Reject missing JWTs on every protected module.
- [x] Confirm separate users cannot read or mutate each other's cart,
  wishlist, or order data through isolated integration tests.
- [x] Reject empty-cart checkout and duplicate wishlist items with meaningful
  API responses.

## Backend implementation summary

- Added Express/TypeScript modules for authentication, carts, wishlists,
  orders, products, AI, health checks, validation, and centralized errors.
- Added MongoDB models and ownership queries for users, carts, wishlists, and
  orders; checkout snapshots catalog data before clearing the cart.
- Added rotating refresh tokens backed by a per-user token version so a used
  refresh token cannot be replayed.
- Added paginated order history, transactional checkout where the MongoDB
  deployment supports transactions, and Docker development files.
- Added isolated Vitest/Supertest integration coverage using MongoDB Memory
  Server, including cross-user data isolation.

## Environment and deployment changes

- Standardized the frontend on `NEXT_PUBLIC_API_URL` with
  `NEXT_PUBLIC_BASE_URL` retained only as a compatibility fallback.
- Added `BACKEND_API_URL` for server-side frontend proxy requests.
- Removed frontend NVIDIA credentials and moved AI calls and rate limiting to
  the backend; `NVIDIA_NIM_API_KEY` is server-only.
- Added tracked, secret-free `.env.example` files for both applications.
- Documented the deployed backend `/api` base path and `/api/health` endpoint.

## Final validation commands

```bash
cd backend
npm run typecheck
npm test
npm run build

cd ../frontend
npm run lint
npm test
npm run build
npm run test:e2e
```

Day 7 validation result:

- Backend typecheck/build passed; 53 integration tests passed.
- Frontend lint/build passed; component test and Chromium E2E flow passed.
- Playwright now starts both local applications automatically.
- Production health reports MongoDB `connected`; catalog and authenticated
  demo reads respond successfully; protected routes return `401` without JWTs.
- Backend dependency audit reports no known vulnerabilities. The frontend audit
  currently reports the upstream PostCSS advisory bundled by Next.js; npm's
  suggested fix is an unsafe downgrade, so no forced audit rewrite was applied.

The automated backend and frontend checks complement this checklist, but the
browser flows must be verified against the configured MongoDB deployment.
