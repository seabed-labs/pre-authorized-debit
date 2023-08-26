// This file was automatically generated. DO NOT MODIFY DIRECTLY.
/* eslint-disable */
import { PublicKey, Connection, GetAccountInfoConfig } from "@solana/web3.js";
import * as borsh from "@coral-xyz/borsh";
import * as types from "../types";

export interface SmartAccountNonceAccount {
  nonce: bigint;
  bump: number;
}

export interface SmartAccountNonceAccountJSON {
  nonce: string;
  bump: number;
}

export class SmartAccountNonce {
  readonly data: SmartAccountNonceAccount;

  static readonly discriminator = Buffer.from([
    215, 39, 57, 122, 217, 177, 125, 223,
  ]);

  static readonly layout = borsh.struct([
    borsh.u128("nonce"),
    borsh.u8("bump"),
  ]);

  constructor(accountData: SmartAccountNonceAccount) {
    this.data = {
      nonce: accountData.nonce,
      bump: accountData.bump,
    };
  }

  static isDiscriminatorEqual(data: Buffer): boolean {
    return data.subarray(0, 8).equals(SmartAccountNonce.discriminator);
  }

  static decode(data: Buffer): SmartAccountNonce {
    if (!SmartAccountNonce.isDiscriminatorEqual(data)) {
      throw new Error("Invalid account discriminator.");
    }

    const dec = SmartAccountNonce.layout.decode(data.subarray(8));

    return new SmartAccountNonce({
      nonce: dec.nonce,
      bump: dec.bump,
    });
  }

  static async fetch(
    c: Connection,
    address: PublicKey,
    programId: PublicKey,
    getAccountInfoConfig?: GetAccountInfoConfig
  ): Promise<SmartAccountNonce | null> {
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
  ): Promise<SmartAccountNonce> {
    const account = await SmartAccountNonce.fetch(
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
  ): Promise<SmartAccountNonceAccount | null> {
    return await SmartAccountNonce.fetchNonNullable(
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
  ): Promise<SmartAccountNonceAccount> {
    return await SmartAccountNonce.fetchNonNullable(
      c,
      address,
      programId,
      getAccountInfoConfig,
      notFoundError
    ).then((a) => a.data);
  }

  static toJSON(data: SmartAccountNonceAccount): SmartAccountNonceAccountJSON {
    // convert fields to classes if needed
    const account = {
      nonce: data.nonce,
      bump: data.bump,
    };
    return {
      nonce: account.nonce.toString(),
      bump: account.bump,
    };
  }

  toJSON(): SmartAccountNonceAccountJSON {
    return SmartAccountNonce.toJSON(this.data);
  }

  static fromJSON(obj: SmartAccountNonceAccountJSON): SmartAccountNonce {
    return new SmartAccountNonce({
      nonce: BigInt(obj.nonce),
      bump: obj.bump,
    });
  }
}
