# SmartCart AI — Backend API

Standalone REST API (Node.js + Express + TypeScript + MongoDB) that replaces
DummyJSON/localStorage for **auth, cart, wishlist, and orders**. Products are
still sourced from DummyJSON, proxied through this backend.

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
| `JWT_ACCESS_SECRET` | Secret for access tokens (≥16 chars) | — |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (≥16 chars) | — |
| `ACCESS_TOKEN_EXPIRES` | Access token TTL | `15m` |
| `REFRESH_TOKEN_EXPIRES` | Refresh token TTL | `7d` |
| `DUMMYJSON_BASE_URL` | Upstream product source | `https://dummyjson.com` |

### 3. Start MongoDB

Using Docker (recommended):

```bash
docker compose up -d      # starts MongoDB on localhost:27017
```

Or point `MONGODB_URI` at a MongoDB Atlas cluster.

### 4. Run the API

```bash
npm run dev     # watch mode (tsx)
```

Verify it's up:

```bash
curl http://localhost:4000/api/health
# { "status": "ok", "uptime": ..., "db": "connected" }
```

### 5. Seed the demo account

The frontend's "Continue as guest" / prefilled `emilys` login expects that
account to exist. Seed it (idempotent):

```bash
npm run seed    # creates emilys / emilyspass
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start in watch mode (tsx) |
| `npm run seed` | Create the demo user (`emilys` / `emilyspass`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled output |
| `npm run typecheck` | Type-check without emitting |

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
├── docker-compose.yml  # local MongoDB
├── .env.example
└── tsconfig.json
```

## Error shape

All errors return a consistent JSON body:

```json
{ "error": { "message": "…", "code": 400, "details": { } } }
```

## Endpoints

All routes are prefixed with `/api`. 🔒 = requires `Authorization: Bearer <accessToken>`.

### Auth

| Method | Path | Auth | Body | Notes |
|--------|------|------|------|-------|
| POST | `/auth/register` | — | `firstName, lastName, email, username, password, age?` | Creates the user and returns tokens + user summary |
| POST | `/auth/login` | — | `username, password, expiresInMins?` | Returns access + refresh tokens (flat payload) |
| POST | `/auth/refresh` | — | `refreshToken, expiresInMins?` | Issues a fresh token pair |
| GET | `/auth/me` | 🔒 | — | Full profile of the authenticated user |

The auth payload is **flat** (`accessToken`, `refreshToken`, and a user summary at the top level) to match the frontend's existing axios interceptor and auth store.

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
| POST | `/wishlist/items` | 🔒 | `productId, note?` | Adds a product (idempotent; updates `note` if resent) |
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
