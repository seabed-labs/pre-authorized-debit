// This file was automatically generated. DO NOT MODIFY DIRECTLY.
/* eslint-disable */
import { PublicKey, Connection, GetAccountInfoConfig } from "@solana/web3.js";
import * as borsh from "@coral-xyz/borsh";
import * as types from "../types";

export interface PreAuthorizationAccount {
  smartAccount: PublicKey;
  variant: types.PreAuthorizationVariantKind;
  mint: PublicKey;
  debitAuthority: PublicKey;
  activationUnixTimestamp: bigint;
  amountDebited: bigint;
  bump: number;
}

export interface PreAuthorizationAccountJSON {
  smartAccount: string;
  variant: types.PreAuthorizationVariantJSON;
  mint: string;
  debitAuthority: string;
  activationUnixTimestamp: string;
  amountDebited: string;
  bump: number;
}

export class PreAuthorization {
  readonly data: PreAuthorizationAccount;

  static readonly discriminator = Buffer.from([
    94, 236, 32, 243, 45, 211, 69, 50,
  ]);

  static readonly layout = borsh.struct([
    borsh.publicKey("smartAccount"),
    types.PreAuthorizationVariant.layout("variant"),
    borsh.publicKey("mint"),
    borsh.publicKey("debitAuthority"),
    borsh.u64("activationUnixTimestamp"),
    borsh.u64("amountDebited"),
    borsh.u8("bump"),
  ]);

  constructor(accountData: PreAuthorizationAccount) {
    this.data = {
      smartAccount: accountData.smartAccount,
      variant: accountData.variant,
      mint: accountData.mint,
      debitAuthority: accountData.debitAuthority,
      activationUnixTimestamp: accountData.activationUnixTimestamp,
      amountDebited: accountData.amountDebited,
      bump: accountData.bump,
    };
  }

  static isDiscriminatorEqual(data: Buffer): boolean {
    return data.subarray(0, 8).equals(PreAuthorization.discriminator);
  }

  static decode(data: Buffer): PreAuthorization {
    if (!PreAuthorization.isDiscriminatorEqual(data)) {
      throw new Error("Invalid account discriminator.");
    }

    const dec = PreAuthorization.layout.decode(data.subarray(8));

    return new PreAuthorization({
      smartAccount: dec.smartAccount,
      variant: types.PreAuthorizationVariant.fromDecoded(dec.variant),
      mint: dec.mint,
      debitAuthority: dec.debitAuthority,
      activationUnixTimestamp: dec.activationUnixTimestamp,
      amountDebited: dec.amountDebited,
      bump: dec.bump,
    });
  }

  static async fetch(
    c: Connection,
    address: PublicKey,
    programId: PublicKey,
    getAccountInfoConfig?: GetAccountInfoConfig
  ): Promise<PreAuthorization | null> {
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
  ): Promise<PreAuthorization> {
    const account = await PreAuthorization.fetch(
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
  ): Promise<PreAuthorizationAccount | null> {
    return await PreAuthorization.fetchNonNullable(
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
  ): Promise<PreAuthorizationAccount> {
    return await PreAuthorization.fetchNonNullable(
      c,
      address,
      programId,
      getAccountInfoConfig,
      notFoundError
    ).then((a) => a.data);
  }

  static toJSON(data: PreAuthorizationAccount): PreAuthorizationAccountJSON {
    // convert fields to classes if needed
    const account = {
      smartAccount: data.smartAccount,
      variant: data.variant,
      mint: data.mint,
      debitAuthority: data.debitAuthority,
      activationUnixTimestamp: data.activationUnixTimestamp,
      amountDebited: data.amountDebited,
      bump: data.bump,
    };
    return {
      smartAccount: account.smartAccount.toString(),
      variant: account.variant.toJSON(),
      mint: account.mint.toString(),
      debitAuthority: account.debitAuthority.toString(),
      activationUnixTimestamp: account.activationUnixTimestamp.toString(),
      amountDebited: account.amountDebited.toString(),
      bump: account.bump,
    };
  }

  toJSON(): PreAuthorizationAccountJSON {
    return PreAuthorization.toJSON(this.data);
  }

  static fromJSON(obj: PreAuthorizationAccountJSON): PreAuthorization {
    return new PreAuthorization({
      smartAccount: new PublicKey(obj.smartAccount),
      variant: types.PreAuthorizationVariant.fromJSON(obj.variant),
      mint: new PublicKey(obj.mint),
      debitAuthority: new PublicKey(obj.debitAuthority),
      activationUnixTimestamp: BigInt(obj.activationUnixTimestamp),
      amountDebited: BigInt(obj.amountDebited),
      bump: obj.bump,
    });
  }
}
