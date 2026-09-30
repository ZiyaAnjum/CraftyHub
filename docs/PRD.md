# Fouzas Creation: Product Requirements Document

**Product:** Fouzas Creation, a Smart Personalized Gifting and Order Management Platform
**Tagline:** Made for your special moments
**Client:** Fouzas Creation (customized gifts, hampers, bouquets, frames and other creations, online and offline)
**Document version:** 1.1 (adds customer accounts and a security specification)
**Platform:** Mobile-first responsive web app, installable as a PWA

---

## 1. Overview

Fouzas Creation is a customized gifting business whose orders are currently handled manually through chats, calls and notes. This product gives the business a single place to showcase its work, let customers design and request gifts, and let the owner manage every order from receipt to delivery.

Most customers will use a phone, so the product is designed mobile-first, with smooth animations and an app-like feel, and it can be installed on the home screen without an app store.

## 2. Problem Statement

- Customized orders come with many details (occasion, budget, name, text, colours, references) that are scattered across chats and easy to lose.
- Customers cannot easily see what is possible, so they ask the same questions repeatedly.
- The owner has no organized record of customers, orders and status, and no view of what sells.
- Customers have no simple way to check the status of their order.

## 3. Goals and Non-Goals

### Goals
1. Showcase products and past creations in an attractive, browsable catalogue.
2. Let customers describe exactly what they want through guided builders instead of blank forms.
3. Capture every enquiry and order in a structured database.
4. Let the owner confirm, process and update orders from an admin dashboard.
5. Let customers track their order status.
6. Give the owner simple insights into orders, occasions and budgets.

### Non-Goals (Version 1)
- Online payment gateway
- Delivery partner integration or live delivery tracking
- Inventory management
- Native Android/iOS apps

### Success Metrics
| Metric | Target |
|---|---|
| Customer can submit an enquiry from the home screen | 4 taps or fewer to reach the form |
| Enquiry form completion time | Under 2 minutes |
| Page load on a mid-range phone over 4G | Under 3 seconds |
| Lighthouse scores (performance, accessibility, PWA) | 85+ each |
| Owner can update an order status | Under 3 taps from the orders list |
| Orders captured in the system instead of chat notes | 100% of website orders |

## 4. Users and Personas

**Customer (primary):** A person aged 18 to 45 buying a gift for a birthday, engagement, wedding, anniversary or similar occasion. Uses a phone, prefers WhatsApp for conversation, wants to see options and know roughly what it will cost.

**Owner/Admin (secondary):** The business owner managing products and orders, mostly from a phone or laptop. Not technical, so needs a simple, clear interface.

**Gift recipient (tertiary, QR feature):** Scans a QR code on a physical gift to see a personal digital message.

## 5. Scope

### 5.1 Version 1 (MVP), must have
Catalogue, product detail, **customer sign up / sign in**, enquiry/order form (sign-in required), order confirmation, **My Orders** tracking, admin login, order management, product management, basic dashboard, and the security controls in Section 8.

### 5.2 Version 1.5 (differentiators), should have
Gift Builder wizard, Build-Your-Own Hamper, live customization preview, WhatsApp enquiry button, dashboard charts.

### 5.3 Version 2, could have
QR digital gift page, PWA install prompt and offline shell, wishlist saved on device.

### 5.4 Future scope
Online payment, WhatsApp automated notifications, delivery tracking, customer accounts, inventory management, sales reports export, native mobile app.

## 6. User Flows

**Flow A: Browse and enquire**
Home → choose occasion → browse products (no login needed) → product detail → "Customize / Enquire" → **if not signed in, sign in or sign up, then return to the same place with the choices kept** → fill form (name and phone prefilled from the account) → submit → confirmation with Order ID → optional "Continue on WhatsApp".

**Flow B: Gift Builder**
Home → "Create Your Gift" → Occasion → Recipient → Budget → Theme and colour → suggested package with estimated price → Customize → Save → Send enquiry.

