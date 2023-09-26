import { ProgramAccount } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { PreAuthorizationAccount, SmartDelegateAccount } from "../accounts";
import { PreAuthorizedDebitV1 } from "../../pre_authorized_debit_v1";

export type FetchPreAuthorizationParams =
  | { publicKey: PublicKey }
  | { tokenAccount: PublicKey; debitAuthority: PublicKey };

export type CheckDebitAmountParams =
  | {
      tokenAccount: PublicKey;
      debitAuthority: PublicKey;
      requestedDebitAmount: bigint;
    }
  | {
      preAuthorizedDebit: PublicKey;
      requestedDebitAmount: bigint;
    };

export type CheckDebitAmountForPerAuthorizationParams = {
  preAuthorizationAccount: PreAuthorizationAccount;
  requestedDebitAmount: bigint;
  solanaTime: bigint;
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

/**
 * # PreAuthorizedDebitReadClient
 * The `PreAuthorizedDebitReadClient` client exposes methods that can be used to read and process information from on-chain data.
 *
 * ## Instantiating a PreAuthorizedDebitReadClient
 *
 * ### Mainnet
 * ```typescript
 * import { clusterApiUrl, Connection } from "@solana/web3.js";
 * import { PreAuthorizedDebitReadClientImpl } from "@seabed/pre-authorized-debit";
 *
 * // You can use any connection object you'd like, this is just an example
 * const connection = new Connection(clusterApiUrl("mainnet-beta"));
 *
 * const readClient = PreAuthorizedDebitReadClientImpl.mainnet(connection);
 * ```
 *
 * ### Devnet
 * ```typescript
 * import { clusterApiUrl, Connection } from "@solana/web3.js";
 * import { PreAuthorizedDebitReadClientImpl } from "@seabed/pre-authorized-debit";
 *
 * // You can use any connection object you'd like, this is just an example
 * const connection = new Connection(clusterApiUrl("devnet"));
 *
 * const readClient = PreAuthorizedDebitReadClientImpl.devnet(connection);
 * ```
 *
 * ### Custom
 * Point the read client to a custom deployment on any cluster:
 * ```typescript
 * import { clusterApiUrl, Connection } from "@solana/web3.js";
 * import { PreAuthorizedDebitReadClientImpl } from "@seabed/pre-authorized-debit";
 *
 * const connection = new Connection(
 *   // your connection args
 * );
 * const CUSTOM_PAD_PROGRAM_ID = "<your custom program ID>";
 *
 * const readClient = PreAuthorizedDebitReadClientImpl.custom(
 *   connection,
 *   CUSTOM_PAD_PROGRAM_ID
 * );
 * ```
 */
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

  /**
   * Checks whether the given debit will go through right now (based on current state of pre-auth if any)
   * @returns true if above is true
   * @param params
   */
  checkDebitAmount(params: CheckDebitAmountParams): Promise<boolean>;
  checkDebitAmountForPreAuthorization(
    params: CheckDebitAmountForPerAuthorizationParams,
  ): boolean;

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
  ): Promise<{ delegate: PublicKey; delegatedAmount: bigint } | null>;

  fetchCurrentOwnerOfPreAuthTokenAccount(
    preAuthorizationPubkey: PublicKey,
  ): Promise<PublicKey>;

  fetchCurrentDelegationOfPreAuthTokenAccount(
    preAuthorizationPubkey: PublicKey,
  ): Promise<{ delegate: PublicKey; delegatedAmount: bigint } | null>;
}
