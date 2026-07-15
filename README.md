# SmartCart AI

SmartCart AI is a full-stack shopping application with a Next.js storefront
and an Express REST API. Users can authenticate, browse the proxied product
catalog, maintain account-scoped carts and wishlists, check out, review orders,
and request catalog-grounded recommendations from an AI assistant.

## Features

- JWT authentication with short-lived access tokens, rotating refresh tokens,
  password hashing, and persistent browser sessions.
- MongoDB-backed carts, wishlists, and orders isolated by authenticated user.
- Product listing, details, search, categories, filtering, and sorting through a
  backend proxy to DummyJSON.
- Checkout with product snapshots, empty-cart protection, cart clearing, order
  history, order details, and pagination.
- Backend-hosted NVIDIA NIM assistant with catalog-aware recommendations,
  category filtering, price/rating sorting, and per-user/IP rate limiting.
- Responsive UI, meaningful loading/error states, unit/integration tests, and a
  complete Playwright browser flow.

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, TanStack Query, Zustand, Axios, Tailwind CSS |
| Backend | Node.js, Express, TypeScript, Zod, JWT, bcrypt |
| Data | MongoDB, Mongoose, DummyJSON product catalog |
| AI | NVIDIA NIM, backend catalog grounding, MongoDB rate limits |
| Testing | Vitest, Supertest, MongoDB Memory Server, Testing Library, Playwright |
| Deployment | Vercel, MongoDB Atlas, Docker Compose for local development |

## Repository structure

```text
smartcart-ai/
├── backend/
│   ├── api/                 Vercel serverless entry point
│   ├── src/
│   │   ├── config/          environment and database configuration
│   │   ├── controllers/     HTTP request handlers
│   │   ├── middleware/      JWT, validation, rate limit, error handling
│   │   ├── models/          User, Cart, Wishlist, Order, AI rate-limit models
│   │   ├── routes/          API route definitions
│   │   ├── services/        business logic, product proxy, AI integration
│   │   ├── tests/           isolated API integration tests
│   │   └── validators/      Zod request schemas
│   ├── Dockerfile
│   └── docker-compose.yml
├── frontend/
│   ├── e2e/                 Playwright end-to-end flow
│   └── src/
│       ├── app/             Next.js App Router pages and BFF proxy
│       ├── components/      UI and AI components
│       ├── hooks/           query and assistant hooks
│       ├── services/        backend API clients
│       └── store/           authenticated UI mirrors and guest fallback
├── CHANGES.md
└── README.md
```

## Installation and local development

Requirements: Node.js 20+, npm, and either MongoDB or Docker.

```bash
git clone https://github.com/prabodha-fernando/smartcart-ai.git
cd smartcart-ai
```

### 1. Start the backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

The API starts at `http://localhost:4000/api`. Alternatively, run the API and
MongoDB together from `backend/`:

```bash
docker compose up --build
```

### 2. Start the frontend

In another terminal:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Backend (`backend/.env`):

| Variable | Purpose |
|---|---|
| `NODE_ENV`, `PORT` | Runtime mode and API port |
| `CORS_ORIGIN` | Comma-separated allowed frontend origins |
| `MONGODB_URI` | Local MongoDB or Atlas connection string |
| `JWT_ACCESS_SECRET` | Access-token signing secret, at least 16 characters |
| `JWT_REFRESH_SECRET` | Separate refresh-token signing secret |
| `ACCESS_TOKEN_EXPIRES` | Access-token lifetime, normally `15m` |
| `REFRESH_TOKEN_EXPIRES` | Refresh-token lifetime, normally `7d` |
| `DUMMYJSON_BASE_URL` | Upstream catalog URL |
| `NVIDIA_NIM_BASE_URL` | NVIDIA OpenAI-compatible endpoint |
| `NVIDIA_NIM_API_KEY` | Server-only NVIDIA credential |
| `AI_RATE_LIMIT_PER_MINUTE` | Allowed AI requests per user/IP per minute |

Frontend (`frontend/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
BACKEND_API_URL=http://localhost:4000/api
```

`NEXT_PUBLIC_API_URL` is used by browser requests. `BACKEND_API_URL` is used
by the server-side proxy. Never place database credentials, JWT secrets, or AI
keys in a `NEXT_PUBLIC_*` variable. The committed `.env.example` files contain
placeholders only.

## Authentication flow

1. Register or log in to receive an access token and refresh token.
2. Axios attaches the access token to protected requests.
3. A `401` response triggers one refresh request and token rotation.
4. The original request retries once with the new access token.
5. Logout clears the local authenticated session; replayed/expired refresh
   tokens are rejected by the API.

All cart, wishlist, and order queries derive ownership from the verified JWT;
clients never choose another user's database identifier.

## Main API endpoints

All backend routes are prefixed with `/api`. Protected routes require
`Authorization: Bearer <accessToken>`.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me` |
| Cart | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:productId`, `DELETE /cart/items/:productId`, `DELETE /cart` |
| Wishlist | `GET /wishlist`, `POST /wishlist/items`, `DELETE /wishlist/items/:productId` |
| Orders | `POST /orders`, `GET /orders?page=&limit=`, `GET /orders/:id` |
| Products | `GET /products`, `/products/search`, `/products/categories`, `/products/category/:slug`, `/products/:id` |
| AI | `POST /ai/chat`, `POST /ai/why-buy` |
| Operations | `GET /health` |

Detailed request/response information is in
[`backend/README.md`](backend/README.md). Frontend behavior is documented in
[`frontend/README.md`](frontend/README.md).

## Validation commands

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

Backend integration tests cover authentication, token rotation/replay,
validation, cart/wishlist ownership isolation, duplicate wishlist handling,
empty checkout, order ownership, pagination, cart clearing, AI filtering, and
rate limiting. Playwright covers the complete register-to-checkout UI flow.

## Deployment

- Backend API: `https://smartcart-backend-brown.vercel.app/api`
- Health check: `https://smartcart-backend-brown.vercel.app/api/health`
- Frontend: `https://smartcart-ai.vercel.app`

The backend root intentionally returns `Route not found: GET /`; use `/api` or
`/api/health`. Production secrets belong in the corresponding Vercel project's
Environment Variables settings and require a redeployment after changes.

## Submission and demonstration

Demonstrate registration, login, refresh/session persistence, logout, cart
CRUD, wishlist duplicate prevention/removal, checkout, order history/details,
and protected-route rejection. In MongoDB Atlas, show the `users`, `carts`,
`wishlists`, and `orders` collections and explain that each domain document is
linked to the authenticated user's ObjectId while orders retain immutable
product snapshots.

Review [`CHANGES.md`](CHANGES.md) for the implementation record and final
verification checklist. Development is pushed to `dev`; merge to `main` only
after supervisor approval.
