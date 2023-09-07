import { InitPreAuthorization } from "@dcaf/pre-authorized-debit-v1";
import { Keypair, Connection } from "@solana/web3.js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

interface Config {
  signer: Keypair;
  connection: Connection;
}

const ENV_CONFIG = {
  SOLANA_KEYPAIR_PATH:
    process.env.SOLANA_KEYPAIR_PATH ?? new Error("SOLANA_KEYPAIR_PATH"),
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL ?? new Error("SOLANA_RPC_URL"),
};

function loadConfigFromEnv(): Config {
  const envErrors = Object.values(ENV_CONFIG).filter((v) => v instanceof Error);
  if (envErrors.length > 0) {
    throw new Error(
      `Missing environemnt variables: [${envErrors
        .map((e) => (e as Error).message)
        .join(", ")}]`,
    );
  }

  const solanaKeypairPath = path.resolve(
    ENV_CONFIG.SOLANA_KEYPAIR_PATH as string,
  );

  const decodedKey = new Uint8Array(
    JSON.parse(fs.readFileSync(solanaKeypairPath).toString()),
  );
  const signer = Keypair.fromSecretKey(decodedKey);

  const connection = new Connection(ENV_CONFIG.SOLANA_RPC_URL as string);

  return {
    signer,
    connection,
  };
}

export async function testDevnet() {
  const config = loadConfigFromEnv();
  console.log(
    `Testing against Solana Config: ${JSON.stringify(
      {
        genesisHash: await config.connection.getGenesisHash(),
        version: await config.connection.getVersion(),
        rpcEndpoint: config.connection.rpcEndpoint,
        signer: config.signer.publicKey,
        signerKeypairPath: ENV_CONFIG.SOLANA_KEYPAIR_PATH as string,
      },
      null,
      2,
    )}\n`,
  );
}

if (require.main === module) {
  testDevnet()
    .then(() => console.log("Done"))
    .catch((e) => console.error("Failed:\n", e));
}
