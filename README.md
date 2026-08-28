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
SQLite → data/clientregit.db
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

## Default Admin

After running the seed script:

```bash
npm run seed
```

- Email: `******************`
- Password: `********`

Change credentials via environment variables in `server/.env` before seeding.

## Database Backup

```bash
npm run backup
```

Creates `backups/clientregit-YYYY-MM-DD.db`. Restore by copying a backup file over `data/clientregit.db` while the server is stopped.



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

Designed for future deployment to Hostinger (Node.js + SQLite supported plans). No Vercel, Supabase, MongoDB, Render, or any paid cloud service is required.
