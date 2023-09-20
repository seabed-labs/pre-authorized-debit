import { ProgramAccount } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { PreAuthorizationAccount, SmartDelegateAccount } from "../accounts";
import { PreAuthorizedDebitV1 } from "../../pre_authorized_debit_v1";

export type FetchPreAuthorizationParams =
  | { publicKey: PublicKey }
  | { tokenAccount: PublicKey; debitAuthority: PublicKey };

export type CheckDebitAmountParams = {
  tokenAccount: PublicKey;
  debitAuthority: PublicKey;
  amount: bigint;
};

export type FetchMaxDebitAmountParams = {
  tokenAccount: PublicKey;
  debitAuthority: PublicKey;
};

export type PDA = {
  publicKey: PublicKey;
  bump: number;
};

export type PreAuthorizationType = "oneTime" | "recurring" | "all";

export interface PreAuthorizedDebitReadClient {
  fetchIdlFromChain(): Promise<PreAuthorizedDebitV1>;

  getSmartDelegatePDA(): PDA;

  derivePreAuthorizationPDA(
    tokenAccount: PublicKey,
    debitAuthority: PublicKey,
  ): PDA;

  fetchSmartDelegate(): Promise<ProgramAccount<SmartDelegateAccount> | null>;

  fetchPreAuthorization(
    params: FetchPreAuthorizationParams,
  ): Promise<ProgramAccount<PreAuthorizationAccount> | null>;

  fetchPreAuthorizationsForTokenAccount(
    tokenAccount: PublicKey,
    type?: PreAuthorizationType,
  ): Promise<ProgramAccount<PreAuthorizationAccount>[]>;

  fetchPreAuthorizationsForDebitAuthority(
    debitAuthority: PublicKey,
    type?: PreAuthorizationType,
  ): Promise<ProgramAccount<PreAuthorizationAccount>[]>;

  // Checks whether the given debit will go through right now (based on current state of pre-auth if any)
  // Returns true if so
  checkDebitAmount(params: CheckDebitAmountParams): Promise<boolean>;
  // Returns the maximum debitable amount given the current state of pre-auth given params (if any)

  fetchMaxDebitAmount(params: FetchMaxDebitAmountParams): Promise<bigint>;

  fetchTokenProgramIdForTokenAccount(
    tokenAccountPubkey: PublicKey,
  ): Promise<PublicKey>;

  fetchCurrentOwnerOfTokenAccount(
    tokenAccountPubkey: PublicKey,
  ): Promise<PublicKey>;

  fetchCurrentDelegationOfTokenAccount(
    tokenAccountPubkey: PublicKey,
  ): Promise<{ delegate: PublicKey; delgatedAmount: bigint } | null>;

  fetchCurrentOwnerOfPreAuthTokenAccount(
    preAuthorizationPubkey: PublicKey,
  ): Promise<PublicKey>;

  fetchCurrentDelegationOfPreAuthTokenAccount(
    preAuthorizationPubkey: PublicKey,
  ): Promise<{ delegate: PublicKey; delgatedAmount: bigint } | null>;
}
