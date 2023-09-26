import { TransactionWithMetadata } from "./shared";
import {
  ApproveSmartDelegateParams,
  ApproveSmartDelegateResult,
  ClosePreAuthorizationAsDebitAuthorityParams,
  ClosePreAuthorizationAsDebitAuthorityResult,
  ClosePreAuthorizationAsOwnerParams,
  ClosePreAuthorizationAsOwnerResult,
  DebitParams,
  DebitResult,
  InitOneTimePreAuthorizationParams,
  InitOneTimePreAuthorizationResult,
  InitRecurringPreAuthorizationParams,
  InitRecurringPreAuthorizationResult,
  InitSmartDelegateParams,
  InitSmartDelegateResult,
  PausePreAuthorizationParams,
  PausePreAuthorizationResult,
  UnpausePreAuthorizationParams,
  UnpausePreAuthorizationResult,
} from "./params";
import { PublicKey } from "@solana/web3.js";

type TxFactoryFn<Params, Result> = (
  params: Params,
) => Promise<TransactionWithMetadata<Result>>;

/**
 * Provide these if mint is NATIVE_MINT (Token or Token2022)
 */
export type WrapNativeMintAdditionalParams = {
  wrapNativeMintParams?: {
    lamportsSourceAccount?: PublicKey;
    wrapLamportsAmount: bigint;
  };
};

/**
 * Provide these if mint is NATIVE_MINT (Token or Token2022)
 */
export type UnwrapNativeMintAdditionalParams = {
  unwrapNativeMintParams?: {
    lamportsDestinationAccount?: PublicKey;
  };
};

/**
 * # Transaction Factory
 * The `TransactionFactory` allows the user to craft executable solana transactions.
 *
 * ## Instantiating a `TransactionFactory`

 * ### Mainnet
 * @example
 * ```typescript
 * import { clusterApiUrl, Connection } from "@solana/web3.js";
 * import { TransactionFactoryImpl } from "@seabed/pre-authorized-debit";
 *
 * // You can use any connection object you'd like, this is just an example
 * const connection = new Connection(clusterApiUrl("mainnet-beta"));
 *
 * const txFactory = TransactionFactoryImpl.mainnet(connection);
 * ```
 *
 * ### Devnet
 * @example
 * ```typescript
 * import { clusterApiUrl, Connection } from "@solana/web3.js";
 * import { TransactionFactoryImpl } from "@seabed/pre-authorized-debit";
 * 
 * // You can use any connection object you'd like, this is just an example
 * const connection = new Connection(clusterApiUrl("devnet"));
 * 
 * const txFactory = TransactionFactoryImpl.devnet(connection);
 * ```
 *
 * ### Custom
 * Point the instruction factory to a custom deployment on any cluster:
 * @example
 * ```typescript
 * import { clusterApiUrl, Connection } from "@solana/web3.js";
 * import { TransactionFactoryImpl } from "@seabed/pre-authorized-debit";
 * 
 * const connection = new Connection(...);
 * const CUSTOM_PAD_PROGRAM_ID = ...;
 * 
 * const txFactory = TransactionFactoryImpl.custom(
 *   connection,
 *   CUSTOM_PAD_PROGRAM_ID,
 *   // optionally, pass in a custom read client
 *   //   (if not provided, our read client will be pointed to the custom program),
 *   // optionally, pass in a custom ix factory
 *   //   (if not provided, our ix factory will be pointed to the custom program),
 * );
 * ```
 * 
 * For more information, refer to [gitbook](https://docs.seabed.so/open-source-primitives/pre-authorized-debit-v1/typescript-sdk/transaction-factory).
 */
