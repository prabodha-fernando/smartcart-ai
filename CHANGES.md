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

- [x] Register and log in through the automated Chromium browser journey.
- [x] Add a persisted cart item through the browser.
- [x] Add a persisted wishlist item through the browser.
- [x] Checkout and confirm redirect to the order detail.
- [x] Confirm the order appears in history and favorites remain available.
- [x] Confirm refresh-token rotation and replay rejection through integration tests.

The automated backend and frontend checks complement this checklist, but the
browser flows must be verified against the configured MongoDB deployment.
