import { InstructionWithMetadata } from "./shared";
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

type IxFactoryFn<Params, Result> = (
  params: Params,
) => Promise<InstructionWithMetadata<Result>>;

/**
 * # Instruction Factory
 * The InstructionFactory allows the user to craft composable solana instructions that can be executed by wrapping them around a transaction.
 *
 * ## Instantiating an InstructionFactory
 * ### Mainnet
 * @example
 * ```typescript
 * import { clusterApiUrl, Connection } from "@solana/web3.js";
 * import { InstructionFactoryImpl } from "@seabed/pre-authorized-debit";
 *
 * // You can use any connection object you'd like, this is just an example
 * const connection = new Connection(clusterApiUrl("mainnet-beta"));
 *
 * const ixFactory = InstructionFactoryImpl.mainnet(connection);
 * ```
 *
 * ### Devnet
 * @example
 * ```typescript
 * import { clusterApiUrl, Connection } from "@solana/web3.js";
 * import { InstructionFactoryImpl } from "@seabed/pre-authorized-debit";
 *
 * // You can use any connection object you'd like, this is just an example
 * const connection = new Connection(clusterApiUrl("devnet"));
 *
 * const ixFactory = InstructionFactoryImpl.devnet(connection);
 * ```
 *
 * ### Custom
 * Point the instruction factory to a custom deployment on any cluster:
 * @example
 * ```typescript
 * import { clusterApiUrl, Connection } from "@solana/web3.js";
 * import { InstructionFactoryImpl } from "@seabed/pre-authorized-debit";
 *
 * const connection = new Connection(...);
 * const CUSTOM_PAD_PROGRAM_ID = ...;
 *
 * const ixFactory = InstructionFactoryImpl.custom(
 *   connection,
 *   CUSTOM_PAD_PROGRAM_ID,
 *   // optionlly, pass in a custom read client
 *   //   (if not provided, our read client will be pointed to the custom program)
 * );
 * ```
 */
export interface InstructionFactory {
  /**
   * Build the `init_smart_delegate` instruction.
   * @param {InitSmartDelegateParams} params - payer for new account
   * @returns {Promise<InstructionWithMetadata<InitSmartDelegateResult>>} ix, expected signers, and smart delegate pubkey
   * @example
   * ```typescript
   * const ixWithMetadata = await ixFactory.buildInitSmartDelegateIx({
   *   payer: // the payer pubkey that'll pay for smart_delegate account creation,
   * });
   *
   * const {
   *   instruction: initSmartDelegateIx,
   *   expectedSigners,
   *   meta: { smartDelegate: smartDelegatePubkey },
   * } = ixWithMetadata;
   * ```
   */
  buildInitSmartDelegateIx: IxFactoryFn<
    InitSmartDelegateParams,
    InitSmartDelegateResult
  >;

  /**
   * Build the `init_pre_authorization` instruction with one-time configuration.
   * @param {InitOneTimePreAuthorizationParams} params - check type (or example below) for param fields
   * @returns {Promise<InstructionWithMetadata<InitOneTimePreAuthorizationResult>>} ix, expected signers, and pre-authorization pubkey
   * @example
   * ```typescript
   * const ixWithMetadata = await ixFactory.buildInitOneTimePreAuthorizationIx({
   *   // pre-auth generic
   *   payer: // the pubkey paying for pre_authorization account creation,
   *   tokenAccount: // the token account pubkey,
   *   debitAuthority: // the debit authority pubkey,
   *   activation: // a Date instance representing the pre-auth's activation time
   *
   *   // one-time specific
   *   amountAuthorized: // a bigint that represents the one-time pre-auth's amount
   *   expiry: // an optional Date instance representing the pre-auth's expiry time
   * });
   *
   * const {
   *   instruction: initOneTimePreAuthIx,
   *   expectedSigners,
   *   meta: { preAuthorization: preAuthPubkey },
   * } = ixWithMetadata;
   * ```
   */
  buildInitOneTimePreAuthorizationIx: IxFactoryFn<
    InitOneTimePreAuthorizationParams,
    InitOneTimePreAuthorizationResult
  >;

  /**
   * Build the `init_pre_authorization` instruction with recurring configuration.
   * @param {InitRecurringPreAuthorizationParams} params - check type (or example below) for param fields
   * @returns {Promise<InstructionWithMetadata<InitRecurringPreAuthorizationResult>>} ix, expected signers, and pre-authorization pubkey
   * @example
   * ```typescript
   * const ixWithMetadata = await ixFactory.buildInitRecurringPreAuthorizationIx({
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
   * });
   *
   * const {
   *   instruction: initRecurringPreAuthIx,
   *   expectedSigners,
   *   meta: { preAuthorization: preAuthPubkey },
   * } = ixWithMetadata;
   * ```
   */
  buildInitRecurringPreAuthorizationIx: IxFactoryFn<
    InitRecurringPreAuthorizationParams,
    InitRecurringPreAuthorizationResult
  >;

  /**
   * Build the `update_pause_pre_authorization` instruction with pause = true configuration.
   * @param {PausePreAuthorizationParams} params - check type (or example below) for param fields
   * @returns {Promise<InstructionWithMetadata<PausePreAuthorizationResult>>} ix and expected signers
   * @example
   * ```typescript
   * const ix = await ixFactory.buildPausePreAuthorizationIx({
   *   preAuthorization: // the pre-authorization account's pubkey
   * });
   *
   * const {
   *   instruction: pausePreAuthIx,
   *   expectedSigners,
   *   // no metadata for this
   * } = ix;
   * ```
   */
  buildPausePreAuthorizationIx: IxFactoryFn<
    PausePreAuthorizationParams,
    PausePreAuthorizationResult
  >;

