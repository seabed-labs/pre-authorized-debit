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

export interface CompleteVirtualDebitAsAuthorityAccounts {
  signer: PublicKey;
}

export interface CompleteVirtualDebitAsAuthorityAccountsJSON {
  signer: string;
}

export interface CompleteVirtualDebitAsAuthorityInstruction {
  args: null;
  accounts: CompleteVirtualDebitAsAuthorityAccounts;
}

export interface CompleteVirtualDebitAsAuthorityInstructionJSON {
  args: null;
  accounts: CompleteVirtualDebitAsAuthorityAccountsJSON;
}

export class CompleteVirtualDebitAsAuthority {
  static readonly ixName = "completeVirtualDebitAsAuthority";
  readonly ixName = CompleteVirtualDebitAsAuthority.ixName;
  static readonly identifier: Buffer = Buffer.from([
    99, 235, 5, 96, 25, 189, 18, 104,
  ]);

  constructor(
    readonly programId: PublicKey,
    readonly instructionData: CompleteVirtualDebitAsAuthorityInstruction
  ) {}

  static isIdentifierEqual(ixData: Buffer): boolean {
    return ixData
      .subarray(0, 8)
      .equals(CompleteVirtualDebitAsAuthority.identifier);
  }

  static fromDecoded(
    programId: PublicKey,
    flattenedAccounts: PublicKey[]
  ): CompleteVirtualDebitAsAuthority {
    const accounts = {
      signer: flattenedAccounts[0],
    };
    return new CompleteVirtualDebitAsAuthority(programId, {
      args: null,
      accounts,
    });
  }

  static decode(
    programId: PublicKey,
    flattenedAccounts: PublicKey[]
  ): CompleteVirtualDebitAsAuthority {
    return CompleteVirtualDebitAsAuthority.fromDecoded(
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
    const data = CompleteVirtualDebitAsAuthority.identifier;
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

  toAccountsJSON(): CompleteVirtualDebitAsAuthorityAccountsJSON {
    return {
      signer: this.instructionData.accounts.signer.toString(),
    };
  }

  toJSON(): CompleteVirtualDebitAsAuthorityInstructionJSON {
    return { args: this.toArgsJSON(), accounts: this.toAccountsJSON() };
  }
}
