// This file was automatically generated. DO NOT MODIFY DIRECTLY.
/* eslint-disable */
import {
  TransactionInstruction,
  PublicKey,
  AccountMeta,
} from "@solana/web3.js";
import BN from "bn.js";
import * as borsh from "@coral-xyz/borsh";
import * as types from "../types";

export interface UpdatePausePreAuthorizationArgs {
  params: types.UpdatePausePreAuthorizationParamsFields;
}

export interface UpdatePausePreAuthorizationArgsJSON {
  params: types.UpdatePausePreAuthorizationParamsJSON;
}

export interface UpdatePausePreAuthorizationAccounts {
  owner: PublicKey;
  tokenAccount: PublicKey;
  preAuthorization: PublicKey;
}

export interface UpdatePausePreAuthorizationAccountsJSON {
  owner: string;
  tokenAccount: string;
  preAuthorization: string;
}

export interface UpdatePausePreAuthorizationInstruction {
  args: UpdatePausePreAuthorizationArgs;
  accounts: UpdatePausePreAuthorizationAccounts;
}

export interface UpdatePausePreAuthorizationInstructionJSON {
  args: UpdatePausePreAuthorizationArgsJSON;
  accounts: UpdatePausePreAuthorizationAccountsJSON;
}

const layout = borsh.struct([
  types.UpdatePausePreAuthorizationParams.layout("params"),
]);

/**
 * The `UpdatePausePreAuthorization` instruction allows a `token_account.owner` to pause a
 *     `pre_authorization`.
 *
 *     The `owner` MUST sign the transaction.
 *     The `owner` MUST equal the `token_account.owner`.
 *     The `token_account.owner` MUST equal the `owner`.
 *     The `pre_authorization.token_account` MUST equal the `token_account`.
 *
 *     Accounts expected by this instruction:
 *       0. `[writable]` owner
 *       2. `[]`         token_account
 *       3. `[writable]` pre_authorization
 */
export class UpdatePausePreAuthorization {
  static readonly ixName = "updatePausePreAuthorization";
  readonly ixName = UpdatePausePreAuthorization.ixName;
  static readonly identifier: Buffer = Buffer.from([
    218, 9, 69, 174, 155, 175, 146, 164,
  ]);

  constructor(
    readonly programId: PublicKey,
    readonly instructionData: UpdatePausePreAuthorizationInstruction
  ) {}

  static isIdentifierEqual(ixData: Buffer): boolean {
    return ixData.subarray(0, 8).equals(UpdatePausePreAuthorization.identifier);
  }

  static fromDecoded(
    programId: PublicKey,
    args: UpdatePausePreAuthorizationArgs,
    flattenedAccounts: PublicKey[]
  ): UpdatePausePreAuthorization {
    const accounts = {
      owner: flattenedAccounts[0],
      tokenAccount: flattenedAccounts[1],
      preAuthorization: flattenedAccounts[2],
    };
    return new UpdatePausePreAuthorization(programId, { args, accounts });
  }

  static decode(
    programId: PublicKey,
    ixData: Uint8Array,
    flattenedAccounts: PublicKey[]
  ): UpdatePausePreAuthorization {
    return UpdatePausePreAuthorization.fromDecoded(
      programId,
      layout.decode(ixData, UpdatePausePreAuthorization.identifier.length),
      flattenedAccounts
    );
  }

  toAccountMetas(): AccountMeta[] {
    return [
      {
        pubkey: this.instructionData.accounts.owner,
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: this.instructionData.accounts.tokenAccount,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: this.instructionData.accounts.preAuthorization,
        isSigner: false,
        isWritable: true,
      },
    ];
  }

  build() {
    const buffer = Buffer.alloc(1000);
    const len = layout.encode(
      {
        params: types.UpdatePausePreAuthorizationParams.toEncodable(
          this.instructionData.args.params
        ),
      },
      buffer
    );
    const data = Buffer.concat([
      UpdatePausePreAuthorization.identifier,
      buffer,
    ]).slice(0, 8 + len);
    const ix = new TransactionInstruction({
      keys: this.toAccountMetas(),
      programId: this.programId,
      data,
    });
    return ix;
  }

  toArgsJSON(): UpdatePausePreAuthorizationArgsJSON {
    const args = {
      params: new types.UpdatePausePreAuthorizationParams({
        ...this.instructionData.args.params,
      }),
    };
    return {
      params: args.params.toJSON(),
    };
  }

  toAccountsJSON(): UpdatePausePreAuthorizationAccountsJSON {
    return {
      owner: this.instructionData.accounts.owner.toString(),
      tokenAccount: this.instructionData.accounts.tokenAccount.toString(),
      preAuthorization:
        this.instructionData.accounts.preAuthorization.toString(),
    };
  }

  toJSON(): UpdatePausePreAuthorizationInstructionJSON {
    return { args: this.toArgsJSON(), accounts: this.toAccountsJSON() };
  }
}
