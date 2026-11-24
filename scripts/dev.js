import { spawn } from "node:child_process";

const isWindows = process.platform === "win32";
const children = [
  spawn(isWindows ? "npm.cmd" : "npm", ["run", "dev"], { stdio: "inherit", shell: isWindows }),
  spawn(isWindows ? "npm.cmd" : "npm", ["run", "client"], { stdio: "inherit", shell: isWindows }),
];

function shutdown() {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
for (const child of children) {
  child.on("exit", (code) => {
    if (code && code !== 0) process.exitCode = code;
  });
}
