import { expect } from "chai";
import { Connection, PublicKey } from "@solana/web3.js";
import { PreAuthorizedDebitReadClientImpl } from "../src";

describe("PreAuthorizedDebitReadClientImpl", () => {
  const connection: Connection = new Connection("http://my.rpc");
  const readClient = PreAuthorizedDebitReadClientImpl.mainnet(connection);

  it("should get smart delegate pda", () => {
    const smartDelegatePDA = readClient.getSmartDelegatePDA();
    expect(smartDelegatePDA.publicKey.toString()).to.equal(
      "5xwfb7dPwdbgnMFABbF9mqYaD79ocSngiR9GMSY9Tfzb",
    );
    expect(smartDelegatePDA.bump).to.equal(255);
  });

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
