# RentDesk — Multi-Tenant Property Management System

> **⚠️ Vibe-coded practice project.** This system was built almost entirely
> through AI-assisted ("vibe coding") prompts rather than hand-written,
> line-by-line engineering. It exists as a **DevSecOps training ground**: a
> realistic app to practice *finding and fixing the security issues that
> vibe-coded software tends to ship with* — broken authorization, insecure
> defaults, missing input validation, secrets handling, dependency risk, and
> so on. Treat every part of it as something to audit, not something to
> trust by default. Do not deploy this as-is to handle real tenant/PII/payment
> data without a full security review.

## What it is

A Laravel REST API backing a property-management platform with three roles:

- **Admin** — platform-wide visibility, suspends/activates owners, sees analytics across every tenant of the platform.
- **Owner** (landlord) — manages their own properties, units, tenants, payments, maintenance requests, and messaging. Fully isolated from other owners' data.
- **Tenant** — sees only their own unit, payments, maintenance requests, and messages.

Two front ends talk to the same API:

- [`public/js/app.js`](public/js/app.js) + [`public/css/app.css`](public/css/app.css) — a zero-build vanilla JS SPA served directly by Laravel at `/`.
- [`frontend/`](frontend/) — a separate Vite + React app, useful for comparing the same feature set built with a different stack.

## Architecture notes (a.k.a. what to go audit)

- **Multi-tenancy**: row-level isolation via an `owner_id` column + an Eloquent global scope (`OwnerScope`), not schema-per-tenant. Worth checking: does *every* query path actually apply the scope? Are there any raw queries or `withoutGlobalScope` calls that leak data across owners?
- **AuthN**: Laravel Sanctum. Browser clients get an **HttpOnly session cookie** (CSRF-protected); no bearer token ever touches JavaScript. API clients can still use Sanctum personal access tokens.
- **AuthZ**: Laravel Policies per model (`app/Policies/`), gating create/view/update/delete per role.
- **CORS**: intentionally unconfigured — the React dev server proxies `/api` and `/sanctum` to Laravel so the browser is always same-origin. If you add a real cross-origin frontend, that's the point to review CORS/cookie/`SameSite` settings properly.
- **Suspension enforcement**: `EnsureActive` middleware blocks suspended owners mid-session, not just at login — check whether that's actually wired into every guarded route.

This is a non-exhaustive list — a big part of the exercise is finding what's *not* on it.

## Running it

**Backend (Laravel API):**
```
composer install
cp .env.example .env   # then set DB + APP_KEY as usual
php artisan migrate --seed
php artisan serve --port=8000
```

**Seeded accounts** (password: `password`):

| Role   | Email                |
|--------|-----------------------|
| Admin  | admin@example.com     |
| Owner  | owner@example.com     |
| Tenant | tenant@example.com    |

**Vanilla JS UI**: visit `http://localhost:8000/` once the backend is running.

**React UI** (optional, separate process):
```
cd frontend
npm install
npm run dev   # http://localhost:5173, proxies API calls to :8000
```

Full route list: `php artisan route:list --path=api`

## License

MIT (inherited from the Laravel starter this project was scaffolded from).
