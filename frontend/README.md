# Fouzas Creation Frontend Client

Modern mobile-first web frontend for **Fouzas Creation** — Personalized Gifting and Order Management Platform.

## Stack
- **Framework:** React 18 + Vite (JavaScript)
- **Styling:** Tailwind CSS (Custom blush pink, cream, soft gold palette)
- **Typography:** Playfair Display (headings) + Inter (body)
- **Routing:** React Router v6 (`react-router-dom`)
- **Animation:** Framer Motion (respects `prefers-reduced-motion`)
- **Icons:** Lucide React

## Setup & Running

### Prerequisites
Make sure the backend API server is running on `http://localhost:5000`:
```bash
# In the server/ directory
npm install
npm run dev
```

### Run the Client
```bash
# In the client/ directory
npm install
npm run dev
```
The client dev server starts on `http://localhost:5173`.

### First-Party Cookies & Proxy
Vite is configured in `vite.config.js` to proxy `/api` requests directly to `http://localhost:5000`. This ensures all authentication cookies (`fc_at` access token and `fc_rt` refresh token) remain first-party and are handled directly by the browser with `httpOnly`.

## Architecture & Features

### 1. API Layer (`src/lib/api.js`)
- Standard fetch wrapper with `credentials: 'include'` and header `X-Requested-With: fouzas-web`.
- Single in-flight refresh mechanism: on encountering a `401 Unauthorized`, it calls `POST /api/auth/refresh` once. Any concurrent 401s await the same refresh promise, and on refresh success, the original requests are automatically retried.
- Error parsing handles server `{ error, details }` payloads and formats readable error messages.

### 2. Authentication & Route Guards (`src/context/AuthContext.jsx`, `src/components/RequireAuth.jsx`)
- Zero token storage in JavaScript (`localStorage` / `sessionStorage` are never used for tokens).
- `GET /api/auth/me` verifies the current session on application load.
- Protected routes (`/create`, `/orders`) redirect unauthenticated users to `/signin?next=<current_path>`.
- Open redirect protection: redirects after sign in or sign up only allow internal paths beginning with a single `/`.
- Client-side validation matches server rules (password: 10-72 chars, letter + number; phone: 10 digits starting with 6-9).

### 3. Draft Persistence (`src/hooks/useDraft.js`)
- Uses `sessionStorage` to keep draft gift configurations and customization details safe across sign-in redirects.

### 4. Layout & Design
- Mobile-first responsive design (optimized for 360px+ viewport).
- Mobile bottom navigation bar (Home, Explore, Create, My Orders, Account) with tap targets $\ge$ 44px.
- Desktop top navigation bar with luxury branding.
- Skeleton loaders, empty states, and error handling for all data fetching.
- Micro-interactions and page transitions (<400ms duration).
