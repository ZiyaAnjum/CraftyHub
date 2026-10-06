# Fouzas Creation - Migration Plan & Architecture Audit

**Date:** October 6, 2026  
**Project:** Fouzas Creation (Customized Gifting Business)  
**Document Status:** Audit & Plan (Review Before Implementation)

---

## 1. Folder Structure of Frontend and Backend

```
fouzas_creation/
├── .agent/
│   └── rules/
│       └── fouzas.md                  # Project rules & constraints
├── .git/                              # Git version control
├── docs/
│   └── PRD.md                         # Product Requirements Document (v1.1)
├── client/                            # [DUPLICATE / DEAD CODE] Stale frontend clone
│   ├── src/
│   │   ├── components/                # Layout, RequireAuth, Skeleton, StatusBadge
│   │   ├── context/                   # AuthContext
│   │   ├── hooks/                     # useDraft
│   │   ├── lib/                       # api, safeNext, safeNext.test
│   │   ├── pages/                     # Account, Create, Explore, Home, Orders, SignIn, SignUp
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json                   # No node_modules, not running
│   ├── tailwind.config.js
│   └── vite.config.js
├── frontend/                          # [ACTIVE FRONTEND] Vite + React + Tailwind + Framer Motion
│   ├── dist/                          # Production build output
│   ├── node_modules/                  # Installed dependencies
│   ├── public/                        # Static assets & icons
│   ├── src/
│   │   ├── components/
│   │   │   ├── home/
│   │   │   │   └── Hero.jsx           # Animated hero section with CTA & features
│   │   │   ├── layout/
│   │   │   │   └── SiteHeader.jsx     # Navigation bar, mobile menus, brand logo
│   │   │   ├── GiftCard.jsx           # Product card with badges & pricing
│   │   │   ├── Layout.jsx             # Shell layout with top nav, bottom nav, footer
│   │   │   ├── RequireAuth.jsx        # Route auth guard (checks user session)
│   │   │   ├── Skeleton.jsx           # Loading skeletons for cards and details
│   │   │   └── StatusBadge.jsx        # Order status pill badge
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # React Auth Context (session, user, login, logout)
│   │   ├── hooks/
│   │   │   └── useDraft.js            # Draft order persistence in localStorage
│   │   ├── lib/
│   │   │   ├── api.js                 # Central fetch wrapper with CSRF & token refresh
│   │   │   ├── motion.js              # Framer Motion animation presets
│   │   │   ├── safeNext.js            # Post-login redirect URL sanitizer
│   │   │   └── safeNext.test.js       # Vitest unit tests for redirect sanitizer
│   │   ├── pages/
│   │   │   ├── AccountPage.jsx        # Customer profile & account details
│   │   │   ├── AdminGiftsPage.jsx     # Admin item/gift CRUD management & image upload
│   │   │   ├── CreatePage.jsx         # Custom enquiry & order creation wizard
│   │   │   ├── ExplorePage.jsx        # Searchable, filterable catalogue
│   │   │   ├── GiftDetailPage.jsx     # Single item detail view & enquiry trigger
│   │   │   ├── HomePage.jsx           # Landing page with hero, categories & featured items
│   │   │   ├── OrdersPage.jsx         # Order tracking & order history
│   │   │   ├── SignInPage.jsx         # Customer/Admin sign-in form
│   │   │   └── SignUpPage.jsx         # Customer registration form
│   │   ├── App.jsx                    # React Router configuration
│   │   ├── index.css                  # Tailwind styles & theme variables
│   │   └── main.jsx                   # React entry point
│   ├── package.json                   # Client dependencies (Lucide, Framer Motion, Vitest)
│   ├── tailwind.config.js             # Theme tokens (blush, cream, gold accents)
│   └── vite.config.js                 # Vite dev server (proxies /api to localhost:5000)
└── server/                            # [ACTIVE BACKEND] Node.js + Express + Mongoose
    ├── node_modules/                  # Installed backend dependencies
    ├── src/
    │   ├── config/
    │   │   └── env.js                 # Zod validated environment variables
    │   ├── middleware/
    │   │   ├── auth.js                # requireAuth, requireRole, requireCsrfHeader
    │   │   ├── errorHandler.js        # Central error handler & 404 handler
    │   │   ├── rateLimiters.js        # globalLimiter, authLimiter, refreshLimiter, orderLimiter
    │   │   ├── upload.js              # Multer memory storage image filter
    │   │   └── validate.js            # Zod schema request body validator
    │   ├── models/
    │   │   ├── Gift.js                # Existing gift/product schema
    │   │   ├── Order.js               # Existing order schema
    │   │   ├── RefreshToken.js        # Rotating refresh token schema (TTL indexed)
    │   │   └── User.js                # User schema (customer & admin)
    │   ├── routes/
    │   │   ├── admin.js               # Admin order & gift management endpoints
    │   │   ├── auth.js                # Register, login, refresh, logout, me
    │   │   ├── gifts.js               # Public catalogue & gift endpoints
    │   │   └── orders.js              # Customer order creation & tracking endpoints
    │   ├── scripts/
    │   │   ├── seedAdmin.js           # Admin creation script
    │   │   └── seedGifts.js           # Sample gifts seeder
    │   ├── utils/
    │   │   ├── cloudinary.js          # Cloudinary upload/destroy utilities
    │   │   └── tokens.js              # JWT sign/verify & cookie configuration
    │   ├── app.js                     # Express app setup (Helmet, CORS, limits, routes)
    │   └── server.js                  # Database connection & server listen
    ├── .env                           # Local environment config
    ├── .env.example                   # Environment variable template
    └── package.json                   # Server dependencies
```

