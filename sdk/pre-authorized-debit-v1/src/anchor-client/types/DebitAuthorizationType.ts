// This file was automatically generated. DO NOT MODIFY DIRECTLY.
/* eslint-disable */
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import * as types from "../types";
import * as borsh from "@coral-xyz/borsh";

export interface OneTimeJSON {
  kind: "OneTime";
}

export class OneTime {
  static readonly discriminator = 0;
  static readonly kind = "OneTime";
  readonly discriminator = 0;
  readonly kind = "OneTime";

  toJSON(): OneTimeJSON {
    return {
      kind: "OneTime",
    };
  }

  toEncodable() {
    return {
      OneTime: {},
    };
  }
}

export interface RecurringJSON {
  kind: "Recurring";
}

export class Recurring {
  static readonly discriminator = 1;
  static readonly kind = "Recurring";
  readonly discriminator = 1;
  readonly kind = "Recurring";

  toJSON(): RecurringJSON {
    return {
      kind: "Recurring",
    };
  }

  toEncodable() {
    return {
      Recurring: {},
    };
  }
}

export function fromDecoded(obj: any): types.DebitAuthorizationTypeKind {
  if (typeof obj !== "object") {
    throw new Error("Invalid enum object");
  }

  if ("OneTime" in obj) {
    return new OneTime();
  }
  if ("Recurring" in obj) {
    return new Recurring();
  }

  throw new Error("Invalid enum object");
}

export function fromJSON(
  obj: types.DebitAuthorizationTypeJSON
): types.DebitAuthorizationTypeKind {
  switch (obj.kind) {
    case "OneTime": {
      return new OneTime();
    }
    case "Recurring": {
      return new Recurring();
    }
  }
}

export function layout(property?: string) {
  const ret = borsh.rustEnum([
    borsh.struct([], "OneTime"),
    borsh.struct([], "Recurring"),
  ]);
  if (property !== undefined) {
    return ret.replicate(property);
  }
  return ret;
}
