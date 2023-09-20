/* eslint-disable @typescript-eslint/no-unused-vars */
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  ApproveSmartDelegateParams,
  ClosePreAuthorizationAsDebitAuthorityParams,
  ClosePreAuthorizationAsDebitAuthorityResult,
  ClosePreAuthorizationAsOwnerParams,
  ClosePreAuthorizationAsOwnerResult,
  DebitParams,
  DebitResult,
  InitOneTimePreAuthorizationParams,
  InitOneTimePreAuthorizationResult,
  InitRecurringPreAuthorizationParams,
  InitSmartDelegateParams,
  InitSmartDelegateResult,
  InstructionFactory,
  InstructionWithMetadata,
  PausePreAuthorizationParams,
  PausePreAuthorizationResult,
  UnpausePreAuthorizationParams,
  UnpausePreAuthorizationResult,
} from "../interface";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { IDL, PreAuthorizedDebitV1 } from "../../pre_authorized_debit_v1";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import {
  DEVNET_PAD_PROGRAM_ID,
  MAINNET_PAD_PROGRAM_ID,
  U64_MAX,
} from "../../constants";
import {
  PreAuthorizedDebitReadClient,
  PreAuthorizedDebitReadClientImpl,
} from "../../read";
import {
  NoPreAuthorizationFound,
  SmartDelegateNotSet,
  SmartDelegatedAmountNotEnough,
} from "../../errors";
import { dateToUnixTimestamp } from "../../utils";
import { getAccount } from "@solana/spl-token";

export class InstructionFactoryImpl implements InstructionFactory {
  private readonly program: Program<PreAuthorizedDebitV1>;

  // eslint-disable-next-line no-useless-constructor
  private constructor(
    private readonly connection: Connection,
    private readonly programId: PublicKey,
    private readonly readClient: PreAuthorizedDebitReadClient,
  ) {
    const readonlyProvider = new AnchorProvider(
      this.connection,
      new NodeWallet(Keypair.generate()),
      { commitment: this.connection.commitment },
    );

    this.program = new Program(IDL, this.programId, readonlyProvider);
  }

  public static custom(
    connection: Connection,
    programId: PublicKey,
    readClient?: PreAuthorizedDebitReadClient,
  ): InstructionFactory {
    return new InstructionFactoryImpl(
      connection,
      programId,
      readClient ??
        PreAuthorizedDebitReadClientImpl.custom(connection, programId),
    );
  }

  public static mainnet(connection: Connection): InstructionFactory {
    return InstructionFactoryImpl.custom(connection, MAINNET_PAD_PROGRAM_ID);
  }

  public static devnet(connection: Connection): InstructionFactory {
    return InstructionFactoryImpl.custom(connection, DEVNET_PAD_PROGRAM_ID);
  }

