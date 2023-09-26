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
      preAuthorization: PublicKey;
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
 * import { PreAuthorizedDebitReadClientImpl } from "@seabed-labs/pre-authorized-debit";
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
 * import { PreAuthorizedDebitReadClientImpl } from "@seabed-labs/pre-authorized-debit";
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
 * import { PreAuthorizedDebitReadClientImpl } from "@seabed-labs/pre-authorized-debit";
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
   * Asynchronously checks whether the given debit will go through right now (based on current state of pre-auth if any)
   * @param {CheckDebitAmountParams} params - (pre-auth pubkey or token account and debit authority) + amount to debit
   * @returns {Promise<boolean>} whether or not the debit goes through
   * @example
   * Check with pre-authorization pubkey
   * ```typescript
   * const canDebit = await checkDebitAmount({
   *   preAuthorization: // pre-auth pubkey,
   *   requestedDebitAmount: // amount to debit (bigint)
   * });
   * ```
   * Check with token account and debit authority pubkeys
   * ```typescript
   * const canDebit = await checkDebitAmount({
   *   tokenAccount: // token account pubkey
   *   debitAuthority: // debit authority pubkey
   *   requestedDebitAmount: // amount to debit (bigint)
   * });
   * ```
   */
  checkDebitAmount(params: CheckDebitAmountParams): Promise<boolean>;

  /**
   * Synchronously check whether a debit will go through given the actual pre-authorization account, debit amount, and solana timestamp.
   * @param {CheckDebitAmountForPerAuthorizationParams} params - the actual pre-authorization account, debit amount, and solana timestamp
   * @returns {boolean} whether or not the debit goes through
   * @example
   * ```typescript
   * const preAuthorization: PreAuthorizationAccount = // make or fetch this however
   * const requestedDebitAmount = BigInt(100e6); // example
   * const solanaTime = BigInt(
   *   Math.floor(new Date().getTime() / 1e3)
   * ) - 24 * 3600; // -1 day from now
   *
   * const canDebit = checkDebitAmountForPreAuthorization({
   *   preAuthorizationAccount,
   *   requestedDebitAmount,
   *   solanaTime,
   * });
   * ```
   */
  checkDebitAmountForPreAuthorization(
    params: CheckDebitAmountForPerAuthorizationParams,
  ): boolean;

  /**
   * Fetch the maximum amount that can de debited now for a pre-authorization given a token account and debit authority
   * @param {FetchMaxDebitAmountParams} params - token account and debit authority pubkeys
   * @returns {Promise<bigint>} the max amount that can be debited now
   * @example
   * ```typescript
   * const tokenAccount: PublicKey = // token account pubkey
   * const debitAuthority: PublicKey = // debit authority pubkey
   *
   * const maxDebitAmount = await readClient.fetchMaxDebitAmount({
   *   tokenAccount,
   *   debitAuthority,
   * });
   * ```
   */
  fetchMaxDebitAmount(params: FetchMaxDebitAmountParams): Promise<bigint>;

  /**
   * Fetch the token program ID (Token or Token2022) for a given token account
   * @param {PublicKey} tokenAccountPubkey - the token account pubkey
   * @returns {Promise<PublicKey>} the token program pubkey (Token or Token2022)
   * @example
   * ```typescript
   * const tokenAccount: PublicKey = // token account pubkey
   * const tokenProgramId = await readClient.fetchTokenProgramIdForTokenAccount(
   *   tokenAccount
   * );
   * ```
   */
  fetchTokenProgramIdForTokenAccount(
    tokenAccountPubkey: PublicKey,
  ): Promise<PublicKey>;

  /**
   * Fetch the current owner of a token account
   * @param {PublicKey} tokenAccountPubkey - the token account pubkey
   * @returns {Promise<PublicKey>} the token account owner's pubkey
   * @example
   * ```typescript
   * const tokenAccount: PublicKey = // token account pubkey
   * const tokenAccountOwner = await readClient.fetchCurrentOwnerOfTokenAccount(
   *   tokenAccount
   * );
   * ```
   */
  fetchCurrentOwnerOfTokenAccount(
    tokenAccountPubkey: PublicKey,
  ): Promise<PublicKey>;

  /**
   * Fetch the current delegation (delegate and delegated amount) of a token account
   * @param {PublicKey} tokenAccountPubkey - the token account pubkey
   * @returns {Promise<{ delegate: PublicKey; delegatedAmount: bigint } | null>} the delegate and delegated amount (null if no delegate or delegated amount is 0)
   * @example
   * ```typescript
   * const tokenAccount: PublicKey = // token account pubkey
   * const delegation = await readClient.fetchCurrentDelegationOfTokenAccount(
   *   tokenAccount
   * );
   *
   * const {
   *   delegate, // PublicKey
   *   delegatedAmount, // bigint (on-chain u64)
   * } = delegation;
   * ```
   */
  fetchCurrentDelegationOfTokenAccount(
    tokenAccountPubkey: PublicKey,
  ): Promise<{ delegate: PublicKey; delegatedAmount: bigint } | null>;

  /**
   * Fetch the current owner of a pre-authorization's token account
   * @param {PublicKey} preAuthorizationPubkey - the pre-authorization pubkey
   * @returns {Promise<PublicKey>} the pre-authorization's token account owner's pubkey
   * @example
   * ```typescript
   * const preAuth: PublicKey = // pre-authorization pubkey
   * const tokenAccountOwner = await readClient.fetchCurrentOwnerOfPreAuthTokenAccount(
   *   preAuth
   * );
   * ```
   */
  fetchCurrentOwnerOfPreAuthTokenAccount(
    preAuthorizationPubkey: PublicKey,
  ): Promise<PublicKey>;

  /**
   * Fetch the current delegation (delegate and delegated amount) of a pre-authorization's token account
   * @param {PublicKey} preAuthorizationPubkey - the pre-authorization pubkey
   * @returns {Promise<{ delegate: PublicKey; delegatedAmount: bigint } | null>} the delegate and delegated amount (null if no delegate or delegated amount is 0)
   * @example
   * ```typescript
   * const tokenAccount: PublicKey = // token account pubkey
   * const delegation = await readClient.fetchCurrentDelegationOfTokenAccount(
   *   tokenAccount
   * );
   *
   * const {
   *   delegate, // PublicKey
   *   delegatedAmount, // bigint (on-chain u64)
   * } = delegation;
   * ```
   */
  fetchCurrentDelegationOfPreAuthTokenAccount(
    preAuthorizationPubkey: PublicKey,
  ): Promise<{ delegate: PublicKey; delegatedAmount: bigint } | null>;
}
