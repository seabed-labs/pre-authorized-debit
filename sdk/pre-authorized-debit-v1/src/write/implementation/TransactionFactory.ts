import {
  Connection,
  Message,
  PublicKey,
  SendOptions,
  Signer,
  SystemProgram,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  ApproveSmartDelegateParams,
  ApproveSmartDelegateResult,
  ClosePreAuthorizationAsDebitAuthorityParams,
  ClosePreAuthorizationAsDebitAuthorityResult,
  ClosePreAuthorizationAsOwnerParams,
  ClosePreAuthorizationAsOwnerResult,
  DebitParams,
  DebitResult,
  ExpectedSigner,
  InitOneTimePreAuthorizationParams,
  InitOneTimePreAuthorizationResult,
  InitRecurringPreAuthorizationParams,
  InitRecurringPreAuthorizationResult,
  InitSmartDelegateParams,
  InitSmartDelegateResult,
  InstructionFactory,
  PausePreAuthorizationParams,
  PausePreAuthorizationResult,
  TransactionFactory,
  TransactionWithMetadata,
  UnpausePreAuthorizationParams,
  UnpausePreAuthorizationResult,
  UnwrapNativeMintAdditionalParams,
  WrapNativeMintAdditionalParams,
} from "../interface";
import {
  DEVNET_PAD_PROGRAM_ID,
  MAINNET_PAD_PROGRAM_ID,
  NoPreAuthorizationFound,
  PreAuthorizedDebitReadClient,
  PreAuthorizedDebitReadClientImpl,
  TransactionFeesPayerNotProvided,
} from "../..";
import { InstructionFactoryImpl } from "./InstructionFactory";
import {
  createCloseAccountInstruction,
  createSyncNativeInstruction,
  getAccount,
} from "@solana/spl-token";

export class TransactionFactoryImpl implements TransactionFactory {
  // eslint-disable-next-line no-useless-constructor
  private constructor(
    private readonly connection: Connection,
    private readonly readClient: PreAuthorizedDebitReadClient,
    private readonly ixFactory: InstructionFactory,
  ) {}

  public static custom(
    connection: Connection,
    programId: PublicKey,
    readClient?: PreAuthorizedDebitReadClient,
    ixFactory?: InstructionFactory,
  ): TransactionFactory {
    return new TransactionFactoryImpl(
      connection,
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
    setupInstructions: TransactionInstruction[] = [],
    coreInstructions: TransactionInstruction[],
    cleanupInstructions: TransactionInstruction[] = [],
    expectedSigners: ExpectedSigner[],
    meta: T,
  ): Promise<TransactionWithMetadata<T>> {
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
      undefined,
      [initSmartDelegateIx.instruction],
      undefined,
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
      undefined,
      [approveSmartDelegateIx.instruction],
      undefined,
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
      undefined,
      [pausePreAuthIx.instruction],
      undefined,
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
      undefined,
      [unpausePreAuthIx.instruction],
      undefined,
      unpausePreAuthIx.expectedSigners,
      unpausePreAuthIx.meta,
    );
  }

  public async buildClosePreAuthorizationAsOwnerTx(
    params: ClosePreAuthorizationAsOwnerParams &
      UnwrapNativeMintAdditionalParams,
  ): Promise<TransactionWithMetadata<ClosePreAuthorizationAsOwnerResult>> {
    const closePreAuthAsOwnerIx =
      await this.ixFactory.buildClosePreAuthorizationAsOwnerIx(params);

    const cleanupInstructions: TransactionInstruction[] = [];

    const preAuthorization = await this.fetchPreAuthorizationOrThrow(
      params.preAuthorization,
    );

    const tokenProgramId =
      await this.readClient.fetchTokenProgramIdForTokenAccount(
        preAuthorization.account.tokenAccount,
      );

    const tokenAccount = await getAccount(
      this.connection,
      preAuthorization.account.tokenAccount,
      undefined,
      tokenProgramId,
    );

    if (tokenAccount.isNative && params.unwrapNativeMintParams) {
      cleanupInstructions.push(
        createCloseAccountInstruction(
          preAuthorization.account.tokenAccount,
          params.unwrapNativeMintParams.lamportsDestinationAccount ??
            tokenAccount.owner,
          tokenAccount.owner,
          undefined,
          tokenProgramId,
        ),
      );
    }

    return this.wrapIxsInTx(
      undefined,
      [closePreAuthAsOwnerIx.instruction],
      cleanupInstructions,
      closePreAuthAsOwnerIx.expectedSigners,
      closePreAuthAsOwnerIx.meta,
    );
  }

  public async buildClosePreAuthorizationAsDebitAuthorityTx(
    params: ClosePreAuthorizationAsDebitAuthorityParams,
  ): Promise<
    TransactionWithMetadata<ClosePreAuthorizationAsDebitAuthorityResult>
  > {
    const closePreAuthAsDebitAuthorityIx =
      await this.ixFactory.buildClosePreAuthorizationAsDebitAuthorityIx(params);

    return this.wrapIxsInTx(
      undefined,
      [closePreAuthAsDebitAuthorityIx.instruction],
      undefined,
      closePreAuthAsDebitAuthorityIx.expectedSigners,
      closePreAuthAsDebitAuthorityIx.meta,
    );
  }

