import { InstructionFactoryImpl } from "../src/write/implementation";
import { Connection, Keypair, SystemProgram } from "@solana/web3.js";
import {
  InitOneTimePreAuthorizationParams,
  InitRecurringPreAuthorizationParams,
  PausePreAuthorizationParams,
  PreAuthorizedDebitReadClientImpl,
} from "../src";
import * as sdkConstants from "../src/constants";
import { expect } from "chai";
import { createSandbox } from "sinon";
import { BorshCoder } from "@coral-xyz/anchor";
import { IDL } from "@dcaf/pad-test-utils/pre_authorized_debit_v1";

describe("InstructionFactory Unit Tests", () => {
  const sandbox = createSandbox();

  const connection: Connection = new Connection("http://my.rpc");
  const readClient = PreAuthorizedDebitReadClientImpl.custom(
    connection,
    sdkConstants.MAINNET_PAD_PROGRAM_ID,
  );
  const instructionFactory = InstructionFactoryImpl.custom(
    connection,
    sdkConstants.MAINNET_PAD_PROGRAM_ID,
    readClient,
  );

  const coder = new BorshCoder(IDL);

  afterEach(() => {
    sandbox.reset();
    sandbox.restore();
  });

  context("buildInitSmartDelegateIx", () => {
    it("should build init smart delegate ix", async () => {
      const payer = Keypair.generate().publicKey;
      const ix = await instructionFactory.buildInitSmartDelegateIx({
        payer,
      });

      const smartDelegate = readClient.getSmartDelegatePDA().publicKey;
      expect(ix.instruction.keys.length).to.equal(3);

      expect(ix.instruction.keys[0].pubkey.toString()).to.equal(
        payer.toString(),
      );
      expect(ix.instruction.keys[0].isSigner).to.equal(true);
      expect(ix.instruction.keys[0].isWritable).to.equal(true);

      expect(ix.instruction.keys[1].pubkey.toString()).to.equal(
        smartDelegate.toString(),
      );
      expect(ix.instruction.keys[1].isSigner).to.equal(false);
      expect(ix.instruction.keys[1].isWritable).to.equal(true);

      expect(ix.instruction.keys[2].pubkey.toString()).to.equal(
        SystemProgram.programId.toString(),
      );
      expect(ix.instruction.keys[2].isSigner).to.equal(false);
      expect(ix.instruction.keys[2].isWritable).to.equal(false);

      expect(ix.expectedSigners.length).to.equal(1);
      expect(ix.expectedSigners[0].publicKey.toString()).to.equal(
        payer.toString(),
      );
      expect(ix.expectedSigners[0].reason).to.equal(
        "The 'payer' account needs to sign to pay for the creation of the smart delegate account",
      );

      expect(Object.keys(ix.meta).length).to.equal(1);
      expect(ix.meta.smartDelegate.toString()).to.equal(
        smartDelegate.toString(),
      );
    });
  });

  context("buildInitOneTimePreAuthorizationIx", () => {
    it("should build init pre authorization ix for oneTime pad", async () => {
      const params: InitOneTimePreAuthorizationParams = {
        activation: new Date(),
        amountAuthorized: BigInt(99),
        debitAuthority: Keypair.generate().publicKey,
        expiry: new Date(new Date().getTime() + 86400000), // one day from now
        payer: Keypair.generate().publicKey,
        tokenAccount: Keypair.generate().publicKey,
      };
      const smartDelegate = readClient.getSmartDelegatePDA();
      const mockTokenAccountOwner = Keypair.generate().publicKey;
      const mockTokenProgramId = Keypair.generate().publicKey;
      const preAuthorization = readClient.derivePreAuthorizationPDA(
        params.tokenAccount,
        params.debitAuthority,
      ).publicKey;

      const stubFetchCurrentOwnerOfTokenAccount = sandbox
        .stub(readClient, "fetchCurrentOwnerOfTokenAccount")
        .resolves(mockTokenAccountOwner);
      const stubFetchTokenProgramIdForTokenAccount = sandbox
        .stub(readClient, "fetchTokenProgramIdForTokenAccount")
        .resolves(mockTokenProgramId);

      const ix =
        await instructionFactory.buildInitOneTimePreAuthorizationIx(params);

      const ixData =
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        (coder.instruction.decode(ix.instruction.data)?.data as any).params;
      expect(Object.keys(ixData).length).to.equal(3);
      expect(ixData.debitAuthority.toString()).to.equal(
        params.debitAuthority.toString(),
      );
      expect(ixData.activationUnixTimestamp.toString()).to.equal(
        Math.floor(params.activation.getTime() / 1e3).toString(),
      );
      expect(ixData.variant.oneTime.amountAuthorized.toString()).to.equal(
        params.amountAuthorized.toString(),
      );
      expect(ixData.variant.oneTime.expiryUnixTimestamp.toString()).to.equal(
        Math.floor(params.expiry!.getTime() / 1e3).toString(),
      );

      expect(ix.instruction.keys[0].pubkey.toString()).to.equal(
        params.payer.toString(),
      );
      expect(ix.instruction.keys[0].isSigner).to.equal(true);
      expect(ix.instruction.keys[0].isWritable).to.equal(true);

      expect(ix.instruction.keys[1].pubkey.toString()).to.equal(
        mockTokenAccountOwner.toString(),
      );
      expect(ix.instruction.keys[1].isSigner).to.equal(true);
      expect(ix.instruction.keys[1].isWritable).to.equal(false);

      expect(ix.instruction.keys[2].pubkey.toString()).to.equal(
        smartDelegate.publicKey.toString(),
      );
      expect(ix.instruction.keys[2].isSigner).to.equal(false);
      expect(ix.instruction.keys[2].isWritable).to.equal(false);

      expect(ix.instruction.keys[3].pubkey.toString()).to.equal(
        params.tokenAccount.toString(),
      );
      expect(ix.instruction.keys[3].isSigner).to.equal(false);
      expect(ix.instruction.keys[3].isWritable).to.equal(true);

      expect(ix.instruction.keys[4].pubkey.toString()).to.equal(
        preAuthorization.toString(),
      );
      expect(ix.instruction.keys[4].isSigner).to.equal(false);
      expect(ix.instruction.keys[4].isWritable).to.equal(true);

      expect(ix.instruction.keys[5].pubkey.toString()).to.equal(
        mockTokenProgramId.toString(),
      );
      expect(ix.instruction.keys[5].isSigner).to.equal(false);
      expect(ix.instruction.keys[5].isWritable).to.equal(false);

      expect(ix.instruction.keys[6].pubkey.toString()).to.equal(
        SystemProgram.programId.toString(),
      );
      expect(ix.instruction.keys[6].isSigner).to.equal(false);
      expect(ix.instruction.keys[6].isWritable).to.equal(false);

      expect(ix.expectedSigners.length).to.equal(2);
      expect(ix.expectedSigners[0].publicKey.toString()).to.equal(
        params.payer.toString(),
      );
      expect(ix.expectedSigners[0].reason).to.equal(
        "The 'payer' account needs to sign to pay for the creation of the pre-authorization account",
      );
      expect(ix.expectedSigners[1].publicKey.toString()).to.equal(
        mockTokenAccountOwner.toString(),
      );
      expect(ix.expectedSigners[1].reason).to.equal(
        "The 'owner' (i.e. token account's owner) needs to sign to create a pre-authorization for a token account",
      );

      expect(Object.keys(ix.meta).length).to.equal(1);
      expect(ix.meta.preAuthorization.toString()).to.equal(
        preAuthorization.toString(),
      );

      expect(
        stubFetchCurrentOwnerOfTokenAccount.calledOnceWith(params.tokenAccount),
      ).to.equal(true);
      expect(
        stubFetchTokenProgramIdForTokenAccount.calledOnceWith(
          params.tokenAccount,
        ),
      ).to.equal(true);
    });
  });

  context("buildInitRecurringPreAuthorizationIx", () => {
    it("should build init pre authorization ix for recurring pad", async () => {
      const params: InitRecurringPreAuthorizationParams = {
        payer: Keypair.generate().publicKey,
        tokenAccount: Keypair.generate().publicKey,
        debitAuthority: Keypair.generate().publicKey,
        activation: new Date(),
        repeatFrequencySeconds: BigInt(60),
        recurringAmountAuthorized: BigInt(99),
        resetEveryCycle: false,
        numCycles: null,
      };
      const smartDelegate = readClient.getSmartDelegatePDA();
      const mockTokenAccountOwner = Keypair.generate().publicKey;
      const mockTokenProgramId = Keypair.generate().publicKey;
      const preAuthorization = readClient.derivePreAuthorizationPDA(
        params.tokenAccount,
        params.debitAuthority,
      ).publicKey;

      const stubFetchCurrentOwnerOfTokenAccount = sandbox
        .stub(readClient, "fetchCurrentOwnerOfTokenAccount")
        .resolves(mockTokenAccountOwner);
      const stubFetchTokenProgramIdForTokenAccount = sandbox
        .stub(readClient, "fetchTokenProgramIdForTokenAccount")
        .resolves(mockTokenProgramId);

      const ix =
        await instructionFactory.buildInitRecurringPreAuthorizationIx(params);

      const ixData =
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        (coder.instruction.decode(ix.instruction.data)?.data as any).params;
      expect(Object.keys(ixData).length).to.equal(3);
      expect(ixData.debitAuthority.toString()).to.equal(
        params.debitAuthority.toString(),
      );
      expect(ixData.activationUnixTimestamp.toString()).to.equal(
        Math.floor(params.activation.getTime() / 1e3).toString(),
      );
      expect(
        ixData.variant.recurring.repeatFrequencySeconds.toString(),
      ).to.equal(params.repeatFrequencySeconds.toString());
      expect(ixData.variant.recurring.resetEveryCycle).to.equal(false);
      expect(
        ixData.variant.recurring.recurringAmountAuthorized.toString(),
      ).to.equal(params.recurringAmountAuthorized.toString());
      expect(ixData.variant.recurring.numCycles).to.equal(null);

      expect(ix.instruction.keys[0].pubkey.toString()).to.equal(
        params.payer.toString(),
      );
      expect(ix.instruction.keys[0].isSigner).to.equal(true);
      expect(ix.instruction.keys[0].isWritable).to.equal(true);

      expect(ix.instruction.keys[1].pubkey.toString()).to.equal(
        mockTokenAccountOwner.toString(),
      );
      expect(ix.instruction.keys[1].isSigner).to.equal(true);
      expect(ix.instruction.keys[1].isWritable).to.equal(false);

      expect(ix.instruction.keys[2].pubkey.toString()).to.equal(
        smartDelegate.publicKey.toString(),
      );
      expect(ix.instruction.keys[2].isSigner).to.equal(false);
      expect(ix.instruction.keys[2].isWritable).to.equal(false);

      expect(ix.instruction.keys[3].pubkey.toString()).to.equal(
        params.tokenAccount.toString(),
      );
      expect(ix.instruction.keys[3].isSigner).to.equal(false);
      expect(ix.instruction.keys[3].isWritable).to.equal(true);

      expect(ix.instruction.keys[4].pubkey.toString()).to.equal(
        preAuthorization.toString(),
      );
      expect(ix.instruction.keys[4].isSigner).to.equal(false);
      expect(ix.instruction.keys[4].isWritable).to.equal(true);

      expect(ix.instruction.keys[5].pubkey.toString()).to.equal(
        mockTokenProgramId.toString(),
      );
      expect(ix.instruction.keys[5].isSigner).to.equal(false);
      expect(ix.instruction.keys[5].isWritable).to.equal(false);

      expect(ix.instruction.keys[6].pubkey.toString()).to.equal(
        SystemProgram.programId.toString(),
      );
      expect(ix.instruction.keys[6].isSigner).to.equal(false);
      expect(ix.instruction.keys[6].isWritable).to.equal(false);

      expect(ix.expectedSigners.length).to.equal(2);
      expect(ix.expectedSigners[0].publicKey.toString()).to.equal(
        params.payer.toString(),
      );
      expect(ix.expectedSigners[0].reason).to.equal(
        "The 'payer' account needs to sign to pay for the creation of the pre-authorization account",
      );
      expect(ix.expectedSigners[1].publicKey.toString()).to.equal(
        mockTokenAccountOwner.toString(),
      );
      expect(ix.expectedSigners[1].reason).to.equal(
        "The 'owner' (i.e. token account's owner) needs to sign to create a pre-authorization for a token account",
      );

      expect(Object.keys(ix.meta).length).to.equal(1);
      expect(ix.meta.preAuthorization.toString()).to.equal(
        preAuthorization.toString(),
      );

      expect(
        stubFetchCurrentOwnerOfTokenAccount.calledOnceWith(params.tokenAccount),
      ).to.equal(true);
      expect(
        stubFetchTokenProgramIdForTokenAccount.calledOnceWith(
          params.tokenAccount,
        ),
      ).to.equal(true);
    });
  });

  context("buildPausePreAuthorizationIx", () => {
    it("should build updatePausePreAuthorization and pause pad", async () => {
      const mockTokenAccount = Keypair.generate().publicKey;
      const mockTokenAccountOwner = Keypair.generate().publicKey;
      const mockDebitAuthority = Keypair.generate().publicKey;
      const preAuthorization = readClient.derivePreAuthorizationPDA(
        mockTokenAccount,
        mockDebitAuthority,
      ).publicKey;

      const params: PausePreAuthorizationParams = {
        preAuthorization,
      };
      const mockPreAuthorization = {
        publicKey: preAuthorization,
        account: {
          tokenAccount: mockTokenAccount,
        },
      };

      const stubFetchPreAuthorization = sandbox
        .stub(readClient, "fetchPreAuthorization")
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        .resolves(mockPreAuthorization as any);
      const stubFetchCurrentOwnerOfPreAuthTokenAccount = sandbox
        .stub(readClient, "fetchCurrentOwnerOfPreAuthTokenAccount")
        .resolves(mockTokenAccountOwner);

      const ix = await instructionFactory.buildPausePreAuthorizationIx(params);

      const ixData =
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        (coder.instruction.decode(ix.instruction.data)?.data as any).params;
      expect(Object.keys(ixData).length).to.equal(1);
      expect(ixData.pause).to.equal(true);

      expect(ix.instruction.keys[0].pubkey.toString()).to.equal(
        mockTokenAccountOwner.toString(),
      );
      expect(ix.instruction.keys[0].isSigner).to.equal(true);
      expect(ix.instruction.keys[0].isWritable).to.equal(false);

      expect(ix.instruction.keys[1].pubkey.toString()).to.equal(
        mockTokenAccount.toString(),
      );
      expect(ix.instruction.keys[1].isSigner).to.equal(false);
      expect(ix.instruction.keys[1].isWritable).to.equal(false);

      expect(ix.instruction.keys[2].pubkey.toString()).to.equal(
        preAuthorization.toString(),
      );
      expect(ix.instruction.keys[2].isSigner).to.equal(false);
      expect(ix.instruction.keys[2].isWritable).to.equal(true);

      expect(ix.expectedSigners.length).to.equal(1);
      expect(ix.expectedSigners[0].publicKey.toString()).to.equal(
        mockTokenAccountOwner.toString(),
      );
      expect(ix.expectedSigners[0].reason).to.equal(
        "The pre-authorization's token account's owner needs to sign to pause it",
      );

      expect(ix.meta).to.equal(undefined);

      expect(
        stubFetchPreAuthorization.calledOnceWith({
          publicKey: preAuthorization,
        }),
      ).to.equal(true);
      expect(
        stubFetchCurrentOwnerOfPreAuthTokenAccount.calledOnceWith(
          preAuthorization,
        ),
      ).to.equal(true);
    });
  });

  context("buildUnpausePreAuthorizationIx", () => {
    it("should build updatePausePreAuthorization and unpause pad", async () => {
      const mockTokenAccount = Keypair.generate().publicKey;
      const mockTokenAccountOwner = Keypair.generate().publicKey;
      const mockDebitAuthority = Keypair.generate().publicKey;
      const preAuthorization = readClient.derivePreAuthorizationPDA(
        mockTokenAccount,
        mockDebitAuthority,
      ).publicKey;

      const params: PausePreAuthorizationParams = {
        preAuthorization,
      };
      const mockPreAuthorization = {
        publicKey: preAuthorization,
        account: {
          tokenAccount: mockTokenAccount,
        },
      };

      const stubFetchPreAuthorization = sandbox
        .stub(readClient, "fetchPreAuthorization")
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        .resolves(mockPreAuthorization as any);
      const stubFetchCurrentOwnerOfPreAuthTokenAccount = sandbox
        .stub(readClient, "fetchCurrentOwnerOfPreAuthTokenAccount")
        .resolves(mockTokenAccountOwner);

      const ix =
        await instructionFactory.buildUnpausePreAuthorizationIx(params);

      const ixData =
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        (coder.instruction.decode(ix.instruction.data)?.data as any).params;
      expect(Object.keys(ixData).length).to.equal(1);
      expect(ixData.pause).to.equal(false);

      expect(ix.instruction.keys[0].pubkey.toString()).to.equal(
        mockTokenAccountOwner.toString(),
      );
      expect(ix.instruction.keys[0].isSigner).to.equal(true);
      expect(ix.instruction.keys[0].isWritable).to.equal(false);

      expect(ix.instruction.keys[1].pubkey.toString()).to.equal(
        mockTokenAccount.toString(),
      );
      expect(ix.instruction.keys[1].isSigner).to.equal(false);
      expect(ix.instruction.keys[1].isWritable).to.equal(false);

      expect(ix.instruction.keys[2].pubkey.toString()).to.equal(
        preAuthorization.toString(),
      );
      expect(ix.instruction.keys[2].isSigner).to.equal(false);
      expect(ix.instruction.keys[2].isWritable).to.equal(true);

      expect(ix.expectedSigners.length).to.equal(1);
      expect(ix.expectedSigners[0].publicKey.toString()).to.equal(
        mockTokenAccountOwner.toString(),
      );
      expect(ix.expectedSigners[0].reason).to.equal(
        "The pre-authorization's token account's owner needs to sign to unpause it",
      );

      expect(ix.meta).to.equal(undefined);

      expect(
        stubFetchPreAuthorization.calledOnceWith({
          publicKey: preAuthorization,
        }),
      ).to.equal(true);
      expect(
        stubFetchCurrentOwnerOfPreAuthTokenAccount.calledOnceWith(
          preAuthorization,
        ),
      ).to.equal(true);
    });
  });

  context("buildClosePreAuthorizationAsOwnerIx", () => {
    it("should build buildClosePreAuthorizationAsOwnerIx", async () => {
      const mockTokenAccount = Keypair.generate().publicKey;
      const mockRentReceiver = Keypair.generate().publicKey;
      const mockTokenAccountOwner = Keypair.generate().publicKey;
      const mockDebitAuthority = Keypair.generate().publicKey;
      const preAuthorization = readClient.derivePreAuthorizationPDA(
        mockTokenAccount,
        mockDebitAuthority,
      ).publicKey;

      const mockPreAuthorization = {
        publicKey: preAuthorization,
        account: {
          tokenAccount: mockTokenAccount,
          debitAuthority: mockDebitAuthority,
        },
      };
      const stubFetchPreAuthorization = sandbox
        .stub(readClient, "fetchPreAuthorization")
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        .resolves(mockPreAuthorization as any);
      const stubFetchCurrentOwnerOfPreAuthTokenAccount = sandbox
        .stub(readClient, "fetchCurrentOwnerOfPreAuthTokenAccount")
        .resolves(mockTokenAccountOwner);

      const ix = await instructionFactory.buildClosePreAuthorizationAsOwnerIx({
        preAuthorization,
        rentReceiver: mockRentReceiver,
      });

      const ixData = coder.instruction.decode(ix.instruction.data);
      expect(Object.keys(ixData!.data).length).to.equal(0);

      expect(ix.instruction.keys[0].pubkey.toString()).to.equal(
        mockRentReceiver.toString(),
      );
      expect(ix.instruction.keys[0].isSigner).to.equal(false);
      expect(ix.instruction.keys[0].isWritable).to.equal(true);

      expect(ix.instruction.keys[1].pubkey.toString()).to.equal(
        mockTokenAccountOwner.toString(),
      );
      expect(ix.instruction.keys[1].isSigner).to.equal(true);
      expect(ix.instruction.keys[1].isWritable).to.equal(false);

      expect(ix.instruction.keys[2].pubkey.toString()).to.equal(
        mockTokenAccount.toString(),
      );
      expect(ix.instruction.keys[2].isSigner).to.equal(false);
      expect(ix.instruction.keys[2].isWritable).to.equal(false);

      expect(ix.instruction.keys[3].pubkey.toString()).to.equal(
        preAuthorization.toString(),
      );
      expect(ix.instruction.keys[3].isSigner).to.equal(false);
      expect(ix.instruction.keys[3].isWritable).to.equal(true);

      expect(ix.expectedSigners.length).to.equal(1);
      expect(ix.expectedSigners[0].publicKey.toString()).to.equal(
        mockTokenAccountOwner.toString(),
      );
      expect(ix.expectedSigners[0].reason).to.equal(
        "The pre-authorization's token account's owner needs to sign to close it",
      );

      expect(ix.meta).to.equal(undefined);

      expect(
        stubFetchPreAuthorization.calledOnceWith({
          publicKey: preAuthorization,
        }),
      ).to.equal(true);
      expect(
        stubFetchCurrentOwnerOfPreAuthTokenAccount.calledOnceWith(
          preAuthorization,
        ),
      ).to.equal(true);
    });
  });

  context("buildClosePreAuthorizationAsDebitAuthorityIx", () => {
    it("should build buildClosePreAuthorizationAsDebitAuthorityIx", async () => {
      const mockTokenAccount = Keypair.generate().publicKey;
      const mockTokenAccountOwner = Keypair.generate().publicKey;
      const mockDebitAuthority = Keypair.generate().publicKey;
      const preAuthorization = readClient.derivePreAuthorizationPDA(
        mockTokenAccount,
        mockDebitAuthority,
      ).publicKey;

      const mockPreAuthorization = {
        publicKey: preAuthorization,
        account: {
          tokenAccount: mockTokenAccount,
          debitAuthority: mockDebitAuthority,
        },
      };
      const stubFetchPreAuthorization = sandbox
        .stub(readClient, "fetchPreAuthorization")
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        .resolves(mockPreAuthorization as any);
      const stubFetchCurrentOwnerOfPreAuthTokenAccount = sandbox
        .stub(readClient, "fetchCurrentOwnerOfPreAuthTokenAccount")
        .resolves(mockTokenAccountOwner);

      const ix =
        await instructionFactory.buildClosePreAuthorizationAsDebitAuthorityIx({
          preAuthorization,
        });

      const ixData = coder.instruction.decode(ix.instruction.data);
      expect(Object.keys(ixData!.data).length).to.equal(0);

      expect(ix.instruction.keys[0].pubkey.toString()).to.equal(
        mockTokenAccountOwner.toString(),
      );
      expect(ix.instruction.keys[0].isSigner).to.equal(false);
      expect(ix.instruction.keys[0].isWritable).to.equal(true);

      expect(ix.instruction.keys[1].pubkey.toString()).to.equal(
        mockDebitAuthority.toString(),
      );
      expect(ix.instruction.keys[1].isSigner).to.equal(true);
      expect(ix.instruction.keys[1].isWritable).to.equal(false);

      expect(ix.instruction.keys[2].pubkey.toString()).to.equal(
        mockTokenAccount.toString(),
      );
      expect(ix.instruction.keys[2].isSigner).to.equal(false);
      expect(ix.instruction.keys[2].isWritable).to.equal(false);

      expect(ix.instruction.keys[3].pubkey.toString()).to.equal(
        preAuthorization.toString(),
      );
      expect(ix.instruction.keys[3].isSigner).to.equal(false);
      expect(ix.instruction.keys[3].isWritable).to.equal(true);

      expect(ix.expectedSigners.length).to.equal(1);
      expect(ix.expectedSigners[0].publicKey.toString()).to.equal(
        mockDebitAuthority.toString(),
      );
      expect(ix.expectedSigners[0].reason).to.equal(
        "The pre-authorization's debit authority needs to sign to close it",
      );

      expect(ix.meta).to.equal(undefined);

      expect(
        stubFetchPreAuthorization.calledOnceWith({
          publicKey: preAuthorization,
        }),
      ).to.equal(true);
      expect(
        stubFetchCurrentOwnerOfPreAuthTokenAccount.calledOnceWith(
          preAuthorization,
        ),
      ).to.equal(true);
    });
  });

  context("buildDebitIx", () => {
    it("should throw if smart delegate is not token account delegate", async () => {});

    it("should throw if token account delegated mount is less than requested debit amount", async () => {});

    it("should build debit instruction", async () => {});
  });
});
