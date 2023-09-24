import { expect } from "chai";
import {
  CustomError,
  IdlNotFoundOnChainError,
  NoPreAuthorizationFound,
  SmartDelegatedAmountNotEnough,
  SmartDelegateNotSet,
  TokenAccountDoesNotExist,
  TransactionFeesPayerNotProvided,
} from "../src";
import { Keypair } from "@solana/web3.js";

describe("errors unit test", () => {
  context("CustomError", () => {
    it("should format error message correctly using constructor", () => {
      expect(() => {
        throw new CustomError("https://my.rpc.url", "my error");
      }).to.throw("my error (rpc: https://my.rpc.url)");
    });
  });

  context("IdlNotFoundOnChainError", () => {
    it("should format error message correctly using constructor", () => {
      const programId = Keypair.generate().publicKey;
      expect(() => {
        throw new IdlNotFoundOnChainError("https://my.rpc.url", programId);
      }).to.throw(
        `IDL not found on-chain for program ${programId.toBase58()} (rpc: https://my.rpc.url)`,
      );
    });
  });

  context("TokenAccountDoesNotExist", () => {
    it("should format error message correctly using constructor", () => {
      const tokenAccount = Keypair.generate().publicKey;
      expect(() => {
        throw new TokenAccountDoesNotExist("https://my.rpc.url", tokenAccount);
      }).to.throw(
        `Token account doesn't exist: ${tokenAccount.toBase58()} (rpc: https://my.rpc.url)`,
      );
    });
  });

  context("NoPreAuthorizationFound", () => {
    it("should format error message correctly using givenTokenAccountAndDebitAuthority", () => {
      const tokenAccount = Keypair.generate().publicKey;
      const debitAuthority = Keypair.generate().publicKey;
      expect(() => {
        throw NoPreAuthorizationFound.givenTokenAccountAndDebitAuthority(
          "https://my.rpc.url",
          tokenAccount,
          debitAuthority,
        );
      }).to.throw(
        `Pre-authorization not found (tokenAccount: ${tokenAccount.toBase58()}, debitAuthority: ${debitAuthority.toBase58()}) (rpc: https://my.rpc.url)`,
      );
    });

    it("should format error message correctly using givenPubkey", () => {
      const preAuthorization = Keypair.generate().publicKey;
      expect(() => {
        throw NoPreAuthorizationFound.givenPubkey(
          "https://my.rpc.url",
          preAuthorization,
        );
      }).to.throw(
        `Pre-authorization not found (pubkey: ${preAuthorization.toBase58()}) (rpc: https://my.rpc.url)`,
      );
    });
  });

  context("SmartDelegateNotSet", () => {
    it("should format error message correctly using constructor", () => {
      const tokenAccount = Keypair.generate().publicKey;
      expect(() => {
        throw new SmartDelegateNotSet("https://my.rpc.url", tokenAccount);
      }).to.throw(
        `The smart delegate is not set for token account: ${tokenAccount.toBase58()} (rpc: https://my.rpc.url)`,
      );
    });
  });

  context("SmartDelegatedAmountNotEnough", () => {
    it("should format error message correctly using constructor", () => {
      const tokenAccount = Keypair.generate().publicKey;
      expect(() => {
        throw new SmartDelegatedAmountNotEnough(
          "https://my.rpc.url",
          tokenAccount,
        );
      }).to.throw(
        `The smart delegate's delegated amount for token account is insufficient: ${tokenAccount.toBase58()} (rpc: https://my.rpc.url)`,
      );
    });
  });

  context("TransactionFeesPayerNotProvided", () => {
    it("should format error message correctly using constructor", () => {
      expect(() => {
        throw new TransactionFeesPayerNotProvided();
      }).to.throw(`TX fees payer not provided`);
    });
  });
});
