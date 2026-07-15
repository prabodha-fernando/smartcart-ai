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

For AI features, configure the same server-only `AI_PROXY_SECRET` in both
applications, set `BACKEND_API_URL=http://localhost:4000/api` in the frontend,
and keep `NVIDIA_NIM_API_KEY` only in the backend environment.

## Backend

```bash
cd backend
npm install
npm run dev
```

The backend runs at `http://localhost:4000` by default. See
[`backend/README.md`](backend/README.md) for API and environment setup.

Run commands from the application directory you are working on; each app owns
its own `package.json`, lockfile, dependencies, and environment configuration.
