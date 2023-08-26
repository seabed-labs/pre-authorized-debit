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

export interface StartVirtualDebitAsAuthorityAccounts {
  signer: PublicKey;
}

export interface StartVirtualDebitAsAuthorityAccountsJSON {
  signer: string;
}

export interface StartVirtualDebitAsAuthorityInstruction {
  args: null;
  accounts: StartVirtualDebitAsAuthorityAccounts;
}

export interface StartVirtualDebitAsAuthorityInstructionJSON {
  args: null;
  accounts: StartVirtualDebitAsAuthorityAccountsJSON;
}

export class StartVirtualDebitAsAuthority {
  static readonly ixName = "startVirtualDebitAsAuthority";
  readonly ixName = StartVirtualDebitAsAuthority.ixName;
  static readonly identifier: Buffer = Buffer.from([
    129, 133, 100, 65, 73, 137, 128, 10,
  ]);

  constructor(
    readonly programId: PublicKey,
    readonly instructionData: StartVirtualDebitAsAuthorityInstruction
  ) {}

  static isIdentifierEqual(ixData: Buffer): boolean {
    return ixData
      .subarray(0, 8)
      .equals(StartVirtualDebitAsAuthority.identifier);
  }

  static fromDecoded(
    programId: PublicKey,
    flattenedAccounts: PublicKey[]
  ): StartVirtualDebitAsAuthority {
    const accounts = {
      signer: flattenedAccounts[0],
    };
    return new StartVirtualDebitAsAuthority(programId, {
      args: null,
      accounts,
    });
  }

  static decode(
    programId: PublicKey,
    flattenedAccounts: PublicKey[]
  ): StartVirtualDebitAsAuthority {
    return StartVirtualDebitAsAuthority.fromDecoded(
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
    const data = StartVirtualDebitAsAuthority.identifier;
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

  toAccountsJSON(): StartVirtualDebitAsAuthorityAccountsJSON {
    return {
      signer: this.instructionData.accounts.signer.toString(),
    };
  }

  toJSON(): StartVirtualDebitAsAuthorityInstructionJSON {
    return { args: this.toArgsJSON(), accounts: this.toAccountsJSON() };
  }
}