  public async buildInitSmartDelegateIx(
    params: InitSmartDelegateParams,
  ): Promise<InstructionWithMetadata<InitSmartDelegateResult>> {
    const { payer } = params;
    const smartDelegate = this.readClient.getSmartDelegatePDA().publicKey;
    const initSmartDelegateIx = await this.program.methods
      .initSmartDelegate()
      .accounts({
        payer,
        smartDelegate,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    return {
      instruction: initSmartDelegateIx,
      expectedSigners: [
        {
          publicKey: payer,
          reason:
            "The 'payer' account needs to sign to pay for the creation of the smart delegate account",
        },
      ],
      meta: {
        smartDelegate,
      },
    };
  }

  // TODO: Dedupe with recurrig pre auth IX
  public async buildInitOneTimePreAuthorizationIx(
    params: InitOneTimePreAuthorizationParams,
  ): Promise<InstructionWithMetadata<InitOneTimePreAuthorizationResult>> {
    const {
      payer,
      tokenAccount,
      debitAuthority,
      activation,
      amountAuthorized,
      expiry,
    } = params;

    const activationUnixTimestamp = BigInt(dateToUnixTimestamp(activation));
    const expiryUnixTimestamp = expiry
      ? BigInt(dateToUnixTimestamp(expiry))
      : U64_MAX;

    const tokenAccountOwner =
      await this.readClient.fetchCurrentOwnerOfTokenAccount(tokenAccount);

    const tokenProgramId =
      await this.readClient.fetchTokenProgramIdForTokenAccount(tokenAccount);

    const preAuthorization = this.readClient.derivePreAuthorizationPDA(
      tokenAccount,
      debitAuthority,
    ).publicKey;

    const initOneTimePreAuthorizationIx = await this.program.methods
      .initPreAuthorization({
        variant: {
          oneTime: {
            amountAuthorized: new BN(amountAuthorized.toString()),
            expiryUnixTimestamp: new BN(expiryUnixTimestamp.toString()),
          },
        },
        debitAuthority,
        activationUnixTimestamp: new BN(activationUnixTimestamp.toString()),
      })
      .accounts({
        payer,
        owner: tokenAccountOwner,
        smartDelegate: this.readClient.getSmartDelegatePDA().publicKey,
        tokenAccount,
        preAuthorization,
        tokenProgram: tokenProgramId,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    return {
      instruction: initOneTimePreAuthorizationIx,
      expectedSigners: [
        {
          publicKey: payer,
          reason:
            "The 'payer' account needs to sign to pay for the creation of the pre-authorization account",
        },
        {
          publicKey: tokenAccountOwner,
          reason:
            "The 'owner' (i.e. token account's owner) needs to sign to create a pre-authorization for a token account",
        },
      ],
      meta: {
        preAuthorization,
      },
    };
  }

  // TODO: Dedupe this with the recurring pre-auth IX
  public async buildInitRecurringPreAuthorizationIx(
    params: InitRecurringPreAuthorizationParams,
  ): Promise<InstructionWithMetadata<{ preAuthorization: PublicKey }>> {
    const {
      payer,
      tokenAccount,
      debitAuthority,
      activation,
      repeatFrequencySeconds,
      recurringAmountAuthorized,
      resetEveryCycle,
      numCycles,
    } = params;

    const activationUnixTimestamp = BigInt(dateToUnixTimestamp(activation));

    const tokenAccountOwner =
      await this.readClient.fetchCurrentOwnerOfTokenAccount(tokenAccount);

    const tokenProgramId =
      await this.readClient.fetchTokenProgramIdForTokenAccount(tokenAccount);

    const preAuthorization = this.readClient.derivePreAuthorizationPDA(
      tokenAccount,
      debitAuthority,
    ).publicKey;

    const initRecurringPreAuthorizationIx = await this.program.methods
      .initPreAuthorization({
        variant: {
          recurring: {
            repeatFrequencySeconds: new BN(repeatFrequencySeconds.toString()),
            resetEveryCycle,
            recurringAmountAuthorized: new BN(
              recurringAmountAuthorized.toString(),
            ),
            numCycles: numCycles != null ? new BN(numCycles.toString()) : null,
          },
        },
        debitAuthority,
        activationUnixTimestamp: new BN(activationUnixTimestamp.toString()),
      })
      .accounts({
        payer,
        owner: tokenAccountOwner,
        smartDelegate: this.readClient.getSmartDelegatePDA().publicKey,
        tokenAccount,
        preAuthorization,
        tokenProgram: tokenProgramId,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    return {
      instruction: initRecurringPreAuthorizationIx,
      expectedSigners: [
        {
          publicKey: payer,
          reason:
            "The 'payer' account needs to sign to pay for the creation of the pre-authorization account",
        },
        {
          publicKey: tokenAccountOwner,
          reason:
            "The 'owner' (i.e. token account's owner) needs to sign to create a pre-authorization for a token account",
        },
      ],
      meta: {
        preAuthorization,
      },
    };
  }

  // TODO: De-dupe this with unpause method
  public async buildPausePreAuthorizationIx(
    params: PausePreAuthorizationParams,
  ): Promise<InstructionWithMetadata<PausePreAuthorizationResult>> {
    const { preAuthorization: preAuthorizationPubkey } = params;

    const preAuthorization = await this.fetchPreAuthorizationOrThrow(
      preAuthorizationPubkey,
    );

    const tokenAccountOwner =
      await this.readClient.fetchCurrentOwnerOfPreAuthTokenAccount(
        preAuthorizationPubkey,
      );

    const pausePreAuthIx = await this.program.methods
      .updatePausePreAuthorization({ pause: true })
      .accounts({
        owner: tokenAccountOwner,
        tokenAccount: preAuthorization.account.tokenAccount,
        preAuthorization: preAuthorizationPubkey,
      })
      .instruction();

    return {
      instruction: pausePreAuthIx,
      expectedSigners: [
        {
          publicKey: tokenAccountOwner,
          reason:
            "The pre-authorization's token account's owner needs to sign to pause it",
        },
      ],
      meta: undefined,
    };
  }

  // TODO: De-dupe this with pause method
  public async buildUnpausePreAuthorizationIx(
    params: UnpausePreAuthorizationParams,
  ): Promise<InstructionWithMetadata<UnpausePreAuthorizationResult>> {
    const { preAuthorization: preAuthorizationPubkey } = params;

    const preAuthorization = await this.fetchPreAuthorizationOrThrow(
      preAuthorizationPubkey,
    );

    const tokenAccountOwner =
      await this.readClient.fetchCurrentOwnerOfPreAuthTokenAccount(
        preAuthorizationPubkey,
      );

    const unpausePreAuthIx = await this.program.methods
      .updatePausePreAuthorization({ pause: false })
      .accounts({
        owner: tokenAccountOwner,
        tokenAccount: preAuthorization.account.tokenAccount,
        preAuthorization: preAuthorizationPubkey,
      })
      .instruction();

    return {
      instruction: unpausePreAuthIx,
      expectedSigners: [
        {
          publicKey: tokenAccountOwner,
          reason:
            "The pre-authorization's token account's owner needs to sign to unpause it",
        },
      ],
      meta: undefined,
    };
  }

  public async buildClosePreAuthorizationAsOwnerIx(
    params: ClosePreAuthorizationAsOwnerParams,
  ): Promise<InstructionWithMetadata<ClosePreAuthorizationAsOwnerResult>> {
    const { preAuthorization: preAuthorizationPubkey, rentReceiver } = params;

    const preAuthorization = await this.fetchPreAuthorizationOrThrow(
      preAuthorizationPubkey,
    );

    const tokenAccountOwner =
      await this.readClient.fetchCurrentOwnerOfPreAuthTokenAccount(
        preAuthorizationPubkey,
      );

    const closePreAuthIx = await this.program.methods
      .closePreAuthorization()
      .accounts({
        receiver: rentReceiver ?? tokenAccountOwner,
        authority: tokenAccountOwner,
        tokenAccount: preAuthorization.account.tokenAccount,
      })
      .instruction();

    return {
      instruction: closePreAuthIx,
      expectedSigners: [
        {
          publicKey: tokenAccountOwner,
          reason:
            "The pre-authorization's token account's owner needs to sign to close it",
        },
      ],
      meta: undefined,
    };
  }

  public async buildClosePreAuthorizationAsDebitAuthorityIx(
    params: ClosePreAuthorizationAsDebitAuthorityParams,
  ): Promise<
    InstructionWithMetadata<ClosePreAuthorizationAsDebitAuthorityResult>
  > {
    const { preAuthorization: preAuthorizationPubkey } = params;

    const preAuthorization = await this.fetchPreAuthorizationOrThrow(
      preAuthorizationPubkey,
    );

    const tokenAccountOwner =
      await this.readClient.fetchCurrentOwnerOfPreAuthTokenAccount(
        preAuthorizationPubkey,
      );

    const closePreAuthIx = await this.program.methods
      .closePreAuthorization()
      .accounts({
        receiver: tokenAccountOwner,
        authority: preAuthorization.account.debitAuthority,
        tokenAccount: preAuthorization.account.tokenAccount,
      })
      .instruction();

    return {
      instruction: closePreAuthIx,
      expectedSigners: [
        {
          publicKey: preAuthorization.account.debitAuthority,
          reason:
            "The pre-authorization's debit authority needs to sign to close it",
        },
      ],
      meta: undefined,
    };
  }

  public async buildDebitIx(
    params: DebitParams,
  ): Promise<InstructionWithMetadata<DebitResult>> {
    const {
      preAuthorization: preAuthorizationPubkey,
      amount,
      destinationTokenAccount,
      checkSmartDelegateEnabled = true,
    } = params;

    const preAuthorizationAccount = (
      await this.readClient.fetchPreAuthorization({
        publicKey: preAuthorizationPubkey,
      })
    )?.account;

    if (!preAuthorizationAccount) {
      throw NoPreAuthorizationFound.givenPubkey(
        this.connection.rpcEndpoint,
        preAuthorizationPubkey,
      );
    }

    const debitAuthority = preAuthorizationAccount.debitAuthority;
    const tokenAccount = preAuthorizationAccount.tokenAccount;
    const tokenProgramId =
      await this.readClient.fetchTokenProgramIdForTokenAccount(tokenAccount);

    const tokenAccountData = await getAccount(
      this.connection,
      tokenAccount,
      undefined,
      tokenProgramId,
    );

    const mint = tokenAccountData.mint;

    const smartDelegate = this.readClient.getSmartDelegatePDA().publicKey;

    if (checkSmartDelegateEnabled) {
      const currentDelegation =
        await this.readClient.fetchCurrentDelegationOfTokenAccount(
          preAuthorizationAccount.tokenAccount,
        );

      if (!currentDelegation || currentDelegation.delegate !== smartDelegate) {
        throw new SmartDelegateNotSet(
          this.connection.rpcEndpoint,
          tokenAccount,
        );
      }

      if (currentDelegation.delgatedAmount < amount) {
        throw new SmartDelegatedAmountNotEnough(
          this.connection.rpcEndpoint,
          tokenAccount,
        );
      }
    }

    const debitIx = await this.program.methods
      .debit({ amount: new BN(amount.toString()) })
      .accounts({
        debitAuthority,
        mint,
        tokenAccount,
        destinationTokenAccount,
        smartDelegate,
        preAuthorization: preAuthorizationPubkey,
        tokenProgram: tokenProgramId,
      })
      .instruction();

    return {
      instruction: debitIx,
      expectedSigners: [
        {
          publicKey: debitAuthority,
          reason:
            "The debit_authority of the pre-authorization has to sign to debit funds against it",
        },
      ],
      meta: undefined,
    };
  }

  public async buildApproveSmartDelegateIx(
    params: ApproveSmartDelegateParams,
  ): Promise<InstructionWithMetadata<void>> {
    throw new Error("Method not implemented");
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
