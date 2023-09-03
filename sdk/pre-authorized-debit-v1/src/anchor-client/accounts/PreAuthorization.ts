// This file was automatically generated. DO NOT MODIFY DIRECTLY.
/* eslint-disable */
import { PublicKey, Connection, GetAccountInfoConfig } from "@solana/web3.js";
import * as borsh from "@coral-xyz/borsh";
import * as types from "../types";

export interface PreAuthorizationAccount {
  paused: boolean;
  tokenAccount: PublicKey;
  variant: types.PreAuthorizationVariantKind;
  debitAuthority: PublicKey;
  activationUnixTimestamp: bigint;
  bump: number;
}

export interface PreAuthorizationAccountJSON {
  paused: boolean;
  tokenAccount: string;
  variant: types.PreAuthorizationVariantJSON;
  debitAuthority: string;
  activationUnixTimestamp: string;
  bump: number;
}

export class PreAuthorization {
  readonly data: PreAuthorizationAccount;

  static readonly discriminator = Buffer.from([
    94, 236, 32, 243, 45, 211, 69, 50,
  ]);

  static readonly layout = borsh.struct([
    borsh.bool("paused"),
    borsh.publicKey("tokenAccount"),
    types.PreAuthorizationVariant.layout("variant"),
    borsh.publicKey("debitAuthority"),
    borsh.i64("activationUnixTimestamp"),
    borsh.u8("bump"),
  ]);

  constructor(accountData: PreAuthorizationAccount) {
    this.data = {
      paused: accountData.paused,
      tokenAccount: accountData.tokenAccount,
      variant: accountData.variant,
      debitAuthority: accountData.debitAuthority,
      activationUnixTimestamp: accountData.activationUnixTimestamp,
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
      paused: dec.paused,
      tokenAccount: dec.tokenAccount,
      variant: types.PreAuthorizationVariant.fromDecoded(dec.variant),
      debitAuthority: dec.debitAuthority,
      activationUnixTimestamp: dec.activationUnixTimestamp,
      bump: dec.bump,
    });
  }

  static async fetch(
    c: Connection,
    address: PublicKey,
    programId: PublicKey,
    getAccountInfoConfig?: GetAccountInfoConfig,
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
    notFoundError: Error = new Error("Account with address not found."),
  ): Promise<PreAuthorization> {
    const account = await PreAuthorization.fetch(
      c,
      address,
      programId,
      getAccountInfoConfig,
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
    notFoundError: Error = new Error("Account with address not found."),
  ): Promise<PreAuthorizationAccount | null> {
    return await PreAuthorization.fetchNonNullable(
      c,
      address,
      programId,
      getAccountInfoConfig,
      notFoundError,
    ).then((a) => a?.data);
  }

  static async fetchNonNullableData(
    c: Connection,
    address: PublicKey,
    programId: PublicKey,
    getAccountInfoConfig?: GetAccountInfoConfig,
    notFoundError: Error = new Error("Account with address not found."),
  ): Promise<PreAuthorizationAccount> {
    return await PreAuthorization.fetchNonNullable(
      c,
      address,
      programId,
      getAccountInfoConfig,
      notFoundError,
    ).then((a) => a.data);
  }

  static toJSON(data: PreAuthorizationAccount): PreAuthorizationAccountJSON {
    // convert fields to classes if needed
    const account = {
      paused: data.paused,
      tokenAccount: data.tokenAccount,
      variant: data.variant,
      debitAuthority: data.debitAuthority,
      activationUnixTimestamp: data.activationUnixTimestamp,
      bump: data.bump,
    };
    return {
      paused: account.paused,
      tokenAccount: account.tokenAccount.toString(),
      variant: account.variant.toJSON(),
      debitAuthority: account.debitAuthority.toString(),
      activationUnixTimestamp: account.activationUnixTimestamp.toString(),
      bump: account.bump,
    };
  }

  toJSON(): PreAuthorizationAccountJSON {
    return PreAuthorization.toJSON(this.data);
  }

  static fromJSON(obj: PreAuthorizationAccountJSON): PreAuthorization {
    return new PreAuthorization({
      paused: obj.paused,
      tokenAccount: new PublicKey(obj.tokenAccount),
      variant: types.PreAuthorizationVariant.fromJSON(obj.variant),
      debitAuthority: new PublicKey(obj.debitAuthority),
      activationUnixTimestamp: BigInt(obj.activationUnixTimestamp),
      bump: obj.bump,
    });
  }
}
