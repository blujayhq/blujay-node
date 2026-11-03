// Hand-written (not generated): the library version sent in User-Agent.
// Keep it equal to package.json's version; `npm test` checks.
import { getUserAgent } from "../core/runtime/index.js";

export const SDK_VERSION = "1.0.0";

/** For example `blujay-node/1.0.0 (darwin; arm64) Node/22.11.0`: this library, the platform, the runtime. */
export function userAgent(): string {
    return getUserAgent("blujay-node", SDK_VERSION);
}
