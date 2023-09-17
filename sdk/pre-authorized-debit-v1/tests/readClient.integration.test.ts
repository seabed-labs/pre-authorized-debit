import { expect } from "chai";
import axios from "axios";
import { Connection } from "@solana/web3.js";
import { localValidatorUrl } from "./constants";
import { PreAuthorizedDebitReadClientImpl } from "../src";

describe("PreAuthorizedDebitReadClientImpl", () => {
  xit("should fetch health from solana", async () => {
    const res = await axios({
      method: "get",
      url: "http://127.0.0.1:8899/health",
    });
    console.log(res.status);
    expect(res.status).to.equal(200);
  });

  const connection: Connection = new Connection(localValidatorUrl);
  const readClient = PreAuthorizedDebitReadClientImpl.mainnet(connection);

  xit("should be able to fetch the on chain idl", async () => {
    const idl = await readClient.fetchIdl();
    expect(idl).to.not.equal(null);
  });
});
