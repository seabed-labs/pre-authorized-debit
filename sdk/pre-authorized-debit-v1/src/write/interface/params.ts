import { PublicKey } from "@solana/web3.js";

/** InitSmartDelegate */

export type InitSmartDelegateParams = {
  payer: PublicKey;
};

export type InitSmartDelegateResult = {
  smartDelegate: PublicKey;
};

/** InitPreAuthorization (common) */

type InitPreAuthIxCommonParams = {
  payer: PublicKey;
  tokenAccount: PublicKey;
  debitAuthority: PublicKey;
  activation: Date;
};

type InitPreAuthCommonResult = {
  preAuthorization: PublicKey;
};

/** InitPreAuthorization (one-time) */

export type InitOneTimePreAuthorizationParams = InitPreAuthIxCommonParams & {
  amountAuthorized: bigint;
  // if not set, will default to i64::max (i.e. never expires)
  expiry?: Date;
};

export type InitOneTimePreAuthorizationResult = InitPreAuthCommonResult;

/** InitPreAuthorization (recurring) */

export type InitRecurringPreAuthorizationParams = InitPreAuthIxCommonParams & {
  repeatFrequencySeconds: bigint;
  recurringAmountAuthorized: bigint;
  numCycles: bigint | null;
  resetEveryCycle: boolean;
};

export type InitRecurringPreAuthorizationResult = InitPreAuthCommonResult;

/** UpdatePause (common) */

type UpdatePauseCommonParams = {
  preAuthorization: PublicKey;
};

type UpdatePauseCommonResult = void;

/** Pause */

export type PausePreAuthorizationParams = UpdatePauseCommonParams;

export type PausePreAuthorizationResult = UpdatePauseCommonResult;

/** Unpause */

export type UnpausePreAuthorizationParams = UpdatePauseCommonParams;

export type UnpausePreAuthorizationResult = UpdatePauseCommonResult;

/** ClosePreAuthorization (common) */

type ClosePreAuthorizationCommonParams = {
  preAuthorization: PublicKey;
};

type ClosePreAuthorizationCommonResult = void;

/** ClosePreAuthorization (as owner) */

export type ClosePreAuthorizationAsOwnerParams =
  ClosePreAuthorizationCommonParams & {
    rentReceiver?: PublicKey;
  };

export type ClosePreAuthorizationAsOwnerResult =
  ClosePreAuthorizationCommonResult;

/** ClosePreAuthorization (as debit authority) */

export type ClosePreAuthorizationAsDebitAuthorityParams =
  ClosePreAuthorizationCommonParams;

export type ClosePreAuthorizationAsDebitAuthorityResult =
  ClosePreAuthorizationCommonResult;

/** Debit */

export type DebitParams = {
  preAuthorization: PublicKey;
  amount: bigint;
  destinationTokenAccount: PublicKey;
};

export type DebitResult = void;

/** Approve Smart Delegate */

export type ApproveSmartDelegateParams = {
  tokenAccount: PublicKey;
};

export type ApproveSmartDelegateResult = void;
