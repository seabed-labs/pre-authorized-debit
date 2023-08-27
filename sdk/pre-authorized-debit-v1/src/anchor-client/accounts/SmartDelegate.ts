// This file was automatically generated. DO NOT MODIFY DIRECTLY.
/* eslint-disable */
import { PublicKey, Connection, GetAccountInfoConfig } from "@solana/web3.js";
import * as borsh from "@coral-xyz/borsh";
import * as types from "../types";

export interface SmartDelegateAccount {
  tokenAccount: PublicKey;
  bump: number;
}

export interface SmartDelegateAccountJSON {
  tokenAccount: string;
  bump: number;
}

export class SmartDelegate {
  readonly data: SmartDelegateAccount;

  static readonly discriminator = Buffer.from([
    47, 189, 254, 31, 76, 172, 82, 107,
  ]);

  static readonly layout = borsh.struct([
    borsh.publicKey("tokenAccount"),
    borsh.u8("bump"),
  ]);

  constructor(accountData: SmartDelegateAccount) {
    this.data = {
      tokenAccount: accountData.tokenAccount,
      bump: accountData.bump,
    };
  }

  static isDiscriminatorEqual(data: Buffer): boolean {
    return data.subarray(0, 8).equals(SmartDelegate.discriminator);
  }

  static decode(data: Buffer): SmartDelegate {
    if (!SmartDelegate.isDiscriminatorEqual(data)) {
      throw new Error("Invalid account discriminator.");
    }

    const dec = SmartDelegate.layout.decode(data.subarray(8));

    return new SmartDelegate({
      tokenAccount: dec.tokenAccount,
      bump: dec.bump,
    });
  }

  static async fetch(
    c: Connection,
    address: PublicKey,
    programId: PublicKey,
    getAccountInfoConfig?: GetAccountInfoConfig
  ): Promise<SmartDelegate | null> {
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
  ): Promise<SmartDelegate> {
    const account = await SmartDelegate.fetch(
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
  ): Promise<SmartDelegateAccount | null> {
    return await SmartDelegate.fetchNonNullable(
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
  ): Promise<SmartDelegateAccount> {
    return await SmartDelegate.fetchNonNullable(
      c,
      address,
      programId,
      getAccountInfoConfig,
      notFoundError
    ).then((a) => a.data);
  }

  static toJSON(data: SmartDelegateAccount): SmartDelegateAccountJSON {
    // convert fields to classes if needed
    const account = {
      tokenAccount: data.tokenAccount,
      bump: data.bump,
    };
    return {
      tokenAccount: account.tokenAccount.toString(),
      bump: account.bump,
    };
  }

  toJSON(): SmartDelegateAccountJSON {
    return SmartDelegate.toJSON(this.data);
  }

  static fromJSON(obj: SmartDelegateAccountJSON): SmartDelegate {
    return new SmartDelegate({
      tokenAccount: new PublicKey(obj.tokenAccount),
      bump: obj.bump,
    });
  }
}
