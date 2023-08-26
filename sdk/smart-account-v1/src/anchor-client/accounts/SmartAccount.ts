// This file was automatically generated. DO NOT MODIFY DIRECTLY.
/* eslint-disable */
import { PublicKey, Connection, GetAccountInfoConfig } from "@solana/web3.js";
import * as borsh from "@coral-xyz/borsh";
import * as types from "../types";

export interface SmartAccountAccount {
  authority: PublicKey;
  preAuthorizationNonce: bigint;
  bump: number;
}

export interface SmartAccountAccountJSON {
  authority: string;
  preAuthorizationNonce: string;
  bump: number;
}

export class SmartAccount {
  readonly data: SmartAccountAccount;

  static readonly discriminator = Buffer.from([
    186, 83, 247, 224, 59, 95, 223, 112,
  ]);

  static readonly layout = borsh.struct([
    borsh.publicKey("authority"),
    borsh.u128("preAuthorizationNonce"),
    borsh.u8("bump"),
  ]);

  constructor(accountData: SmartAccountAccount) {
    this.data = {
      authority: accountData.authority,
      preAuthorizationNonce: accountData.preAuthorizationNonce,
      bump: accountData.bump,
    };
  }

  static isDiscriminatorEqual(data: Buffer): boolean {
    return data.subarray(0, 8).equals(SmartAccount.discriminator);
  }

  static decode(data: Buffer): SmartAccount {
    if (!SmartAccount.isDiscriminatorEqual(data)) {
      throw new Error("Invalid account discriminator.");
    }

    const dec = SmartAccount.layout.decode(data.subarray(8));

    return new SmartAccount({
      authority: dec.authority,
      preAuthorizationNonce: dec.preAuthorizationNonce,
      bump: dec.bump,
    });
  }

  static async fetch(
    c: Connection,
    address: PublicKey,
    programId: PublicKey,
    getAccountInfoConfig?: GetAccountInfoConfig
  ): Promise<SmartAccount | null> {
    const info = await c.getAccountInfo(address, getAccountInfoConfig);
    if (info === null) {
      return null;
    }
    if (!info.owner.equals(programId)) {
      throw new Error("Account doesn't belong to this program.");
    }
    return this.decode(info.data);
  }

  static async fetchNonNullable(
    c: Connection,
    address: PublicKey,
    programId: PublicKey,
    getAccountInfoConfig?: GetAccountInfoConfig,
    notFoundError: Error = new Error("Account with address not found.")
  ): Promise<SmartAccount> {
    const account = await SmartAccount.fetch(
      c,
      address,
      programId,
      getAccountInfoConfig
    );
    if (!account) {
      throw notFoundError;
    }
    return account;
  }

  static async fetchNullableData(
    c: Connection,
    address: PublicKey,
    programId: PublicKey,
    getAccountInfoConfig?: GetAccountInfoConfig,
    notFoundError: Error = new Error("Account with address not found.")
  ): Promise<SmartAccountAccount | null> {
    return await SmartAccount.fetchNonNullable(
      c,
      address,
      programId,
      getAccountInfoConfig,
      notFoundError
    ).then((a) => a?.data);
  }

  static async fetchNonNullableData(
    c: Connection,
    address: PublicKey,
    programId: PublicKey,
    getAccountInfoConfig?: GetAccountInfoConfig,
    notFoundError: Error = new Error("Account with address not found.")
  ): Promise<SmartAccountAccount> {
    return await SmartAccount.fetchNonNullable(
      c,
      address,
      programId,
      getAccountInfoConfig,
      notFoundError
    ).then((a) => a.data);
  }

  static toJSON(data: SmartAccountAccount): SmartAccountAccountJSON {
    // convert fields to classes if needed
    const account = {
      authority: data.authority,
      preAuthorizationNonce: data.preAuthorizationNonce,
      bump: data.bump,
    };
    return {
      authority: account.authority.toString(),
      preAuthorizationNonce: account.preAuthorizationNonce.toString(),
      bump: account.bump,
    };
  }

  toJSON(): SmartAccountAccountJSON {
    return SmartAccount.toJSON(this.data);
  }

  static fromJSON(obj: SmartAccountAccountJSON): SmartAccount {
    return new SmartAccount({
      authority: new PublicKey(obj.authority),
      preAuthorizationNonce: BigInt(obj.preAuthorizationNonce),
      bump: obj.bump,
    });
  }
}
