#!/usr/bin/env node
import net from "node:net";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

const START_PORT = Number.parseInt(process.env.SILU_PORT_START ?? "3000", 10);
const MAX_PORT = Number.parseInt(process.env.SILU_PORT_MAX ?? "3999", 10);
const command = process.argv[2] ?? "dev";
const extraArgs = process.argv.slice(3);

function findAvailablePort(start, end) {
  return new Promise((resolve, reject) => {
    let port = start;

    function tryNext() {
      if (port > end) {
        reject(
          new Error(`No available port in range ${start}-${end}. Try setting SILU_PORT_MAX higher.`)
        );
        return;
      }
      const server = net.createServer();
      server.unref();
      server.on("error", () => {
        port += 1;
        tryNext();
      });
      server.listen(port, () => {
        server.close(() => resolve(port));
      });
    }

    tryNext();
  });
}

(async function main() {
  let port = START_PORT;

  if (command === "dev" || command === "start") {
    try {
      port = await findAvailablePort(START_PORT, MAX_PORT);
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
    process.env.PORT = String(port);
  }

  // Resolve next binary via require (works with pnpm / npm / yarn hoisted layouts)
  const req = createRequire(import.meta.url);
  const nextPkg = req.resolve("next/package.json");
  const nextBin = path.join(path.dirname(nextPkg), "dist", "bin", "next");
  const nextArgs = [command];

  if (command === "dev" || command === "start") {
    nextArgs.push("-p", String(port));
  }
  nextArgs.push(...extraArgs);

  // run through node, since the next entry is a .js file (not a standalone binary)
  const child = spawn(process.execPath, [nextBin, ...nextArgs], {
    stdio: "inherit",
    env: { ...process.env },
  });

  child.on("error", (err) => {
    console.error(`Failed to launch '${nextBin} ${nextArgs.join(" ")}':`, err.message);
    process.exit(1);
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });

  const shutdown = () => child.kill("SIGTERM");
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
})();
