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

export interface InitOneTimePreAuthorizationArgs {
  params: types.InitPreAuthorizationParamsFields;
}

export interface InitOneTimePreAuthorizationArgsJSON {
  params: types.InitPreAuthorizationParamsJSON;
}

export interface InitOneTimePreAuthorizationAccounts {
  payer: PublicKey;
  authority: PublicKey;
  smartAccount: PublicKey;
  mint: PublicKey;
  preAuthorization: PublicKey;
  systemProgram: PublicKey;
}

export interface InitOneTimePreAuthorizationAccountsJSON {
  payer: string;
  authority: string;
  smartAccount: string;
  mint: string;
  preAuthorization: string;
  systemProgram: string;
}

export interface InitOneTimePreAuthorizationInstruction {
  args: InitOneTimePreAuthorizationArgs;
  accounts: InitOneTimePreAuthorizationAccounts;
}

export interface InitOneTimePreAuthorizationInstructionJSON {
  args: InitOneTimePreAuthorizationArgsJSON;
  accounts: InitOneTimePreAuthorizationAccountsJSON;
}

const layout = borsh.struct([
  types.InitPreAuthorizationParams.layout("params"),
]);

export class InitOneTimePreAuthorization {
  static readonly ixName = "initOneTimePreAuthorization";
  readonly ixName = InitOneTimePreAuthorization.ixName;
  static readonly identifier: Buffer = Buffer.from([
    248, 14, 16, 147, 95, 162, 159, 228,
  ]);

  constructor(
    readonly programId: PublicKey,
    readonly instructionData: InitOneTimePreAuthorizationInstruction
  ) {}

  static isIdentifierEqual(ixData: Buffer): boolean {
    return ixData.subarray(0, 8).equals(InitOneTimePreAuthorization.identifier);
  }

  static fromDecoded(
    programId: PublicKey,
    args: InitOneTimePreAuthorizationArgs,
    flattenedAccounts: PublicKey[]
  ): InitOneTimePreAuthorization {
    const accounts = {
      payer: flattenedAccounts[0],
      authority: flattenedAccounts[1],
      smartAccount: flattenedAccounts[2],
      mint: flattenedAccounts[3],
      preAuthorization: flattenedAccounts[4],
      systemProgram: flattenedAccounts[5],
    };
    return new InitOneTimePreAuthorization(programId, { args, accounts });
  }

  static decode(
    programId: PublicKey,
    ixData: Uint8Array,
    flattenedAccounts: PublicKey[]
  ): InitOneTimePreAuthorization {
    return InitOneTimePreAuthorization.fromDecoded(
      programId,
      layout.decode(ixData, InitOneTimePreAuthorization.identifier.length),
      flattenedAccounts
    );
  }

  toAccountMetas(): AccountMeta[] {
    return [
      {
        pubkey: this.instructionData.accounts.payer,
        isSigner: true,
        isWritable: true,
      },
      {
        pubkey: this.instructionData.accounts.authority,
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: this.instructionData.accounts.smartAccount,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: this.instructionData.accounts.mint,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: this.instructionData.accounts.preAuthorization,
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
    const buffer = Buffer.alloc(1000);
    const len = layout.encode(
      {
        params: types.InitPreAuthorizationParams.toEncodable(
          this.instructionData.args.params
        ),
      },
      buffer
    );
    const data = Buffer.concat([
      InitOneTimePreAuthorization.identifier,
      buffer,
    ]).slice(0, 8 + len);
    const ix = new TransactionInstruction({
      keys: this.toAccountMetas(),
      programId: this.programId,
      data,
    });
    return ix;
  }

  toArgsJSON(): InitOneTimePreAuthorizationArgsJSON {
    const args = {
      params: new types.InitPreAuthorizationParams({
        ...this.instructionData.args.params,
      }),
    };
    return {
      params: args.params.toJSON(),
    };
  }

  toAccountsJSON(): InitOneTimePreAuthorizationAccountsJSON {
    return {
      payer: this.instructionData.accounts.payer.toString(),
      authority: this.instructionData.accounts.authority.toString(),
      smartAccount: this.instructionData.accounts.smartAccount.toString(),
      mint: this.instructionData.accounts.mint.toString(),
      preAuthorization:
        this.instructionData.accounts.preAuthorization.toString(),
      systemProgram: this.instructionData.accounts.systemProgram.toString(),
    };
  }

  toJSON(): InitOneTimePreAuthorizationInstructionJSON {
    return { args: this.toArgsJSON(), accounts: this.toAccountsJSON() };
  }
}