  public async buildInitOneTimePreAuthorizationTx(
    params: InitOneTimePreAuthorizationParams & WrapNativeMintAdditionalParams,
  ): Promise<TransactionWithMetadata<InitOneTimePreAuthorizationResult>> {
    const initOneTimePreAuthorizationIx =
      await this.ixFactory.buildInitOneTimePreAuthorizationIx(params);

    const setupInstructions: TransactionInstruction[] = [];
    const additionalExpectedSigners: ExpectedSigner[] = [];

    const tokenProgramId =
      await this.readClient.fetchTokenProgramIdForTokenAccount(
        params.tokenAccount,
      );

    const tokenAccount = await getAccount(
      this.connection,
      params.tokenAccount,
      undefined,
      tokenProgramId,
    );

    if (tokenAccount.isNative && params.wrapNativeMintParams) {
      const { wrapLamportsAmount, lamportsSourceAccount } =
        params.wrapNativeMintParams;

      if (
        lamportsSourceAccount &&
        !lamportsSourceAccount.equals(tokenAccount.owner)
      ) {
        additionalExpectedSigners.push({
          publicKey: lamportsSourceAccount,
          reason: `${lamportsSourceAccount.toBase58()} needs to sign to debit lamports from it`,
        });
      }

      setupInstructions.push(
        SystemProgram.transfer({
          fromPubkey: lamportsSourceAccount ?? tokenAccount.owner,
          toPubkey: params.tokenAccount,
          lamports: wrapLamportsAmount,
        }),
      );

      setupInstructions.push(
        createSyncNativeInstruction(params.tokenAccount, tokenProgramId),
      );
    }

    return this.wrapIxsInTx(
      setupInstructions,
      [initOneTimePreAuthorizationIx.instruction],
      undefined,
      [
        ...initOneTimePreAuthorizationIx.expectedSigners,
        ...additionalExpectedSigners,
      ],
      initOneTimePreAuthorizationIx.meta,
    );
  }

  public async buildInitRecurringPreAuthorizationTx(
    params: InitRecurringPreAuthorizationParams &
      WrapNativeMintAdditionalParams,
  ): Promise<TransactionWithMetadata<InitRecurringPreAuthorizationResult>> {
    const initRecurringPreAuthorizationIx =
      await this.ixFactory.buildInitRecurringPreAuthorizationIx(params);

    const setupInstructions: TransactionInstruction[] = [];
    const additionalExpectedSigners: ExpectedSigner[] = [];

    const tokenProgramId =
      await this.readClient.fetchTokenProgramIdForTokenAccount(
        params.tokenAccount,
      );

    const tokenAccount = await getAccount(
      this.connection,
      params.tokenAccount,
      undefined,
      tokenProgramId,
    );

    if (tokenAccount.isNative && params.wrapNativeMintParams) {
      const { wrapLamportsAmount, lamportsSourceAccount } =
        params.wrapNativeMintParams;

      if (
        lamportsSourceAccount &&
        !lamportsSourceAccount.equals(tokenAccount.owner)
      ) {
        additionalExpectedSigners.push({
          publicKey: lamportsSourceAccount,
          reason: `${lamportsSourceAccount.toBase58()} needs to sign to debit lamports from it`,
        });
      }

      setupInstructions.push(
        SystemProgram.transfer({
          fromPubkey: lamportsSourceAccount ?? tokenAccount.owner,
          toPubkey: params.tokenAccount,
          lamports: wrapLamportsAmount,
        }),
      );

      setupInstructions.push(
        createSyncNativeInstruction(params.tokenAccount, tokenProgramId),
      );
    }

    return this.wrapIxsInTx(
      setupInstructions,
      [initRecurringPreAuthorizationIx.instruction],
      undefined,
      [
        ...initRecurringPreAuthorizationIx.expectedSigners,
        ...additionalExpectedSigners,
      ],
      initRecurringPreAuthorizationIx.meta,
    );
  }

  public async buildDebitTx(
    params: DebitParams & UnwrapNativeMintAdditionalParams,
  ): Promise<TransactionWithMetadata<DebitResult>> {
    const debitIx = await this.ixFactory.buildDebitIx(params);

    const cleanupInstructions: TransactionInstruction[] = [];
    const additionalExpectedSigners: ExpectedSigner[] = [];

    const preAuthorization = await this.fetchPreAuthorizationOrThrow(
      params.preAuthorization,
    );

    const tokenProgramId =
      await this.readClient.fetchTokenProgramIdForTokenAccount(
        params.destinationTokenAccount,
      );

    // NOTE: We don't create this token account, caller has to do it.
    const destinationTokenAccount = await getAccount(
      this.connection,
      params.destinationTokenAccount,
      undefined,
      tokenProgramId,
    );

    if (destinationTokenAccount.isNative && params.unwrapNativeMintParams) {
      if (
        !destinationTokenAccount.owner.equals(
          preAuthorization.account.debitAuthority,
        )
      ) {
        additionalExpectedSigners.push({
          publicKey: destinationTokenAccount.owner,
          reason: `The owner of token account ${destinationTokenAccount.address.toBase58()} (owner: ${destinationTokenAccount.owner.toBase58()}) has to sign to close it`,
        });
      }

      cleanupInstructions.push(
        createCloseAccountInstruction(
          params.destinationTokenAccount,
          params.unwrapNativeMintParams.lamportsDestinationAccount ??
            destinationTokenAccount.owner,
          destinationTokenAccount.owner,
          undefined,
          tokenProgramId,
        ),
      );
    }

    return this.wrapIxsInTx(
      undefined,
      [debitIx.instruction],
      cleanupInstructions,
      debitIx.expectedSigners,
      debitIx.meta,
    );
  }

  private async fetchPreAuthorizationOrThrow(pubkey: PublicKey) {
    const preAuthorization = await this.readClient.fetchPreAuthorization({
      publicKey: pubkey,
    });

    if (preAuthorization == null) {
      throw NoPreAuthorizationFound.givenPubkey(
        this.connection.rpcEndpoint,
        pubkey,
      );
    }

    return preAuthorization;
  }
}
