import { PublicKey } from "@solana/web3.js";

export class CustomError extends Error {}

export class IdlNotFoundOnChainError extends CustomError {
  constructor(programId: PublicKey) {
    super(`IDL not found on-chain for program ${programId.toBase58()}`);
  }
}
