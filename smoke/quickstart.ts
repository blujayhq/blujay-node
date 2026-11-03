// TypeScript quickstart, as a customer would write it, run against the mock server.
import { randomUUID } from "node:crypto";
import { Blujay, BlujayClient, BlujayError } from "blujay";

const client = new BlujayClient({
  apiKey: process.env.BLUJAY_API_KEY, // or omit: the client reads BLUJAY_API_KEY
  baseUrl: process.env.BLUJAY_BASE_URL, // only for this local test
});

// Who am I?
const me = await client.me.get();
console.log("workspace:", me.data.workspace_label, "trace:", me.trace_id);

// Every chat, across pages.
for await (const chat of await client.chats.list({ limit: 2 })) {
  console.log("chat:", chat.chat_id);
}

// Send a message; the idempotency key makes a manual retry safe.
const sent = await client.chats.messages.send(
  {
    chat_id: "chat_abc123",
    message: { parts: [{ type: "text", text: "Hi Ava, your appointment is confirmed." }] },
  },
  { idempotencyKey: randomUUID() },
);
console.log("sent:", sent.data.message.id, sent.data.message.delivery_status);

// GETs retry a 503 automatically.
const flaky = await client.chats.get({ chat_id: "chat_flaky" });
console.log("flaky chat after retry:", flaky.data.chat_id);

// Sends do not retry by themselves; the error carries the API's error code.
try {
  await client.chats.messages.send({ chat_id: "chat_down", message: { parts: [{ type: "text", text: "hi" }] } });
} catch (err) {
  if (err instanceof BlujayError) {
    console.log("send failed:", err.statusCode, err.code);
    console.log("error message:", err.message);
  } else throw err;
}

// Edits are writes too: no automatic retry.
try {
  await client.messages.edit({ message_id: "msg_down", text: "Fixed typo" });
} catch (err) {
  if (err instanceof BlujayError) console.log("edit failed:", err.statusCode);
  else throw err;
}

// client.fetch() follows the same rule: a POST is not retried.
const raw = await client.fetch("/v1/chats/chat_down/messages", { method: "POST", body: "{}" });
console.log("fetch send status:", raw.status);

// Without baseUrl, client.fetch() goes to production (checked with a stub fetch).
let seen = "";
const stub = new BlujayClient({ apiKey: "blu_test", fetch: (async (url: string | URL | Request) => { seen = String(url); return new Response("{}"); }) as typeof fetch });
await stub.fetch("/v1/me");
console.log("fetch default url:", seen);

// Page by page: stops after the last page.
let page = await client.chats.list({ limit: 2 });
let pages = 1;
while (page.hasNextPage() && pages < 10) {
  page = await page.getNextPage();
  pages++;
}
console.log("pages:", pages);

// Errors map to their classes on every method, not only sends.
for (const call of [() => client.chats.get({ chat_id: "chat_unauth" }), () => client.messages.get({ message_id: "msg_limited" })]) {
  try {
    await call();
  } catch (err) {
    console.log("error class:", err instanceof Blujay.UnauthorizedError ? "UnauthorizedError" : err instanceof Blujay.TooManyRequestsError ? "TooManyRequestsError" : (err as Error).constructor.name);
  }
}
