import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const buildIdPath = join(process.cwd(), ".next", "BUILD_ID");
const standaloneServer = join(process.cwd(), ".next", "standalone", "server.js");

if (!existsSync(buildIdPath) && !existsSync(standaloneServer)) {
  console.error(
    "[afresh] No production build found. Run `npm run build` before `npm start`."
  );
  process.exit(1);
}

const port = process.env.PORT || "8080";
const host = process.env.HOSTNAME || "0.0.0.0";
const env = { ...process.env, PORT: port, HOSTNAME: host };

const child = existsSync(standaloneServer)
  ? spawn("node", [standaloneServer], { stdio: "inherit", env })
  : spawn("npx", ["next", "start", "-H", host, "-p", port], {
      stdio: "inherit",
      shell: true,
      env,
    });

child.on("exit", (code) => process.exit(code ?? 1));
