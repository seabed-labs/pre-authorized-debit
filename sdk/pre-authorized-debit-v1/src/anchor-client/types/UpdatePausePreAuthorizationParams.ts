// This file was automatically generated. DO NOT MODIFY DIRECTLY.
/* eslint-disable */
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import * as types from "../types";
import * as borsh from "@coral-xyz/borsh";

export interface UpdatePausePreAuthorizationParamsFields {
	pause: boolean;
}

export interface UpdatePausePreAuthorizationParamsJSON {
	pause: boolean;
}

export class UpdatePausePreAuthorizationParams {
	readonly pause: boolean;

	constructor(fields: UpdatePausePreAuthorizationParamsFields) {
		this.pause = fields.pause;
	}

	static layout(property?: string) {
		return borsh.struct([borsh.bool("pause")], property);
	}

	static fromDecoded(obj: any) {
		return new UpdatePausePreAuthorizationParams({
			pause: obj.pause,
		});
	}

	static toEncodable(fields: UpdatePausePreAuthorizationParamsFields) {
		return {
			pause: fields.pause,
		};
	}

	toEncodable() {
		return UpdatePausePreAuthorizationParams.toEncodable(this);
	}

	toJSON(): UpdatePausePreAuthorizationParamsJSON {
		return {
			pause: this.pause,
		};
	}

	static fromJSON(
		obj: UpdatePausePreAuthorizationParamsJSON,
	): UpdatePausePreAuthorizationParams {
		return new UpdatePausePreAuthorizationParams({
			pause: obj.pause,
		});
	}
}
