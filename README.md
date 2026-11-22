# Selling POS

Enterprise point-of-sale platform for a single company with multiple branches.

| Layer | Stack |
|---|---|
| Backend | PHP 8.3 · Laravel 13 (API only) · PostgreSQL 18 · Sanctum · spatie/laravel-permission · Scramble (OpenAPI) · Pest |
| Frontend | React 19 · TypeScript · Vite · Tailwind CSS v4 · shadcn/ui · TanStack Query · React Hook Form + Zod · Motion |
| Architecture | Modular monolith · Clean Architecture · DDD · Result pattern |

```
Selling_pos/
├── backend/    Laravel API  (http://127.0.0.1:8080)
├── frontend/   React SPA    (http://localhost:5173, proxies /api and /sanctum)
└── docs/       API contract
```

## Quick start (Windows, native PostgreSQL)

**Backend**
```bash
cd backend
composer install
cp .env.example .env            # then set DB_PASSWORD and SEED_ADMIN_PASSWORD
php artisan key:generate
php artisan migrate --seed      # permissions, system roles, HQ branch, super admin
php artisan serve --port=8080   # http://127.0.0.1:8080 (8000-8002 are reserved by Windows on this machine)
```
Tests use the `selling_pos_test` database (configured in `backend/.env.testing`): `./vendor/bin/pest`

**Frontend**
```bash
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

Sign in with the `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` values from `backend/.env`. Change that password right after the first login.

**API docs (Swagger):** http://127.0.0.1:8080/docs/api (local env only) · contract: [docs/api-contract.md](docs/api-contract.md)

## Backend architecture

```
app/
├── Shared/                       Shared kernel
│   ├── Domain/                   Result<T>, Error, AggregateRoot, DomainEvent, PermissionEnum, Money/Quantity/Percentage
│   ├── Application/              TransactionManager, EventDispatcher, PageRequest/PageResult, Actor, BranchContext, PermissionRegistry
│   ├── Infrastructure/           DB transaction manager, event dispatcher, audit listener, ModuleServiceProvider
│   └── Presentation/             ApiResponse envelope, exception renderer, request-id / security-header / idempotency middleware
└── Modules/
    ├── Organization/             Branches
    ├── Identity/                 Users, credentials, sessions/tokens, branch membership, branch context
    ├── Authorization/            Permission catalog, roles, per-branch role assignment
    ├── Products/                 Products, categories, units → publishes ProductChanged / UnitChanged
    └── Inventory/                Per-branch stock, append-only movement ledger, local product projection
```

**Event-driven integration:** Inventory never reads the Products tables. It keeps an `inventory_products` projection that's updated from `ProductChanged`/`UnitChanged` after each commit. Rebuild it with `php artisan inventory:sync-catalog`.

**Money and quantities** are integer minor units in the domain (no floats), `numeric` in Postgres, and decimal strings in the API (`"45.00"`, `"12.000"`).

### Operational commands

| Command | When |
| --- | --- |
| `php artisan authorization:sync` | Every deploy. Syncs the permission catalog and grants newly introduced permissions to system roles. |
| `php artisan inventory:sync-catalog` | After restoring data, or if a projection update failed |
| `php artisan schedule:work` (dev) / cron `schedule:run` | Runs `idempotency:prune` daily |

Each module has the same layout:
`Domain/` (aggregates, value objects, repository interfaces, events, errors, permissions) →
`Application/` (command handlers, queries/read models, ports, published contracts) →
`Infrastructure/` (Eloquent models/repositories, adapters, migrations, factories) →
`Presentation/` (controllers, form requests, resources, middleware, `routes.php`) →
`{Module}ServiceProvider.php` (bindings + auto-loaded routes/migrations under `/api/v1`).

**Rules**
- Domain and Application don't depend on Laravel. Expected failures come back as `Result::failure(Error)`; exceptions mean a real technical fault.
- Modules talk only through published contracts (`Organization\Application\Contracts\BranchDirectory`, `Authorization\Application\Contracts\AccessControl`), never through each other's tables.
- Writes go through aggregates + repositories inside a transaction. Reads use query services that return read models (CQRS-lite).
- Domain events are dispatched after commit and written to the structured `storage/logs/audit-*.log`.
- Each module declares its own permission enum and registers it with the `PermissionRegistry`. `php artisan authorization:sync` aligns the database (run it on every deploy).

## Security model
- **Auth:** Sanctum cookie session for the SPA (CSRF protected) and bearer tokens for devices/integrations (`SANCTUM_TOKEN_EXPIRATION`, in minutes). Login is throttled (5/min per email+IP, 20/min per IP). Login timing doesn't reveal which accounts exist.
- **RBAC per branch:** roles are global definitions, and a user holds roles **per branch** (spatie teams = branches). `X-Branch-Id` selects the active branch, and every `can:` check is evaluated in that branch.
- **No privilege escalation:** a non-super-admin can only grant roles whose permissions they already hold in that branch. They can't modify super admins or users who have more privileges than they do, and they can't deactivate themselves.
- Deactivating a user, resetting their password, or changing it revokes their tokens and sessions.
- **Stock integrity:** adjustments take a row lock (`SELECT … FOR UPDATE`), stock can't go negative (domain rule plus a DB check constraint), and a DB trigger blocks any UPDATE or DELETE on `inventory_movements`. `POST /inventory/adjustments` honours `Idempotency-Key`, so retries replay the original result instead of applying it twice.
- Responses use the standard error envelope, `X-Request-Id` correlation, and security headers. Passwords and tokens never appear in logs or events.
