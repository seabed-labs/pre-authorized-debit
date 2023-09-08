// This file was automatically generated. DO NOT MODIFY DIRECTLY.
/* eslint-disable */
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import * as types from "../types";
import * as borsh from "@coral-xyz/borsh";

export type OneTimeFields = {
  amountAuthorized: bigint;
  expiryUnixTimestamp: bigint;
};
export type OneTimeValue = {
  amountAuthorized: bigint;
  expiryUnixTimestamp: bigint;
};

export interface OneTimeJSON {
  kind: "OneTime";
  value: {
    amountAuthorized: string;
    expiryUnixTimestamp: string;
  };
}

export class OneTime {
  static readonly discriminator = 0;
  static readonly kind = "OneTime";
  readonly discriminator = 0;
  readonly kind = "OneTime";
  readonly value: OneTimeValue;

  constructor(value: OneTimeFields) {
    this.value = {
      amountAuthorized: value.amountAuthorized,
      expiryUnixTimestamp: value.expiryUnixTimestamp,
    };
  }

  toJSON(): OneTimeJSON {
    return {
      kind: "OneTime",
      value: {
        amountAuthorized: this.value.amountAuthorized.toString(),
        expiryUnixTimestamp: this.value.expiryUnixTimestamp.toString(),
      },
    };
  }

  toEncodable() {
    return {
      OneTime: {
        amount_authorized: new BN(this.value.amountAuthorized.toString()),
        expiry_unix_timestamp: new BN(
          this.value.expiryUnixTimestamp.toString()
        ),
      },
    };
  }
}

export type RecurringFields = {
  repeatFrequencySeconds: bigint;
  recurringAmountAuthorized: bigint;
  numCycles: bigint | null;
  resetEveryCycle: boolean;
};
export type RecurringValue = {
  repeatFrequencySeconds: bigint;
  recurringAmountAuthorized: bigint;
  numCycles: bigint | null;
  resetEveryCycle: boolean;
};

export interface RecurringJSON {
  kind: "Recurring";
  value: {
    repeatFrequencySeconds: string;
    recurringAmountAuthorized: string;
    numCycles: string | null;
    resetEveryCycle: boolean;
  };
}

export class Recurring {
  static readonly discriminator = 1;
  static readonly kind = "Recurring";
  readonly discriminator = 1;
  readonly kind = "Recurring";
  readonly value: RecurringValue;

  constructor(value: RecurringFields) {
    this.value = {
      repeatFrequencySeconds: value.repeatFrequencySeconds,
      recurringAmountAuthorized: value.recurringAmountAuthorized,
      numCycles: value.numCycles,
      resetEveryCycle: value.resetEveryCycle,
    };
  }

  toJSON(): RecurringJSON {
    return {
      kind: "Recurring",
      value: {
        repeatFrequencySeconds: this.value.repeatFrequencySeconds.toString(),
        recurringAmountAuthorized:
          this.value.recurringAmountAuthorized.toString(),
        numCycles:
          (this.value.numCycles && this.value.numCycles.toString()) || null,
        resetEveryCycle: this.value.resetEveryCycle,
      },
    };
  }

  toEncodable() {
    return {
      Recurring: {
        repeat_frequency_seconds: new BN(
          this.value.repeatFrequencySeconds.toString()
        ),
        recurring_amount_authorized: new BN(
          this.value.recurringAmountAuthorized.toString()
        ),
        num_cycles:
          (this.value.numCycles && new BN(this.value.numCycles.toString())) ||
          null,
        reset_every_cycle: this.value.resetEveryCycle,
      },
    };
  }
}

export function fromDecoded(obj: any): types.InitPreAuthorizationVariantKind {
  if (typeof obj !== "object") {
    throw new Error("Invalid enum object");
  }

  if ("OneTime" in obj) {
    const val = obj["OneTime"];
    return new OneTime({
      amountAuthorized: val["amount_authorized"],
      expiryUnixTimestamp: val["expiry_unix_timestamp"],
    });
  }
  if ("Recurring" in obj) {
    const val = obj["Recurring"];
    return new Recurring({
      repeatFrequencySeconds: val["repeat_frequency_seconds"],
      recurringAmountAuthorized: val["recurring_amount_authorized"],
      numCycles: val["num_cycles"],
      resetEveryCycle: val["reset_every_cycle"],
    });
  }

  throw new Error("Invalid enum object");
}

export function fromJSON(
  obj: types.InitPreAuthorizationVariantJSON
): types.InitPreAuthorizationVariantKind {
  switch (obj.kind) {
    case "OneTime": {
      return new OneTime({
        amountAuthorized: BigInt(obj.value.amountAuthorized),
        expiryUnixTimestamp: BigInt(obj.value.expiryUnixTimestamp),
      });
    }
    case "Recurring": {
      return new Recurring({
        repeatFrequencySeconds: BigInt(obj.value.repeatFrequencySeconds),
        recurringAmountAuthorized: BigInt(obj.value.recurringAmountAuthorized),
        numCycles: (obj.value.numCycles && BigInt(obj.value.numCycles)) || null,
        resetEveryCycle: obj.value.resetEveryCycle,
      });
    }
  }
}

export function layout(property?: string) {
  const ret = borsh.rustEnum([
    borsh.struct(
      [borsh.u64("amount_authorized"), borsh.i64("expiry_unix_timestamp")],
      "OneTime"
    ),
    borsh.struct(
      [
        borsh.u64("repeat_frequency_seconds"),
        borsh.u64("recurring_amount_authorized"),
        borsh.option(borsh.u64(), "num_cycles"),
        borsh.bool("reset_every_cycle"),
      ],
      "Recurring"
    ),
  ]);
  if (property !== undefined) {
    return ret.replicate(property);
  }
  return ret;
}
