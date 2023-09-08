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

export interface InitPreAuthorizationArgs {
  params: types.InitPreAuthorizationParamsFields;
}

export interface InitPreAuthorizationArgsJSON {
  params: types.InitPreAuthorizationParamsJSON;
}

export interface InitPreAuthorizationAccounts {
  payer: PublicKey;
  owner: PublicKey;
  tokenAccount: PublicKey;
  preAuthorization: PublicKey;
  systemProgram: PublicKey;
}

export interface InitPreAuthorizationAccountsJSON {
  payer: string;
  owner: string;
  tokenAccount: string;
  preAuthorization: string;
  systemProgram: string;
}

export interface InitPreAuthorizationInstruction {
  args: InitPreAuthorizationArgs;
  accounts: InitPreAuthorizationAccounts;
}

export interface InitPreAuthorizationInstructionJSON {
  args: InitPreAuthorizationArgsJSON;
  accounts: InitPreAuthorizationAccountsJSON;
}

const layout = borsh.struct([
  types.InitPreAuthorizationParams.layout("params"),
]);

/**
 * The `InitPreAuthorization` instruction will create a `pre_authorization` account.
 *
 *     Initializes a new account (`pre_authorization`).
 *     The `pre_authorization` defines a set of rules.
 *     The `pre_authorization` rules/constraints are verified during a `debit` instruction.
 *     The `pre_authorization` in conjunction with a `smart_delegate` for the same `token_account`
 *     can allow the `pre_authorization.debit_authority` to do a one-time or recurring debit from the
 *     `token_account.
 *     For a pair of `debit_authority` and `token_account`, only a single `pre_authorization` account can exist.
 *     To create another `pre_authorization` for the same `token_account`, another `debit_authority` must be used.
 *
 *     The `payer` MUST sign the transaction.
 *     The `payer` MUST have enough lamports to pay for the `pre_authorization` account.
 *     The `owner` MUST sign the transaction.
 *     The `owner` MUST be the `token_account.owner`.
 *     The `payer` and `owner` may be the same account.
 *     The `token_account.owner` MUST be the `owner`.
 *     The `pre_authorization.token_account` must be the same as `token_account`.
 *
 *     Accounts expected by this instruction:
 *       0. `[writable]` payer
 *       1. `[]`         owner
 *       2. `[writable]` token_account
 *       3. `[writable]` pre_authorization
 *       4. `[]`         system_program
 */
export class InitPreAuthorization {
  static readonly ixName = "initPreAuthorization";
  readonly ixName = InitPreAuthorization.ixName;
  static readonly identifier: Buffer = Buffer.from([
    161, 85, 178, 216, 242, 93, 231, 110,
  ]);

  constructor(
    readonly programId: PublicKey,
    readonly instructionData: InitPreAuthorizationInstruction,
  ) {}

  static isIdentifierEqual(ixData: Buffer): boolean {
    return ixData.subarray(0, 8).equals(InitPreAuthorization.identifier);
  }

  static fromDecoded(
    programId: PublicKey,
    args: InitPreAuthorizationArgs,
    flattenedAccounts: PublicKey[],
  ): InitPreAuthorization {
    const accounts = {
      payer: flattenedAccounts[0],
      owner: flattenedAccounts[1],
      tokenAccount: flattenedAccounts[2],
      preAuthorization: flattenedAccounts[3],
      systemProgram: flattenedAccounts[4],
    };
    return new InitPreAuthorization(programId, { args, accounts });
  }

  static decode(
    programId: PublicKey,
    ixData: Uint8Array,
    flattenedAccounts: PublicKey[],
  ): InitPreAuthorization {
    return InitPreAuthorization.fromDecoded(
      programId,
      layout.decode(ixData, InitPreAuthorization.identifier.length),
      flattenedAccounts,
    );
  }

  toAccountMetas(): AccountMeta[] {
    return [
      {
        pubkey: this.instructionData.accounts.payer,
        isSigner: true,
        isWritable: true,
      },
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
      {
        pubkey: this.instructionData.accounts.systemProgram,
        isSigner: false,
        isWritable: false,
      },
    ];
  }

  build() {
    const buffer = Buffer.alloc(1000);
    const len = layout.encode(
      {
        params: types.InitPreAuthorizationParams.toEncodable(
          this.instructionData.args.params,
        ),
      },
      buffer,
    );
    const data = Buffer.concat([InitPreAuthorization.identifier, buffer]).slice(
      0,
      8 + len,
    );
    const ix = new TransactionInstruction({
      keys: this.toAccountMetas(),
      programId: this.programId,
      data,
    });
    return ix;
  }

  toArgsJSON(): InitPreAuthorizationArgsJSON {
    const args = {
      params: new types.InitPreAuthorizationParams({
        ...this.instructionData.args.params,
      }),
    };
    return {
      params: args.params.toJSON(),
    };
  }

  toAccountsJSON(): InitPreAuthorizationAccountsJSON {
    return {
      payer: this.instructionData.accounts.payer.toString(),
      owner: this.instructionData.accounts.owner.toString(),
      tokenAccount: this.instructionData.accounts.tokenAccount.toString(),
      preAuthorization:
        this.instructionData.accounts.preAuthorization.toString(),
      systemProgram: this.instructionData.accounts.systemProgram.toString(),
    };
  }

  toJSON(): InitPreAuthorizationInstructionJSON {
    return { args: this.toArgsJSON(), accounts: this.toAccountsJSON() };
  }
}
