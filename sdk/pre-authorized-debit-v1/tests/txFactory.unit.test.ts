import "./setup";
import { Connection } from "@solana/web3.js";
import { MAINNET_PAD_PROGRAM_ID, TransactionFactoryImpl } from "../src";
import { createSandbox } from "sinon";
import { expect } from "chai";
describe("Transaction Factory Integration Tests", () => {
  const sandbox = createSandbox();
  const connection: Connection = new Connection(
    "https://my.rpc.url",
    "processed",
  );

  afterEach(() => {
    sandbox.reset();
    sandbox.restore();
  });

  context("constructor", () => {
    it("custom", () => {
      expect(
        TransactionFactoryImpl.custom(connection, MAINNET_PAD_PROGRAM_ID),
      ).to.not.equal(null);
    });

    it("mainnet", () => {
      expect(TransactionFactoryImpl.mainnet(connection)).to.not.equal(null);
    });

    it("devnet", () => {
      expect(TransactionFactoryImpl.devnet(connection)).to.not.equal(null);
    });
  });
});
