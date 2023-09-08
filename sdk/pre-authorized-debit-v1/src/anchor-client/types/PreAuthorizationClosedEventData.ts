// This file was automatically generated. DO NOT MODIFY DIRECTLY.
/* eslint-disable */
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import * as types from "../types";
import * as borsh from "@coral-xyz/borsh";

export interface PreAuthorizationClosedEventDataFields {
	debitAuthority: PublicKey;
	closingAuthority: PublicKey;
	tokenAccountOwner: PublicKey;
	receiver: PublicKey;
	tokenAccount: PublicKey;
	preAuthorization: PublicKey;
}

export interface PreAuthorizationClosedEventDataJSON {
	debitAuthority: string;
	closingAuthority: string;
	tokenAccountOwner: string;
	receiver: string;
	tokenAccount: string;
	preAuthorization: string;
}

export class PreAuthorizationClosedEventData {
	readonly debitAuthority: PublicKey;
	readonly closingAuthority: PublicKey;
	readonly tokenAccountOwner: PublicKey;
	readonly receiver: PublicKey;
	readonly tokenAccount: PublicKey;
	readonly preAuthorization: PublicKey;

	constructor(fields: PreAuthorizationClosedEventDataFields) {
		this.debitAuthority = fields.debitAuthority;
		this.closingAuthority = fields.closingAuthority;
		this.tokenAccountOwner = fields.tokenAccountOwner;
		this.receiver = fields.receiver;
		this.tokenAccount = fields.tokenAccount;
		this.preAuthorization = fields.preAuthorization;
	}

	static layout(property?: string) {
		return borsh.struct(
			[
				borsh.publicKey("debitAuthority"),
				borsh.publicKey("closingAuthority"),
				borsh.publicKey("tokenAccountOwner"),
				borsh.publicKey("receiver"),
				borsh.publicKey("tokenAccount"),
				borsh.publicKey("preAuthorization"),
			],
			property,
		);
	}

	static fromDecoded(obj: any) {
		return new PreAuthorizationClosedEventData({
			debitAuthority: obj.debitAuthority,
			closingAuthority: obj.closingAuthority,
			tokenAccountOwner: obj.tokenAccountOwner,
			receiver: obj.receiver,
			tokenAccount: obj.tokenAccount,
			preAuthorization: obj.preAuthorization,
		});
	}

	static toEncodable(fields: PreAuthorizationClosedEventDataFields) {
		return {
			debitAuthority: fields.debitAuthority,
			closingAuthority: fields.closingAuthority,
			tokenAccountOwner: fields.tokenAccountOwner,
			receiver: fields.receiver,
			tokenAccount: fields.tokenAccount,
			preAuthorization: fields.preAuthorization,
		};
	}

	toEncodable() {
		return PreAuthorizationClosedEventData.toEncodable(this);
	}

	toJSON(): PreAuthorizationClosedEventDataJSON {
		return {
			debitAuthority: this.debitAuthority.toString(),
			closingAuthority: this.closingAuthority.toString(),
			tokenAccountOwner: this.tokenAccountOwner.toString(),
			receiver: this.receiver.toString(),
			tokenAccount: this.tokenAccount.toString(),
			preAuthorization: this.preAuthorization.toString(),
		};
	}

	static fromJSON(
		obj: PreAuthorizationClosedEventDataJSON,
	): PreAuthorizationClosedEventData {
		return new PreAuthorizationClosedEventData({
			debitAuthority: new PublicKey(obj.debitAuthority),
			closingAuthority: new PublicKey(obj.closingAuthority),
			tokenAccountOwner: new PublicKey(obj.tokenAccountOwner),
			receiver: new PublicKey(obj.receiver),
			tokenAccount: new PublicKey(obj.tokenAccount),
			preAuthorization: new PublicKey(obj.preAuthorization),
		});
	}
}
