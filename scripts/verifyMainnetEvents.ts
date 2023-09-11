import { AnchorProvider, EventParser, Program } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

import dotenv from "dotenv";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

dotenv.config();

const PRE_AUTHORIZED_DEBIT_PROGRAM_ID = new PublicKey(
  "PadV1i1My8wazb6vi37UJ2s1yBDkFN5MYivYN6XgaaR",
);

const rpc = process.env.SOLANA_RPC_URL;
if (!rpc) {
  throw new Error("SOLANA_RPC_URL");
}

const connection = new Connection(rpc, {
  commitment: "confirmed",
});

const provider = new AnchorProvider(connection, new NodeWallet(new Keypair()), {
  commitment: "confirmed",
});

async function main() {
  const program = await Program.at(PRE_AUTHORIZED_DEBIT_PROGRAM_ID, provider);
  const eventParser = new EventParser(program.programId, program.coder);
  const sigs = await connection.getSignaturesForAddress(
    PRE_AUTHORIZED_DEBIT_PROGRAM_ID,
  );

  for (let i = 0; i < sigs.length; i++) {
    const sig = sigs[i];
    try {
      console.log(`parsing ${sig.signature}`);
      const tx = await connection.getTransaction(sig.signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      if (!tx) {
        throw new Error(`Transaction ${sig.signature} is null`);
      }
      const eventGenerator = eventParser.parseLogs(tx.meta?.logMessages ?? []);
      const events = [...eventGenerator];
      console.log(JSON.stringify(events, null, 2));
    } catch (e) {
      console.log(`failed to parse logs from tx ${sig} with error ${e}`);
    }
  }
}

main()
  .then(() => console.log("done"))
  .catch((e) => console.log(e));
