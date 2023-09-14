import { PublicKey, TransactionInstruction } from "@solana/web3.js";

export type ProgramAccount<T> = {
  pubkey: PublicKey;
  data: T;
};

// Instruction Factory Return Type Wrapper
export type InstructionWithData<T> = {
  instruction: TransactionInstruction;
  expectedSigners: PublicKey[];
  data: T;
};

// Transaction Factory Return Type Wrapper
export type TransactionWithData<T> = {
  instructions: TransactionInstruction[];
  cleanupInstructions: TransactionInstruction[];
  expectedSigners: PublicKey[];
  data: T;
};

// Write Client Return Type Wrapper
export type TransactionResultWithData<T> = {
  signature: string;
  data: T;
};
