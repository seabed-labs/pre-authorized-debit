import {
  Connection,
  PublicKey,
  SendOptions,
  Signer,
  SimulateTransactionConfig,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";

export type ExpectedSigner = {
  publicKey: PublicKey;
  reason: string;
};

// Instruction Factory Return Type Wrapper
export type InstructionWithMetadata<T> = {
  instruction: TransactionInstruction;
  expectedSigners: ExpectedSigner[];
  meta: T;
};

// Transaction Factory Return Type Wrapper
export type TransactionWithMetadata<T> = {
  setupInstructions: TransactionInstruction[];
  coreInstructions: TransactionInstruction[];
  cleanupInstructions: TransactionInstruction[];
  expectedSigners: ExpectedSigner[];
  meta: T;
  buildVersionedTransaction(
    signers?: Signer[],
    txFeesPayer?: PublicKey,
  ): Promise<VersionedTransaction>;
  simulate(
    signers?: Signer[],
    txFeesPayer?: PublicKey,
    simulateConfig?: SimulateTransactionConfig,
  ): Promise<TransactionSimulationResultWithMeta<T>>;
  execute(
    options?: SendOptions,
    signers?: Signer[],
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