**Flow C: Build-Your-Own Hamper**
Choose base hamper → add items → add personalization → choose packaging → preview with running total → confirm → submit enquiry.

**Flow D: Track order**
Sign in → My Orders → open an order → see status timeline.

**Flow E: Admin order handling**
Admin login → Orders list → open order → review details → contact customer if needed → confirm → update status through the stages → order complete.

**Flow F: QR gift experience**
Owner adds a personal message and photos to an order → system generates a QR code → QR is attached to the physical gift → recipient scans → sees the digital gift page.

## 7. Functional Requirements

Priority: **P0** = must have, **P1** = should have, **P2** = could have.

### 7.0 Accounts and authentication
| ID | Requirement | Priority |
|---|---|---|
| F-90 | Browsing (home, catalogue, product detail, builders in preview mode) is public. Submitting an order or enquiry requires a signed-in customer. | P0 |
| F-91 | Sign up with name, email, mobile number and password. | P0 |
| F-92 | Sign in with email and password. | P0 |
| F-93 | After sign-in the customer returns to the page they came from, with their selections preserved. | P0 |
| F-94 | Customer can view and edit their profile (name, phone, saved delivery address) and sign out. | P1 |
| F-95 | Email verification before the first order can be placed. | P1 |
| F-96 | Forgot/reset password via a time-limited emailed link. | P1 |
| F-97 | Optional "Continue with Google" sign-in. | P2 |
| F-98 | Customer can delete their account and personal data on request. | P2 |

### 7.1 Catalogue and discovery
| ID | Requirement | Priority |
|---|---|---|
| F-01 | Home page shows the brand, hero section, occasion categories, featured creations and a clear enquiry call to action. | P0 |
| F-02 | Product listing shows image, name, category and starting price. | P0 |
| F-03 | Customer can filter products by occasion and budget range, and search by name. | P0 |
| F-04 | Product detail page shows an image gallery, description, price note ("price varies with customization") and an enquiry button. | P0 |
| F-05 | Products are lazy-loaded with skeleton placeholders. | P1 |

### 7.2 Enquiry and order
| ID | Requirement | Priority |
|---|---|---|
| F-10 | Order form (signed-in customers only) collects occasion, budget, product (optional), customization notes, and preferred date. Name and phone come from the account and are never taken from the request body. | P0 |
| F-11 | Customer may upload one to three reference images. | P1 |
| F-12 | Form validates input (required fields, valid 10-digit phone number) and shows clear inline errors. | P0 |
| F-13 | On submit, the system creates an order with a unique Order ID and status "Received". | P0 |
| F-14 | Confirmation screen shows the Order ID and a summary, with a "Continue on WhatsApp" button that opens WhatsApp with the summary pre-filled. | P0 |
| F-15 | Customer can save the Order ID (copy button). | P1 |

### 7.3 Order tracking
| ID | Requirement | Priority |
|---|---|---|
| F-20 | Signed-in customer sees a My Orders list and can open only their own orders. | P0 |
| F-21 | The page shows a status timeline: Received → Confirmed → In Progress → Ready → Delivered (or Cancelled). | P0 |
| F-22 | The page shows the order summary and any note from the owner. | P1 |

### 7.4 Gift Builder
| ID | Requirement | Priority |
|---|---|---|
| F-30 | Step-by-step wizard with progress indicator: Occasion → Recipient → Budget → Theme → Colour. | P1 |
| F-31 | The system suggests a package by matching product tags and budget (rule-based, no AI required). | P1 |
| F-32 | A summary card ("Your Custom Creation") shows the items and an estimated price. | P1 |
| F-33 | Customer can edit choices, then send the package as an enquiry. | P1 |

### 7.5 Build-Your-Own Hamper
| ID | Requirement | Priority |
|---|---|---|
| F-40 | Customer picks a base hamper, then adds items, personalization and packaging. | P1 |
| F-41 | The running total updates instantly as items are added or removed. | P1 |
| F-42 | A final preview lists all selections with the total before submitting. | P1 |

