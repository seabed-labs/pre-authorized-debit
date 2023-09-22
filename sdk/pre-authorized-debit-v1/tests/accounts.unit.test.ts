import {
  computePreAuthorizationCurrentCycle,
  PreAuthorizationVariantRecurring,
} from "../src";
import { expect } from "chai";

describe("PreAuthorizedDebitReadClientImpl unit", () => {
  context("computePreAuthorizationCurrentCycle", () => {
    const testCases: {
      chainTime: bigint;
      activationTime: bigint;
      repeatFrequency: bigint;
      expectedRes: bigint;
    }[] = [
      {
        chainTime: BigInt(100),
        activationTime: BigInt(100),
        repeatFrequency: BigInt(1),
        expectedRes: BigInt(1),
      },
      {
        chainTime: BigInt(101),
        activationTime: BigInt(100),
        repeatFrequency: BigInt(1),
        expectedRes: BigInt(2),
      },
      {
        chainTime: BigInt(102),
        activationTime: BigInt(100),
        repeatFrequency: BigInt(1),
        expectedRes: BigInt(3),
      },
      {
        chainTime: BigInt(98),
        activationTime: BigInt(0),
        repeatFrequency: BigInt(33),
        expectedRes: BigInt(3),
      },
      {
        chainTime: BigInt(100),
        activationTime: BigInt(0),
        repeatFrequency: BigInt(33),
        expectedRes: BigInt(4),
      },
      {
        chainTime: BigInt(100),
        activationTime: BigInt(-100),
        repeatFrequency: BigInt(33),
        expectedRes: BigInt(7),
      },
    ];

    testCases.forEach((testCase, testCaseNumber) => {
      it(`test case ${testCaseNumber}`, () => {
        const cycle = computePreAuthorizationCurrentCycle(testCase.chainTime, {
          activationUnixTimestamp: testCase.activationTime,
          variant: {
            repeatFrequencySeconds: testCase.repeatFrequency,
          } as unknown as PreAuthorizationVariantRecurring,
        });
        expect(cycle).to.equal(testCase.expectedRes);
      });
    });
  });
});
