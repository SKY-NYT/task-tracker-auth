# Authentication & Authorization

## New files

| File | Purpose |
|---|---|
| `middleware/protect.js` | Verifies the JWT on incoming requests and attaches `req.user`. |
| `middleware/requireRole.js` | Role gate — restricts a route to a given set of roles. |
| `middleware/rateLimiter.js` | Rate limits `/auth/register` and `/auth/login` independently. |
| `utils/tokenUtils.js` | Signs JWTs (`{ id, role }` payload, `JWT_EXPIRES_IN` expiry). |

## Modified files

- `models/userModel.js` — added `password` (bcrypt-hashed, `select: false`) and `role` (`user`/`admin`, defaults to `user`).
- `models/taskModel.js` — added `userId` (ref to `User`, required).
- `controllers/authController.js` — `register`, `login`, `getUsers` (admin-only).
- `controllers/taskController.js` — all task operations now scope by ownership (or bypass scoping for admins).
- `routes/authRoutes.js`, `routes/taskRoutes.js` — wired the new middleware and controller behavior into routes.
- `app.js` — mounts auth routes at `/auth`, tasks at `/api/tasks`.

## Authentication flow

1. **Register** (`POST /auth/register`): validates `name`/`email`/`password`, rejects duplicate emails (409), hashes the password via a Mongoose `pre("save")` hook (bcrypt, 10 salt rounds), and returns a JWT + public user fields. Any `role` field in the request body is ignored — every new user is created with `role: "user"` regardless of what's submitted, so registration can't be used to self-grant admin.
2. **Login** (`POST /auth/login`): looks up the user by email (password is normally excluded via `select: false`, explicitly re-selected here), compares the submitted password against the stored hash with `bcrypt.compare`, and returns a fresh JWT on success. Invalid email and invalid password return the same generic 401 message, so the endpoint doesn't reveal which one was wrong.
3. **Token issuance**: `generateToken(id, role)` signs `{ id, role }` with `JWT_SECRET`, expiring after `JWT_EXPIRES_IN` (e.g. `1h`).

## JWT verification flow (`middleware/protect.js`)

1. Reads `Authorization: Bearer <token>`. Missing/malformed header → 401.
2. `jwt.verify(token, JWT_SECRET)` — throws `JsonWebTokenError` (bad signature/shape) or `TokenExpiredError` (past `exp`), both caught by the central `errorHandler` and turned into 401s with a clear message.
3. Loads the user by the decoded `id`. If the user no longer exists (e.g. deleted after the token was issued), 401.
4. Attaches the full Mongoose user document to `req.user` and calls `next()`.

## Authorization flow

- **Route-level RBAC** (`middleware/requireRole.js`): `requireRole("admin")` on `GET /auth/users` rejects any non-admin `req.user.role` with 403. This is a coarse allow/deny gate independent of any specific resource.
- **Resource-level ownership** (`controllers/taskController.js`): every task operation checks the resource, not just the role.
  - `GET /api/tasks` (list): filtered by `userId: req.user._id` for regular users; unfiltered for admins (`buildOwnerFilter`).
  - `GET/PUT/DELETE /api/tasks/:id`: the task is fetched by ID, then `isOwnerOrAdmin(user, task)` decides access. If the task doesn't exist **or** belongs to someone else and the requester isn't an admin, the response is **404 "Task not found"** in both cases — a non-owner gets no signal about whether the ID exists at all, only whether they're allowed to see it. This is a deliberate choice to avoid leaking resource existence to unauthorized users (an IDOR/enumeration concern), at the cost of making "wrong ID" and "wrong permissions" indistinguishable from the outside.
  - `POST /api/tasks`: `userId` is always set from `req.user._id`, never from the request body — a user cannot create a task on someone else's behalf.

## Rate limiting (`middleware/rateLimiter.js`)

`/auth/register` and `/auth/login` use **separate** limiter instances, each keyed by client IP, so traffic on one endpoint never consumes the other's budget:

- `registerLimiter`: 20 requests / 15 minutes — generous, since registration abuse is a volume/spam problem, not a guessing problem.
- `loginLimiter`: 5 requests / 15 minutes — tight, since login is where credential-stuffing/brute-force attempts land.

Exceeding either limit returns `429` with `{ "status": "error", "message": "..." }`.

## Error handling

All error responses share one shape:
```json
{ "status": "error", "message": "..." }
```
Success responses use `{ "status": "success", "data": ... }`. `middleware/errorHandler.js` centralizes translation of Mongoose/JWT errors (`ValidationError`, `CastError`, duplicate-key `11000`, `JsonWebTokenError`, `TokenExpiredError`) into the right status code, so controllers only need to `next(error)` for anything unexpected.

## Environment variables

`.env` (git-ignored, see `.env.example` for the template):
```
PORT=3000
DB_URI=<mongodb connection string>
JWT_SECRET=<random secret>
JWT_EXPIRES_IN=1h
CORS_ORIGIN=<allowed frontend origin>
DNS_SERVERS=<comma-separated DNS resolvers>
```

## Creating an admin

There is no self-service way to become an admin (by design — see registration flow above). To promote a user:
```js
db.users.updateOne({ email: "someone@example.com" }, { $set: { role: "admin" } })
```

## Testing

See `docs/postman_collection.json` — import into Postman. Covers registration (success, duplicate email, missing fields, role-injection attempt, rate limiting), login (success, wrong password, unknown email, rate limiting), authenticated task CRUD, unauthenticated requests (401), cross-user requests now returning 404 instead of a distinguishable 403, and admin requests (full task/user visibility, cross-user update/delete).
