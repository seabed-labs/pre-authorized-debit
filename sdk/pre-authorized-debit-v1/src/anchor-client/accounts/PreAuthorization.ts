// This file was automatically generated. DO NOT MODIFY DIRECTLY.
/* eslint-disable */
import { PublicKey, Connection, GetAccountInfoConfig } from "@solana/web3.js";
import * as borsh from "@coral-xyz/borsh";
import * as types from "../types";

export interface PreAuthorizationAccount {
  /**
   * The `bump` is the canonical PDA bump when derived with seeds:
   *       ['pre-authorization', token_account, debit_authority].
   *       This field is initialized in `init_pre_authorization`.
   *       This field is never updated in any instruction.
   */
  bump: number;
  /**
   * If `paused === true`, then the `debit_authority` cannot debit via the `token_account`.
   *       This field is initialized to `false` in `init_pre_authorization`.
   *       This field can be updated by the `token_account.owner` in `update_pause_pre_authorization`.
   */
  paused: boolean;
  /**
   * The `token_account` is the account the `debit_authority` will be able to debit from.
   *       This field is initialized in `init_pre_authorization`.
   *       This field is never updated in any instruction.
   */
  tokenAccount: PublicKey;
  /**
   * The `variant` contains the data specific to a one-time
   *       or recurring debit.
   *       This field is initialized in `init_pre_authorization`.
   *       This field is never updated in any instruction.
   */
  variant: types.PreAuthorizationVariantKind;
  /**
   * The `debit_authority` is the key that can debit from the `token_account`.
   *       This field is initialized in `init_pre_authorization`.
   *       This field is never updated in any instruction.
   */
  debitAuthority: PublicKey;
  /**
   * The `activation_unix_timestamp` represents when the debit_authority can next debit
   *       from the `token_account`.
   *       The field is initialized to __ in `init_pre_authorization`.
   *       This field is updated in __ TODO(18f6ba).
   */
  activationUnixTimestamp: bigint;
}

export interface PreAuthorizationAccountJSON {
  /**
   * The `bump` is the canonical PDA bump when derived with seeds:
   *       ['pre-authorization', token_account, debit_authority].
   *       This field is initialized in `init_pre_authorization`.
   *       This field is never updated in any instruction.
   */
  bump: number;
  /**
   * If `paused === true`, then the `debit_authority` cannot debit via the `token_account`.
   *       This field is initialized to `false` in `init_pre_authorization`.
   *       This field can be updated by the `token_account.owner` in `update_pause_pre_authorization`.
   */
  paused: boolean;
  /**
   * The `token_account` is the account the `debit_authority` will be able to debit from.
   *       This field is initialized in `init_pre_authorization`.
   *       This field is never updated in any instruction.
   */
  tokenAccount: string;
  /**
   * The `variant` contains the data specific to a one-time
   *       or recurring debit.
   *       This field is initialized in `init_pre_authorization`.
   *       This field is never updated in any instruction.
   */
  variant: types.PreAuthorizationVariantJSON;
  /**
   * The `debit_authority` is the key that can debit from the `token_account`.
   *       This field is initialized in `init_pre_authorization`.
   *       This field is never updated in any instruction.
   */
  debitAuthority: string;
  /**
   * The `activation_unix_timestamp` represents when the debit_authority can next debit
   *       from the `token_account`.
   *       The field is initialized to __ in `init_pre_authorization`.
   *       This field is updated in __ TODO(18f6ba).
   */
  activationUnixTimestamp: string;
}

/**
 * The `pre_authorization` is a PDA account derived with the seeds:
 *  ['pre-authorization', token_account, debit_authority].
 *  The `pre_authorization` can be thought of as the rule for the `smart_delegate`.
 *  The `pre_authorization` can validate a recurring or one-time debit from the `token_account`.
 *  The `smart_delegate` will validate the rules of the `pre_authorization` in the `debit` instruction.
 *  A `pre_authorization` is associated many:1 with a `token_account`,
 *  however, for a given `debit_authority` and `token_account` there can only be one `pre_authorization`.
 */
export class PreAuthorization {
  readonly data: PreAuthorizationAccount;

  static readonly discriminator = Buffer.from([
    94, 236, 32, 243, 45, 211, 69, 50,
  ]);

  static readonly layout = borsh.struct([
    borsh.u8("bump"),
    borsh.bool("paused"),
    borsh.publicKey("tokenAccount"),
    types.PreAuthorizationVariant.layout("variant"),
    borsh.publicKey("debitAuthority"),
    borsh.i64("activationUnixTimestamp"),
  ]);

  constructor(accountData: PreAuthorizationAccount) {
    this.data = {
      bump: accountData.bump,
      paused: accountData.paused,
      tokenAccount: accountData.tokenAccount,
      variant: accountData.variant,
      debitAuthority: accountData.debitAuthority,
      activationUnixTimestamp: accountData.activationUnixTimestamp,
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
      bump: dec.bump,
      paused: dec.paused,
      tokenAccount: dec.tokenAccount,
      variant: types.PreAuthorizationVariant.fromDecoded(dec.variant),
      debitAuthority: dec.debitAuthority,
      activationUnixTimestamp: dec.activationUnixTimestamp,
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
      bump: data.bump,
      paused: data.paused,
      tokenAccount: data.tokenAccount,
      variant: data.variant,
      debitAuthority: data.debitAuthority,
      activationUnixTimestamp: data.activationUnixTimestamp,
    };
    return {
      bump: account.bump,
      paused: account.paused,
      tokenAccount: account.tokenAccount.toString(),
      variant: account.variant.toJSON(),
      debitAuthority: account.debitAuthority.toString(),
      activationUnixTimestamp: account.activationUnixTimestamp.toString(),
    };
  }

  toJSON(): PreAuthorizationAccountJSON {
    return PreAuthorization.toJSON(this.data);
  }

  static fromJSON(obj: PreAuthorizationAccountJSON): PreAuthorization {
    return new PreAuthorization({
      bump: obj.bump,
      paused: obj.paused,
      tokenAccount: new PublicKey(obj.tokenAccount),
      variant: types.PreAuthorizationVariant.fromJSON(obj.variant),
      debitAuthority: new PublicKey(obj.debitAuthority),
      activationUnixTimestamp: BigInt(obj.activationUnixTimestamp),
    });
  }
}
