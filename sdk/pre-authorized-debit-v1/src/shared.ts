import { PublicKey } from "@solana/web3.js";

export type ProgramAccount<T> = {
  pubkey: PublicKey;
  data: T;
};
