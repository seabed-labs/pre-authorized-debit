import { expect } from "chai";
import { dateToUnixTimestamp } from "../src/utils";

describe("Utils Unit Tests", () => {
  context("dateToUnixTimestamp", () => {
    it("should return timestamp rounded down", () => {
      expect(dateToUnixTimestamp(new Date(1300), true)).to.equal(1);
    });

    it("should return timestamp rounded up", () => {
      expect(dateToUnixTimestamp(new Date(1500), false)).to.equal(2);
    });
  });
});
