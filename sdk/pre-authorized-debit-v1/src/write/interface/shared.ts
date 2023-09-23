import {
  Connection,
  PublicKey,
  SendOptions,
  Signer,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";

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
  expectedSigners: { publicKey: PublicKey; reason: string }[];
  meta: T;
  buildVersionedTransaction(
    signers?: Signer[],
    // TODO: Add documentation: defaults to signers[0]
    txFeesPayer?: PublicKey,
  ): Promise<VersionedTransaction>;
  // TODO: How do we implement this?
  simulate(
    signers?: Signer[],
    // TODO: Add documentation: defaults to signers[0]
    txFeesPayer?: PublicKey,
  ): Promise<TransactionSimulationResultWithMeta<T>>;
  execute(
    options?: SendOptions,
    signers?: Signer[],
    // TODO: Add documentation: defaults to signers[0]
    txFeesPayer?: PublicKey,
  ): Promise<TransactionResultWithMeta<T>>;
};

export type TransactionSimulationResultWithMeta<T> = {
  result: Awaited<ReturnType<typeof Connection.prototype.simulateTransaction>>;
  meta: T;
};

export type TransactionResultWithMeta<T> = {
  signature: string;
  meta: T;
};
