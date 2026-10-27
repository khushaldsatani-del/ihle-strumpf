# Tests

All tests use Node's built-in test runner (Node 22+), nothing extra to install.
Integration and load tests write orders, so they run **only against a test database**, never against
the live site or the shared Neon database (they refuse `onrender.com` / `vercel.app` addresses).

## Unit tests (no database)

```bash
node --test "tests/unit/*.test.mjs"
```

NAV XML reading (SKUs, translations, broken and malicious files), the order XML for NAV
(escaping, emoji, control characters), full article numbers and the shop search.

## Test database and test backend

A local PostgreSQL (here: PostgreSQL 18) with its own data folder, so production stays untouched:

```bash
initdb -D <folder> -U ihle -A trust -E UTF8
pg_ctl -D <folder> -o "-p 5433" start
psql -h 127.0.0.1 -p 5433 -U ihle -d postgres -c "CREATE DATABASE ihle_test"
```

`backend/.env.test` (ignored by git): `DATABASE_URL="postgres://ihle@127.0.0.1:5433/ihle_test"`, a `SESSION_SECRET`
and `PORT=5001`. Then, in `backend/`:

```bash
node --env-file=.env.test src/scripts/migrate.js
node --env-file=.env.test src/scripts/importFile.js <nav_ShopItems.xml> --apply
node --env-file=.env.test src/scripts/importFile.js <nav_ShopCustomers.xml> --apply
node --env-file=.env.test src/scripts/uploadPhotos.js "<photo folder>"
node --env-file=.env.test src/server.js
```

Shop and admin against it: `API_TARGET=http://localhost:5001 npx vite --port 5175` (in `frontend/`), same with
`--port 5176` in `admin/`.

## Integration and security tests

```bash
API_BASE=http://localhost:5001 ADMIN_USER=… ADMIN_PASSWORD=… CUSTOMER_NUMBER=… CUSTOMER_PASSWORD=… \
ITEMS_XML=<nav_ShopItems.xml> node --test tests/integration/api.test.mjs
```

Catalogue, login, sessions (forged cookies), server-side prices, orders, order XML, admin access, import preview,
and basic attacks (SQL-like input, path traversal, oversized/broken JSON, CORS, login lockout).

## Load and stress tests

```bash
API_BASE=http://localhost:5001 CUSTOMER_NUMBER=… CUSTOMER_PASSWORD=… node tests/load/load.mjs load
API_BASE=http://localhost:5001 CUSTOMER_NUMBER=… CUSTOMER_PASSWORD=… node tests/load/load.mjs stress catalogue,photo,placeOrder
```

`load`: each scenario 5 s with 20 simultaneous users. `stress`: 10 → 400 users until errors or p95 > 5 s.
