# ClientRegit

Client management platform for video editors and creative professionals. Fully local-first — no cloud services required.

## Technology

- **Frontend**: React 18, Vite, Tailwind CSS, React Router, shadcn/ui components
- **Backend**: Node.js, Express.js
- **Database**: SQLite (via sql.js)
- **Authentication**: JWT + bcrypt

## Architecture

```
React (Vite)
    ↓
REST API (/api)
    ↓
Express.js
    ↓
SQLite → data/clientregit
```

## Installation

```bash
git clone <repo>
cd clientregit
npm install          # root deps (concurrently)
npm run install:all  # client + server deps
```

## Running Locally

```bash
npm run dev
```

This starts both servers concurrently:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

Or run them separately:

```bash
# Frontend only
cd client && npm run dev

# Backend only
cd server && npm run dev
```

The SQLite database (`data/clientregit.db`) is created automatically on first startup — no manual database setup needed.

## Creating the Admin Account

Run the seed command and provide your own administrator credentials through
`server/.env`:

```bash
npm run seed
```

Set your admin email (required) and, optionally, a strong password:

```
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=
```

- If `ADMIN_PASSWORD` is left empty, a strong **random** password is
  generated, printed **once** to the terminal, and must be changed after
  first login.
- If you provide `ADMIN_PASSWORD`, it must be at least **12 characters**
  and not a known default value.
- **No default password is ever created.** There is no hard-coded admin
  credential in the project.

## Database Backup

```bash
npm run backup
```

Creates a timestamped copy in `backups/`, e.g.
`backups/clientregit-2026-08-28T06-41-19-100Z.db`.

A rolling `data/clientregit.db.previous` copy of the previous good database
is also kept automatically for recovery.

**Restore:** stop the server, then copy a backup file over
`data/clientregit.db` and restart. The server is stopped during restore to
avoid writing to or overwriting the live database.

## Environment Variables

**server/.env** (copy from `server/.env.example`):

```
PORT=5000
JWT_SECRET=<long random string, see below>
CLIENT_URL=http://localhost:5173
NODE_ENV=development
ADMIN_NAME=Admin
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=
```

Never commit the real `.env` file or any real secrets.

