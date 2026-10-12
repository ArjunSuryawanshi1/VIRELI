import { readFile, writeFile } from "node:fs/promises";
const metadata = JSON.parse(await readFile(process.argv[2], "utf8"));
const base = metadata.invocation_url;
if (!base || new URL(base).protocol !== "https:" || !new URL(base).hostname.endsWith(".neon.tech")) throw new Error("Neon did not return a valid deployment URL.");
const response = await fetch(new URL("/api/health", base));
const payload = await response.json();
if (!response.ok || payload.service !== "vireli-neon" || !payload.ok) throw new Error("API deployment health check failed.");
await writeFile("api-config.js", `// Public API endpoint; contains no credentials.\nwindow.VIRELI_API_BASE = ${JSON.stringify(base.replace(/\/$/, ""))};\n`);
