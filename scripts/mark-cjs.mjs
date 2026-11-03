// dist/cjs is CommonJS while the package itself is "type": "module".
import fs from "node:fs";
fs.writeFileSync("dist/cjs/package.json", JSON.stringify({ type: "commonjs" }) + "\n");
