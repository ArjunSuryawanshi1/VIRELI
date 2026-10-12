import test from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { createApi } from "../functions/api.mjs";

test("Neon authentication, sessions, private planner revisions and device limits", async () => {
  const db = new PGlite();
  const pool = {
    query: async (sql, args) => sql.includes("CREATE TABLE") ? (await db.exec(sql), { rows: [] }) : db.query(sql, args),
    connect: async () => ({ query: (sql, args) => db.query(sql, args), release() {} }),
  };
  const api = createApi(pool);
  const origin = "https://arjunsuryawanshi1.github.io";
  async function call(path, { method = "GET", body, token, device, customOrigin = origin } = {}) {
    const response = await api.fetch(new Request(`https://test.neon.tech${path}`, {
      method, headers: { Origin: customOrigin, ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(device ? { "X-Vireli-Device": device } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }));
    return { status: response.status, headers: response.headers, body: response.status === 204 ? null : await response.json() };
  }
  try {
    assert.equal((await call("/api/health")).status, 200);
    assert.equal((await call("/api/planner")).status, 401);
    assert.equal((await call("/api/health", { customOrigin: "https://evil.example" })).status, 403);
    assert.equal((await call("/api/auth/vireli/register", { method: "POST", body: { username: "alice", password: "short" } })).status, 400);
    const alice = await call("/api/auth/vireli/register", { method: "POST", body: { username: "alice", password: "test-password" } });
    assert.equal(alice.status, 200);
    assert.match(alice.headers.get("set-cookie"), /HttpOnly/);
    assert.match(alice.headers.get("set-cookie"), /Secure/);
    assert.equal(alice.headers.get("access-control-allow-origin"), origin);
    assert.equal(alice.body.user.password_hash, undefined);
    const token = alice.body.sessionToken;
    const device = alice.body.deviceToken;
    const stored = (await db.query("SELECT * FROM vireli_users")).rows[0];
    assert.notEqual(stored.password_hash, "test-password");
    assert.equal(stored.password_hash.length, 64);
    assert.equal((await db.query("SELECT token_hash FROM vireli_sessions")).rows[0].token_hash === token, false);
    assert.equal((await call("/api/auth/vireli/check-username", { method: "POST", body: { username: "alice" } })).body.error, "Username already taken");
    assert.equal((await call("/api/auth/vireli/check-username", { method: "POST", body: { username: "not-taken" } })).body.available, true);
    assert.equal((await call("/api/auth/vireli/login", { method: "POST", body: { username: "unknown", password: "test-password" } })).body.error, "Account not found");
    assert.equal((await call("/api/auth/vireli/login", { method: "POST", body: { username: "alice", password: "wrong-password" } })).body.error, "Incorrect password");
    assert.equal((await call("/api/auth/me", { token })).body.user.id, alice.body.user.id);
    const document = { profile: { name: "Alice" }, routine: { fixedActivities: [] } };
    assert.equal((await call("/api/planner", { method: "PUT", token, body: { document, revision: 0 } })).body.revision, 1);
    assert.equal((await call("/api/planner", { method: "PUT", token, body: { document, revision: 0 } })).status, 409);
    assert.deepEqual((await call("/api/planner", { token })).body.document, document);
    const bob = await call("/api/auth/vireli/register", { method: "POST", device, body: { username: "bob", password: "test-password" } });
    assert.equal(bob.status, 200);
    assert.equal((await call("/api/planner", { token: bob.body.sessionToken })).body.document, null);
    const third = await call("/api/auth/vireli/register", { method: "POST", device, body: { username: "third", password: "test-password" } });
    assert.equal(third.body.error, "Unable to create another account on this device.");
    assert.equal((await call("/api/auth/vireli/change-password", { method: "POST", token, body: { currentPassword: "test-password", newPassword: "new-password" } })).status, 200);
    assert.equal((await call("/api/auth/vireli/login", { method: "POST", body: { username: "alice", password: "new-password" } })).status, 200);
    await call("/api/auth/logout", { method: "POST", token });
    assert.equal((await call("/api/auth/me", { token })).body.authenticated, false);
    await db.query("UPDATE vireli_sessions SET expires_at=now()-interval '1 minute'");
    assert.equal((await call("/api/planner", { token: bob.body.sessionToken })).status, 401);
    for (let i = 0; i < 21; i++) {
      const result = await call("/api/auth/vireli/check-username", { method: "POST", body: { username: "rate-test" } });
      if (i === 20) assert.equal(result.status, 429);
    }
  } finally { await db.close(); }
});
