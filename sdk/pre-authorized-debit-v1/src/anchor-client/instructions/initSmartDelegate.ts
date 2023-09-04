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

export interface InitSmartDelegateAccounts {
  payer: PublicKey;
  owner: PublicKey;
  tokenAccount: PublicKey;
  smartDelegate: PublicKey;
  tokenProgram: PublicKey;
  systemProgram: PublicKey;
}

export interface InitSmartDelegateAccountsJSON {
  payer: string;
  owner: string;
  tokenAccount: string;
  smartDelegate: string;
  tokenProgram: string;
  systemProgram: string;
}

export interface InitSmartDelegateInstruction {
  args: null;
  accounts: InitSmartDelegateAccounts;
}

export interface InitSmartDelegateInstructionJSON {
  args: null;
  accounts: InitSmartDelegateAccountsJSON;
}

/**
 * The `init_smart_delegate` instruction will create a `smart_delegate` account.
 *
 *     Initializes a new account (`smart_delegate`).
 *     The `token_account.delegate` is set to the newly created `smart_delegate` account.
 *     The `token_account.delegated_amount` is set to `u64::MAX`.
 *     The `token_account.owner` remains un-changed.
 *     The `smart_delegate` PDA is used by the `pre_authorized_debit` program to sign for
 *     valid pre-authorized debits to transfer funds from the token account.
 *
 *     The `InitSmartDelegate` instruction requires the `payer` and `owner` to sign the transaction.
 *     The `owner` MUST be the `token_account.owner`.
 *     The `payer` and `owner` may be the same account.
 *     The `token_program` MUST be either the token program or token 22 program.
 *     The `system_program` MUST be the system program.
 *
 *       Accounts expected by this instruction:
 *       0. `[writable]` payer: The payer for the `smart_delegate`.
 *       1. `[]`         owner: The new accounts owner.
 *       2. `[writable]` token_account: The `token_account` this `smart_delegate` will sign for as the `token_account.delegate`.
 *       3. `[writable]` smart_delegate: The `smart_delegate` is the new account being initialized.
 *       4. `[]`         token_program.
 *       5. `[]`         system_program.
 */
export class InitSmartDelegate {
  static readonly ixName = "initSmartDelegate";
  readonly ixName = InitSmartDelegate.ixName;
  static readonly identifier: Buffer = Buffer.from([
    74, 147, 168, 248, 207, 11, 224, 211,
  ]);

  constructor(
    readonly programId: PublicKey,
    readonly instructionData: InitSmartDelegateInstruction
  ) {}

  static isIdentifierEqual(ixData: Buffer): boolean {
    return ixData.subarray(0, 8).equals(InitSmartDelegate.identifier);
  }

  static fromDecoded(
    programId: PublicKey,
    flattenedAccounts: PublicKey[]
  ): InitSmartDelegate {
    const accounts = {
      payer: flattenedAccounts[0],
      owner: flattenedAccounts[1],
      tokenAccount: flattenedAccounts[2],
      smartDelegate: flattenedAccounts[3],
      tokenProgram: flattenedAccounts[4],
      systemProgram: flattenedAccounts[5],
    };
    return new InitSmartDelegate(programId, { args: null, accounts });
  }

  static decode(
    programId: PublicKey,
    flattenedAccounts: PublicKey[]
  ): InitSmartDelegate {
    return InitSmartDelegate.fromDecoded(programId, flattenedAccounts);
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
        isWritable: true,
      },
      {
        pubkey: this.instructionData.accounts.smartDelegate,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: this.instructionData.accounts.tokenProgram,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: this.instructionData.accounts.systemProgram,
        isSigner: false,
        isWritable: false,
      },
    ];
  }

  build() {
    const data = InitSmartDelegate.identifier;
    const ix = new TransactionInstruction({
      keys: this.toAccountMetas(),
      programId: this.programId,
      data,
    });
    return ix;
  }

  toArgsJSON(): null {
    return null;
  }

  toAccountsJSON(): InitSmartDelegateAccountsJSON {
    return {
      payer: this.instructionData.accounts.payer.toString(),
      owner: this.instructionData.accounts.owner.toString(),
      tokenAccount: this.instructionData.accounts.tokenAccount.toString(),
      smartDelegate: this.instructionData.accounts.smartDelegate.toString(),
      tokenProgram: this.instructionData.accounts.tokenProgram.toString(),
      systemProgram: this.instructionData.accounts.systemProgram.toString(),
    };
  }

  toJSON(): InitSmartDelegateInstructionJSON {
    return { args: this.toArgsJSON(), accounts: this.toAccountsJSON() };
  }
}
