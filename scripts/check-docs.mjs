// Type-checks every TypeScript sample in README.md and examples/ against src/,
// so the docs can't drift from the library.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const out = "build-docs-check";
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
const blocks = [...fs.readFileSync("README.md", "utf8").matchAll(/```ts\n([\s\S]*?)```/g)].map((m) => m[1]);
blocks.forEach((code, i) => {
    const pre = ['import * as __blujay from "blujay";'];
    // Names the README samples assume from earlier samples.
    if (!/const client\b/.test(code)) pre.push("declare const client: __blujay.BlujayClient;");
    if (!/import \{ randomUUID \}/.test(code)) pre.push("declare const randomUUID: () => string;");
    if (!/import \{[^}]*\bBlujayClient\b/.test(code)) pre.push("const BlujayClient = __blujay.BlujayClient;");
    if (!/const message\b/.test(code)) pre.push("declare const message: __blujay.Blujay.MessageInput;");
    pre.push("declare const rawBody: string;", "declare const req: { headers: Record<string, string> };");
    fs.writeFileSync(path.join(out, `readme-${i}.ts`), `${pre.join("\n")}\n${code}\nexport {};\n`);
});
for (const file of fs.readdirSync("examples").filter((f) => f.endsWith(".ts"))) {
    fs.copyFileSync(path.join("examples", file), path.join(out, `example-${file}`));
}
fs.copyFileSync("smoke/quickstart.ts", path.join(out, "smoke-quickstart.ts"));
// Every event type a subscription can ask for has a WebhookEvent member, so
// code that checks for it compiles.
fs.writeFileSync(path.join(out, "event-coverage.ts"), `import type { Blujay } from "blujay";
type Missing = Exclude<Blujay.WebhookSubscribableEventType, Blujay.WebhookEvent["event_type"]>;
export const everySubscribableEventIsTyped: [Missing] extends [never] ? true : Missing = true;
`);
// Frameworks the samples show but this library doesn't depend on.
fs.writeFileSync(path.join(out, "frameworks.d.ts"), `declare module "express" {
    interface Req { body: Buffer; headers: Record<string, string | string[] | undefined> }
    interface Res { sendStatus(code: number): void }
    interface App { post(path: string, ...handlers: Array<(req: Req, res: Res) => unknown>): void }
    interface Express { (): App; raw(options: { type: string }): (req: Req, res: Res) => unknown }
    const express: Express;
    export default express;
}
`);
fs.writeFileSync(path.join(out, "tsconfig.json"), JSON.stringify({
    compilerOptions: {
        strict: true, noEmit: true, skipLibCheck: true, target: "ES2022", module: "ESNext",
        moduleResolution: "Bundler", lib: ["ES2022", "DOM", "DOM.Iterable"], types: ["node"],
        noUnusedLocals: false, paths: { blujay: ["../src/index.ts"] },
    },
    include: ["*.ts"],
}));
execFileSync("npx", ["tsc", "-p", out], { stdio: "inherit" });
fs.rmSync(out, { recursive: true, force: true });
console.log(`check-docs: ${blocks.length} README samples and the examples type-check`);
