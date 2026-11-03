// The client against a stand-in fetch: error messages and fields, User-Agent, retries.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { Blujay, BlujayClient, BlujayError } from "../dist/esm/index.js";

const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

function errorBody(code, message, extra = {}) {
    return {
        status: "error",
        error: { code, message, type: "auth", http_status: 401, retryable: false, doc_url: "https://docs.blujay.io/errors/x", details: [], ...extra },
        trace_id: "trc_8f2a1c0e4b7d",
        timestamp: "2026-10-29T12:00:00.000Z",
    };
}

/** A fetch that answers from a list of responses (or errors to throw) and records each request. */
function stubFetch(...answers) {
    const calls = [];
    const fetch = async (url, init) => {
        calls.push({ url: String(url), method: init.method, headers: new Headers(init.headers) });
        const answer = answers[Math.min(calls.length - 1, answers.length - 1)];
        if (answer instanceof Error) throw answer;
        return answer();
    };
    return { fetch, calls };
}

const json = (status, body, headers = {}) => () =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "x-trace-id": "trc_header", ...headers } });

const client = (fetch, options = {}) => new BlujayClient({ apiKey: "blu_test", fetch, maxRetries: 0, ...options });

test("an API error prints one line with the status, code, message and trace ID", async () => {
    const { fetch } = stubFetch(json(401, errorBody("UNAUTHORIZED", "Authentication failed")));
    const err = await client(fetch).me.get().catch((e) => e);
    assert.ok(err instanceof Blujay.UnauthorizedError);
    assert.ok(err instanceof BlujayError);
    assert.equal(err.message, "401 UNAUTHORIZED: Authentication failed (trace_id trc_8f2a1c0e4b7d)");
    assert.equal(String(err), "UnauthorizedError: 401 UNAUTHORIZED: Authentication failed (trace_id trc_8f2a1c0e4b7d)");
    assert.equal(err.statusCode, 401);
    assert.equal(err.code, "UNAUTHORIZED");
    assert.equal(err.traceId, "trc_8f2a1c0e4b7d");
    assert.equal(err.retryable, false);
    assert.equal(err.retryAfter, undefined);
    assert.equal(err.docUrl, "https://docs.blujay.io/errors/x");
});

test("traceId falls back to the X-Trace-ID response header; there is no requestId", async () => {
    const body = errorBody("NOT_FOUND", "Not found");
    delete body.trace_id;
    const { fetch } = stubFetch(json(404, body));
    const err = await client(fetch).chats.get({ chat_id: "chat_missing" }).catch((e) => e);
    assert.ok(err instanceof Blujay.NotFoundError);
    assert.equal(err.traceId, "trc_header");
    assert.equal("requestId" in err, false);
});

test("a rate limit error says when to retry", async () => {
    const { fetch } = stubFetch(json(429, errorBody("RATE_LIMIT_EXCEEDED", "Too many requests", { retryable: true, retry_after: 30 }), { "retry-after": "30" }));
    const err = await client(fetch).chats.list().catch((e) => e);
    assert.ok(err instanceof Blujay.TooManyRequestsError);
    assert.equal(err.retryable, true);
    assert.equal(err.retryAfter, 30);
});

test("an HTML error page prints its title, not the page", async () => {
    const page = "<!DOCTYPE html><html><head><title>api.blujay.io | 502: Bad gateway</title></head><body>" + "x".repeat(5000) + "</body></html>";
    const { fetch } = stubFetch(() => new Response(page, { status: 502, headers: { "content-type": "text/html" } }));
    const err = await client(fetch).me.get().catch((e) => e);
    assert.ok(err instanceof BlujayError);
    assert.equal(err.message, '502: HTML page "api.blujay.io | 502: Bad gateway"');
    assert.equal(err.retryable, true);
    assert.equal(err.code, undefined);
});

test("a missing API key is a clear error with no status code", async () => {
    const saved = process.env.BLUJAY_API_KEY;
    delete process.env.BLUJAY_API_KEY;
    try {
        const { fetch, calls } = stubFetch(json(200, {}));
        const err = await new BlujayClient({ fetch }).me.get().catch((e) => e);
        assert.ok(err instanceof BlujayError);
        assert.equal(err.message, "Pass apiKey when creating the client, or set the BLUJAY_API_KEY environment variable");
        assert.equal(err.statusCode, undefined);
        assert.equal(calls.length, 0);
    } finally {
        if (saved !== undefined) process.env.BLUJAY_API_KEY = saved;
    }
});

test("sends a blujay-node User-Agent and no X-Fern headers", async () => {
    const { fetch, calls } = stubFetch(json(200, { status: "success", data: {}, trace_id: "trc_1", timestamp: "t" }));
    await client(fetch).me.get();
    await client(fetch).fetch("/v1/me");
    for (const call of calls) {
        assert.match(call.headers.get("user-agent"), new RegExp(`^blujay-node/${pkg.version.replaceAll(".", "\\.")} .*Node/`));
        assert.deepEqual([...call.headers.keys()].filter((name) => name.startsWith("x-fern")), []);
    }
});

test("reads retry when the connection fails; writes don't", async () => {
    const ok = json(200, { status: "success", data: { chat_id: "chat_1" }, trace_id: "trc_1", timestamp: "t" });
    const read = stubFetch(new TypeError("fetch failed"), ok);
    const chat = await client(read.fetch, { maxRetries: 2 }).chats.get({ chat_id: "chat_1" });
    assert.equal(chat.data.chat_id, "chat_1");
    assert.equal(read.calls.length, 2);

    const write = stubFetch(new TypeError("fetch failed"), ok);
    const err = await client(write.fetch, { maxRetries: 2 })
        .chats.messages.send({ chat_id: "chat_1", message: { parts: [{ type: "text", text: "hi" }] } })
        .catch((e) => e);
    assert.ok(err instanceof BlujayError);
    assert.equal(write.calls.length, 1);
});

test("the version in User-Agent matches package.json", async () => {
    const { SDK_VERSION } = await import("../dist/esm/custom/version.js");
    assert.equal(SDK_VERSION, pkg.version);
});

test("a 400 on any method is a BadRequestError", async () => {
    const { fetch } = stubFetch(json(400, errorBody("INVALID_PUBLIC_ID", "Invalid public ID")));
    const err = await client(fetch).chats.get({ chat_id: "chat_bad" }).catch((e) => e);
    assert.ok(err instanceof Blujay.BadRequestError);
    assert.equal(err.message, "400 INVALID_PUBLIC_ID: Invalid public ID (trace_id trc_8f2a1c0e4b7d)");
});
