// This file was automatically generated. DO NOT MODIFY DIRECTLY.
/* eslint-disable */
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import * as types from "../types";
import * as borsh from "@coral-xyz/borsh";

export interface PausePreAuthorizationEventDataFields {
  owner: PublicKey;
  tokenAccount: PublicKey;
  preAuthorization: PublicKey;
  newPausedValue: boolean;
}

export interface PausePreAuthorizationEventDataJSON {
  owner: string;
  tokenAccount: string;
  preAuthorization: string;
  newPausedValue: boolean;
}

export class PausePreAuthorizationEventData {
  readonly owner: PublicKey;
  readonly tokenAccount: PublicKey;
  readonly preAuthorization: PublicKey;
  readonly newPausedValue: boolean;

  constructor(fields: PausePreAuthorizationEventDataFields) {
    this.owner = fields.owner;
    this.tokenAccount = fields.tokenAccount;
    this.preAuthorization = fields.preAuthorization;
    this.newPausedValue = fields.newPausedValue;
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.publicKey("owner"),
        borsh.publicKey("tokenAccount"),
        borsh.publicKey("preAuthorization"),
        borsh.bool("newPausedValue"),
      ],
      property,
    );
  }

  static fromDecoded(obj: any) {
    return new PausePreAuthorizationEventData({
      owner: obj.owner,
      tokenAccount: obj.tokenAccount,
      preAuthorization: obj.preAuthorization,
      newPausedValue: obj.newPausedValue,
    });
  }

  static toEncodable(fields: PausePreAuthorizationEventDataFields) {
    return {
      owner: fields.owner,
      tokenAccount: fields.tokenAccount,
      preAuthorization: fields.preAuthorization,
      newPausedValue: fields.newPausedValue,
    };
  }

  toEncodable() {
    return PausePreAuthorizationEventData.toEncodable(this);
  }

  toJSON(): PausePreAuthorizationEventDataJSON {
    return {
      owner: this.owner.toString(),
      tokenAccount: this.tokenAccount.toString(),
      preAuthorization: this.preAuthorization.toString(),
      newPausedValue: this.newPausedValue,
    };
  }

  static fromJSON(
    obj: PausePreAuthorizationEventDataJSON,
  ): PausePreAuthorizationEventData {
    return new PausePreAuthorizationEventData({
      owner: new PublicKey(obj.owner),
      tokenAccount: new PublicKey(obj.tokenAccount),
      preAuthorization: new PublicKey(obj.preAuthorization),
      newPausedValue: obj.newPausedValue,
    });
  }
}
