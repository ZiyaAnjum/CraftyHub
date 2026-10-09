# Fouzas Creation — Boutique Gifting & Order Management Platform

A high-touch, mobile-first web platform for **Fouzas Creation** (Bengaluru, India) to showcase handcrafted bespoke creations (bouquets, hampers, frames, engraved treasures), take customer customization enquiries, track crafting milestones in real-time, and manage the full order lifecycle from workshop to doorstep.

---

## 1. Project Overview & Tech Stack

### Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, Lucide Icons, Google Fonts (Playfair Display, Inter).
- **Backend:** Node.js, Express 4, Mongoose (MongoDB Atlas), Cloudinary SDK.
- **Security & Infrastructure:** Helmet (CSP, HSTS), HttpOnly secure rotating JWT cookies, CSRF header verification (`X-Requested-With`), Express Rate Limit, Multer (5MB memory filter), Zod validation, `app.set("trust proxy")`.
- **Catalogue & Orders:** Real-time customer timeline tracking, automated WhatsApp deep links, atomic order cancellation, sequential human-readable order IDs (`FC-0001`).

---

## 2. Local Setup & Running the Application

### Prerequisites
- Node.js $\ge$ 18.0.0
- MongoDB connection string (Atlas or local)
- Cloudinary account for photo uploads

### Installation
Clone the repository and install dependencies in both `server/` and `frontend/`:

```bash
# 1. Install server dependencies
cd server
npm install

# 2. Install frontend dependencies
cd ../frontend
npm install
```

### Environment Variables (Names Only)

#### Server (`server/.env`)
Create a `.env` file in the `server/` directory:
- `NODE_ENV` (e.g. `development` or `production`)
- `PORT` (e.g. `5000`)
- `MONGO_URI`
- `JWT_ACCESS_SECRET` (at least 32 characters)
- `CLIENT_ORIGIN` (e.g. `http://localhost:5173` or production URL)
- `PUBLIC_SITE_URL` (optional, defaults to `CLIENT_ORIGIN`)
- `TRUST_PROXY` (e.g. `1`)
- `COOKIE_DOMAIN` (optional, e.g. `.fouzascreation.com`)
- `COOKIE_SAMESITE` (`lax` or `none`)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD` (min 10 characters)

#### Frontend (`frontend/.env`)
Create a `.env` file in the `frontend/` directory:
- `VITE_WHATSAPP_NUMBER` (Shop WhatsApp number in international digits without `+`, e.g. `919876543210`)

### Seed Initial Admin & Change Password

To create or update the shop administrator account:

1. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env`.
2. Run the seeding command inside `server/`:
   ```bash
   npm run seed:admin
   ```
3. To change the admin password, update `ADMIN_PASSWORD` in `server/.env` and re-run `npm run seed:admin`. The script detects the existing admin record, generates a fresh bcrypt hash (cost 12), and resets failed login counters.

> **Note on Catalogue Data:** No dummy items or test products remain in the production codebase. The shop owner can add real boutique creations, photos, and customization options directly through the administrative portal at `/admin/items`.

### Running Locally
Run both services in separate terminal windows:

```bash
# Terminal 1: Backend API (runs on http://localhost:5000)
cd server
npm run dev

# Terminal 2: Frontend Client (runs on http://localhost:5173 with proxy to :5000)
cd frontend
npm run dev
```

---

## 3. Crawler Share Previews (`/items/:slug`)

When sharing `/items/:slug` on WhatsApp, Instagram, Facebook, or Twitter, crawlers inspect Open Graph meta tags to generate preview cards.

The backend Express server provides a lightweight crawler preview endpoint:
- **Crawler User-Agents** (`facebookexternalhit`, `WhatsApp`, `Twitterbot`, `LinkedInBot`, `Discordbot`, etc.) receive a clean, lightweight HTML shell with `<title>`, `<meta name="description">`, `og:title`, `og:description`, `og:url`, `twitter:card`, and an absolute HTTPS Cloudinary `1200x630` transformed image (`f_auto,q_auto,c_fill,g_auto,w_1200,h_630`).
- **Human Browsers** fall through via `next()` to the SPA index shell without any redirect loops.

