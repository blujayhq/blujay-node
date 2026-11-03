// Hand-written (not generated): how BlujayError reads and prints an API error.
//
// Every Blujay error response has the same envelope:
//   { "status": "error", "error": { "code", "message", "retryable", "retry_after"? }, "trace_id" }
// The message is one line, for example:
//   401 UNAUTHORIZED: Authentication failed (trace_id trc_8f2a1c0e4b7d)

interface ErrorFields {
    code?: string;
    message?: string;
    docUrl?: string;
    retryable?: boolean;
    retryAfter?: number;
    traceId?: string;
}

const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const MAX_SNIPPET = 160;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The fields of a Blujay error envelope, or nothing when the body isn't one. */
export function readErrorBody(body: unknown): ErrorFields {
    if (!isRecord(body)) return {};
    const error = isRecord(body.error) ? body.error : {};
    return {
        code: typeof error.code === "string" ? error.code : undefined,
        message: typeof error.message === "string" ? error.message : undefined,
        docUrl: typeof error.doc_url === "string" ? error.doc_url : undefined,
        retryable: typeof error.retryable === "boolean" ? error.retryable : undefined,
        retryAfter: typeof error.retry_after === "number" && error.retry_after > 0 ? error.retry_after : undefined,
        traceId: typeof body.trace_id === "string" ? body.trace_id : undefined,
    };
}

/** Seconds from a `Retry-After` header (a number of seconds or an HTTP date). */
export function parseRetryAfter(value: string | null | undefined, now: number = Date.now()): number | undefined {
    if (value == null || value.trim() === "") return undefined;
    if (/^\s*\d+\s*$/.test(value)) {
        const seconds = Number(value);
        return seconds > 0 ? seconds : undefined;
    }
    const date = Date.parse(value);
    if (Number.isNaN(date)) return undefined;
    const seconds = Math.ceil((date - now) / 1000);
    return seconds > 0 ? seconds : undefined;
}

export function isRetryableStatus(statusCode: number | undefined): boolean {
    return statusCode != null && RETRYABLE_STATUSES.has(statusCode);
}

function snippet(text: string): string {
    const title = /<title[^>]*>([^<]*)<\/title>/i.exec(text)?.[1]?.trim();
    if (/^\s*</.test(text)) return title ? `HTML page "${title}"` : "HTML page instead of JSON";
    const oneLine = text.replace(/\s+/g, " ").trim();
    return oneLine.length > MAX_SNIPPET ? `${oneLine.slice(0, MAX_SNIPPET)}…` : oneLine;
}

/**
 * One line that says what went wrong. With an API error response:
 * `<status> <CODE>: <message> (trace_id <id>)`. Without one, the status and a
 * short piece of the body, or the message alone when there was no response
 * (a missing API key, a network failure, a timeout).
 */
export function formatErrorMessage({
    message,
    statusCode,
    body,
}: {
    message?: string;
    statusCode?: number;
    body?: unknown;
}): string {
    const fields = readErrorBody(body);
    if (fields.code != null || fields.message != null) {
        const head = [statusCode, fields.code].filter((part) => part != null).join(" ");
        const text = fields.message ?? message ?? "Request failed";
        const trace = fields.traceId != null ? ` (trace_id ${fields.traceId})` : "";
        return `${head ? `${head}: ` : ""}${text}${trace}`;
    }
    if (statusCode != null) {
        let detail: string | undefined;
        if (typeof body === "string" && body.trim() !== "") detail = snippet(body);
        else if (body != null && typeof body !== "string") detail = snippet(JSON.stringify(body) ?? String(body));
        return `${statusCode}: ${detail ?? message ?? "The response had no body"}`;
    }
    return message ?? "Request failed";
}
