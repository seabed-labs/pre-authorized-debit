import { PublicKey } from "@solana/web3.js";

export const MAINNET_PAD_PROGRAM_ID = new PublicKey(
  "PadV1i1My8wazb6vi37UJ2s1yBDkFN5MYivYN6XgaaR",
);

export const DEVNET_PAD_PROGRAM_ID = new PublicKey(
  "PadV1i1My8wazb6vi37UJ2s1yBDkFN5MYivYN6XgaaR",
);

export const U64_MAX = BigInt(2) ** BigInt(64) - BigInt(1);
export const I64_MAX = BigInt(2) ** BigInt(63) - BigInt(1);
