import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function setup() {
  console.log("");
  const child = spawn("anchor", ["localnet"], {
    cwd: path.join(__dirname, "../../../../"),
  });
  globalThis.__INTEG_TEST_SERVER_PID__ = child.pid;
  child.stderr.on("data", (data) => {
    const str = data.toString().trim();
    console.log("[server]", str);
  });

  child.stderr.on("data", (data) => {
    const str = data.toString().trim();
    console.log("[server]", str);
  });

  console.log("polling validator...");
  while (true) {
    try {
      const res = await fetch("http://127.0.0.1:8899/health", {
        method: "GET",
      });
      console.log(res.status);
      return;
    } catch (e) {}
  }
}
