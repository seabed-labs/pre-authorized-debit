// This file was automatically generated. DO NOT MODIFY DIRECTLY.
/* eslint-disable */
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import * as types from "../types";
import * as borsh from "@coral-xyz/borsh";

export interface DebitParamsFields {
	amount: bigint;
}

export interface DebitParamsJSON {
	amount: string;
}

export class DebitParams {
	readonly amount: bigint;

	constructor(fields: DebitParamsFields) {
		this.amount = fields.amount;
	}

	static layout(property?: string) {
		return borsh.struct([borsh.u64("amount")], property);
	}

	static fromDecoded(obj: any) {
		return new DebitParams({
			amount: obj.amount,
		});
	}

	static toEncodable(fields: DebitParamsFields) {
		return {
			amount: new BN(fields.amount.toString()),
		};
	}

	toEncodable() {
		return DebitParams.toEncodable(this);
	}

	toJSON(): DebitParamsJSON {
		return {
			amount: this.amount.toString(),
		};
	}

	static fromJSON(obj: DebitParamsJSON): DebitParams {
		return new DebitParams({
			amount: BigInt(obj.amount),
		});
	}
}
