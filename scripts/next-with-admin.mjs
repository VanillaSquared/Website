import { spawn } from "node:child_process";

const [, , command = "dev", ...args] = process.argv;
const forwardedArgs = [];
let admin = false;

for (const arg of args) {
  if (arg === "--admin") {
    admin = true;
  } else {
    forwardedArgs.push(arg);
  }
}

const child = spawn("next", [command, ...forwardedArgs], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    ...(admin ? { ADMIN_CODE_BYPASS: "1" } : {}),
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
