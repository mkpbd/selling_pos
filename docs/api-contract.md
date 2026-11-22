# Selling POS — API Contract v1 (Foundation: Auth, RBAC, Branches, Users)

Base URL: `/api/v1` (backend runs on `http://127.0.0.1:8080`; the Vite dev server proxies `/api` and `/sanctum`).
Live OpenAPI/Swagger UI (local env only): `http://127.0.0.1:8080/docs/api`.

## 1. Conventions

### Authentication
Two mechanisms, both resolved by the `auth:sanctum` guard:

| Client | Mechanism |
|---|---|
| React SPA (browser) | Sanctum **cookie session**. Call `GET /sanctum/csrf-cookie` first, then `POST /api/v1/auth/login`. Axios needs `withCredentials: true` and `withXSRFToken: true` (sends the `X-XSRF-TOKEN` header from the `XSRF-TOKEN` cookie). |
| API clients / Swagger / devices | **Bearer token** from `POST /api/v1/auth/tokens`. Send `Authorization: Bearer <token>`. |

Every request must send `Accept: application/json`.

### Branch context
Single company, multiple branches. Roles are assigned to a user **per branch**.
Send header `X-Branch-Id: <branch uuid>` on authenticated requests to choose the active branch.
If it's missing, the server uses the user's `default_branch_id`, then the first branch assigned to them.
A branch the user can't access → `403 BRANCH_ACCESS_DENIED`. Super admins can access every active branch.

### Response envelope

Success:
```json
{ "success": true, "data": { }, "message": "optional human message", "meta": { "request_id": "uuid" } }
```

Paginated success (`data` is an array):
```json
{
  "success": true,
  "data": [ ],
  "meta": {
    "request_id": "uuid",
    "pagination": { "page": 1, "per_page": 15, "total": 42, "last_page": 3 }
  }
}
```

Error:
```json
{
  "success": false,
  "error": { "code": "VALIDATION_FAILED", "message": "The given data was invalid.", "details": { "email": ["The email field is required."] } },
  "meta": { "request_id": "uuid" }
}
```

| HTTP | `error.code` examples |
|---|---|
| 400 | `BAD_REQUEST` |
| 401 | `UNAUTHENTICATED`, `INVALID_CREDENTIALS` |
| 403 | `FORBIDDEN`, `BRANCH_ACCESS_DENIED`, `ACCOUNT_INACTIVE` |
| 404 | `NOT_FOUND`, `BRANCH_NOT_FOUND`, `USER_NOT_FOUND`, `ROLE_NOT_FOUND` |
| 409 | `BRANCH_CODE_TAKEN`, `EMAIL_TAKEN`, `ROLE_NAME_TAKEN`, `SYSTEM_ROLE_IMMUTABLE`, `ROLE_IN_USE` |
| 419 | `CSRF_TOKEN_MISMATCH` (SPA must re-fetch `/sanctum/csrf-cookie`) |
| 422 | `VALIDATION_FAILED` (`details` = field → messages[]), `BUSINESS_RULE_VIOLATION` |
| 429 | `TOO_MANY_REQUESTS` |
| 500 | `INTERNAL_ERROR` |

Every response carries an `X-Request-Id` header.

### List query parameters
`page` (default 1), `per_page` (default 15, max 100), `search` (text), `sort` (field name; prefix with `-` for descending, e.g. `-created_at`), plus filters for each resource.

### Formats
IDs are UUID strings. Timestamps are ISO-8601 UTC strings (`2026-11-22T08:00:00+00:00`) or `null`.

## 2. Auth — `/api/v1/auth`

| Method | Path | Auth | Body | Response `data` |
|---|---|---|---|---|
| POST | `/auth/login` | guest (SPA, throttled 5/min) | `{ email, password, remember?: bool }` | `Me` |
| POST | `/auth/tokens` | guest (throttled 5/min) | `{ email, password, device_name }` | `{ token, token_type: "Bearer", expires_at, user: Me }` |
| POST | `/auth/logout` | auth | – | `null` (session invalidated, or the current token revoked) |
| GET | `/auth/me` | auth | – | `Me` (permissions for the active branch) |
| POST | `/auth/forgot-password` | guest (throttled) | `{ email }` | `null` + generic message (never reveals whether the email exists) |
| POST | `/auth/reset-password` | guest (throttled) | `{ token, email, password, password_confirmation }` | `null` |
| PUT | `/auth/password` | auth | `{ current_password, password, password_confirmation }` | `null` |

The password-reset email links to `{FRONTEND_URL}/reset-password?token=...&email=...`.
Password rules: at least 8 characters, mixed case, at least one number and one symbol.

