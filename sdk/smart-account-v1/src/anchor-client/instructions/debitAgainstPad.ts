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

export interface DebitAgainstPadAccounts {
  signer: PublicKey;
}

export interface DebitAgainstPadAccountsJSON {
  signer: string;
}

export interface DebitAgainstPadInstruction {
  args: null;
  accounts: DebitAgainstPadAccounts;
}

export interface DebitAgainstPadInstructionJSON {
  args: null;
  accounts: DebitAgainstPadAccountsJSON;
}

export class DebitAgainstPad {
  static readonly ixName = "debitAgainstPad";
  readonly ixName = DebitAgainstPad.ixName;
  static readonly identifier: Buffer = Buffer.from([
    243, 226, 8, 118, 104, 247, 126, 96,
  ]);

  constructor(
    readonly programId: PublicKey,
    readonly instructionData: DebitAgainstPadInstruction
  ) {}

  static isIdentifierEqual(ixData: Buffer): boolean {
    return ixData.subarray(0, 8).equals(DebitAgainstPad.identifier);
  }

  static fromDecoded(
    programId: PublicKey,
    flattenedAccounts: PublicKey[]
  ): DebitAgainstPad {
    const accounts = {
      signer: flattenedAccounts[0],
    };
    return new DebitAgainstPad(programId, { args: null, accounts });
  }

  static decode(
    programId: PublicKey,
    flattenedAccounts: PublicKey[]
  ): DebitAgainstPad {
    return DebitAgainstPad.fromDecoded(programId, flattenedAccounts);
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
    const data = DebitAgainstPad.identifier;
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

  toAccountsJSON(): DebitAgainstPadAccountsJSON {
    return {
      signer: this.instructionData.accounts.signer.toString(),
    };
  }

  toJSON(): DebitAgainstPadInstructionJSON {
    return { args: this.toArgsJSON(), accounts: this.toAccountsJSON() };
  }
}
