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
