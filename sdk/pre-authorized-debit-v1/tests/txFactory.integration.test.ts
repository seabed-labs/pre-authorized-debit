import "./setup";
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
  DebitParams,
  UnwrapNativeMintAdditionalParams,
  InitRecurringPreAuthorizationParams,
  WrapNativeMintAdditionalParams,
  InitOneTimePreAuthorizationParams,
} from "../src";
import { createSandbox } from "sinon";
import { expect } from "chai";
import {
  fundAccounts,
  initSmartDelegateIdempotent,
} from "@seabed-labs/pad-test-utils";
import {
  createAccount,
  createMint,
  createWrappedNativeAccount,
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

  context("buildInitRecurringPreAuthorizationTx", () => {
    it("should build and broadcast tx", async () => {
      const user = Keypair.generate();
      const spyBuildInitRecurringPreAuthorizationIx = sandbox.spy(
        ixFactory,
        "buildInitRecurringPreAuthorizationIx",
      );
      const nativeTokenAccount = await createWrappedNativeAccount(
        connection,
        payer,
        user.publicKey,
        100e6,
      );
      const params: InitRecurringPreAuthorizationParams &
        WrapNativeMintAdditionalParams = {
        payer: payer.publicKey,
        tokenAccount: nativeTokenAccount,
        debitAuthority: Keypair.generate().publicKey,
        activation: new Date(),
        repeatFrequencySeconds: BigInt(5),
        recurringAmountAuthorized: BigInt(100),
        numCycles: null,
        resetEveryCycle: false,
        wrapNativeMintParams: {
          lamportsSourceAccount: payer.publicKey,
          wrapLamportsAmount: BigInt(100),
        },
      };
      const tx = await txFactory.buildInitRecurringPreAuthorizationTx(params);
      expect(tx.setupInstructions.length).to.equal(2);
      expect(tx.coreInstructions.length).to.equal(1);
      expect(tx.cleanupInstructions.length).to.equal(0);
      expect(
        spyBuildInitRecurringPreAuthorizationIx.calledWith(params),
      ).to.equal(true);

      await tx.execute(undefined, [payer, user], payer.publicKey);
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
      expect(spyBuildInitOneTimePreAuthorizationIx.calledWith(params)).to.equal(
        true,
      );

      const versionedTx = await tx.buildVersionedTransaction(
        [payer],
        payer.publicKey,
      );
      await provider.sendAndConfirm(versionedTx);
    });

    it("should build and broadcast tx for native mint", async () => {
      const spyBuildInitOneTimePreAuthorizationIx = sandbox.spy(
        ixFactory,
        "buildInitOneTimePreAuthorizationIx",
      );
      const nativeTokenAccount = await createWrappedNativeAccount(
        connection,
        payer,
        provider.publicKey,
        100e6,
      );
      const params = {
        payer: payer.publicKey,
        tokenAccount: nativeTokenAccount,
        debitAuthority: Keypair.generate().publicKey,
        activation: new Date(),
        amountAuthorized: BigInt(100),
        wrapNativeMintParams: {
          lamportsSourceAccount: payer.publicKey,
          wrapLamportsAmount: BigInt(100e6),
        },
      };
      const tx = await txFactory.buildInitOneTimePreAuthorizationTx(params);
      expect(tx.setupInstructions.length).to.equal(2);
      expect(tx.coreInstructions.length).to.equal(1);
      expect(tx.cleanupInstructions.length).to.equal(0);
      expect(spyBuildInitOneTimePreAuthorizationIx.calledWith(params)).to.equal(
        true,
      );

      const versionedTx = await tx.buildVersionedTransaction(
        [payer],
        payer.publicKey,
      );
      await provider.sendAndConfirm(versionedTx);
    });
  });

  context("buildDebitTx", () => {
    let destinationTokenAccount: PublicKey;

    before(async () => {
      destinationTokenAccount = await createAccount(
        connection,
        payer,
        mint,
        debitAuthorities[0].publicKey,
      );
    });

    it("should throw if smart delegate is not delegate", async () => {
      const stubFetchCurrentDelegationOfTokenAccount = sandbox
        .stub(readClient, "fetchCurrentDelegationOfTokenAccount")
        .resolves({
          delegate: Keypair.generate().publicKey,
          delegatedAmount: BigInt(100),
        });

      const params = {
        preAuthorization: preAuthorizations[0],
        amount: BigInt(10),
        destinationTokenAccount,
        checkSmartDelegateEnabled: true,
      };
      await expect(
        txFactory.buildDebitTx(params),
      ).to.eventually.be.rejectedWith(
        `The smart delegate is not set for token account: ${tokenAccount.toString()} (rpc: http://127.0.0.1:8899)`,
      );

      expect(
        stubFetchCurrentDelegationOfTokenAccount.calledOnceWith(
          sandbox.match((val) => {
            return (val as PublicKey).equals(tokenAccount);
          }),
        ),
      ).to.equal(true);
    });

    it("should build and broadcast tx", async () => {
      const spyBuildDebitIx = sandbox.spy(ixFactory, "buildDebitIx");
      const params: DebitParams & UnwrapNativeMintAdditionalParams = {
        preAuthorization: preAuthorizations[0],
        amount: BigInt(10),
        destinationTokenAccount,
        checkSmartDelegateEnabled: true,
      };
      const tx = await txFactory.buildDebitTx(params);
      expect(tx.setupInstructions.length).to.equal(0);
      expect(tx.coreInstructions.length).to.equal(1);
      expect(tx.cleanupInstructions.length).to.equal(0);
      expect(spyBuildDebitIx.calledWith(params)).to.equal(true);

      await tx.execute(
        undefined,
        [payer, debitAuthorities[0]],
        payer.publicKey,
      );
    });

    it("should debit native mint token account", async () => {
      // two day in the past
      const activation = new Date(
        new Date().getTime() - 1000 * 60 * 60 * 24 * 2,
      );
      // two day in the future
      const expiry = new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 2);
      const user = Keypair.generate();
      const debitAuthority = Keypair.generate();
      const [userNativeTokenAccount, debitNativeTokenAccount] =
        await Promise.all([
          createWrappedNativeAccount(connection, payer, user.publicKey, 100e6),
          createWrappedNativeAccount(
            connection,
            payer,
            debitAuthority.publicKey,
            100e6,
          ),
        ]);
      const initPreAuthParams: InitOneTimePreAuthorizationParams &
        WrapNativeMintAdditionalParams = {
        payer: payer.publicKey,
        tokenAccount: userNativeTokenAccount,
        debitAuthority: debitAuthority.publicKey,
        activation,
        expiry,
        amountAuthorized: BigInt(10e6),
        wrapNativeMintParams: {
          lamportsSourceAccount: payer.publicKey,
          wrapLamportsAmount: BigInt(100),
        },
      };
      const initPreAuthTx =
        await txFactory.buildInitOneTimePreAuthorizationTx(initPreAuthParams);
      await initPreAuthTx.execute(undefined, [payer, user], payer.publicKey);

      const spyBuildDebitIx = sandbox.spy(ixFactory, "buildDebitIx");
      const params: DebitParams & UnwrapNativeMintAdditionalParams = {
        preAuthorization: initPreAuthTx.meta.preAuthorization,
        amount: BigInt(10e6),
        destinationTokenAccount: debitNativeTokenAccount,
        checkSmartDelegateEnabled: true,
        unwrapNativeMintParams: {
          lamportsDestinationAccount: debitAuthority.publicKey,
        },
      };
      const tx = await txFactory.buildDebitTx(params);
      expect(tx.setupInstructions.length).to.equal(0);
      expect(tx.coreInstructions.length).to.equal(1);
      expect(tx.cleanupInstructions.length).to.equal(1);
      expect(spyBuildDebitIx.calledWith(params)).to.equal(true);
      await tx.execute(undefined, [payer, debitAuthority], payer.publicKey);
    });
  });
});
