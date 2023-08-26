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

export interface InitSmartAccountAccounts {
  authority: PublicKey;
  payer: PublicKey;
  smartAccountNonce: PublicKey;
  smartAccount: PublicKey;
  systemProgram: PublicKey;
}

export interface InitSmartAccountAccountsJSON {
  authority: string;
  payer: string;
  smartAccountNonce: string;
  smartAccount: string;
  systemProgram: string;
}

export interface InitSmartAccountInstruction {
  args: null;
  accounts: InitSmartAccountAccounts;
}

export interface InitSmartAccountInstructionJSON {
  args: null;
  accounts: InitSmartAccountAccountsJSON;
}

export class InitSmartAccount {
  static readonly ixName = "initSmartAccount";
  readonly ixName = InitSmartAccount.ixName;
  static readonly identifier: Buffer = Buffer.from([
    197, 104, 227, 40, 18, 165, 132, 193,
  ]);

  constructor(
    readonly programId: PublicKey,
    readonly instructionData: InitSmartAccountInstruction
  ) {}

  static isIdentifierEqual(ixData: Buffer): boolean {
    return ixData.subarray(0, 8).equals(InitSmartAccount.identifier);
  }

  static fromDecoded(
    programId: PublicKey,
    flattenedAccounts: PublicKey[]
  ): InitSmartAccount {
    const accounts = {
      authority: flattenedAccounts[0],
      payer: flattenedAccounts[1],
      smartAccountNonce: flattenedAccounts[2],
      smartAccount: flattenedAccounts[3],
      systemProgram: flattenedAccounts[4],
    };
    return new InitSmartAccount(programId, { args: null, accounts });
  }

  static decode(
    programId: PublicKey,
    flattenedAccounts: PublicKey[]
  ): InitSmartAccount {
    return InitSmartAccount.fromDecoded(programId, flattenedAccounts);
  }

  toAccountMetas(): AccountMeta[] {
    return [
      {
        pubkey: this.instructionData.accounts.authority,
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: this.instructionData.accounts.payer,
        isSigner: true,
        isWritable: true,
      },
      {
        pubkey: this.instructionData.accounts.smartAccountNonce,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: this.instructionData.accounts.smartAccount,
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
    const data = InitSmartAccount.identifier;
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

  toAccountsJSON(): InitSmartAccountAccountsJSON {
    return {
      authority: this.instructionData.accounts.authority.toString(),
      payer: this.instructionData.accounts.payer.toString(),
      smartAccountNonce:
        this.instructionData.accounts.smartAccountNonce.toString(),
      smartAccount: this.instructionData.accounts.smartAccount.toString(),
      systemProgram: this.instructionData.accounts.systemProgram.toString(),
    };
  }

  toJSON(): InitSmartAccountInstructionJSON {
    return { args: this.toArgsJSON(), accounts: this.toAccountsJSON() };
  }
}