  /**
   * Build the `update_pause_pre_authorization` instruction with pause = false configuration.
   * @param {UnpausePreAuthorizationParams} params - check type (or example below) for param fields
   * @returns {Promise<InstructionWithMetadata<UnpausePreAuthorizationResult>>} ix and expected signers
   * @example
   * ```typescript
   * const ix = await ixFactory.buildUnpausePreAuthorizationIx({
   *   preAuthorization: // the pre-authorization account's pubkey
   * });
   *
   * const {
   *   instruction: unpausePreAuthIx,
   *   expectedSigners,
   *   // no metadata for this
   * } = ix;
   * ```
   */
  buildUnpausePreAuthorizationIx: IxFactoryFn<
    UnpausePreAuthorizationParams,
    UnpausePreAuthorizationResult
  >;

  /**
   * Build the `close_pre_authorization` instruction with authority as pre-authorization's token account's owner.
   * @param {ClosePreAuthorizationAsOwnerParams} params - check type (or example below) for param fields
   * @returns {Promise<InstructionWithMetadata<ClosePreAuthorizationAsOwnerResult>>} ix and expected signers
   * @example
   * ```typescript
   * const ix = await ixFactory.buildClosePreAuthorizationAsOwnerIx({
   *   preAuthorization: // the pre-authorization account's pubkey,
   *   rentReceiver: // optional, the account pubkey that'll receive the lamports in the pre-auth account
   * });
   *
   * const {
   *   instruction: closePreAuthAsOwnerIx,
   *   expectedSigners,
   *   // no metadata for this
   * } = ix;
   * ```
   */
  buildClosePreAuthorizationAsOwnerIx: IxFactoryFn<
    ClosePreAuthorizationAsOwnerParams,
    ClosePreAuthorizationAsOwnerResult
  >;

  /**
   * Build the `close_pre_authorization` instruction with authority as pre-authorization's debit authority.
   * @param {ClosePreAuthorizationAsDebitAuthorityParams} params - check type (or example below) for param fields
   * @returns {Promise<InstructionWithMetadata<ClosePreAuthorizationAsDebitAuthorityResult>>} ix and expected signers
   * @example
   * ```typescript
   * const ix = await ixFactory.buildClosePreAuthorizationAsDebitAuthorityIx({
   *   preAuthorization: // the pre-authorization account's pubkey,
   * });
   *
   * const {
   *   instruction: closePreAuthAsDebitAuthorityIx,
   *   expectedSigners,
   *   // no metadata for this
   * } = ix;
   * ```
   */
  buildClosePreAuthorizationAsDebitAuthorityIx: IxFactoryFn<
    ClosePreAuthorizationAsDebitAuthorityParams,
    ClosePreAuthorizationAsDebitAuthorityResult
  >;

  /**
   * Build the `debit` instruction.
   * @param {DebitParams} params - check type (or example below) for param fields
   * @returns {Promise<InstructionWithMetadata<DebitResult>>} ix and expected signers
   * @example
   * ```typescript
   * const ix = await ixFactory.buildDebitIx({
   *   preAuthorization: // the pre-authorization account's pubkey,
   *   amount: // bigint, amount to debit,
   *   destinationTokenAccount: // destination token account pubkey to send "amount" to,
   *   checkSmartDelegateEnabled: // optional boolean, checks delegate is smart delegate and fails otherwise
   * });
   *
   * const {
   *   instruction: debitIx,
   *   expectedSigners,
   *   // no metadata for this
   * } = ix;
   * ```
   */
  buildDebitIx: IxFactoryFn<DebitParams, DebitResult>;

  /**
   * Build the approve instruction (on SPL Token Program or on SPL Token2022 Program) for a given token account to set it's delegate to the `smart_delegate` account and delegated amount to `u64::MAX`.
   *
   * When a pre-authorization account is created, the delegate of the token account is already configured as the `smart_delegate` and the delegated amount is set to `u64::MAX`.
   *
   * This instruction can be used to "reset" this delegation so that the token account's associated pre-authorizations are still valid if it was unset by another Dapp.
   *
   * Alternatively, if the delegated amount isn't sufficient anymore, this same method can be used to reset it back to `u64::MAX`.
   *
   * > ⚠️ NOTE: This instruction does not call our pre-authorized-debit-v1 program, it calls the SPL Token/Token2022 program directly.
   *
   * @param {ApproveSmartDelegateParams} params - check type (or example below) for param fields
   * @returns {Promise<InstructionWithMetadata<ApproveSmartDelegateResult>>} ix and expected signers
   * @example
   * ```typescript
   * const ix = await ixFactory.buildApproveSmartDelegateIx({
   *   tokenAccount: // token account pubkey,
   * });
   *
   * const {
   *   instruction: approveSmartDelegateIx,
   *   expectedSigners,
   *   // no metadata for this
   * } = ix;
   * ```
   */
  buildApproveSmartDelegateIx: IxFactoryFn<
    ApproveSmartDelegateParams,
    ApproveSmartDelegateResult
  >;
}
