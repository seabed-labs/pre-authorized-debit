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

export interface InitSmartAccountNonceAccounts {
  authority: PublicKey;
  payer: PublicKey;
  smartAccountNonce: PublicKey;
  systemProgram: PublicKey;
}

export interface InitSmartAccountNonceAccountsJSON {
  authority: string;
  payer: string;
  smartAccountNonce: string;
  systemProgram: string;
}

export interface InitSmartAccountNonceInstruction {
  args: null;
  accounts: InitSmartAccountNonceAccounts;
}

export interface InitSmartAccountNonceInstructionJSON {
  args: null;
  accounts: InitSmartAccountNonceAccountsJSON;
}

export class InitSmartAccountNonce {
  static readonly ixName = "initSmartAccountNonce";
  readonly ixName = InitSmartAccountNonce.ixName;
  static readonly identifier: Buffer = Buffer.from([
    100, 146, 58, 234, 198, 119, 96, 238,
  ]);

  constructor(
    readonly programId: PublicKey,
    readonly instructionData: InitSmartAccountNonceInstruction
  ) {}

  static isIdentifierEqual(ixData: Buffer): boolean {
    return ixData.subarray(0, 8).equals(InitSmartAccountNonce.identifier);
  }

  static fromDecoded(
    programId: PublicKey,
    flattenedAccounts: PublicKey[]
  ): InitSmartAccountNonce {
    const accounts = {
      authority: flattenedAccounts[0],
      payer: flattenedAccounts[1],
      smartAccountNonce: flattenedAccounts[2],
      systemProgram: flattenedAccounts[3],
    };
    return new InitSmartAccountNonce(programId, { args: null, accounts });
  }

  static decode(
    programId: PublicKey,
    flattenedAccounts: PublicKey[]
  ): InitSmartAccountNonce {
    return InitSmartAccountNonce.fromDecoded(programId, flattenedAccounts);
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
        pubkey: this.instructionData.accounts.systemProgram,
        isSigner: false,
        isWritable: false,
      },
    ];
  }

  build() {
    const data = InitSmartAccountNonce.identifier;
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

  toAccountsJSON(): InitSmartAccountNonceAccountsJSON {
    return {
      authority: this.instructionData.accounts.authority.toString(),
      payer: this.instructionData.accounts.payer.toString(),
      smartAccountNonce:
        this.instructionData.accounts.smartAccountNonce.toString(),
      systemProgram: this.instructionData.accounts.systemProgram.toString(),
    };
  }

  toJSON(): InitSmartAccountNonceInstructionJSON {
    return { args: this.toArgsJSON(), accounts: this.toAccountsJSON() };
  }
}
