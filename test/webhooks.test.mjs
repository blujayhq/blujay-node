// Webhook verification against signatures made by Blujay's production signing code.
// verifyWebhook uses Web Crypto, so it is async.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { verifyWebhook, WebhookVerificationError } from "../dist/esm/index.js";

const v = JSON.parse(fs.readFileSync(new URL("./webhook-vectors.json", import.meta.url), "utf8"));
const now = new Date(v.now_seconds * 1000);
const verify = (body = v.body, headers = v.headers, secret = v.secret, options = { now }) => verifyWebhook(body, headers, secret, options);
const rejects = (fn, pattern) => assert.rejects(fn, (err) => err instanceof WebhookVerificationError && pattern.test(err.message));

test("returns the parsed event for a valid signature", async () => {
  const event = await verify();
  assert.equal(event.event_id, "evt_test123");
  assert.equal(event.event_type, "message.received");
  assert.equal(event.data.text, 'Hé 👋 "quoted"');
});

test("accepts the raw body as bytes", async () => {
  assert.equal((await verify(Buffer.from(v.body, "utf8"))).event_id, "evt_test123");
});

test("accepts a fetch Headers object and any header case", async () => {
  assert.equal((await verify(v.body, new Headers(v.headers))).event_id, "evt_test123");
  const upper = Object.fromEntries(Object.entries(v.headers).map(([k, val]) => [k.toUpperCase(), val]));
  assert.equal((await verify(v.body, upper)).event_id, "evt_test123");
});

test("accepts any matching signature while a secret is rotated", async () => {
  assert.equal((await verify(v.body, { ...v.headers, "webhook-signature": v.rotated_signature })).event_id, "evt_test123");
});

test("rejects a changed body", async () => {
  await rejects(() => verify(v.body.replace("msg_test", "msg_evil")), /signature/);
});

test("rejects the wrong secret", async () => {
  await rejects(() => verify(v.body, v.headers, v.old_secret), /signature/);
});

test("rejects a timestamp more than 5 minutes away", async () => {
  const later = new Date((v.now_seconds + 301) * 1000);
  await rejects(() => verify(v.body, v.headers, v.secret, { now: later }), /timestamp/);
  assert.equal((await verify(v.body, v.headers, v.secret, { now: later, toleranceSeconds: 600 })).event_id, "evt_test123");
});

test("rejects a missing header", async () => {
  const { "webhook-signature": _omit, ...rest } = v.headers;
  await rejects(() => verify(v.body, rest), /webhook-signature/);
});

test("rejects a secret that isn't a whsec_ secret", async () => {
  await rejects(() => verify(v.body, v.headers, "not-a-secret"), /secret/);
});

test("rejects malformed headers cleanly instead of crashing", async () => {
  await rejects(() => verify(v.body, { ...v.headers, "webhook-signature": "v1,é" }), /signature/);
  await rejects(() => verify(v.body, { ...v.headers, "webhook-signature": `v1,${v.headers["webhook-signature"].slice(3)}!!` }), /signature/);
  await rejects(() => verify(v.body, { ...v.headers, "webhook-timestamp": "²" }), /timestamp/);
});

test("accepts any headers object with get(), such as node-fetch's", async () => {
  const lower = Object.fromEntries(Object.entries(v.headers));
  const foreign = { get: (name) => lower[name.toLowerCase()] ?? null };
  assert.equal((await verify(v.body, foreign)).event_id, "evt_test123");
});

test("explains that the raw body is needed when given parsed JSON", async () => {
  await rejects(() => verify(JSON.parse(v.body)), /raw request body/);
});

test("returns a promise (Web Crypto is async)", async () => {
  const result = verify();
  assert.ok(result instanceof Promise);
  assert.equal((await result).event_id, "evt_test123");
});

test("accepts the raw body as an ArrayBuffer", async () => {
  const bytes = new TextEncoder().encode(v.body);
  assert.equal((await verify(bytes.buffer)).event_id, "evt_test123");
});

test("types the event by event_type", async () => {
  const event = await verify();
  assert.equal(event.event_type === "message.received" && event.data.chat_id, "chat_test");
});

test("returns the signed bytes even if the caller's buffer changes during verification", async () => {
  const bytes = new TextEncoder().encode(v.body);
  const pending = verify(bytes);
  bytes.set(new TextEncoder().encode(v.body.replace("msg_test", "msg_evil")));
  const event = await pending;
  assert.equal(event.data.message_id, "msg_test");
});
