import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";
import { PreAuthorizedDebitV1 } from "../../target/types/pre_authorized_debit_v1";

describe("pre-authorized-debit-v1", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace
    .SmartAccountV1 as anchor.Program<PreAuthorizedDebitV1>;

  it("empty test", () => {
    expect(1).to.equal(1);
  });
});
