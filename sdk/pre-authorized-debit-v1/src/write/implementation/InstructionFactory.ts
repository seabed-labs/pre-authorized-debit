/* eslint-disable @typescript-eslint/no-unused-vars */
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { DebitParams } from "../../anchor-client";
import {
  ApproveSmartDelegateParams,
  ClosePreAuthorizationAsOwnerParams,
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
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { IDL, PreAuthorizedDebitV1 } from "../../pre_authorized_debit_v1";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { DEVNET_PAD_PROGRAM_ID, MAINNET_PAD_PROGRAM_ID } from "../../constants";
import {
  PreAuthorizedDebitReadClient,
  PreAuthorizedDebitReadClientImpl,
} from "../../read";
import { NoPreAuthorizationFound } from "../../errors";
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
  ): InstructionFactory {
    return new InstructionFactoryImpl(
      connection,
      programId,
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

  public async buildInitOneTimePreAuthorizationIx(
    params: InitOneTimePreAuthorizationParams,
  ): Promise<InstructionWithMetadata<InitOneTimePreAuthorizationResult>> {
    throw new Error("Method not implemented");
  }

  public async buildInitRecurringPreAuthorizationIx(
    params: InitRecurringPreAuthorizationParams,
  ): Promise<InstructionWithMetadata<{ preAuthorization: PublicKey }>> {
    throw new Error("Method not implemented");
  }

  // TODO: De-dupe this with unpause method
  public async buildPausePreAuthorizationIx(
    params: PausePreAuthorizationParams,
  ): Promise<InstructionWithMetadata<PausePreAuthorizationResult>> {
    const { preAuthorization: preAuthorizationPubkey } = params;

    const preAuthorization = await this.readClient.fetchPreAuthorization({
      publicKey: preAuthorizationPubkey,
    });

    if (preAuthorization == null) {
      throw NoPreAuthorizationFound.givenPubkey(
        this.connection.rpcEndpoint,
        preAuthorizationPubkey,
      );
    }

    const tokenAccountInfo = await this.connection.getAccountInfo(
      preAuthorization.account.tokenAccount,
    );

    const tokenAccount = await getAccount(
      this.connection,
      preAuthorization.account.tokenAccount,
      undefined,
      tokenAccountInfo?.owner,
    );

    const pausePreAuthIx = await this.program.methods
      .updatePausePreAuthorization({ pause: true })
      .accounts({
        owner: tokenAccount.owner,
        tokenAccount: preAuthorization.account.tokenAccount,
        preAuthorization: preAuthorizationPubkey,
      })
      .instruction();

    return {
      instruction: pausePreAuthIx,
      expectedSigners: [
        {
          publicKey: tokenAccount.owner,
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

    const preAuthorization = await this.readClient.fetchPreAuthorization({
      publicKey: preAuthorizationPubkey,
    });

    if (preAuthorization == null) {
      throw NoPreAuthorizationFound.givenPubkey(
        this.connection.rpcEndpoint,
        preAuthorizationPubkey,
      );
    }

    const tokenAccountInfo = await this.connection.getAccountInfo(
      preAuthorization.account.tokenAccount,
    );

    const tokenAccount = await getAccount(
      this.connection,
      preAuthorization.account.tokenAccount,
      undefined,
      tokenAccountInfo?.owner,
    );

    const unpausePreAuthIx = await this.program.methods
      .updatePausePreAuthorization({ pause: false })
      .accounts({
        owner: tokenAccount.owner,
        tokenAccount: preAuthorization.account.tokenAccount,
        preAuthorization: preAuthorizationPubkey,
      })
      .instruction();

    return {
      instruction: unpausePreAuthIx,
      expectedSigners: [
        {
          publicKey: tokenAccount.owner,
          reason:
            "The pre-authorization's token account's owner needs to sign to unpause it",
        },
      ],
      meta: undefined,
    };
  }

  public async buildClosePreAuthorizationAsOwnerIx(
    params: ClosePreAuthorizationAsOwnerParams,
  ): Promise<InstructionWithMetadata<void>> {
    throw new Error("Method not implemented");
  }

  public async buildClosePreAuthorizationAsDebitAuthorityIx(params: {
    preAuthorization: PublicKey;
  }): Promise<InstructionWithMetadata<void>> {
    throw new Error("Method not implemented");
  }

  public async buildDebitIx(
    params: DebitParams,
  ): Promise<InstructionWithMetadata<void>> {
    throw new Error("Method not implemented");
  }

  public async buildApproveSmartDelegateIx(
    params: ApproveSmartDelegateParams,
  ): Promise<InstructionWithMetadata<void>> {
    throw new Error("Method not implemented");
  }
}
