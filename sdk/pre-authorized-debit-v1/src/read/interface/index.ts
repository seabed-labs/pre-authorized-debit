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
 * @example
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
 * @example
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
 * @example
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
   * @returns {Promise<PreAuthorizedDebitV1>} the IDL as JSON
   * @example
   * ```typescript
   * const OnchainIDL = await readClient.fetchIdlFromChain();
   * ```
   */
  fetchIdlFromChain(): Promise<PreAuthorizedDebitV1>;

  /**
   * Derives the `SmartDelegate` PDA (singleton)
   *
   * @returns {PDA} the PDA object with `publicKey` and `bump`
   * @example
   * ```typescript
   * const smartDelegatePDA = readClient.getSmartDelegatePDA();
   * const { publicKey, bump } = smartDelegatePDA;
   * ```
   */
  getSmartDelegatePDA(): PDA;

  /**
   * Derive the PDA for a `PreAuthorization` account given a token account and debit authority
   *
   * @param {PublicKey} tokenAccount - the token account this pre-authorization is for
   * @param {PublicKey} debitAuthority - the debit authority that can debit the token account via this pre-authorization
   * @returns {PDA} the PDA object with `publicKey` and `bump`
   * @example
   * ```typescript
   * const tokenAccountPubkey: PublicKey = // token account pubkey
   * const debitAuthorityPubkey: PublicKey = // any pubkey
   * const preAuthorizationPDA = readClient.derivePreAuthorizationPDA();
   * const { publicKey, bump } = smartDelegatePDA;
   * ```
   */
  derivePreAuthorizationPDA(
    tokenAccount: PublicKey,
    debitAuthority: PublicKey,
  ): PDA;

  /**
   * Fetch the singleton SmartDelegate account
   *
   * @returns {Promise<ProgramAccount<SmartDelegateAccount> | null>} the smart delegate account or null if not found
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
   */
  fetchSmartDelegate(): Promise<ProgramAccount<SmartDelegateAccount> | null>;

  /**
   * Fetch a PreAuthorization account given pubkey or token account and debit authority.
   *
   * @param {FetchPreAuthorizationParams} params - either pubkey or token account and debit authority
   * @returns {Promise<ProgramAccount<PreAuthorizationAccount> | null>} the pre authorization account or null if not found
   * @example
   * Fetch with a pubkey
   * ```typescript
   * const preAuthorizationProgramAccount = await readClient.fetchPreAuthorization({
   *   publicKey: // public key for the account
   * });
   *
   * const {
   *   publicKey, // PublicKey
   *   account, // PreAuthorizationAccount
   * } = preAuthorizationProgramAccount;
   *
   * const {
   *   bump, // number (on-chain type: u8)
   *   tokenAccount, // PublicKey,
   *   debitAuthority, // PublicKey,
   *   activationUnixTimestamp, // bigint (on-chain i64)
   *   paused, // boolean
   *   variant, // PreAuthorizationVariantOneTime | PreAuthorizationVariantRecurring
   * } = account;
   *
   * if (variant.type === "oneTime") {
   *   const {
   *     amountAuthorized, // bigint (on-chain u64)
   *     amountDebited, // bigint (on-chain u64)
   *     expiryUnixTimestamp, // bigint (on-chain i64)
   *   } = variant;
   * } else if (variant.type === "recurring") {
   *   const {
   *     recurringAmountAuthorized, // bigint (on-chain u64)
   *     repeatFrequencySeconds, // bigint (on-chain u64)
   *     resetEveryCycle, // boolean
   *     numCycles, // number | null (on-chain Option<u64>)
   *     amountDebitedTotal, // bigint (on-chain u64)
   *     amountDebitedLastCycle, // bigint (on-chain u64)
   *     lastDebitedCycle, // bigint (on-chain u64)
   *   } = variant;
   * }
   * ```
   *
   * Fetch with token account and debit authority
   * ```typescript
   * const preAuthorizationProgramAccount = await readClient.fetchPreAuthorization({
   *   tokenAccount: // token account pubkey,
   *   debitAuthority: // debit authorityy pubkey,
   * });
   *
   * // ... (same as previous variant)
   * ```
   */
  fetchPreAuthorization(
    params: FetchPreAuthorizationParams,
  ): Promise<ProgramAccount<PreAuthorizationAccount> | null>;

  /**
   * Fetch pre-authorizations that are associated with a token account
   *
   * @param {PublicKey} tokenAccount - token account pubkey to which pre-auth is associated with
   * @param {PreAuthorizationType} [type="all"] - type of pre-auth: "oneTime" or "recurring" or "all" (default)
   * @returns {Promise<ProgramAccount<PreAuthorizationAccount>[]>} array of pre authorization accounts
   * @example
   * ```typescript
   * const tokenAccount: PublicKey = // token account pubkey;
   * const type = "all";
   *
   * const preAuthAccounts = await readClient.fetchPreAuthorizationsForTokenAccount(
   *   tokenAccount, // pubkey
   *   type, // "oneTime" or "recurring" or "all"
   * );
   *
   * for (const account of preAuthAccounts) {
   *   // ... (access them similar to `fetchPreAuthorization` above)
   * }
   * ```
   */
  fetchPreAuthorizationsForTokenAccount(
    tokenAccount: PublicKey,
    type?: PreAuthorizationType,
  ): Promise<ProgramAccount<PreAuthorizationAccount>[]>;

  /**
   * Fetch pre-authorizations that are associated with a debit authority
   *
   * @param {PublicKey} debitAuthority - debit authority pubkey to which pre-auth is associated with
   * @param {PreAuthorizationType} [type="all"] - type of pre-auth: "oneTime" or "recurring" or "all" (default)
   * @returns {Promise<ProgramAccount<PreAuthorizationAccount>[]>} array of pre authorization accounts
   * @example
   * ```typescript
   * const debitAuthority: PublicKey = // debit authority pubkey;
   * const type = "all";
   *
   * const preAuthAccounts = await readClient.fetchPreAuthorizationsForDebitAuthority(
   *   debitAuthority, // pubkey
   *   type, // "oneTime" or "recurring" or "all"
   * );
   *
   * for (const account of preAuthAccounts) {
   *   // ... (access them similar to `fetchPreAuthorization` above)
   * }
   * ```
   */
  fetchPreAuthorizationsForDebitAuthority(
    debitAuthority: PublicKey,
    type?: PreAuthorizationType,
  ): Promise<ProgramAccount<PreAuthorizationAccount>[]>;

  /**
   * Checks whether the given debit will go through right now (based on current state of pre-auth if any)
   * @param {CheckDebitAmountParams} params - (pre-auth pubkey or token account and debit authority) + amount to debit
   * @returns {Promise<boolean>} whether or not the debit goes through
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
