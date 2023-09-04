// This file was automatically generated. DO NOT MODIFY DIRECTLY.
/* eslint-disable */
import { PublicKey, Connection, GetAccountInfoConfig } from "@solana/web3.js";
import * as borsh from "@coral-xyz/borsh";
import * as types from "../types";

export interface SmartDelegateAccount {
  /**
   * The `bump` is the canonical PDA bump when derived with seeds:
   *       ['smart-delegate', token_account].
   *       This field is initialized in `init_smart_delegate`.
   *       This field is never updated in any instruction.
   */
  bump: number;
  /**
   * The `token_account` is initialized in `init_smart_delegate`.
   *       This field is never updated in any instruction.
   */
  tokenAccount: PublicKey;
}

export interface SmartDelegateAccountJSON {
  /**
   * The `bump` is the canonical PDA bump when derived with seeds:
   *       ['smart-delegate', token_account].
   *       This field is initialized in `init_smart_delegate`.
   *       This field is never updated in any instruction.
   */
  bump: number;
  /**
   * The `token_account` is initialized in `init_smart_delegate`.
   *       This field is never updated in any instruction.
   */
  tokenAccount: string;
}

/**
 * The `smart_delegate` is a PDA account derived with the seeds:
 *   ['smart-delegate', token_account].
 *   The `smart_delegate` is set as the delegate of
 *   the `token_account` in `init_smart_delegate` with u64::max.
 *   A `smart_delegate` is associated 1:1 with a `token_account`.
 */
export class SmartDelegate {
  readonly data: SmartDelegateAccount;

  static readonly discriminator = Buffer.from([
    47, 189, 254, 31, 76, 172, 82, 107,
  ]);

  static readonly layout = borsh.struct([
    borsh.u8("bump"),
    borsh.publicKey("tokenAccount"),
  ]);

  constructor(accountData: SmartDelegateAccount) {
    this.data = {
      bump: accountData.bump,
      tokenAccount: accountData.tokenAccount,
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
      bump: dec.bump,
      tokenAccount: dec.tokenAccount,
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
      bump: data.bump,
      tokenAccount: data.tokenAccount,
    };
    return {
      bump: account.bump,
      tokenAccount: account.tokenAccount.toString(),
    };
  }

  toJSON(): SmartDelegateAccountJSON {
    return SmartDelegate.toJSON(this.data);
  }

  static fromJSON(obj: SmartDelegateAccountJSON): SmartDelegate {
    return new SmartDelegate({
      bump: obj.bump,
      tokenAccount: new PublicKey(obj.tokenAccount),
    });
  }
}
