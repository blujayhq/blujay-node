// Receive Blujay webhooks: verify each request, then handle the event.
//
//   BLUJAY_WEBHOOK_SECRET=whsec_... npx tsx examples/webhook-server.ts
//
// Point a webhook subscription at http://your-server:3000/webhooks/blujay.
import http from "node:http";
import { verifyWebhook, WebhookVerificationError } from "blujay";

const secret = process.env.BLUJAY_WEBHOOK_SECRET;
if (!secret) throw new Error("Set BLUJAY_WEBHOOK_SECRET to your subscription's signing secret");

http.createServer((req, res) => {
    if (req.method !== "POST" || req.url !== "/webhooks/blujay") {
        res.writeHead(404).end();
        return;
    }
    // Verify the raw body exactly as it arrived; parsed and re-serialized JSON won't match.
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", async () => {
        let event;
        try {
            event = await verifyWebhook(Buffer.concat(chunks), req.headers, secret);
        } catch (err) {
            if (err instanceof WebhookVerificationError) {
                res.writeHead(400).end(err.message);
                return;
            }
            throw err;
        }

        // Blujay can deliver an event more than once: skip event IDs you've already handled.
        // `event` is typed by event_type, so each case knows the shape of `data`.
        switch (event.event_type) {
            case "message.received": {
                const photos = (event.data.parts ?? []).filter((part) => part.type === "media");
                const from = event.data.sender?.address ?? event.data.contact_id;
                console.log(`New message from ${from} in ${event.data.chat_id}: ${event.data.text ?? "(no text)"}`);
                if (photos.length > 0) console.log(`  with ${photos.length} attachment(s)`);
                break;
            }
            case "message.delivered":
                console.log(`Delivered ${event.data.message_id} by ${event.data.service ?? "unknown service"}`);
                break;
            case "message.failed":
                console.log(`Failed ${event.data.message_id}: ${event.data.failure?.reason ?? "no reason given"}`);
                break;
            case "contact.assigned":
                console.log("A contact was assigned:", event.data);
                break;
            default:
                console.log(`Received ${event.event_type}`);
        }
        // Answer quickly; do slow work after responding.
        res.writeHead(200).end();
    });
}).listen(3000, () => console.log("Listening on http://localhost:3000/webhooks/blujay"));
