# SmartCart AI

AI-powered shopping assistant built with Next.js, TypeScript, TanStack Query, Zustand, and DummyJSON — with a conversational assistant powered by NVIDIA NIM.

## Tech Stack

- Next.js 16 (App Router) + React 19
- TypeScript
- Tailwind CSS + framer-motion
- TanStack Query
- Zustand
- Axios
- DummyJSON API (product/auth data)
- NVIDIA NIM (LLM inference, via the OpenAI SDK)

## Features

### Authentication
- Login with DummyJSON auth
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

### AI Assistant (NVIDIA NIM)
- Conversational, multi-turn shopping assistant
- Understands intent and returns **structured JSON** (never invents products)
- Backend resolves real products from DummyJSON based on the AI's decision
- Intent-gated: greetings/thanks/out-of-scope don't trigger a product search
- Asks follow-up questions instead of guessing
- **"Why buy this"** streamed product blurb on product pages

### UX
- Loading skeletons, error & empty states
- Responsive, mobile-friendly navigation

## AI Architecture

The AI follows the supervisor's NVIDIA NIM guidelines — the system prompt stays
on the server, the model only decides intent/filters, and the **backend owns all
business logic** (search, filter, ranking, pagination).

```text
Frontend (sends only conversation + optional lastProducts)
   │
   ▼
src/app/api/ai/chat/route.ts        thin controller
   │
   ▼
src/services/chatService.ts         builds prompt → calls AI → validates JSON
   │                                 → resolves real products from DummyJSON
   ▼
src/lib/ai/
   ├── nvidiaClient.ts   ONE central AI client (JSON call + streaming)
   ├── promptBuilder.ts  hidden system prompt (never sent to frontend)
   └── types.ts          AIDecision / AIFilters schema + category list
```

Structured decision returned by the model (enforced with
`response_format: { type: "json_object" }`):

```json
{
  "intent": "product_search",
  "requiresApiCall": true,
  "apiAction": "search_products",
  "needsMoreInformation": false,
  "missingInformation": [],
  "filters": { "category": "laptops", "maxPrice": 1200, "purpose": "gaming" },
  "reply": "Here are some gaming laptops under $1200.",
  "confidenceScore": 90
}
```

> Model: `meta/llama-3.1-8b-instruct`. The larger 70B/675B models are
> unavailable on this account (timeout / 429), so the reliable 8B model is used.

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
# Product/auth data source
NEXT_PUBLIC_BASE_URL=https://dummyjson.com

# NVIDIA NIM (server-side only — never exposed to the frontend)
NVIDIA_NIM_API_KEY=your_nvidia_api_key
# Optional override (defaults to the NVIDIA NIM endpoint below)
NVIDIA_NIM_BASE_URL=https://integrate.api.nvidia.com/v1
```

## API Endpoints

App routes:

```text
POST /api/ai/chat        conversational assistant (structured JSON → real products)
POST /api/ai/why-buy     streamed "why buy this" product blurb
```

DummyJSON (via Axios):

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
