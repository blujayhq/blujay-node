// Hand-written (not generated): webhook signature verification.
// Blujay signs webhooks with the Standard Webhooks scheme (https://www.standardwebhooks.com).
// Uses Web Crypto (globalThis.crypto.subtle), so it runs on Node.js 20+, Bun, Deno,
// Cloudflare Workers, Vercel Edge and in browsers.
import type { WebhookEvent } from "../api/types/WebhookEvent.js";

/** Thrown when a webhook's signature, timestamp, headers or secret can't be verified. */
export class WebhookVerificationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "WebhookVerificationError";
    }
}

/** Request headers: a fetch `Headers` object or a plain object such as Express's `req.headers`. */
export type WebhookHeaders = Headers | Record<string, string | string[] | undefined>;

export interface VerifyWebhookOptions {
    /** How far `webhook-timestamp` may be from now, in seconds. Defaults to 300 (5 minutes). */
    toleranceSeconds?: number;
    /** The current time. Only for tests. */
    now?: Date;
}

const DEFAULT_TOLERANCE_SECONDS = 300;
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;
const encoder = new TextEncoder();

function header(headers: WebhookHeaders, name: string): string {
    let value: string | string[] | null | undefined;
    if (typeof (headers as { get?: unknown }).get === "function") {
        // A fetch Headers object, or any lookalike (node-fetch, undici).
        value = (headers as Headers).get(name);
    } else {
        const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === name);
        value = entry?.[1];
    }
    if (Array.isArray(value)) value = value.join(" ");
    if (value == null || value === "") throw new WebhookVerificationError(`Missing ${name} header`);
    return value;
}

/** Decodes standard base64, or returns undefined when the text isn't valid base64. */
function base64Bytes(encoded: string): Uint8Array | undefined {
    // Same base64 rules as Blujay's own verifier.
    if (!BASE64.test(encoded) || encoded.length % 4 !== 0) return undefined;
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

function decodeSecret(secret: string): Uint8Array {
    const trimmed = typeof secret === "string" ? secret.trim() : "";
    const key = trimmed.startsWith("whsec_") ? base64Bytes(trimmed.slice("whsec_".length)) : undefined;
    if (!key) {
        throw new WebhookVerificationError("The webhook signing secret must be the whsec_ secret from your subscription");
    }
    return key;
}

/**
 * A private copy of the body. The signature is checked and the JSON parsed from this one copy,
 * so changing the caller's buffer while verification awaits can't change what is returned.
 */
function bodyBytes(payload: string | Uint8Array | ArrayBuffer): Uint8Array {
    if (typeof payload === "string") return encoder.encode(payload);
    // isView and the tag check also work for bytes made in another realm (an iframe, a VM context).
    if (ArrayBuffer.isView(payload)) return new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength).slice();
    if (Object.prototype.toString.call(payload) === "[object ArrayBuffer]") return new Uint8Array(payload as ArrayBuffer).slice();
    throw new WebhookVerificationError(
        "Pass the raw request body (a string, Buffer, Uint8Array or ArrayBuffer) exactly as received, not parsed JSON",
    );
}

function subtleCrypto(): SubtleCrypto {
    const subtle = (globalThis as { crypto?: Crypto }).crypto?.subtle;
    if (!subtle) {
        throw new WebhookVerificationError("Web Crypto (globalThis.crypto.subtle) isn't available; use Node.js 20 or later");
    }
    return subtle;
}

/**
 * Checks that a webhook request came from Blujay, then returns the parsed event.
 *
 * Pass the raw request body exactly as received (a string or bytes), not parsed JSON.
 * Rejects with `WebhookVerificationError` when the request can't be trusted.
 *
 * ```ts
 * const event = await verifyWebhook(rawBody, req.headers, process.env.BLUJAY_WEBHOOK_SECRET!);
 * if (event.event_type === "message.received") console.log(event.data.text);
 * ```
 */
export async function verifyWebhook(
    payload: string | Uint8Array | ArrayBuffer,
    headers: WebhookHeaders,
    secret: string,
    options: VerifyWebhookOptions = {},
): Promise<WebhookEvent> {
    const body = bodyBytes(payload);
    const id = header(headers, "webhook-id");
    const timestamp = header(headers, "webhook-timestamp");
    const signatures = header(headers, "webhook-signature");
    const keyBytes = decodeSecret(secret);

    if (!/^\d{1,15}$/.test(timestamp)) throw new WebhookVerificationError("Invalid webhook-timestamp header");
    const nowSeconds = Math.floor((options.now ?? new Date()).getTime() / 1000);
    const tolerance = options.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
    if (Math.abs(nowSeconds - Number(timestamp)) > tolerance) {
        throw new WebhookVerificationError("The webhook timestamp is too far from the current time");
    }

    const prefix = encoder.encode(`${id}.${timestamp}.`);
    const signed = new Uint8Array(prefix.length + body.length);
    signed.set(prefix);
    signed.set(body, prefix.length);

    const subtle = subtleCrypto();
    const key = await subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    let matched = false;
    for (const entry of signatures.trim().split(/\s+/)) {
        const given = entry.startsWith("v1,") ? base64Bytes(entry.slice(3)) : undefined;
        // subtle.verify compares in constant time.
        if (given && given.length === 32 && (await subtle.verify("HMAC", key, given, signed))) {
            matched = true;
            break;
        }
    }
    if (!matched) throw new WebhookVerificationError("The webhook signature doesn't match");

    return JSON.parse(new TextDecoder().decode(body)) as WebhookEvent;
}
