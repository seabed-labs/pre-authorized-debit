import { ProgramAccount } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { PreAuthorization, SmartDelegate } from "../../anchor-client";

type FetchPreAuthorizationParams =
  | { pubkey: PublicKey }
  | { tokenAccount: PublicKey; debitAuthority: PublicKey };

type CheckDebitAmountParams = {
  tokenAccount: PublicKey;
  debitAuthority: PublicKey;
  amount: bigint;
};

type FetchMaxDebitAmountParams = {
  tokenAccount: PublicKey;
  debitAuthority: PublicKey;
};

export interface PreAuthorizedDebitReadClient {
  getSmartDelegatePubkey(): PublicKey;

  fetchSmartDelegate(): Promise<ProgramAccount<SmartDelegate> | null>;

  derivePreAuthorizationPubkey(
    tokenAccount: PublicKey,
    debitAuthority: PublicKey,
  ): PublicKey;

  fetchPreAuthorization(
    params: FetchPreAuthorizationParams,
  ): Promise<ProgramAccount<PreAuthorization> | null>;

  fetchPreAuthorizationsForTokenAccount(
    tokenAccount: PublicKey,
  ): Promise<ProgramAccount<PreAuthorization>[]>;

  fetchOneTimePreAuthorizationsForTokenAccount(
    tokenAccount: PublicKey,
  ): Promise<ProgramAccount<PreAuthorization>[]>;

  fetchRecurringPreAuthorizationsForTokenAccount(
    tokenAccount: PublicKey,
  ): Promise<ProgramAccount<PreAuthorization>[]>;

  fetchPreAuthorizationsForDebitAuthority(
    debitAuthority: PublicKey,
  ): Promise<ProgramAccount<PreAuthorization>[]>;

  // Checks whether the given debit will go through right now (based on current state of pre-auth if any)
  // Returns true if so
  checkDebitAmount(params: CheckDebitAmountParams): Promise<boolean>;
  // Returns the maximum debitable amount given the current state of pre-auth given params (if any)

  fetchMaxDebitAmount(params: FetchMaxDebitAmountParams): Promise<bigint>;
}
