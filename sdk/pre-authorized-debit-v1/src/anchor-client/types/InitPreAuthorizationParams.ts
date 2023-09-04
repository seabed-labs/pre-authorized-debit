// This file was automatically generated. DO NOT MODIFY DIRECTLY.
/* eslint-disable */
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import * as types from "../types";
import * as borsh from "@coral-xyz/borsh";

export interface InitPreAuthorizationParamsFields {
  variant: types.InitPreAuthorizationVariantKind;
  debitAuthority: PublicKey;
  activationUnixTimestamp: bigint;
}

export interface InitPreAuthorizationParamsJSON {
  variant: types.InitPreAuthorizationVariantJSON;
  debitAuthority: string;
  activationUnixTimestamp: string;
}

export class InitPreAuthorizationParams {
  readonly variant: types.InitPreAuthorizationVariantKind;
  readonly debitAuthority: PublicKey;
  readonly activationUnixTimestamp: bigint;

  constructor(fields: InitPreAuthorizationParamsFields) {
    this.variant = fields.variant;
    this.debitAuthority = fields.debitAuthority;
    this.activationUnixTimestamp = fields.activationUnixTimestamp;
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        types.InitPreAuthorizationVariant.layout("variant"),
        borsh.publicKey("debitAuthority"),
        borsh.i64("activationUnixTimestamp"),
      ],
      property,
    );
  }

  static fromDecoded(obj: any) {
    return new InitPreAuthorizationParams({
      variant: types.InitPreAuthorizationVariant.fromDecoded(obj.variant),
      debitAuthority: obj.debitAuthority,
      activationUnixTimestamp: obj.activationUnixTimestamp,
    });
  }

  static toEncodable(fields: InitPreAuthorizationParamsFields) {
    return {
      variant: fields.variant.toEncodable(),
      debitAuthority: fields.debitAuthority,
      activationUnixTimestamp: new BN(
        fields.activationUnixTimestamp.toString(),
      ),
    };
  }

  toEncodable() {
    return InitPreAuthorizationParams.toEncodable(this);
  }

  toJSON(): InitPreAuthorizationParamsJSON {
    return {
      variant: this.variant.toJSON(),
      debitAuthority: this.debitAuthority.toString(),
      activationUnixTimestamp: this.activationUnixTimestamp.toString(),
    };
  }

  static fromJSON(
    obj: InitPreAuthorizationParamsJSON,
  ): InitPreAuthorizationParams {
    return new InitPreAuthorizationParams({
      variant: types.InitPreAuthorizationVariant.fromJSON(obj.variant),
      debitAuthority: new PublicKey(obj.debitAuthority),
      activationUnixTimestamp: BigInt(obj.activationUnixTimestamp),
    });
  }
}
