const { existsSync } = require("fs");
const net = require("net");
const { spawn } = require("child_process");

function loadDotEnv() {
  if (!existsSync(".env")) {
    return;
  }

  const lines = require("fs").readFileSync(".env", "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const separator = line.indexOf("=");
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function canConnect(host, port, timeout = 1000) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const done = (result) => {
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeout);
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
    socket.once("timeout", () => done(false));
  });
}

async function waitForMysql(host, port) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await canConnect(host, port)) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return false;
}

async function main() {
  loadDotEnv();

  if (process.env.MYSQL_AUTO_START === "false") {
    return;
  }

  const host = process.env.MYSQL_HOST ?? "localhost";
  const port = Number(process.env.MYSQL_PORT ?? 3306);
  const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(host);

  if (!isLocalHost) {
    console.log(`[mysql] Skipping auto-start for non-local host: ${host}`);
    return;
  }

  if (await canConnect(host, port)) {
    console.log(`[mysql] Already running on ${host}:${port}`);
    return;
  }

  if (process.platform !== "win32") {
    console.log("[mysql] Auto-start is only configured for the local Windows MySQL install.");
    return;
  }

  const mysqldPath = process.env.MYSQLD_PATH ?? "C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysqld.exe";
  const defaultsFile = process.env.MYSQL_DEFAULTS_FILE ?? "C:\\ProgramData\\MySQL\\MySQL Server 8.4\\my.ini";

  if (!existsSync(mysqldPath)) {
    console.log(`[mysql] mysqld.exe not found at ${mysqldPath}`);
    return;
  }

  console.log("[mysql] Starting local MySQL server...");

  const child = spawn(mysqldPath, [`--defaults-file=${defaultsFile}`], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });

  child.unref();

  if (await waitForMysql(host, port)) {
    console.log(`[mysql] Started on ${host}:${port}`);
  } else {
    console.log("[mysql] Start command was sent, but MySQL did not become reachable in time.");
  }
}

main().catch((error) => {
  console.warn(`[mysql] Auto-start failed: ${error.message}`);
});
