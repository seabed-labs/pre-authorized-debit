// This file was automatically generated. DO NOT MODIFY DIRECTLY.
/* eslint-disable */
import { PublicKey } from "@solana/web3.js";
import * as types from "../types";
import * as borsh from "@coral-xyz/borsh";

export type OneTimeFields = {
  amountAuthorized: bigint;
};
export type OneTimeValue = {
  amountAuthorized: bigint;
};

export interface OneTimeJSON {
  kind: "OneTime";
  value: {
    amountAuthorized: string;
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
    };
  }

  toJSON(): OneTimeJSON {
    return {
      kind: "OneTime",
      value: {
        amountAuthorized: this.value.amountAuthorized.toString(),
      },
    };
  }

  toEncodable() {
    return {
      OneTime: {
        amount_authorized: new BN(this.value.amountAuthorized.toString()),
      },
    };
  }
}

export type RecurringFields = {
  repeatFrequencySeconds: bigint;
  recurringAmountAuthorized: bigint;
};
export type RecurringValue = {
  repeatFrequencySeconds: bigint;
  recurringAmountAuthorized: bigint;
};

export interface RecurringJSON {
  kind: "Recurring";
  value: {
    repeatFrequencySeconds: string;
    recurringAmountAuthorized: string;
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
    };
  }

  toJSON(): RecurringJSON {
    return {
      kind: "Recurring",
      value: {
        repeatFrequencySeconds: this.value.repeatFrequencySeconds.toString(),
        recurringAmountAuthorized:
          this.value.recurringAmountAuthorized.toString(),
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
      },
    };
  }
}

export function fromDecoded(obj: any): types.PreAuthorizationVariantKind {
  if (typeof obj !== "object") {
    throw new Error("Invalid enum object");
  }

  if ("OneTime" in obj) {
    const val = obj["OneTime"];
    return new OneTime({
      amountAuthorized: val["amount_authorized"],
    });
  }
  if ("Recurring" in obj) {
    const val = obj["Recurring"];
    return new Recurring({
      repeatFrequencySeconds: val["repeat_frequency_seconds"],
      recurringAmountAuthorized: val["recurring_amount_authorized"],
    });
  }

  throw new Error("Invalid enum object");
}

export function fromJSON(
  obj: types.PreAuthorizationVariantJSON
): types.PreAuthorizationVariantKind {
  switch (obj.kind) {
    case "OneTime": {
      return new OneTime({
        amountAuthorized: BigInt(obj.value.amountAuthorized),
      });
    }
    case "Recurring": {
      return new Recurring({
        repeatFrequencySeconds: BigInt(obj.value.repeatFrequencySeconds),
        recurringAmountAuthorized: BigInt(obj.value.recurringAmountAuthorized),
      });
    }
  }
}

export function layout(property?: string) {
  const ret = borsh.rustEnum([
    borsh.struct([borsh.u64("amount_authorized")], "OneTime"),
    borsh.struct(
      [
        borsh.u64("repeat_frequency_seconds"),
        borsh.u64("recurring_amount_authorized"),
      ],
      "Recurring"
    ),
  ]);
  if (property !== undefined) {
    return ret.replicate(property);
  }
  return ret;
}
