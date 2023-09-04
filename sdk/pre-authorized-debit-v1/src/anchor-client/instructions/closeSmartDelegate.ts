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

export interface CloseSmartDelegateAccounts {
  receiver: PublicKey;
  owner: PublicKey;
  tokenAccount: PublicKey;
  smartDelegate: PublicKey;
  tokenProgram: PublicKey;
}

export interface CloseSmartDelegateAccountsJSON {
  receiver: string;
  owner: string;
  tokenAccount: string;
  smartDelegate: string;
  tokenProgram: string;
}

export interface CloseSmartDelegateInstruction {
  args: null;
  accounts: CloseSmartDelegateAccounts;
}

export interface CloseSmartDelegateInstructionJSON {
  args: null;
  accounts: CloseSmartDelegateAccountsJSON;
}

export class CloseSmartDelegate {
  static readonly ixName = "closeSmartDelegate";
  readonly ixName = CloseSmartDelegate.ixName;
  static readonly identifier: Buffer = Buffer.from([
    71, 232, 211, 210, 32, 169, 16, 20,
  ]);

  constructor(
    readonly programId: PublicKey,
    readonly instructionData: CloseSmartDelegateInstruction,
  ) {}

  static isIdentifierEqual(ixData: Buffer): boolean {
    return ixData.subarray(0, 8).equals(CloseSmartDelegate.identifier);
  }

  static fromDecoded(
    programId: PublicKey,
    flattenedAccounts: PublicKey[],
  ): CloseSmartDelegate {
    const accounts = {
      receiver: flattenedAccounts[0],
      owner: flattenedAccounts[1],
      tokenAccount: flattenedAccounts[2],
      smartDelegate: flattenedAccounts[3],
      tokenProgram: flattenedAccounts[4],
    };
    return new CloseSmartDelegate(programId, { args: null, accounts });
  }

  static decode(
    programId: PublicKey,
    flattenedAccounts: PublicKey[],
  ): CloseSmartDelegate {
    return CloseSmartDelegate.fromDecoded(programId, flattenedAccounts);
  }

  toAccountMetas(): AccountMeta[] {
    return [
      {
        pubkey: this.instructionData.accounts.receiver,
        isSigner: false,
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
    ];
  }

  build() {
    const data = CloseSmartDelegate.identifier;
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

  toAccountsJSON(): CloseSmartDelegateAccountsJSON {
    return {
      receiver: this.instructionData.accounts.receiver.toString(),
      owner: this.instructionData.accounts.owner.toString(),
      tokenAccount: this.instructionData.accounts.tokenAccount.toString(),
      smartDelegate: this.instructionData.accounts.smartDelegate.toString(),
      tokenProgram: this.instructionData.accounts.tokenProgram.toString(),
    };
  }

  toJSON(): CloseSmartDelegateInstructionJSON {
    return { args: this.toArgsJSON(), accounts: this.toAccountsJSON() };
  }
}
