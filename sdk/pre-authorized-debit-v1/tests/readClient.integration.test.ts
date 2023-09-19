import { assert, expect } from "chai";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { localValidatorUrl } from "./constants";
import {
  IDL,
  MAINNET_PAD_PROGRAM_ID,
  PreAuthorizedDebitReadClientImpl,
} from "../src";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { getProviderNodeWallet } from "./util";
import { TOKEN_PROGRAM_ID, createMint, createAccount } from "@solana/spl-token";
import {
  fundAccounts,
  initSmartDelegateIdempotent,
} from "@dcaf/pad-test-utils";
import * as anchor from "@coral-xyz/anchor";

describe("PreAuthorizedDebitReadClientImpl integration", () => {
  const connection: Connection = new Connection(localValidatorUrl, "processed");
  const provider = new AnchorProvider(connection, getProviderNodeWallet(), {
    commitment: connection.commitment,
  });
  const program = new Program(IDL, MAINNET_PAD_PROGRAM_ID, provider);
  const readClient = PreAuthorizedDebitReadClientImpl.mainnet(connection);

  let mint: PublicKey, tokenAccount: PublicKey, smartDelegate: PublicKey;
  const debitAuthorities: Keypair[] = [];
  const preAuthorizations: PublicKey[] = [];

  before(async () => {
    smartDelegate = await initSmartDelegateIdempotent(program, provider);
    const mintAuthority = new Keypair();
    const payerKeypair = new Keypair();
    for (let i = 0; i < 3; i++) {
      debitAuthorities.push(Keypair.generate());
    }
    const tx = await fundAccounts(provider, [payerKeypair.publicKey], 5000e6);
    await connection.confirmTransaction(tx);
    mint = await createMint(
      connection,
      payerKeypair,
      mintAuthority.publicKey,
      null,
      6,
      Keypair.generate(),
      undefined,
      TOKEN_PROGRAM_ID,
    );
    tokenAccount = await createAccount(
      provider.connection,
      payerKeypair,
      mint,
      provider.publicKey,
      Keypair.generate(),
      undefined,
      TOKEN_PROGRAM_ID,
    );
    const activationUnixTimestamp = Math.floor(new Date().getTime() / 1e3) - 60; // -60 seconds from now
    const expirationUnixTimestamp = activationUnixTimestamp + 10 * 24 * 60 * 60; // +10 days from activation

    for (let i = 0; i < 3; i++) {
      // every odd will be oneTime
      const variant =
        i % 2
          ? {
              oneTime: {
                amountAuthorized: new BN(100e6),
                expiryUnixTimestamp: new BN(expirationUnixTimestamp),
              },
            }
          : {
              recurring: {
                repeatFrequencySeconds: new anchor.BN(100),
                recurringAmountAuthorized: new anchor.BN(100),
                numCycles: new BN(5),
                resetEveryCycle: false,
              },
            };
      const pad = readClient.derivePreAuthorizationPDA(
        tokenAccount,
        debitAuthorities[i].publicKey,
      ).publicKey;
      preAuthorizations.push(pad);
      await program.methods
        .initPreAuthorization({
          variant,
          debitAuthority: debitAuthorities[i].publicKey,
          activationUnixTimestamp: new BN(activationUnixTimestamp),
        })
        .accounts({
          payer: provider.publicKey,
          owner: provider.publicKey,
          smartDelegate,
          tokenAccount,
          preAuthorization: pad,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    }
  });

  context("fetchSmartDelegate", () => {
    it("should fetch smartDelegate", async () => {
      const smartDelegate = await readClient.fetchSmartDelegate();
      assert.isNotEmpty(smartDelegate);
      expect(smartDelegate!.publicKey.toString()).to.equal(
        "5xwfb7dPwdbgnMFABbF9mqYaD79ocSngiR9GMSY9Tfzb",
      );
      expect(smartDelegate!.account.bump).to.equal(255);
    });
  });

  context("fetchPreAuthorization", () => {
    it("should fetch preAuthorization", async () => {
      const preAuthorization = await readClient.fetchPreAuthorization({
        tokenAccount,
        debitAuthority: debitAuthorities[0].publicKey,
      });
      assert.isNotEmpty(preAuthorization?.account);
    });
    it("should return null preAuthorization", async () => {
      const preAuthorization = await readClient.fetchPreAuthorization({
        tokenAccount,
        debitAuthority: new Keypair().publicKey,
      });
      assert.isNull(preAuthorization);
    });
  });

  context("fetchPreAuthorizationsForTokenAccount", () => {
    it("should return preAuthorizations by tokenAccount and type=all", async () => {
      const padAddressStrings = preAuthorizations.map((a) => a.toString());
      const pads =
        await readClient.fetchPreAuthorizationsForTokenAccount(tokenAccount);
      expect(pads.length).to.equal(3);
      pads.forEach((pad) => {
        expect(padAddressStrings.includes(pad.publicKey.toString())).to.equal(
          true,
        );
        expect(pad.account.tokenAccount.toString()).to.equal(
          tokenAccount.toString(),
        );
      });
    });
    it("should return preAuthorizations by tokenAccount and type=recurring", async () => {
      const padAddressStrings = preAuthorizations.map((a) => a.toString());
      const pads = await readClient.fetchPreAuthorizationsForTokenAccount(
        tokenAccount,
        "recurring",
      );
      expect(pads.length).to.equal(2);
      pads.forEach((pad) => {
        expect(padAddressStrings.includes(pad.publicKey.toString())).to.equal(
          true,
        );
        expect(pad.account.tokenAccount.toString()).to.equal(
          tokenAccount.toString(),
        );
        expect(pad.account.variant.type).to.equal("recurring");
      });
    });
    it("should return preAuthorizations by tokenAccount and type=oneTime", async () => {
      const padAddressStrings = preAuthorizations.map((a) => a.toString());
      const pads = await readClient.fetchPreAuthorizationsForTokenAccount(
        tokenAccount,
        "oneTime",
      );
      expect(pads.length).to.equal(1);
      pads.forEach((pad) => {
        expect(padAddressStrings.includes(pad.publicKey.toString())).to.equal(
          true,
        );
        expect(pad.account.tokenAccount.toString()).to.equal(
          tokenAccount.toString(),
        );
        expect(pad.account.variant.type).to.equal("oneTime");
      });
    });
  });

  context("fetchPreAuthorizationsForDebitAuthority", () => {
    it("should return preAuthorizations by debit authority and type=all", async () => {
      const padAddressStrings = preAuthorizations.map((a) => a.toString());
      for (let i = 0; i < debitAuthorities.length; i++) {
        const pads = await readClient.fetchPreAuthorizationsForDebitAuthority(
          debitAuthorities[i].publicKey,
        );
        expect(pads.length).to.equal(1);
        pads.forEach((pad) => {
          expect(padAddressStrings.includes(pad.publicKey.toString())).to.equal(
            true,
          );
          expect(pad.account.tokenAccount.toString()).to.equal(
            tokenAccount.toString(),
          );
          expect(pad.account.debitAuthority.toString()).to.equal(
            debitAuthorities[i].publicKey.toString(),
          );
        });
      }
    });

    it("should return preAuthorizations by debit authority and type=recurring", async () => {
      const padAddressStrings = preAuthorizations.map((a) => a.toString());
      const pads = await readClient.fetchPreAuthorizationsForDebitAuthority(
        debitAuthorities[0].publicKey,
        "recurring",
      );
      expect(pads.length).to.equal(1);
      pads.forEach((pad) => {
        expect(padAddressStrings.includes(pad.publicKey.toString())).to.equal(
          true,
        );
        expect(pad.account.tokenAccount.toString()).to.equal(
          tokenAccount.toString(),
        );
        expect(pad.account.debitAuthority.toString()).to.equal(
          debitAuthorities[0].publicKey.toString(),
        );
        expect(pad.account.variant.type).to.equal("recurring");
      });
    });

    it("should return preAuthorizations by debit authority and type=oneTime", async () => {
      const padAddressStrings = preAuthorizations.map((a) => a.toString());
      const pads = await readClient.fetchPreAuthorizationsForDebitAuthority(
        debitAuthorities[1].publicKey,
        "oneTime",
      );
      expect(pads.length).to.equal(1);
      pads.forEach((pad) => {
        expect(padAddressStrings.includes(pad.publicKey.toString())).to.equal(
          true,
        );
        expect(pad.account.tokenAccount.toString()).to.equal(
          tokenAccount.toString(),
        );
        expect(pad.account.debitAuthority.toString()).to.equal(
          debitAuthorities[1].publicKey.toString(),
        );
        expect(pad.account.variant.type).to.equal("oneTime");
      });
    });
  });
});
