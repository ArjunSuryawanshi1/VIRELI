import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../api-client.js", import.meta.url), "utf8");
test("Pages uses its public API and never persists authentication tokens", async () => {
  const saved = new Map(); const calls = [];
  const window = { location: { hostname: "arjunsuryawanshi1.github.io" }, VIRELI_API_BASE: "https://example.neon.tech/", localStorage: { getItem: (key) => saved.get(key), setItem: (key, value) => saved.set(key, value) } };
  vm.runInNewContext(source, { window, Headers, fetch: async (url, options) => { calls.push({ url, options }); return new Response("{}", { headers: { "Content-Type": "application/json" } }); } });
  window.VireliApi.acceptSession({ sessionToken: "secret-session", deviceToken: "non-auth-device" });
  await window.VireliApi.fetch("/api/planner");
  assert.equal(calls[0].url, "https://example.neon.tech/api/planner");
  assert.equal(calls[0].options.credentials, "omit");
  assert.equal(calls[0].options.headers.get("Authorization"), "Bearer secret-session");
  assert.deepEqual([...saved.values()], ["non-auth-device"]);
  window.VireliApi.clearSession();
  await window.VireliApi.fetch("/api/auth/me");
  assert.equal(calls[1].options.headers.get("Authorization"), null);
});
test("Localhost preserves same-origin Python authentication", async () => {
  const window = { location: { hostname: "localhost" }, VIRELI_API_BASE: "https://example.neon.tech", localStorage: { getItem() {} } };
  let call;
  vm.runInNewContext(source, { window, Headers, fetch: async (url, options) => { call = { url, options }; return new Response("{}", { headers: { "Content-Type": "application/json" } }); } });
  await window.VireliApi.fetch("/api/auth/me");
  assert.equal(call.url, "/api/auth/me");
  assert.equal(call.options.credentials, "same-origin");
  assert.equal(window.VireliApi.hosted, false);
});
