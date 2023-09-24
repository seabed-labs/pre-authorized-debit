import {
  Connection,
  Keypair,
  Message,
  PublicKey,
  SendOptions,
  Signer,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  ApproveSmartDelegateParams,
  ApproveSmartDelegateResult,
  ExpectedSigner,
  InitSmartDelegateParams,
  InitSmartDelegateResult,
  InstructionFactory,
  PausePreAuthorizationParams,
  PausePreAuthorizationResult,
  TransactionFactory,
  TransactionWithMetadata,
  UnpausePreAuthorizationParams,
  UnpausePreAuthorizationResult,
} from "../interface";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import {
  DEVNET_PAD_PROGRAM_ID,
  IDL,
  MAINNET_PAD_PROGRAM_ID,
  PreAuthorizedDebitReadClient,
  PreAuthorizedDebitReadClientImpl,
  PreAuthorizedDebitV1,
  TransactionFeesPayerNotProvided,
} from "../..";
import { InstructionFactoryImpl } from "./InstructionFactory";

// TODO: Remove this after finishing impl (suppress TS errors until then)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export class TransactionFactoryImpl implements TransactionFactory {
  private readonly program: Program<PreAuthorizedDebitV1>;

  private constructor(
    private readonly connection: Connection,
    private readonly programId: PublicKey,
    private readonly readClient: PreAuthorizedDebitReadClient,
    private readonly ixFactory: InstructionFactory,
  ) {
    const readonlyProvider = new AnchorProvider(
      this.connection,
      new Wallet(Keypair.generate()),
      { commitment: this.connection.commitment },
    );

    this.program = new Program(IDL, this.programId, readonlyProvider);
  }

  public static custom(
    connection: Connection,
    programId: PublicKey,
    readClient?: PreAuthorizedDebitReadClient,
    ixFactory?: InstructionFactory,
  ): TransactionFactory {
    // TODO: Remove this after finishing impl (suppress TS errors until then)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return new TransactionFactoryImpl(
      connection,
      programId,
      readClient ??
        PreAuthorizedDebitReadClientImpl.custom(connection, programId),
      ixFactory ?? InstructionFactoryImpl.custom(connection, programId),
    );
  }

  public static mainnet(connection: Connection): TransactionFactory {
    return TransactionFactoryImpl.custom(connection, MAINNET_PAD_PROGRAM_ID);
  }

  public static devnet(connection: Connection): TransactionFactory {
    return TransactionFactoryImpl.custom(connection, DEVNET_PAD_PROGRAM_ID);
  }

  private async buildAndSignTx(
    instructions: TransactionInstruction[],
    signers?: Signer[],
    txFeesPayer?: PublicKey,
  ) {
    const payer = txFeesPayer ?? signers?.[0]?.publicKey;

    if (!payer) {
      throw new TransactionFeesPayerNotProvided();
    }

    const latestBlockhash = await this.connection.getLatestBlockhash();

    const message = Message.compile({
      payerKey: payer,
      instructions,
      recentBlockhash: latestBlockhash.blockhash,
    });

    const tx = new VersionedTransaction(message);
    if (signers) {
      tx.sign(signers);
    }

    return tx;
  }

  private buildSimulateFn<T>(
    txInstructions: TransactionInstruction[],
    meta: T,
  ) {
    return async (signers?: Signer[], txFeesPayer?: PublicKey) => {
      const tx = await this.buildAndSignTx(
        txInstructions,
        signers,
        txFeesPayer,
      );

      const result = await this.connection.simulateTransaction(tx);

      return {
        result,
        meta,
      };
    };
  }

  private buildExecuteFn<T>(txInstructions: TransactionInstruction[], meta: T) {
    return async (
      options?: SendOptions,
      signers?: Signer[],
      txFeesPayer?: PublicKey,
    ) => {
      const tx = await this.buildAndSignTx(
        txInstructions,
        signers,
        txFeesPayer,
      );

      const signature = await this.connection.sendTransaction(tx, options);
      const latestBlockhash = await this.connection.getLatestBlockhash();
      await this.connection.confirmTransaction({
        ...latestBlockhash,
        signature,
      });

      return {
        signature,
        meta,
      };
    };
  }

  private async wrapIxsInTx<T>(
    coreInstructions: TransactionInstruction[],
    expectedSigners: ExpectedSigner[],
    meta: T,
  ): Promise<TransactionWithMetadata<T>> {
    const setupInstructions: TransactionInstruction[] = [];
    const cleanupInstructions: TransactionInstruction[] = [];

    const coreTxInstructions = [
      ...setupInstructions,
      ...coreInstructions,
      ...cleanupInstructions,
    ];

    return {
      setupInstructions,
      coreInstructions,
      cleanupInstructions,
      expectedSigners,
      meta,
      buildVersionedTransaction: async (signers, txFeesPayer) => {
        return this.buildAndSignTx(coreTxInstructions, signers, txFeesPayer);
      },
      simulate: this.buildSimulateFn(coreTxInstructions, meta),
      execute: this.buildExecuteFn(coreTxInstructions, meta),
    };
  }

  public async buildInitSmartDelegateTx(
    params: InitSmartDelegateParams,
  ): Promise<TransactionWithMetadata<InitSmartDelegateResult>> {
    const initSmartDelegateIx =
      await this.ixFactory.buildInitSmartDelegateIx(params);

    return this.wrapIxsInTx(
      [initSmartDelegateIx.instruction],
      initSmartDelegateIx.expectedSigners,
      initSmartDelegateIx.meta,
    );
  }

  public async buildApproveSmartDelegateTx(
    params: ApproveSmartDelegateParams,
  ): Promise<TransactionWithMetadata<ApproveSmartDelegateResult>> {
    const approveSmartDelegateIx =
      await this.ixFactory.buildApproveSmartDelegateIx(params);

    return this.wrapIxsInTx(
      [approveSmartDelegateIx.instruction],
      approveSmartDelegateIx.expectedSigners,
      approveSmartDelegateIx.meta,
    );
  }

  public async buildPausePreAuthorizationTx(
    params: PausePreAuthorizationParams,
  ): Promise<TransactionWithMetadata<PausePreAuthorizationResult>> {
    const pausePreAuthIx =
      await this.ixFactory.buildPausePreAuthorizationIx(params);

    return this.wrapIxsInTx(
      [pausePreAuthIx.instruction],
      pausePreAuthIx.expectedSigners,
      pausePreAuthIx.meta,
    );
  }

  public async buildUnpausePreAuthorizationTx(
    params: UnpausePreAuthorizationParams,
  ): Promise<TransactionWithMetadata<UnpausePreAuthorizationResult>> {
    const unpausePreAuthIx =
      await this.ixFactory.buildUnpausePreAuthorizationIx(params);

    return this.wrapIxsInTx(
      [unpausePreAuthIx.instruction],
      unpausePreAuthIx.expectedSigners,
      unpausePreAuthIx.meta,
    );
  }
}
