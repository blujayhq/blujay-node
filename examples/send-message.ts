// Text someone from your Blujay number, then check how the message is doing.
//
//   BLUJAY_API_KEY=blu_... npx tsx examples/send-message.ts +15555550123
import { randomUUID } from "node:crypto";
import { BlujayClient, BlujayError } from "blujay";

const to = process.argv[2];
if (!to) throw new Error("Pass the phone number to text, for example +15555550123");

// Reads BLUJAY_API_KEY from the environment.
const client = new BlujayClient();

try {
    // Starts a chat with this person, or reuses the one you already have.
    // Keep the idempotency key with your record of this send: retrying with the
    // same key can't send the message twice.
    const sent = await client.chats.create(
        { to: [to], message: { parts: [{ type: "text", text: "Hi! Thanks for reaching out." }] } },
        { idempotencyKey: randomUUID() },
    );
    console.log(`Sent ${sent.data.message.id} in chat ${sent.data.chat_id}`);

    // Messages go out in the background. Webhooks tell you when the status
    // changes; you can also read it at any time.
    const message = await client.messages.get({ message_id: sent.data.message.id });
    console.log(`Status: ${message.data.status}, service: ${message.data.service ?? "not chosen yet"}`);
} catch (err) {
    if (err instanceof BlujayError) {
        // err.body is the API's error response, with a code you can act on.
        console.error(err.statusCode, err.body);
        process.exitCode = 1;
    } else {
        throw err;
    }
}
