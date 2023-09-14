import { PublicKey } from "@solana/web3.js";
import { InstructionWithData } from "./shared";

type InitPreAuthIxSharedParams = {
  payer: PublicKey;
  tokenAccount: PublicKey;
  debitAuthority: PublicKey;
  activation: Date;
};

export interface InstructionFactory {
  buildInitSmartDelegateIx(param: {
    payer: PublicKey;
  }): Promise<InstructionWithData<{ smartDelegate: PublicKey }>>;

  buildInitOneTimePreAuthorizationIx(
    params: InitPreAuthIxSharedParams & {
      amountAuthorized: bigint;
      // if not set, will default to i64::max (i.e. never expires)
      expiry?: Date;
    },
  ): Promise<InstructionWithData<{ preAuthorization: PublicKey }>>;

  buildInitRecurringPreAuthorizationIx(
    params: InitPreAuthIxSharedParams & {
      repeatFrequencySeconds: bigint;
      recurringAmountAuthorized: bigint;
      numCycles: bigint | null;
      resetEveryCycle: boolean;
    },
  ): Promise<InstructionWithData<{ preAuthorization: PublicKey }>>;

  buildUpdatePausePreAuthorizationIx(params: {
    preAuthorization: PublicKey;
    pause: boolean;
  }): Promise<InstructionWithData<null>>;

  buildClosePreAuthorizationAsOwnerIx(params: {
    preAuthorization: PublicKey;
    lamportsReceiver?: PublicKey;
  }): Promise<InstructionWithData<null>>;

  buildClosePreAuthorizationAsDebitAuthorityIx(params: {
    preAuthorization: PublicKey;
  }): Promise<InstructionWithData<null>>;

  buildDebitIx(params: {
    preAuthorization: PublicKey;
    amount: bigint;
    destinationTokenAccount: PublicKey;
  }): Promise<InstructionWithData<null>>;

  // sets delegate to smartDelegate and amount to u64::max
  buildActivateSmartDelegateIx(params: {
    tokenAccount: PublicKey;
  }): Promise<InstructionWithData<null>>;
}
