# Design

## Context

See `proposal.md` for motivation and scope. AutoGo currently uses an Express 5 backend (`server/index.js`) with Node's built-in `node:sqlite` (`server/db.js`), a single-file React 19 + Vite frontend (`src/main.jsx`, `src/styles.css`), and 5 unit tests (`tests/`).

Key technical constraints discovered in the codebase:
- Sessions live in an in-memory `Map` (`server/index.js`), so any server restart logs out all users, and `config.sessionSecret` is unused.
- `location` filtering uses exact equality (`location = ?`), and `datetime-local` strings are compared directly in SQLite.
- Admins have no seeded account out of the box, `/api/vehicles` hides disabled vehicles even from admins, inventory blocks cannot be listed or removed, and prices are prompted/entered in cents.
- The frontend is hardcoded in a single component (`src/main.jsx`) in English, even though the base currency defaults to `MXN` and the domain cities are Mexican (`Monterrey`, `Guadalajara`).

## Goals / Non-Goals

**Goals:**
- Provide a clean, bilingual (`es` / `en`) UI with persisted language preference and localized API error codes.
- Make vehicle discovery, date selection, price calculation, reservation modification, and cancellation preview intuitive and safe from accidental clicks.
- Give administrators complete fleet, pricing, inventory-block, and reservation-monitoring controls in human-readable currency units.
- Persist sessions in SQLite and allow deterministic local admin bootstrapping without sacrificing security.
- Add end-to-end HTTP integration tests covering all critical user and admin workflows.

**Non-Goals:**
- Integrating a real external payment gateway (keep the `processImmediatePayment` provider abstraction with mock/configurable behavior).
- Multi-currency conversion or regional tax calculation (display and calculate in the configured base currency `MXN`).
- Multi-language database translation for user-entered vehicle descriptions (translate UI chrome, categories/statuses, validation, and API error messages via structured codes).

## Decisions

### 1. Bilingual i18n via Lightweight Dictionary + Structured API Error Codes
- **Decision**: Implement a lightweight React context/hook (`src/i18n.js`) with complete `es` and `en` translation dictionaries persisted in `localStorage` (defaulting to `es` or browser preference), paired with optional `code` fields on JSON error responses from Express (e.g. `{ error: "...", code: "VEHICLE_UNAVAILABLE" }`) so the UI renders localized messages while preserving readable `error` strings for API clients and tests.
- **Alternative**: Installing `i18next` or `react-intl`. Rejected to keep dependencies minimal and zero-bloat for a focused app.

### 2. SQLite-Backed Sessions with Signed/Random Tokens
- **Decision**: Add a `sessions` table (`id`, `user_id`, `expires_at`, `created_at`) in `server/db.js` and validate session cookies against SQLite with expiration cleanup, optionally signing the session token with HMAC-SHA256 using `config.sessionSecret`.
- **Alternative**: Stateless JWTs. Rejected because explicit server-side logout (`POST /api/auth/logout`) and immediate session invalidation are simpler and safer with a SQLite `sessions` table.

### 3. Modular Frontend Components and Non-Destructive Modals
- **Decision**: Split `src/main.jsx` into focused modules (`src/App.jsx`, `src/i18n.js`, `src/format.js`, `src/components/SearchCatalog.jsx`, `src/components/VehicleModal.jsx`, `src/components/ReservationsView.jsx`, `src/components/AdminPanel.jsx`, `src/components/AuthView.jsx`).
- **UX rules**:
  - Default pickup/return dates on initial load (next day 10:00 to +2 days 10:00) plus quick duration presets (`1d`, `3d`, `7d`), while allowing users to clear or adjust dates inside both search and the vehicle detail modal.
  - Keep the reservation modal open when `immediate` payment fails (`402`), displaying an inline recovery banner with buttons to retry payment or switch to `pickup`.
  - Add a dedicated cancellation confirmation modal populated by `GET /api/reservations/:id/cancel-preview` (or computed from `policy_snapshot`) showing exact refund eligibility before sending `POST /api/reservations/:id/cancel`.

### 4. Expanded Admin Endpoints and Pesos-to-Cents Conversion
- **Decision**: Keep database storage in integer `daily_price_cents` and `total_cents` to avoid floating-point rounding bugs, while accepting/displaying decimal/whole currency units (`MXN`) in the UI (`Math.round(Number(pesos) * 100)`).
- **New/updated endpoints**:
  - `GET /api/locations`: returns distinct active vehicle locations for search suggestions.
  - `GET /api/admin/vehicles`: returns all vehicles (`active = 1` and `active = 0`) so admins can restore disabled vehicles.
  - `GET /api/admin/blocks` and `DELETE /api/admin/blocks/:id`: list and remove inventory blocks; `POST /api/admin/vehicles/:id/blocks` returns any overlapping active reservations count as a non-blocking warning (`overlappingReservations`).
  - `GET /api/reservations/:id/cancellation-preview`: returns calculated `refundCents`, `tier` (`free`, `partial`, `pickup_pending`), and `policy` snapshot for confirmation UI.

### 5. Local Admin Bootstrap & Unified Dev Script
- **Decision**: Support `AUTOGO_ADMIN_EMAIL` / `AUTOGO_ADMIN_PASSWORD` (with sensible local dev defaults only when `NODE_ENV !== "production"` and no admin exists yet) inside `migrate()` / server startup so developers can immediately test the admin panel without manual SQLite edits, documented in UI/README or sign-in hint in dev mode.
- **Dev workflow**: Add an `npm run dev:all` (or Node launcher script) that runs Express (`3001`) and Vite (`5173`) concurrently in one terminal, plus clean Vite proxy handling.

## Risks / Trade-offs

- **Existing API consumers expecting English `error` strings** → Keep the `error` string in JSON responses and add a `code` + optional `details` field so existing tests/clients continue working while the UI translates via `code`.
- **SQLite `sessions` table growth** → Delete expired sessions on lookup/startup (`expires_at < datetime('now')`).
- **Date string comparisons in SQLite** → Normalize `datetime-local` values consistently (`YYYY-MM-DDTHH:MM` / ISO without timezone drift) when validating and storing `start_at` and `end_at`.
- **Dev default admin credentials** → Only seed default demo admin when `NODE_ENV !== "production"` and `users` has zero admin accounts; in production require explicit env vars or manual provisioning.
