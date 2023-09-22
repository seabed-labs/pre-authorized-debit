import { InstructionFactoryImpl } from "../src/write/implementation";
import { Connection, Keypair, SystemProgram } from "@solana/web3.js";
import { PreAuthorizedDebitReadClientImpl } from "../src";
import * as sdkConstants from "../src/constants";
import { expect } from "chai";

describe("InstructionFactory Unit Tests", () => {
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
});
