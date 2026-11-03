// Bundled for the browser by scripts/check-runtimes.mjs, then run without Node's
// globals (no process, Buffer or require), and on Bun and Deno when installed.
import { BlujayClient, verifyWebhook, WebhookVerificationError } from "../../dist/esm/index.js";
import vectors from "../webhook-vectors.json";

export async function run() {
    const now = new Date(vectors.now_seconds * 1000);
    const event = await verifyWebhook(vectors.body, vectors.headers, vectors.secret, { now });
    if (event.event_id !== "evt_test123") throw new Error("verifyWebhook returned the wrong event");
    const bytes = await verifyWebhook(new TextEncoder().encode(vectors.body), new Headers(vectors.headers), vectors.secret, { now });
    if (bytes.event_id !== "evt_test123") throw new Error("verifyWebhook failed on bytes");
    try {
        await verifyWebhook(vectors.body.replace("msg_test", "msg_evil"), vectors.headers, vectors.secret, { now });
        throw new Error("verifyWebhook accepted a changed body");
    } catch (err) {
        if (!(err instanceof WebhookVerificationError)) throw err;
    }
    let sent;
    const client = new BlujayClient({
        apiKey: "blu_test",
        fetch: async (_url, init) => {
            sent = new Headers(init.headers);
            return new Response(JSON.stringify({ status: "success", data: { workspace_label: "Test" }, trace_id: "trc_1", timestamp: "t" }), {
                status: 200,
                headers: { "content-type": "application/json" },
            });
        },
    });
    const me = await client.me.get();
    if (me.data.workspace_label !== "Test") throw new Error("client.me.get() returned the wrong data");
    return `verify ok, client ok, User-Agent ${sent.get("user-agent")}`;
}
