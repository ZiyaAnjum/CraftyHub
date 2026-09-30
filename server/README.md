# Fouzas Creation: secure API starter

Node + Express + MongoDB backend with customer accounts. Browsing is public; placing an order requires sign-in.

## Run
1. `npm install`
2. Copy `.env.example` to `.env` and fill it in (secret: 32+ random characters)
3. `ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='long-strong-password' npm run seed:admin`
4. `npm run dev`

## Frontend contract
- Send `credentials: 'include'` and the header `X-Requested-With: fouzas-web` on every API call.
- On a 401, call `POST /api/auth/refresh` once, then retry; if that fails, send the customer to sign in and return them to where they were.
- Serve the frontend and API from one site (for example, Vercel rewrite `/api/*` to the Render URL) so cookies stay first-party.

## Endpoints
Public: `POST /api/auth/register|login|refresh|logout`
Customer: `GET /api/auth/me`, `POST /api/orders`, `GET /api/orders/mine`, `GET /api/orders/:orderId`
Admin: `GET /api/admin/orders`, `PATCH /api/admin/orders/:orderId`

## Security in this code
Hashed passwords (bcrypt 12), httpOnly rotating session cookies with reuse detection, login lockout and rate limits, strict schema validation (unknown fields rejected), NoSQL injection protection, ownership checks on orders, role checks for admin, Helmet headers, strict CORS, CSRF header, body size limit, env validation at boot, generic errors.

## Still to add before launch
- Email verification and password reset (needs an email provider)
- Product routes and signed Cloudinary uploads
- HTTPS and a custom domain, MongoDB Atlas IP allow-list and least-privilege DB user
- Privacy Policy and Terms pages; run `npm run audit` before each release
