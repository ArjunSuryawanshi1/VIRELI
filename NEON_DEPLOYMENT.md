# VIRELI on GitHub Pages and Neon

GitHub Pages serves the interface. The `vireliapi` Neon Function handles accounts,
password verification, sessions and planner documents in private Postgres tables.
The existing Python/SQLite server remains available for localhost development.
Render is not required; its old configuration is not used by this deployment.

## Deployment

The Neon GitHub integration must supply the repository secret `NEON_API_KEY` and
variable `NEON_PROJECT_ID`. Run the **Deploy VIRELI Neon API** GitHub workflow.
It runs tests, deploys the API, checks the database connection and commits only
the public invocation URL to `api-config.js`. Pages continues deploying `main`.
GitHub does not trigger a Pages build for a bot-token commit alone. After the
first endpoint update, push a normal commit or rerun the Pages deployment.
The function URL stays stable for subsequent backend releases.
Neon injects `DATABASE_URL`; never place it or API keys in frontend code.

## Security and compatibility

- Passwords use salted PBKDF2-SHA256 with 120,000 iterations, matching the local backend.
- Session tokens are random, expiring and stored only as hashes in Postgres.
- Same-origin callers use Secure HttpOnly cookies. GitHub Pages uses an in-memory
  bearer token because third-party cookies are unreliable. No authentication
  token or password is saved in browser storage; reopening requires Sign In.
- A non-authenticating device identifier persists locally to enforce the existing
  registration limit. Clearing browser data can reset that browser identifier.
- API browser access is restricted to `https://arjunsuryawanshi1.github.io`.
- Planner reads/writes require a session, use the authenticated user's ID only,
  and reject stale revisions. Hosted users receive UUIDs so local SQLite caches
  cannot accidentally become a different hosted user's data.
- Localhost accounts are not automatically copied into Neon. Register a hosted
  account to begin; deliberate account/data migration is a separate operation.

## Testing

Install Node 24 and pnpm 11, then run `pnpm install` and `pnpm test`.
Tests use an isolated in-memory PostgreSQL engine, never the production database.
Also run `node --check script.js`, `python3 -m py_compile server.py`, and
`git diff --check`. For the existing local app run `PORT=8001 python3 server.py`.
For hosted testing, use the GitHub Pages URL after the workflow succeeds.
Check registration, login, sign out, saved routine restoration and account
isolation. Deployment is not confirmed until the workflow health check passes.
