import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { localValidatorUrl } from "./constants";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { getProviderNodeWallet } from "./util";
import {
  IDL,
  MAINNET_PAD_PROGRAM_ID,
  PreAuthorizedDebitReadClientImpl,
  InstructionFactoryImpl,
  TransactionFactoryImpl,
} from "../src";
import { createSandbox } from "sinon";
import { expect } from "chai";
import {
  fundAccounts,
  initSmartDelegateIdempotent,
} from "@dcaf/pad-test-utils";
import {
  createAccount,
  createMint,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

describe("Transaction Factory Integration Tests", () => {
  const sandbox = createSandbox();

  const connection: Connection = new Connection(localValidatorUrl, "processed");
  const provider = new AnchorProvider(connection, getProviderNodeWallet(), {
    commitment: connection.commitment,
  });
  const program = new Program(IDL, MAINNET_PAD_PROGRAM_ID, provider);
  const readClient = PreAuthorizedDebitReadClientImpl.custom(
    connection,
    MAINNET_PAD_PROGRAM_ID,
  );
  const ixFactory = InstructionFactoryImpl.custom(
    connection,
    MAINNET_PAD_PROGRAM_ID,
    readClient,
  );
  const txFactory = TransactionFactoryImpl.custom(
    connection,
    MAINNET_PAD_PROGRAM_ID,
    readClient,
    ixFactory,
  );

  let mint: PublicKey, tokenAccount: PublicKey, smartDelegate: PublicKey;
  const payer: Keypair = Keypair.generate();
  const debitAuthorities: Keypair[] = [];
  const mintAuthority = new Keypair();
  for (let i = 0; i < 3; i++) {
    debitAuthorities.push(Keypair.generate());
  }
  const preAuthorizations: PublicKey[] = [];

  const activationUnixTimestamp = Math.floor(new Date().getTime() / 1e3) - 60; // -60 seconds from now
  const expirationUnixTimestamp = activationUnixTimestamp + 10 * 24 * 60 * 60; // +10 days from activation

  before(async () => {
    smartDelegate = await initSmartDelegateIdempotent(program, provider);
    const tx = await fundAccounts(provider, [payer.publicKey], 5000e6);
    await connection.confirmTransaction(tx);
    mint = await createMint(
      connection,
      payer,
      mintAuthority.publicKey,
      null,
      6,
      Keypair.generate(),
      undefined,
      TOKEN_PROGRAM_ID,
    );
    tokenAccount = await createAccount(
      provider.connection,
      payer,
      mint,
      provider.publicKey,
      Keypair.generate(),
      undefined,
      TOKEN_PROGRAM_ID,
    );
    await mintTo(connection, payer, mint, tokenAccount, mintAuthority, 1000e6);

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
                repeatFrequencySeconds: new BN(5),
                recurringAmountAuthorized: new BN(100),
                numCycles: null,
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

  afterEach(() => {
    sandbox.reset();
    sandbox.restore();
  });

  context("buildInitSmartDelegateTx", () => {
    it("should build tx", async () => {
      const spyBuildInitSmartDelegateIx = sandbox.spy(
        ixFactory,
        "buildInitSmartDelegateIx",
      );
      const params = {
        payer: payer.publicKey,
      };
      const tx = await txFactory.buildInitSmartDelegateTx(params);
      expect(tx.setupInstructions.length).to.equal(0);
      expect(tx.coreInstructions.length).to.equal(1);
      expect(tx.cleanupInstructions.length).to.equal(0);
      expect(spyBuildInitSmartDelegateIx.calledWith(params)).to.equal(true);
    });
  });

  context("buildApproveSmartDelegateTx", () => {
    it("should build and broadcast tx", async () => {
      const spyBuildApproveSmartDelegateTx = sandbox.spy(
        ixFactory,
        "buildApproveSmartDelegateIx",
      );
      const params = {
        tokenAccount,
      };
      const tx = await txFactory.buildApproveSmartDelegateTx(params);
      expect(tx.setupInstructions.length).to.equal(0);
      expect(tx.coreInstructions.length).to.equal(1);
      expect(tx.cleanupInstructions.length).to.equal(0);
      expect(spyBuildApproveSmartDelegateTx.calledWith(params)).to.equal(true);

      const versionedTx = await tx.buildVersionedTransaction(
        [payer],
        payer.publicKey,
      );
      await provider.sendAndConfirm(versionedTx);
    });
  });

  context("buildPausePreAuthorizationTx", () => {
    it("should build and broadcast tx", async () => {
      const spyBuildPausePreAuthorizationIx = sandbox.spy(
        ixFactory,
        "buildPausePreAuthorizationIx",
      );
      const params = {
        preAuthorization: preAuthorizations[0],
      };
      const tx = await txFactory.buildPausePreAuthorizationTx(params);
      expect(tx.setupInstructions.length).to.equal(0);
      expect(tx.coreInstructions.length).to.equal(1);
      expect(tx.cleanupInstructions.length).to.equal(0);
      expect(spyBuildPausePreAuthorizationIx.calledWith(params)).to.equal(true);

      const versionedTx = await tx.buildVersionedTransaction(
        [payer],
        payer.publicKey,
      );
      await provider.sendAndConfirm(versionedTx);
    });
  });

  context("buildUnpausePreAuthorizationTx", () => {
    it("should build and broadcast tx", async () => {
      const spyBuildUnpausePreAuthorizationIx = sandbox.spy(
        ixFactory,
        "buildUnpausePreAuthorizationIx",
      );
      const params = {
        preAuthorization: preAuthorizations[0],
      };
      const tx = await txFactory.buildUnpausePreAuthorizationTx(params);
      expect(tx.setupInstructions.length).to.equal(0);
      expect(tx.coreInstructions.length).to.equal(1);
      expect(tx.cleanupInstructions.length).to.equal(0);
      expect(spyBuildUnpausePreAuthorizationIx.calledWith(params)).to.equal(
        true,
      );

      const versionedTx = await tx.buildVersionedTransaction(
        [payer],
        payer.publicKey,
      );
      await provider.sendAndConfirm(versionedTx);
    });
  });

  context("buildClosePreAuthorization", () => {
    let newDebitAuthority: Keypair;
    let pad: PublicKey;

    beforeEach(async () => {
      newDebitAuthority = Keypair.generate();
      pad = readClient.derivePreAuthorizationPDA(
        tokenAccount,
        newDebitAuthority.publicKey,
      ).publicKey;
      await program.methods
        .initPreAuthorization({
          variant: {
            oneTime: {
              amountAuthorized: new BN(100e6),
              expiryUnixTimestamp: new BN(expirationUnixTimestamp),
            },
          },
          debitAuthority: newDebitAuthority.publicKey,
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
    });

    context("AsOwnerTx", () => {
      it("should build and broadcast tx", async () => {
        const spyBuildClosePreAuthorizationAsOwnerIx = sandbox.spy(
          ixFactory,
          "buildClosePreAuthorizationAsOwnerIx",
        );
        const params = {
          preAuthorization: pad,
        };
        const tx = await txFactory.buildClosePreAuthorizationAsOwnerTx(params);
        expect(tx.setupInstructions.length).to.equal(0);
        expect(tx.coreInstructions.length).to.equal(1);
        expect(tx.cleanupInstructions.length).to.equal(0);
        expect(
          spyBuildClosePreAuthorizationAsOwnerIx.calledWith(params),
        ).to.equal(true);

        const versionedTx = await tx.buildVersionedTransaction(
          [payer],
          payer.publicKey,
        );
        await provider.sendAndConfirm(versionedTx);
      });
    });

    context("AsDebitAuthorityTx", () => {
      it("should build and broadcast tx", async () => {
        const spyBuildClosePreAuthorizationAsDebitAuthorityIx = sandbox.spy(
          ixFactory,
          "buildClosePreAuthorizationAsDebitAuthorityIx",
        );
        const params = {
          preAuthorization: pad,
        };
        const tx =
          await txFactory.buildClosePreAuthorizationAsDebitAuthorityTx(params);
        expect(tx.setupInstructions.length).to.equal(0);
        expect(tx.coreInstructions.length).to.equal(1);
        expect(tx.cleanupInstructions.length).to.equal(0);
        expect(
          spyBuildClosePreAuthorizationAsDebitAuthorityIx.calledWith(params),
        ).to.equal(true);
        await tx.simulate([newDebitAuthority, payer], payer.publicKey);
        await tx.execute(
          undefined,
          [newDebitAuthority, payer],
          payer.publicKey,
        );

        const accountInfo = await connection.getAccountInfo(pad);
        expect(accountInfo).to.equal(null);
      });
    });

    context("buildInitOneTimePreAuthorizationTx", () => {
      it("should build and broadcast tx for non native token account", async () => {
        const spyBuildInitOneTimePreAuthorizationIx = sandbox.spy(
          ixFactory,
          "buildInitOneTimePreAuthorizationIx",
        );
        const params = {
          amountAuthorized: BigInt(100),
          payer: payer.publicKey,
          tokenAccount,
          debitAuthority: Keypair.generate().publicKey,
          activation: new Date(),
        };
        const tx = await txFactory.buildInitOneTimePreAuthorizationTx(params);
        expect(tx.setupInstructions.length).to.equal(0);
        expect(tx.coreInstructions.length).to.equal(1);
        expect(tx.cleanupInstructions.length).to.equal(0);
        expect(
          spyBuildInitOneTimePreAuthorizationIx.calledWith(params),
        ).to.equal(true);

        const versionedTx = await tx.buildVersionedTransaction(
          [payer],
          payer.publicKey,
        );
        await provider.sendAndConfirm(versionedTx);
      });
    });
  });
});
