import {
  PublicKey,
  RpcResponseAndContext,
  SendOptions,
  Signer,
  SimulateTransactionConfig,
  SimulatedTransactionResponse,
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

/**
 * Provide either signers[0] or txFeesPayer at minimum, else method will throw.
 */
export type SignerAndTxFeePayerParams =
  | {
      signers: Signer[];
      /**
       * If this is undefined, signers[0] is used
       */
      txFeesPayer?: PublicKey;
    }
  | { txFeesPayer: PublicKey };

export type BuildVersionedTransactionParams = SignerAndTxFeePayerParams;

export type SimulateParams = SignerAndTxFeePayerParams & {
  simulateConfig?: SimulateTransactionConfig;
};

export type ExecuteParams = SignerAndTxFeePayerParams & {
  sendOptions?: SendOptions;
};

// Transaction Factory Return Type Wrapper
export type TransactionWithMetadata<T> = {
  setupInstructions: TransactionInstruction[];
  coreInstructions: TransactionInstruction[];
  cleanupInstructions: TransactionInstruction[];
  expectedSigners: ExpectedSigner[];
  meta: T;
  buildVersionedTransaction(
    params: BuildVersionedTransactionParams,
  ): Promise<VersionedTransaction>;
  simulate(
    params: SimulateParams,
  ): Promise<TransactionSimulationResultWithMeta<T>>;
  execute(params: ExecuteParams): Promise<TransactionResultWithMeta<T>>;
};

export type TransactionSimulationResultWithMeta<T> = {
  result: RpcResponseAndContext<SimulatedTransactionResponse>;
  meta: T;
};

export type TransactionResultWithMeta<T> = {
  signature: string;
  meta: T;
};
