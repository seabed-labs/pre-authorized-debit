import { PublicKey } from "@solana/web3.js";

export type SmartDelegateAccount = {
  bump: number;
};

export type PreAuthorizationVariantOneTime = {
  type: "oneTime";
  amountAuthorized: bigint;
  amountDebited: bigint;
  expiryUnixTimestamp: bigint;
};

export type PreAuthorizationVariantRecurring = {
  type: "recurring";
  recurringAmountAuthorized: bigint;
  repeatFrequencySeconds: bigint;
  resetEveryCycle: boolean;
  numCycles: bigint | null;
  amountDebitedTotal: bigint;
  amountDebitedLastCycle: bigint;
  lastDebitedCycle: bigint;
};

type PreAuthorizationBase<T> = {
  bump: number;
  tokenAccount: PublicKey;
  debitAuthority: PublicKey;
  activationUnixTimestamp: bigint;
  paused: boolean;
  variant: T;
};

export type PreAuthorizationAccount = PreAuthorizationBase<
  PreAuthorizationVariantOneTime | PreAuthorizationVariantRecurring
>;
export type OneTimePreAuthorizationAccount =
  PreAuthorizationBase<PreAuthorizationVariantOneTime>;

export type RecurringPreAuthorizationAccount =
  PreAuthorizationBase<PreAuthorizationVariantRecurring>;

export const SMART_DELEGATE_DISCRIMINATOR = Buffer.from([
  47, 189, 254, 31, 76, 172, 82, 107,
]);

export const PRE_AUTHORIZATION_DISCRIMINATOR = Buffer.from([
  94, 236, 32, 243, 45, 211, 69, 50,
]);

/**
 * Compute the current cycle for a pre-authorization
 * @param chainTimestamp - the current timestamp of the chain
 * @param preAuthorization
 */
export function computePreAuthorizationCurrentCycle(
  chainTimestamp: bigint,
  preAuthorization: {
    activationUnixTimestamp: bigint;
    variant: {
      repeatFrequencySeconds: bigint;
    };
  },
): bigint {
  return (
    BigInt(1) +
    (chainTimestamp - preAuthorization.activationUnixTimestamp) /
      preAuthorization.variant.repeatFrequencySeconds
  );
}

export function computeAvailableAmountForRecurringDebit(
  currentCycle: bigint,
  preAuthorizationVariant: Exclude<
    PreAuthorizationVariantRecurring,
    "repeatFrequencySeconds" | "numCycles"
  >,
): bigint {
  const {
    lastDebitedCycle,
    resetEveryCycle,
    recurringAmountAuthorized,
    amountDebitedLastCycle,
    amountDebitedTotal,
  } = preAuthorizationVariant;
  if (!resetEveryCycle) {
    return recurringAmountAuthorized * currentCycle - amountDebitedTotal;
  } else if (resetEveryCycle && currentCycle !== lastDebitedCycle) {
    return recurringAmountAuthorized;
  } else {
    return recurringAmountAuthorized - amountDebitedLastCycle;
  }
}

export function isRecurringPreAuthorizationAccount(
  preAuthorization: PreAuthorizationAccount,
): preAuthorization is RecurringPreAuthorizationAccount {
  return preAuthorization.variant.type === "recurring";
}

export function assertsIsRecurringPreAuthorizationAccount(
  preAuthorization: PreAuthorizationAccount,
): asserts preAuthorization is RecurringPreAuthorizationAccount {
  if (!isRecurringPreAuthorizationAccount(preAuthorization)) {
    throw new Error(`Invalid variant ${preAuthorization.variant.type}`);
  }
}

export function isOneTimePreAuthorizationAccount(
  preAuthorization: PreAuthorizationAccount,
): preAuthorization is OneTimePreAuthorizationAccount {
  return preAuthorization.variant.type === "oneTime";
}
