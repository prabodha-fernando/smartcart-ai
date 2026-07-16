# SmartCart AI — Backend API

Standalone REST API (Node.js + Express + TypeScript + MongoDB) that replaces
DummyJSON auth and localStorage-only user data for **auth, cart, wishlist, and
orders**. Products are still sourced from DummyJSON, proxied through this
backend.

## Production deployment

API base URL:

```text
https://smartcart-backend-brown.vercel.app/api
```

Health check:

```text
https://smartcart-backend-brown.vercel.app/api/health
```

The bare Vercel domain has no application route. Therefore, opening
`https://smartcart-backend-brown.vercel.app/` returns a `404` response with
`Route not found: GET /`. This is expected; use the `/api` base path for all
requests.

> Build progress is tracked day-by-day; this README is updated as endpoints land.

## Tech stack

- **Runtime:** Node.js + Express
- **Language:** TypeScript (ESM)
- **Database:** MongoDB via Mongoose
- **Auth:** JWT (access + refresh), bcrypt password hashing
- **Validation:** Zod
- **Dev tooling:** tsx (watch mode), Docker Compose for local Mongo

## Getting started

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Environment variables

Copy the example file and adjust as needed:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | `development` \| `test` \| `production` | `development` |
| `PORT` | Port the API listens on | `4000` |
| `CORS_ORIGIN` | Comma-separated allowed frontend origins | `http://localhost:3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/smartcart` |
| `MONGO_ROOT_USERNAME` | Local Compose MongoDB administrator username | — |
| `MONGO_ROOT_PASSWORD` | Local Compose MongoDB administrator password | — |
| `JWT_ACCESS_SECRET` | Secret for access tokens (≥16 chars) | — |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (≥16 chars) | — |
| `ACCESS_TOKEN_EXPIRES` | Access token TTL | `15m` |
| `REFRESH_TOKEN_EXPIRES` | Refresh token TTL | `7d` |
| `DUMMYJSON_BASE_URL` | Upstream product source | `https://dummyjson.com` |
| `NVIDIA_NIM_API_KEY` | Server-only NVIDIA credential | — |
| `AI_RATE_LIMIT_PER_MINUTE` | AI requests allowed per client window | `20` |

### 3. Start the Dockerized API and MongoDB

The Compose file builds the API image, starts MongoDB, waits for MongoDB to be
healthy, and then starts the API on port 4000:

```bash
docker compose up --build -d
docker compose ps
```

MongoDB credentials are initialized only when its data volume is first
created. After changing `MONGO_ROOT_USERNAME` or `MONGO_ROOT_PASSWORD`, recreate
the local volume with `docker compose down -v` before starting the stack again.

Verify both container health and the API-to-MongoDB connection:

```bash
curl http://localhost:4000/api/health
# { "status": "ok", "uptime": ..., "db": "connected" }
```

To stop the stack without deleting database data:

```bash
docker compose down
```

If an older MongoDB volume still has the retired unique `username_1` index and
new registrations return `409`, run the included one-time migration:

```bash
docker compose exec api node dist/scripts/drop-username-index.js
```

### 4. Run the API directly (optional)

For backend development outside Docker, start only MongoDB or point
`MONGODB_URI` at a MongoDB Atlas cluster, then run:

```bash
npm run dev     # watch mode (tsx)
```

Verify it is up:

```bash
curl http://localhost:4000/api/health
# { "status": "ok", "uptime": ..., "db": "connected" }
```

### 5. Seed the demo account

The frontend's demo-login button expects the following account to exist. Seed
it (idempotent):

