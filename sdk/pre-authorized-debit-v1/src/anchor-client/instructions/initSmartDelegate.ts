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
  smartDelegate: PublicKey;
  systemProgram: PublicKey;
}

export interface InitSmartDelegateAccountsJSON {
  payer: string;
  smartDelegate: string;
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
 * The `InitSmartDelegate` instruction will create a global `smart_delegate` account.
 *
 *     Initializes a new account (`smart_delegate`).
 *     The `smart_delegate` PDA is used by the `pre_authorized_debit` program to sign for
 *     valid pre-authorized debits to transfer funds from the `pre_authorization.token_account`.
 *     The `smart_delegate` account can NEVER be closed.
 *
 *     The `payer` MUST sign the transaction.
 *     The `payer` MUST have enough lamports to pay for the `smart_delegate` account.
 *
 *     Accounts expected by this instruction:
 *         0. `[writable]` payer
 *         1. `[writable]` smart_delegate
 *         2. `[]`         system_program
 */
export class InitSmartDelegate {
  static readonly ixName = "initSmartDelegate";
  readonly ixName = InitSmartDelegate.ixName;
  static readonly identifier: Buffer = Buffer.from([
    74, 147, 168, 248, 207, 11, 224, 211,
  ]);

  constructor(
    readonly programId: PublicKey,
    readonly instructionData: InitSmartDelegateInstruction,
  ) {}

  static isIdentifierEqual(ixData: Buffer): boolean {
    return ixData.subarray(0, 8).equals(InitSmartDelegate.identifier);
  }

  static fromDecoded(
    programId: PublicKey,
    flattenedAccounts: PublicKey[],
  ): InitSmartDelegate {
    const accounts = {
      payer: flattenedAccounts[0],
      smartDelegate: flattenedAccounts[1],
      systemProgram: flattenedAccounts[2],
    };
    return new InitSmartDelegate(programId, { args: null, accounts });
  }

  static decode(
    programId: PublicKey,
    flattenedAccounts: PublicKey[],
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
        pubkey: this.instructionData.accounts.smartDelegate,
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
      smartDelegate: this.instructionData.accounts.smartDelegate.toString(),
      systemProgram: this.instructionData.accounts.systemProgram.toString(),
    };
  }

  toJSON(): InitSmartDelegateInstructionJSON {
    return { args: this.toArgsJSON(), accounts: this.toAccountsJSON() };
  }
}
