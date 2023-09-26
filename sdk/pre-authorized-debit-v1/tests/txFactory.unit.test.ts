import "./setup";
import { Connection } from "@solana/web3.js";
import { MAINNET_PAD_PROGRAM_ID, TransactionFactoryImpl } from "../src";
import { createSandbox } from "sinon";
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
      TransactionFactoryImpl.custom(connection, MAINNET_PAD_PROGRAM_ID);
    });

    it("mainnet", () => {
      TransactionFactoryImpl.mainnet(connection);
    });

    it("devnet", () => {
      TransactionFactoryImpl.devnet(connection);
    });
  });
});
