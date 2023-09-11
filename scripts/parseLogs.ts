import {
  AnchorProvider,
  EventParser,
  Program,
  Wallet,
} from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const PRE_AUTHORIZED_DEBIT_PROGRAM_ID = new PublicKey(
  "PadV1i1My8wazb6vi37UJ2s1yBDkFN5MYivYN6XgaaR",
);

const SAMPLE_LOGS = `Program logged: "Instruction: InitPreAuthorization"
Program invoked: System Program
Program returned success
Program invoked: Token Program
Program logged: "Instruction: Approve"
Program consumed: 2904 of 183008 compute units
Program returned success
Program data: U+LPG2BljqJTgli4Sz1aDSHm95cJxzN/yzxNmFyCLaxSlzaCxzNhM6WPekAOS/Tg4KLbrmUkymks1/MgO0yLpT8abAlD9GVfhLeszPIKoIJ5JBPmiu15iOQbSQGEh7KN8JS0xGJY4OM37bFC5a9uuN/g0KD/ILaKDE2XfrkX9WyFTthDDcCIFY3GJiIrcpD/xEnvbr0q/RgUihwWMOwSDu4SqO9IS93oAADh9QUAAAAADacAZQAAAABTgli4Sz1aDSHm95cJxzN/yzxNmFyCLaxSlzaCxzNhM31H/2QAAAAA
Program consumed: 22086 of 200000 compute units
Program returned success`;

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

  const connection = new Connection(ENV_CONFIG.SOLANA_RPC_URL as string, {
    commitment: "confirmed",
  });

  return {
    signer,
    connection,
  };
}

async function main() {
  const config = loadConfigFromEnv();
  console.log(
    `Running against Solana Config: ${JSON.stringify(
      {
        genesisHash: await config.connection.getGenesisHash(),
        version: await config.connection.getVersion(),
        rpcEndpoint: config.connection.rpcEndpoint,
        signer: config.signer.publicKey,
        signerKeypairPath: ENV_CONFIG.SOLANA_KEYPAIR_PATH as string,
        padProgramId: PRE_AUTHORIZED_DEBIT_PROGRAM_ID.toBase58(),
      },
      null,
      2,
    )}\n`,
  );

  const provider = new AnchorProvider(
    config.connection,
    new Wallet(config.signer),
    { commitment: "confirmed" },
  );

  const program = await Program.at(PRE_AUTHORIZED_DEBIT_PROGRAM_ID, provider);
  const eventParser = new EventParser(program.programId, program.coder);
  const events = eventParser.parseLogs(SAMPLE_LOGS.split("\n"));
  for (const event of events) {
    console.log("Event:", JSON.stringify(event));
  }
}

if (require.main === module) {
  main();
}
