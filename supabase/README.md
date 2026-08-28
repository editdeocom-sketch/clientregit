# Supabase (HISTORICAL — ARCHIVED)

> **STATUS: ARCHIVED / HISTORICAL ONLY. Do not use for new work.**

This directory contains SQL migration files from an earlier, abandoned
Supabase/PostgreSQL backend for ClientRegit.

ClientRegit now runs **fully local-first on SQLite (sql.js) + Express**.
There is **no** runtime dependency on Supabase, PostgreSQL, or any cloud
service. The active database layer lives in `server/database/database.js`
and all schema is created there via `initializeDatabase()`.

These `.sql` files exist for historical reference only:
- `schema.sql` — old PostgreSQL/Supabase schema (auth.users, RLS, UUIDs)
- `add-*.sql`, `fix-*.sql` — point-in-time Supabase migration patches
- `seed.sql`, `clear-demo-data.sql` — old Supabase seed/migration scripts
- `add-avatar-bucket.sql` — old Supabase Storage bucket setup

None of these are executed by the application. They are kept solely to
preserve project history. If you are sure you will never need them again,
you may safely delete this directory.
