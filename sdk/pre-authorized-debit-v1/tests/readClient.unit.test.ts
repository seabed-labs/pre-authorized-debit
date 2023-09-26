import { expect } from "chai";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { PreAuthorizedDebitReadClientImpl } from "../src";
import * as sdkConstants from "../src/constants";
import { deriveSmartDelegate } from "@dcaf/pad-test-utils";

describe("PreAuthorizedDebitReadClientImpl unit", () => {
  const connection: Connection = new Connection("http://my.rpc");
  const readClient = PreAuthorizedDebitReadClientImpl.custom(
    connection,
    sdkConstants.MAINNET_PAD_PROGRAM_ID,
  );

  context("getSmartDelegatePDA", () => {
    it("should get smart delegate pda", () => {
      const smartDelegatePDA = readClient.getSmartDelegatePDA();
      expect(smartDelegatePDA.publicKey.toString()).to.equal(
        "5xwfb7dPwdbgnMFABbF9mqYaD79ocSngiR9GMSY9Tfzb",
      );
      expect(smartDelegatePDA.bump).to.equal(255);
    });
  });

  context("derivePreAuthorizationPDA", () => {
    it("should derive a pre authorization pda", () => {
      const preAuthorizationPda = readClient.derivePreAuthorizationPDA(
        new PublicKey("HFRSGsKeknoTHT6VUjMznUKFgfcm6zgCFp8ZcvoikSDY"),
        new PublicKey("5wvaw2sZ1LC23xXDN3ZApc9USWUxQA28EALiCkeCgU8J"),
      );
      expect(preAuthorizationPda.publicKey.toString()).to.equal(
        "67fJXpgrtSRn5VbRq4hucpdYsvcbEDyCTwj7LBHopYio",
      );
      expect(preAuthorizationPda.bump).to.equal(255);
    });
  });

  context("custom", () => {
    it("should use the custom program with the custom constructor", () => {
      const newProgramId = new Keypair().publicKey;
      const client = PreAuthorizedDebitReadClientImpl.custom(
        connection,
        newProgramId,
      );
      expect(client.getSmartDelegatePDA().publicKey.toString()).to.equal(
        deriveSmartDelegate(newProgramId)[0].toString(),
      );
    });
  });
});
