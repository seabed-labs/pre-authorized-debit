/* eslint-disable @typescript-eslint/no-unused-vars */
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { DebitParams } from "../../anchor-client";
import {
  ApproveSmartDelegateParams,
  ClosePreAuthorizationAsOwnerParams,
  InitOneTimePreAuthorizationParams,
  InitRecurringPreAuthorizationParams,
  InitSmartDelegateParams,
  InitSmartDelegateResult,
  InstructionFactory,
  InstructionWithData,
} from "../interface";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { IDL, PreAuthorizedDebitV1 } from "../../pre_authorized_debit_v1";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { DEVNET_PAD_PROGRAM_ID, MAINNET_PAD_PROGRAM_ID } from "../../constants";

export class InstructionFactoryImpl implements InstructionFactory {
  private readonly program: Program<PreAuthorizedDebitV1>;

  // eslint-disable-next-line no-useless-constructor
  private constructor(
    private readonly connection: Connection,
    private readonly programId: PublicKey,
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
    return new InstructionFactoryImpl(connection, programId);
  }

  public static mainnet(connection: Connection): InstructionFactory {
    return InstructionFactoryImpl.custom(connection, MAINNET_PAD_PROGRAM_ID);
  }

  public static devnet(connection: Connection): InstructionFactory {
    return InstructionFactoryImpl.custom(connection, DEVNET_PAD_PROGRAM_ID);
  }

  public async buildInitSmartDelegateIx(
    params: InitSmartDelegateParams,
  ): Promise<InstructionWithData<InitSmartDelegateResult>> {
    throw new Error("Method not implemented");
  }

  public async buildInitOneTimePreAuthorizationIx(
    params: InitOneTimePreAuthorizationParams,
  ): Promise<InstructionWithData<{ preAuthorization: PublicKey }>> {
    throw new Error("Method not implemented");
  }

  public async buildInitRecurringPreAuthorizationIx(
    params: InitRecurringPreAuthorizationParams,
  ): Promise<InstructionWithData<{ preAuthorization: PublicKey }>> {
    throw new Error("Method not implemented");
  }

  public async buildPausePreAuthorizationIx(params: {
    preAuthorization: PublicKey;
  }): Promise<InstructionWithData<void>> {
    throw new Error("Method not implemented");
  }

  public async buildUnpausePreAuthorizationIx(params: {
    preAuthorization: PublicKey;
  }): Promise<InstructionWithData<void>> {
    throw new Error("Method not implemented");
  }

  public async buildClosePreAuthorizationAsOwnerIx(
    params: ClosePreAuthorizationAsOwnerParams,
  ): Promise<InstructionWithData<void>> {
    throw new Error("Method not implemented");
  }

  public async buildClosePreAuthorizationAsDebitAuthorityIx(params: {
    preAuthorization: PublicKey;
  }): Promise<InstructionWithData<void>> {
    throw new Error("Method not implemented");
  }

  public async buildDebitIx(
    params: DebitParams,
  ): Promise<InstructionWithData<void>> {
    throw new Error("Method not implemented");
  }

  public async buildApproveSmartDelegateIx(
    params: ApproveSmartDelegateParams,
  ): Promise<InstructionWithData<void>> {
    throw new Error("Method not implemented");
  }
}
