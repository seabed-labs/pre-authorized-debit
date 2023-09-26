import { InstructionWithMetadata } from "./shared";
import {
  ApproveSmartDelegateParams,
  ApproveSmartDelegateResult,
  ClosePreAuthorizationAsDebitAuthorityParams,
  ClosePreAuthorizationAsDebitAuthorityResult,
  ClosePreAuthorizationAsOwnerParams,
  ClosePreAuthorizationAsOwnerResult,
  DebitParams,
  DebitResult,
  InitOneTimePreAuthorizationParams,
  InitOneTimePreAuthorizationResult,
  InitRecurringPreAuthorizationParams,
  InitRecurringPreAuthorizationResult,
  InitSmartDelegateParams,
  InitSmartDelegateResult,
  PausePreAuthorizationParams,
  PausePreAuthorizationResult,
  UnpausePreAuthorizationParams,
  UnpausePreAuthorizationResult,
} from "./params";

type IxFactoryFn<Params, Result> = (
  params: Params,
) => Promise<InstructionWithMetadata<Result>>;

export interface InstructionFactory {
  buildInitSmartDelegateIx: IxFactoryFn<
    InitSmartDelegateParams,
    InitSmartDelegateResult
  >;

  buildInitOneTimePreAuthorizationIx: IxFactoryFn<
    InitOneTimePreAuthorizationParams,
    InitOneTimePreAuthorizationResult
  >;

  buildInitRecurringPreAuthorizationIx: IxFactoryFn<
    InitRecurringPreAuthorizationParams,
    InitRecurringPreAuthorizationResult
  >;

  buildPausePreAuthorizationIx: IxFactoryFn<
    PausePreAuthorizationParams,
    PausePreAuthorizationResult
  >;

  buildUnpausePreAuthorizationIx: IxFactoryFn<
    UnpausePreAuthorizationParams,
    UnpausePreAuthorizationResult
  >;

  buildClosePreAuthorizationAsOwnerIx: IxFactoryFn<
    ClosePreAuthorizationAsOwnerParams,
    ClosePreAuthorizationAsOwnerResult
  >;

  buildClosePreAuthorizationAsDebitAuthorityIx: IxFactoryFn<
    ClosePreAuthorizationAsDebitAuthorityParams,
    ClosePreAuthorizationAsDebitAuthorityResult
  >;

  buildDebitIx: IxFactoryFn<DebitParams, DebitResult>;

  // sets delegate to smartDelegate and amount to u64::max
  buildApproveSmartDelegateIx: IxFactoryFn<
    ApproveSmartDelegateParams,
    ApproveSmartDelegateResult
  >;
}