Generate a strong `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

`JWT_SECRET` is validated at startup and must be at least 16 characters.

## API Endpoints

All protected endpoints require header: `Authorization: Bearer <token>`

### Health
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | /api/health | No |

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |
| PUT | /api/auth/profile | Update profile |
| PUT | /api/auth/change-password | Change password |

### Clients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/clients | List (search, status, page, limit) |
| POST | /api/clients | Create |
| GET/PUT/DELETE | /api/clients/:id | Read / Update / Delete |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | List (search, status, client, priority, pagination) |
| POST | /api/projects | Create |
| GET/PUT/DELETE | /api/projects/:id | Read / Update / Delete |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tasks | List (status, project filters) |
| POST | /api/tasks | Create |
| PUT/DELETE | /api/tasks/:id | Update / Delete |

### Videos
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/videos | List |
| POST | /api/videos | Create (auto versioning) |
| PUT | /api/videos/:id/status | Approve / request revision |
| GET | /api/videos/:id/comments | Timestamped comments |
| POST | /api/videos/:id/comments | Add comment |
| DELETE | /api/videos/:id | Delete |

### Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/invoices | List |
| POST | /api/invoices | Create (auto invoice number) |
| PUT/DELETE | /api/invoices/:id | Update / Delete |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/payments | List payments |
| POST | /api/payments | Record a payment (client/project totals recalculated) |
| GET/PUT/DELETE | /api/payments/:id | Read / Update / Delete |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard/stats | Editor statistics + recent activity |
| GET | /api/dashboard/client | Client portal dashboard |

## Authentication Flow

1. Login via `POST /api/auth/login` → server validates bcrypt hash → returns JWT (30-day expiry)
2. Frontend stores token in localStorage
3. Every protected request sends `Authorization: Bearer <token>`
4. Express middleware verifies JWT and loads the user from SQLite
5. Invalid/expired tokens return 401; frontend clears storage and redirects to `/login`

## Production Build

```bash
cd client && npm run build   # outputs to client/dist
cd server && npm start       # NODE_ENV=production serves client/dist
```

With `NODE_ENV=production`, Express serves the built React app from `client/dist` alongside the API on one port.

## Troubleshooting

- **Port already in use** — stop other node processes or change PORT in `server/.env`
- **401 after restart** — JWT_SECRET changed or expired token; log out and back in
- **CORS errors** — ensure CLIENT_URL matches the frontend URL exactly
- **Data loss after edits** — never delete `data/clientregit.db` while the server is running; use backups

## Deployment Notes

The application is portable and may work on a Hostinger plan that supports a
persistent Node.js process and SQLite filesystem. Confirm those capabilities
with the exact plan before deployment. No Vercel, Supabase, MongoDB, Render,
or any paid cloud service is required.

## Billing & Monetization

ClientRegit includes a complete global billing system with Free, Pro, and Lifetime plans.

### Plans

| Plan | Price (INR) | Storage | Limits |
|------|------------|---------|--------|
| Free | ₹0 | 1 GB | 3 clients, 10 projects, 10 tasks, 3 invoices/mo, 5 video uploads/mo |
| Pro Monthly | ₹599/mo | 15 GB | Unlimited (except storage) |
| Pro Quarterly | ₹999/3mo | 15 GB | Unlimited (except storage) |
| Pro Yearly | ₹2,999/yr | 15 GB | Unlimited (except storage) |
| Lifetime | ₹10,999 one-time | 50 GB | Unlimited (except storage) |

### International Pricing

Localized prices for 14 currencies: INR, USD, GBP, EUR, AED, AUD, CAD, SGD, NZD, JPY, KRW, SAR, BRL, MXN. Prices are server-side configured (not live exchange rate conversions).

### Currency Detection Priority

1. Logged-in user's saved currency
2. Manual selection on pricing page
3. Country detection from user preferences
4. Browser locale
5. USD fallback

### Razorpay Integration

Set up in `server/.env`:

```
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Recurring subscription plan IDs (created in Razorpay Dashboard)
RAZORPAY_PLAN_ID_INR_MONTHLY=plan_...
RAZORPAY_PLAN_ID_INR_QUARTERLY=plan_...
RAZORPAY_PLAN_ID_INR_YEARLY=plan_...
```

- **Lifetime** uses Razorpay one-time Order (not subscription)
- **Monthly/Quarterly/Yearly** use Razorpay Subscriptions
- Webhook URL: `POST /api/billing/webhook/razorpay`
- Without Razorpay configured, the app works perfectly — Free plan is always available

### Billing API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/billing/plans | No | List plans + currencies |
| GET | /api/billing/subscription | Yes | Current subscription + entitlements |
| GET | /api/billing/usage | Yes | Resource usage |
| GET | /api/billing/payments | Yes | Payment history |
| POST | /api/billing/create-order | Yes | Create Razorpay order (lifetime) |
| POST | /api/billing/create-subscription | Yes | Create Razorpay subscription (recurring) |
| POST | /api/billing/verify-payment | Yes | Verify lifetime payment signature |
| POST | /api/billing/verify-subscription | Yes | Verify subscription payment |
| POST | /api/billing/subscription/:id/cancel | Yes | Cancel subscription at period end |
| POST | /api/billing/webhook/razorpay | No | Razorpay webhook (HMAC verified) |

### Security

- All prices determined server-side (never trust frontend)
- HMAC-SHA256 webhook verification with timing-safe comparison
- Idempotent webhook processing (no duplicate activations)
- All billing queries scoped to authenticated user
- Free plan always functional without payment configuration
- Client invoice payments are separate from subscription billing
