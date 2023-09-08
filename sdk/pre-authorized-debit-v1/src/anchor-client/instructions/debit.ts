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

/**
 * The `Debit` instruction allows a `pre_authorization.debit_authority` to debit from the
 *     `pre_authorization.token_account` via the `smart_delegate` PDA. To successfully debit from
 *     the `token_account`, the constraints for the `pre_authorization` must be met.
 *
 *     Definitions:
 *       - PA = pre_authorization
 *
 *     Common Rules:
 *     - The `pre_authorization` MUST not be paused.
 *     - The amount being requested to debit must be less than or equal to the available amount for the current_cycle
 *     - The current timestamp must be less than the `PA.expiry_unix_timestamp`
 *     - If the PA has a `num_cycles` defined, the `current_cycle` must be less than or equal to `PA.num_cycles`
 *
 *     For a recurring pre-authorization:
 *     - The debit_authority must not have already done a debit in the current cycle
 *
 *     For a one-time pre-authorization:
 *     - the validator time must be greater than or equal to the `pre_authorization.activation_unix_timestamp`
 *
 *     For a more in-depth understanding around the constraints in a debit, it is recomended to read through
 *     the validation done for a `debit` instruction.
 *
 *     The `debit_authority` MUST sign the transaction.
 *     The `debit_authority` MUST equal the `pre_authorization.debit_authority`.
 *     The `mint` MUST equal `token_account.mint` and `destination_token_account.mint`.
 *     The `token_account.delegate` MUST equal the `smart_delegate`.
 *     The `token_account.mint` MUST equal the `mint`.
 *     The `destination_token_account.mint` MUST equal `mint`.
 *     The `smart_delegate.token_account` MUST equal `token_account`.
 *     The `pre_authorization.token_account` MUST equal the `token_account`.
 *     The `token_program` MUST equal the token program matching the `token_account`.
 *
 *     Accounts expected by this instruction:
 *       0. `[]`         debit_authority
 *       1. `[]`         mint
 *       2. `[writable]` token_account
 *       3. `[writable]` destination_token_account
 *       4. `[]`         smart_delegate
 *       5. `[writable]` pre_authorization
 *       6. `[]`         token_program
 */
export class Debit {
	static readonly ixName = "debit";
	readonly ixName = Debit.ixName;
	static readonly identifier: Buffer = Buffer.from([
		144, 252, 105, 115, 174, 111, 100, 65,
	]);

	constructor(
		readonly programId: PublicKey,
		readonly instructionData: DebitInstruction,
	) {}

	static isIdentifierEqual(ixData: Buffer): boolean {
		return ixData.subarray(0, 8).equals(Debit.identifier);
	}

	static fromDecoded(
		programId: PublicKey,
		args: DebitArgs,
		flattenedAccounts: PublicKey[],
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
		flattenedAccounts: PublicKey[],
	): Debit {
		return Debit.fromDecoded(
			programId,
			layout.decode(ixData, Debit.identifier.length),
			flattenedAccounts,
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
			buffer,
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
