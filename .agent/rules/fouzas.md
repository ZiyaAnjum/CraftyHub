# Fouzas Creation Workspace Rules

- Follow docs/PRD.md. Build in priority order: P0, then P1, then P2.
- Do not weaken anything in PRD section 8.1 (security). Never remove validation, rate limiting, auth checks or cookie settings to make something work.
- Never read role, user, status or price from a request body.
- Never commit .env or hardcode secrets.
- Frontend: React + Vite + Tailwind + Framer Motion, mobile-first.
- Every API call uses credentials: 'include' and the header X-Requested-With: fouzas-web.
- Use getSafeNextPath from frontend/src/lib/safeNext.js for every post-login redirect. Do not write redirect checks inline.
- Only modify server/ for tasks I explicitly name.
