import {
  assertsIsRecurringPreAuthorizationAccount,
  computeAvailableAmountForRecurringDebit,
  computePreAuthorizationCurrentCycle,
  isOneTimePreAuthorizationAccount,
  isRecurringPreAuthorizationAccount,
  PreAuthorizationAccount,
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

  context("isOneTimePreAuthorizationAccount", () => {
    it("should return true", () => {
      expect(
        isOneTimePreAuthorizationAccount({
          variant: { type: "oneTime" },
        } as unknown as PreAuthorizationAccount),
      ).to.equal(true);
    });

    it("should return false", () => {
      expect(
        isOneTimePreAuthorizationAccount({
          variant: { type: "recurring" },
        } as unknown as PreAuthorizationAccount),
      ).to.equal(false);
    });
  });

  context("isRecurringPreAuthorizationAccount", () => {
    it("should return true", () => {
      expect(
        isRecurringPreAuthorizationAccount({
          variant: { type: "recurring" },
        } as unknown as PreAuthorizationAccount),
      ).to.equal(true);
    });

    it("should return false", () => {
      expect(
        isRecurringPreAuthorizationAccount({
          variant: { type: "oneTime" },
        } as unknown as PreAuthorizationAccount),
      ).to.equal(false);
    });
  });

  context("assertsIsRecurringPreAuthorizationAccount", () => {
    it("should assert true", () => {
      assertsIsRecurringPreAuthorizationAccount({
        variant: { type: "recurring" },
      } as unknown as PreAuthorizationAccount);
    });

    it("should throw", () => {
      expect(() => {
        assertsIsRecurringPreAuthorizationAccount({
          variant: { type: "oneTime" },
        } as unknown as PreAuthorizationAccount);
      }).to.throw("Invalid variant oneTime");
    });
  });

  context("computeAvailableAmountForRecurringDebit", () => {
    const testCases: {
      currentCycle: bigint;
      preAuthorizationVariant: {
        lastDebitedCycle: bigint;
        resetEveryCycle: boolean;
        recurringAmountAuthorized: bigint;
        amountDebitedLastCycle: bigint;
        amountDebitedTotal: bigint;
      };
      expectedRes: bigint;
    }[] = [
      {
        currentCycle: BigInt(1),
        preAuthorizationVariant: {
          lastDebitedCycle: BigInt(1),
          resetEveryCycle: false,
          recurringAmountAuthorized: BigInt(0),
          amountDebitedLastCycle: BigInt(0),
          amountDebitedTotal: BigInt(0),
        },
        expectedRes: BigInt(0),
      },
      {
        currentCycle: BigInt(1),
        preAuthorizationVariant: {
          lastDebitedCycle: BigInt(1),
          resetEveryCycle: false,
          recurringAmountAuthorized: BigInt(100),
          amountDebitedLastCycle: BigInt(0),
          amountDebitedTotal: BigInt(0),
        },
        expectedRes: BigInt(100),
      },
      {
        currentCycle: BigInt(5),
        preAuthorizationVariant: {
          lastDebitedCycle: BigInt(5),
          resetEveryCycle: false,
          recurringAmountAuthorized: BigInt(100),
          amountDebitedLastCycle: BigInt(0),
          amountDebitedTotal: BigInt(100),
        },
        expectedRes: BigInt(400),
      },
      {
        currentCycle: BigInt(1),
        preAuthorizationVariant: {
          lastDebitedCycle: BigInt(1),
          resetEveryCycle: true,
          recurringAmountAuthorized: BigInt(0),
          amountDebitedLastCycle: BigInt(0),
          amountDebitedTotal: BigInt(0),
        },
        expectedRes: BigInt(0),
      },
      {
        currentCycle: BigInt(1),
        preAuthorizationVariant: {
          lastDebitedCycle: BigInt(1),
          resetEveryCycle: true,
          recurringAmountAuthorized: BigInt(100),
          amountDebitedLastCycle: BigInt(0),
          amountDebitedTotal: BigInt(0),
        },
        expectedRes: BigInt(100),
      },
      {
        currentCycle: BigInt(5),
        preAuthorizationVariant: {
          lastDebitedCycle: BigInt(5),
          resetEveryCycle: true,
          recurringAmountAuthorized: BigInt(100),
          amountDebitedLastCycle: BigInt(0),
          amountDebitedTotal: BigInt(100),
        },
        expectedRes: BigInt(100),
      },
      {
        currentCycle: BigInt(0),
        preAuthorizationVariant: {
          lastDebitedCycle: BigInt(1),
          resetEveryCycle: true,
          recurringAmountAuthorized: BigInt(0),
          amountDebitedLastCycle: BigInt(0),
          amountDebitedTotal: BigInt(0),
        },
        expectedRes: BigInt(0),
      },
    ];

    testCases.forEach((testCase, testCaseNumber) => {
      it(`test case ${testCaseNumber}`, () => {
        const cycle = computeAvailableAmountForRecurringDebit(
          testCase.currentCycle,
          testCase.preAuthorizationVariant,
        );
        expect(cycle).to.equal(testCase.expectedRes);
      });
    });
  });
});
