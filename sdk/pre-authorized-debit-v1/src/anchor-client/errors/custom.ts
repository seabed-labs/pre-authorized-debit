// This file was automatically generated. DO NOT MODIFY DIRECTLY.
export type CustomError =
  | PreAuthorizationNotActive
  | CannotDebitMoreThanAvailable
  | LastDebitedCycleBeforeCurrentCycle
  | CannotChangePreAuthorizationVariant
  | PreAuthorizationPaused;

export class PreAuthorizationNotActive extends Error {
  static readonly code = 6000;
  readonly code = 6000;
  readonly name = "PreAuthorizationNotActive";
  readonly msg = "Pre-Authorization not active";

  constructor(readonly logs?: string[]) {
    super("6000: Pre-Authorization not active");
  }
}

export class CannotDebitMoreThanAvailable extends Error {
  static readonly code = 6001;
  readonly code = 6001;
  readonly name = "CannotDebitMoreThanAvailable";
  readonly msg = "Cannot debit more than authorized";

  constructor(readonly logs?: string[]) {
    super("6001: Cannot debit more than authorized");
  }
}

export class LastDebitedCycleBeforeCurrentCycle extends Error {
  static readonly code = 6002;
  readonly code = 6002;
  readonly name = "LastDebitedCycleBeforeCurrentCycle";
  readonly msg =
    "Last debited cycle is after current debited cycle (invalid state)";

  constructor(readonly logs?: string[]) {
    super(
      "6002: Last debited cycle is after current debited cycle (invalid state)",
    );
  }
}

export class CannotChangePreAuthorizationVariant extends Error {
  static readonly code = 6003;
  readonly code = 6003;
  readonly name = "CannotChangePreAuthorizationVariant";
  readonly msg = "Cannot change pre-authorization variant";

  constructor(readonly logs?: string[]) {
    super("6003: Cannot change pre-authorization variant");
  }
}

export class PreAuthorizationPaused extends Error {
  static readonly code = 6004;
  readonly code = 6004;
  readonly name = "PreAuthorizationPaused";
  readonly msg = "Pre-Authorization paused";

  constructor(readonly logs?: string[]) {
    super("6004: Pre-Authorization paused");
  }
}

export function fromCode(code: number, logs?: string[]): CustomError | null {
  switch (code) {
    case 6000:
      return new PreAuthorizationNotActive(logs);
    case 6001:
      return new CannotDebitMoreThanAvailable(logs);
    case 6002:
      return new LastDebitedCycleBeforeCurrentCycle(logs);
    case 6003:
      return new CannotChangePreAuthorizationVariant(logs);
    case 6004:
      return new PreAuthorizationPaused(logs);
  }

  return null;
}
