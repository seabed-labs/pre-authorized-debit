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

export interface CompleteVirtualDebitAgainstPadAccounts {
  signer: PublicKey;
}

export interface CompleteVirtualDebitAgainstPadAccountsJSON {
  signer: string;
}

export interface CompleteVirtualDebitAgainstPadInstruction {
  args: null;
  accounts: CompleteVirtualDebitAgainstPadAccounts;
}

export interface CompleteVirtualDebitAgainstPadInstructionJSON {
  args: null;
  accounts: CompleteVirtualDebitAgainstPadAccountsJSON;
}

export class CompleteVirtualDebitAgainstPad {
  static readonly ixName = "completeVirtualDebitAgainstPad";
  readonly ixName = CompleteVirtualDebitAgainstPad.ixName;
  static readonly identifier: Buffer = Buffer.from([
    227, 84, 253, 54, 194, 159, 152, 19,
  ]);

  constructor(
    readonly programId: PublicKey,
    readonly instructionData: CompleteVirtualDebitAgainstPadInstruction
  ) {}

  static isIdentifierEqual(ixData: Buffer): boolean {
    return ixData
      .subarray(0, 8)
      .equals(CompleteVirtualDebitAgainstPad.identifier);
  }

  static fromDecoded(
    programId: PublicKey,
    flattenedAccounts: PublicKey[]
  ): CompleteVirtualDebitAgainstPad {
    const accounts = {
      signer: flattenedAccounts[0],
    };
    return new CompleteVirtualDebitAgainstPad(programId, {
      args: null,
      accounts,
    });
  }

  static decode(
    programId: PublicKey,
    flattenedAccounts: PublicKey[]
  ): CompleteVirtualDebitAgainstPad {
    return CompleteVirtualDebitAgainstPad.fromDecoded(
      programId,
      flattenedAccounts
    );
  }

  toAccountMetas(): AccountMeta[] {
    return [
      {
        pubkey: this.instructionData.accounts.signer,
        isSigner: true,
        isWritable: false,
      },
    ];
  }

  build() {
    const data = CompleteVirtualDebitAgainstPad.identifier;
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

  toAccountsJSON(): CompleteVirtualDebitAgainstPadAccountsJSON {
    return {
      signer: this.instructionData.accounts.signer.toString(),
    };
  }

  toJSON(): CompleteVirtualDebitAgainstPadInstructionJSON {
    return { args: this.toArgsJSON(), accounts: this.toAccountsJSON() };
  }
}
