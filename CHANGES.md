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
- AI requests are sent to the Express backend; the NVIDIA key remains server-side.
- Refresh tokens rotate on use; replaying an old refresh token is rejected.
- Checkout uses a MongoDB transaction on replica-set deployments.
- Docker Compose can start both the API and MongoDB.

## End-to-end verification checklist

- [ ] Register and log in through the browser.
- [ ] Refresh the browser and confirm the session is restored.
- [ ] Add/update/remove cart items and confirm persistence after refresh.
- [ ] Add/remove wishlist items and confirm persistence after refresh.
- [ ] Checkout and confirm redirect to the order detail.
- [ ] Confirm the cart is empty and the order appears in history.
- [ ] Confirm an expired access token is refreshed and the request retried.

The automated backend and frontend checks complement this checklist, but the
browser flows must be verified against the configured MongoDB deployment.
