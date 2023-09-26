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
  /**
   * Fetch the on-chain IDL
   *
   * Example:
   * ```typescript
   * const OnchainIDL = await readClient.fetchIdlFromChain();
   * ```
   *
   * @returns {Promise<PreAuthorizedDebitV1>} the IDL as JSON
   *
   */
  fetchIdlFromChain(): Promise<PreAuthorizedDebitV1>;

  /**
   * Derives the `SmartDelegate` PDA (singleton)
   *
   * Example:
   * ```typescript
   * const smartDelegatePDA = readClient.getSmartDelegatePDA();
   * const { publicKey, bump } = smartDelegatePDA;
   * ```
   *
   * @returns {PDA} the PDA object with `publicKey` and `bump`
   */
  getSmartDelegatePDA(): PDA;

  /**
   * Derive the PDA for a `PreAuthorization` account given a token account and debit authority
   *
   * @param {PublicKey} tokenAccount - the token account this pre-authorization is for
   * @param {PublicKey} debitAuthority - the debit authority that can debit the token account via this pre-authorization
   * @example
   * ```typescript
   * const tokenAccountPubkey: PublicKey = // token account pubkey
   * const debitAuthorityPubkey: PublicKey = // any pubkey
   * const preAuthorizationPDA = readClient.derivePreAuthorizationPDA();
   * const { publicKey, bump } = smartDelegatePDA;
   * ```
   * @returns {PDA} the PDA object with `publicKey` and `bump`
   */
  derivePreAuthorizationPDA(
    tokenAccount: PublicKey,
    debitAuthority: PublicKey,
  ): PDA;

  /**
   * Fetch the singleton SmartDelegate account
   *
   * @example
   * ```typescript
   * const smartDelegateProgramAccount = await readClient.fetchSmartDelegate();
   * const {
   *   publicKey, // PublicKey
   *   account, // SmartDelegateAccount
   * } = smartDelegateProgramAccount;
   *
   * const {
   *   bump, // number (on-chain type: u8)
   * } = account;
   * ```
   * @returns {Promise<ProgramAccount<SmartDelegateAccount> | null>} the smart delegate account or null if not found
   */
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
