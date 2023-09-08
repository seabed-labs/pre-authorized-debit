// This file was automatically generated. DO NOT MODIFY DIRECTLY.
export type CustomError =
  | PreAuthorizationNotActive
  | CannotDebitMoreThanAvailable
  | LastDebitedCycleBeforeCurrentCycle
  | CannotChangePreAuthorizationVariant
  | PreAuthorizationPaused
  | OnlyTokenAccountOwnerCanReceiveClosePreAuthFunds
  | PreAuthorizationTokenAccountMismatch
  | PreAuthorizationCloseUnauthorized
  | SmartDelegateCloseUnauthorized
  | SmartDelegateTokenAccountMismatch
  | DebitUnauthorized
  | InitPreAuthorizationUnauthorized
  | InitSmartDelegateUnauthorized
  | PausePreAuthorizationUnauthorized;

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
      "6002: Last debited cycle is after current debited cycle (invalid state)"
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

export class OnlyTokenAccountOwnerCanReceiveClosePreAuthFunds extends Error {
  static readonly code = 6005;
  readonly code = 6005;
  readonly name = "OnlyTokenAccountOwnerCanReceiveClosePreAuthFunds";
  readonly msg =
    "Only token account owner can receive funds from closing pre-authorization account";

  constructor(readonly logs?: string[]) {
    super(
      "6005: Only token account owner can receive funds from closing pre-authorization account"
    );
  }
}

export class PreAuthorizationTokenAccountMismatch extends Error {
  static readonly code = 6006;
  readonly code = 6006;
  readonly name = "PreAuthorizationTokenAccountMismatch";
  readonly msg = "Pre-authorization and token account mismatch";

  constructor(readonly logs?: string[]) {
    super("6006: Pre-authorization and token account mismatch");
  }
}

export class PreAuthorizationCloseUnauthorized extends Error {
  static readonly code = 6007;
  readonly code = 6007;
  readonly name = "PreAuthorizationCloseUnauthorized";
  readonly msg =
    "Pre-authorization can only be closed by debit_authority or token_account.owner";

  constructor(readonly logs?: string[]) {
    super(
      "6007: Pre-authorization can only be closed by debit_authority or token_account.owner"
    );
  }
}

export class SmartDelegateCloseUnauthorized extends Error {
  static readonly code = 6008;
  readonly code = 6008;
  readonly name = "SmartDelegateCloseUnauthorized";
  readonly msg = "Smart delegate can only be closed by token account owner";

  constructor(readonly logs?: string[]) {
    super("6008: Smart delegate can only be closed by token account owner");
  }
}

export class SmartDelegateTokenAccountMismatch extends Error {
  static readonly code = 6009;
  readonly code = 6009;
  readonly name = "SmartDelegateTokenAccountMismatch";
  readonly msg = "Smart delegate and token account mismatch";

  constructor(readonly logs?: string[]) {
    super("6009: Smart delegate and token account mismatch");
  }
}

export class DebitUnauthorized extends Error {
  static readonly code = 6010;
  readonly code = 6010;
  readonly name = "DebitUnauthorized";
  readonly msg =
    "Only pre_authorization.debit_authority is authorized to debit funds using pre-authorizations";

  constructor(readonly logs?: string[]) {
    super(
      "6010: Only pre_authorization.debit_authority is authorized to debit funds using pre-authorizations"
    );
  }
}

export class InitPreAuthorizationUnauthorized extends Error {
  static readonly code = 6011;
  readonly code = 6011;
  readonly name = "InitPreAuthorizationUnauthorized";
  readonly msg = "Only token account owner can initialize a pre-authorization";

  constructor(readonly logs?: string[]) {
    super("6011: Only token account owner can initialize a pre-authorization");
  }
}

export class InitSmartDelegateUnauthorized extends Error {
  static readonly code = 6012;
  readonly code = 6012;
  readonly name = "InitSmartDelegateUnauthorized";
  readonly msg = "Only token account owner can initialize a smart delegate";

  constructor(readonly logs?: string[]) {
    super("6012: Only token account owner can initialize a smart delegate");
  }
}

export class PausePreAuthorizationUnauthorized extends Error {
  static readonly code = 6013;
  readonly code = 6013;
  readonly name = "PausePreAuthorizationUnauthorized";
  readonly msg = "Only token account owner can pause a pre-authorization";

  constructor(readonly logs?: string[]) {
    super("6013: Only token account owner can pause a pre-authorization");
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
    case 6005:
      return new OnlyTokenAccountOwnerCanReceiveClosePreAuthFunds(logs);
    case 6006:
      return new PreAuthorizationTokenAccountMismatch(logs);
    case 6007:
      return new PreAuthorizationCloseUnauthorized(logs);
    case 6008:
      return new SmartDelegateCloseUnauthorized(logs);
    case 6009:
      return new SmartDelegateTokenAccountMismatch(logs);
    case 6010:
      return new DebitUnauthorized(logs);
    case 6011:
      return new InitPreAuthorizationUnauthorized(logs);
    case 6012:
      return new InitSmartDelegateUnauthorized(logs);
    case 6013:
      return new PausePreAuthorizationUnauthorized(logs);
  }

  return null;
}