---

## 2. Existing Routes, Endpoints, Models, Auth & Components

### 2.1 Backend Database & Models (MongoDB via Mongoose)
- **Database Driver:** `mongoose` (^8.5.0).
- **`User` (`server/src/models/User.js`):**
  - Fields: `name` (String, required, max 80), `email` (String, required, unique, lowercase), `phone` (String, required, regex `/^[6-9]\d{9}$/`), `passwordHash` (String, required, `select: false`), `role` (String, enum: `['customer', 'admin']`, default: `'customer'`), `emailVerified` (Boolean, default: false), `failedLoginCount` (Number, default: 0), `lockUntil` (Date, default: null), `createdAt`, `updatedAt`.
- **`Gift` (`server/src/models/Gift.js`):**
  - Fields: `title`, `slug`, `category` (enum: `['Bouquet', 'Hamper', 'Frame', 'Engraved', 'Other']`), `shortDescription`, `description`, `price` (Number, required), `priceNote`, `images` (array of `{ url, publicId }`), `includes` (array of strings), `customizationOptions` (array of strings), `occasions` (array of strings), `deliveryInfo`, `isFeatured` (Boolean), `isPublished` (Boolean), timestamps.
- **`Order` (`server/src/models/Order.js`):**
  - Fields: `orderId` (string, `FC-[0-9A-F]{8}`), `user` (ObjectId ref User), `occasion` (String), `budget` (Number), `items` (array of `{ name, qty }`), `customization` (`{ text, font, colour, theme, notes }`), `preferredDate` (Date), `status` (enum: `['Received', 'Confirmed', 'In Progress', 'Ready', 'Delivered', 'Cancelled']`), `customerNote` (String), `statusHistory` (array of `{ status, at, by }`), timestamps.
- **`RefreshToken` (`server/src/models/RefreshToken.js`):**
  - Fields: `user` (ref User), `tokenHash` (String, unique), `expiresAt` (Date, MongoDB TTL index), `revokedAt` (Date), timestamps.