---

## 4. Production Deployment Checklist

Two deployment architectures are fully supported:

### Setup A: Unified Origin via Vercel Rewrite to Render (Recommended)
In this setup, Vercel serves the static frontend SPA and rewrites `/api/*` and crawler paths to the Express backend on Render. The browser interacts with a single origin (`https://fouzascreation.com`), providing maximum cookie compatibility and zero cross-site privacy restrictions.

#### 1. Vercel Configuration (`vercel.json` in project root or frontend)
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://fouzas-api.onrender.com/api/:path*"
    },
    {
      "source": "/items/:slug",
      "has": [
        {
          "type": "header",
          "key": "user-agent",
          "value": ".*(facebookexternalhit|Facebot|WhatsApp|Twitterbot|Pinterest|LinkedInBot|Slackbot|TelegramBot|Discordbot).*"
        }
      ],
      "destination": "https://fouzas-api.onrender.com/items/:slug"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### 2. Environment & Security Settings for Setup A:
- **`CLIENT_ORIGIN`**: `https://fouzascreation.com`
- **`PUBLIC_SITE_URL`**: `https://fouzascreation.com`
- **`COOKIE_SAMESITE`**: `lax`
- **`COOKIE_DOMAIN`**: Leave blank (same-origin default)
- **`TRUST_PROXY`**: `1` (trusts Vercel / Render single proxy hop)
- **CORS**: Allows `https://fouzascreation.com` with `credentials: true`

---

### Setup B: Custom Domain with API Subdomain (`api.fouzascreation.com`)
In this setup, the frontend runs on `https://fouzascreation.com` (e.g. Vercel/Netlify) and the backend runs on `https://api.fouzascreation.com` (e.g. Render/Railway).

#### 1. Crawler Routing for Setup B
Configure DNS / CDN (e.g. Cloudflare Worker or Edge Rule) on `fouzascreation.com`:
- When request path matches `/items/:slug` AND header `user-agent` matches social crawler signatures, forward the request to `https://api.fouzascreation.com/items/:slug`.
- Human visitors are served the standard static `index.html`.

#### 2. Environment & Security Settings for Setup B:
- **`CLIENT_ORIGIN`**: `https://fouzascreation.com`
- **`PUBLIC_SITE_URL`**: `https://fouzascreation.com`
- **`COOKIE_SAMESITE`**: `lax`
- **`COOKIE_DOMAIN`**: `.fouzascreation.com` (enables shared first-party cookies across `fouzascreation.com` and `api.fouzascreation.com`)
- **`TRUST_PROXY`**: `1` (trusts Render / Cloudflare proxy)
- **CORS**: Backend allows `https://fouzascreation.com` with `credentials: true`

> **Note on Cross-Site Cookies:** If frontend and API are ever deployed on completely separate registrable domains (e.g. `fouzas.vercel.app` and `fouzas.onrender.com` without a shared domain), `COOKIE_SAMESITE` must be set to `none`. Modern browsers will drop `SameSite=Lax` cookies on cross-site credentialed requests.

---

## 5. Content Security Policy (CSP) Guidance for Frontend Host

The Express API enforces a strict API-only CSP (`default-src: 'none'; frame-ancestors: 'none'`).

For the frontend static host (e.g. Vercel, Netlify, Nginx, or Cloudflare Headers), configure the following headers on `index.html`:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://res.cloudinary.com; connect-src 'self' https://res.cloudinary.com https://api.cloudinary.com <BACKEND_API_URL>; frame-ancestors 'none'; object-src 'none'; base-uri 'self';
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## 6. Verification & Health Monitoring

- **Health Check Endpoint:** `GET /api/health` returns `{ "status": "ok", "uptime": <seconds> }`.
- **Search Engine Indexing:**
  - `robots.txt` disallows `/admin/` crawling.
  - Customer order milestones (`/orders`) and track lookup (`/track`) include `<meta name="robots" content="noindex, nofollow" />` dynamically to prevent private order records from appearing in search indices.
