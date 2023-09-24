import { InstructionFactoryImpl } from "../src/write/implementation";
import { Connection, Keypair, SystemProgram } from "@solana/web3.js";
import {
  InitOneTimePreAuthorizationParams,
  PreAuthorizedDebitReadClientImpl,
} from "../src";
import * as sdkConstants from "../src/constants";
import { expect } from "chai";
import { createSandbox } from "sinon";

describe.only("InstructionFactory Unit Tests", () => {
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
});
