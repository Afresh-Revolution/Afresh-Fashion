import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const buildIdPath = join(process.cwd(), ".next", "BUILD_ID");
if (!existsSync(buildIdPath)) {
  console.error(
    "[afresh] No production build found. Run `npm run build` before `npm start`."
  );
  process.exit(1);
}

const port = process.env.PORT || "8080";
const host = process.env.HOSTNAME || "0.0.0.0";

const child = spawn("npx", ["next", "start", "-H", host, "-p", port], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 1));
