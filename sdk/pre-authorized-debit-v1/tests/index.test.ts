import { expect } from "chai";
import { randomFunctionToTestCodeCoverage } from "../src";
import axios from "axios";

describe("example test", () => {
  it("should pass", () => {
    expect(randomFunctionToTestCodeCoverage().toString()).to.equal("2");
  });
  it("should fetch health from solana", async () => {
    const res = await axios({
      method: "get",
      url: "http://127.0.0.1:8899/health",
    });
    console.log(res.status);
    expect(res.status).to.equal(200);
  });
});