### 7.6 Live customization preview
| ID | Requirement | Priority |
|---|---|---|
| F-50 | For customizable items (frames, cards), customer can edit name, text, font, colour and theme, and see a live visual preview. | P1 |
| F-51 | The chosen customization is saved with the order. | P1 |

### 7.7 Admin
| ID | Requirement | Priority |
|---|---|---|
| F-60 | Admin signs in through the same login as customers (account role: admin); all admin routes require a valid session and the admin role. | P0 |
| F-61 | Orders list with search and filters by status, date and occasion. | P0 |
| F-62 | Order detail view with all customer and customization data, and a status update control. | P0 |
| F-63 | Admin can add an internal note and a customer-visible note to an order. | P1 |
| F-64 | Admin can add, edit, hide and delete products, including image upload. | P0 |
| F-65 | Customers view lists customers with their order history. | P1 |
| F-66 | Admin can set the final agreed price on an order. | P1 |

### 7.8 Dashboard
| ID | Requirement | Priority |
|---|---|---|
| F-70 | Cards for orders today, pending orders, and total orders this month. | P0 |
| F-71 | Chart of monthly orders. | P1 |
| F-72 | Most requested occasions and popular products. | P1 |
| F-73 | Budget range distribution of customers. | P1 |

### 7.9 QR digital gift page
| ID | Requirement | Priority |
|---|---|---|
| F-80 | Admin can attach a personal message, photos, date and recipient name to an order. | P2 |
| F-81 | The system generates a unique QR code linking to a public gift page. | P2 |
| F-82 | The gift page is mobile-friendly, animated and needs no login. | P2 |
| F-83 | The link uses a random, unguessable token. | P2 |

## 8. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Responsiveness | Fully usable from 320px width upward; tested on Android Chrome and iOS Safari |
| Performance | Optimized images (Cloudinary transformations, WebP), code splitting, target load under 3 seconds on 4G |
| Accessibility | Sufficient colour contrast, keyboard navigation, labelled form fields, respects reduced-motion settings |
| Security | See Section 8.1 |
| Privacy | See Section 8.2 |
| Reliability | Graceful error messages, form data preserved on failure |
| Maintainability | Modular code, environment variables for secrets, README with setup steps |
| PWA | Web manifest, service worker for app shell caching, installable |

### 8.1 Security Requirements

| ID | Area | Requirement |
|---|---|---|
| S-01 | Passwords | Hashed with bcrypt (cost 12). Minimum 10 characters, maximum 72, must contain a letter and a digit. Plain passwords are never stored or logged. |
| S-02 | Sessions | Short-lived access token (15 minutes) and rotating refresh token (7 days), both in httpOnly, Secure, SameSite cookies so JavaScript cannot read them. Refresh tokens are stored hashed in the database. |
| S-03 | Token theft | If a used refresh token is presented again, all sessions of that user are revoked. Logout revokes the refresh token. |
| S-04 | Brute force | Login and signup are rate limited per IP. After 5 failed logins the account is locked for 15 minutes. Login errors are generic, and response time does not reveal whether an email exists. |
| S-05 | Authorization | Roles (customer, admin) are enforced on the server for every protected route. Role is never accepted from client input. Admin accounts are created only by a server-side script. |
| S-06 | Object-level access | Every order lookup is filtered by the signed-in user, so a customer cannot read another customer's order by guessing an ID. Order IDs are random, not sequential. |
| S-07 | Input validation | Every request body is validated against a strict schema (unknown fields rejected, lengths and types enforced). Request body size is capped at 10 KB. |
| S-08 | Injection | NoSQL operator injection blocked by schema validation, request sanitization and Mongoose `sanitizeFilter`. React escapes output by default; raw HTML is never rendered from user input. |
| S-09 | Transport and headers | HTTPS only. Helmet security headers, including a Content-Security-Policy, HSTS and no `X-Powered-By`. |
| S-10 | CORS and CSRF | CORS allows only the app's own origin. State-changing requests must carry a custom header and use SameSite cookies. Frontend and API are served from one site (API proxied under `/api`) so cookies stay first-party. |
| S-11 | Uploads | Images are uploaded through signed Cloudinary uploads, restricted to JPEG, PNG and WebP, with a size limit. Files are never executed or served from the API server. |
| S-12 | Secrets | All secrets in environment variables, validated at startup (the server refuses to boot with weak or missing secrets). `.env` is never committed. |
| S-13 | Errors and logging | Clients receive generic error messages, and stack traces are never sent. Server logs exclude passwords, tokens and full phone numbers. |
| S-14 | Dependencies | `npm audit` before each release, lockfile committed, Dependabot enabled. |
| S-15 | Database | MongoDB Atlas with IP allow-list, a least-privilege database user, encrypted connections and automated backups. |
| S-16 | Admin | Admin routes are rate limited, and admin actions on orders are recorded in the order's status history. Consider two-factor authentication for the admin account. |
| S-17 | Product prices | Prices and totals are calculated on the server from product data, never trusted from the client. |

