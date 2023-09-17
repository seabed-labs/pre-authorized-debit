/* eslint-disable */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import { idlAddress } from "@coral-xyz/anchor/dist/cjs/idl.js";
import { PublicKey } from "@solana/web3.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getRawAccountInfo(address) {
  const response = await fetch("http://localhost:8899", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "1",
      method: "getAccountInfo",
      params: [
        address,
        {
          commitment: "finalized",
          encoding: "base64",
        },
      ],
    }),
  });
  return await response.json();
}

async function accountExists(address) {
  const accountInfo = await getRawAccountInfo(address.toString());
  console.log(accountInfo);
  return !!accountInfo?.result?.value?.lamports;
}

const onCloseHandler = (code) => {
  console.log(`child process exited with code ${code}`);
  process.exit(code);
};

export default async function setup() {
  console.log("");

  const programId = "PadV1i1My8wazb6vi37UJ2s1yBDkFN5MYivYN6XgaaR";
  const idlPub = await idlAddress(new PublicKey(programId));

  const localnet = spawn("anchor", ["localnet"], {
    cwd: path.join(__dirname, "../../../"),
  });
  globalThis.__INTEG_TEST_SERVER_PID__ = localnet.pid;

  // localnet.stdout.on("data", (data) => {
  //   const str = data.toString().trim();
  //   console.log("[server]", str);
  // });

  localnet.stderr.on("data", (data) => {
    const str = data.toString().trim();
    console.log("[server]", str);
  });

  localnet.on("close", onCloseHandler);

  console.log(`waiting to init program ${programId.toString()}...`);
  while (true) {
    try {
      if (await accountExists(programId)) {
        break;
      }
    } catch (e) {
      // console.log(e);
    }
  }

  // const idlDeploy = spawn("anchor", [
  //   "idl",
  //   "init",
  //   "--filepath",
  //   "./target/idl/pre_authorized_debit_v1.json",
  //   programId,
  // ], {
  //   cwd: path.join(__dirname, "../../../"),
  // });

  // idlDeploy.stdout.on("data", (data) => {
  //   const str = data.toString().trim();
  //   console.log("[server]", str);
  // });

  // idlDeploy.stderr.on('data', (data) => {
  //   accountExists(idlPub).then((exists) => {
  //     if (!exists) {
  //       console.log("idl deploy failed and idl does not exist on chain")
  //       console.error(`${data}`);
  //       process.exit(1)
  //     }
  //   })
  // });

  // idlDeploy.on('close', onCloseHandler);
  //
  // console.log(`waiting to init idl ${idlPub.toString()}...`);
  //
  // while (true) {
  //   try {
  //     if (await accountExists(idlPub)) {
  //       break;
  //     }
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }
}