```bash
npm run seed    # creates emily.johnson@x.dummyjson.com / emilyspass
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start in watch mode (tsx) |
| `npm run seed` | Create the demo user (`emily.johnson@x.dummyjson.com` / `emilyspass`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled output |
| `npm run typecheck` | Type-check without emitting |
| `npm test` | Run isolated API integration tests |

## Bruno API collection

Open the `bruno/` directory as a collection and select the `Local`
environment. Run the requests in this order:

1. `Auth/Register`
2. `Auth/Login` (automatically saves `accessToken`)
3. `Wishlist/Add Item`
4. `Wishlist/Get Wishlist`
5. `Wishlist/Delete Item`

The wishlist requests use the saved token as Bearer authentication.

## Frontend integration changes

The Next.js application now uses this backend as its API source:

- Auth registration, login, refresh, and current-user requests use `/api/auth`.
- Product and category requests use the backend's DummyJSON proxy under
  `/api/products`, keeping upstream access in one place.
- Signed-in carts and wishlists are server-authoritative and scoped to the JWT
  user. Zustand remains an optimistic UI mirror and a guest-only fallback.
- Checkout calls `POST /api/orders`; after success, the local cart mirror is
  cleared and the user is sent to the persisted order detail page.
- `/orders` and `/orders/:id` display the authenticated user's order history.

This replaces browser-only persistence so user data survives cleared browser
storage and follows the same account across devices. See [`CHANGES.md`](../CHANGES.md)
for the implementation summary and end-to-end checklist.

## Testing

```bash
npm test
npm run typecheck
npm run build
```

The integration suites use an isolated in-memory MongoDB and cover Auth, Cart,
Wishlist, and Orders, including JWT protection, validation, persistence,
checkout cart clearing, and cross-user isolation.

## Project structure

```
backend/
├── api/               # serverless deployment entry point
├── src/
│   ├── controllers/    # request handlers
│   ├── services/       # business logic and external data access
│   ├── models/         # Mongoose data models
│   ├── routes/         # route definitions
│   ├── middleware/     # auth, validation, and error handling
│   ├── validators/     # Zod request schemas
│   ├── config/         # environment and database configuration
│   ├── utils/          # ApiError, asyncHandler, JWT helpers
│   ├── types/          # Express and application type declarations
│   ├── scripts/        # database maintenance and seed scripts
│   ├── app.ts          # Express app factory
│   └── server.ts       # entry point (connect DB + listen)
├── Dockerfile          # multi-stage production API image
├── docker-compose.yml  # API + MongoDB development stack
├── .env.example
└── tsconfig.json
```

## Error shape

All errors return a consistent JSON body:

```json
{ "success": false, "message": "Validation failed", "details": { } }
```

## Endpoints

All routes are prefixed with `/api`. 🔒 = requires `Authorization: Bearer <accessToken>`.

### Auth

| Method | Path | Auth | Body | Notes |
|--------|------|------|------|-------|
| POST | `/auth/register` | — | `name, email, password` | Creates the user and returns tokens + user summary |
| POST | `/auth/login` | — | `email, password` | Returns access + refresh tokens |
| POST | `/auth/refresh` | — | `refreshToken` | Rotates the refresh token and issues a fresh token pair |
| GET | `/auth/me` | 🔒 | — | Full profile of the authenticated user |

Auth responses use the common `{ success, message, data }` envelope. The
`data` object contains `accessToken`, `refreshToken`, and the user summary.

### Cart (per user)

| Method | Path | Auth | Body | Notes |
|--------|------|------|------|-------|
| GET | `/cart` | 🔒 | — | Current cart with `items`, `totalItems`, `totalPrice` |
| POST | `/cart/items` | 🔒 | `productId, quantity?` | Adds an item; merges quantity if already present |
| PATCH | `/cart/items/:id` | 🔒 | `quantity` | Sets the quantity of a line item (`:id` = productId) |
| DELETE | `/cart/items/:id` | 🔒 | — | Removes one line item |
| DELETE | `/cart` | 🔒 | — | Clears the cart |

Product display fields (title, price, thumbnail, rating) are **snapshotted** from the catalog at add-time, so reading the cart is a single DB round-trip.

### Wishlist (per user)

| Method | Path | Auth | Body | Notes |
|--------|------|------|------|-------|
| GET | `/wishlist` | 🔒 | — | Current wishlist |
| POST | `/wishlist/items` | 🔒 | `productId` | Adds a product snapshot; returns `409` if it already exists |
| DELETE | `/wishlist/items/:productId` | 🔒 | — | Removes a product |

### Orders (per user)

| Method | Path | Auth | Body | Notes |
|--------|------|------|------|-------|
| POST | `/orders` | 🔒 | — | Checkout: snapshots the cart into an order, then clears the cart |
| GET | `/orders` | 🔒 | `?page&limit` | Paginated list, newest first |
| GET | `/orders/:id` | 🔒 | — | Order detail (404 if not owned by the caller) |

### Products (catalog proxy, public)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/products` | — | Proxies DummyJSON list (query params forwarded) |
| GET | `/products/search` | — | Proxies product search |
| GET | `/products/categories` | — | Category list |
| GET | `/products/category/:category` | — | Products in a category |
| GET | `/products/:id` | — | Single product |

### Health

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/health` | — | Liveness probe + DB connection state |

### AI

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/ai/chat` | Optional JWT | Validated catalog-grounded shopping assistant; rate-limited by user or IP |
| POST | `/ai/why-buy` | Optional JWT | Grounded product explanation; rate-limited by user or IP |

The NVIDIA credential remains backend-only. Rate counters are stored in
MongoDB so limits remain consistent across serverless instances.
