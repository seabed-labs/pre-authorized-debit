import { expect } from "chai";
import { Connection } from "@solana/web3.js";
import { devnetValidatorUrl, mainnetValidatorUrl } from "./constants";
import { PreAuthorizedDebitReadClientImpl } from "../src";
import idlJson from "./fixtures/pre_authorized_debit_v1.json";

describe("PreAuthorizedDebitReadClientImpl e2e", () => {
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  const idlWithoutMetadata: any = {
    ...idlJson,
  };
  delete idlWithoutMetadata.metadata;

  it("should be able to fetch onchain idl from devnet", async () => {
    const connection: Connection = new Connection(devnetValidatorUrl);
    const readClient = PreAuthorizedDebitReadClientImpl.devnet(connection);
    const idl = await readClient.fetchIdlFromChain();
    expect(idl).to.not.equal(null);
    expect(idl).to.deep.equal(idlWithoutMetadata);
  });
  it("should be able to fetch onchain idl from mainnet", async () => {
    const connection: Connection = new Connection(mainnetValidatorUrl);
    const readClient = PreAuthorizedDebitReadClientImpl.mainnet(connection);
    const idl = await readClient.fetchIdlFromChain();
    expect(idl).to.not.equal(null);
    expect(idl).to.deep.equal(idlWithoutMetadata);
  });
});
