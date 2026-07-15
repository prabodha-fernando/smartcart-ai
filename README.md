# SmartCart AI

SmartCart AI is organized as two independent applications:

```text
smartcart-ai/
├── frontend/   Next.js 16 web application
└── backend/    Express and MongoDB REST API
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:3000` by default. See
[`frontend/README.md`](frontend/README.md) for its features and environment
variables.

For AI features, keep `NVIDIA_NIM_API_KEY` only in the backend environment.
The frontend uses the same backend API base URL as auth, cart, and orders.

## Backend

```bash
cd backend
npm install
npm run dev
```

The backend runs at `http://localhost:4000` by default. See
[`backend/README.md`](backend/README.md) for API and environment setup.

## Deployed API

The production backend is available at:

```text
https://smartcart-backend-brown.vercel.app/api
```

Check the deployment and MongoDB connection at:

```text
https://smartcart-backend-brown.vercel.app/api/health
```

Opening `https://smartcart-backend-brown.vercel.app/` without `/api` returns
`Route not found: GET /` by design because every backend route is mounted
under `/api`.

Run commands from the application directory you are working on; each app owns
its own `package.json`, lockfile, dependencies, and environment configuration.