export interface TransactionFactory {
  /**
   * Build the `init_smart_delegate` instruction and wrap it in an executable TX.
   * @param {InitSmartDelegateParams} params - check type for fields
   * @returns {Promise<TransactionWithMetadata<InitSmartDelegateResult>>} executable TX (check types for fields)
   * @example
   * ```typescript
   * const tx = await txFactory.buildInitSmartDelegateTx({
   *   payer: // the payer pubkey that'll pay for smart_delegate account creation,
   * });
   *
   * const {
   *   // data
   *   setupInstructions,
   *   coreInstructions,
   *   cleanupInstructions,
   *   expectedSigners,
   *   meta: { smartDelegate: smartDelegatePubkey },
   *
   *   // methods
   *   buildVersionedTransaction,
   *   simulate,
   *   execute,
   * } = tx;
   * ```
   */
  buildInitSmartDelegateTx: TxFactoryFn<
    InitSmartDelegateParams,
    InitSmartDelegateResult
  >;

  /**
   * Build the `init_pre_authorization` instruction with one-time configuration and wrap it in an executable TX.
   * @param {InitOneTimePreAuthorizationParams & WrapNativeMintAdditionalParams} params - check type for fields (includes wrap SOL fields)
   * @returns {Promise<TransactionWithMetadata<InitOneTimePreAuthorizationResult>>} executable TX (check types for fields)
   * @example
   * ```typescript
   * const tx = await txFactory.buildInitOneTimePreAuthorizationTx({
   *   // pre-auth generic
   *   payer: // the pubkey paying for pre_authorization account creation,
   *   tokenAccount: // the token account pubkey,
   *   debitAuthority: // the debit authority pubkey,
   *   activation: // a Date instance representing the pre-auth's activation time
   *
   *   // one-time specific
   *   amountAuthorized: // a bigint that represents the one-time pre-auth's amount
   *   expiry: // an optional Date instance representing the pre-auth's expiry time
   *
   *   // optionally, wrap SOL if mint is NATIVE_MINT
   *   wrapNativeMintParams: {
   *     lamportsSourceAccount: // source of the lamports to wrap (has to sign),
   *     wrapLamportsAmount: // bigint, amount of lamports to wrap
   *   };
   * });
   *
   * const {
   *   // data
   *   setupInstructions,
   *   coreInstructions,
   *   cleanupInstructions,
   *   expectedSigners,
   *   meta: { preAuthorization: preAuthorizationPubkey },
   *
   *   // methods
   *   buildVersionedTransaction,
   *   simulate,
   *   execute,
   * } = tx;
   * ```
   */
  buildInitOneTimePreAuthorizationTx: TxFactoryFn<
    InitOneTimePreAuthorizationParams & WrapNativeMintAdditionalParams,
    InitOneTimePreAuthorizationResult
  >;

  /**
   * Build the `init_pre_authorization` instruction with recurring configuration and wrap it in an executable TX.
   * @param {InitRecurringPreAuthorizationParams & WrapNativeMintAdditionalParams} params - check type for fields or example below (includes wrap SOL fields)
   * @returns {Promise<TransactionWithMetadata<InitRecurringPreAuthorizationParams>>} executable TX (check types for fields)
   * @example
   * ```typescript
   * const tx = await txFactory.buildInitOneTimePreAuthorizationTx({
   *   // pre-auth generic
   *   payer: // the pubkey paying for pre_authorization account creation,
   *   tokenAccount: // the token account pubkey,
   *   debitAuthority: // the debit authority pubkey,
   *   activation: // a Date instance representing the pre-auth's activation time
   *
   *   // recurring specific
   *   repeatFrequencySeconds: // the recurring frequency in seconds (type: bigint),
   *   recurringAmountAuthorized: // amount authorized each cycle (type: bigint),
   *   numCycles: // optional, total cycles this pre-auth will be active (type: bigint),
   *   resetEveryCycle: // if false, the unused "recurringAmountAuthorized" will accrue across cycles (type: boolean)
   *
   *   // optionally, wrap SOL if mint is NATIVE_MINT
   *   wrapNativeMintParams: {
   *     lamportsSourceAccount: // source of the lamports to wrap (has to sign),
   *     wrapLamportsAmount: // bigint, amount of lamports to wrap
   *   };
   * });
   *
   * const {
   *   // data
   *   setupInstructions,
   *   coreInstructions,
   *   cleanupInstructions,
   *   expectedSigners,
   *   meta: { preAuthorization: preAuthorizationPubkey },
   *
   *   // methods
   *   buildVersionedTransaction,
   *   simulate,
   *   execute,
   * } = tx;
   * ```
   */
  buildInitRecurringPreAuthorizationTx: TxFactoryFn<
    InitRecurringPreAuthorizationParams & WrapNativeMintAdditionalParams,
    InitRecurringPreAuthorizationResult
  >;