### 2.2 Backend Middleware & Security Controls
- **`auth.js` (`server/src/middleware/auth.js`):**
  - `requireAuth`: Reads `fc_at` cookie, verifies JWT with `JWT_ACCESS_SECRET`, sets `req.user = { id: payload.sub, role: payload.role }`.
  - `requireRole(...roles)`: Verifies `req.user.role`.
  - `requireCsrfHeader`: Enforces `X-Requested-With: fouzas-web` on mutating HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`).
- **`rateLimiters.js` (`server/src/middleware/rateLimiters.js`):**
  - `globalLimiter`: 300 req / 15 min.
  - `authLimiter`: 10 req / 15 min (applied on `/login` and `/register`).
  - `refreshLimiter`: 60 req / 15 min.
  - `orderLimiter`: 20 req / 60 min.
- **`validate.js` (`server/src/middleware/validate.js`):**
  - Zod body validation middleware; strips unwhitelisted fields (`req.body = result.data`).
- **`upload.js` (`server/src/middleware/upload.js`):**
  - Multer memory storage (5MB limit, JPEG/PNG/WebP mime type check).
- **`errorHandler.js` (`server/src/middleware/errorHandler.js`):**
  - Generic error masking in production, 404 handler, JSON parse error handler, payload size handler.
- **`app.js` (`server/src/app.js`):**
  - `helmet`: CSP default `'none'`, HSTS in production, `x-powered-by` disabled.
  - `cors`: Strict origin check against `env.CLIENT_ORIGIN`, credentials enabled, allowed headers `Content-Type`, `X-Requested-With`.
  - `express.json({ limit: '10kb' })`: 10 KB request body limit.
  - `mongoSanitize()` and `hpp()` parameter pollution protection.

### 2.3 Backend API Endpoints
- **Auth (`server/src/routes/auth.js`):**
  - `POST /api/auth/register` (rate-limited, customer creation, bcrypt cost 12, httpOnly cookies).
  - `POST /api/auth/login` (rate-limited, 5-attempt account lockout, dummy hash timing attack protection).
  - `POST /api/auth/refresh` (rate-limited, rotating token hash with reuse detection).
  - `POST /api/auth/logout` (token revocation, clear cookies).
  - `GET /api/auth/me` (`requireAuth`, returns authenticated user profile).
- **Gifts / Catalogue (`server/src/routes/gifts.js`):**
  - `GET /api/gifts/featured`: List published featured items.
  - `GET /api/gifts`: Search, category, and occasion filter, paginated.
  - `GET /api/gifts/:slug`: Single published gift by slug.
- **Orders (`server/src/routes/orders.js`):**
  - `POST /api/orders`: Create order (`requireAuth`, user attached from session, orderLimiter).
  - `GET /api/orders/mine`: List orders owned by logged-in user.
  - `GET /api/orders/:orderId`: View single order owned by logged-in user.
- **Admin (`server/src/routes/admin.js`):**
  - Protected with `requireAuth, requireRole('admin')`.
  - `GET /api/admin/orders`: List all orders with user details, status filter.
  - `PATCH /api/admin/orders/:orderId`: Update status and customerNote.
  - `GET /api/admin/gifts`: List all gifts (including unpublished).
  - `POST /api/admin/gifts`: Create gift.
  - `PUT /api/admin/gifts/:id`: Update gift.
  - `DELETE /api/admin/gifts/:id`: Delete gift and purge Cloudinary images.
  - `POST /api/admin/gifts/upload`: Upload image to Cloudinary.

### 2.4 Frontend Pages & Reusable Components (`frontend/src`)
- **Pages:**
  - `HomePage.jsx` (`/`): Hero, occasion categories, featured gifts, review/quality highlights.
  - `ExplorePage.jsx` (`/explore`): Product discovery with search and category/occasion filters.
  - `GiftDetailPage.jsx` (`/gifts/:slug`): Multi-image carousel, details, pricing, customization notes, order CTA.
  - `CreatePage.jsx` (`/create`): Multi-step order builder (occasion, budget, items, date, custom notes).
  - `OrdersPage.jsx` (`/orders`): Orders list and detailed timeline tracker.
  - `AccountPage.jsx` (`/account`): User profile and sign-out.
  - `SignInPage.jsx` (`/signin`): Auth login form with safe redirect handling.
  - `SignUpPage.jsx` (`/signup`): Auth register form.
  - `AdminGiftsPage.jsx` (`/admin/gifts`): Admin table, gift creation/editing modal, Cloudinary image uploader.
- **Reusable Components:**
  - `Layout.jsx`: Main shell with desktop header, mobile bottom nav bar, search dialog, toast container.
  - `SiteHeader.jsx`: Brand navbar with links, account dropdown, mobile hamburger menu.
  - `GiftCard.jsx`: Standard product card with thumbnail, tags, price, and hover animations.
  - `Skeleton.jsx`: Responsive loading placeholder skeletons.
  - `StatusBadge.jsx`: Pill badge displaying status styles.
  - `RequireAuth.jsx`: Client route auth gate (redirects to `/signin?next=...`).

---

## 3. Feature Overlap Analysis

| Feature | Existing Implementation in Codebase | Overlap & Compatibility |
|---|---|---|
| **Admin Login** | `POST /api/auth/login` supports both customer and admin. `User` has `role: 'admin'`. Session stored in `fc_at` (15m) and `fc_rt` (7d) httpOnly cookies. | **Full overlap**. Existing route handles admin authentication. Needs explicit `requireAdmin` middleware export. |
| **Items CRUD** | `Gift.js` model, `server/src/routes/gifts.js` (public), `server/src/routes/admin.js` (CRUD), and `AdminGiftsPage.jsx`. | **Direct overlap**. Schema differs in field names (`price` vs `startingPrice`, `isPublished` vs `isVisible`, `customizationOptions` array of strings vs array of `{label, type}`, `occasions` vs `occasionTags`, missing `prepTimeDays`). |
| **Orders with Status & Ready-By** | `Order.js` model, `server/src/routes/orders.js`, `server/src/routes/admin.js` (`/orders`), and `OrdersPage.jsx`. | **Direct overlap**. Schema differs in order number format (`FC-[HEX]` vs `FC-0001`), status enum casing (`Received` vs `placed`), missing `readyBy`, `quotedPrice`, `adminNotes`, `requirements`, `item` reference, and customer address fields. |
| **Explore Page** | `frontend/src/pages/ExplorePage.jsx` fetching `/api/gifts`. | **Full overlap**. Currently designed around `Gift` attributes; needs adaptation when item model fields migrate. |
| **Item Detail Page** | `frontend/src/pages/GiftDetailPage.jsx` fetching `/api/gifts/:slug`. | **Full overlap**. Needs field mapping updates (`startingPrice`, `prepTimeDays`, `customizationOptions`). |
| **Order Form** | `frontend/src/pages/CreatePage.jsx` submitting to `/api/orders`. | **Full overlap**. Currently submits budget, items array, and occasion; needs alignment with new schema (`item` ref, `requirements`, `neededByDate`, customer snapshot). |
| **Track Page** | `frontend/src/pages/OrdersPage.jsx` fetching `/api/orders/mine`. | **Full overlap**. Displays timeline; needs status casing alignment and readyBy display. |
| **Image Upload** | `server/src/utils/cloudinary.js`, `server/src/middleware/upload.js`, and `POST /api/admin/gifts/upload`. | **Full overlap**. Fully functional Cloudinary + Multer pipeline already present. |

---

## 4. Overlap Disposition: MODIFIED, REPLACED, or MISSING

| Component / Artifact | Current Location | Disposition | Rationale & Action Plan |
|---|---|---|---|
| **User Model** | `server/src/models/User.js` | **MODIFIED** | Already contains `role` (`'customer' \| 'admin'`), password hashing, lockout logic. Verify default and add any missing index. |
| **Item Model** | `server/src/models/Gift.js` | **REPLACED** | Replace `Gift.js` with `Item.js` (`Item` collection) containing: `title`, `description`, `category` (`Bouquet, Hamper, Frame, Engraved, Other`), `images` (`url + publicId`), `startingPrice` (nullable = null for "price on request"), `customizationOptions` (`[{ label, type }]`), `occasionTags`, `prepTimeDays`, `isFeatured`, `isVisible`, `createdAt`, `updatedAt`. Delete `Gift.js` per no-duplication rules and update all server references. |
| **Order Model** | `server/src/models/Order.js` | **MODIFIED** | Refactor schema to match requirements: `orderNumber` (human-readable `FC-0001`), `user` (ref User), `item` (ref Item, nullable), `customer` (`{ name, phone, address }`), `requirements` (text), `referenceImages` (`[{ url, publicId }]`), `neededByDate` (Date), `status` (`'placed' \| 'confirmed' \| 'in_progress' \| 'ready' \| 'delivered' \| 'cancelled'`), `quotedPrice` (Number, nullable), `readyBy` (Date, nullable), `adminNotes` (text), `statusHistory` (`[{ status, changedAt, note }]`), `createdAt`. |
| **Auth Middleware** | `server/src/middleware/auth.js` | **MODIFIED** | Export explicit `requireAdmin` middleware alongside `requireAuth` to satisfy requirement 4. |
| **Admin Seed Script** | `server/src/scripts/seedAdmin.js` | **MODIFIED** | Update script to properly read and validate `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`, creating an admin account with role `'admin'`. |
| **Item Routes** | `server/src/routes/gifts.js` | **REPLACED** | Replace with `server/src/routes/items.js` (or refactor in place). Mount at `/api/items` (or retain `/api/gifts` compatibility redirect if needed). |
| **Admin Routes** | `server/src/routes/admin.js` | **MODIFIED** | Update items CRUD and orders status/notes endpoints to reference `Item` model, `Item` schemas, and updated `Order` fields (`quotedPrice`, `readyBy`, `adminNotes`). |
| **Order Counter** | None | **MISSING (CREATE)** | Create lightweight atomic counter schema (`Counter.js`) to guarantee collision-free human-readable sequential `orderNumber` (e.g. `FC-0001`, `FC-0002`). |
| **Duplicate Client Folder** | `client/` root folder | **REPLACED & DELETED** | Complete stale duplicate of `frontend/` added in commit `35ed2f3`. Delete `client/` entirely. Update `.agent/rules/fouzas.md` reference to `frontend/src/lib/safeNext.js`. |

---

## 5. Audit Findings: Duplicates, Dead Code, Dummy Data & Security

### 5.1 Duplicates & Dead Code
1. **Critical: Duplicate `client/` directory in project root:**
   - Commit `35ed2f3` added `client/` containing identical older versions of `App.jsx`, `Layout.jsx`, `api.js`, etc.
   - `client/` has no `node_modules` and is not running. The live, active frontend is in `frontend/`.
   - Having both violates the NO-DUPLICATION rules and risks importing the wrong files.
2. **`client/` vs `frontend/` reference in `.agent/rules/fouzas.md`:**
   - Rule 9 references `client/src/lib/safeNext.js`, whereas the active file is `frontend/src/lib/safeNext.js`.

### 5.2 Dummy & Sample Data
1. **`server/src/scripts/seedGifts.js`:**
   - Contains 6 hardcoded mock products with "Sample: ..." titles and external Unsplash URLs.
   - When migrating to `Item`, this seed file should be replaced with `seedItems.js` conforming strictly to the new `Item` schema.
2. **`frontend/src/components/home/Hero.jsx`:**
   - Contains fallback sample products when API is unreachable.
3. **`server/src/routes/auth.js` `DUMMY_HASH`:**
   - Legitimate security control (constant-time bcrypt comparison to prevent email enumeration timing attacks). Retain.

### 5.3 Security Audit & Vulnerability Assessment
1. **Admin Authorization Enforced on Backend:**
   - `server/src/routes/admin.js` uses `requireAuth, requireRole('admin')`.
   - Security Gap: `frontend/src/components/RequireAuth.jsx` currently checks `if (!user)` but does not verify `user.role === 'admin'`. Authenticated customers could load the admin page UI (though backend API calls return 403). Backend enforcement is secure; frontend UX guard will be added during frontend phase.
2. **Password & Token Security:**
   - Passwords hashed with `bcryptjs` (cost 12).
   - JWT tokens stored exclusively in `httpOnly`, `sameSite: 'lax'`, `secure: isProd` cookies (`fc_at` for access, `fc_rt` for refresh).
   - Passwords use `select: false` on `User` model, preventing leaks in `find()` queries.
3. **CORS, Helmet & Body Size:**
   - Helmet CSP configured for API (`defaultSrc: ["'none'"]`).
   - CORS strictly checks `env.CLIENT_ORIGIN` (`http://localhost:5173`).
   - `express.json({ limit: '10kb' })` blocks oversized payload attacks.
   - CSRF defence-in-depth: `X-Requested-With: fouzas-web` required on all state-changing requests.

