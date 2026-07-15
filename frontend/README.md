# SmartCart AI

AI-powered shopping assistant built with Next.js, TypeScript, TanStack Query, Zustand, and DummyJSON — with a conversational assistant powered by NVIDIA NIM.

## Tech Stack

- Next.js 16 (App Router) + React 19
- TypeScript
- Tailwind CSS + framer-motion
- TanStack Query
- Zustand
- Axios
- Express + MongoDB backend for auth, products, cart, wishlist, orders, and AI

## Features

### Authentication
- Login with the SmartCart Express API
- Persistent sessions & refresh tokens
- Protected routes

### Products
- Product listing with infinite "Load More"
- Product details
- Debounced search
- Category browsing

### Category pages
- **Load More** pagination (reveals products in pages)
- **Filter** by minimum rating (All / 4★+ / 4.5★+)
- **Sort** by Featured / Price (low→high, high→low) / Highest Rated

### Favorites
- Add / remove favorites with per-item notes (full CRUD)
- Persistent, migrated Zustand store
- Nav badge count, empty states

### AI Assistant
- Conversational, multi-turn shopping assistant
- Backend resolves and ranks real products from DummyJSON
- Intent-gated: greetings/thanks/out-of-scope don't trigger a product search
- Asks follow-up questions instead of guessing
- Grounded "Why buy this" product explanation on product pages

### UX
- Loading skeletons, error & empty states
- Responsive, mobile-friendly navigation

## AI Architecture

All active AI behavior lives in the Express backend. The frontend sends the
conversation and optional product context to a validated domain endpoint.
NVIDIA credentials, catalog lookup, filtering, ranking, prompting, fallback
responses, and distributed rate limiting remain backend-only.

```text
Next.js UI → Express /api/ai/chat or /api/ai/why-buy
                    ├── Zod validation
                    ├── MongoDB user/IP rate limit
                    ├── DummyJSON catalog resolution
                    └── NVIDIA NIM with grounded fallback
```

The response contains a grounded reply, resolved product cards, intent, and a
flag indicating whether a new catalog search occurred.

## Installation

```bash
git clone <repository-url>
cd smartcart-ai
cd frontend
npm install
npm run dev
```

## Environment Variables

Create a `.env.local` (keep it out of version control):

```env
NEXT_PUBLIC_BASE_URL=http://localhost:4000/api
BACKEND_API_URL=http://localhost:4000/api
```

## API Endpoints

Backend AI routes:

```text
POST /api/ai/chat        catalog-grounded conversational assistant
POST /api/ai/why-buy     grounded product explanation
```

Backend API:

```text
POST /auth/login
GET  /auth/me
POST /auth/refresh

GET  /products
GET  /products/:id
GET  /products/search
GET  /products/categories
GET  /products/category/:slug
```

## Branch Strategy

```text
main
│
└── dev
    │
    ├── feature/auth
    ├── feature/products
    ├── feature/search
    ├── feature/favorites
    ├── feature/profile
    ├── feature/ai-integration
    └── feature/persistent-auth
```

## Demo User

```text
Username: emilys
Password: emilyspass
```
