# Blujay Node.js Library

[![npm](https://img.shields.io/npm/v/blujay)](https://www.npmjs.com/package/blujay)
[![CI](https://github.com/blujayhq/blujay-node/actions/workflows/ci.yml/badge.svg)](https://github.com/blujayhq/blujay-node/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

The official TypeScript and JavaScript library for the [Blujay API](https://docs.blujay.io). Send and receive iMessage, RCS and SMS from your Blujay phone numbers.

- [API docs and guides](https://docs.blujay.io)
- [Every method in this library](reference.md)
- [Examples](examples)

## Installation

```sh
npm install blujay
```

Requires Node.js 20 or later. Works with `import` and `require`, ships its own TypeScript types, and also runs on Bun, Deno and edge runtimes (see [Runtimes](#runtimes)).

## Usage

```ts
import { BlujayClient } from "blujay";

const client = new BlujayClient({
    apiKey: process.env.BLUJAY_API_KEY, // the default, so you can leave it out
});

const sent = await client.chats.create({
    to: ["+15555550123"],
    message: { parts: [{ type: "text", text: "Hi! Thanks for reaching out." }] },
});

console.log(sent.data.chat_id, sent.data.message.id);
```

Have more than one Blujay number? Add `from: "+15555550100"` to choose which one sends. To retry a send safely, see [Retries and idempotency](#retries-and-idempotency).

Workspace owners and admins find the API key in Blujay under **API** in the sidebar. Keep it on your server; never ship it to a browser or app.

## Responses

Every method that returns JSON gives you the API's response envelope. The result is in `data`, and `trace_id` identifies the request if you contact support:

```ts
const chat = await client.chats.get({ chat_id: "chat_abc123" });
console.log(chat.data.participants, chat.trace_id);
```

Every request and response has a TypeScript type under the `Blujay` namespace. Objects are named for what they are (`Blujay.Chat`, `Blujay.Message`, `Blujay.Contact`); each method's types are named for the method, so `client.chats.create` takes `Blujay.ChatCreateParams` and returns `Blujay.ChatCreateResponse`, and `client.chats.messages.send` takes `Blujay.ChatMessageSendParams`:

```ts
import { Blujay } from "blujay";

const message: Blujay.MessageInput = { parts: [{ type: "text", text: "See you at 3." }] };
const params: Blujay.ChatMessageSendParams = { chat_id: "chat_abc123", message };

const chat: Blujay.ChatGetResponse = await client.chats.get({ chat_id: "chat_abc123" });
for (const person of chat.data.participants) {
    console.log(person.address, person.display_name ?? "");
}
```

## Pagination

List methods page through results for you:

```ts
for await (const chat of await client.chats.list()) {
    console.log(chat.chat_id);
}
```

Or one page at a time:

```ts
let page = await client.chats.list({ limit: 50 });
console.log(page.data);
while (page.hasNextPage()) {
    page = await page.getNextPage();
}
```

## Receiving webhooks

Blujay sends replies, delivery updates, reactions and calls to your server as webhooks. `verifyWebhook` checks that a request came from Blujay and returns the event, typed by its `event_type`:

```ts
import { verifyWebhook } from "blujay";

// rawBody: the request body exactly as received, as a string or bytes
const event = await verifyWebhook(rawBody, req.headers, process.env.BLUJAY_WEBHOOK_SECRET!);

if (event.event_type === "message.received") {
    console.log(`New message in ${event.data.chat_id}: ${event.data.text ?? "(no text)"}`);
}
```

Pass the raw body, not parsed JSON: re-serialized JSON won't match the signature. It rejects with `WebhookVerificationError` when the signature, the timestamp (more than 5 minutes off) or a header is wrong. It uses Web Crypto, so it's async and works on every runtime under [Runtimes](#runtimes).

Getting the raw body:

```ts
// Express: express.raw() keeps the body as a Buffer for this route.
import express from "express";
import { verifyWebhook, WebhookVerificationError } from "blujay";

const app = express();
app.post("/webhooks/blujay", express.raw({ type: "application/json" }), async (req, res) => {
    try {
        const event = await verifyWebhook(req.body, req.headers, process.env.BLUJAY_WEBHOOK_SECRET!);
        console.log("Received", event.event_type);
        res.sendStatus(200);
    } catch (err) {
        if (!(err instanceof WebhookVerificationError)) throw err;
        res.sendStatus(400);
    }
});
```

```ts
// Next.js route handler (app/webhooks/blujay/route.ts): read the text before anything parses it.
import { verifyWebhook, WebhookVerificationError } from "blujay";

export async function POST(request: Request) {
    try {
        const event = await verifyWebhook(await request.text(), request.headers, process.env.BLUJAY_WEBHOOK_SECRET!);
        console.log("Received", event.event_type);
        return new Response(null, { status: 200 });
    } catch (err) {
        if (!(err instanceof WebhookVerificationError)) throw err;
        return new Response(null, { status: 400 });
    }
}
```

See [webhook-server.ts](examples/webhook-server.ts) for a complete server and the [webhooks guide](https://docs.blujay.io/webhooks/overview) for every event.

## Handling errors

When the API returns an error, the library throws a subclass of `BlujayError`. Its message is one line, such as `404 NOT_FOUND: Chat not found (trace_id trc_8f2a1c0e4b7d)`:

```ts
import { Blujay, BlujayError } from "blujay";

try {
    await client.chats.get({ chat_id: "chat_missing" });
} catch (err) {
    if (err instanceof Blujay.NotFoundError) {
        console.log("No such chat");
    } else if (err instanceof BlujayError) {
        // code: what went wrong, such as RATE_LIMIT_EXCEEDED. traceId: include it when you contact support.
        console.log(err.statusCode, err.code, err.traceId);
        if (err.retryable) console.log(`Safe to retry in ${err.retryAfter ?? 1} seconds`);
    } else {
        throw err;
    }
}
```

| Status | Error |
| --- | --- |
| 400 | `BadRequestError` |
| 401 | `UnauthorizedError`: authentication failed (the API key is missing, invalid, expired or revoked) |
| 403 | `ForbiddenError` |
| 404 | `NotFoundError` |
| 409 | `ConflictError` |
| 413 | `ContentTooLargeError` |
| 415 | `UnsupportedMediaTypeError` |
| 422 | `UnprocessableEntityError` |
| 429 | `TooManyRequestsError` |
| 500 | `InternalServerError` |
| 502 | `BadGatewayError` |
| 503 | `ServiceUnavailableError` |

Any other error status throws `BlujayError` itself; check `statusCode` and `code`. `docUrl` links to the page that explains the code, and `body` holds the full error response. A request that takes too long throws `BlujayTimeoutError`, and a missing API key throws `BlujayError` before anything is sent. Every error code is explained in the [error reference](https://docs.blujay.io/errors).

## Retries and idempotency

Reads (`GET`) are retried up to 2 times, with backoff, when the connection fails or after a `408`, `429` or `5xx` response. A `Retry-After` header is respected. The [Python library](https://pypi.org/project/blujay/) does the same.

Writes (`POST`, `PUT`, `PATCH`, `DELETE`), including every send and edit, are never retried automatically: if Blujay accepted a send but the response was lost, a retry would text the person twice. Instead, pass an `idempotencyKey` on sends. Retrying with the **same** key is always safe; Blujay returns the original result instead of sending again.

```ts
// Tie the key to the event, so a retry reuses it.
const idempotencyKey = "order-1042-shipped";
await client.chats.messages.send({ chat_id: "chat_abc123", message }, { idempotencyKey });
```

Change the retry count for reads with `maxRetries`, on the client or per request. Writes ignore it and never retry:

```ts
const client = new BlujayClient({ maxRetries: 0 });
await client.chats.list({}, { maxRetries: 5 });
```

## Timeouts

Requests time out after 60 seconds. Change it on the client or per request:

```ts
const client = new BlujayClient({ timeoutInSeconds: 20 });
await client.chats.list({}, { timeoutInSeconds: 5 });
```

## Downloads

Methods that return a file, such as `client.attachments.download` and `client.calls.downloadRecording`, give you the body to read once:

```ts
import { writeFile } from "node:fs/promises";

const recording = await client.calls.downloadRecording({ call_id: "call_abc123" });
await writeFile("call.mp3", Buffer.from(await recording.arrayBuffer()));
```

## Advanced

- **Raw response:** add `.withRawResponse()` to a call to get `{ data, rawResponse }`, including headers. List calls return a page instead; read `page.rawResponse`.
- **Cancel a request:** pass `abortSignal` in the request options.
- **Extra headers:** pass `headers` on the client or per request.
- **Logging:** pass `logging: { level: logging.LogLevel.Debug, silent: false }` to the client (`import { logging } from "blujay"`).
- **Endpoints not in this version:** `client.fetch("/v1/...", init)` sends an authenticated request. It doesn't retry a write (`POST`, `PUT`, `PATCH` or `DELETE`) unless you pass `maxRetries` in its request options; only pass it with an `Idempotency-Key` header.

## Runtimes

The library uses only `fetch` and Web Crypto, so it runs on:

- Node.js 20, 22 and 24 (tested on each)
- Bun and Deno (tested)
- Cloudflare Workers and Vercel Edge Functions (`verifyWebhook` and the client; tested in a sandbox with only web globals)

Keep your API key on a server: anyone can read a key that's shipped in a web page, so don't call the API from a browser.

## Versioning

This library follows [semantic versioning](https://semver.org). New endpoints and fields arrive in minor versions; anything that could break your code waits for a major version. See the [changelog](CHANGELOG.md).

## Support

- Questions and bugs: [support@blujay.io](mailto:support@blujay.io) or [open an issue](https://github.com/blujayhq/blujay-node/issues)
- Security issues: see [SECURITY.md](SECURITY.md)

## License

[MIT](LICENSE)