`Me`:
```json
{
  "id": "uuid", "name": "Jane Admin", "email": "jane@example.com",
  "is_active": true, "is_super_admin": false,
  "default_branch_id": "uuid|null", "last_login_at": "iso|null",
  "current_branch": { "id": "uuid", "code": "HQ", "name": "Head Office" } ,
  "branches": [ { "id": "uuid", "code": "HQ", "name": "Head Office" } ],
  "roles": ["manager"],
  "permissions": ["dashboard.view", "users.view"]
}
```
`current_branch` may be `null`. For super admins, `permissions` holds every permission.

## 3. Permissions (defined in code)

| Group | Permission names |
|---|---|
| dashboard | `dashboard.view` |
| branches | `branches.view`, `branches.create`, `branches.update` |
| users | `users.view`, `users.create`, `users.update` |
| roles | `roles.view`, `roles.manage` |

Seeded system roles (`is_system: true`, can't be renamed or deleted; their permissions can still be edited):
- `admin`: all permissions
- `manager`: dashboard.view, branches.view, users.view, users.create, users.update, roles.view
- `cashier`: dashboard.view

## 4. Branches — `/api/v1/branches`

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/branches` | `branches.view` | filters: `search` (code/name/phone/email), `is_active` (true/false); sort: `code,name,created_at` |
| POST | `/branches` | `branches.create` | body `BranchInput` → 201 `Branch` |
| GET | `/branches/{id}` | `branches.view` | `Branch` |
| PUT | `/branches/{id}` | `branches.update` | body `BranchInput` → `Branch` |

No delete. Set `is_active: false` to deactivate a branch.

`BranchInput`: `{ code: string (2–20 chars, A-Z0-9-, unique, stored uppercase), name: string ≤150, phone?: string ≤30|null, email?: email|null, address?: string ≤500|null, is_active?: bool (default true) }`

`Branch`: `{ id, code, name, phone, email, address, is_active, users_count?: int, created_at, updated_at }`

## 5. Users — `/api/v1/users`

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/users` | `users.view` | filters: `search` (name/email), `is_active`, `branch_id`; sort: `name,email,created_at,last_login_at`. Users who aren't super admins only see users assigned to their active branch. |
| POST | `/users` | `users.create` | body `UserCreateInput` → 201 `User` |
| GET | `/users/{id}` | `users.view` | `User` |
| PUT | `/users/{id}` | `users.update` | body `UserUpdateInput` → `User` |

No delete. Set `is_active: false` to deactivate a user; this also revokes their tokens.

`UserCreateInput`:
```json
{
  "name": "string ≤150", "email": "unique email", "password": "string", "password_confirmation": "string",
  "is_active": true, "default_branch_id": "uuid|null",
  "branch_roles": [ { "branch_id": "uuid", "roles": ["cashier"] } ]
}
```
`UserUpdateInput`: same fields, but `password` and `password_confirmation` are optional (leave them out to keep the current password).
Rules: `default_branch_id` must be one of the branches in `branch_roles`. A user can only assign branches they can access themselves.

`User`:
```json
{
  "id": "uuid", "name": "...", "email": "...", "is_active": true, "is_super_admin": false,
  "default_branch_id": "uuid|null", "last_login_at": "iso|null", "created_at": "iso", "updated_at": "iso",
  "branches": [ { "id": "uuid", "code": "HQ", "name": "Head Office", "roles": ["cashier"] } ]
}
```

## 6. Roles & Permissions — `/api/v1/roles`, `/api/v1/permissions`

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/permissions` | `roles.view` | `data`: `[ { "group": "users", "permissions": [ { "name": "users.view", "label": "View users" } ] } ]` |
| GET | `/roles` | `roles.view` | not paginated; `data`: `Role[]` |
| POST | `/roles` | `roles.manage` | `{ name: string (lowercase, a-z0-9_-), permissions: string[] }` → 201 `Role` |
| GET | `/roles/{id}` | `roles.view` | `Role` |
| PUT | `/roles/{id}` | `roles.manage` | `{ name, permissions }`. A system role's name can't change. |
| DELETE | `/roles/{id}` | `roles.manage` | 409 `SYSTEM_ROLE_IMMUTABLE` or `ROLE_IN_USE` |

`Role`: `{ id: number, name, is_system: bool, permissions: string[], users_count: int, created_at, updated_at }`

## 7. System

| Method | Path | Auth | Response |
|---|---|---|---|
| GET | `/api/v1/health` | public | `{ status: "ok"|"degraded", checks: { database: "ok"|"fail" }, time }` (503 when degraded) |
| GET | `/sanctum/csrf-cookie` | public | 204, sets the `XSRF-TOKEN` cookie |
