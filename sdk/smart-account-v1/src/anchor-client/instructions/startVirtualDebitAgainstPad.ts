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

export interface StartVirtualDebitAgainstPadAccounts {
  signer: PublicKey;
}

export interface StartVirtualDebitAgainstPadAccountsJSON {
  signer: string;
}

export interface StartVirtualDebitAgainstPadInstruction {
  args: null;
  accounts: StartVirtualDebitAgainstPadAccounts;
}

export interface StartVirtualDebitAgainstPadInstructionJSON {
  args: null;
  accounts: StartVirtualDebitAgainstPadAccountsJSON;
}

export class StartVirtualDebitAgainstPad {
  static readonly ixName = "startVirtualDebitAgainstPad";
  readonly ixName = StartVirtualDebitAgainstPad.ixName;
  static readonly identifier: Buffer = Buffer.from([
    144, 193, 32, 70, 121, 116, 252, 14,
  ]);

  constructor(
    readonly programId: PublicKey,
    readonly instructionData: StartVirtualDebitAgainstPadInstruction
  ) {}

  static isIdentifierEqual(ixData: Buffer): boolean {
    return ixData.subarray(0, 8).equals(StartVirtualDebitAgainstPad.identifier);
  }

  static fromDecoded(
    programId: PublicKey,
    flattenedAccounts: PublicKey[]
  ): StartVirtualDebitAgainstPad {
    const accounts = {
      signer: flattenedAccounts[0],
    };
    return new StartVirtualDebitAgainstPad(programId, { args: null, accounts });
  }

  static decode(
    programId: PublicKey,
    flattenedAccounts: PublicKey[]
  ): StartVirtualDebitAgainstPad {
    return StartVirtualDebitAgainstPad.fromDecoded(
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
    const data = StartVirtualDebitAgainstPad.identifier;
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

  toAccountsJSON(): StartVirtualDebitAgainstPadAccountsJSON {
    return {
      signer: this.instructionData.accounts.signer.toString(),
    };
  }

  toJSON(): StartVirtualDebitAgainstPadInstructionJSON {
    return { args: this.toArgsJSON(), accounts: this.toAccountsJSON() };
  }
}
