// TODO: Remove this after impl
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Idl, ProgramAccount } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { SmartDelegate, PreAuthorization } from "../../anchor-client";
import { PreAuthorizedDebitReadClient } from "../interface";
import { MAINNET_PAD_PROGRAM_ID } from "../../constants";

export class PreAuthorizedDebitReadClientImpl
  implements PreAuthorizedDebitReadClient
{
  // eslint-disable-next-line no-useless-constructor
  private constructor(
    private readonly connection: Connection,
    private readonly programId: PublicKey,
  ) {}

  public static custom(
    connection: Connection,
    programId: PublicKey,
  ): PreAuthorizedDebitReadClient {
    return new PreAuthorizedDebitReadClientImpl(connection, programId);
  }

  public static mainnet(connection: Connection): PreAuthorizedDebitReadClient {
    return PreAuthorizedDebitReadClientImpl.custom(
      connection,
      MAINNET_PAD_PROGRAM_ID,
    );
  }

  public static devnet(connection: Connection): PreAuthorizedDebitReadClient {
    return PreAuthorizedDebitReadClientImpl.custom(
      connection,
      MAINNET_PAD_PROGRAM_ID,
    );
  }

  fetchIdl(): Promise<Idl> {
    throw new Error("Method not implemented.");
  }

  getSmartDelegatePubkey(): PublicKey {
    throw new Error("Method not implemented.");
  }

  fetchSmartDelegate(): Promise<ProgramAccount<SmartDelegate> | null> {
    throw new Error("Method not implemented.");
  }

  derivePreAuthorizationPubkey(
    tokenAccount: PublicKey,
    debitAuthority: PublicKey,
  ): PublicKey {
    throw new Error("Method not implemented.");
  }

  fetchPreAuthorization(
    params:
      | { pubkey: PublicKey }
      | { tokenAccount: PublicKey; debitAuthority: PublicKey },
  ): Promise<ProgramAccount<PreAuthorization> | null> {
    throw new Error("Method not implemented.");
  }

  fetchPreAuthorizationsForTokenAccount(
    tokenAccount: PublicKey,
  ): Promise<ProgramAccount<PreAuthorization>[]> {
    throw new Error("Method not implemented.");
  }

  fetchOneTimePreAuthorizationsForTokenAccount(
    tokenAccount: PublicKey,
  ): Promise<ProgramAccount<PreAuthorization>[]> {
    throw new Error("Method not implemented.");
  }

  fetchRecurringPreAuthorizationsForTokenAccount(
    tokenAccount: PublicKey,
  ): Promise<ProgramAccount<PreAuthorization>[]> {
    throw new Error("Method not implemented.");
  }

  fetchPreAuthorizationsForDebitAuthority(
    debitAuthority: PublicKey,
  ): Promise<ProgramAccount<PreAuthorization>[]> {
    throw new Error("Method not implemented.");
  }

  checkDebitAmount(params: {
    tokenAccount: PublicKey;
    debitAuthority: PublicKey;
    amount: bigint;
  }): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  fetchMaxDebitAmount(params: {
    tokenAccount: PublicKey;
    debitAuthority: PublicKey;
  }): Promise<bigint> {
    throw new Error("Method not implemented.");
  }
}
