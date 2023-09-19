import { Provider } from "@coral-xyz/anchor";
import { PublicKey, Signer, TransactionInstruction } from "@solana/web3.js";

// Instruction Factory Return Type Wrapper
export type InstructionWithMetadata<T> = {
  instruction: TransactionInstruction;
  expectedSigners: { publicKey: PublicKey; reason: string }[];
  meta: T;
};

// Transaction Factory Return Type Wrapper
export type TransactionWithMetadata<T> = {
  setupInstructions: TransactionInstruction[];
  coreInstructions: TransactionInstruction[];
  cleanupInstructions: TransactionInstruction[];
  expectedSigners: PublicKey[];
  meta: T;
  // TODO: How do we implement this?
  simulate(
    signers: Signer[],
    // if provider is not given, signers[0] will pay for TX fees
    provider?: Provider,
    // TODO: Probably need a different return type
  ): Promise<TransactionResultWithData<T>>;
  execute(
    signers: Signer[],
    // if provider is not given, signers[0] will pay for TX fees
    provider?: Provider,
  ): Promise<TransactionResultWithData<T>>;
};

// Write Client Return Type Wrapper
export type TransactionResultWithData<T> = {
  signature: string;
  data: T;
};
