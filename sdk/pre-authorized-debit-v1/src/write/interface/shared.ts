import { Provider } from "@coral-xyz/anchor";
import { PublicKey, Signer, TransactionInstruction } from "@solana/web3.js";

// Instruction Factory Return Type Wrapper
export type InstructionWithData<T> = {
  instruction: TransactionInstruction;
  expectedSigners: PublicKey[];
  data: T;
};

// Transaction Factory Return Type Wrapper
export type TransactionWithData<T> = {
  setupInstructions: TransactionInstruction[];
  coreInstructions: TransactionInstruction[];
  cleanupInstructions: TransactionInstruction[];
  expectedSigners: PublicKey[];
  data: T;
  // TODO: How do we implement this?
  simulate(
    signers: Signer[],
    // if provider is not given, signers[0] will pay for TX fees
    provider?: Provider,
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