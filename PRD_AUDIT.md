# Fouzas Creation: PRD Compliance & Codebase Gap Analysis

**Date:** October 10, 2026  
**Auditor:** Senior Software Engineer & Product Reviewer  
**PRD Used:** [`docs/PRD.md`](file:///c:/Users/user/fouzas_creation/docs/PRD.md) (Version 1.1)  
**Target Repository:** Fouzas Creation Fullstack Platform (`server/` + `frontend/`)

---

## 1. Executive Summary

### 1.1 Overall Metrics
- **Overall Completion:** **91.8%** (Phases 1, 2, 3, 4A, 4B, 5 & 6 completed)
- **Formula:** `(Implemented + 0.5 * Partial) / Total Requirements` = `(67 + 0.5 * 0) / 73` = `67.0 / 73` = **91.8%**
- **Status Breakdown:**
  - ✅ **Implemented:** 67 requirements (91.8%)
  - 🟡 **Partial:** 0 requirements (0.0%)
  - ❌ **Missing:** 6 requirements (8.2%) (Deferred per project scope: Google Sign-In F-97, Account Deletion F-98, QR Digital Gift Page F-80 to F-83)
  - ❓ **Unclear:** 0 requirements (0%)

### 1.2 Top Remaining Gaps (Deferred)
1. **QR Digital Gift Page (F-80 to F-83):**
   Recipient digital greeting card linked via physical gift QR code with unguessable token and animated mobile gift page (deferred).
2. **Google Sign-In & Account Deletion (F-97, F-98):**
   Google OAuth button and DPDP/GDPR account deletion flow (deferred).

---

## 2. Requirement Traceability Table

| # | PRD Requirement | Status | Evidence (file/function) | Notes / What's missing |
|---|---|---|---|---|
| **7.0** | **Accounts and Authentication** | | | |
| F-90 | Browsing is public; submitting order requires sign-in | ✅ Implemented | `frontend/src/pages/CreatePage.jsx` (`handleSubmit`, lines 243-246); `server/src/routes/orders.js` (line 136 `requireAuth`) | Public catalogue routes (`/`, `/explore`, `/items/:slug`) work without auth. Submitting order redirects to `/signin?next=/create`. |
| F-91 | Sign up with name, email, 10-digit mobile, password | ✅ Implemented | `server/src/routes/auth.js` (`/register`, lines 50-64); `frontend/src/pages/SignUpPage.jsx` (lines 61-95) | Password complexity (cost 12, min 10, letter & digit), phone regex `/^[6-9]\d{9}$/` validated on both frontend & backend. |
| F-92 | Sign in with email and password | ✅ Implemented | `server/src/routes/auth.js` (`/login`, lines 66-101); `frontend/src/pages/SignInPage.jsx` (lines 35-66) | Rate limited, locked after 5 failed attempts, dummy bcrypt timing attack protection. |
| F-93 | Return to origin page with draft selections preserved | ✅ Implemented | `frontend/src/lib/safeNext.js` (`getSafeNextPath`); `frontend/src/hooks/useDraft.js` (`updateDraft`, `useDraft`) | Draft form selections stored in `localStorage` key `fc_order_draft_v1`. Sanitized redirect prevents open redirects. |
| F-94 | View & edit profile (name, phone, address), sign out | ✅ Implemented | `frontend/src/pages/AccountPage.jsx`; `server/src/routes/auth.js` (`PATCH /me`); `server/src/models/User.js` (`savedAddress`) | Profile editing form in AccountPage validates 10-digit mobile `/^[6-9]\d{9}$/`, updates name, phone, and saved delivery address via Zod-validated `PATCH /api/auth/me`. |
| F-95 | Email verification before first order | ✅ Implemented | `server/src/routes/auth.js` (`/verify-email`, `/resend-verification`); `server/src/routes/orders.js`; `frontend/src/pages/VerifyEmailPage.jsx` | 24h SHA-256 hashed verification token with rate-limited resend; `POST /api/orders` blocks unverified orders with HTTP 403; banner and resend controls on Create and Account pages. |
| F-96 | Forgot/reset password via time-limited link | ✅ Implemented | `server/src/routes/auth.js` (`/forgot-password`, `/reset-password`); `frontend/src/pages/ForgotPasswordPage.jsx`; `frontend/src/pages/ResetPasswordPage.jsx` | 1h SHA-256 hashed reset token; generic enumeration-safe response; resets password with bcrypt cost 12; automatically revokes all active refresh tokens. |
| F-97 | Optional "Continue with Google" sign-in (P2) | ❌ Missing | `frontend/src/pages/SignInPage.jsx`; `frontend/src/pages/SignUpPage.jsx` | No Google OAuth integration or button present. |
| F-98 | Delete account and personal data on request (P2) | ❌ Missing | `server/src/routes/auth.js`; `frontend/src/pages/AccountPage.jsx` | No account deletion endpoint (`DELETE /api/auth/me`) or UI request button. |
| **7.1** | **Catalogue and Discovery** | | | |
| F-01 | Home page: brand, hero, categories, featured, CTA | ✅ Implemented | `frontend/src/pages/HomePage.jsx`; `frontend/src/components/home/Hero.jsx` | Hero with video background, 5 category cards, 4 occasion collections, featured items grid, clear CTA buttons. |
| F-02 | Product listing: image, name, category, starting price | ✅ Implemented | `frontend/src/components/ItemCard.jsx`; `frontend/src/pages/ExplorePage.jsx` | Thumbnail, title, category pill, starting price ("Starts ₹X" or "Price on request"). |
| F-03 | Filter by occasion & budget range, search by name | ✅ Implemented | `frontend/src/pages/ExplorePage.jsx`; `server/src/routes/items.js` (`minPrice`/`maxPrice`) | Search query (`q`), Category, Occasion, and Budget ranges (Under ₹500, ₹500–₹1,500, ₹1,500–₹3,000, Above ₹3,000) work end-to-end with URL parameter synchronization. |
| F-04 | Product detail: gallery, description, price note, CTA | ✅ Implemented | `frontend/src/pages/ItemDetailPage.jsx` (lines 300-485) | Aspect 4:5 image gallery with swipe & lightbox zoom, price note ("+ customization"), "Customize This Creation" CTA. |
| F-05 | Products lazy-loaded with skeleton placeholders | ✅ Implemented | `frontend/src/components/Skeleton.jsx` (`ItemCardSkeleton`); `frontend/src/pages/ExplorePage.jsx` (lines 416-426) | Skeleton placeholders render during API fetch on Explore and Home pages. |
| **7.2** | **Enquiry and Order** | | | |
| F-10 | Order form collects occasion, budget, item, notes, date; name/phone from account | ✅ Implemented | `frontend/src/pages/CreatePage.jsx` (lines 466-805); `server/src/routes/orders.js` (`POST /api/orders`) | Form collects item, requirements, neededByDate, delivery address. Customer name and phone are strictly bound to authenticated session (`user.name`, `user.phone`), ignoring any request body overrides. |
| F-11 | Upload 1 to 3 reference images | ✅ Implemented | `frontend/src/pages/CreatePage.jsx` (lines 587-655); `server/src/routes/orders.js` (`/upload`, lines 231-267) | Cloudinary upload with 3-image client & server cap (`max(3)`), 5MB size limit, JPG/PNG/WebP validation. |
| F-12 | Form input validation & inline errors | ✅ Implemented | `frontend/src/pages/CreatePage.jsx` (`validateForm`, lines 202-232); `server/src/routes/orders.js` (`createOrderSchema`) | Validates 10-digit mobile (`/^[6-9]\d{9}$/`), future needed-by date, delivery address, requirements length. |
| F-13 | Create order with unique Order ID and status "Received" | ✅ Implemented | `server/src/models/Order.js` (`generateUniqueOrderNumber`, `orderSchema`); `server/src/routes/orders.js` | Order is created with status history (initial step `placed` alias for Received). Order ID is generated as random unguessable `FC-XXXXXXXX` (8 uppercase hex chars) with collision check. |
| F-14 | Confirmation screen with Order ID, summary & WhatsApp button | ✅ Implemented | `frontend/src/pages/CreatePage.jsx` (lines 309-415) | Success screen renders `#orderNumber`, next steps card, pre-filled WhatsApp link with order ID & item title. |
| F-15 | Save Order ID (copy button) | ✅ Implemented | `frontend/src/pages/CreatePage.jsx` (`copyOrderNumber`, lines 300-305, 341-350) | One-tap clipboard copy with visual checkmark indicator. |
| F-16 | Active order cap per customer | ✅ Implemented | `server/src/routes/orders.js` (lines 261-270); `server/tests/orders.test.js` | Restricts each customer to maximum 10 active concurrent orders (`placed`, `confirmed`, `in_progress`, `ready`) to prevent spam enquiry floods. |
| **7.3** | **Order Tracking** | | | |
| F-20 | My Orders list: customer opens only their own orders | ✅ Implemented | `frontend/src/pages/OrdersPage.jsx`; `server/src/routes/orders.js` (`GET /mine`, lines 270-280) | `GET /api/orders/mine` and `GET /api/orders/:orderNumberOrId` strictly filter by `user: req.user.id`. |
| F-21 | Status timeline: Received → Confirmed → In Progress → Ready → Delivered | ✅ Implemented | `frontend/src/pages/OrdersPage.jsx` (lines 298-345); `frontend/src/pages/TrackPage.jsx` (lines 283-344) | Horizontal/vertical timeline with milestone ticks and timestamps. (Uses `placed` for initial step). |
| F-22 | Order summary and note from owner | ✅ Implemented | `frontend/src/pages/OrdersPage.jsx`; `frontend/src/pages/TrackPage.jsx`; `server/src/routes/orders.js` (`clientOrderView`) | Order summary, specifications, delivery address, quoted price, ready-by date, and customer-visible note from artisan (`customerNote`) displayed in both My Orders and Track views. |
| F-23 | Public unauthenticated order tracking | ✅ Implemented | `frontend/src/pages/TrackPage.jsx`; `server/src/routes/orders.js` (`POST /api/orders/track`); `server/tests/orders.test.js` | Dedicated `/track` lookup page using Order Number and 10-digit mobile number with dual rate limiters and strict privacy stripping. |
| F-24 | Customer order cancellation | ✅ Implemented | `frontend/src/pages/OrdersPage.jsx` (`handleCancelOrder`); `server/src/routes/orders.js` (`PATCH /api/orders/:orderNumberOrId/cancel`) | Self-service atomic cancellation from My Orders while order is still in `placed` status. |
| **7.4** | **Gift Builder Wizard** | | | |
| F-30 | Step-by-step wizard: Occasion → Recipient → Budget → Theme → Colour | ✅ Implemented | `frontend/src/pages/GiftBuilderPage.jsx` | Mobile-first 4-step wizard with animated progress bar, backwards navigation without losing answers, and quick-select option cards. |
| F-31 | Rule-based package suggestion by matching tags & budget | ✅ Implemented | `server/src/routes/builder.js` (`POST /api/builder/suggest`); `server/src/middleware/rateLimiters.js` (`builderLimiter`) | Zod-validated rule engine scoring published items on occasion tags, budget boundaries, and preference overlap; returns top 3–5 items with "why this matches" rationale. |
| F-32 | Summary card ("Your Custom Creation") with estimated price | ✅ Implemented | `frontend/src/pages/GiftBuilderPage.jsx` (Step 5) | "Your Custom Creation Vision" summary card displaying chosen criteria, estimated starting prices, and match score badges. |
| F-33 | Edit choices and send package as enquiry | ✅ Implemented | `frontend/src/pages/GiftBuilderPage.jsx`; `frontend/src/pages/CreatePage.jsx` | "Customize this" button pre-fills existing order flow (`/create?item=...&occasion=...`) with draft preserved across logins; "Edit Answers" button allows modifying choices. |
| **7.5** | **Build-Your-Own Hamper** | | | |
| F-40 | Base hamper selection, add items, personalization, packaging | ✅ Implemented | `frontend/src/pages/HamperBuilderPage.jsx`; `server/src/routes/builder.js`; `server/src/routes/orders.js` | Mobile-first Hamper Studio at `/hamper-builder`: pick base (velvet trunk, wicker basket, matte box, wooden tray), add/remove hamper-eligible catalogue items with quantity limits (max 5/item, max 10 total), and personalized card message. |
| F-41 | Instant running total update as items are added/removed | ✅ Implemented | `frontend/src/pages/HamperBuilderPage.jsx` | Real-time live running total computes `basePrice + sum(unitPrice * quantity)` with persistent summary drawer and sticky mobile bottom checkout bar. |
| F-42 | Final preview listing all selections with total before submit | ✅ Implemented | `frontend/src/pages/HamperBuilderPage.jsx`; `frontend/src/pages/OrdersPage.jsx`; `frontend/src/pages/AdminOrderDetailPage.jsx` | Full itemized review of base, items, unit prices, quantities, and server-recalculated total displayed in builder confirmation, My Orders, and Admin Order Detail. |
| **7.6** | **Live Customization Preview** | | | |
| F-50 | Live visual preview (name, text, font, colour, theme) for frames/cards | ✅ Implemented | `frontend/src/components/preview/LiveCustomizationPreview.jsx`; `frontend/src/pages/CreatePage.jsx` | Mobile-responsive SVG preview updating live as user enters custom text, chooses web-safe/loaded typography (Playfair, Inter, Georgia, Courier New), accent colors, and border themes. Text wraps/shrinks with an approximation disclaimer. |
| F-51 | Chosen customization saved with order | ✅ Implemented | `frontend/src/pages/CreatePage.jsx` (`handleSubmit`); `server/src/routes/orders.js` | Chosen custom inscription, subtitle, font, accent color, and border style are bundled into `customizationAnswers` and stored with the order document in MongoDB. |
| **7.7** | **Admin Operations** | | | |
| F-60 | Admin sign-in via same auth (role: admin); protected routes | ✅ Implemented | `server/src/middleware/auth.js` (`requireAdmin`); `frontend/src/components/RequireAuth.jsx` (`RequireAdmin`) | Access token payload carries `role: 'admin'`. Server returns 403 on role mismatch. Frontend redirects non-admins. |
| F-61 | Orders list with search and filters by status, date, occasion | ✅ Implemented | `frontend/src/pages/AdminOrdersPage.jsx`; `server/src/routes/admin.js` (`GET /orders`) | Search (order #, customer name, phone), status, date range, overdue filter, and Occasion dropdown filter work end-to-end with badges displayed on order rows. |
| F-62 | Order detail view with customer data & status update control | ✅ Implemented | `frontend/src/pages/AdminOrderDetailPage.jsx`; `server/src/routes/admin.js` (`PATCH /orders/:id`) | Full customer information, specifications, reference images with lightbox, status updates, transition validation. |
| F-63 | Admin internal note and customer-visible note | ✅ Implemented | `server/src/routes/admin.js` (`PATCH /orders/:id`); `frontend/src/pages/AdminOrderDetailPage.jsx` | Admin can manage separate `adminNotes` (private internal notes) and `customerNote` (customer-visible note), exposed safely to customer order views. |
| F-64 | Admin product CRUD including image upload | ✅ Implemented | `frontend/src/pages/AdminItemsPage.jsx`; `server/src/routes/admin.js` (`/items`, lines 367-561) | Create, edit, toggle visibility/featured/hamper-eligibility, delete (blocked if orders reference it), Cloudinary image upload. |
| F-65 | Customers view with order history (P1) | ✅ Implemented | `server/src/routes/admin.js` (`/customers`, `/customers/:id/orders`); `frontend/src/pages/AdminCustomersPage.jsx` | Paginated customer table with search (name/email/phone), explicit projection (no password hashes or tokens), aggregation for order count, total quoted spend, and last order date; per-customer order history slide-over drawer. |
| F-66 | Admin sets final agreed price | ✅ Implemented | `server/src/routes/admin.js` (lines 273, 347 `quotedPrice`); `frontend/src/pages/AdminOrderDetailPage.jsx` (lines 524-537) | `quotedPrice` numeric field saved and displayed across customer tracking pages. |
| F-67 | Dedicated admin portal login screen | ✅ Implemented | `frontend/src/pages/AdminLoginPage.jsx` (`/admin/login`); `frontend/src/components/RequireAuth.jsx` | Bespoke administrator authentication portal providing dedicated visual feedback and role validation. |
| **7.8** | **Dashboard** | | | |
| F-70 | Cards for today, pending, total orders this month | ✅ Implemented | `frontend/src/pages/AdminDashboardPage.jsx`; `server/src/routes/admin.js` (`GET /stats`) | Stat cards display New/Placed, Confirmed, In Progress, Ready, Overdue, Placed Today (IST), and Total Orders This Month computed from 1st of month in IST. |
| F-71 | Chart of monthly orders (P1) | ✅ Implemented | `server/src/routes/admin.js` (`/stats`); `frontend/src/pages/AdminDashboardPage.jsx` | Recharts AreaChart with gradient fill showing 6-month monthly order volume and quoted spend aggregated in IST (`Asia/Kolkata`) with responsive containers and friendly empty states. |
| F-72 | Most requested occasions and popular products (P1) | ✅ Implemented | `server/src/routes/admin.js` (`/stats`); `frontend/src/pages/AdminDashboardPage.jsx` | MongoDB aggregation grouping orders by occasion with normalization and friendly empty state, displayed as a responsive horizontal BarChart with custom tooltips. |
| F-73 | Budget range distribution of customers (P1) | ✅ Implemented | `server/src/routes/admin.js` (`/stats`); `frontend/src/pages/AdminDashboardPage.jsx` | MongoDB aggregation bucketing orders into price brackets (Under ₹500, ₹500–₹1,500, ₹1,500–₹3,000, Above ₹3,000, Custom/Pending), displayed as a responsive BarChart. |
| **7.9** | **QR Digital Gift Page** | | | |
| F-80 | Admin attaches message, photos, date, recipient name | ❌ Missing | `server/src/models/`; `frontend/src/pages/AdminOrderDetailPage.jsx` | Deferred per project scope. |
| F-81 | System generates unique QR code linking to gift page | ❌ Missing | `frontend/package.json`; `frontend/src/` | Deferred per project scope. |
| F-82 | Public animated mobile gift page without login | ❌ Missing | `frontend/src/App.jsx` | Deferred per project scope. |
| F-83 | Link uses random unguessable token | ❌ Missing | `server/src/routes/` | Deferred per project scope. |
| **8.1** | **Security Specifications** | | | |
| S-01 | Passwords: bcrypt cost 12, 10-72 chars, letter & digit | ✅ Implemented | `server/src/routes/auth.js` (lines 15, 21-26); `server/src/models/User.js` (`select: false`) | Bcrypt cost 12, password regex checks, password hash excluded from queries by default. |
| S-02 | Sessions: 15m access token, 7d rotating refresh token in httpOnly cookies | ✅ Implemented | `server/src/utils/tokens.js` (lines 5-48); `server/src/routes/auth.js` (`/refresh`) | `fc_at` (15m, path `/`), `fc_rt` (7d, path `/api/auth`), httpOnly, SameSite, Secure in prod. |
| S-03 | Token theft detection & session revocation on reuse | ✅ Implemented | `server/src/routes/auth.js` (`/refresh`, lines 159-171) | Re-presenting a used token revokes all active sessions for that user immediately. |
| S-04 | Brute force: rate limited, 5 failed logins locks account 15m | ✅ Implemented | `server/src/routes/auth.js` (lines 16, 70-82); `server/src/middleware/rateLimiters.js` (`authLimiter`) | Account locks for 15 minutes after 5 failed password attempts; constant-time dummy hash comparison. |
| S-05 | Authorization: Server-enforced roles; admin script only | ✅ Implemented | `server/src/middleware/auth.js` (`requireAdmin`); `server/src/scripts/seedAdmin.js` | Role cannot be submitted during registration (`auth.js` line 56). Admin accounts seeded via CLI. |
| S-06 | Object-level access: Filtered by user; random IDs | ✅ Implemented | `server/src/routes/orders.js` (lines 272, 334); `server/src/models/Order.js` (`generateUniqueOrderNumber`) | User-scoped queries prevent unauthorized reading. Order numbers are cryptographically unguessable IDs in PRD format (`FC-XXXXXXXX`, e.g. `FC-9F3A1C2B`) with collision check. |
| S-07 | Input validation: Strict schemas, 10KB body limit | ✅ Implemented | `server/src/middleware/validate.js`; `server/src/app.js` (line 44) | Zod `.strict()` schemas strip unknown properties; Express 10KB body limit enforced. |
| S-08 | Injection: NoSQL sanitize, React escaping | ✅ Implemented | `server/src/app.js` (line 46 `mongoSanitize()`); `server/src/middleware/validate.js` | NoSQL operators stripped; parameter pollution blocked with `hpp()`; React JSX escapes HTML. |
| S-09 | Transport & headers: HTTPS, Helmet CSP/HSTS, no X-Powered-By | ✅ Implemented | `server/src/app.js` (lines 22-30); `server/src/config/env.js` (lines 23-29) | CSP default-src none, HSTS in production, x-powered-by disabled, HTTPS enforced for origin in prod. |
| S-10 | CORS & CSRF: Strict origin, custom header required | ✅ Implemented | `server/src/app.js` (lines 34-41); `server/src/middleware/auth.js` (`requireCsrfHeader`) | Origin validated against `CLIENT_ORIGIN`; `X-Requested-With: fouzas-web` required on mutating requests. |
| S-11 | Uploads: Signed Cloudinary, JPEG/PNG/WebP, size limit | ✅ Implemented | `server/src/middleware/upload.js`; `server/src/utils/cloudinary.js` | Memory storage, 5MB limit, strict MIME filter, uploaded to Cloudinary, memory buffer destroyed. |
| S-12 | Secrets in env variables, validated at startup | ✅ Implemented | `server/src/config/env.js` (Zod schema, lines 4-58) | Server halts boot with `process.exit(1)` if required secrets are weak or missing. |
| S-13 | Error masking & log redaction | ✅ Implemented | `server/src/middleware/errorHandler.js` (lines 8-36) | In production, stack traces masked to `"Something went wrong"`; logs exclude passwords & phones. |
| S-14 | Dependencies: npm audit, lockfile committed | ✅ Implemented | `server/package.json` (`npm run audit`); `package-lock.json` committed | Lockfiles committed; audit command defined. |
| S-15 | MongoDB Atlas with encrypted connection | ✅ Implemented | `server/src/server.js`; `server/src/config/env.js` | Mongoose connection with TLS connection strings. |
| S-16 | Admin rate limiting & audit history | ✅ Implemented | `server/src/app.js` (line 59); `server/src/routes/admin.js` (lines 331-343) | Status changes recorded with timestamp and admin notes in `statusHistory`. |
| S-17 | Server-calculated product prices | ✅ Implemented | `server/src/routes/orders.js` (lines 300-349); `server/src/models/Order.js` | Server recalculates hamper total from current MongoDB database prices (`basePrice + sum(unitPrice * quantity)`), rejects unpublished/ineligible item IDs, and ignores any client-sent price. Final order price is strictly server-determined. |
| S-18 | Social crawler Open Graph previews | ✅ Implemented | `server/src/routes/previews.js`; `server/src/app.js` | Server-side route detects social crawlers (WhatsApp, Facebook, Twitter, Instagram, Telegram) and returns structured HTML with Open Graph tags and Cloudinary dynamic image resizing (1200x630). |
| **8.2** | **Privacy & Policies** | | | |
| NFR-01 | Privacy Policy & Terms page with consent checkbox | ✅ Implemented | `frontend/src/pages/PrivacyPolicyPage.jsx`; `frontend/src/pages/SignUpPage.jsx`; `frontend/src/components/layout/SiteFooter.jsx` | Comprehensive Privacy Policy page (`/privacy`), consent checkbox on user registration enforced on frontend and backend (`termsAccepted: true`), and footer links. |
| **8.0** | **Non-Functional Requirements** | | | |
| NFR-02 | Responsiveness: 320px+ width, mobile bottom nav | ✅ Implemented | `frontend/src/components/Layout.jsx` (lines 56-110); `tailwind.config.js` | Fixed mobile bottom nav bar, sticky action bars, touch tap targets >= 44px. |
| NFR-03 | Accessibility: contrast, keyboard nav, reduced-motion | ✅ Implemented | `frontend/src/components/home/Hero.jsx`; `frontend/src/lib/motion.js` | `useReducedMotion()` hooks disable animations; semantic markup and ARIA labels implemented. |
| NFR-04 | PWA: Web manifest, service worker shell, installable | ✅ Implemented | `frontend/public/manifest.json`; `frontend/public/sw.js`; `frontend/public/offline.html`; `frontend/src/components/PwaInstallPrompt.jsx` | Web App Manifest with icons (192, 512, maskable), service worker pre-caching app shell & static assets (bypassing /api and auth), offline fallback page, and custom install banner. |

---

## 3. Kept Extras (Formally Integrated into PRD v1.2)

The following 7 features are implemented and active in the code, but are not documented in `docs/PRD.md`:

### 1. Public Unauthenticated Order Tracking
- **What it is:** A public tracking lookup (`/track`) enabling anyone to view order status by submitting an Order Number and the matching 10-digit customer mobile number.
- **Where it lives:** `frontend/src/pages/TrackPage.jsx`; `server/src/routes/orders.js` (`POST /api/orders/track`, lines 282-328).
- **Security controls:** Protected by dual rate limiters (`trackLimiter`: 10 req/15 min; `trackOrderNumberLimiter`: 5 failed attempts/hour per IP+Order#) and sanitization (only status, timeline, ready-by date, quoted price, and item title are returned; no customer addresses, emails, or notes are exposed).
- **Recommendation:** **KEEP & DOCUMENT IN PRD.** This significantly reduces friction for customers who want to check order progress quickly from a phone or WhatsApp link without logging in.

### 2. Social Crawler Open Graph Preview Route
- **What it is:** Server-side route that detects social crawler user agents (WhatsApp, Facebook, Twitter, Instagram, Telegram) and returns structured HTML with Open Graph tags and Cloudinary dynamic image resizing (`1200x630`).
- **Where it lives:** `server/src/routes/previews.js` (lines 1-134); mounted in `server/src/app.js` (line 56).
- **Recommendation:** **KEEP & DOCUMENT IN PRD.** Essential for gifting e-commerce where customers frequently share product links over WhatsApp.

### 3. Customer Self-Service Order Cancellation
- **What it is:** Allows customers to cancel an order directly from their "My Orders" dashboard if the order is still in `placed` status.
- **Where it lives:** `frontend/src/pages/OrdersPage.jsx` (`handleCancelOrder`, lines 74-94); `server/src/routes/orders.js` (`PATCH /api/orders/:orderNumberOrId/cancel`, lines 354-404).
- **Safety check:** Executes atomically with `{ status: 'placed' }` so it cannot race with an admin confirming or beginning work on the order.
- **Recommendation:** **KEEP & DOCUMENT IN PRD.** Reduces owner customer service overhead.

### 4. Active Order Cap per Customer (Spam Prevention)
- **What it is:** Restricts each customer to a maximum of 10 concurrent active orders (`placed`, `confirmed`, `in_progress`, `ready`).
- **Where it lives:** `server/src/routes/orders.js` (lines 146-154).
- **Recommendation:** **KEEP & DOCUMENT IN PRD.** Prevents abuse and spam enquiry floods.

### 5. Staged Upload Cleanup Endpoint
- **What it is:** Deletes reference photos from Cloudinary if a customer removes an uploaded photo before submitting their order.
- **Where it lives:** `server/src/routes/orders.js` (`DELETE /api/orders/upload`, lines 251-267).
- **Security check:** Checks that the caller can only delete images with their own user ID prefix (`fouzas/orders/${req.user.id}/`).
- **Recommendation:** **KEEP & DOCUMENT IN PRD.** Prevents orphaned Cloudinary asset accumulation.

### 6. Dedicated Admin Portal Login Screen
- **What it is:** A dedicated portal route at `/admin/login` styled specifically for administrators, while the PRD stated admins would simply use the customer sign-in screen.
- **Where it lives:** `frontend/src/pages/AdminLoginPage.jsx`.
- **Recommendation:** **KEEP & DOCUMENT IN PRD.** Having a distinct administrator portal path enhances UX and provides clear visual feedback for role authorization errors.

### 7. Unguessable Order IDs with Legacy Format Support
- **What it is:** Order numbering generated in PRD format (`FC-9F3A1C2B`, 8 random uppercase hex characters with collision checking) replacing sequential counter `FC-0001`. Legacy sequential order numbers continue to work in tracking and lookups.
- **Where it lives:** `server/src/models/Order.js` (`generateUniqueOrderNumber`); `server/src/routes/orders.js`; `server/src/routes/admin.js`.
- **Status:** **RESOLVED IN PHASE 1.** Sequential enumeration risk eliminated.

---

## 4. Missing or Incomplete Work (Prioritized)

### P0 (Blockers for Launch / Production) — ✅ COMPLETED IN PHASE 2
1. **Customer Profile Management & Saved Delivery Address (F-94)** — ✅ *Resolved*
   - Added `savedAddress` to `User.js`.
   - Added `PATCH /api/auth/me` with Zod validation and Indian mobile regex `/^[6-9]\d{9}$/`.
   - Implemented profile editing card in `AccountPage.jsx`.

2. **Budget Range Filter in Storefront & API (F-03)** — ✅ *Resolved*
   - Added `minPrice` & `maxPrice` query filtering in `GET /api/items`.
   - Added `BUDGET_RANGES` filter chips (Under ₹500, ₹500–₹1.5k, ₹1.5k–₹3k, Above ₹3k) to `ExplorePage.jsx` with full URL sync.

3. **Customer-Visible Note & Owner Communication (F-22, F-63)** — ✅ *Resolved*
   - Added `customerNote` to `Order.js`.
   - Safe exposure via `clientOrderView` and `/track`. Private `adminNotes` remain internal-only.
   - Admin note editor in `AdminOrderDetailPage.jsx` and prominent display in `OrdersPage.jsx` and `TrackPage.jsx`.

4. **Privacy Policy, Terms & DPDP Consent Checkbox (NFR-01)** — ✅ *Resolved*
   - Created `PrivacyPolicyPage.jsx` (`/privacy`) and global `SiteFooter.jsx`.
   - Added mandatory consent checkbox to `SignUpPage.jsx` and backend validation (`termsAccepted: true`, `termsAcceptedAt`).

5. **Admin Occasion Filter & Monthly Volume (F-61, F-70)** — ✅ *Resolved*
   - Added `occasion` filtering to `GET /api/admin/orders` and filter dropdown in `AdminOrdersPage.jsx`.
   - Added `ordersThisMonth` calculation in `GET /api/admin/stats` and "This Month" stat card in `AdminDashboardPage.jsx`.

---

### P1 (Important / Core Value Proposition)
5. **Gift Builder Wizard (F-30 to F-33)**
   - **What's needed:** Guided 5-step wizard (Occasion → Recipient → Budget → Theme → Colour) with rule-based package matching.
   - **Suggested approach:** Implement backend endpoint `POST /api/builder/suggest` that queries `Item` by `occasionTags` and `startingPrice <= budget`. Create a multi-step wizard component in `frontend/src/pages/CreatePage.jsx` or a dedicated `/builder` page.
   - **Files to change:** `server/src/routes/items.js` (or new `builder.js`), `frontend/src/pages/CreatePage.jsx`, `frontend/src/App.jsx`.
   - **Effort:** Medium (M).

6. **Build-Your-Own Hamper Builder (F-40 to F-42, S-17)** — ✅ *Resolved in Phase 4B*
   - **What was implemented:**
     - Mobile-first interactive studio at `/hamper-builder` with base hamper selection (velvet trunk, wicker basket, matte box, wooden tray).
     - Live catalogue picker filtering hamper-eligible items with instant live running total, item counts, and quantity steppers.
     - Strict quantity limits: max 5 per item, max 10 total items per hamper.
     - Optional personalized handwritten gift card message (up to 500 characters).
     - Seamless authentication & email verification checks, with draft state preserved across logins in `sessionStorage` and `localStorage` (`fc_hamper_draft`).
     - **Security:** Server strictly recalculates hamper total from MongoDB database prices and ignores any client-sent total; rejects unpublished, ineligible, or non-existent items.
     - Itemized hamper breakdown and server-calculated total rendered in builder confirmation, My Orders, and Admin Order Detail.
     - Linked from top navigation and homepage feature banner.
   - **Files touched:** `server/src/models/Item.js`, `server/src/models/Order.js`, `server/src/routes/orders.js`, `server/src/routes/builder.js`, `server/src/routes/items.js`, `frontend/src/pages/HamperBuilderPage.jsx`, `frontend/src/pages/OrdersPage.jsx`, `frontend/src/pages/AdminOrderDetailPage.jsx`, `frontend/src/pages/HomePage.jsx`, `frontend/src/components/layout/SiteHeader.jsx`, `frontend/src/App.jsx`.

7. **Live Customization Preview (F-50, F-51)**
   - **What's needed:** Interactive visual mockup for frames and cards showing customer's custom text, font selection, and color in real time.
   - **Suggested approach:** SVG or HTML5 Canvas preview component that renders uploaded photo inside a chosen frame with selected font styles and text overlay.
   - **Files to change:** `frontend/src/components/CustomizationPreview.jsx`, `frontend/src/pages/ItemDetailPage.jsx`, `frontend/src/pages/CreatePage.jsx`.
   - **Effort:** Medium (M).

8. **Admin Customers View with Order History (F-65)** — ✅ *Resolved in Phase 5*
   - **What was implemented:**
     - Paginated customer directory endpoint `GET /api/admin/customers` with search across name, email, and 10-digit phone number.
     - Strict explicit projection in MongoDB preventing any leakage of password hashes, refresh tokens, verification tokens, or reset tokens.
     - Aggregation via `$lookup` computing total orders placed, aggregate quoted spend on non-cancelled orders, and last order timestamp.
     - Auxiliary endpoint `GET /api/admin/customers/:id/orders` to fetch full customer order history with item and hamper breakdowns.
     - Dedicated `AdminCustomersPage.jsx` with search bar, table, pagination, and slide-over order history drawer.
     - Linked in `AdminLayout.jsx` sidebar and registered in `App.jsx`.
   - **Files touched:** `server/src/routes/admin.js`, `frontend/src/pages/AdminCustomersPage.jsx`, `frontend/src/components/layout/AdminLayout.jsx`, `frontend/src/App.jsx`.

9. **Dashboard Analytics & Charts (F-70 to F-73)** — ✅ *Resolved in Phase 5*
   - **What was implemented:**
     - Installed `recharts` package in frontend.
     - MongoDB aggregations added to `GET /api/admin/stats`:
       - 6-month monthly order volume and quoted spend aggregated in IST (`Asia/Kolkata` timezone with `+05:30` offset), with all 6 months guaranteed on timeline axis.
       - Occasion popularity aggregation grouping orders by occasion themes with normalization.
       - Customer budget distribution aggregation categorizing quoted prices into price tiers (`Under ₹500`, `₹500 – ₹1,500`, `₹1,500 – ₹3,000`, `Above ₹3,000`, and `Custom / Pending`).
     - Rendered responsive, mobile-optimized Area and Bar charts with custom tooltips, gradients, and friendly empty states in `AdminDashboardPage.jsx`.
   - **Files touched:** `frontend/package.json`, `server/src/routes/admin.js`, `frontend/src/pages/AdminDashboardPage.jsx`.

10. **Email Verification & Password Reset Flows (F-95, F-96)** — ✅ *Resolved in Phase 3*
    - **What was implemented:**
      - SHA-256 hashed single-use tokens with expiration (`emailVerificationTokenHash`, `passwordResetTokenHash`).
      - Order placement blocked for unverified users via HTTP 403; banner with rate-limited resend button.
      - Enumeration-safe reset & resend responses.
      - Password reset terminates all active user sessions (rotates/revokes refresh tokens).
      - Nodemailer SMTP integration with console fallback when `EMAIL_USER` is empty.
    - **Files touched:** `server/src/models/User.js`, `server/src/routes/auth.js`, `server/src/utils/email.js`, `frontend/src/pages/ForgotPasswordPage.jsx`, `frontend/src/pages/ResetPasswordPage.jsx`, `frontend/src/pages/VerifyEmailPage.jsx`.

---

### P2 (Nice-to-Have / Version 2)
11. **PWA Manifest, Service Worker & Install Prompt (NFR-PWA, Criterion 8)**
    - **What's needed:** Web App Manifest, app icons (192px, 512px), service worker for offline app shell caching, and install trigger button.
    - **Suggested approach:** Add `vite-plugin-pwa` or standalone `manifest.json` + `sw.js` in `frontend/public/`.
    - **Files to change:** `frontend/public/manifest.json`, `frontend/public/sw.js`, `frontend/index.html`, `frontend/vite.config.js`.
    - **Effort:** Medium (M).

12. **QR Digital Gift Page (F-80 to F-83)**
    - **What's needed:** Recipient digital greeting card linked via physical gift QR code with unguessable token.
    - **Suggested approach:** Create `GiftPage` model. Add `qrcode` generation package on admin order detail. Create public route `/gift/:token`.
    - **Files to change:** `server/src/models/GiftPage.js`, `server/src/routes/admin.js`, `frontend/src/pages/GiftPageView.jsx`.
    - **Effort:** Medium (M).

13. **Google Sign-In & Account Deletion (F-97, F-98)**
    - **What's needed:** Google OAuth button and GDPR/DPDP data erasure endpoint.
    - **Suggested approach:** Google Identity Services client integration; `DELETE /api/auth/me` with data anonymization.
    - **Effort:** Small (S).

---

## 5. Recommended Improvements Beyond the PRD

### 5.1 UX & Customer Experience
- **WhatsApp Direct Order Hand-off Payload:** Include item image URL and exact order link in the pre-filled WhatsApp message so the owner can view the order in 1 tap without searching.
- **Estimated Delivery / Ready Date Calculator on Detail Page:** Display dynamic estimated readiness based on `prepTimeDays` (e.g., "Order today, ready by Tuesday, Oct 14").
- **Quick-Reorder / Duplicate Customization:** Allow returning customers to duplicate a previous order's customization choices with 1 click.

### 5.2 Performance & Core Web Vitals
- **Image Optimization Pipeline:** Ensure all Cloudinary URLs automatically inject format and quality parameters (`f_auto,q_auto,w_800`) directly from client helpers (`images.js`).
- **Font Display Strategy:** Ensure `@fontsource/playfair-display` uses `font-display: swap` to prevent FOIT (Flash of Invisible Text) on 4G mobile connections.

### 5.3 Security Hardening
- **Stop Accepting Name/Phone in Order Body:** Update `server/src/routes/orders.js` to unconditionally pull `name` and `phone` from `req.user` rather than accepting overrides from `req.body.customer`.
- **Randomize Order IDs:** Transition from sequential counter `FC-0001` to unpredictable IDs (`FC-` followed by 8 alphanumeric characters) to eliminate business volume leakage.
- **2FA for Admin Account (S-16):** Add Time-based One-Time Password (TOTP via Google Authenticator) for the admin account.

### 5.4 Testing & Quality Assurance
- **Comprehensive Backend Test Suite:** Currently, there are **zero backend tests**. Introduce Vitest or Supertest test suites covering authentication, token rotation, rate limiting, and order lifecycle transitions.
- **Frontend Component Tests:** Add tests for `CreatePage` validation, `AuthContext` token refresh recovery, and `AdminOrderDetailPage` status transition rules.

### 5.5 DevOps & Deployment
- **Automated Health Check & Monitoring:** Enhance `/api/health` to perform a database ping (`mongoose.connection.readyState === 1`) and monitor response times.
- **Database Backup Automation:** Document automated daily MongoDB Atlas backup snapshot policies.

---

## 6. Risks, Conflicts & Inconsistencies

### 6.1 Schema & PRD Field Inconsistencies
| Entity | PRD Specification | Actual Codebase Implementation | Impact |
|---|---|---|---|
| **Product Model** | Named `Product` (`basePrice`, `isActive`, `isCustomizable`) | Named `Item` (`startingPrice`, `isVisible`, `prepTimeDays`) | Compatibility layer exists in `formatItemResponse`, but endpoint is `/api/items` instead of `/api/products`. |
| **Order Status Enum** | `Received`, `Confirmed`, `In Progress`, `Ready`, `Delivered`, `Cancelled` | `placed`, `confirmed`, `in_progress`, `ready`, `delivered`, `cancelled` | Frontend and backend use lowercase snake_case `placed` instead of capitalized `Received`. Status casing must remain consistent. |
| **Order Number** | Random, non-sequential (e.g. `FC-9F3A1C2B`) | Sequential atomic counter (`FC-0001`, `FC-0002`) | Predictable order numbers; order volume is publicly discoverable. |
| **Customer Note** | `customerNote` (customer-visible note from admin) | `adminNotes` (strictly hidden from customer) | Customers cannot receive written status explanations or updates from the owner. |

### 6.2 Security & Operational Risks
- **No Email Verification Check:** While `emailVerified` is stored on `User`, users can place orders without verifying their email. A malicious actor could sign up with someone else's email address and submit enquiries.
- **Customer Identity Spoofing in Orders:** `server/src/routes/orders.js` lines 180-184 accepts `customer.name` and `customer.phone` from the request payload. An attacker could register an account and place orders under someone else's name and phone number.
- **Zero Backend Tests:** The backend lacks automated tests. Any refactor to token rotation, rate limiters, or order validation risks regressions without immediate detection.

---

## 7. Suggested Next Steps (Action Plan: Next 1–2 Days)

### Day 1: High-Impact P0 Fixes & Security Hardening
1. **Fix Customer Identity in Orders (`server/src/routes/orders.js`):**
   - Strictly bind `customer.name` and `customer.phone` to `user.name` and `user.phone` from the verified session. Disallow body overrides.
2. **Add Customer Profile Editing (`server/src/routes/auth.js` & `AccountPage.jsx`):**
   - Add `PATCH /api/auth/me` to update name, phone, and saved delivery address.
   - Add an edit form to `AccountPage.jsx`.
3. **Expose Customer Notes (`server/src/routes/orders.js` & tracking pages):**
   - Add `customerNote` to `Order` schema. Expose it in `clientOrderView`. Render it in `OrdersPage.jsx` and `TrackPage.jsx`.
4. **Implement Budget Filter in Explore Page:**
   - Add `minPrice` / `maxPrice` query handling in `server/src/routes/items.js`. Add budget range selector chips to `ExplorePage.jsx`.
5. **Add Privacy Policy & DPDP Consent Checkbox:**
   - Add required consent checkbox on `SignUpPage.jsx` and create a simple Privacy Policy modal/page.

### Day 2: Core Value-Add Features & PWA
6. **Implement Gift Builder Suggestion Engine (`POST /api/builder/suggest`):**
   - Create route matching items by occasion and budget tags.
   - Build a 3-step guided wizard on `CreatePage.jsx` (Occasion → Budget → Suggested Package).
7. **PWA Setup:**
   - Add `manifest.json` and basic service worker registration in `frontend/public/` so the app is installable on Android and iOS devices.
8. **Add Core API Integration Tests:**
   - Write integration tests for auth login/registration, token rotation, and order placement using Supertest or Vitest.