  /**
   * Build the `update_pause_pre_authorization` instruction with pause = true configuration and wrap it in an executable TX.
   * @param {PausePreAuthorizationParams} params - check type (or example below) for param fields
   * @returns {Promise<TransactionWithMetadata<PausePreAuthorizationResult>>} executable TX (check types for fields)
   * @example
   * ```typescript
   * const tx = await txFactory.buildPausePreAuthorizationTx({
   *   preAuthorization: // the pre-authorization account's pubkey
   * });
   *
   * const {
   *   // data
   *   setupInstructions,
   *   coreInstructions,
   *   cleanupInstructions,
   *   expectedSigners,
   *   // no metadata for this
   *
   *   // methods
   *   buildVersionedTransaction,
   *   simulate,
   *   execute,
   * } = tx;
   * ```
   */
  buildPausePreAuthorizationTx: TxFactoryFn<
    PausePreAuthorizationParams,
    PausePreAuthorizationResult
  >;

  /**
   * Build the `update_pause_pre_authorization` instruction with pause = false configuration and wrap it in an executable TX.
   * @param {UnpausePreAuthorizationParams} params - check type (or example below) for param fields
   * @returns {Promise<TransactionWithMetadata<UnpausePreAuthorizationResult>>} executable TX (check types for fields)
   * @example
   * ```typescript
   * const tx = await txFactory.buildUnpausePreAuthorizationTx({
   *   preAuthorization: // the pre-authorization account's pubkey
   * });
   *
   * const {
   *   // data
   *   setupInstructions,
   *   coreInstructions,
   *   cleanupInstructions,
   *   expectedSigners,
   *   // no metadata for this
   *
   *   // methods
   *   buildVersionedTransaction,
   *   simulate,
   *   execute,
   * } = tx;
   * ```
   */
  buildUnpausePreAuthorizationTx: TxFactoryFn<
    UnpausePreAuthorizationParams,
    UnpausePreAuthorizationResult
  >;

  /**
   * Build the `close_pre_authorization` instruction with authority as pre-authorization's token account's owner and wrap it in an executable TX.
   * @param {ClosePreAuthorizationAsOwnerParams} params - check type (or example below) for param fields (includes unwrap SOL fields)
   * @returns {Promise<TransactionWithMetadata<ClosePreAuthorizationAsOwnerResult>>} executable TX (check types for fields)
   * @example
   * ```typescript
   * const tx = await txFactory.buildClosePreAuthorizationAsOwnerTx({
   *   preAuthorization: // the pre-authorization account's pubkey,
   *   rentReceiver: // optional, the account pubkey that'll receive the lamports in the pre-auth account
   *
   *   // optional unwrap params if mint is NATIVE_MINT
   *   unwrapNativeMintParams: {
   *     lamportsDestinationAccount: // optionally, the destination for lamports
   *   };
   * });
   *
   * const {
   *   // data
   *   setupInstructions,
   *   coreInstructions,
   *   cleanupInstructions,
   *   expectedSigners,
   *   // no metadata for this
   *
   *   // methods
   *   buildVersionedTransaction,
   *   simulate,
   *   execute,
   * } = tx;
   * ```
   */
  buildClosePreAuthorizationAsOwnerTx: TxFactoryFn<
    ClosePreAuthorizationAsOwnerParams & UnwrapNativeMintAdditionalParams,
    ClosePreAuthorizationAsOwnerResult
  >;

