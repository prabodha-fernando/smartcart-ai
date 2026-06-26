# SmartCart AI

AI-powered shopping assistant built with Next.js, TypeScript, TanStack Query, Zustand, and DummyJSON APIs.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- TanStack Query
- Zustand
- Axios
- DummyJSON API

## Features

### Authentication
- Login
- Persistent sessions
- Refresh tokens
- Protected routes

### Products
- Product listing
- Product details
- Search
- Category filtering

### Favorites
- Add/remove favorites
- Persistent state
- Empty states

### AI Assistant
- Smart product recommendations
- Budget suggestions
- Best-rated product suggestions

### UX Improvements
- Loading skeletons
- Error handling
- Responsive navigation
- Mobile-friendly UI

## Installation

```bash
git clone <repository-url>

cd smartcart-ai

npm install

npm run dev
```

## Environment Variables

Create:

```env
NEXT_PUBLIC_BASE_URL=https://dummyjson.com
```

## API Endpoints

```text
POST /auth/login
GET /auth/me
POST /auth/refresh

GET /products
GET /products/:id
GET /products/search
GET /products/categories
GET /products/category/:slug
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