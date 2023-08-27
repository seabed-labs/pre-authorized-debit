import {
  setProvider,
  AnchorProvider,
  Program,
  workspace,
} from "@coral-xyz/anchor";
import { expect } from "chai";
import { SmartDelegateV1 } from "../../target/types/smart_delegate_v1";

describe("smart-delegate-v1", () => {
  // Configure the client to use the local cluster.
  setProvider(AnchorProvider.env());

  const program = workspace.SmartAccountV1 as Program<SmartDelegateV1>;
  const provider = program.provider as AnchorProvider;

  it("empty test", () => {
    expect(1).to.equal(1);
  });
});
