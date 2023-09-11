// This file was automatically generated. DO NOT MODIFY DIRECTLY.
/* eslint-disable */
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import * as types from "../types";
import * as borsh from "@coral-xyz/borsh";

export type OneTimeFields = {
  debitAmount: bigint;
};
export type OneTimeValue = {
  debitAmount: bigint;
};

export interface OneTimeJSON {
  kind: "OneTime";
  value: {
    debitAmount: string;
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
      debitAmount: value.debitAmount,
    };
  }

  toJSON(): OneTimeJSON {
    return {
      kind: "OneTime",
      value: {
        debitAmount: this.value.debitAmount.toString(),
      },
    };
  }

  toEncodable() {
    return {
      OneTime: {
        debit_amount: new BN(this.value.debitAmount.toString()),
      },
    };
  }
}

export type RecurringFields = {
  debitAmount: bigint;
  cycle: bigint;
};
export type RecurringValue = {
  debitAmount: bigint;
  cycle: bigint;
};

export interface RecurringJSON {
  kind: "Recurring";
  value: {
    debitAmount: string;
    cycle: string;
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
      debitAmount: value.debitAmount,
      cycle: value.cycle,
    };
  }

  toJSON(): RecurringJSON {
    return {
      kind: "Recurring",
      value: {
        debitAmount: this.value.debitAmount.toString(),
        cycle: this.value.cycle.toString(),
      },
    };
  }

  toEncodable() {
    return {
      Recurring: {
        debit_amount: new BN(this.value.debitAmount.toString()),
        cycle: new BN(this.value.cycle.toString()),
      },
    };
  }
}

export function fromDecoded(obj: any): types.DebitEventVariantKind {
  if (typeof obj !== "object") {
    throw new Error("Invalid enum object");
  }

  if ("OneTime" in obj) {
    const val = obj["OneTime"];
    return new OneTime({
      debitAmount: val["debit_amount"],
    });
  }
  if ("Recurring" in obj) {
    const val = obj["Recurring"];
    return new Recurring({
      debitAmount: val["debit_amount"],
      cycle: val["cycle"],
    });
  }

  throw new Error("Invalid enum object");
}

export function fromJSON(
  obj: types.DebitEventVariantJSON,
): types.DebitEventVariantKind {
  switch (obj.kind) {
    case "OneTime": {
      return new OneTime({
        debitAmount: BigInt(obj.value.debitAmount),
      });
    }
    case "Recurring": {
      return new Recurring({
        debitAmount: BigInt(obj.value.debitAmount),
        cycle: BigInt(obj.value.cycle),
      });
    }
  }
}

export function layout(property?: string) {
  const ret = borsh.rustEnum([
    borsh.struct([borsh.u64("debit_amount")], "OneTime"),
    borsh.struct([borsh.u64("debit_amount"), borsh.u64("cycle")], "Recurring"),
  ]);
  if (property !== undefined) {
    return ret.replicate(property);
  }
  return ret;
}
