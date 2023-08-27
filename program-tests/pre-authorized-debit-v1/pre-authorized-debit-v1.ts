import {
  setProvider,
  AnchorProvider,
  Program,
  workspace,
} from "@coral-xyz/anchor";
import { expect } from "chai";
import { PreAuthorizedDebitV1 } from "../../target/types/pre_authorized_debit_v1";

describe("pre-authorized-debit-v1", () => {
  // Configure the client to use the local cluster.
  setProvider(AnchorProvider.env());

  const program = workspace.SmartAccountV1 as Program<PreAuthorizedDebitV1>;
  const provider = program.provider as AnchorProvider;

  it("empty test", () => {
    expect(1).to.equal(1);
  });
});
