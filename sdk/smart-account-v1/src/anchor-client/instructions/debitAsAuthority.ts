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

export interface DebitAsAuthorityAccounts {
  signer: PublicKey;
}

export interface DebitAsAuthorityAccountsJSON {
  signer: string;
}

export interface DebitAsAuthorityInstruction {
  args: null;
  accounts: DebitAsAuthorityAccounts;
}

export interface DebitAsAuthorityInstructionJSON {
  args: null;
  accounts: DebitAsAuthorityAccountsJSON;
}

export class DebitAsAuthority {
  static readonly ixName = "debitAsAuthority";
  readonly ixName = DebitAsAuthority.ixName;
  static readonly identifier: Buffer = Buffer.from([
    61, 228, 100, 18, 59, 167, 44, 119,
  ]);

  constructor(
    readonly programId: PublicKey,
    readonly instructionData: DebitAsAuthorityInstruction
  ) {}

  static isIdentifierEqual(ixData: Buffer): boolean {
    return ixData.subarray(0, 8).equals(DebitAsAuthority.identifier);
  }

  static fromDecoded(
    programId: PublicKey,
    flattenedAccounts: PublicKey[]
  ): DebitAsAuthority {
    const accounts = {
      signer: flattenedAccounts[0],
    };
    return new DebitAsAuthority(programId, { args: null, accounts });
  }

  static decode(
    programId: PublicKey,
    flattenedAccounts: PublicKey[]
  ): DebitAsAuthority {
    return DebitAsAuthority.fromDecoded(programId, flattenedAccounts);
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
    const data = DebitAsAuthority.identifier;
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

  toAccountsJSON(): DebitAsAuthorityAccountsJSON {
    return {
      signer: this.instructionData.accounts.signer.toString(),
    };
  }

  toJSON(): DebitAsAuthorityInstructionJSON {
    return { args: this.toArgsJSON(), accounts: this.toAccountsJSON() };
  }
}