### 8.2 Privacy Requirements

- Collect only name, email, mobile number, address (optional) and order details.
- Customer data is visible only to that customer and the admin. There is no public listing of customer data.
- Publish a short Privacy Policy and Terms page, and link it on the sign-up form with a consent checkbox. (India's DPDP Act 2023 requires clear consent and a way to erase data, so keep F-98 in mind for launch.)
- QR gift pages use unguessable tokens and contain only what the sender chose to include.

## 9. UI/UX Requirements

- **Mobile-first layout** with a bottom navigation bar (Home, Explore, Create, Track, More).
- **Visual style:** soft pastel palette (blush pink, cream, gold accent), elegant serif for headings, clean sans-serif for body text, generous spacing, rounded cards.
- **Motion:** page transitions, card entrance animations, tap feedback, animated progress in wizards, skeleton loaders. Animations stay short (under 400ms) and are disabled when the user prefers reduced motion.
- **Touch friendliness:** tap targets at least 44px, sticky primary action buttons on forms.
- **Empty and error states** for every list and form.
- **Admin UI:** simple, table-and-card based, usable on a phone.

## 10. Technical Architecture

**Frontend:** React + Vite, Tailwind CSS, Framer Motion, React Router, Recharts, a QR code library
**Backend:** Node.js + Express REST API
**Database:** MongoDB Atlas with Mongoose
**File storage:** Cloudinary
**Auth:** JWT (admin only)
**Hosting (suggested):** Vercel (frontend), Render (backend), MongoDB Atlas (database)

```
Customer phone/browser (PWA)
        │  HTTPS
        ▼
React frontend ──REST──► Express API ──► MongoDB
                              │
                              └──► Cloudinary (images)
Admin dashboard (same app, protected routes) ──JWT──► Express API
```

## 11. Data Model

**Product**
`_id, name, category, occasionTags[], themeTags[], colourTags[], basePrice, images[], description, isCustomizable, isActive, createdAt`

**Order**
`_id, orderId (random, e.g. FC-9F3A1C2B), user (ref),  occasion, budget, product (ref, optional), items[], customization {text, font, colour, theme, notes}, referenceImages[], preferredDate, estimatedPrice, finalPrice, status, internalNote, customerNote, statusHistory[{status, at}], createdAt`

**User** (customers and admin)
`_id, name, email (unique, lowercase), phone, passwordHash, role (customer | admin), emailVerified, failedLoginCount, lockUntil, createdAt`

**RefreshToken**
`_id, user (ref), tokenHash, expiresAt (auto-deleted), revokedAt, createdAt`

**GiftPage** (QR feature)
`_id, order (ref), token, recipientName, message, photos[], date, createdAt`

**Status values:** Received, Confirmed, In Progress, Ready, Delivered, Cancelled

## 12. API Endpoints (summary)

**Public**
| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/auth/register | Customer sign up |
| POST | /api/auth/login | Sign in |
| POST | /api/auth/refresh | Rotate session |
| POST | /api/auth/logout | Sign out |
| GET | /api/products | List products with filters |
| GET | /api/products/:id | Product detail |
| POST | /api/builder/suggest | Return a suggested package |
| GET | /api/gift/:token | Public QR gift page |

**Customer (sign-in required)**
| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/auth/me | Current profile |
| POST | /api/orders | Submit order or enquiry |
| GET | /api/orders/mine | My orders |
| GET | /api/orders/:orderId | One of my orders |

**Admin (JWT required)**
| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/admin/orders | List and filter orders (role: admin) |
| GET | /api/admin/orders/:id | Order detail |
| PATCH | /api/admin/orders/:id | Update status, notes, final price |
| POST/PUT/DELETE | /api/admin/products | Manage products |
| GET | /api/admin/customers | Customer list |
| GET | /api/admin/stats | Dashboard data |
| POST | /api/admin/orders/:id/gift | Create or update QR gift page |

## 13. Milestones

| Week | Deliverables |
|---|---|
| 1 | UI design, project setup, database models, product API, catalogue and product detail pages |
| 2 | Customer sign up / sign in, secure session handling, order flow (sign-in required), My Orders, admin role and order/product management |
| 3 | Gift Builder, Build-Your-Own Hamper, live preview, WhatsApp button |
| 4 | Dashboard charts, animation polish, PWA setup, deployment, real-device testing, optional QR page, documentation |

## 14. Acceptance Criteria (key)

1. A customer on a phone can browse products, filter by occasion and budget, and submit an enquiry, then receive an Order ID.
2. Submitted orders appear in the admin dashboard with all details.
3. The admin can change the order status, and the customer sees the update on the tracking page.
4. A signed-in customer cannot open another customer's order, even with a valid Order ID (returns 404).
4a. A visitor who is not signed in can browse everything but is asked to sign in or sign up when submitting an order, and returns to their selections afterward.
4b. The sixth wrong password attempt within 15 minutes locks the account temporarily.
4c. A request with an unknown field, an oversized body or a malformed value is rejected with a 400 error.
5. The hamper builder total is always the correct sum of the selected items.
6. The live preview reflects every change instantly.
7. Admin routes are inaccessible without a valid admin login, and a customer account cannot access them.
8. The app can be installed on a phone home screen and opens full-screen.
9. All pages work without horizontal scrolling on a 360px-wide screen.

## 15. Assumptions and Constraints

- Prices for customized products vary, so all builder totals are labelled "estimated".
- Some orders need direct communication, so WhatsApp is the main follow-up channel.
- Payment and delivery happen offline in Version 1.
- The owner supplies real product photos, prices and categories.
- A single admin account is sufficient.
- Email delivery (for verification and password reset) needs an email provider such as Resend, Brevo or Gmail SMTP.
- SMS OTP login is deliberately avoided in Version 1 because of SMS cost and Indian DLT registration overhead.

## 16. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Scope grows too large | Build in priority order; P0 must ship before any P1 work starts |
| Missing real content makes the demo weak | Collect photos and price list in week 1 |
| Heavy animations slow low-end phones | Use lightweight transitions, test on a real budget phone |
| Spam enquiries | Rate limiting and basic validation |
| Image storage limits | Compress uploads and limit file size |

## 17. Open Questions

1. Final list of occasion categories and product categories?
2. Does the owner want a single price list per product, or price ranges?
3. Which WhatsApp number should enquiries go to?
4. Is the brand palette or logo already defined?
5. Should the site be in English only, or also include Kannada/Hindi/Urdu?
6. Will the site use a custom domain? (Needed for HTTPS and clean cookie handling.)
7. Which email provider will send verification and reset emails?
8. Should Google sign-in be offered at launch?

## 18. Future Scope

Online payment (Razorpay/UPI), automated WhatsApp notifications, delivery tracking, order history enhancements, inventory management, downloadable sales reports, native mobile app.
