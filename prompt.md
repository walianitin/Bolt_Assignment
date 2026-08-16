# Bolt Assignment — Product & Architecture Brief
#PROMPT Structured as per follow 

## Overview

Full-stack OTP registration and checkout application. Users register once, receive a one-time code, and later identify themselves during checkout when their email matches a registered account. Checkout stores shipping details only — there is no payment flow.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL via Prisma |
| Auth model | Email + bcrypt-hashed 6-digit OTP (no passwords, no sessions) |

Monorepo layout: `client/` and `server/`, shared configuration via root `.env`.

---

## Architecture

### Data access

- Prisma singleton: `server/src/lib/db/index.ts` (Postgres driver adapter)
- Domain models only: `user.model.ts`, `checkout.model.ts`
- HTTP routes never import or call Prisma directly

### Models

**RegisteredUser**
- `email` (unique)
- `hashedOtp` (unique, bcrypt)
- `firstName`
- timestamps

**CheckoutForm**
- `email`, `phone`, `address`
- unique constraint on `(email, phone)` — duplicate checkout with the same pair is rejected

### API surface

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/register` | Validate → generate OTP → hash → persist user → email OTP → return masked success (OTP returned once in response; never stored as plaintext) |
| `POST` | `/api/verify-email` | `{ email }` → `{ registered: true \| false }` (lookup only; no OTP) |
| `POST` | `/api/login` | `{ email, otp }` → `bcrypt.compare` against stored hash |
| `POST` | `/api/checkout` | `{ email, phone, address }` → insert checkout row |

Rate limiting: in-memory token bucket keyed by **IP + email** on `/api/register` and `/api/login`.

---

## Frontend

Theme: light monochrome (white / grey / black) via shared CSS variables — no ad-hoc per-component color overrides.

Reusable building blocks: `Input`, `Button`, `Modal`, `FormField` (shadcn-backed, theme-driven).

### Routes

**`/register`**
1. Collect email, first name, last name and submit.
2. On success, show the 6-digit OTP once in a “save this code” card.
3. OTP is not re-fetchable from the UI; no auto-redirect — the user must acknowledge or copy it.

**`/checkout`**
1. Show form: email, phone, shipping address.
2. Validate email with regex as the user types (no network call yet).
3. When the email is well-formed, debounce a background `POST /api/verify-email` (non-blocking).
4. If registered: open an OTP modal over the form (overlay, not a route change).
5. Modal: OTP field, verify, and Skip (Skip closes the modal; form values stay intact).
6. Successful login: close modal, show name banner; form remains editable.
7. Failed OTP: inline modal error; modal stays open; form values preserved.
8. Place order is enabled only after a registered email is recognized.
9. Submit → `POST /api/checkout` (persist only; no payment).
10. Duplicate `(email, phone)` returns a clear conflict error to the user.

### State ownership (checkout)

| State | Owner | Notes |
| --- | --- | --- |
| `checkoutForm` | `/checkout` page | Survives modal open / close / skip |
| `loggedInUser` | `/checkout` page | Set only after OTP success; drives banner |
| `verifyEmail` status | `/checkout` page | `idle` / `loading` / `matched` / `no-match` — independent of form field validity |

---

## Design decisions worth discussing

- OTP is hashed at rest; plaintext exists only in the register response (and email) for demo usability.
- Email recognition (`verify-email`) is separated from authentication (`login`) so checkout can prompt for OTP without blocking other fields.
- Modal is an overlay so shipping state is never lost on skip or failed OTP.
- Model layer isolates Prisma so routes stay thin and testable.
- Token-bucket rate limits protect OTP endpoints without external Redis for this assignment scope.
