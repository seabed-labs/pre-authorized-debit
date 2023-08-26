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

export interface CancelPreAuthorizationAccounts {
  signer: PublicKey;
  authority: PublicKey;
  smartAccount: PublicKey;
  preAuthorization: PublicKey;
}

export interface CancelPreAuthorizationAccountsJSON {
  signer: string;
  authority: string;
  smartAccount: string;
  preAuthorization: string;
}

export interface CancelPreAuthorizationInstruction {
  args: null;
  accounts: CancelPreAuthorizationAccounts;
}

export interface CancelPreAuthorizationInstructionJSON {
  args: null;
  accounts: CancelPreAuthorizationAccountsJSON;
}

export class CancelPreAuthorization {
  static readonly ixName = "cancelPreAuthorization";
  readonly ixName = CancelPreAuthorization.ixName;
  static readonly identifier: Buffer = Buffer.from([
    127, 196, 45, 159, 61, 141, 162, 100,
  ]);

  constructor(
    readonly programId: PublicKey,
    readonly instructionData: CancelPreAuthorizationInstruction
  ) {}

  static isIdentifierEqual(ixData: Buffer): boolean {
    return ixData.subarray(0, 8).equals(CancelPreAuthorization.identifier);
  }

  static fromDecoded(
    programId: PublicKey,
    flattenedAccounts: PublicKey[]
  ): CancelPreAuthorization {
    const accounts = {
      signer: flattenedAccounts[0],
      authority: flattenedAccounts[1],
      smartAccount: flattenedAccounts[2],
      preAuthorization: flattenedAccounts[3],
    };
    return new CancelPreAuthorization(programId, { args: null, accounts });
  }

  static decode(
    programId: PublicKey,
    flattenedAccounts: PublicKey[]
  ): CancelPreAuthorization {
    return CancelPreAuthorization.fromDecoded(programId, flattenedAccounts);
  }

  toAccountMetas(): AccountMeta[] {
    return [
      {
        pubkey: this.instructionData.accounts.signer,
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: this.instructionData.accounts.authority,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: this.instructionData.accounts.smartAccount,
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
    const data = CancelPreAuthorization.identifier;
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

  toAccountsJSON(): CancelPreAuthorizationAccountsJSON {
    return {
      signer: this.instructionData.accounts.signer.toString(),
      authority: this.instructionData.accounts.authority.toString(),
      smartAccount: this.instructionData.accounts.smartAccount.toString(),
      preAuthorization:
        this.instructionData.accounts.preAuthorization.toString(),
    };
  }

  toJSON(): CancelPreAuthorizationInstructionJSON {
    return { args: this.toArgsJSON(), accounts: this.toAccountsJSON() };
  }
}
