import { expect } from "chai";
import { randomFunctionToTestCodeCoverage } from "../src";

describe("example test", () => {
  it("should pass", () => {
    expect(randomFunctionToTestCodeCoverage().toString()).to.equal("2");
  });
});
