(function () {
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
  const configured = local ? "" : (window.VIRELI_API_BASE || "").replace(/\/$/, "");
  let sessionToken = "";
  let deviceToken = "";
  try { deviceToken = window.localStorage.getItem("vireli.neonDevice.v1") || ""; } catch {}
  window.VireliApi = {
    hosted: Boolean(configured),
    acceptSession(payload) {
      sessionToken = typeof payload.sessionToken === "string" ? payload.sessionToken : "";
      if (typeof payload.deviceToken === "string") {
        deviceToken = payload.deviceToken;
        try { window.localStorage.setItem("vireli.neonDevice.v1", deviceToken); } catch {}
      }
    },
    clearSession() { sessionToken = ""; },
    async fetch(path, options = {}) {
      if (window.location.hostname.endsWith("github.io") && !configured) throw new Error("VIRELI's hosted account server is not configured yet.");
      const headers = new Headers(options.headers);
      if (configured && sessionToken) headers.set("Authorization", `Bearer ${sessionToken}`);
      if (configured && deviceToken) headers.set("X-Vireli-Device", deviceToken);
      const response = await fetch(`${configured}${path}`, { ...options, headers, credentials: configured ? "omit" : "same-origin", cache: "no-store" });
      if (!response.headers.get("content-type")?.includes("application/json")) throw new Error("VIRELI's account server is unavailable. Please try again later.");
      return response;
    },
  };
})();