---

## 6. Implementation Plan: Data Model & Admin Authentication (Backend Step)

### Files to Modify
1. `server/src/models/User.js`: Verify schema rules (`role` default `'customer'`).
2. `server/src/models/Order.js`: Refactor schema to match new fields (`orderNumber`, `item`, `customer`, `requirements`, `referenceImages`, `neededByDate`, `status`, `quotedPrice`, `readyBy`, `adminNotes`, `statusHistory`).
3. `server/src/middleware/auth.js`: Export `requireAdmin` middleware.
4. `server/src/scripts/seedAdmin.js`: Refactor to load from `.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) with robust validation.
5. `server/src/config/env.js`: Add optional `ADMIN_EMAIL` and `ADMIN_PASSWORD` to Zod environment validation schema if running seeds.
6. `server/src/app.js`: Ensure route registration aligns with new item and order models.

### Files to Replace & Delete
1. `server/src/models/Gift.js` ➔ **REPLACE** with `server/src/models/Item.js` (and DELETE `Gift.js`).
2. `server/src/scripts/seedGifts.js` ➔ **REPLACE** with `server/src/scripts/seedItems.js` (and DELETE `seedGifts.js`).
3. `client/` directory ➔ **DELETE** (removes 16 duplicate files and package files). Update `.agent/rules/fouzas.md`.

### Files to Create
1. `server/src/models/Item.js`: Clean Mongoose schema for items with `startingPrice`, `customizationOptions` (`[{ label, type }]`), `occasionTags`, `prepTimeDays`, `isVisible`.
2. `server/src/models/Counter.js`: Sequential atomic counter for generating `orderNumber` (e.g. `FC-0001`).

---

## 7. Manual Testing Checklist (After Implementation)

- [ ] **Admin Seeding**: Run `npm run seed:admin` with `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env`. Verify admin document in MongoDB Atlas with `role: 'admin'`.
- [ ] **Admin Authentication**:
  - Sign in via `POST /api/auth/login` with admin credentials.
  - Verify `fc_at` and `fc_rt` cookies are set (`httpOnly`, `SameSite=Lax`).
  - Verify `GET /api/auth/me` returns `role: 'admin'`.
  - Verify response does NOT contain `passwordHash`.
- [ ] **Customer vs Admin Role Protection**:
  - Log in with customer credentials and attempt to access an admin endpoint (`GET /api/admin/orders`). Verify `403 Forbidden`.
  - Log in with admin credentials and access `GET /api/admin/orders`. Verify `200 OK`.
- [ ] **Rate Limiting & Security Headers**:
  - Verify `helmet` headers (`X-Content-Type-Options: nosniff`, `Content-Security-Policy`).
  - Test login brute force (6 invalid attempts). Verify account lockout with `429 Too Many Requests`.
  - Test body size limit by posting payload > 10KB. Verify `413 Request too large`.
- [ ] **Item Model & CRUD**:
  - Create an item via admin endpoint with `startingPrice: null` ("price on request"). Verify item persists.
  - Create an item with custom options `[{ label: 'Engraving Text', type: 'text' }]`. Verify schema validation.
- [ ] **Order Model & Counter**:
  - Submit order. Verify sequential `orderNumber` (e.g. `FC-0001`).
  - Verify status defaults to `placed` and initial entry logged in `statusHistory`.
  - Update order as admin with `readyBy` datetime and `adminNotes`. Verify response and persistence.
