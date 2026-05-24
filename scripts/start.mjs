import { spawn } from "node:child_process";

const port = process.env.PORT || "3000";
const host = process.env.HOSTNAME || "0.0.0.0";

console.log(`Starting Ely on ${host}:${port}`);

const child = spawn("npx", ["next", "start", "-H", host, "-p", port], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
