import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";

const PRE_AUTHORIZED_DEBIT_PROGRAM_ID = new PublicKey(
  "PadV1i1My8wazb6vi37UJ2s1yBDkFN5MYivYN6XgaaR",
);

async function fetchOnChainIdl() {
  const connection = new Connection(clusterApiUrl("mainnet-beta"));
  // read-only provider
  const provider = new AnchorProvider(
    connection,
    new Wallet(Keypair.generate()),
    { commitment: "processed" },
  );
  const preAuthorizedDebitV1Program = await Program.at(
    PRE_AUTHORIZED_DEBIT_PROGRAM_ID,
    provider,
  );
  return preAuthorizedDebitV1Program.idl;
}

async function main() {
  const idl = await fetchOnChainIdl();
  console.log(JSON.stringify(idl, null, 2));
}

main().catch((e) => console.log(e));
