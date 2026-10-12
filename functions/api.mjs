import { randomBytes, randomUUID, createHash, pbkdf2, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { schema } from "./schema.mjs";

const derive = promisify(pbkdf2);
const digest = (value) => createHash("sha256").update(value).digest("hex");
const secret = () => randomBytes(32).toString("base64url");
const passwordHash = async (password, salt) => (await derive(password, salt, 120000, 32, "sha256")).toString("hex");
const same = (a, b) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const publicUser = (row) => ({ id: row.id, username: row.username, name: "", email: "", picture: "", authMode: "vireli-account", createdAt: row.created_at, updatedAt: row.updated_at, lastLoginAt: row.last_login_at });
class ApiError extends Error { constructor(status, message) { super(message); this.status = status; } }

export function createApi(pool, { origins = ["https://arjunsuryawanshi1.github.io"], secure = true } = {}) {
  let initialized;
  const initialize = () => initialized ||= pool.query(schema).catch((error) => { initialized = undefined; throw error; });
  async function transaction(fn) {
    const client = await pool.connect();
    try { await client.query("BEGIN"); const result = await fn(client); await client.query("COMMIT"); return result; }
    catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  }
  async function rateLimit(key) {
    const { rows } = await pool.query(`INSERT INTO vireli_rate_limits(key, attempts, reset_at) VALUES ($1,1,now()+interval '15 minutes')
      ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN vireli_rate_limits.reset_at<now() THEN 1 ELSE vireli_rate_limits.attempts+1 END,
      reset_at=CASE WHEN vireli_rate_limits.reset_at<now() THEN now()+interval '15 minutes' ELSE vireli_rate_limits.reset_at END RETURNING attempts`, [digest(key)]);
    if (rows[0].attempts > 20) throw new ApiError(429, "Too many attempts. Try again later.");
  }
  const cookie = (name, value, maxAge) => `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
  return { async fetch(request) {
    const origin = request.headers.get("origin");
    const headers = new Headers({ "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Vary": "Origin" });
    const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
    if (origin && !origins.includes(origin)) return reply({ error: "Origin not allowed." }, 403);
    if (origin) {
      headers.set("Access-Control-Allow-Origin", origin);
      headers.set("Access-Control-Allow-Credentials", "true");
      headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Vireli-Device");
      headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
    }
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    try {
      const path = new URL(request.url).pathname.replace(/\/$/, "");
      if (path === "/api/health" && request.method === "GET") {
        await initialize(); await pool.query("SELECT 1"); return reply({ ok: true, service: "vireli-neon" });
      }
      await initialize();
      const cookies = Object.fromEntries((request.headers.get("cookie") || "").split(";").map((part) => part.trim().split("=")).filter((part) => part.length === 2));
      const token = request.headers.get("authorization")?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1] || cookies.vireli_session || "";
      const { rows: sessions } = await pool.query(`SELECT u.* FROM vireli_sessions s JOIN vireli_users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()`, [digest(token)]);
      const user = sessions[0];
      if (path === "/api/auth/me" && request.method === "GET") return reply({ authenticated: Boolean(user), user: user ? publicUser(user) : null });
      if (path === "/api/auth/logout" && request.method === "POST") {
        await pool.query("DELETE FROM vireli_sessions WHERE token_hash=$1", [digest(token)]);
        headers.append("Set-Cookie", cookie("vireli_session", "", 0)); return reply({ ok: true });
      }
      let body = {};
      if (["POST", "PUT"].includes(request.method)) {
        if (!request.headers.get("content-type")?.includes("application/json")) throw new ApiError(415, "Send JSON data.");
        const reader = request.body?.getReader(); let bytes = 0; const chunks = [];
        if (reader) { while (true) { const { done, value } = await reader.read(); if (done) break; bytes += value.length; if (bytes > 1048576) { await reader.cancel(); throw new ApiError(413, "Request is too large."); } chunks.push(Buffer.from(value)); } }
        try { body = JSON.parse(Buffer.concat(chunks).toString()); } catch { throw new ApiError(400, "Invalid JSON data."); }
        if (!body || typeof body !== "object" || Array.isArray(body)) throw new ApiError(400, "Invalid request.");
      }
      const authPaths = ["/api/auth/vireli/register", "/api/auth/vireli/login", "/api/auth/vireli/check-username"];
      if (authPaths.includes(path) && request.method === "POST") {
        const username = body.username;
        if (typeof username !== "string" || !username.trim() || username.length > 128 || /[\x00-\x1f\x7f]/.test(username)) throw new ApiError(400, "Enter a valid username.");
        await rateLimit(`username:${username}`);
        const { rows } = await pool.query("SELECT * FROM vireli_users WHERE username=$1", [username]);
        if (path.endsWith("check-username")) return rows.length ? reply({ error: "Username already taken" }, 409) : reply({ available: true, username });
        const password = body.password;
        if (typeof password !== "string" || password.length < 6 || password.length > 1024) throw new ApiError(400, "Use at least 6 characters for your password.");
        let account;
        let deviceToken = request.headers.get("x-vireli-device") || cookies.vireli_device || "";
        if (!/^[A-Za-z0-9_-]{43}$/.test(deviceToken)) deviceToken = secret();
        if (path.endsWith("register")) {
          if (rows.length) throw new ApiError(409, "Username already taken");
          const salt = secret(); const hash = await passwordHash(password, salt);
          account = await transaction(async (client) => {
            const deviceHash = digest(deviceToken);
            await client.query("INSERT INTO vireli_devices(token_hash) VALUES ($1) ON CONFLICT DO NOTHING", [deviceHash]);
            await client.query("SELECT token_hash FROM vireli_devices WHERE token_hash=$1 FOR UPDATE", [deviceHash]);
            const count = await client.query("SELECT count(*)::int AS count FROM vireli_device_accounts WHERE device_hash=$1", [deviceHash]);
            if (count.rows[0].count >= 2) throw new ApiError(403, "Unable to create another account on this device.");
            const created = await client.query("INSERT INTO vireli_users(id,username,password_hash,password_salt) VALUES ($1,$2,$3,$4) RETURNING *", [randomUUID(), username, hash, salt]);
            await client.query("INSERT INTO vireli_device_accounts(device_hash,user_id) VALUES ($1,$2)", [deviceHash, created.rows[0].id]); return created.rows[0];
          });
        } else {
          if (!rows.length) throw new ApiError(404, "Account not found");
          if (!same(await passwordHash(password, rows[0].password_salt), rows[0].password_hash)) throw new ApiError(401, "Incorrect password");
          account = (await pool.query("UPDATE vireli_users SET last_login_at=now() WHERE id=$1 RETURNING *", [rows[0].id])).rows[0];
        }
        const session = secret();
        await pool.query("INSERT INTO vireli_sessions(token_hash,user_id,expires_at) VALUES ($1,$2,now()+interval '14 days')", [digest(session), account.id]);
        headers.append("Set-Cookie", cookie("vireli_session", session, 1209600));
        headers.append("Set-Cookie", cookie("vireli_device", deviceToken, 315360000));
        // Cross-site cookies are blocked in many browsers. Pages keeps this token in memory only.
        const crossOrigin = origin && origin !== new URL(request.url).origin;
        return reply({ authenticated: true, user: publicUser(account), ...(crossOrigin ? { sessionToken: session, deviceToken } : {}) });
      }
      if (!user) throw new ApiError(401, "Sign in to continue.");
      if (path === "/api/auth/vireli/change-password" && request.method === "POST") {
        if (typeof body.currentPassword !== "string" || body.currentPassword.length > 1024 || typeof body.newPassword !== "string" || body.newPassword.length < 6 || body.newPassword.length > 1024) throw new ApiError(400, "Use at least 6 characters for your new password.");
        await rateLimit(`password:${user.id}`);
        if (!same(await passwordHash(body.currentPassword, user.password_salt), user.password_hash)) throw new ApiError(401, "Incorrect password");
        const salt = secret(); const hash = await passwordHash(body.newPassword, salt);
        await transaction(async (client) => {
          await client.query("UPDATE vireli_users SET password_hash=$1,password_salt=$2,updated_at=now() WHERE id=$3", [hash,salt,user.id]);
          await client.query("DELETE FROM vireli_sessions WHERE user_id=$1 AND token_hash<>$2", [user.id,digest(token)]);
        }); return reply({ ok: true });
      }
      if (path === "/api/planner" && request.method === "GET") {
        const { rows } = await pool.query("SELECT document,revision,updated_at FROM vireli_planners WHERE user_id=$1", [user.id]);
        return reply(rows.length ? { document: rows[0].document, revision: rows[0].revision, updatedAt: rows[0].updated_at } : { document: null, revision: 0, updatedAt: "" });
      }
      if (path === "/api/planner" && request.method === "PUT") {
        if (!body.document || typeof body.document !== "object" || Array.isArray(body.document) || !Number.isSafeInteger(body.revision) || body.revision < 0) throw new ApiError(400, "Invalid planner document or revision.");
        const result = await transaction(async (client) => {
          await client.query("SELECT id FROM vireli_users WHERE id=$1 FOR UPDATE", [user.id]);
          const current = await client.query("SELECT revision FROM vireli_planners WHERE user_id=$1", [user.id]);
          const revision = current.rows[0]?.revision || 0;
          if (body.revision !== revision) throw new ApiError(409, "Planner data changed on another device.");
          const next = await client.query(`INSERT INTO vireli_planners(user_id,document,revision) VALUES ($1,$2,$3)
            ON CONFLICT(user_id) DO UPDATE SET document=EXCLUDED.document,revision=EXCLUDED.revision,updated_at=now() RETURNING revision,updated_at`, [user.id, JSON.stringify(body.document), revision+1]);
          return { revision: next.rows[0].revision, updatedAt: next.rows[0].updated_at };
        }); return reply(result);
      }
      return reply({ error: "Not found." }, 404);
    } catch (error) {
      if (error.code === "23505") return reply({ error: "Username already taken" }, 409);
      if (error instanceof ApiError) return reply({ error: error.message }, error.status);
      console.error("VIRELI API request failed", error.code || error.name);
      return reply({ error: "VIRELI could not complete this request. Try again." }, 503);
    }
  } };
}
