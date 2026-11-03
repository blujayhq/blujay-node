// Proves the library loads outside Node: bundles test/runtime/entry.mjs for the
// browser with esbuild (which fails on any node: import), runs the bundle in a
// sandbox that has only web globals, then on Bun and Deno when they're installed.
import fs from "node:fs";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { build } from "esbuild";

const out = "build-runtimes";
fs.rmSync(out, { recursive: true, force: true });
const common = { entryPoints: ["test/runtime/entry.mjs"], bundle: true, platform: "browser", logLevel: "error" };
await build({ ...common, format: "iife", globalName: "blujayRuntimeCheck", outfile: `${out}/bundle.js` });
await build({ ...common, format: "esm", outfile: `${out}/bundle.mjs` });
const code = fs.readFileSync(`${out}/bundle.js`, "utf8");
// esbuild already fails on a node: import for the browser; this also catches a dynamic one.
if (/(?:\bfrom\s*|\brequire\(\s*|\bimport\(\s*)["']node:/.test(code)) throw new Error("The browser bundle imports a node: module");

// Web globals only: what a browser, a Cloudflare Worker or Vercel Edge provides.
const web = [
    "crypto", "TextEncoder", "TextDecoder", "atob", "btoa", "Headers", "Request", "Response", "URL", "URLSearchParams",
    "AbortController", "AbortSignal", "Blob", "FormData", "ReadableStream", "structuredClone", "queueMicrotask",
    "setTimeout", "clearTimeout", "console", "DOMException", "Event", "EventTarget",
];
const sandbox = Object.fromEntries(web.map((name) => [name, globalThis[name]]));
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
console.log(`web sandbox: ${await vm.runInContext("blujayRuntimeCheck.run()", sandbox)}`);

const runner = 'import { run } from "./bundle.mjs"; console.log(await run());';
fs.writeFileSync(`${out}/run.mjs`, runner);
const has = (bin) => { try { execFileSync(bin, ["--version"], { stdio: "ignore" }); return true; } catch { return false; } };
const required = (process.env.REQUIRE_RUNTIMES ?? "").split(",").filter(Boolean);
for (const [name, args] of [["bun", ["run", `${out}/run.mjs`]], ["deno", ["run", `${out}/run.mjs`]]]) {
    if (!has(name)) {
        if (required.includes(name)) throw new Error(`${name} is required but not installed`);
        console.log(`${name}: not installed, skipped`);
        continue;
    }
    console.log(`${name}: ${execFileSync(name, args, { encoding: "utf8" }).trim()}`);
}
fs.rmSync(out, { recursive: true, force: true });
