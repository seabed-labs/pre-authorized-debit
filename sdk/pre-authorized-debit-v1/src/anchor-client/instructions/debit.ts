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

export interface DebitArgs {
  params: types.DebitParamsFields;
}

export interface DebitArgsJSON {
  params: types.DebitParamsJSON;
}

export interface DebitAccounts {
  debitAuthority: PublicKey;
  mint: PublicKey;
  tokenAccount: PublicKey;
  destinationTokenAccount: PublicKey;
  smartDelegate: PublicKey;
  preAuthorization: PublicKey;
  tokenProgram: PublicKey;
}

export interface DebitAccountsJSON {
  debitAuthority: string;
  mint: string;
  tokenAccount: string;
  destinationTokenAccount: string;
  smartDelegate: string;
  preAuthorization: string;
  tokenProgram: string;
}

export interface DebitInstruction {
  args: DebitArgs;
  accounts: DebitAccounts;
}

export interface DebitInstructionJSON {
  args: DebitArgsJSON;
  accounts: DebitAccountsJSON;
}

const layout = borsh.struct([types.DebitParams.layout("params")]);

export class Debit {
  static readonly ixName = "debit";
  readonly ixName = Debit.ixName;
  static readonly identifier: Buffer = Buffer.from([
    144, 252, 105, 115, 174, 111, 100, 65,
  ]);

  constructor(
    readonly programId: PublicKey,
    readonly instructionData: DebitInstruction
  ) {}

  static isIdentifierEqual(ixData: Buffer): boolean {
    return ixData.subarray(0, 8).equals(Debit.identifier);
  }

  static fromDecoded(
    programId: PublicKey,
    args: DebitArgs,
    flattenedAccounts: PublicKey[]
  ): Debit {
    const accounts = {
      debitAuthority: flattenedAccounts[0],
      mint: flattenedAccounts[1],
      tokenAccount: flattenedAccounts[2],
      destinationTokenAccount: flattenedAccounts[3],
      smartDelegate: flattenedAccounts[4],
      preAuthorization: flattenedAccounts[5],
      tokenProgram: flattenedAccounts[6],
    };
    return new Debit(programId, { args, accounts });
  }

  static decode(
    programId: PublicKey,
    ixData: Uint8Array,
    flattenedAccounts: PublicKey[]
  ): Debit {
    return Debit.fromDecoded(
      programId,
      layout.decode(ixData, Debit.identifier.length),
      flattenedAccounts
    );
  }

  toAccountMetas(): AccountMeta[] {
    return [
      {
        pubkey: this.instructionData.accounts.debitAuthority,
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: this.instructionData.accounts.mint,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: this.instructionData.accounts.tokenAccount,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: this.instructionData.accounts.destinationTokenAccount,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: this.instructionData.accounts.smartDelegate,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: this.instructionData.accounts.preAuthorization,
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
    const buffer = Buffer.alloc(1000);
    const len = layout.encode(
      {
        params: types.DebitParams.toEncodable(this.instructionData.args.params),
      },
      buffer
    );
    const data = Buffer.concat([Debit.identifier, buffer]).slice(0, 8 + len);
    const ix = new TransactionInstruction({
      keys: this.toAccountMetas(),
      programId: this.programId,
      data,
    });
    return ix;
  }

  toArgsJSON(): DebitArgsJSON {
    const args = {
      params: new types.DebitParams({ ...this.instructionData.args.params }),
    };
    return {
      params: args.params.toJSON(),
    };
  }

  toAccountsJSON(): DebitAccountsJSON {
    return {
      debitAuthority: this.instructionData.accounts.debitAuthority.toString(),
      mint: this.instructionData.accounts.mint.toString(),
      tokenAccount: this.instructionData.accounts.tokenAccount.toString(),
      destinationTokenAccount:
        this.instructionData.accounts.destinationTokenAccount.toString(),
      smartDelegate: this.instructionData.accounts.smartDelegate.toString(),
      preAuthorization:
        this.instructionData.accounts.preAuthorization.toString(),
      tokenProgram: this.instructionData.accounts.tokenProgram.toString(),
    };
  }

  toJSON(): DebitInstructionJSON {
    return { args: this.toArgsJSON(), accounts: this.toAccountsJSON() };
  }
}