  /**
   * Build the `close_pre_authorization` instruction with authority as pre-authorization's debit authority and wrap it in an executable TX.
   * @param {ClosePreAuthorizationAsDebitAuthorityParams} params - check type (or example below) for param fields
   * @returns {Promise<TransactionWithMetadata<ClosePreAuthorizationAsDebitAuthorityResult>>} executable TX (check types for fields)
   * @example
   * ```typescript
   * const tx = await txFactory.buildClosePreAuthorizationAsDebitAuthorityTx({
   *   preAuthorization: // the pre-authorization account's pubkey,
   * });
   *
   * const {
   *   // data
   *   setupInstructions,
   *   coreInstructions,
   *   cleanupInstructions,
   *   expectedSigners,
   *   // no metadata for this
   *
   *   // methods
   *   buildVersionedTransaction,
   *   simulate,
   *   execute,
   * } = tx;
   * ```
   */
  buildClosePreAuthorizationAsDebitAuthorityTx: TxFactoryFn<
    ClosePreAuthorizationAsDebitAuthorityParams,
    ClosePreAuthorizationAsDebitAuthorityResult
  >;

  /**
   * Build the `debit` instruction and wrap it in an executable TX.
   * @param {DebitParams} params - check type (or example below) for param fields (includes unwrap SOL fields)
   * @returns {Promise<TransactionWithMetadata<DebitResult>>} executable TX (check types for fields)
   * @example
   * ```typescript
   * const tx = await txFactory.buildDebitTx({
   *   preAuthorization: // the pre-authorization account's pubkey,
   *   amount: // bigint, amount to debit,
   *   destinationTokenAccount: // destination token account pubkey to send "amount" to,
   *   checkSmartDelegateEnabled: // optional boolean, checks delegate is smart delegate and fails otherwise
   *
   *   // optional unwrap params if mint is NATIVE_MINT
   *   unwrapNativeMintParams: {
   *     lamportsDestinationAccount: // optionally, the destination for lamports
   *   };
   * });
   *
   * const {
   *   // data
   *   setupInstructions,
   *   coreInstructions,
   *   cleanupInstructions,
   *   expectedSigners,
   *   // no metadata for this
   *
   *   // methods
   *   buildVersionedTransaction,
   *   simulate,
   *   execute,
   * } = tx;
   * ```
   */
  buildDebitTx: TxFactoryFn<
    DebitParams & UnwrapNativeMintAdditionalParams,
    DebitResult
  >;

  /**
   * Build the approve instruction (on SPL Token Program or on SPL Token2022 Program) for a given token account to set it's delegate to the `smart_delegate` account and delegated amount to `u64::MAX` and wraps it in an executable TX.
   *
   * When a pre-authorization account is created, the delegate of the token account is already configured as the `smart_delegate` and the delegated amount is set to `u64::MAX`.
   *
   * This transaction can be used to "reset" this delegation so that the token account's associated pre-authorizations are still valid if it was unset by another Dapp.
   *
   * Alternatively, if the delegated amount isn't sufficient anymore, this same method can be used to reset it back to `u64::MAX`.
   *
   * > ⚠️ NOTE: This transaction does not call our pre-authorized-debit-v1 program, it calls the SPL Token/Token2022 program directly.
   *
   * @param {ApproveSmartDelegateParams} params - check type (or example below) for param fields
   * @returns {Promise<TransactionWithMetadata<ApproveSmartDelegateResult>>} ix and expected signers
   * @example
   * ```typescript
   * const tx = await txFactory.buildApproveSmartDelegateTx({
   *   tokenAccount: // token account pubkey,
   * });
   *
   * const {
   *   // data
   *   setupInstructions,
   *   coreInstructions,
   *   cleanupInstructions,
   *   expectedSigners,
   *   // no metadata for this
   *
   *   // methods
   *   buildVersionedTransaction,
   *   simulate,
   *   execute,
   * } = tx;
   * ```
   */
  buildApproveSmartDelegateTx: TxFactoryFn<
    ApproveSmartDelegateParams,
    ApproveSmartDelegateResult
  >;
}
