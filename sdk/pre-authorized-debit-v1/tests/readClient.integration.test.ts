import "./setup";

import { assert, expect } from "chai";
import {
  AccountInfo,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { localValidatorUrl } from "./constants";
import {
  IDL,
  MAINNET_PAD_PROGRAM_ID,
  PreAuthorizedDebitReadClientImpl,
  TokenAccountDoesNotExist,
  PreAuthorizationAccount,
} from "../src";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { getProviderNodeWallet } from "./util";
import { TOKEN_PROGRAM_ID, createMint, createAccount } from "@solana/spl-token";
import {
  fundAccounts,
  initSmartDelegateIdempotent,
} from "@dcaf/pad-test-utils";
import * as anchor from "@coral-xyz/anchor";
import { createSandbox } from "sinon";

describe("PreAuthorizedDebitReadClientImpl integration", () => {
  const connection: Connection = new Connection(localValidatorUrl, "processed");
  const provider = new AnchorProvider(connection, getProviderNodeWallet(), {
    commitment: connection.commitment,
  });
  const program = new Program(IDL, MAINNET_PAD_PROGRAM_ID, provider);
  const readClient = PreAuthorizedDebitReadClientImpl.custom(
    connection,
    MAINNET_PAD_PROGRAM_ID,
  );

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
                resetEveryCycle: true,
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

  context("checkDebitAmountForPreAuthorization", () => {
    it("should return false if pad is not activated", async () => {
      const canDebit = readClient.checkDebitAmountForPreAuthorization({
        preAuthorizationAccount: {
          variant: {
            type: "oneTime",
          },
          // activates at 101
          activationUnixTimestamp: BigInt(101),
        } as unknown as PreAuthorizationAccount,
        // current time is 100
        solanaTime: BigInt(100),
        requestedDebitAmount: BigInt(100),
      });
      expect(canDebit).to.equal(false);
    });

    it("should return false for oneTime pad that is requesting a debit larger than the authorized amount", async () => {
      const canDebit = readClient.checkDebitAmountForPreAuthorization({
        preAuthorizationAccount: {
          variant: {
            type: "oneTime",
            // amount authorized is 100
            amountAuthorized: BigInt(100),
            amountDebited: BigInt(0),
          },
          activationUnixTimestamp: BigInt(0),
        } as unknown as PreAuthorizationAccount,
        solanaTime: BigInt(100),
        // withdrawing 101
        requestedDebitAmount: BigInt(101),
      });
      expect(canDebit).to.equal(false);
    });

    it("should return false for oneTime pad that is requesting a debit larger than the available amount", async () => {
      const canDebit = readClient.checkDebitAmountForPreAuthorization({
        preAuthorizationAccount: {
          variant: {
            type: "oneTime",
            // amount available is 1
            amountAuthorized: BigInt(100),
            amountDebited: BigInt(99),
          },
          activationUnixTimestamp: BigInt(0),
        } as unknown as PreAuthorizationAccount,
        solanaTime: BigInt(100),
        // withdrawing 2
        requestedDebitAmount: BigInt(2),
      });
      expect(canDebit).to.equal(false);
    });

    it("should return true for oneTime pad", async () => {
      const canDebit = readClient.checkDebitAmountForPreAuthorization({
        preAuthorizationAccount: {
          variant: {
            type: "oneTime",
            // amount available is 1
            amountAuthorized: BigInt(100),
            amountDebited: BigInt(99),
          },
          activationUnixTimestamp: BigInt(0),
        } as unknown as PreAuthorizationAccount,
        solanaTime: BigInt(100),
        // withdrawing 1
        requestedDebitAmount: BigInt(1),
      });
      expect(canDebit).to.equal(false);
    });

    it("should return false for recurring pad if currentCycle > numCycles", async () => {
      const canDebit = readClient.checkDebitAmountForPreAuthorization({
        preAuthorizationAccount: {
          variant: {
            type: "recurring",
            repeatFrequencySeconds: BigInt(1),
            numCycles: 1,
          },
          activationUnixTimestamp: BigInt(0),
        } as unknown as PreAuthorizationAccount,
        solanaTime: BigInt(100),
        requestedDebitAmount: BigInt(1),
      });
      expect(canDebit).to.equal(false);
    });

    it("should return false for recurring pad if currentCycle > numCycles", async () => {
      const canDebit = readClient.checkDebitAmountForPreAuthorization({
        preAuthorizationAccount: {
          variant: {
            type: "recurring",
            repeatFrequencySeconds: BigInt(1),
            numCycles: 200,
            lastDebitedCycle: 101,
            // should be authorized for 100
            amountDebitedLastCycle: BigInt(0),
            recurringAmountAuthorized: BigInt(100),
            resetEveryCycle: true,
          },
          activationUnixTimestamp: BigInt(0),
        } as unknown as PreAuthorizationAccount,
        solanaTime: BigInt(100),
        // withdrawing 101
        requestedDebitAmount: BigInt(101),
      });
      expect(canDebit).to.equal(false);
    });

    it("should return true for recurring pad", async () => {
      const canDebit = readClient.checkDebitAmountForPreAuthorization({
        preAuthorizationAccount: {
          variant: {
            type: "recurring",
            repeatFrequencySeconds: BigInt(1),
            numCycles: 200,
            lastDebitedCycle: 101,
            // should be authorized for 100
            amountDebitedLastCycle: BigInt(0),
            recurringAmountAuthorized: BigInt(100),
            resetEveryCycle: true,
          },
          activationUnixTimestamp: BigInt(0),
        } as unknown as PreAuthorizationAccount,
        solanaTime: BigInt(100),
        // withdrawing 101
        requestedDebitAmount: BigInt(100),
      });
      expect(canDebit).to.equal(false);
    });
  });

  context("fetchMaxDebitAmount", () => {
    const sandbox = createSandbox();

    afterEach(() => {
      sandbox.reset();
      sandbox.restore();
    });

    it("should throw NoPreAuthorizationFound", async () => {
      await expect(
        readClient.fetchMaxDebitAmount({
          tokenAccount: Keypair.generate().publicKey,
          debitAuthority: debitAuthorities[0].publicKey,
        }),
      ).to.eventually.be.rejectedWith(
        /Pre-authorization not found \(tokenAccount: .*, debitAuthority: .*\) \(rpc: http:\/\/127.0.0.1:8899\)/,
      );
    });

    it("should return 0 if the pad is paused", async () => {
      const stub = sandbox
        .stub(
          PreAuthorizedDebitReadClientImpl.prototype,
          "fetchPreAuthorization",
        )
        .returns(
          Promise.resolve({
            publicKey: new PublicKey(
              "3U1sFjpK35XCkRiWuFVb9Y3fxSwHgUBkntvyWDy4Jxx3",
            ),
            account: {
              paused: true,
            } as unknown as PreAuthorizationAccount,
          }),
        );
      const maxDebit = await readClient.fetchMaxDebitAmount({
        tokenAccount,
        debitAuthority: debitAuthorities[0].publicKey,
      });
      expect(maxDebit).to.equal(BigInt(0));
      expect(stub.calledOnce).to.equal(true);
    });

    it("should return 0 if activationDate > chain time", async () => {
      const stub = sandbox
        .stub(
          PreAuthorizedDebitReadClientImpl.prototype,
          "fetchPreAuthorization",
        )
        .returns(
          Promise.resolve({
            publicKey: new PublicKey(
              "3U1sFjpK35XCkRiWuFVb9Y3fxSwHgUBkntvyWDy4Jxx3",
            ),
            account: {
              paused: false,
              activationUnixTimestamp:
                Math.floor(new Date().getTime() / 1e3) + 10000,
            } as unknown as PreAuthorizationAccount,
          }),
        );
      const maxDebit = await readClient.fetchMaxDebitAmount({
        tokenAccount,
        debitAuthority: debitAuthorities[0].publicKey,
      });
      expect(maxDebit).to.equal(BigInt(0));
      expect(stub.calledOnce).to.equal(true);
    });

    it("should return expected amount for recurring pad", async () => {
      const maxDebit = await readClient.fetchMaxDebitAmount({
        tokenAccount,
        debitAuthority: debitAuthorities[0].publicKey,
      });
      expect(maxDebit).to.equal(BigInt(100));
    });

    it("should return expected amount for oneTime pad", async () => {
      const maxDebit = await readClient.fetchMaxDebitAmount({
        tokenAccount,
        debitAuthority: debitAuthorities[1].publicKey,
      });
      expect(maxDebit).to.equal(BigInt(100e6));
    });
  });

  context("fetchCurrentOwnerOfPreAuthTokenAccount", () => {
    const sandbox = createSandbox();

    afterEach(() => {
      sandbox.reset();
      sandbox.restore();
    });

    it("should throw NoPreAuthorizationFound", async () => {
      await expect(
        readClient.fetchCurrentOwnerOfPreAuthTokenAccount(
          new PublicKey("3U1sFjpK35XCkRiWuFVb9Y3fxSwHgUBkntvyWDy4Jxx3"),
        ),
      ).to.eventually.be.rejectedWith(
        "Pre-authorization not found (pubkey: 3U1sFjpK35XCkRiWuFVb9Y3fxSwHgUBkntvyWDy4Jxx3) (rpc: http://127.0.0.1:8899)",
      );
    });

    it("should call fetchCurrentOwnerOfTokenAccount", async () => {
      const stubbedTokenAccountOwner = Keypair.generate().publicKey;
      const fetchCurrentOwnerOfTokenAccountStub = sandbox
        .stub(
          PreAuthorizedDebitReadClientImpl.prototype,
          "fetchCurrentOwnerOfTokenAccount",
        )
        .resolves(stubbedTokenAccountOwner);
      const owner = await readClient.fetchCurrentOwnerOfPreAuthTokenAccount(
        preAuthorizations[0],
      );
      expect(owner.toString()).to.equal(stubbedTokenAccountOwner.toString());
      expect(fetchCurrentOwnerOfTokenAccountStub.calledOnce).to.be.equal(true);
    });
  });

  context("fetchCurrentOwnerOfTokenAccount", () => {
    it("should throw if tokenAccount does not exist", async () => {
      await expect(
        readClient.fetchCurrentOwnerOfTokenAccount(
          new PublicKey("3U1sFjpK35XCkRiWuFVb9Y3fxSwHgUBkntvyWDy4Jxx3"),
        ),
      ).to.eventually.be.rejected.and.be.an.instanceof(
        TokenAccountDoesNotExist,
      );
    });

    it("should return owner of token account", async () => {
      const owner =
        await readClient.fetchCurrentOwnerOfTokenAccount(tokenAccount);
      expect(owner.toString()).to.equal(provider.publicKey.toString());
    });
  });

  context("fetchTokenProgramIdForTokenAccount", () => {
    const sandbox = createSandbox();

    afterEach(() => {
      sandbox.reset();
      sandbox.restore();
    });

    it("should throw if the token account does not exist", async () => {
      await expect(
        readClient.fetchTokenProgramIdForTokenAccount(
          new PublicKey("3U1sFjpK35XCkRiWuFVb9Y3fxSwHgUBkntvyWDy4Jxx3"),
        ),
      ).to.eventually.be.rejectedWith(
        /Token account doesn't exist: 3U1sFjpK35XCkRiWuFVb9Y3fxSwHgUBkntvyWDy4Jxx3/,
      );
    });

    it("should throw if the token account has an unexpected programId as the owner", async () => {
      const getAccountInfoStub = sandbox
        .stub(Connection.prototype, "getAccountInfo")
        .resolves({
          owner: Keypair.generate().publicKey,
        } as unknown as AccountInfo<Buffer>);
      await expect(
        readClient.fetchTokenProgramIdForTokenAccount(
          new PublicKey("3U1sFjpK35XCkRiWuFVb9Y3fxSwHgUBkntvyWDy4Jxx3"),
        ),
      ).to.eventually.be.rejectedWith(
        /Token account doesn't exist: 3U1sFjpK35XCkRiWuFVb9Y3fxSwHgUBkntvyWDy4Jxx3/,
      );

      expect(getAccountInfoStub.calledOnce).to.equal(true);
    });

    it("should return the token account programId", async () => {
      const tokenAccountOwner =
        await readClient.fetchTokenProgramIdForTokenAccount(tokenAccount);
      expect(tokenAccountOwner.toString()).to.equal(
        TOKEN_PROGRAM_ID.toString(),
      );
    });
  });

  context("fetchCurrentDelegationOfTokenAccount", () => {
    it("should throw TokenAccountDoesNotExist", async () => {
      await expect(
        readClient.fetchCurrentDelegationOfTokenAccount(
          new PublicKey("3U1sFjpK35XCkRiWuFVb9Y3fxSwHgUBkntvyWDy4Jxx3"),
        ),
      ).to.eventually.be.rejected.and.be.an.instanceof(
        TokenAccountDoesNotExist,
      );
    });

    it("should return token account delegate and delegate amount", async () => {
      const delegateData =
        await readClient.fetchCurrentDelegationOfTokenAccount(tokenAccount);
      expect(delegateData?.delegate.toString()).to.equal(
        smartDelegate.toString(),
      );
      expect(delegateData?.delgatedAmount.toString()).to.equal(
        (BigInt(2) ** BigInt(64) - BigInt(1)).toString(),
      );
    });
  });

  context("fetchCurrentDelegationOfPreAuthTokenAccount", () => {
    const sandbox = createSandbox();

    afterEach(() => {
      sandbox.reset();
      sandbox.restore();
    });

    it("should throw NoPreAuthorizationFound", async () => {
      await expect(
        readClient.fetchCurrentDelegationOfPreAuthTokenAccount(
          new PublicKey("3U1sFjpK35XCkRiWuFVb9Y3fxSwHgUBkntvyWDy4Jxx3"),
        ),
      ).to.eventually.be.rejectedWith(
        /Pre-authorization not found \(pubkey: 3U1sFjpK35XCkRiWuFVb9Y3fxSwHgUBkntvyWDy4Jxx3\) \(rpc: http:\/\/127.0.0.1:8899\)/,
      );
    });

    it("should return delegate and delegated amount for pre authorization", async () => {
      const fetchCurrentDelegationOfTokenAccountSpy = sandbox.spy(
        PreAuthorizedDebitReadClientImpl.prototype,
        "fetchCurrentDelegationOfTokenAccount",
      );
      const delegateData =
        await readClient.fetchCurrentDelegationOfPreAuthTokenAccount(
          preAuthorizations[0],
        );
      expect(delegateData?.delegate.toString()).to.equal(
        smartDelegate.toString(),
      );
      expect(delegateData?.delgatedAmount.toString()).to.equal(
        (BigInt(2) ** BigInt(64) - BigInt(1)).toString(),
      );
      expect(fetchCurrentDelegationOfTokenAccountSpy.calledOnce).to.equal(true);
    });
  });
});
